import { Hono } from "hono";
import {
  createCompanyVehicle,
  deleteCompanyVehicle,
  getCompanyFleetStatusRows,
  getCompanyVehicle,
  listCompanyVehicles,
  updateCompanyVehicle,
} from "../db/vehicles";
import { getDatabaseErrorCode } from "../db/errors";
import { canWriteToFleet, requireAuthentication } from "../middleware/auth";
import type { AppEnvironment } from "../middleware/auth";
import { parseVehicleInput, parseVehicleListQuery } from "./vehicles.validation";
import { makeDriverSummary, makeFleetSummary } from "./vehicles.summary";

function isUniqueViolation(error: unknown): boolean {
  return getDatabaseErrorCode(error) === "23505";
}

function isForeignKeyViolation(error: unknown): boolean {
  return getDatabaseErrorCode(error) === "23503";
}

const vehicleRoutes = new Hono<AppEnvironment>();

vehicleRoutes.use("*", requireAuthentication);

vehicleRoutes.get("/summary", async (c) => {
  const user = c.get("authenticatedUser");
  const { vehicleStatusRows, driverStatusRows } =
    await getCompanyFleetStatusRows(user.companyId);

  return c.json({
    ...makeFleetSummary(vehicleStatusRows),
    ...makeDriverSummary(driverStatusRows),
  });
});

vehicleRoutes.get("/", async (c) => {
  const user = c.get("authenticatedUser");
  const parsedQuery = parseVehicleListQuery(new URL(c.req.url).searchParams);
  if ("error" in parsedQuery) {
    return c.json({ error: parsedQuery.error }, 400);
  }
  const { page, pageSize } = parsedQuery.value;
  const result = await listCompanyVehicles(user.companyId, parsedQuery.value);
  return c.json({
    items: result.items,
    page,
    pageSize,
    totalItems: result.totalItems,
    totalPages: Math.max(1, Math.ceil(result.totalItems / pageSize)),
    statusCounts: result.statusCounts,
  });
});

vehicleRoutes.get("/:id", async (c) => {
  const user = c.get("authenticatedUser");
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id < 1) {
    return c.json({ error: "Identificador de veículo inválido." }, 400);
  }

  const vehicle = await getCompanyVehicle(user.companyId, id);
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
    const vehicle = await createCompanyVehicle(user.companyId, parsed.value);
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
    const vehicle = await updateCompanyVehicle(user.companyId, id, parsed.value);
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

  let vehicle: { id: number } | null;
  try {
    vehicle = await deleteCompanyVehicle(user.companyId, id);
  } catch (error) {
    if (isForeignKeyViolation(error)) {
      return c.json(
        { error: "Não é possível remover um veículo com manutenção ou custos vinculados." },
        409,
      );
    }
    throw error;
  }
  if (!vehicle) {
    return c.json({ error: "Veículo não encontrado." }, 404);
  }
  return c.json({ ok: true });
});

export default vehicleRoutes;
