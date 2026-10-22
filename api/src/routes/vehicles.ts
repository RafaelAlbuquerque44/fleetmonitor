import { and, count, eq, ilike, or, sql } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db";
import { vehicleStatusEnum, vehicles } from "../db/schema";
import { canWriteToFleet, requireAuthentication } from "../middleware/auth";
import type { AppEnvironment } from "../middleware/auth";
import { parseVehicleInput, parseVehicleListQuery } from "./vehicles.validation";
import { makeFleetSummary } from "./vehicles.summary";

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

const vehicleRoutes = new Hono<AppEnvironment>();

vehicleRoutes.use("*", requireAuthentication);

vehicleRoutes.get("/summary", async (c) => {
  const user = c.get("authenticatedUser");
  const statusRows = await db
    .select({ status: vehicles.status, total: count() })
    .from(vehicles)
    .where(eq(vehicles.companyId, user.companyId))
    .groupBy(vehicles.status);

  return c.json(makeFleetSummary(statusRows));
});

vehicleRoutes.get("/", async (c) => {
  const user = c.get("authenticatedUser");
  const parsedQuery = parseVehicleListQuery(new URL(c.req.url).searchParams);
  if ("error" in parsedQuery) {
    return c.json({ error: parsedQuery.error }, 400);
  }
  const { page, pageSize, offset, query, status } = parsedQuery.value;

  const filters = [
    eq(vehicles.companyId, user.companyId),
    status ? eq(vehicles.status, status) : undefined,
    query.length === 0
      ? undefined
      : or(
          ilike(vehicles.plate, `%${query}%`),
          ilike(vehicles.make, `%${query}%`),
          ilike(vehicles.model, `%${query}%`),
          sql`${vehicles.year}::text ILIKE ${`%${query}%`}`,
        ),
  ];
  const filteredBy = and(...filters);

  const [rows, [filteredCount], statusRows] = await Promise.all([
    db
      .select({
        id: vehicles.id,
        plate: vehicles.plate,
        make: vehicles.make,
        model: vehicles.model,
        year: vehicles.year,
        status: vehicles.status,
      })
      .from(vehicles)
      .where(filteredBy)
      .orderBy(vehicles.plate)
      .limit(pageSize)
      .offset(offset),
    db
      .select({ total: count() })
      .from(vehicles)
      .where(filteredBy),
    db
      .select({ status: vehicles.status, total: count() })
      .from(vehicles)
      .where(eq(vehicles.companyId, user.companyId))
      .groupBy(vehicles.status),
  ]);

  const statusCounts = {
    operational: 0,
    maintenance: 0,
    inactive: 0,
  };
  for (const row of statusRows) {
    statusCounts[row.status] = row.total;
  }

  const totalItems = filteredCount?.total ?? 0;
  return c.json({
    items: rows,
    page,
    pageSize,
    totalItems,
    totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
    statusCounts,
  });
});

vehicleRoutes.get("/:id", async (c) => {
  const user = c.get("authenticatedUser");
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id < 1) {
    return c.json({ error: "Identificador de veículo inválido." }, 400);
  }

  const [vehicle] = await db
    .select({
      id: vehicles.id,
      plate: vehicles.plate,
      make: vehicles.make,
      model: vehicles.model,
      year: vehicles.year,
      status: vehicles.status,
    })
    .from(vehicles)
    .where(and(eq(vehicles.id, id), eq(vehicles.companyId, user.companyId)))
    .limit(1);

  if (!vehicle) {
    return c.json({ error: "Veículo não encontrado." }, 404);
  }
  return c.json(vehicle);
});

vehicleRoutes.post("/", async (c) => {
  const user = c.get("authenticatedUser");
  if (!canWriteToFleet(user)) {
    return c.json({ error: "Esta conta não permite alterações na frota." }, 403);
  }
  let body: unknown;

  try {
    body = await c.req.json();
  } catch (error) {
    if (error instanceof SyntaxError) {
      return c.json({ error: "O corpo da requisição deve ser um JSON válido." }, 400);
    }
    throw error;
  }

  const parsed = parseVehicleInput(body);
  if ("error" in parsed) {
    return c.json({ error: parsed.error }, 400);
  }

  try {
    const [vehicle] = await db
      .insert(vehicles)
      .values({ ...parsed.value, companyId: user.companyId })
      .returning({
        id: vehicles.id,
        plate: vehicles.plate,
        make: vehicles.make,
        model: vehicles.model,
        year: vehicles.year,
        status: vehicles.status,
      });

    if (!vehicle) {
      throw new Error("Vehicle insert returned no row");
    }

    return c.json(vehicle, 201);
  } catch (error) {
    if (isUniqueViolation(error)) {
      return c.json({ error: "Já existe um veículo cadastrado com essa placa." }, 409);
    }
    throw error;
  }
});

vehicleRoutes.put("/:id", async (c) => {
  const user = c.get("authenticatedUser");
  if (!canWriteToFleet(user)) {
    return c.json({ error: "Esta conta não permite alterações na frota." }, 403);
  }
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id < 1) {
    return c.json({ error: "Identificador de veículo inválido." }, 400);
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch (error) {
    if (error instanceof SyntaxError) {
      return c.json({ error: "O corpo da requisição deve ser um JSON válido." }, 400);
    }
    throw error;
  }

  const parsed = parseVehicleInput(body);
  if ("error" in parsed) {
    return c.json({ error: parsed.error }, 400);
  }

  try {
    const [vehicle] = await db
      .update(vehicles)
      .set(parsed.value)
      .where(and(eq(vehicles.id, id), eq(vehicles.companyId, user.companyId)))
      .returning({
        id: vehicles.id,
        plate: vehicles.plate,
        make: vehicles.make,
        model: vehicles.model,
        year: vehicles.year,
        status: vehicles.status,
      });

    if (!vehicle) {
      return c.json({ error: "Veículo não encontrado." }, 404);
    }
    return c.json(vehicle);
  } catch (error) {
    if (isUniqueViolation(error)) {
      return c.json({ error: "Já existe um veículo cadastrado com essa placa." }, 409);
    }
    throw error;
  }
});

vehicleRoutes.delete("/:id", async (c) => {
  const user = c.get("authenticatedUser");
  if (!canWriteToFleet(user)) {
    return c.json({ error: "Esta conta não permite alterações na frota." }, 403);
  }
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id < 1) {
    return c.json({ error: "Identificador de veículo inválido." }, 400);
  }

  const [vehicle] = await db
    .delete(vehicles)
    .where(and(eq(vehicles.id, id), eq(vehicles.companyId, user.companyId)))
    .returning({ id: vehicles.id });

  if (!vehicle) {
    return c.json({ error: "Veículo não encontrado." }, 404);
  }
  return c.json({ ok: true });
});

export default vehicleRoutes;
