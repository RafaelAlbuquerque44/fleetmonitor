import { and, count, eq, ilike, or } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db";
import { drivers } from "../db/schema";
import { canWriteToFleet, requireAuthentication } from "../middleware/auth";
import type { AppEnvironment } from "../middleware/auth";
import { parseDriverInput, parseDriverListQuery } from "./drivers.validation";

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

const driverRoutes = new Hono<AppEnvironment>();

driverRoutes.use("*", requireAuthentication);

driverRoutes.get("/", async (c) => {
  const user = c.get("authenticatedUser");
  const parsedQuery = parseDriverListQuery(new URL(c.req.url).searchParams);
  if ("error" in parsedQuery) {
    return c.json({ error: parsedQuery.error }, 400);
  }
  const { page, pageSize, offset, query, status } = parsedQuery.value;
  const filteredBy = and(
    eq(drivers.companyId, user.companyId),
    status ? eq(drivers.status, status) : undefined,
    query.length === 0
      ? undefined
      : or(
          ilike(drivers.fullName, `%${query}%`),
          ilike(drivers.cpf, `%${query}%`),
          ilike(drivers.licenseNumber, `%${query}%`),
          ilike(drivers.phone, `%${query}%`),
        ),
  );

  const [rows, [filteredCount], statusRows] = await Promise.all([
    db
      .select({
        id: drivers.id,
        fullName: drivers.fullName,
        cpf: drivers.cpf,
        licenseNumber: drivers.licenseNumber,
        licenseCategory: drivers.licenseCategory,
        licenseExpiresAt: drivers.licenseExpiresAt,
        phone: drivers.phone,
        status: drivers.status,
      })
      .from(drivers)
      .where(filteredBy)
      .orderBy(drivers.fullName)
      .limit(pageSize)
      .offset(offset),
    db.select({ total: count() }).from(drivers).where(filteredBy),
    db
      .select({ status: drivers.status, total: count() })
      .from(drivers)
      .where(eq(drivers.companyId, user.companyId))
      .groupBy(drivers.status),
  ]);

  const statusCounts = { active: 0, inactive: 0 };
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

driverRoutes.get("/:id", async (c) => {
  const user = c.get("authenticatedUser");
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id < 1) {
    return c.json({ error: "Identificador de motorista inválido." }, 400);
  }

  const [driver] = await db
    .select({
      id: drivers.id,
      fullName: drivers.fullName,
      cpf: drivers.cpf,
      licenseNumber: drivers.licenseNumber,
      licenseCategory: drivers.licenseCategory,
      licenseExpiresAt: drivers.licenseExpiresAt,
      phone: drivers.phone,
      status: drivers.status,
    })
    .from(drivers)
    .where(and(eq(drivers.id, id), eq(drivers.companyId, user.companyId)))
    .limit(1);

  if (!driver) {
    return c.json({ error: "Motorista não encontrado." }, 404);
  }
  return c.json(driver);
});

driverRoutes.post("/", async (c) => {
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

  const parsed = parseDriverInput(body);
  if ("error" in parsed) {
    return c.json({ error: parsed.error }, 400);
  }

  try {
    const [driver] = await db
      .insert(drivers)
      .values({ ...parsed.value, companyId: user.companyId })
      .returning({
        id: drivers.id,
        fullName: drivers.fullName,
        cpf: drivers.cpf,
        licenseNumber: drivers.licenseNumber,
        licenseCategory: drivers.licenseCategory,
        licenseExpiresAt: drivers.licenseExpiresAt,
        phone: drivers.phone,
        status: drivers.status,
      });

    if (!driver) {
      throw new Error("Driver insert returned no row");
    }
    return c.json(driver, 201);
  } catch (error) {
    if (isUniqueViolation(error)) {
      return c.json({ error: "Já existe um motorista cadastrado com esse CPF." }, 409);
    }
    throw error;
  }
});

driverRoutes.put("/:id", async (c) => {
  const user = c.get("authenticatedUser");
  if (!canWriteToFleet(user)) {
    return c.json({ error: "Esta conta não permite alterações na frota." }, 403);
  }
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id < 1) {
    return c.json({ error: "Identificador de motorista inválido." }, 400);
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

  const parsed = parseDriverInput(body);
  if ("error" in parsed) {
    return c.json({ error: parsed.error }, 400);
  }

  try {
    const [driver] = await db
      .update(drivers)
      .set(parsed.value)
      .where(and(eq(drivers.id, id), eq(drivers.companyId, user.companyId)))
      .returning({
        id: drivers.id,
        fullName: drivers.fullName,
        cpf: drivers.cpf,
        licenseNumber: drivers.licenseNumber,
        licenseCategory: drivers.licenseCategory,
        licenseExpiresAt: drivers.licenseExpiresAt,
        phone: drivers.phone,
        status: drivers.status,
      });

    if (!driver) {
      return c.json({ error: "Motorista não encontrado." }, 404);
    }
    return c.json(driver);
  } catch (error) {
    if (isUniqueViolation(error)) {
      return c.json({ error: "Já existe um motorista cadastrado com esse CPF." }, 409);
    }
    throw error;
  }
});

driverRoutes.delete("/:id", async (c) => {
  const user = c.get("authenticatedUser");
  if (!canWriteToFleet(user)) {
    return c.json({ error: "Esta conta não permite alterações na frota." }, 403);
  }
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id < 1) {
    return c.json({ error: "Identificador de motorista inválido." }, 400);
  }

  const [driver] = await db
    .delete(drivers)
    .where(and(eq(drivers.id, id), eq(drivers.companyId, user.companyId)))
    .returning({ id: drivers.id });

  if (!driver) {
    return c.json({ error: "Motorista não encontrado." }, 404);
  }
  return c.json({ ok: true });
});

export default driverRoutes;
