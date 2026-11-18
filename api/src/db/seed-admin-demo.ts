import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "./index";
import {
  authUsers,
  companies,
  drivers,
  fuelRecords,
  maintenanceRecords,
  tireEvents,
  tires,
  vehicles,
} from "./schema";
import { withTenantTransaction } from "./tenant";

const adminEmail = process.env.ADMIN_DEMO_EMAIL?.trim().toLowerCase() || "admin@fleetmonitor.com";
const adminPassword = process.env.ADMIN_DEMO_PASSWORD || "admin";
const defaultCompanyName = process.env.DEMO_COMPANY_NAME?.trim() || "FleetMonitor Demo";

if (process.env.NODE_ENV === "production") {
  throw new Error("The admin demo seed is disabled in production");
}
const databaseHost = new URL(process.env.DATABASE_URL ?? "postgres://invalid").hostname;
if (!["localhost", "127.0.0.1", "postgres"].includes(databaseHost)) {
  throw new Error("The admin demo seed only runs against a local database");
}

type VehicleStatus = (typeof vehicles.$inferSelect)["status"];

const dayMs = 24 * 60 * 60 * 1000;
const todayUtc = new Date();
todayUtc.setUTCHours(0, 0, 0, 0);

function dateDaysAgo(days: number) {
  return new Date(todayUtc.getTime() - days * dayMs).toISOString().slice(0, 10);
}

function dateDaysFromNow(days: number) {
  return dateDaysAgo(-days);
}

function noonOf(date: string) {
  return new Date(`${date}T12:00:00.000Z`);
}

function seeded(seed: number) {
  let state = seed * 9301 + 49297;
  return () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
}

type FleetPlan = {
  plate: string;
  make: string;
  model: string;
  year: number;
  status: VehicleStatus;
  kmpl: number;
  worseLast?: number;
  baseOdometer: number;
};

const fleet: FleetPlan[] = [
  { plate: "TRK1A01", make: "Volkswagen", model: "Delivery 11.180", year: 2023, status: "operational", kmpl: 5.2, baseOdometer: 48200 },
  { plate: "TRK1A02", make: "Mercedes-Benz", model: "Atego 1719", year: 2022, status: "maintenance_completed", kmpl: 4.6, baseOdometer: 71300 },
  { plate: "TRK1A03", make: "Volvo", model: "VM 270", year: 2021, status: "maintenance", kmpl: 3.4, worseLast: 0.74, baseOdometer: 96800 },
  { plate: "TRK1A04", make: "Scania", model: "P 280", year: 2020, status: "stopped", kmpl: 3.6, baseOdometer: 143500 },
  { plate: "DFM2B34", make: "Volkswagen", model: "Constellation 24.280", year: 2022, status: "maintenance", kmpl: 3.1, worseLast: 0.78, baseOdometer: 88400 },
  { plate: "GHT4D56", make: "Volvo", model: "FH 540", year: 2021, status: "operational", kmpl: 2.9, worseLast: 0.76, baseOdometer: 168900 },
  { plate: "JKL5E67", make: "Scania", model: "R 450", year: 2024, status: "in_operation", kmpl: 3.3, baseOdometer: 31200 },
  { plate: "MNP6F78", make: "DAF", model: "XF 480", year: 2022, status: "in_operation", kmpl: 3.0, baseOdometer: 112700 },
  { plate: "QRS7G89", make: "Iveco", model: "Tector 24-280", year: 2020, status: "inactive", kmpl: 3.5, baseOdometer: 201400 },
  { plate: "FLE3C45", make: "Mercedes-Benz", model: "Actros 2651", year: 2023, status: "in_operation", kmpl: 2.8, baseOdometer: 54600 },
  { plate: "PLT8H90", make: "Volvo", model: "FM 460", year: 2023, status: "in_operation", kmpl: 3.2, baseOdometer: 39800 },
  { plate: "RTU9J12", make: "Scania", model: "G 410", year: 2021, status: "waiting_part", kmpl: 3.4, baseOdometer: 127300 },
  { plate: "VWX0K34", make: "Mercedes-Benz", model: "Accelo 1016", year: 2022, status: "operational", kmpl: 7.4, baseOdometer: 66200 },
  { plate: "YZA1L56", make: "Iveco", model: "Daily 70C17", year: 2023, status: "waiting_service", kmpl: 8.1, baseOdometer: 42100 },
];

