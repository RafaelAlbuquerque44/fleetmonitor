import { and, desc, eq, max } from "drizzle-orm";
import {
  drivers,
  fuelRecords,
  maintenanceServiceTypeEnum,
  odometerReadings,
  preventiveMaintenancePlans,
  tireEvents,
  vehicles,
  vehicleServices,
} from "./schema";
import { withTenantTransaction, type TenantTransaction } from "./tenant";
import type {
  OdometerReadingInput,
  PreventiveMaintenancePlanInput,
  VehicleServiceInput,
} from "../routes/fleet-records.validation";

async function getCurrentOdometerKm(
  transaction: TenantTransaction,
  companyId: number,
  vehicleId: number,
) {
  const [reading, fuel, tire, service] = await Promise.all([
    transaction
      .select({ odometerKm: max(odometerReadings.odometerKm) })
      .from(odometerReadings)
      .where(and(
        eq(odometerReadings.companyId, companyId),
        eq(odometerReadings.vehicleId, vehicleId),
      )),
    transaction
      .select({ odometerKm: max(fuelRecords.odometerKm) })
      .from(fuelRecords)
      .where(and(eq(fuelRecords.companyId, companyId), eq(fuelRecords.vehicleId, vehicleId))),
    transaction
      .select({ odometerKm: max(tireEvents.odometerKm) })
      .from(tireEvents)
      .where(and(eq(tireEvents.companyId, companyId), eq(tireEvents.vehicleId, vehicleId))),
    transaction
      .select({ odometerKm: max(vehicleServices.odometerKm) })
      .from(vehicleServices)
      .where(and(
        eq(vehicleServices.companyId, companyId),
        eq(vehicleServices.vehicleId, vehicleId),
      )),
  ]);
  const values = [
    reading[0]?.odometerKm,
    fuel[0]?.odometerKm,
    tire[0]?.odometerKm,
    service[0]?.odometerKm,
  ].filter((value): value is number => value !== null && value !== undefined);
  return values.length === 0 ? null : Math.max(...values);
}

export async function listPreventiveMaintenance(companyId: number) {
  return withTenantTransaction(companyId, async (transaction) => {
    const [companyVehicles, plans, services, readings] = await Promise.all([
      transaction
        .select({
          id: vehicles.id,
          plate: vehicles.plate,
          make: vehicles.make,
          model: vehicles.model,
        })
        .from(vehicles)
        .where(eq(vehicles.companyId, companyId))
        .orderBy(vehicles.plate),
      transaction
        .select({
          id: preventiveMaintenancePlans.id,
          vehicleId: preventiveMaintenancePlans.vehicleId,
          vehiclePlate: vehicles.plate,
          serviceType: preventiveMaintenancePlans.serviceType,
          intervalKm: preventiveMaintenancePlans.intervalKm,
          lastServiceOdometerKm: preventiveMaintenancePlans.lastServiceOdometerKm,
        })
        .from(preventiveMaintenancePlans)
        .innerJoin(
          vehicles,
          and(
            eq(vehicles.companyId, companyId),
            eq(vehicles.id, preventiveMaintenancePlans.vehicleId),
          ),
        )
        .where(and(
          eq(preventiveMaintenancePlans.companyId, companyId),
          eq(preventiveMaintenancePlans.active, true),
        ))
        .orderBy(vehicles.plate, preventiveMaintenancePlans.serviceType),
      transaction
        .select({
          id: vehicleServices.id,
          vehicleId: vehicleServices.vehicleId,
          vehiclePlate: vehicles.plate,
          driverName: drivers.fullName,
          serviceType: vehicleServices.serviceType,
          description: vehicleServices.description,
          occurredAt: vehicleServices.occurredAt,
          odometerKm: vehicleServices.odometerKm,
        })
        .from(vehicleServices)
        .innerJoin(
          vehicles,
          and(eq(vehicles.companyId, companyId), eq(vehicles.id, vehicleServices.vehicleId)),
        )
        .leftJoin(
          drivers,
          and(eq(drivers.companyId, companyId), eq(drivers.id, vehicleServices.driverId)),
        )
        .where(eq(vehicleServices.companyId, companyId))
        .orderBy(desc(vehicleServices.occurredAt), desc(vehicleServices.id))
        .limit(50),
      transaction
        .select({
          id: odometerReadings.id,
          vehicleId: odometerReadings.vehicleId,
          vehiclePlate: vehicles.plate,
          driverName: drivers.fullName,
          occurredAt: odometerReadings.occurredAt,
          odometerKm: odometerReadings.odometerKm,
          distanceKm: odometerReadings.distanceKm,
        })
        .from(odometerReadings)
        .innerJoin(
          vehicles,
          and(eq(vehicles.companyId, companyId), eq(vehicles.id, odometerReadings.vehicleId)),
        )
        .innerJoin(
          drivers,
          and(eq(drivers.companyId, companyId), eq(drivers.id, odometerReadings.driverId)),
        )
        .where(eq(odometerReadings.companyId, companyId))
        .orderBy(desc(odometerReadings.occurredAt), desc(odometerReadings.id))
        .limit(50),
    ]);
    const odometers = await Promise.all(
      companyVehicles.map(async (vehicle) => ({
        vehicleId: vehicle.id,
        odometerKm: await getCurrentOdometerKm(transaction, companyId, vehicle.id),
      })),
    );
    const currentOdometers = new Map(
      odometers.map(({ vehicleId, odometerKm }) => [vehicleId, odometerKm]),
    );
    return {
      vehicles: companyVehicles.map((vehicle) => ({
        ...vehicle,
        currentOdometerKm: currentOdometers.get(vehicle.id) ?? null,
      })),
      plans,
      services,
      readings,
    };
  });
}

