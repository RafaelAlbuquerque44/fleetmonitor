import { Hono } from "hono";
import { createCompanyCost, listCompanyCosts } from "../db/operations";
import { canWriteToFleet, requireAuthentication } from "../middleware/auth";
import type { AppEnvironment } from "../middleware/auth";
import { parseCostListQuery, parseFleetCostInput } from "./operations.validation";

const costRoutes = new Hono<AppEnvironment>();
costRoutes.use("*", requireAuthentication);

costRoutes.get("/", async (c) => {
  const parsed = parseCostListQuery(new URL(c.req.url).searchParams);
  if ("error" in parsed) {
    return c.json({ error: parsed.error }, 400);
  }

  const result = await listCompanyCosts(
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

costRoutes.post("/", async (c) => {
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

  const parsed = parseFleetCostInput(body);
  if ("error" in parsed) {
    return c.json({ error: parsed.error }, 400);
  }
  const result = await createCompanyCost(user.companyId, parsed.value);
  if (result.kind === "vehicle-not-found") {
    return c.json({ error: "O veículo selecionado não pertence à sua empresa." }, 400);
  }
  return c.json({ id: result.id }, 201);
});

export default costRoutes;
