import { readMigrationFiles } from "drizzle-orm/migrator";
import postgres from "postgres";

const databaseUrl =
  process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("MIGRATION_DATABASE_URL or DATABASE_URL is required");
}

const migrations = readMigrationFiles({ migrationsFolder: "./drizzle" });
const initialMigration = migrations[0];

if (!initialMigration) {
  throw new Error("No versioned migrations were found in api/drizzle");
}

const requiredColumns: Record<string, string[]> = {
  companies: ["id", "name", "created_at"],
  vehicles: [
    "id",
    "company_id",
    "plate",
    "make",
    "model",
    "year",
    "status",
    "created_at",
  ],
  drivers: [
    "id",
    "company_id",
    "full_name",
    "cpf",
    "license_number",
    "license_category",
    "license_expires_at",
    "phone",
    "status",
    "created_at",
  ],
  auth_users: [
    "id",
    "company_id",
    "email",
    "company_name",
    "password_hash",
    "read_only",
    "created_at",
  ],
  auth_sessions: ["id", "user_id", "token_hash", "expires_at", "created_at"],
  contact_requests: ["id", "name", "email", "company_name", "message", "created_at"],
};

const client = postgres(databaseUrl, { max: 1 });

try {
  const [trackingState] = await client`
    SELECT to_regclass('drizzle.__drizzle_migrations') IS NOT NULL AS exists
  `;

  if (trackingState?.exists) {
    const [trackedMigration] = await client`
      SELECT id FROM drizzle.__drizzle_migrations LIMIT 1
    `;
    if (trackedMigration) {
      throw new Error("This database already has migration history; run db:migrate instead");
    }
  }

  const tableNames = Object.keys(requiredColumns);
  const columns = await client`
    SELECT table_name, column_name, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = ANY(${client.array(tableNames)})
  `;

  if (columns.length === 0) {
    console.log("Database is empty; run `bun run db:migrate` instead.");
    process.exitCode = 0;
  } else {
    const actualColumns = new Map<string, Set<string>>();
    for (const column of columns) {
      const tableColumns = actualColumns.get(column.table_name) ?? new Set<string>();
      tableColumns.add(column.column_name);
      actualColumns.set(column.table_name, tableColumns);
    }

    const missingColumns = Object.entries(requiredColumns).flatMap(
      ([tableName, expectedColumns]) =>
        expectedColumns
          .filter((columnName) => !actualColumns.get(tableName)?.has(columnName))
          .map((columnName) => `${tableName}.${columnName}`),
    );

    const requiredIndexes = [
      "companies_name_unique",
      "auth_users_email_unique",
      "auth_users_company_id_idx",
      "auth_sessions_token_hash_unique",
      "vehicles_company_id_idx",
      "vehicles_company_id_plate_unique",
      "drivers_company_id_idx",
      "drivers_company_id_cpf_unique",
    ];
    const indexes = await client`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND indexname = ANY(${client.array(requiredIndexes)})
    `;
    const actualIndexes = new Set(indexes.map((row) => row.indexname));
    const missingIndexes = requiredIndexes.filter((name) => !actualIndexes.has(name));

    if (missingColumns.length > 0 || missingIndexes.length > 0) {
      throw new Error(
        [
          "The existing schema does not match the FleetMonitor migration baseline.",
          missingColumns.length > 0 ? `Missing columns: ${missingColumns.join(", ")}.` : "",
          missingIndexes.length > 0 ? `Missing indexes: ${missingIndexes.join(", ")}.` : "",
          "Restore a backup or migrate the schema explicitly before baselining.",
        ]
          .filter(Boolean)
          .join(" "),
      );
    }

    await client.begin(async (transaction) => {
      await transaction`CREATE SCHEMA IF NOT EXISTS drizzle`;
      await transaction`
        CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
          id SERIAL PRIMARY KEY,
          hash TEXT NOT NULL,
          created_at BIGINT
        )
      `;
      const [existing] = await transaction`
        SELECT id FROM drizzle.__drizzle_migrations LIMIT 1
      `;
      if (existing) {
        throw new Error("Migration history appeared while baselining; no changes were made");
      }
      await transaction`
        INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
        VALUES (${initialMigration.hash}, ${initialMigration.folderMillis})
      `;
    });

    console.log("Existing FleetMonitor schema verified and migration baseline recorded.");
  }
} finally {
  await client.end();
}
