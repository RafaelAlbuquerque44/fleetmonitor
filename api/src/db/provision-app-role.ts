import postgres from "postgres";

const databaseUrl =
  process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL;
const roleName = process.env.POSTGRES_APP_USER ?? "fleetmonitor_app";
const password = process.env.POSTGRES_APP_PASSWORD;

if (!databaseUrl) {
  throw new Error("MIGRATION_DATABASE_URL or DATABASE_URL is required");
}
if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(roleName)) {
  throw new Error("POSTGRES_APP_USER must be a valid PostgreSQL role name");
}
if (!password || password.length < 24) {
  throw new Error("Set POSTGRES_APP_PASSWORD to a secret of at least 24 characters");
}

const databaseName = decodeURIComponent(new URL(databaseUrl).pathname.slice(1));
if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(databaseName)) {
  throw new Error("The database name in the migration URL is invalid");
}

const quoteIdentifier = (value: string) => `"${value.replaceAll('"', '""')}"`;
const quoteLiteral = (value: string) => `'${value.replaceAll("'", "''")}'`;
const client = postgres(databaseUrl, { max: 1 });

try {
  const [adminRole] = await client`
    SELECT current_user AS name, rolsuper, rolcreaterole
    FROM pg_roles
    WHERE rolname = current_user
  `;
  if (!adminRole || (!adminRole.rolsuper && !adminRole.rolcreaterole)) {
    throw new Error("The migration connection must be allowed to provision database roles");
  }

  const [existingRole] = await client`
    SELECT rolname FROM pg_roles WHERE rolname = ${roleName}
  `;
  const role = quoteIdentifier(roleName);
  const rolePassword = quoteLiteral(password);
  if (existingRole) {
    await client.unsafe(
      `ALTER ROLE ${role} WITH LOGIN PASSWORD ${rolePassword} NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS`,
    );
  } else {
    await client.unsafe(
      `CREATE ROLE ${role} WITH LOGIN PASSWORD ${rolePassword} NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS`,
    );
  }

  await client.unsafe(
    `GRANT CONNECT ON DATABASE ${quoteIdentifier(databaseName)} TO ${role}`,
  );
  await client.unsafe(`GRANT USAGE ON SCHEMA public TO ${role}`);
  await client.unsafe(
    `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${role}`,
  );
  await client.unsafe(
    `GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${role}`,
  );
  await client.unsafe(
    `ALTER DEFAULT PRIVILEGES FOR ROLE ${quoteIdentifier(adminRole.name)} IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${role}`,
  );
  await client.unsafe(
    `ALTER DEFAULT PRIVILEGES FOR ROLE ${quoteIdentifier(adminRole.name)} IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO ${role}`,
  );

  const [verifiedRole] = await client`
    SELECT rolsuper, rolbypassrls
    FROM pg_roles
    WHERE rolname = ${roleName}
  `;
  if (!verifiedRole || verifiedRole.rolsuper || verifiedRole.rolbypassrls) {
    throw new Error("The application database role must not bypass row-level security");
  }

  console.log(`Application database role "${roleName}" is provisioned without RLS bypass.`);
} finally {
  await client.end();
}
