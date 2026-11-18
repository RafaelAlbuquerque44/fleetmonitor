import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "./index";
import {
  companies,
  drivers,
  fuelRecords,
  maintenanceRecords,
  tireEvents,
  tires,
  vehicles,
} from "./schema";
import { withTenantTransaction } from "./tenant";

const companyName = process.env.DEMO_COMPANY_NAME?.trim();
const demoMarker = "[DEMO-SEED-v1]";

if (process.env.NODE_ENV === "production") {
  throw new Error("Demo record seeding is disabled in production");
}
if (!companyName) {
  throw new Error("Set DEMO_COMPANY_NAME to the exact name of the demo company");
}

function dateDaysAgo(days: number) {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

function dateAtNoon(value: string) {
  return new Date(`${value}T12:00:00.000Z`);
}

try {
  const [company] = await db
    .select({ id: companies.id })
    .from(companies)
    .where(eq(companies.name, companyName))
    .limit(1);

  if (!company) {
    throw new Error(`Demo company "${companyName}" was not found; no records were inserted`);
  }

  const counts = await withTenantTransaction(company.id, async (transaction) => {
    const companyVehicles = await transaction
      .select({
        id: vehicles.id,
        plate: vehicles.plate,
      })
      .from(vehicles)
      .where(eq(vehicles.companyId, company.id))
      .orderBy(asc(vehicles.id));
    const activeDrivers = await transaction
      .select({ id: drivers.id })
      .from(drivers)
      .where(and(eq(drivers.companyId, company.id), eq(drivers.status, "active")))
      .orderBy(asc(drivers.id));

    if (companyVehicles.length < 3 || activeDrivers.length === 0) {
      throw new Error("The demo company needs at least three vehicles and one active driver");
    }

    const demoVehicles = companyVehicles.slice(0, 3);
    const driverId = activeDrivers[0]?.id;
    if (driverId === undefined) throw new Error("No active demo driver was found");
    const existingCompanyFuel = await transaction
      .select({ vehicleId: fuelRecords.vehicleId, route: fuelRecords.route })
      .from(fuelRecords)
      .where(eq(fuelRecords.companyId, company.id));
    const vehiclesWithFuel = new Set(existingCompanyFuel.map((record) => record.vehicleId));

    let fuelInserted = 0;

    for (const vehicle of demoVehicles) {
      if (vehiclesWithFuel.has(vehicle.id)) continue;
      const baseOdometer = 42000 + vehicle.id * 1500;
      const rows = [60, 30, 0].map((daysAgo, index) => ({
        companyId: company.id,
        vehicleId: vehicle.id,
        driverId,
        litersMilliliters: [76000, 82000, 79000][index] ?? 80000,
        amountCents: [501600, 541200, 521400][index] ?? 528000,
        occurredAt: dateDaysAgo(daysAgo),
        odometerKm: baseOdometer + index * 480,
        station: ["Posto Central", "Auto Posto Rodovia", "Posto Estrada"][index] ?? "Posto Central",
        route: `${demoMarker} fuel:${vehicle.plate}:${daysAgo}`,
      }));
      await transaction.insert(fuelRecords).values(rows);
      fuelInserted += rows.length;
    }

    const demoProblems = [
      `${demoMarker} Revisão preventiva: troca de óleo e filtros`,
      `${demoMarker} Inspeção do sistema de freios`,
      `${demoMarker} Verificação de suspensão e alinhamento`,
    ];
    const existingProblems = await transaction
      .select({ problem: maintenanceRecords.problem })
      .from(maintenanceRecords)
      .where(and(
        eq(maintenanceRecords.companyId, company.id),
        inArray(maintenanceRecords.problem, demoProblems),
      ));
    const existingDemoProblems = new Set(existingProblems.map((record) => record.problem));
    let maintenanceInserted = 0;
    const maintenanceSamples = demoVehicles.flatMap((vehicle, index) => {
      const problem = demoProblems[index];
      if (!problem || existingDemoProblems.has(problem)) return [];
      const completed = index === 0;
      return [{
        companyId: company.id,
        vehicleId: vehicle.id,
        problem,
        responsible: ["Oficina FleetMonitor", "Equipe de manutenção", "João da Silva"][index] ?? "Equipe de manutenção",
        dueAt: dateDaysAgo(index === 0 ? 50 : 0),
        partsUsed: completed ? "Óleo, filtro de óleo e filtro de ar" : null,
        status: completed ? "completed" as const : index === 1 ? "in_progress" as const : "open" as const,
        occurredAt: dateDaysAgo(index === 0 ? 60 : index === 1 ? 7 : 2),
        startedAt: dateAtNoon(dateDaysAgo(index === 0 ? 60 : index === 1 ? 7 : 2)),
        completedAt: completed ? dateAtNoon(dateDaysAgo(58)) : null,
      }];
    });
    if (maintenanceSamples.length > 0) {
      await transaction.insert(maintenanceRecords).values(maintenanceSamples);
      maintenanceInserted = maintenanceSamples.length;
    }

    const existingTires = await transaction
      .select({
        id: tires.id,
        vehicleId: tires.vehicleId,
        position: tires.position,
        brand: tires.brand,
        removedAt: tires.removedAt,
      })
      .from(tires)
      .where(eq(tires.companyId, company.id));
    const occupiedPositions = new Set(
      existingTires
        .filter((tire) => tire.removedAt === null)
        .map((tire) => `${tire.vehicleId}:${tire.position}`),
    );
    const seededTires = new Set(
      existingTires
        .filter((tire) => tire.brand.startsWith(demoMarker))
        .map((tire) => `${tire.vehicleId}:${tire.position}`),
    );
    const positions = ["Dianteiro esquerdo", "Dianteiro direito"];
    let tiresInserted = 0;
    let tireEventsInserted = 0;

    for (const vehicle of demoVehicles) {
      for (const [positionIndex, position] of positions.entries()) {
        const key = `${vehicle.id}:${position}`;
        if (occupiedPositions.has(key) || seededTires.has(key)) continue;

        const baseOdometer = 42000 + vehicle.id * 1500;
        const installedAt = dateDaysAgo(180);
        const replacedAt = dateDaysAgo(90);
        const [oldTire] = await transaction
          .insert(tires)
          .values({
            companyId: company.id,
            vehicleId: vehicle.id,
            position,
            brand: `${demoMarker} Pirelli`,
            installedAt: dateDaysAgo(540),
            installedOdometerKm: baseOdometer - 18000,
            removedAt: replacedAt,
            removedOdometerKm: baseOdometer - 9000,
          })
          .returning({ id: tires.id });
        const [currentTire] = await transaction
          .insert(tires)
          .values({
            companyId: company.id,
            vehicleId: vehicle.id,
            position,
            brand: `${demoMarker} Michelin`,
            installedAt,
            installedOdometerKm: baseOdometer - 9000,
          })
          .returning({ id: tires.id });
        if (!oldTire || !currentTire) throw new Error("Could not create the demo tire history");

        await transaction.insert(tireEvents).values([
          {
            companyId: company.id,
            vehicleId: vehicle.id,
            tireId: oldTire.id,
            type: "installation",
            description: `${demoMarker} Instalação do pneu`,
            occurredAt: dateDaysAgo(540),
            odometerKm: baseOdometer - 18000,
          },
          {
            companyId: company.id,
            vehicleId: vehicle.id,
            tireId: oldTire.id,
            type: "replacement",
            description: `${demoMarker} Substituição por desgaste`,
            occurredAt: replacedAt,
            odometerKm: baseOdometer - 9000,
          },
          {
            companyId: company.id,
            vehicleId: vehicle.id,
            tireId: currentTire.id,
            type: "installation",
            description: `${demoMarker} Instalação do pneu substituto`,
            occurredAt: installedAt,
            odometerKm: baseOdometer - 9000,
          },
          {
            companyId: company.id,
            vehicleId: vehicle.id,
            tireId: currentTire.id,
            type: "inspection",
            description: `${demoMarker} Inspeção de pressão e desgaste`,
            occurredAt: dateDaysAgo(0),
            odometerKm: baseOdometer + 500 + positionIndex * 100,
          },
        ]);
        tiresInserted += 2;
        tireEventsInserted += 4;
      }
    }

    return { fuelInserted, maintenanceInserted, tiresInserted, tireEventsInserted };
  });

  console.log(
    `Demo records for "${companyName}": ${counts.fuelInserted} fuel, ` +
    `${counts.maintenanceInserted} maintenance, ${counts.tiresInserted} tires, ` +
    `${counts.tireEventsInserted} tire history events inserted.`,
  );
} finally {
  await db.$client.end();
}
