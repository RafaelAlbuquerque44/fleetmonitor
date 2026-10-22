import { eq } from "drizzle-orm";
import { db } from "./index";
import { authUsers, companies, vehicles } from "./schema";

if (process.env.NODE_ENV !== "production") {
  throw new Error("Public demo provisioning is only available in production");
}
if (process.env.PUBLIC_DEMO_SEED_ENABLED !== "true") {
  throw new Error("Set PUBLIC_DEMO_SEED_ENABLED=true to provision the public demo");
}

const email = process.env.PUBLIC_DEMO_EMAIL?.trim().toLowerCase();
const password = process.env.PUBLIC_DEMO_PASSWORD;
const companyName = process.env.PUBLIC_DEMO_COMPANY_NAME?.trim();

if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
  throw new Error("Set PUBLIC_DEMO_EMAIL to a valid email address");
}
if (!password || password.length < 32) {
  throw new Error(
    "Set PUBLIC_DEMO_PASSWORD to a randomly generated password of at least 32 characters",
  );
}
if (!companyName) {
  throw new Error("Set PUBLIC_DEMO_COMPANY_NAME to a non-empty, dedicated company name");
}

const passwordHash = await Bun.password.hash(password);
const demoVehicles = [
  { plate: "FMO1N01", make: "Fiat", model: "Ducato", year: 2024, status: "operational" as const },
  { plate: "FMO1N02", make: "Volkswagen", model: "Delivery 11.180", year: 2023, status: "operational" as const },
  { plate: "FMO1N03", make: "Mercedes-Benz", model: "Sprinter", year: 2025, status: "operational" as const },
  { plate: "FMO1N04", make: "Iveco", model: "Daily", year: 2022, status: "operational" as const },
  { plate: "FMO1N05", make: "Fiat", model: "Strada", year: 2024, status: "operational" as const },
  { plate: "FMO1N06", make: "Renault", model: "Master", year: 2023, status: "operational" as const },
  { plate: "FMO1N07", make: "Chevrolet", model: "S10", year: 2021, status: "operational" as const },
  { plate: "FMO1N08", make: "Ford", model: "Transit", year: 2022, status: "maintenance" as const },
  { plate: "FMO1N09", make: "Volkswagen", model: "Saveiro", year: 2021, status: "maintenance" as const },
  { plate: "FMO1N10", make: "Toyota", model: "Hilux", year: 2020, status: "inactive" as const },
];

try {
  await db.transaction(async (tx) => {
    const [company] = await tx
      .insert(companies)
      .values({ name: companyName })
      .onConflictDoUpdate({
        target: companies.name,
        set: { name: companyName },
      })
      .returning({ id: companies.id });

    if (!company) {
      throw new Error("Public demo company upsert returned no row");
    }

    const [existingUser] = await tx
      .select({
        id: authUsers.id,
        companyId: authUsers.companyId,
      })
      .from(authUsers)
      .where(eq(authUsers.email, email))
      .limit(1);

    if (existingUser && existingUser.companyId !== company.id) {
      throw new Error(
        "PUBLIC_DEMO_EMAIL already belongs to a user outside the dedicated demo company",
      );
    }

    await tx
      .insert(vehicles)
      .values(demoVehicles.map((vehicle) => ({ ...vehicle, companyId: company.id })))
      .onConflictDoNothing({
        target: [vehicles.companyId, vehicles.plate],
      });

    if (existingUser) {
      await tx
        .update(authUsers)
        .set({ passwordHash, companyName, readOnly: false })
        .where(eq(authUsers.id, existingUser.id));
    } else {
      await tx.insert(authUsers).values({
        email,
        companyId: company.id,
        companyName,
        passwordHash,
        readOnly: false,
      });
    }
  });
} finally {
  await db.$client.end();
}

console.log(`Public demo provisioned with vehicle management enabled for ${email}`);
