import { db } from "./index";
import { authUsers, companies } from "./schema";

if (process.env.NODE_ENV !== "development") {
  throw new Error("The demo seed can only run when NODE_ENV is development");
}

const demoEmail = process.env.DEMO_ADMIN_EMAIL?.trim().toLowerCase();
const demoPassword = process.env.DEMO_ADMIN_PASSWORD;
const demoCompanyName = process.env.DEMO_COMPANY_NAME?.trim();

if (!demoEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(demoEmail)) {
  throw new Error("Set DEMO_ADMIN_EMAIL to a valid email address");
}
if (!demoPassword || demoPassword.length < 20) {
  throw new Error(
    "Set DEMO_ADMIN_PASSWORD to a randomly generated password of at least 20 characters",
  );
}
if (!demoCompanyName) {
  throw new Error("Set DEMO_COMPANY_NAME to a non-empty company name");
}

const passwordHash = await Bun.password.hash(demoPassword);
const [company] = await db
  .insert(companies)
  .values({ name: demoCompanyName })
  .onConflictDoUpdate({
    target: companies.name,
    set: { name: demoCompanyName },
  })
  .returning({ id: companies.id });

if (!company) {
  throw new Error("Company upsert returned no row");
}

await db
  .insert(authUsers)
  .values({
    email: demoEmail,
    companyId: company.id,
    companyName: demoCompanyName,
    passwordHash,
  })
  .onConflictDoUpdate({
    target: authUsers.email,
    set: {
      companyId: company.id,
      companyName: demoCompanyName,
      passwordHash,
    },
  });
console.log(`Demo administrator credentials configured for ${demoEmail}`);
process.exit(0);
