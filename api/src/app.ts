import { Hono } from "hono";
import { cors } from "hono/cors";
import { sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "./db";
import { getDatabaseErrorCode } from "./db/errors";
import type { AppEnvironment } from "./middleware/auth";
import authRoutes from "./routes/auth";
import contactRoutes from "./routes/contact";
import driverRoutes from "./routes/drivers";
import costRoutes from "./routes/costs";
import maintenanceRoutes from "./routes/maintenance";
import vehicleRoutes from "./routes/vehicles";

const app = new Hono<AppEnvironment>();
const allowedOrigins = (
  process.env.CORS_ORIGINS ?? "http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);

if (allowedOrigins.length === 0) {
  throw new Error("CORS_ORIGINS must contain at least one allowed origin");
}

app.use("*", async (c, next) => {
  const requestId = randomUUID();
  const startedAt = Date.now();
  c.set("requestId", requestId);
  c.header("X-Request-ID", requestId);
  await next();
  console.info(
    JSON.stringify({
      event: "http.request",
      requestId,
      method: c.req.method,
      path: new URL(c.req.url).pathname,
      status: c.res.status,
      durationMs: Date.now() - startedAt,
    }),
  );
});

app.onError((error, c) => {
  const requestId = c.get("requestId");
  console.error(
    JSON.stringify({
      event: "http.error",
      requestId,
      method: c.req.method,
      path: new URL(c.req.url).pathname,
      errorType: error.name,
      databaseErrorCode: getDatabaseErrorCode(error),
    }),
  );
  return c.json({ error: "Ocorreu um erro interno.", requestId }, 500);
});

app.use(
  "*",
  cors({
    origin: allowedOrigins,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  }),
);

app.get("/health", (c) => c.json({ ok: true, service: "api" }));
app.get("/ready", async (c) => {
  await db.execute(sql`select 1`);
  return c.json({ ok: true, service: "api" });
});
app.route("/auth", authRoutes);
app.route("/contact", contactRoutes);
app.route("/drivers", driverRoutes);
app.route("/maintenance", maintenanceRoutes);
app.route("/costs", costRoutes);
app.route("/vehicles", vehicleRoutes);

export default app;
