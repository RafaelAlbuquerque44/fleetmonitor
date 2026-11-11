import { Hono } from "hono";
import { createCompanyMaintenance, listCompanyMaintenance, updateCompanyMaintenance } from "../db/operations";
import { canWriteToFleet, requireAuthentication } from "../middleware/auth";
import type { AppEnvironment } from "../middleware/auth";
import { parseMaintenanceInput, parseMaintenanceListQuery } from "./operations.validation";

const maintenanceRoutes = new Hono<AppEnvironment>();
maintenanceRoutes.use("*", requireAuthentication);

maintenanceRoutes.get("/", async (c) => {
  const parsed = parseMaintenanceListQuery(new URL(c.req.url).searchParams);
  if ("error" in parsed) {
    return c.json({ error: parsed.error }, 400);
  }

  const result = await listCompanyMaintenance(
    c.get("authenticatedUser").companyId,
    parsed.value,
  );
  const { page, pageSize } = parsed.value;
  return c.json({
    ...result,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(result.totalItems / pageSize)),
  });
});

maintenanceRoutes.post("/", async (c) => {
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

  const parsed = parseMaintenanceInput(body);
  if ("error" in parsed) {
    return c.json({ error: parsed.error }, 400);
  }
  const result = await createCompanyMaintenance(user.companyId, parsed.value);
  if (result.kind === "vehicle-not-found") {
    return c.json({ error: "O veículo selecionado não pertence à sua empresa." }, 400);
  }
  return c.json({ id: result.id }, 201);
});

maintenanceRoutes.put("/:id", async (c) => {
  const user = c.get("authenticatedUser");
  if (!canWriteToFleet(user)) {
    return c.json({ error: "Esta conta não permite alterações na frota." }, 403);
  }
  const orderId = Number(c.req.param("id"));
  if (!Number.isSafeInteger(orderId) || orderId < 1) {
    return c.json({ error: "Identificador de manutenção inválido." }, 400);
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

  const parsed = parseMaintenanceInput(body);
  if ("error" in parsed) {
    return c.json({ error: parsed.error }, 400);
  }
  const result = await updateCompanyMaintenance(user.companyId, orderId, parsed.value);
  if (result.kind === "vehicle-not-found") {
    return c.json({ error: "O veículo selecionado não pertence à sua empresa." }, 400);
  }
  if (result.kind === "not-found") {
    return c.json({ error: "Manutenção não encontrada." }, 404);
  }
  return c.json({ ok: true });
});

export default maintenanceRoutes;
