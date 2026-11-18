import { and, asc, desc, eq } from "drizzle-orm";
import { drivers, fuelRecords, vehicles } from "./schema";
import { withTenantTransaction } from "./tenant";
import type { FuelRecordInput } from "../routes/fleet-records.validation";

export async function listCompanyFuelRecords(companyId: number) {
  return withTenantTransaction(companyId, async (transaction) => {
    const records = await transaction
      .select({
        id: fuelRecords.id,
        vehicleId: fuelRecords.vehicleId,
        vehiclePlate: vehicles.plate,
        driverName: drivers.fullName,
        litersMilliliters: fuelRecords.litersMilliliters,
        amountCents: fuelRecords.amountCents,
        occurredAt: fuelRecords.occurredAt,
        odometerKm: fuelRecords.odometerKm,
        station: fuelRecords.station,
        route: fuelRecords.route,
      })
      .from(fuelRecords)
      .innerJoin(
        vehicles,
        and(eq(vehicles.companyId, companyId), eq(vehicles.id, fuelRecords.vehicleId)),
      )
      .innerJoin(
        drivers,
        and(eq(drivers.companyId, companyId), eq(drivers.id, fuelRecords.driverId)),
      )
      .where(eq(fuelRecords.companyId, companyId))
      .orderBy(asc(fuelRecords.vehicleId), asc(fuelRecords.odometerKm), asc(fuelRecords.id));

    const previousOdometer = new Map<number, number>();
    const historicalAverages = new Map<number, { total: number; count: number }>();
    const enriched = records.map((record) => {
      const previous = previousOdometer.get(record.vehicleId);
      const history = historicalAverages.get(record.vehicleId) ?? { total: 0, count: 0 };
      const consumptionKmpl = previous === undefined || record.odometerKm <= previous
        ? null
        : (record.odometerKm - previous) / (record.litersMilliliters / 1000);
      const historicalAverageKmpl = history.count === 0 ? null : history.total / history.count;
      previousOdometer.set(record.vehicleId, record.odometerKm);
      if (consumptionKmpl !== null) {
        history.total += consumptionKmpl;
        history.count += 1;
        historicalAverages.set(record.vehicleId, history);
      }
      return { ...record, consumptionKmpl, historicalAverageKmpl };
    });

    return enriched.sort((a, b) =>
      b.occurredAt.localeCompare(a.occurredAt) || b.id - a.id,
    );
  });
}

export async function createCompanyFuelRecord(companyId: number, input: FuelRecordInput) {
  return withTenantTransaction(companyId, async (transaction) => {
    const [vehicle] = await transaction
      .select({ id: vehicles.id })
      .from(vehicles)
      .where(and(eq(vehicles.companyId, companyId), eq(vehicles.id, input.vehicleId)))
      .for("update")
      .limit(1);
    const [driver] = await transaction
      .select({ id: drivers.id })
      .from(drivers)
      .where(and(
        eq(drivers.companyId, companyId),
        eq(drivers.id, input.driverId),
        eq(drivers.status, "active"),
      ))
      .limit(1);
    if (!vehicle || !driver) return { kind: "reference-not-found" as const };

    const [latest] = await transaction
      .select({ odometerKm: fuelRecords.odometerKm, occurredAt: fuelRecords.occurredAt })
      .from(fuelRecords)
      .where(and(eq(fuelRecords.companyId, companyId), eq(fuelRecords.vehicleId, input.vehicleId)))
      .orderBy(desc(fuelRecords.odometerKm), desc(fuelRecords.id))
      .limit(1);
    if (latest && input.odometerKm <= latest.odometerKm) {
      return { kind: "odometer-not-increasing" as const };
    }
    if (latest && input.occurredAt < latest.occurredAt) {
      return { kind: "date-out-of-order" as const };
    }

    const [record] = await transaction
      .insert(fuelRecords)
      .values({ ...input, companyId })
      .returning({ id: fuelRecords.id });
    if (!record) throw new Error("Fuel record insert returned no row");
    return { kind: "created" as const, id: record.id };
  });
}
