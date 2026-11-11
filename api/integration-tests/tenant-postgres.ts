import assert from "node:assert/strict";
import { createHash, randomBytes, randomUUID } from "node:crypto";

const databaseUrl = process.env.TEST_DATABASE_URL;
if (!databaseUrl) {
  throw new Error("TEST_DATABASE_URL must point to a dedicated PostgreSQL test database");
}

process.env.DATABASE_URL = databaseUrl;
process.env.DATABASE_POOL_MAX = "1";

const [{ db }, { withTenantTransaction }, schema, { eq }, { default: app }] =
  await Promise.all([
  import("../src/db"),
  import("../src/db/tenant"),
  import("../src/db/schema"),
  import("drizzle-orm"),
  import("../src/app"),
]);
const adminClient = (await import("postgres")).default(databaseUrl, { max: 1 });

function hasDatabaseErrorCode(error: unknown, code: string): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }
  if ("code" in error && error.code === code) {
    return true;
  }
  return "cause" in error && hasDatabaseErrorCode(error.cause, code);
}

try {
  const [role] = await adminClient`
    SELECT rolsuper, rolbypassrls
    FROM pg_roles
    WHERE rolname = current_user
  `;
  assert.equal(role?.rolsuper, false, "integration tests must not use a superuser");
  assert.equal(role?.rolbypassrls, false, "integration tests must not bypass RLS");

  const suffix = randomUUID();
  const [companyA] = await db
    .insert(schema.companies)
    .values({ name: `tenant-a-${suffix}` })
    .returning({ id: schema.companies.id });
  const [companyB] = await db
    .insert(schema.companies)
    .values({ name: `tenant-b-${suffix}` })
    .returning({ id: schema.companies.id });
  assert.ok(companyA && companyB);

  const [vehicleA] = await withTenantTransaction(companyA.id, (transaction) =>
    transaction
      .insert(schema.vehicles)
      .values({
        companyId: companyA.id,
        plate: "TST1A01",
        make: "Test",
        model: "Tenant A",
        year: 2026,
      })
      .returning({ id: schema.vehicles.id }),
  );
  const [vehicleB] = await withTenantTransaction(companyB.id, (transaction) =>
    transaction
      .insert(schema.vehicles)
      .values({
        companyId: companyB.id,
        plate: "TST1A02",
        make: "Test",
        model: "Tenant B",
        year: 2026,
      })
      .returning({ id: schema.vehicles.id }),
  );
  assert.ok(vehicleA && vehicleB);

  const [driverA] = await withTenantTransaction(companyA.id, (transaction) =>
    transaction
      .insert(schema.drivers)
      .values({
        companyId: companyA.id,
        fullName: "Integration Driver",
        cpf: `${Math.floor(10_000_000_000 + Math.random() * 89_999_999_999)}`,
        licenseNumber: "12345678901",
        licenseCategory: "B",
        licenseExpiresAt: "2030-01-01",
      })
      .returning({ id: schema.drivers.id }),
  );
  assert.ok(driverA);

  const [maintenanceA] = await withTenantTransaction(companyA.id, (transaction) =>
    transaction
      .insert(schema.maintenanceOrders)
      .values({
        companyId: companyA.id,
        vehicleId: vehicleA.id,
        description: "Tenant A inspection",
      })
      .returning({ id: schema.maintenanceOrders.id }),
  );
  const [costA] = await withTenantTransaction(companyA.id, (transaction) =>
    transaction
      .insert(schema.fleetCosts)
      .values({
        companyId: companyA.id,
        vehicleId: vehicleA.id,
        category: "fuel",
        description: "Tenant A fuel",
        amountCents: 500,
        occurredAt: "2026-11-08",
      })
      .returning({ id: schema.fleetCosts.id }),
  );
  assert.ok(maintenanceA && costA);

  const visibleToA = await withTenantTransaction(companyA.id, (transaction) =>
    transaction.select({ id: schema.vehicles.id }).from(schema.vehicles),
  );
  assert.deepEqual(visibleToA.map(({ id }) => id), [vehicleA.id]);

  const visibleDriversToB = await withTenantTransaction(companyB.id, (transaction) =>
    transaction.select({ id: schema.drivers.id }).from(schema.drivers),
  );
  assert.deepEqual(visibleDriversToB, []);
  assert.deepEqual(
    await withTenantTransaction(companyB.id, (transaction) =>
      transaction.select({ id: schema.maintenanceOrders.id }).from(schema.maintenanceOrders),
    ),
    [],
  );
  assert.deepEqual(
    await withTenantTransaction(companyB.id, (transaction) =>
      transaction.select({ id: schema.fleetCosts.id }).from(schema.fleetCosts),
    ),
    [],
  );

  const crossTenantUpdate = await withTenantTransaction(companyA.id, (transaction) =>
    transaction
      .update(schema.vehicles)
      .set({ model: "Unauthorized update" })
      .where(eq(schema.vehicles.id, vehicleB.id))
      .returning({ id: schema.vehicles.id }),
  );
  assert.deepEqual(crossTenantUpdate, []);

  const crossTenantDelete = await withTenantTransaction(companyA.id, (transaction) =>
    transaction
      .delete(schema.vehicles)
      .where(eq(schema.vehicles.id, vehicleB.id))
      .returning({ id: schema.vehicles.id }),
  );
  assert.deepEqual(crossTenantDelete, []);

  await assert.rejects(
    withTenantTransaction(companyA.id, (transaction) =>
      transaction.insert(schema.vehicles).values({
        companyId: companyB.id,
        plate: "TST1A03",
        make: "Test",
        model: "Cross-tenant",
        year: 2026,
      }),
    ),
    (error: unknown) => hasDatabaseErrorCode(error, "42501"),
  );

  await assert.rejects(
    withTenantTransaction(companyA.id, (transaction) =>
      transaction.insert(schema.maintenanceOrders).values({
        companyId: companyA.id,
        vehicleId: vehicleB.id,
        description: "Cross-tenant maintenance",
      }),
    ),
    (error: unknown) => hasDatabaseErrorCode(error, "23503"),
  );

  await assert.rejects(
    withTenantTransaction(companyA.id, (transaction) =>
      transaction.insert(schema.fleetCosts).values({
        companyId: companyA.id,
        vehicleId: vehicleB.id,
        category: "fuel",
        description: "Cross-tenant cost",
        amountCents: 500,
        occurredAt: "2026-11-08",
      }),
    ),
    (error: unknown) => hasDatabaseErrorCode(error, "23503"),
  );

  const visibleWithoutTenant = await db
    .select({ id: schema.vehicles.id })
    .from(schema.vehicles);
  assert.deepEqual(visibleWithoutTenant, [], "transaction-local tenant context must not leak");
  assert.deepEqual(
    await db.select({ id: schema.drivers.id }).from(schema.drivers),
    [],
    "driver RLS must fail closed without tenant context",
  );
  assert.deepEqual(
    await db.select({ id: schema.fleetCosts.id }).from(schema.fleetCosts),
    [],
    "cost RLS must fail closed without tenant context",
  );
  assert.deepEqual(
    await withTenantTransaction(companyA.id, (transaction) =>
      transaction.select({ id: schema.maintenanceOrders.id }).from(schema.maintenanceOrders),
    ),
    [{ id: maintenanceA.id }],
  );
  assert.deepEqual(
    await withTenantTransaction(companyA.id, (transaction) =>
      transaction.select({ id: schema.fleetCosts.id }).from(schema.fleetCosts),
    ),
    [{ id: costA.id }],
  );

  async function createSession(
    companyId: number,
    email: string,
    readOnly: boolean,
  ): Promise<string> {
    const [user] = await db
      .insert(schema.authUsers)
      .values({
        companyId,
        email,
        companyName: `tenant-${companyId}`,
        passwordHash: "integration-session-only",
        readOnly,
      })
      .returning({ id: schema.authUsers.id });
    assert.ok(user);
    const token = randomBytes(32).toString("hex");
    await db.insert(schema.authSessions).values({
      userId: user.id,
      tokenHash: createHash("sha256").update(token).digest("hex"),
      expiresAt: new Date(Date.now() + 60_000),
    });
    return token;
  }

  function authenticatedRequest(
    path: string,
    token: string,
    method = "GET",
    body?: unknown,
  ): Request {
    const headers = new Headers({ Cookie: `fleetmonitor_session=${token}` });
    if (body !== undefined) {
      headers.set("Content-Type", "application/json");
    }
    return new Request(`http://localhost${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  const writerTokenA = await createSession(
    companyA.id,
    `writer-a-${suffix}@integration.test`,
    false,
  );
  const readOnlyTokenA = await createSession(
    companyA.id,
    `readonly-a-${suffix}@integration.test`,
    true,
  );
  const writerTokenB = await createSession(
    companyB.id,
    `writer-b-${suffix}@integration.test`,
    false,
  );

  const maintenanceListResponse = await app.fetch(
    authenticatedRequest("/maintenance", writerTokenA),
  );
  assert.equal(maintenanceListResponse.status, 200);
  assert.deepEqual(
    ((await maintenanceListResponse.json()) as { items: { id: number }[] }).items.map(
      ({ id }) => id,
    ),
    [maintenanceA.id],
  );

  const filteredCostsResponse = await app.fetch(
    authenticatedRequest("/costs?category=fuel", writerTokenA),
  );
  assert.equal(filteredCostsResponse.status, 200);
  assert.deepEqual(
    ((await filteredCostsResponse.json()) as { items: { id: number }[] }).items.map(
      ({ id }) => id,
    ),
    [costA.id],
  );

  const createdMaintenanceResponse = await app.fetch(
    authenticatedRequest("/maintenance", writerTokenA, "POST", {
      vehicleId: vehicleA.id,
      description: "API-created inspection",
      status: "scheduled",
      scheduledAt: "2026-11-09",
      completedAt: null,
      costCents: 0,
    }),
  );
  assert.equal(createdMaintenanceResponse.status, 201);
  const createdMaintenance = (await createdMaintenanceResponse.json()) as { id: number };

  const updatedMaintenanceResponse = await app.fetch(
    authenticatedRequest(
      `/maintenance/${createdMaintenance.id}`,
      writerTokenA,
      "PUT",
      {
        vehicleId: vehicleA.id,
        description: "API-updated inspection",
        status: "completed",
        scheduledAt: "2026-11-09",
        completedAt: "2026-11-10",
        costCents: 7500,
      },
    ),
  );
  assert.equal(updatedMaintenanceResponse.status, 200);

  const createdCostResponse = await app.fetch(
    authenticatedRequest("/costs", writerTokenA, "POST", {
      vehicleId: vehicleA.id,
      category: "toll",
      description: "API-created toll",
      amountCents: 250,
      occurredAt: "2026-11-09",
    }),
  );
  assert.equal(createdCostResponse.status, 201);
  const createdCost = (await createdCostResponse.json()) as { id: number };

  for (const request of [
    authenticatedRequest("/maintenance", readOnlyTokenA, "POST", {
      vehicleId: vehicleA.id,
      description: "Read-only write attempt",
    }),
    authenticatedRequest(`/maintenance/${createdMaintenance.id}`, readOnlyTokenA, "PUT", {
      vehicleId: vehicleA.id,
      description: "Read-only update attempt",
    }),
    authenticatedRequest("/costs", readOnlyTokenA, "POST", {
      vehicleId: vehicleA.id,
      category: "fuel",
      description: "Read-only write attempt",
      amountCents: 100,
      occurredAt: "2026-11-09",
    }),
  ]) {
    assert.equal((await app.fetch(request)).status, 403);
  }

  for (const path of ["/maintenance", "/costs"]) {
    assert.equal(
      (await app.fetch(
        authenticatedRequest(
          path,
          writerTokenA,
          "POST",
          path === "/maintenance"
            ? {
                vehicleId: vehicleB.id,
                description: "Cross-company API attempt",
              }
            : {
                vehicleId: vehicleB.id,
                category: "fuel",
                description: "Cross-company API attempt",
                amountCents: 100,
                occurredAt: "2026-11-09",
              },
        ),
      )).status,
      400,
    );
  }

  for (const path of ["/maintenance", "/costs"]) {
    const response = await app.fetch(authenticatedRequest(path, writerTokenB));
    assert.equal(response.status, 200);
    assert.deepEqual((await response.json() as { items: unknown[] }).items, []);
  }

  const vehicleDeleteWithHistory = await app.fetch(
    authenticatedRequest(`/vehicles/${vehicleA.id}`, writerTokenA, "DELETE"),
  );
  assert.equal(vehicleDeleteWithHistory.status, 409);

  const visibleToB = await withTenantTransaction(companyB.id, (transaction) =>
    transaction.select({ id: schema.vehicles.id }).from(schema.vehicles),
  );
  assert.deepEqual(visibleToB.map(({ id }) => id), [vehicleB.id]);

  await withTenantTransaction(companyA.id, (transaction) =>
    transaction.delete(schema.maintenanceOrders).where(eq(schema.maintenanceOrders.companyId, companyA.id)),
  );
  await withTenantTransaction(companyA.id, (transaction) =>
    transaction.delete(schema.fleetCosts).where(eq(schema.fleetCosts.companyId, companyA.id)),
  );
  await withTenantTransaction(companyA.id, (transaction) =>
    transaction.delete(schema.vehicles).where(eq(schema.vehicles.id, vehicleA.id)),
  );
  await withTenantTransaction(companyB.id, (transaction) =>
    transaction.delete(schema.vehicles).where(eq(schema.vehicles.id, vehicleB.id)),
  );
  await withTenantTransaction(companyA.id, (transaction) =>
    transaction.delete(schema.drivers).where(eq(schema.drivers.id, driverA.id)),
  );
  await db.delete(schema.authUsers).where(eq(schema.authUsers.companyId, companyA.id));
  await db.delete(schema.authUsers).where(eq(schema.authUsers.companyId, companyB.id));
  await db.delete(schema.companies).where(eq(schema.companies.id, companyA.id));
  await db.delete(schema.companies).where(eq(schema.companies.id, companyB.id));

  console.log("PostgreSQL tenant isolation integration checks passed.");
} finally {
  await db.$client.end();
  await adminClient.end();
}
