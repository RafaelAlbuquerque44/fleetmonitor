import { db } from "./index";
import { authUsers } from "./schema";

const demoEmail = process.env.DEMO_ADMIN_EMAIL ?? "admin@empresa.com";
const demoPassword = process.env.DEMO_ADMIN_PASSWORD ?? "1234";
const demoCompanyName = process.env.DEMO_COMPANY_NAME ?? "Empresa Demo";

const passwordHash = await Bun.password.hash(demoPassword);

await db
  .insert(authUsers)
  .values({
    email: demoEmail.trim().toLowerCase(),
    companyName: demoCompanyName,
    passwordHash,
  })
  .onConflictDoUpdate({
    target: authUsers.email,
    set: { companyName: demoCompanyName, passwordHash },
  });
console.log(`Seeded demo administrator: ${demoEmail.trim().toLowerCase()}`);
process.exit(0);
