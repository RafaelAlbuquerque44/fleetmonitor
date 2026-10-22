import { createHash, randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { db } from "../db";
import { authSessions, authUsers } from "../db/schema";
import {
  findSessionUser,
  sessionCookieName,
  sessionDurationMs,
} from "../middleware/auth";
import type { AppEnvironment } from "../middleware/auth";

const authRoutes = new Hono<AppEnvironment>();

authRoutes.post("/login", async (c) => {
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
    user: {
      id: user.id,
      email: user.email,
      companyName: user.companyName,
      readOnly: user.readOnly,
    },
  });
});

authRoutes.get("/me", async (c) => {
  const user = await findSessionUser(getCookie(c, sessionCookieName));
  if (!user) {
    return c.json({ error: "Autenticação necessária." }, 401);
  }
  return c.json({ user });
});

authRoutes.post("/logout", async (c) => {
  const token = getCookie(c, sessionCookieName);
  if (token) {
    await db
      .delete(authSessions)
      .where(eq(authSessions.tokenHash, createHash("sha256").update(token).digest("hex")));
  }
  deleteCookie(c, sessionCookieName, { path: "/" });
  return c.json({ ok: true });
});

export default authRoutes;
