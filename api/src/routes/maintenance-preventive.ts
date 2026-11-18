import { Hono } from "hono";
import {
  createOdometerReading,
  createVehicleService,
  listPreventiveMaintenance,
  savePreventiveMaintenancePlan,
} from "../db/preventive-maintenance";
import {
  canWriteToFleet,
  requireAuthentication,
  type AppEnvironment,
} from "../middleware/auth";
import {
  parseOdometerReadingInput,
  parsePreventiveMaintenancePlanInput,
  parseVehicleServiceInput,
} from "./fleet-records.validation";

const routes = new Hono<AppEnvironment>();
routes.use("*", requireAuthentication);

async function readJsonBody(request: Request) {
  try {
    return { body: await request.json() as unknown };
  } catch (error) {
    if (error instanceof SyntaxError) {
      return { error: "O corpo da requisição deve ser um JSON válido." };
    }
    throw error;
  }
}

routes.get("/", async (c) => {
  const user = c.get("authenticatedUser");
  return c.json(await listPreventiveMaintenance(user.companyId));
});

routes.post("/plans", async (c) => {
  const user = c.get("authenticatedUser");
  if (!canWriteToFleet(user)) {
    return c.json({ error: "Esta conta não permite alterações na frota." }, 403);
  }
  const parsedBody = await readJsonBody(c.req.raw);
  if ("error" in parsedBody) return c.json({ error: parsedBody.error }, 400);
  const parsed = parsePreventiveMaintenancePlanInput(parsedBody.body);
  if ("error" in parsed) return c.json({ error: parsed.error }, 400);

  const result = await savePreventiveMaintenancePlan(user.companyId, parsed.value);
  if (result.kind === "vehicle-not-found") {
    return c.json({ error: "O veículo selecionado não pertence à sua empresa." }, 400);
  }
  if (result.kind === "odometer-not-found") {
    return c.json({ error: "Registre a quilometragem atual antes de configurar um lembrete." }, 409);
  }
  if (result.kind === "service-odometer-ahead") {
    return c.json({ error: "A quilometragem do último serviço não pode superar a quilometragem atual." }, 400);
  }
  return c.json({ id: result.id }, 200);
});

routes.post("/readings", async (c) => {
  const user = c.get("authenticatedUser");
  if (!canWriteToFleet(user)) {
    return c.json({ error: "Esta conta não permite alterações na frota." }, 403);
  }
  const parsedBody = await readJsonBody(c.req.raw);
  if ("error" in parsedBody) return c.json({ error: parsedBody.error }, 400);
  const parsed = parseOdometerReadingInput(parsedBody.body);
  if ("error" in parsed) return c.json({ error: parsed.error }, 400);

  const result = await createOdometerReading(user.companyId, parsed.value);
  if (result.kind === "vehicle-not-found") {
    return c.json({ error: "O veículo selecionado não pertence à sua empresa." }, 400);
  }
  if (result.kind === "driver-not-found") {
    return c.json({ error: "Selecione um motorista ativo da sua empresa." }, 400);
  }
  if (result.kind === "odometer-not-increasing") {
    return c.json(
      { error: `A quilometragem deve ser maior que a última registrada (${result.currentOdometerKm.toLocaleString("pt-BR")} km).` },
      409,
    );
  }
  return c.json(result, 201);
});

routes.post("/services", async (c) => {
  const user = c.get("authenticatedUser");
  if (!canWriteToFleet(user)) {
    return c.json({ error: "Esta conta não permite alterações na frota." }, 403);
  }
  const parsedBody = await readJsonBody(c.req.raw);
  if ("error" in parsedBody) return c.json({ error: parsedBody.error }, 400);
  const parsed = parseVehicleServiceInput(parsedBody.body);
  if ("error" in parsed) return c.json({ error: parsed.error }, 400);

  const result = await createVehicleService(user.companyId, parsed.value);
  if (result.kind === "vehicle-not-found") {
    return c.json({ error: "O veículo selecionado não pertence à sua empresa." }, 400);
  }
  if (result.kind === "driver-not-found") {
    return c.json({ error: "Selecione um motorista ativo da sua empresa." }, 400);
  }
  if (result.kind === "odometer-before-last-service") {
    return c.json(
      { error: "A quilometragem deste serviço não pode ser anterior ao último serviço registrado." },
      409,
    );
  }
  return c.json({ id: result.id }, 201);
});

export default routes;
