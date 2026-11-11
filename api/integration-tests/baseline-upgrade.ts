import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readMigrationFiles } from "drizzle-orm/migrator";
import postgres from "postgres";

const migrationUrl = process.env.MIGRATION_DATABASE_URL;
const appPassword = process.env.POSTGRES_APP_PASSWORD;
const appRole = process.env.POSTGRES_APP_USER ?? "fleetmonitor_app";

if (!migrationUrl) {
  throw new Error("MIGRATION_DATABASE_URL is required for baseline integration tests");
}
if (!appPassword || appPassword.length < 24) {
  throw new Error("POSTGRES_APP_PASSWORD must be set for baseline integration tests");
}

const migrations = readMigrationFiles({ migrationsFolder: "./drizzle" });
const initialMigration = migrations[0];
if (!initialMigration) {
  throw new Error("No versioned migrations were found in api/drizzle");
}

const testDatabase = `fleetmonitor_baseline_${randomUUID().replaceAll("-", "")}`;
const adminClient = postgres(migrationUrl, { max: 1 });
const targetUrl = new URL(migrationUrl);
targetUrl.pathname = `/${testDatabase}`;
let databaseCreated = false;

try {
  await adminClient.unsafe(`CREATE DATABASE "${testDatabase}"`);
  databaseCreated = true;

  const legacyClient = postgres(targetUrl.toString(), { max: 1 });
  try {
    for (const statement of initialMigration.sql) {
      if (statement.trim()) {
        await legacyClient.unsafe(statement);
      }
    }
  } finally {
    await legacyClient.end();
  }

  process.env.MIGRATION_DATABASE_URL = targetUrl.toString();
  await import("../src/db/baseline");
  await import("../src/db/provision-app-role");
  await import("../src/db/migrate");

  const appUrl = new URL(targetUrl);
  appUrl.username = appRole;
  appUrl.password = appPassword;
  const appClient = postgres(appUrl.toString(), { max: 1 });
  const verificationClient = postgres(targetUrl.toString(), { max: 1 });
  try {
    const [role] = await appClient`
      SELECT current_role AS name, rolsuper, rolbypassrls
      FROM pg_roles
      WHERE rolname = current_user
    `;
    assert.equal(role?.name, appRole);
    assert.equal(role?.rolsuper, false);
    assert.equal(role?.rolbypassrls, false);

    const [migrationCount] = await verificationClient`
      SELECT count(*)::integer AS count FROM drizzle.__drizzle_migrations
    `;
    assert.equal(migrationCount?.count, migrations.length);

    const [rlsCount] = await verificationClient`
      SELECT count(*)::integer AS count
      FROM pg_class
      WHERE relnamespace = 'public'::regnamespace
        AND relname = ANY(${appClient.array([
          "vehicles",
          "drivers",
          "maintenance_orders",
          "fleet_costs",
        ])})
        AND relrowsecurity
        AND relforcerowsecurity
    `;
    assert.equal(rlsCount?.count, 4);
  } finally {
    await appClient.end();
    await verificationClient.end();
  }

  console.log("Existing-schema baseline and versioned upgrade checks passed.");
} finally {
  if (databaseCreated) {
    await adminClient`
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = ${testDatabase}
        AND pid <> pg_backend_pid()
    `;
    await adminClient.unsafe(`DROP DATABASE IF EXISTS "${testDatabase}"`);
  }
  await adminClient.end();
}