const routes = [
  "São Paulo → Campinas",
  "Campinas → Ribeirão Preto",
  "São Paulo → Santos",
  "São Paulo → Curitiba",
  "Curitiba → Florianópolis",
  "Belo Horizonte → Vitória",
  "Rio de Janeiro → São Paulo",
  "Goiânia → Brasília",
];
const stations = ["Posto Ipiranga BR-116", "Posto Shell Anhanguera", "Posto Petrobras Régis", "Auto Posto Graal", "Posto Ale Dutra"];

type MaintenancePlan = {
  plate: string;
  problem: string;
  responsible: string;
  status: "open" | "in_progress" | "waiting_part" | "waiting_service" | "completed";
  startedDaysAgo: number;
  dueInDays: number | null;
  resolvedAfterDays?: number;
  parts: string | null;
};

const maintenancePlans: MaintenancePlan[] = [
  { plate: "TRK1A03", problem: "Troca de óleo e filtros", responsible: "Oficina Central", status: "completed", startedDaysAgo: 150, dueInDays: null, resolvedAfterDays: 1, parts: "Óleo 15W40, filtro de óleo, filtro de ar" },
  { plate: "TRK1A03", problem: "Vazamento de óleo no cabeçote", responsible: "Oficina Central", status: "completed", startedDaysAgo: 95, dueInDays: null, resolvedAfterDays: 3, parts: "Junta do cabeçote, retentor" },
  { plate: "TRK1A03", problem: "Vazamento de óleo no motor", responsible: "Mecânica Rodrigues", status: "completed", startedDaysAgo: 40, dueInDays: null, resolvedAfterDays: 4, parts: "Retentor traseiro, junta do cárter" },
  { plate: "TRK1A03", problem: "Troca de pastilhas e discos de freio", responsible: "Oficina Central", status: "in_progress", startedDaysAgo: 6, dueInDays: 3, parts: "Pastilhas de freio, discos dianteiros" },
  { plate: "DFM2B34", problem: "Falha no sistema de arrefecimento", responsible: "Mecânica Rodrigues", status: "open", startedDaysAgo: 20, dueInDays: -5, parts: null },
  { plate: "DFM2B34", problem: "Alinhamento e balanceamento", responsible: "Pneus & Cia", status: "completed", startedDaysAgo: 110, dueInDays: null, resolvedAfterDays: 1, parts: "Contrapesos" },
  { plate: "RTU9J12", problem: "Substituição de turbocompressor", responsible: "Concessionária Scania", status: "waiting_part", startedDaysAgo: 12, dueInDays: 5, parts: null },
  { plate: "YZA1L56", problem: "Revisão de 100.000 km", responsible: "Concessionária Iveco", status: "waiting_service", startedDaysAgo: 4, dueInDays: 7, parts: null },
  { plate: "TRK1A02", problem: "Troca de embreagem", responsible: "Oficina Central", status: "completed", startedDaysAgo: 9, dueInDays: null, resolvedAfterDays: 4, parts: "Kit de embreagem, atuador" },
  { plate: "GHT4D56", problem: "Alinhamento e balanceamento", responsible: "Pneus & Cia", status: "completed", startedDaysAgo: 60, dueInDays: null, resolvedAfterDays: 1, parts: "Contrapesos" },
  { plate: "GHT4D56", problem: "Troca de pneus traseiros", responsible: "Pneus & Cia", status: "completed", startedDaysAgo: 25, dueInDays: null, resolvedAfterDays: 2, parts: "Pneu 295/80 R22.5" },
  { plate: "JKL5E67", problem: "Troca de óleo e filtros", responsible: "Oficina Central", status: "completed", startedDaysAgo: 45, dueInDays: null, resolvedAfterDays: 1, parts: "Óleo 10W40, filtro de óleo" },
  { plate: "MNP6F78", problem: "Revisão preventiva 50.000 km", responsible: "Concessionária DAF", status: "completed", startedDaysAgo: 90, dueInDays: null, resolvedAfterDays: 2, parts: "Filtros, correia, fluido de freio" },
  { plate: "FLE3C45", problem: "Substituição de bateria", responsible: "Auto Elétrica Silva", status: "completed", startedDaysAgo: 40, dueInDays: null, resolvedAfterDays: 1, parts: "Bateria 150Ah" },
  { plate: "PLT8H90", problem: "Troca da correia do alternador", responsible: "Oficina Central", status: "completed", startedDaysAgo: 100, dueInDays: null, resolvedAfterDays: 1, parts: "Correia poly-V" },
  { plate: "TRK1A01", problem: "Troca de lâmpadas e faróis", responsible: "Auto Elétrica Silva", status: "completed", startedDaysAgo: 33, dueInDays: null, resolvedAfterDays: 1, parts: "Lâmpadas H7, farol auxiliar" },
  { plate: "TRK1A04", problem: "Reparo no câmbio", responsible: "Câmbios Paulista", status: "completed", startedDaysAgo: 150, dueInDays: null, resolvedAfterDays: 8, parts: "Kit de sincronizadores" },
];

