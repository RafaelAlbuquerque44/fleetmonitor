import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const batchSize = 1000;
const client = postgres(databaseUrl, { max: 1 });
let deletedCount = 0;

try {
  while (true) {
    const deleted = await client`
      DELETE FROM auth_sessions
      WHERE id IN (
        SELECT id
        FROM auth_sessions
        WHERE expires_at <= now()
        ORDER BY expires_at
        LIMIT ${batchSize}
      )
      RETURNING id
    `;
    deletedCount += deleted.length;
    if (deleted.length < batchSize) {
      break;
    }
  }
} finally {
  await client.end();
}

console.log(`Expired sessions removed: ${deletedCount}`);
