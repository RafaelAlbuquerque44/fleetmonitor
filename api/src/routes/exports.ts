import { Hono } from "hono";
import { exportCompanyData, isExportType } from "../db/exports";
import { requireAuthentication, type AppEnvironment } from "../middleware/auth";

const routes = new Hono<AppEnvironment>();
routes.use("*", requireAuthentication);
routes.get("/:type", async (c) => {
  const type = c.req.param("type");
  if (!isExportType(type)) return c.json({ error: "Tipo de dados inválido." }, 400);
  c.header("Cache-Control", "no-store");
  return c.json(await exportCompanyData(c.get("authenticatedUser").companyId, type));
});

export default routes;
