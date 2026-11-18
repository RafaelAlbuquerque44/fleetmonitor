import { and, desc, eq, ne } from "drizzle-orm";
import { maintenanceRecords, vehicles } from "./schema";
import { withTenantTransaction, type TenantTransaction } from "./tenant";
import type { MaintenanceRecordInput } from "../routes/fleet-records.validation";

function vehicleStatusForRecord(status: MaintenanceRecordInput["status"]) {
  switch (status) {
    case "open":
    case "in_progress":
      return "maintenance" as const;
    case "waiting_part":
      return "waiting_part" as const;
    case "waiting_service":
      return "waiting_service" as const;
    case "completed":
      return "maintenance_completed" as const;
  }
}

function completedAtDate(value: string | null): Date | null {
  return value === null ? null : new Date(`${value}T23:59:59.999Z`);
}

async function synchronizeVehicleStatus(
  transaction: TenantTransaction,
  companyId: number,
  vehicleId: number,
  fallbackStatus: MaintenanceRecordInput["status"],
) {
  const [activeRecord] = await transaction
    .select({ status: maintenanceRecords.status })
    .from(maintenanceRecords)
    .where(and(
      eq(maintenanceRecords.companyId, companyId),
      eq(maintenanceRecords.vehicleId, vehicleId),
      ne(maintenanceRecords.status, "completed"),
    ))
    .orderBy(desc(maintenanceRecords.occurredAt), desc(maintenanceRecords.id))
    .limit(1);
  const status = activeRecord
    ? vehicleStatusForRecord(activeRecord.status)
    : vehicleStatusForRecord(fallbackStatus);
  await transaction
    .update(vehicles)
    .set({ status })
    .where(and(eq(vehicles.companyId, companyId), eq(vehicles.id, vehicleId)));
}

export async function listCompanyMaintenanceRecords(companyId: number) {
  return withTenantTransaction(companyId, (transaction) =>
    transaction
      .select({
        id: maintenanceRecords.id,
        vehicleId: maintenanceRecords.vehicleId,
        vehiclePlate: vehicles.plate,
        problem: maintenanceRecords.problem,
        responsible: maintenanceRecords.responsible,
        dueAt: maintenanceRecords.dueAt,
        partsUsed: maintenanceRecords.partsUsed,
        status: maintenanceRecords.status,
        occurredAt: maintenanceRecords.occurredAt,
        startedAt: maintenanceRecords.startedAt,
        completedAt: maintenanceRecords.completedAt,
      })
      .from(maintenanceRecords)
      .innerJoin(
        vehicles,
        and(eq(vehicles.companyId, companyId), eq(vehicles.id, maintenanceRecords.vehicleId)),
      )
      .where(eq(maintenanceRecords.companyId, companyId))
      .orderBy(desc(maintenanceRecords.occurredAt), desc(maintenanceRecords.id)),
  );
}

export async function createCompanyMaintenanceRecord(
  companyId: number,
  input: MaintenanceRecordInput,
) {
  return withTenantTransaction(companyId, async (transaction) => {
    const [vehicle] = await transaction
      .select({ id: vehicles.id })
      .from(vehicles)
      .where(and(eq(vehicles.companyId, companyId), eq(vehicles.id, input.vehicleId)))
      .for("update")
      .limit(1);
    if (!vehicle) return null;
    const [record] = await transaction
      .insert(maintenanceRecords)
      .values({
        ...input,
        completedAt: completedAtDate(input.completedAt),
        companyId,
      })
      .returning({ id: maintenanceRecords.id });
    if (!record) throw new Error("Maintenance record insert returned no row");
    await synchronizeVehicleStatus(transaction, companyId, input.vehicleId, input.status);
    return record;
  });
}

export async function updateCompanyMaintenanceRecord(
  companyId: number,
  recordId: number,
  input: MaintenanceRecordInput,
) {
  return withTenantTransaction(companyId, async (transaction) => {
    const [existingRecord] = await transaction
      .select({ vehicleId: maintenanceRecords.vehicleId })
      .from(maintenanceRecords)
      .where(and(eq(maintenanceRecords.companyId, companyId), eq(maintenanceRecords.id, recordId)))
      .limit(1);
    if (!existingRecord) return { kind: "record-not-found" as const };
    if (existingRecord.vehicleId !== input.vehicleId) {
      return { kind: "vehicle-mismatch" as const };
    }

    const [vehicle] = await transaction
      .select({ id: vehicles.id })
      .from(vehicles)
      .where(and(eq(vehicles.companyId, companyId), eq(vehicles.id, input.vehicleId)))
      .for("update")
      .limit(1);
    if (!vehicle) return { kind: "vehicle-not-found" as const };
    const [record] = await transaction
      .update(maintenanceRecords)
      .set({
        ...input,
        completedAt: completedAtDate(input.completedAt),
      })
      .where(and(eq(maintenanceRecords.companyId, companyId), eq(maintenanceRecords.id, recordId)))
      .returning({ id: maintenanceRecords.id });
    if (!record) return { kind: "record-not-found" as const };
    await synchronizeVehicleStatus(transaction, companyId, input.vehicleId, input.status);
    return { kind: "updated" as const };
  });
}
