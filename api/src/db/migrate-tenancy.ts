import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const demoCompanyName = (process.env.DEMO_COMPANY_NAME ?? "Empresa Demo").trim();
if (demoCompanyName.length === 0) {
  throw new Error("DEMO_COMPANY_NAME must not be empty");
}

const client = postgres(databaseUrl);

try {
  await client.begin(async (transaction) => {
    await transaction`
      CREATE TABLE IF NOT EXISTS companies (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        CONSTRAINT companies_name_unique UNIQUE (name),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `;

    await transaction`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'companies_name_key'
            AND conrelid = 'companies'::regclass
        ) AND NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'companies_name_unique'
            AND conrelid = 'companies'::regclass
        ) THEN
          ALTER TABLE companies
          RENAME CONSTRAINT companies_name_key TO companies_name_unique;
        END IF;
      END
      $$
    `;

    const [tables] = await transaction`
      SELECT
        to_regclass('public.auth_users') IS NOT NULL AS has_auth_users,
        to_regclass('public.vehicles') IS NOT NULL AS has_vehicles
    `;

    if (!tables || (!tables.has_auth_users && !tables.has_vehicles)) {
      return;
    }

    if (!tables.has_auth_users || !tables.has_vehicles) {
      throw new Error(
        "Cannot migrate tenant ownership: auth_users and vehicles must both exist",
      );
    }

    await transaction`
      INSERT INTO companies (name)
      SELECT DISTINCT company_name
      FROM auth_users
      WHERE company_name IS NOT NULL
      ON CONFLICT (name) DO NOTHING
    `;

    await transaction`
      INSERT INTO companies (name)
      VALUES (${demoCompanyName})
      ON CONFLICT (name) DO NOTHING
    `;

    await transaction`
      ALTER TABLE auth_users
      ADD COLUMN IF NOT EXISTS company_id INTEGER
    `;
    await transaction`
      ALTER TABLE vehicles
      ADD COLUMN IF NOT EXISTS company_id INTEGER
    `;

    await transaction`
      UPDATE auth_users AS users
      SET company_id = companies.id
      FROM companies
      WHERE users.company_id IS NULL
        AND companies.name = users.company_name
    `;

    const [demoCompany] = await transaction`
      SELECT id FROM companies WHERE name = ${demoCompanyName}
    `;
    if (!demoCompany) {
      throw new Error("Configured demo company was not created");
    }

    await transaction`
      UPDATE vehicles
      SET company_id = ${demoCompany.id}
      WHERE company_id IS NULL
    `;

    await transaction`
      ALTER TABLE auth_users
      ALTER COLUMN company_id SET NOT NULL
    `;
    await transaction`
      ALTER TABLE vehicles
      ALTER COLUMN company_id SET NOT NULL
    `;

    await transaction`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'auth_users_company_id_companies_id_fk'
            AND conrelid = 'auth_users'::regclass
        ) THEN
          ALTER TABLE auth_users
          ADD CONSTRAINT auth_users_company_id_companies_id_fk
          FOREIGN KEY (company_id) REFERENCES companies(id);
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'vehicles_company_id_companies_id_fk'
            AND conrelid = 'vehicles'::regclass
        ) THEN
          ALTER TABLE vehicles
          ADD CONSTRAINT vehicles_company_id_companies_id_fk
          FOREIGN KEY (company_id) REFERENCES companies(id);
        END IF;
      END
      $$
    `;

    await transaction`
      CREATE INDEX IF NOT EXISTS auth_users_company_id_idx
      ON auth_users (company_id)
    `;
    await transaction`
      CREATE INDEX IF NOT EXISTS vehicles_company_id_idx
      ON vehicles (company_id)
    `;
    await transaction`
      ALTER TABLE vehicles
      DROP CONSTRAINT IF EXISTS vehicles_plate_unique
    `;
    await transaction`
      CREATE UNIQUE INDEX IF NOT EXISTS vehicles_company_id_plate_unique
      ON vehicles (company_id, plate)
    `;
  });
} finally {
  await client.end();
}
