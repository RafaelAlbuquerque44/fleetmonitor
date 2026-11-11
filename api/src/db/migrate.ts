import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import * as schema from "./schema";

const databaseUrl =
  process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("MIGRATION_DATABASE_URL or DATABASE_URL is required");
}

const client = postgres(databaseUrl, { max: 1 });

try {
  await migrate(drizzle(client, { schema }), { migrationsFolder: "./drizzle" });
} finally {
  await client.end();
}