type TireSpec = {
  plate: string;
  position: string;
  brand: string;
  activeUsageKm: number;
  previous?: { brand: string; usageKm: number; reason: string };
  problems?: string[];
};

const positions = ["Dianteiro esquerdo", "Dianteiro direito", "Traseiro esquerdo", "Traseiro direito"];
const tireSpecs: TireSpec[] = [
  { plate: "TRK1A01", position: positions[0] as string, brand: "Pirelli", activeUsageKm: 50400 },
  { plate: "TRK1A01", position: positions[1] as string, brand: "Pirelli", activeUsageKm: 34800 },
  { plate: "TRK1A01", position: positions[2] as string, brand: "Michelin", activeUsageKm: 22300 },
  { plate: "TRK1A01", position: positions[3] as string, brand: "Michelin", activeUsageKm: 22300 },
  { plate: "TRK1A03", position: positions[0] as string, brand: "Bridgestone", activeUsageKm: 28600 },
  { plate: "TRK1A03", position: positions[1] as string, brand: "Goodyear", activeUsageKm: 9200, previous: { brand: "Goodyear", usageKm: 21000, reason: "Bolha na lateral do pneu." }, problems: ["Desgaste irregular na borda externa."] },
  { plate: "TRK1A03", position: positions[2] as string, brand: "Bridgestone", activeUsageKm: 41200 },
  { plate: "TRK1A03", position: positions[3] as string, brand: "Bridgestone", activeUsageKm: 41200 },
  { plate: "DFM2B34", position: positions[0] as string, brand: "Continental", activeUsageKm: 37400 },
  { plate: "DFM2B34", position: positions[1] as string, brand: "Continental", activeUsageKm: 37400 },
  { plate: "DFM2B34", position: positions[2] as string, brand: "Pirelli", activeUsageKm: 6800, previous: { brand: "Pirelli", usageKm: 31000, reason: "Corte na banda de rodagem." } },
  { plate: "DFM2B34", position: positions[3] as string, brand: "Pirelli", activeUsageKm: 6800, previous: { brand: "Pirelli", usageKm: 58200, reason: "Fim da vida útil." } },
  { plate: "GHT4D56", position: positions[0] as string, brand: "Michelin", activeUsageKm: 47800 },
  { plate: "GHT4D56", position: positions[1] as string, brand: "Michelin", activeUsageKm: 47800 },
  { plate: "GHT4D56", position: positions[2] as string, brand: "Goodyear", activeUsageKm: 64500, problems: ["Sulcos abaixo do limite legal.", "Desgaste acentuado no ombro."] },
  { plate: "GHT4D56", position: positions[3] as string, brand: "Goodyear", activeUsageKm: 61200, problems: ["Perda de pressão recorrente."] },
  { plate: "JKL5E67", position: positions[0] as string, brand: "Michelin", activeUsageKm: 14100 },
  { plate: "JKL5E67", position: positions[1] as string, brand: "Michelin", activeUsageKm: 14100 },
  { plate: "JKL5E67", position: positions[2] as string, brand: "Michelin", activeUsageKm: 14100 },
  { plate: "JKL5E67", position: positions[3] as string, brand: "Michelin", activeUsageKm: 14100 },
  { plate: "MNP6F78", position: positions[0] as string, brand: "Bridgestone", activeUsageKm: 39700 },
  { plate: "MNP6F78", position: positions[1] as string, brand: "Bridgestone", activeUsageKm: 39700 },
  { plate: "MNP6F78", position: positions[2] as string, brand: "Pirelli", activeUsageKm: 12500, previous: { brand: "Bridgestone", usageKm: 59400, reason: "Fim da vida útil." } },
  { plate: "MNP6F78", position: positions[3] as string, brand: "Pirelli", activeUsageKm: 12500, previous: { brand: "Bridgestone", usageKm: 56800, reason: "Desgaste uniforme dentro do esperado." } },
  { plate: "FLE3C45", position: positions[0] as string, brand: "Continental", activeUsageKm: 19600 },
  { plate: "FLE3C45", position: positions[1] as string, brand: "Continental", activeUsageKm: 19600 },
  { plate: "FLE3C45", position: positions[2] as string, brand: "Continental", activeUsageKm: 19600 },
  { plate: "FLE3C45", position: positions[3] as string, brand: "Continental", activeUsageKm: 19600 },
  { plate: "PLT8H90", position: positions[0] as string, brand: "Goodyear", activeUsageKm: 27300 },
  { plate: "PLT8H90", position: positions[1] as string, brand: "Goodyear", activeUsageKm: 27300 },
  { plate: "RTU9J12", position: positions[0] as string, brand: "Pirelli", activeUsageKm: 52300 },
  { plate: "RTU9J12", position: positions[1] as string, brand: "Pirelli", activeUsageKm: 33100, problems: ["Vibração no volante acima de 80 km/h."] },
];

