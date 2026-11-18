import { Hono } from "hono";
import { createCompanyFuelRecord, listCompanyFuelRecords } from "../db/fuel";
import { canWriteToFleet, requireAuthentication, type AppEnvironment } from "../middleware/auth";
import { parseFuelRecordInput } from "./fleet-records.validation";

const routes = new Hono<AppEnvironment>();
routes.use("*", requireAuthentication);

routes.get("/", async (c) => {
  const user = c.get("authenticatedUser");
  return c.json(await listCompanyFuelRecords(user.companyId));
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
  const parsed = parseFuelRecordInput(body);
  if ("error" in parsed) return c.json({ error: parsed.error }, 400);

  const result = await createCompanyFuelRecord(user.companyId, parsed.value);
  if (result.kind === "reference-not-found") {
    return c.json({ error: "Selecione um veículo e um motorista ativo da sua empresa." }, 400);
  }
  if (result.kind === "odometer-not-increasing") {
    return c.json({ error: "A quilometragem deve ser maior que o último abastecimento registrado." }, 409);
  }
  if (result.kind === "date-out-of-order") {
    return c.json({ error: "A data não pode ser anterior ao último abastecimento do veículo." }, 409);
  }
  return c.json({ id: result.id }, 201);
});

export default routes;
