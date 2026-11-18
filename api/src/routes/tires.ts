import { Hono } from "hono";
import { getDatabaseErrorCode } from "../db/errors";
import { createCompanyTire, createCompanyTireEvent, listCompanyTires } from "../db/tires";
import { canWriteToFleet, requireAuthentication, type AppEnvironment } from "../middleware/auth";
import { parseTireEventInput, parseTireInput } from "./fleet-records.validation";

const routes = new Hono<AppEnvironment>();
routes.use("*", requireAuthentication);

routes.get("/", async (c) => {
  const user = c.get("authenticatedUser");
  return c.json(await listCompanyTires(user.companyId));
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
  const parsed = parseTireInput(body);
  if ("error" in parsed) return c.json({ error: parsed.error }, 400);
  try {
    const result = await createCompanyTire(user.companyId, parsed.value);
    if (result.kind === "vehicle-not-found") {
      return c.json({ error: "O veículo selecionado não pertence à sua empresa." }, 400);
    }
    if (result.kind === "odometer-outdated") {
      return c.json({ error: "A quilometragem de instalação não pode ser anterior ao último registro." }, 409);
    }
    return c.json({ id: result.id }, 201);
  } catch (error) {
    if (getDatabaseErrorCode(error) === "23505") {
      return c.json({ error: "Já existe um pneu ativo nesta posição." }, 409);
    }
    throw error;
  }
});

routes.post("/:id/events", async (c) => {
  const user = c.get("authenticatedUser");
  if (!canWriteToFleet(user)) {
    return c.json({ error: "Esta conta não permite alterações na frota." }, 403);
  }
  const tireId = Number(c.req.param("id"));
  if (!Number.isSafeInteger(tireId) || tireId < 1) {
    return c.json({ error: "Identificador de pneu inválido." }, 400);
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
  const parsed = parseTireEventInput(body);
  if ("error" in parsed) return c.json({ error: parsed.error }, 400);
  const result = await createCompanyTireEvent(user.companyId, tireId, parsed.value);
  if (result.kind === "tire-not-found") return c.json({ error: "Pneu não encontrado." }, 404);
  if (result.kind === "tire-removed") return c.json({ error: "Não é possível adicionar eventos a um pneu substituído." }, 409);
  if (result.kind === "event-before-installation") {
    return c.json({ error: "A data e a quilometragem do evento não podem anteceder a instalação." }, 400);
  }
  if (result.kind === "odometer-ahead") {
    return c.json({ error: "A quilometragem do evento supera o último registro do veículo." }, 400);
  }
  return c.json({ id: result.id }, 201);
});

export default routes;