export async function savePreventiveMaintenancePlan(
  companyId: number,
  input: PreventiveMaintenancePlanInput,
) {
  return withTenantTransaction(companyId, async (transaction) => {
    const [vehicle] = await transaction
      .select({ id: vehicles.id })
      .from(vehicles)
      .where(and(eq(vehicles.companyId, companyId), eq(vehicles.id, input.vehicleId)))
      .for("update")
      .limit(1);
    if (!vehicle) return { kind: "vehicle-not-found" as const };

    const currentOdometerKm = await getCurrentOdometerKm(
      transaction,
      companyId,
      input.vehicleId,
    );
    if (currentOdometerKm === null) return { kind: "odometer-not-found" as const };
    if (input.lastServiceOdometerKm > currentOdometerKm) {
      return { kind: "service-odometer-ahead" as const };
    }

    const [plan] = await transaction
      .insert(preventiveMaintenancePlans)
      .values({ ...input, companyId })
      .onConflictDoUpdate({
        target: [
          preventiveMaintenancePlans.companyId,
          preventiveMaintenancePlans.vehicleId,
          preventiveMaintenancePlans.serviceType,
        ],
        set: {
          intervalKm: input.intervalKm,
          lastServiceOdometerKm: input.lastServiceOdometerKm,
          active: true,
        },
      })
      .returning({ id: preventiveMaintenancePlans.id });
    if (!plan) throw new Error("Preventive maintenance plan upsert returned no row");
    return { kind: "saved" as const, id: plan.id };
  });
}

export async function createOdometerReading(
  companyId: number,
  input: OdometerReadingInput,
) {
  return withTenantTransaction(companyId, async (transaction) => {
    const [vehicle] = await transaction
      .select({ id: vehicles.id })
      .from(vehicles)
      .where(and(eq(vehicles.companyId, companyId), eq(vehicles.id, input.vehicleId)))
      .for("update")
      .limit(1);
    if (!vehicle) return { kind: "vehicle-not-found" as const };

    const [driver] = await transaction
      .select({ id: drivers.id })
      .from(drivers)
      .where(and(
        eq(drivers.companyId, companyId),
        eq(drivers.id, input.driverId),
        eq(drivers.status, "active"),
      ))
      .limit(1);
    if (!driver) return { kind: "driver-not-found" as const };

    const currentOdometerKm = await getCurrentOdometerKm(
      transaction,
      companyId,
      input.vehicleId,
    );
    if (currentOdometerKm !== null && input.odometerKm <= currentOdometerKm) {
      return { kind: "odometer-not-increasing" as const, currentOdometerKm };
    }
    const [reading] = await transaction
      .insert(odometerReadings)
      .values({
        ...input,
        companyId,
        distanceKm: currentOdometerKm === null
          ? null
          : input.odometerKm - currentOdometerKm,
      })
      .returning({
        id: odometerReadings.id,
        distanceKm: odometerReadings.distanceKm,
        odometerKm: odometerReadings.odometerKm,
      });
    if (!reading) throw new Error("Odometer reading insert returned no row");
    return { kind: "saved" as const, ...reading };
  });
}

export async function createVehicleService(
  companyId: number,
  input: VehicleServiceInput,
) {
  return withTenantTransaction(companyId, async (transaction) => {
    const [vehicle] = await transaction
      .select({ id: vehicles.id })
      .from(vehicles)
      .where(and(eq(vehicles.companyId, companyId), eq(vehicles.id, input.vehicleId)))
      .for("update")
      .limit(1);
    if (!vehicle) return { kind: "vehicle-not-found" as const };

    if (input.driverId !== null) {
      const [driver] = await transaction
        .select({ id: drivers.id })
        .from(drivers)
        .where(and(
          eq(drivers.companyId, companyId),
          eq(drivers.id, input.driverId),
          eq(drivers.status, "active"),
        ))
        .limit(1);
      if (!driver) return { kind: "driver-not-found" as const };
    }

    if (
      input.serviceType === "oil_change" ||
      input.serviceType === "brake_pads"
    ) {
      const [plan] = await transaction
        .select({ lastServiceOdometerKm: preventiveMaintenancePlans.lastServiceOdometerKm })
        .from(preventiveMaintenancePlans)
        .where(and(
          eq(preventiveMaintenancePlans.companyId, companyId),
          eq(preventiveMaintenancePlans.vehicleId, input.vehicleId),
          eq(preventiveMaintenancePlans.serviceType, input.serviceType),
        ))
        .for("update")
        .limit(1);
      if (plan && input.odometerKm < plan.lastServiceOdometerKm) {
        return { kind: "odometer-before-last-service" as const };
      }
    }

    const [service] = await transaction
      .insert(vehicleServices)
      .values({ ...input, companyId })
      .returning({ id: vehicleServices.id });
    if (!service) throw new Error("Vehicle service insert returned no row");

    if (
      input.serviceType === "oil_change" ||
      input.serviceType === "brake_pads"
    ) {
      await transaction
        .update(preventiveMaintenancePlans)
        .set({ lastServiceOdometerKm: input.odometerKm })
        .where(and(
          eq(preventiveMaintenancePlans.companyId, companyId),
          eq(preventiveMaintenancePlans.vehicleId, input.vehicleId),
          eq(preventiveMaintenancePlans.serviceType, input.serviceType),
        ));
    }
    return { kind: "saved" as const, id: service.id };
  });
}
