import { createHash } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import type { MiddlewareHandler } from "hono";
import { getCookie } from "hono/cookie";
import { db } from "../db";
import { authSessions, authUsers } from "../db/schema";

export type AuthenticatedUser = {
  id: number;
  email: string;
  companyId: number;
  companyName: string;
  readOnly: boolean;
};

export function canWriteToFleet(user: Pick<AuthenticatedUser, "readOnly">): boolean {
  return !user.readOnly;
}

export type AppEnvironment = {
  Variables: {
    authenticatedUser: AuthenticatedUser;
  };
};

export const sessionCookieName = "fleetmonitor_session";
export const sessionDurationMs = 7 * 24 * 60 * 60 * 1000;

export async function findSessionUser(token: string | undefined) {
  if (!token) {
    return null;
  }

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const [result] = await db
    .select({
      id: authUsers.id,
      email: authUsers.email,
      companyId: authUsers.companyId,
      companyName: authUsers.companyName,
      readOnly: authUsers.readOnly,
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

export const requireAuthentication: MiddlewareHandler<AppEnvironment> = async (
  c,
  next,
) => {
  const user = await findSessionUser(getCookie(c, sessionCookieName));
  if (!user) {
    return c.json({ error: "Autenticação necessária." }, 401);
  }
  c.set("authenticatedUser", user);
  await next();
};
