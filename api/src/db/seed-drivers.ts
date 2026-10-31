import { eq } from "drizzle-orm";
import { db } from "./index";
import { demoDrivers } from "./demo-drivers";
import { companies, drivers } from "./schema";

const companyName = process.env.DRIVER_DEMO_COMPANY_NAME?.trim();
if (!companyName) {
  throw new Error("Set DRIVER_DEMO_COMPANY_NAME to the exact demo company name");
}

try {
  const [company] = await db
    .select({ id: companies.id })
    .from(companies)
    .where(eq(companies.name, companyName))
    .limit(1);

  if (!company) {
    throw new Error(`Demo company "${companyName}" was not found`);
  }

  const inserted = await db
    .insert(drivers)
    .values(demoDrivers.map((driver) => ({ ...driver, companyId: company.id })))
    .onConflictDoNothing({
      target: [drivers.companyId, drivers.cpf],
    })
    .returning({ id: drivers.id });

  console.log(
    `Demo drivers for "${companyName}": ${inserted.length} added, ${demoDrivers.length - inserted.length} already existed.`,
  );
} finally {
  await db.$client.end();
}
