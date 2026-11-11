import { Hono } from "hono";
import {
  createCompanyDriver,
  deleteCompanyDriver,
  getCompanyDriver,
  listCompanyDrivers,
  updateCompanyDriver,
} from "../db/drivers";
import { getDatabaseErrorCode } from "../db/errors";
import { canWriteToFleet, requireAuthentication } from "../middleware/auth";
import type { AppEnvironment } from "../middleware/auth";
import { parseDriverInput, parseDriverListQuery } from "./drivers.validation";

function isUniqueViolation(error: unknown): boolean {
  return getDatabaseErrorCode(error) === "23505";
}

const driverRoutes = new Hono<AppEnvironment>();

driverRoutes.use("*", requireAuthentication);

driverRoutes.get("/", async (c) => {
  const user = c.get("authenticatedUser");
  const parsedQuery = parseDriverListQuery(new URL(c.req.url).searchParams);
  if ("error" in parsedQuery) {
    return c.json({ error: parsedQuery.error }, 400);
  }
  const { page, pageSize } = parsedQuery.value;
  const result = await listCompanyDrivers(user.companyId, parsedQuery.value);
  return c.json({
    items: result.items,
    page,
    pageSize,
    totalItems: result.totalItems,
    totalPages: Math.max(1, Math.ceil(result.totalItems / pageSize)),
    statusCounts: result.statusCounts,
  });
});

driverRoutes.get("/:id", async (c) => {
  const user = c.get("authenticatedUser");
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id < 1) {
    return c.json({ error: "Identificador de motorista inválido." }, 400);
  }

  const driver = await getCompanyDriver(user.companyId, id);
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
    const driver = await createCompanyDriver(user.companyId, parsed.value);
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
    const driver = await updateCompanyDriver(user.companyId, id, parsed.value);
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

  const driver = await deleteCompanyDriver(user.companyId, id);
  if (!driver) {
    return c.json({ error: "Motorista não encontrado." }, 404);
  }
  return c.json({ ok: true });
});

export default driverRoutes;
