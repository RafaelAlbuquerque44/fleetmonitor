import { Hono } from "hono";
import { cors } from "hono/cors";
import { sql } from "drizzle-orm";
import { db } from "./db";
import type { AppEnvironment } from "./middleware/auth";
import authRoutes from "./routes/auth";
import contactRoutes from "./routes/contact";
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
app.route("/vehicles", vehicleRoutes);

export default app;
