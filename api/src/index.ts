import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, ilike, or } from "drizzle-orm";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import type { MiddlewareHandler } from "hono";
import { db } from "./db";
import { authSessions, authUsers, vehicleStatusEnum, vehicles } from "./db/schema";

const app = new Hono();
const sessionCookieName = "fleetmonitor_session";
const sessionDurationMs = 7 * 24 * 60 * 60 * 1000;

type VehicleInput = {
  plate: string;
  make: string;
  model: string;
  year: number;
  status: (typeof vehicleStatusEnum.enumValues)[number];
};

type VehicleInputResult = { value: VehicleInput } | { error: string };

function parseVehicleInput(payload: unknown): VehicleInputResult {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    return { error: "Os dados do veículo são inválidos." };
  }

  const values = payload as Record<string, unknown>;
  const plate = typeof values.plate === "string" ? values.plate.trim().toUpperCase() : "";
  const make = typeof values.make === "string" ? values.make.trim() : "";
  const model = typeof values.model === "string" ? values.model.trim() : "";
  const year = values.year;
  const status =
    values.status === undefined
      ? "operational"
      : vehicleStatusEnum.enumValues.find((value) => value === values.status);

  if (!/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(plate)) {
    return { error: "Informe uma placa válida com 7 caracteres." };
  }
  if (make.length === 0 || make.length > 100 || model.length === 0 || model.length > 100) {
    return { error: "Informe a marca e o modelo do veículo (até 100 caracteres)." };
  }
  if (
    typeof year !== "number" ||
    !Number.isInteger(year) ||
    year < 1900 ||
    year > new Date().getFullYear() + 1
  ) {
    return { error: "Informe um ano de fabricação válido." };
  }
  if (!status) {
    return { error: "Selecione um status válido para o veículo." };
  }

  return { value: { plate, make, model, year, status } };
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

app.use(
  "*",
  cors({
    origin: ["http://localhost:5173"],
    allowMethods: ["GET", "POST", "DELETE", "OPTIONS"],
    credentials: true,
  }),
);

app.get("/health", (c) => c.json({ ok: true, service: "api" }));

async function findSessionUser(token: string | undefined) {
  if (!token) {
    return null;
  }

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const [result] = await db
    .select({
      id: authUsers.id,
      email: authUsers.email,
      companyName: authUsers.companyName,
    })
    .from(authSessions)
    .innerJoin(authUsers, eq(authSessions.userId, authUsers.id))
    .where(
      and(
        eq(authSessions.tokenHash, tokenHash),
        gt(authSessions.expiresAt, new Date()),
      ),
    )
    .limit(1);

  return result ?? null;
}

const requireAuthentication: MiddlewareHandler = async (c, next) => {
  const user = await findSessionUser(getCookie(c, sessionCookieName));
  if (!user) {
    return c.json({ error: "Autenticação necessária." }, 401);
  }
  await next();
};

app.post("/auth/login", async (c) => {
  let body: unknown;

  try {
    body = await c.req.json();
  } catch (error) {
    if (error instanceof SyntaxError) {
      return c.json({ error: "O corpo da requisição deve ser um JSON válido." }, 400);
    }
    throw error;
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return c.json({ error: "Informe e-mail e senha." }, 400);
  }

  const payload = body as Record<string, unknown>;
  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  const password = typeof payload.password === "string" ? payload.password : "";

  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ||
    password.length === 0 ||
    password.length > 1024
  ) {
    return c.json({ error: "Informe um e-mail válido e uma senha." }, 400);
  }

  const [user] = await db.select().from(authUsers).where(eq(authUsers.email, email)).limit(1);
  if (!user || !(await Bun.password.verify(password, user.passwordHash))) {
    return c.json({ error: "E-mail ou senha incorretos." }, 401);
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + sessionDurationMs);
  await db.insert(authSessions).values({
    userId: user.id,
    tokenHash: createHash("sha256").update(token).digest("hex"),
    expiresAt,
  });

  setCookie(c, sessionCookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
    path: "/",
    expires: expiresAt,
  });

  return c.json({
    user: { id: user.id, email: user.email, companyName: user.companyName },
  });
});

app.get("/auth/me", async (c) => {
  const user = await findSessionUser(getCookie(c, sessionCookieName));
  if (!user) {
    return c.json({ error: "Autenticação necessária." }, 401);
  }
  return c.json({ user });
});

app.post("/auth/logout", async (c) => {
  const token = getCookie(c, sessionCookieName);
  if (token) {
    await db
      .delete(authSessions)
      .where(eq(authSessions.tokenHash, createHash("sha256").update(token).digest("hex")));
  }
  deleteCookie(c, sessionCookieName, { path: "/" });
  return c.json({ ok: true });
});

app.use("/vehicles", requireAuthentication);
app.use("/vehicles/*", requireAuthentication);

app.get("/vehicles", async (c) => {
  const q = (c.req.query("q") ?? "").trim();

  const rows = await db
    .select({
      id: vehicles.id,
      plate: vehicles.plate,
      make: vehicles.make,
      model: vehicles.model,
      year: vehicles.year,
      status: vehicles.status,
    })
    .from(vehicles)
    .where(
      q.length === 0
        ? undefined
        : or(ilike(vehicles.plate, `%${q}%`), ilike(vehicles.model, `%${q}%`)),
    )
    .orderBy(vehicles.plate);

  return c.json(rows);
});

app.get("/vehicles/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id < 1) {
    return c.json({ error: "Identificador de veículo inválido." }, 400);
  }

  const [vehicle] = await db
    .select({
      id: vehicles.id,
      plate: vehicles.plate,
      make: vehicles.make,
      model: vehicles.model,
      year: vehicles.year,
      status: vehicles.status,
    })
    .from(vehicles)
    .where(eq(vehicles.id, id))
    .limit(1);

  if (!vehicle) {
    return c.json({ error: "Veículo não encontrado." }, 404);
  }
  return c.json(vehicle);
});

app.post("/vehicles", async (c) => {
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
    const [vehicle] = await db
      .insert(vehicles)
      .values(parsed.value)
      .returning({
        id: vehicles.id,
        plate: vehicles.plate,
        make: vehicles.make,
        model: vehicles.model,
        year: vehicles.year,
        status: vehicles.status,
      });

    if (!vehicle) {
      throw new Error("Vehicle insert returned no row");
    }

    return c.json(vehicle, 201);
  } catch (error) {
    if (isUniqueViolation(error)) {
      return c.json({ error: "Já existe um veículo cadastrado com essa placa." }, 409);
    }
    throw error;
  }
});

app.put("/vehicles/:id", async (c) => {
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
    const [vehicle] = await db
      .update(vehicles)
      .set(parsed.value)
      .where(eq(vehicles.id, id))
      .returning({
        id: vehicles.id,
        plate: vehicles.plate,
        make: vehicles.make,
        model: vehicles.model,
        year: vehicles.year,
        status: vehicles.status,
      });

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

app.delete("/vehicles/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id < 1) {
    return c.json({ error: "Identificador de veículo inválido." }, 400);
  }

  const [vehicle] = await db
    .delete(vehicles)
    .where(eq(vehicles.id, id))
    .returning({ id: vehicles.id });

  if (!vehicle) {
    return c.json({ error: "Veículo não encontrado." }, 404);
  }
  return c.json({ ok: true });
});

const port = Number(process.env.PORT ?? 3000);

export default {
  port,
  fetch: app.fetch,
};
