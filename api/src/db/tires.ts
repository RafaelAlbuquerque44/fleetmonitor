import { and, asc, desc, eq, inArray, isNull, max } from "drizzle-orm";
import { fuelRecords, tireEvents, tires, vehicles } from "./schema";
import { withTenantTransaction } from "./tenant";
import type { TireEventInput, TireInput } from "../routes/fleet-records.validation";

export async function listCompanyTires(companyId: number) {
  return withTenantTransaction(companyId, async (transaction) => {
    const tireRows = await transaction
      .select({
        id: tires.id,
        vehicleId: tires.vehicleId,
        vehiclePlate: vehicles.plate,
        position: tires.position,
        brand: tires.brand,
        installedAt: tires.installedAt,
        installedOdometerKm: tires.installedOdometerKm,
        removedAt: tires.removedAt,
        removedOdometerKm: tires.removedOdometerKm,
      })
      .from(tires)
      .innerJoin(
        vehicles,
        and(eq(vehicles.companyId, companyId), eq(vehicles.id, tires.vehicleId)),
      )
      .where(eq(tires.companyId, companyId))
      .orderBy(desc(tires.createdAt), desc(tires.id))
      .limit(100);
    if (tireRows.length === 0) return [];

    const tireIds = tireRows.map((tire) => tire.id);
    const [odometerRows, events] = await Promise.all([
      transaction
        .select({ vehicleId: fuelRecords.vehicleId, odometerKm: max(fuelRecords.odometerKm) })
        .from(fuelRecords)
        .where(eq(fuelRecords.companyId, companyId))
        .groupBy(fuelRecords.vehicleId),
      transaction
        .select({
          id: tireEvents.id,
          tireId: tireEvents.tireId,
          type: tireEvents.type,
          description: tireEvents.description,
          occurredAt: tireEvents.occurredAt,
          odometerKm: tireEvents.odometerKm,
        })
        .from(tireEvents)
        .where(and(eq(tireEvents.companyId, companyId), inArray(tireEvents.tireId, tireIds)))
        .orderBy(asc(tireEvents.occurredAt), asc(tireEvents.id)),
    ]);
    const latestOdometers = new Map(
      odometerRows.map((row) => [row.vehicleId, row.odometerKm ?? 0]),
    );
    const eventsByTire = new Map<number, typeof events>();
    for (const event of events) {
      const current = eventsByTire.get(event.tireId) ?? [];
      current.push(event);
      eventsByTire.set(event.tireId, current);
    }

    return tireRows.map((tire) => {
      const endOdometer = tire.removedOdometerKm ?? latestOdometers.get(tire.vehicleId) ?? tire.installedOdometerKm;
      return {
        ...tire,
        usageKm: Math.max(0, endOdometer - tire.installedOdometerKm),
        events: eventsByTire.get(tire.id) ?? [],
      };
    });
  });
}

export async function createCompanyTire(companyId: number, input: TireInput) {
  return withTenantTransaction(companyId, async (transaction) => {
    const [vehicle] = await transaction
      .select({ id: vehicles.id })
      .from(vehicles)
      .where(and(eq(vehicles.companyId, companyId), eq(vehicles.id, input.vehicleId)))
      .limit(1);
    if (!vehicle) return { kind: "vehicle-not-found" as const };

    const [latestFuel] = await transaction
      .select({ odometerKm: max(fuelRecords.odometerKm) })
      .from(fuelRecords)
      .where(and(eq(fuelRecords.companyId, companyId), eq(fuelRecords.vehicleId, input.vehicleId)));
    if (latestFuel?.odometerKm !== null && latestFuel?.odometerKm !== undefined &&
        input.installedOdometerKm < latestFuel.odometerKm) {
      return { kind: "odometer-outdated" as const };
    }

    const [existing] = await transaction
      .select({ id: tires.id, installedOdometerKm: tires.installedOdometerKm })
      .from(tires)
      .where(and(
        eq(tires.companyId, companyId),
        eq(tires.vehicleId, input.vehicleId),
        eq(tires.position, input.position),
        isNull(tires.removedAt),
      ))
      .for("update");
    if (existing && input.installedOdometerKm < existing.installedOdometerKm) {
      return { kind: "odometer-outdated" as const };
    }
    if (existing) {
      await transaction
        .update(tires)
        .set({ removedAt: input.installedAt, removedOdometerKm: input.installedOdometerKm })
        .where(and(eq(tires.companyId, companyId), eq(tires.id, existing.id)));
      await transaction.insert(tireEvents).values({
        companyId,
        vehicleId: input.vehicleId,
        tireId: existing.id,
        type: "replacement",
        description: `Substituído por pneu ${input.brand}.`,
        occurredAt: input.installedAt,
        odometerKm: input.installedOdometerKm,
      });
    }

    const [tire] = await transaction
      .insert(tires)
      .values({ ...input, companyId })
      .returning({ id: tires.id });
    if (!tire) throw new Error("Tire insert returned no row");
    await transaction.insert(tireEvents).values({
      companyId,
      vehicleId: input.vehicleId,
      tireId: tire.id,
      type: "installation",
      description: `Instalação do pneu ${input.brand}${existing ? " após substituição" : ""}.`,
      occurredAt: input.installedAt,
      odometerKm: input.installedOdometerKm,
    });
    return { kind: "created" as const, id: tire.id };
  });
}

export async function createCompanyTireEvent(
  companyId: number,
  tireId: number,
  input: TireEventInput,
) {
  return withTenantTransaction(companyId, async (transaction) => {
    const [tire] = await transaction
      .select({
        id: tires.id,
        vehicleId: tires.vehicleId,
        installedAt: tires.installedAt,
        installedOdometerKm: tires.installedOdometerKm,
        removedAt: tires.removedAt,
        removedOdometerKm: tires.removedOdometerKm,
      })
      .from(tires)
      .where(and(eq(tires.companyId, companyId), eq(tires.id, tireId)))
      .limit(1);
    if (!tire) return { kind: "tire-not-found" as const };
    if (tire.removedAt !== null) return { kind: "tire-removed" as const };
    if (input.occurredAt < tire.installedAt || input.odometerKm < tire.installedOdometerKm) {
      return { kind: "event-before-installation" as const };
    }
    const [latestFuel] = await transaction
      .select({ odometerKm: max(fuelRecords.odometerKm) })
      .from(fuelRecords)
      .where(and(eq(fuelRecords.companyId, companyId), eq(fuelRecords.vehicleId, tire.vehicleId)));
    if (latestFuel?.odometerKm && input.odometerKm > latestFuel.odometerKm) {
      return { kind: "odometer-ahead" as const };
    }
    const [event] = await transaction
      .insert(tireEvents)
      .values({ ...input, companyId, vehicleId: tire.vehicleId, tireId })
      .returning({ id: tireEvents.id });
    if (!event) throw new Error("Tire event insert returned no row");
    return { kind: "created" as const, id: event.id };
  });
}