const kmPerDay = 60;

try {
  const [existingUser] = await db
    .select({ id: authUsers.id, companyId: authUsers.companyId })
    .from(authUsers)
    .where(eq(authUsers.email, adminEmail))
    .limit(1);

  let companyId = existingUser?.companyId;
  if (companyId === undefined) {
    const [company] = await db
      .insert(companies)
      .values({ name: defaultCompanyName })
      .onConflictDoUpdate({ target: companies.name, set: { name: defaultCompanyName } })
      .returning({ id: companies.id });
    if (!company) throw new Error("Company upsert returned no row");
    companyId = company.id;
  }
  const [company] = await db
    .select({ name: companies.name })
    .from(companies)
    .where(eq(companies.id, companyId))
    .limit(1);
  const companyName = company?.name ?? defaultCompanyName;

  const passwordHash = await Bun.password.hash(adminPassword);
  await db
    .insert(authUsers)
    .values({ email: adminEmail, companyId, companyName, passwordHash, readOnly: false })
    .onConflictDoUpdate({
      target: authUsers.email,
      set: { companyId, companyName, passwordHash, readOnly: false },
    });

  const summary = await withTenantTransaction(companyId, async (transaction) => {
    const scopedCompanyId = companyId as number;
    const plates = fleet.map((item) => item.plate);
    const existingVehicles = await transaction
      .select({ id: vehicles.id, plate: vehicles.plate })
      .from(vehicles)
      .where(and(eq(vehicles.companyId, scopedCompanyId), inArray(vehicles.plate, plates)));
    const vehicleIds = new Map(existingVehicles.map((vehicle) => [vehicle.plate, vehicle.id]));

    for (const item of fleet) {
      const values = { make: item.make, model: item.model, year: item.year, status: item.status };
      const id = vehicleIds.get(item.plate);
      if (id === undefined) {
        const [created] = await transaction
          .insert(vehicles)
          .values({ ...values, plate: item.plate, companyId: scopedCompanyId })
          .returning({ id: vehicles.id });
        if (!created) throw new Error(`Vehicle ${item.plate} insert returned no row`);
        vehicleIds.set(item.plate, created.id);
      } else {
        await transaction
          .update(vehicles)
          .set(values)
          .where(and(eq(vehicles.companyId, scopedCompanyId), eq(vehicles.id, id)));
      }
    }

    const activeDrivers = await transaction
      .select({ id: drivers.id })
      .from(drivers)
      .where(and(eq(drivers.companyId, scopedCompanyId), eq(drivers.status, "active")))
      .orderBy(asc(drivers.id));
    if (activeDrivers.length === 0) {
      throw new Error("The admin company needs at least one active driver; run db:seed:drivers first");
    }

    await transaction.delete(tireEvents).where(eq(tireEvents.companyId, scopedCompanyId));
    await transaction.delete(tires).where(eq(tires.companyId, scopedCompanyId));
    await transaction.delete(maintenanceRecords).where(eq(maintenanceRecords.companyId, scopedCompanyId));
    await transaction.delete(fuelRecords).where(eq(fuelRecords.companyId, scopedCompanyId));

    const finalOdometers = new Map<string, number>();
    const fuelRows: (typeof fuelRecords.$inferInsert)[] = [];
    const recordsPerVehicle = 8;
    fleet.forEach((item, index) => {
      const vehicleId = vehicleIds.get(item.plate);
      if (vehicleId === undefined) return;
      const random = seeded(index + 3);
      const lastRecordIndex = item.status === "inactive" ? 3 : recordsPerVehicle - 1;
      let odometer = item.baseOdometer;
      for (let step = 0; step <= lastRecordIndex; step += 1) {
        const isLastWorse = item.worseLast !== undefined && step >= lastRecordIndex - 1;
        const kmpl = item.kmpl * (0.96 + random() * 0.08) * (isLastWorse ? item.worseLast ?? 1 : 1);
        const distance = step === 0 ? 0 : Math.round((item.kmpl >= 7 ? 650 : 1250) + random() * (item.kmpl >= 7 ? 500 : 1100));
        odometer += distance;
        const liters = step === 0
          ? (item.kmpl >= 7 ? 70 : 180) + random() * 20
          : distance / kmpl;
        const pricePerLiter = 6.12 + random() * 0.38;
        fuelRows.push({
          companyId: scopedCompanyId,
          vehicleId,
          driverId: activeDrivers[(index + step) % activeDrivers.length]?.id ?? activeDrivers[0]?.id ?? 0,
          litersMilliliters: Math.round(liters * 1000),
          amountCents: Math.round(liters * pricePerLiter * 100),
          occurredAt: dateDaysAgo(
            item.status === "inactive"
              ? 200 - step * 28 + (index % 3)
              : 196 - step * 28 + (index % 3),
          ),
          odometerKm: odometer,
          station: stations[(index + step) % stations.length] ?? null,
          route: routes[(index * 3 + step) % routes.length] ?? "Rota local",
        });
      }
      finalOdometers.set(item.plate, odometer);
    });
    if (fuelRows.length > 0) await transaction.insert(fuelRecords).values(fuelRows);

    await transaction.insert(maintenanceRecords).values(
      maintenancePlans.map((plan) => {
        const occurredAt = dateDaysAgo(plan.startedDaysAgo);
        const vehicleId = vehicleIds.get(plan.plate);
        if (vehicleId === undefined) throw new Error(`Unknown demo vehicle ${plan.plate}`);
        return {
          companyId: scopedCompanyId,
          vehicleId,
          problem: plan.problem,
          responsible: plan.responsible,
          dueAt: plan.dueInDays === null ? null : dateDaysFromNow(plan.dueInDays),
          partsUsed: plan.parts,
          status: plan.status,
          occurredAt,
          startedAt: noonOf(occurredAt),
          completedAt: plan.status === "completed"
            ? noonOf(dateDaysAgo(plan.startedDaysAgo - (plan.resolvedAfterDays ?? 1)))
            : null,
        };
      }),
    );

    let tireCount = 0;
    let tireEventCount = 0;
    for (const spec of tireSpecs) {
      const vehicleId = vehicleIds.get(spec.plate);
      const finalOdometer = finalOdometers.get(spec.plate);
      if (vehicleId === undefined || finalOdometer === undefined) continue;
      const activeInstalledOdometer = Math.max(0, finalOdometer - spec.activeUsageKm);
      const activeInstalledAt = dateDaysAgo(Math.round(spec.activeUsageKm / kmPerDay));
      let previousTireId: number | null = null;

      if (spec.previous) {
        const previousInstalledOdometer = Math.max(0, activeInstalledOdometer - spec.previous.usageKm);
        const previousInstalledAt = dateDaysAgo(
          Math.round((spec.activeUsageKm + spec.previous.usageKm) / kmPerDay),
        );
        const [previous] = await transaction
          .insert(tires)
          .values({
            companyId: scopedCompanyId,
            vehicleId,
            position: spec.position,
            brand: spec.previous.brand,
            installedAt: previousInstalledAt,
            installedOdometerKm: previousInstalledOdometer,
            removedAt: activeInstalledAt,
            removedOdometerKm: activeInstalledOdometer,
          })
          .returning({ id: tires.id });
        if (!previous) throw new Error("Tire insert returned no row");
        previousTireId = previous.id;
        tireCount += 1;
        await transaction.insert(tireEvents).values([
          {
            companyId: scopedCompanyId,
            vehicleId,
            tireId: previous.id,
            type: "installation",
            description: `Instalação do pneu ${spec.previous.brand}.`,
            occurredAt: previousInstalledAt,
            odometerKm: previousInstalledOdometer,
          },
          {
            companyId: scopedCompanyId,
            vehicleId,
            tireId: previous.id,
            type: "problem",
            description: spec.previous.reason,
            occurredAt: dateDaysAgo(Math.round(spec.activeUsageKm / kmPerDay) + 3),
            odometerKm: Math.max(previousInstalledOdometer, activeInstalledOdometer - 200),
          },
          {
            companyId: scopedCompanyId,
            vehicleId,
            tireId: previous.id,
            type: "replacement",
            description: `Substituído por pneu ${spec.brand}.`,
            occurredAt: activeInstalledAt,
            odometerKm: activeInstalledOdometer,
          },
        ]);
        tireEventCount += 3;
      }

      const [active] = await transaction
        .insert(tires)
        .values({
          companyId: scopedCompanyId,
          vehicleId,
          position: spec.position,
          brand: spec.brand,
          installedAt: activeInstalledAt,
          installedOdometerKm: activeInstalledOdometer,
        })
        .returning({ id: tires.id });
      if (!active) throw new Error("Tire insert returned no row");
      tireCount += 1;

      const events: (typeof tireEvents.$inferInsert)[] = [
        {
          companyId: scopedCompanyId,
          vehicleId,
          tireId: active.id,
          type: "installation",
          description: `Instalação do pneu ${spec.brand}${previousTireId ? " após substituição" : ""}.`,
          occurredAt: activeInstalledAt,
          odometerKm: activeInstalledOdometer,
        },
      ];
      if (spec.activeUsageKm > 15000) {
        events.push({
          companyId: scopedCompanyId,
          vehicleId,
          tireId: active.id,
          type: "rotation",
          description: "Rodízio de pneus realizado na revisão.",
          occurredAt: dateDaysAgo(Math.round((spec.activeUsageKm / 2) / kmPerDay)),
          odometerKm: activeInstalledOdometer + Math.round(spec.activeUsageKm / 2),
        });
      }
      if (spec.activeUsageKm > 30000) {
        events.push({
          companyId: scopedCompanyId,
          vehicleId,
          tireId: active.id,
          type: "inspection",
          description: "Inspeção de sulcos e calibragem de pressão.",
          occurredAt: dateDaysAgo(12),
          odometerKm: Math.max(activeInstalledOdometer, finalOdometer - 600),
        });
      }
      (spec.problems ?? []).forEach((description, index) => {
        events.push({
          companyId: scopedCompanyId,
          vehicleId,
          tireId: active.id,
          type: "problem",
          description,
          occurredAt: dateDaysAgo(30 - index * 12),
          odometerKm: Math.max(activeInstalledOdometer, finalOdometer - (30 - index * 12) * 40),
        });
      });
      await transaction.insert(tireEvents).values(events);
      tireEventCount += events.length;
    }

    return {
      vehicles: fleet.length,
      fuelRecords: fuelRows.length,
      maintenanceRecords: maintenancePlans.length,
      tires: tireCount,
      tireEvents: tireEventCount,
    };
  });

  console.log(`Admin demo ready for ${adminEmail} (${companyName}):`, summary);
  process.exit(0);
} catch (error) {
  console.error(error);
  process.exit(1);
}
