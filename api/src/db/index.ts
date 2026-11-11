import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const configuredPoolMax = Number(process.env.DATABASE_POOL_MAX ?? 10);
if (!Number.isSafeInteger(configuredPoolMax) || configuredPoolMax < 1) {
  throw new Error("DATABASE_POOL_MAX must be a positive integer");
}

const client = postgres(databaseUrl, { max: configuredPoolMax });

export const db = drizzle(client, { schema });
