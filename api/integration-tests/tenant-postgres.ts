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
        chassisNumber: "TESTVIN1234567890",
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
        chassisNumber: "TESTVIN1234567890",
        make: "Test",
        model: "Tenant B",
        year: 2026,
      })
      .returning({ id: schema.vehicles.id }),
  );
  assert.ok(vehicleA && vehicleB);
  await assert.rejects(
    withTenantTransaction(companyA.id, (transaction) =>
      transaction.insert(schema.vehicles).values({
        companyId: companyA.id,
        plate: "TST1A03",
        chassisNumber: "TESTVIN1234567890",
        make: "Test",
        model: "Duplicate chassis",
        year: 2026,
      }),
    ),
    (error: unknown) => hasDatabaseErrorCode(error, "23505"),
  );

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

  const fuelPayload = {
    vehicleId: vehicleA.id,
    driverId: driverA.id,
    litersMilliliters: 50_000,
    amountCents: 10_000,
    occurredAt: "2026-11-08",
    odometerKm: 1_000,
    station: "Posto de integração",
    route: "Rota de teste",
  };
  for (const odometerKm of [1_000, 1_500, 2_000]) {
    const response = await app.fetch(
      authenticatedRequest("/fuel-records", writerTokenA, "POST", {
        ...fuelPayload,
        odometerKm,
      }),
    );
    assert.equal(response.status, 201);
  }
  const fuelRecords = await (
    await app.fetch(authenticatedRequest("/fuel-records", writerTokenA))
  ).json() as { odometerKm: number; consumptionKmpl: number | null; historicalAverageKmpl: number | null }[];
  assert.equal(fuelRecords[0]?.odometerKm, 2_000);
  assert.equal(fuelRecords[0]?.consumptionKmpl, 10);
  assert.equal(fuelRecords[0]?.historicalAverageKmpl, 10);
  const deviationResponse = await app.fetch(
    authenticatedRequest("/fuel-records", writerTokenA, "POST", {
      ...fuelPayload, station: null, odometerKm: 2_250,
    }),
  );
  assert.equal(deviationResponse.status, 201);
  const deviationRecords = await (
    await app.fetch(authenticatedRequest("/fuel-records", writerTokenA))
  ).json() as { consumptionKmpl: number | null; historicalAverageKmpl: number | null; station: string | null }[];
  assert.equal(deviationRecords[0]?.station, null);
  assert.equal(deviationRecords[0]?.consumptionKmpl, 5);
  assert.equal(deviationRecords[0]?.historicalAverageKmpl, 10);
  const planResponse = await app.fetch(
    authenticatedRequest("/maintenance-preventive/plans", writerTokenA, "POST", {
      vehicleId: vehicleA.id,
      serviceType: "oil_change",
      intervalKm: 10_000,
      lastServiceOdometerKm: 2_000,
    }),
  );
  assert.equal(planResponse.status, 200);

  const firstReadingResponse = await app.fetch(
    authenticatedRequest("/maintenance-preventive/readings", writerTokenA, "POST", {
      vehicleId: vehicleA.id,
      driverId: driverA.id,
      occurredAt: "2026-11-09",
      odometerKm: 2_300,
    }),
  );
  assert.equal(firstReadingResponse.status, 201);
  assert.equal((await firstReadingResponse.json() as { distanceKm: number }).distanceKm, 50);

  const secondReadingResponse = await app.fetch(
    authenticatedRequest("/maintenance-preventive/readings", writerTokenA, "POST", {
      vehicleId: vehicleA.id,
      driverId: driverA.id,
      occurredAt: "2026-11-10",
      odometerKm: 2_400,
    }),
  );
  assert.equal(secondReadingResponse.status, 201);
  assert.equal((await secondReadingResponse.json() as { distanceKm: number }).distanceKm, 100);

  const washPayload = {
    vehicleId: vehicleA.id,
    driverId: driverA.id,
    serviceType: "washing",
    description: "Lavagem de integração",
    occurredAt: "2026-11-10",
    odometerKm: 2_400,
  };
  assert.equal(
    (await app.fetch(
      authenticatedRequest("/maintenance-preventive/services", writerTokenA, "POST", washPayload),
    )).status,
    201,
  );
  assert.equal(
    (await app.fetch(
      authenticatedRequest("/maintenance-preventive/services", readOnlyTokenA, "POST", washPayload),
    )).status,
    403,
  );
  const preventivePanel = await (
    await app.fetch(authenticatedRequest("/maintenance-preventive", writerTokenA))
  ).json() as {
    vehicles: { id: number; currentOdometerKm: number }[];
    plans: { vehicleId: number; intervalKm: number; lastServiceOdometerKm: number }[];
    readings: { distanceKm: number | null }[];
    services: { serviceType: string; description: string | null }[];
  };
  assert.equal(preventivePanel.vehicles[0]?.currentOdometerKm, 2_400);
  assert.equal(preventivePanel.plans[0]?.intervalKm, 10_000);
  assert.equal(preventivePanel.plans[0]?.lastServiceOdometerKm, 2_000);
  assert.deepEqual(
    preventivePanel.readings.map(({ distanceKm }) => distanceKm),
    [100, 50],
  );
  assert.equal(preventivePanel.services[0]?.serviceType, "washing");
  assert.equal(preventivePanel.services[0]?.description, "Lavagem de integração");
  const preventivePanelB = await (
    await app.fetch(authenticatedRequest("/maintenance-preventive", writerTokenB))
  ).json() as {
    vehicles: { id: number }[];
    plans: unknown[];
    services: unknown[];
    readings: unknown[];
  };
  assert.deepEqual(preventivePanelB.vehicles.map(({ id }) => id), [vehicleB.id]);
  assert.deepEqual(preventivePanelB.plans, []);
  assert.deepEqual(preventivePanelB.services, []);
  assert.deepEqual(preventivePanelB.readings, []);
  assert.deepEqual(
    await db.select({ id: schema.odometerReadings.id }).from(schema.odometerReadings),
    [],
    "odometer reading RLS must fail closed without tenant context",
  );
  assert.deepEqual(
    await db.select({ id: schema.preventiveMaintenancePlans.id }).from(schema.preventiveMaintenancePlans),
    [],
    "preventive plan RLS must fail closed without tenant context",
  );
  assert.deepEqual(
    await db.select({ id: schema.vehicleServices.id }).from(schema.vehicleServices),
    [],
    "vehicle service RLS must fail closed without tenant context",
  );
  assert.equal((await app.fetch(authenticatedRequest(`/drivers/${driverA.id}`, writerTokenA, "DELETE"))).status, 409);
  assert.equal(
    (await app.fetch(authenticatedRequest("/fuel-records", writerTokenA, "POST", {
      ...fuelPayload, odometerKm: 2_500, occurredAt: "2026-11-07",
    }))).status,
    409,
  );
  assert.equal(
    (await app.fetch(authenticatedRequest("/fuel-records", writerTokenA, "POST", {
      ...fuelPayload, odometerKm: 2_000,
    }))).status,
    409,
  );
  assert.deepEqual(
    await (await app.fetch(authenticatedRequest("/fuel-records", writerTokenB))).json(),
    [],
  );
  assert.equal(
    (await app.fetch(
      authenticatedRequest("/fuel-records", readOnlyTokenA, "POST", fuelPayload),
    )).status,
    403,
  );

  const maintenancePayload = {
    vehicleId: vehicleA.id,
    problem: "Inspeção de integração",
    responsible: "Equipe de teste",
    dueAt: null,
    partsUsed: "Filtro",
    status: "waiting_part",
    occurredAt: "2026-11-08",
    completedAt: null,
  };
  const maintenanceResponse = await app.fetch(
    authenticatedRequest("/maintenance-records", writerTokenA, "POST", maintenancePayload),
  );
  assert.equal(maintenanceResponse.status, 201);
  const maintenanceResult = await maintenanceResponse.json() as { id: number };
  assert.equal(
    (await app.fetch(authenticatedRequest("/maintenance-records", readOnlyTokenA, "POST", maintenancePayload))).status,
    403,
  );
  assert.equal(
    (await app.fetch(authenticatedRequest(`/maintenance-records/${maintenanceResult.id}`, writerTokenB, "PUT", {
      ...maintenancePayload, vehicleId: vehicleB.id,
    }))).status,
    404,
  );
  assert.deepEqual(await db.select({ id: schema.fuelRecords.id }).from(schema.fuelRecords), []);
  assert.deepEqual(await db.select({ id: schema.maintenanceRecords.id }).from(schema.maintenanceRecords), []);
  const secondMaintenanceResponse = await app.fetch(
    authenticatedRequest("/maintenance-records", writerTokenA, "POST", {
      ...maintenancePayload,
      problem: "Outro serviço de integração",
      status: "waiting_service",
    }),
  );
  assert.equal(secondMaintenanceResponse.status, 201);
  const secondMaintenanceResult = await secondMaintenanceResponse.json() as { id: number };
  const waitingVehicle = await withTenantTransaction(companyA.id, (transaction) =>
    transaction.select({ status: schema.vehicles.status })
      .from(schema.vehicles)
      .where(eq(schema.vehicles.id, vehicleA.id)),
  );
  assert.equal(waitingVehicle[0]?.status, "waiting_service");
  assert.deepEqual(
    await (await app.fetch(authenticatedRequest("/maintenance-records", writerTokenB))).json(),
    [],
  );
  const completedMaintenanceResponse = await app.fetch(
    authenticatedRequest(
      `/maintenance-records/${maintenanceResult.id}`,
      writerTokenA,
      "PUT",
      { ...maintenancePayload, status: "completed", completedAt: "2026-11-09" },
    ),
  );
  assert.equal(completedMaintenanceResponse.status, 200);
  const activeVehicle = await withTenantTransaction(companyA.id, (transaction) =>
    transaction.select({ status: schema.vehicles.status })
      .from(schema.vehicles)
      .where(eq(schema.vehicles.id, vehicleA.id)),
  );
  assert.equal(activeVehicle[0]?.status, "waiting_service");
  const completedSecondMaintenanceResponse = await app.fetch(
    authenticatedRequest(
      `/maintenance-records/${secondMaintenanceResult.id}`,
      writerTokenA,
      "PUT",
      { ...maintenancePayload, status: "completed", completedAt: "2026-11-09" },
    ),
  );
  assert.equal(completedSecondMaintenanceResponse.status, 200);
  const completedVehicle = await withTenantTransaction(companyA.id, (transaction) =>
    transaction.select({ status: schema.vehicles.status })
      .from(schema.vehicles)
      .where(eq(schema.vehicles.id, vehicleA.id)),
  );
  assert.equal(completedVehicle[0]?.status, "maintenance_completed");
  const summaryResponse = await app.fetch(authenticatedRequest("/vehicles/summary", writerTokenA));
  assert.equal(summaryResponse.status, 200);
  const summary = await summaryResponse.json() as { averageDowntimeHours: number };
  assert.ok(Number.isFinite(summary.averageDowntimeHours));
  assert.ok(summary.averageDowntimeHours >= 0);

  const tireResponse = await app.fetch(
    authenticatedRequest("/tires", writerTokenA, "POST", {
      vehicleId: vehicleA.id,
      position: "Traseiro esquerdo",
      brand: "Marca de teste",
      installedAt: "2026-11-08",
      installedOdometerKm: 2_250,
    }),
  );
  assert.equal(tireResponse.status, 201);
  const tireResult = await tireResponse.json() as { id: number };
  const tireEventResponse = await app.fetch(
    authenticatedRequest(`/tires/${tireResult.id}/events`, writerTokenA, "POST", {
      type: "inspection",
      description: "Inspeção de integração",
      occurredAt: "2026-11-08",
      odometerKm: 2_250,
    }),
  );
  assert.equal(tireEventResponse.status, 201);
  const tireRecords = await (
    await app.fetch(authenticatedRequest("/tires", writerTokenA))
  ).json() as { usageKm: number; events: { type: string }[] }[];
  assert.equal(tireRecords[0]?.usageKm, 0);
  assert.deepEqual(tireRecords[0]?.events.map((event) => event.type), ["installation", "inspection"]);
  assert.deepEqual(
    await (await app.fetch(authenticatedRequest("/tires", writerTokenB))).json(),
    [],
  );
  await withTenantTransaction(companyA.id, (transaction) =>
    transaction.update(schema.vehicles).set({ status: "operational" }).where(eq(schema.vehicles.id, vehicleA.id)),
  );

  for (const type of ["vehicles", "drivers"]) {
    const response = await app.fetch(authenticatedRequest(`/exports/${type}`, writerTokenA));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("Cache-Control"), "no-store");
    const exported = await response.json() as { columns: string[]; rows: unknown[][] };
    assert.ok(exported.columns.length > 0);
    assert.ok(exported.rows.every((row) => row.length === exported.columns.length));
    const other = await app.fetch(authenticatedRequest(`/exports/${type}`, writerTokenB));
    assert.equal(other.status, 200);
    const otherData = await other.json() as { rows: unknown[][] };
    assert.equal(otherData.rows.length, type === "vehicles" ? 1 : 0);
    assert.equal((await app.fetch(authenticatedRequest(`/exports/${type}`, readOnlyTokenA))).status, 200);
  }
  assert.equal((await app.fetch(authenticatedRequest("/exports/invalid", writerTokenA))).status, 400);
  for (const type of ["maintenance", "preventive", "costs"]) {
    assert.equal((await app.fetch(authenticatedRequest(`/exports/${type}`, writerTokenA))).status, 400);
  }
  const exportedDriver = await (await app.fetch(authenticatedRequest("/exports/drivers", writerTokenA))).json() as { rows: unknown[][] };
  assert.equal(exportedDriver.rows[0]?.[0], driverA.id);
  assert.equal(exportedDriver.rows[0]?.[3], "12345678901");
  const manyVehicles = Array.from({ length: 101 }, (_, index) => ({
    companyId: companyA.id, plate: `E${String(index).padStart(6, "0")}`,
    make: "Export", model: "Pagination", year: 2026,
  }));
  await withTenantTransaction(companyA.id, (transaction) => transaction.insert(schema.vehicles).values(manyVehicles));
  const fullExport = await (await app.fetch(authenticatedRequest("/exports/vehicles", writerTokenA))).json() as { rows: unknown[][] };
  assert.equal(fullExport.rows.length, 102, "export must include records beyond a single page");
  await withTenantTransaction(companyA.id, (transaction) => transaction.delete(schema.vehicles).where(eq(schema.vehicles.make, "Export")));

  const [dates] = await adminClient`
    SELECT to_char((now() at time zone 'America/Sao_Paulo')::date + 30, 'YYYY-MM-DD') AS in_range,
           to_char((now() at time zone 'America/Sao_Paulo')::date + 31, 'YYYY-MM-DD') AS out_of_range
  `;
  assert.ok(dates);
  await withTenantTransaction(companyA.id, (transaction) =>
    transaction.update(schema.drivers).set({ licenseExpiresAt: dates.in_range }).where(eq(schema.drivers.id, driverA.id)),
  );
  const licenseAlerts = await (await app.fetch(authenticatedRequest("/drivers/alerts", writerTokenA))).json() as { id: number }[];
  assert.ok(licenseAlerts.some((alert) => alert.id === driverA.id));
  assert.deepEqual(await (await app.fetch(authenticatedRequest("/drivers/alerts", writerTokenB))).json(), []);
  for (const [dueAt, expected] of [[dates.in_range, true], [dates.out_of_range, false]] as const) {
    await withTenantTransaction(companyA.id, (transaction) =>
      transaction.update(schema.drivers).set({ licenseExpiresAt: dueAt }).where(eq(schema.drivers.id, driverA.id)),
    );
    const alerts = await (await app.fetch(authenticatedRequest("/drivers/alerts", writerTokenA))).json() as { id: number }[];
    assert.equal(alerts.some((alert) => alert.id === driverA.id), expected);
  }
  await withTenantTransaction(companyA.id, (transaction) =>
    transaction.update(schema.drivers).set({ status: "inactive" }).where(eq(schema.drivers.id, driverA.id)),
  );
  const inactiveAlerts = await (await app.fetch(authenticatedRequest("/drivers/alerts", writerTokenA))).json() as { id: number }[];
  assert.ok(!inactiveAlerts.some((alert) => alert.id === driverA.id));
  await withTenantTransaction(companyA.id, (transaction) =>
    transaction.update(schema.drivers).set({ licenseExpiresAt: "2030-01-01", status: "active" }).where(eq(schema.drivers.id, driverA.id)),
  );
  for (const path of ["/maintenance", "/costs", "/preventive/plans", "/preventive/alerts"]) {
    assert.equal((await app.fetch(authenticatedRequest(path, writerTokenA))).status, 404);
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
    transaction.delete(schema.maintenancePlans).where(eq(schema.maintenancePlans.companyId, companyA.id)),
  );
  await withTenantTransaction(companyA.id, (transaction) =>
    transaction.delete(schema.fleetCosts).where(eq(schema.fleetCosts.companyId, companyA.id)),
  );
  await withTenantTransaction(companyA.id, async (transaction) => {
    await transaction.delete(schema.tireEvents).where(eq(schema.tireEvents.companyId, companyA.id));
    await transaction.delete(schema.tires).where(eq(schema.tires.companyId, companyA.id));
    await transaction.delete(schema.vehicleServices).where(eq(schema.vehicleServices.companyId, companyA.id));
    await transaction.delete(schema.preventiveMaintenancePlans)
      .where(eq(schema.preventiveMaintenancePlans.companyId, companyA.id));
    await transaction.delete(schema.odometerReadings).where(eq(schema.odometerReadings.companyId, companyA.id));
    await transaction.delete(schema.maintenanceRecords).where(eq(schema.maintenanceRecords.companyId, companyA.id));
    await transaction.delete(schema.fuelRecords).where(eq(schema.fuelRecords.companyId, companyA.id));
  });
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
