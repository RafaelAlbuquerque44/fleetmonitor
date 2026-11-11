import { sql } from "drizzle-orm";
import type { ExtractTablesWithRelations } from "drizzle-orm";
import type { PostgresJsTransaction } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
import { db } from "./index";

export type TenantTransaction = PostgresJsTransaction<
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;

export async function withTenantTransaction<T>(
  companyId: number,
  operation: (transaction: TenantTransaction) => Promise<T>,
): Promise<T> {
  if (!Number.isSafeInteger(companyId) || companyId < 1) {
    throw new Error("A valid company ID is required for tenant-scoped database access");
  }

  return db.transaction(async (transaction) => {
    await transaction.execute(
      sql`select set_config('app.company_id', ${String(companyId)}, true)`,
    );
    return operation(transaction);
  });
}
