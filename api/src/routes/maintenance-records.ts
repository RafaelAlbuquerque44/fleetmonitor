import { Hono } from "hono";
import { createCompanyMaintenanceRecord, listCompanyMaintenanceRecords, updateCompanyMaintenanceRecord } from "../db/maintenance-records";
import { canWriteToFleet, requireAuthentication, type AppEnvironment } from "../middleware/auth";
import { parseMaintenanceRecordInput } from "./fleet-records.validation";

const routes = new Hono<AppEnvironment>();
routes.use("*", requireAuthentication);

routes.get("/", async (c) => {
  const user = c.get("authenticatedUser");
  return c.json(await listCompanyMaintenanceRecords(user.companyId));
});

routes.post("/", async (c) => {
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
  const parsed = parseMaintenanceRecordInput(body);
  if ("error" in parsed) return c.json({ error: parsed.error }, 400);
  const record = await createCompanyMaintenanceRecord(user.companyId, parsed.value);
  if (!record) return c.json({ error: "O veículo selecionado não pertence à sua empresa." }, 400);
  return c.json(record, 201);
});

routes.put("/:id", async (c) => {
  const user = c.get("authenticatedUser");
  if (!canWriteToFleet(user)) {
    return c.json({ error: "Esta conta não permite alterações na frota." }, 403);
  }
  const id = Number(c.req.param("id"));
  if (!Number.isSafeInteger(id) || id < 1) {
    return c.json({ error: "Identificador de ocorrência inválido." }, 400);
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
  const parsed = parseMaintenanceRecordInput(body);
  if ("error" in parsed) return c.json({ error: parsed.error }, 400);
  const result = await updateCompanyMaintenanceRecord(user.companyId, id, parsed.value);
  if (result.kind === "vehicle-not-found") {
    return c.json({ error: "O veículo selecionado não pertence à sua empresa." }, 400);
  }
  if (result.kind === "vehicle-mismatch") {
    return c.json({ error: "Não é possível alterar o veículo de uma ocorrência existente." }, 400);
  }
  if (result.kind === "record-not-found") {
    return c.json({ error: "Ocorrência não encontrada." }, 404);
  }
  return c.json({ ok: true });
});

export default routes;
