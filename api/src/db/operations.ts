import { and, count, desc, eq } from "drizzle-orm";
import { fleetCosts, maintenanceOrders, vehicles } from "./schema";
import { withTenantTransaction } from "./tenant";
import type {
  FleetCostInput,
  FleetCostListQuery,
  MaintenanceInput,
  MaintenanceListQuery,
  OperationPageQuery,
} from "../routes/operations.validation";

export async function listCompanyMaintenance(
  companyId: number,
  query: MaintenanceListQuery,
) {
  return withTenantTransaction(companyId, async (transaction) => {
    const filter = and(
      eq(maintenanceOrders.companyId, companyId),
      query.status ? eq(maintenanceOrders.status, query.status) : undefined,
    );
    const [items, [total]] = await Promise.all([
      transaction
        .select({
          id: maintenanceOrders.id,
          vehicleId: maintenanceOrders.vehicleId,
          vehiclePlate: vehicles.plate,
          description: maintenanceOrders.description,
          status: maintenanceOrders.status,
          scheduledAt: maintenanceOrders.scheduledAt,
          completedAt: maintenanceOrders.completedAt,
          costCents: maintenanceOrders.costCents,
          createdAt: maintenanceOrders.createdAt,
        })
        .from(maintenanceOrders)
        .innerJoin(
          vehicles,
          and(
            eq(vehicles.id, maintenanceOrders.vehicleId),
            eq(vehicles.companyId, companyId),
          ),
        )
        .where(filter)
        .orderBy(desc(maintenanceOrders.createdAt))
        .limit(query.pageSize)
        .offset(query.offset),
      transaction
        .select({ total: count() })
        .from(maintenanceOrders)
        .where(filter),
    ]);
    return { items, totalItems: total?.total ?? 0 };
  });
}

export async function createCompanyMaintenance(
  companyId: number,
  input: MaintenanceInput,
) {
  return withTenantTransaction(companyId, async (transaction) => {
    const [vehicle] = await transaction
      .select({ id: vehicles.id })
      .from(vehicles)
      .where(and(eq(vehicles.id, input.vehicleId), eq(vehicles.companyId, companyId)))
      .limit(1);
    if (!vehicle) {
      return { kind: "vehicle-not-found" as const };
    }

    const [item] = await transaction
      .insert(maintenanceOrders)
      .values({ ...input, companyId })
      .returning({ id: maintenanceOrders.id });
    if (!item) {
      throw new Error("Maintenance order insert returned no row");
    }
    return { kind: "created" as const, id: item.id };
  });
}

export async function updateCompanyMaintenance(
  companyId: number,
  orderId: number,
  input: MaintenanceInput,
) {
  return withTenantTransaction(companyId, async (transaction) => {
    const [vehicle] = await transaction
      .select({ id: vehicles.id })
      .from(vehicles)
      .where(and(eq(vehicles.id, input.vehicleId), eq(vehicles.companyId, companyId)))
      .limit(1);
    if (!vehicle) {
      return { kind: "vehicle-not-found" as const };
    }

    const [item] = await transaction
      .update(maintenanceOrders)
      .set(input)
      .where(
        and(
          eq(maintenanceOrders.id, orderId),
          eq(maintenanceOrders.companyId, companyId),
        ),
      )
      .returning({ id: maintenanceOrders.id });
    return item ? { kind: "updated" as const } : { kind: "not-found" as const };
  });
}

export async function listCompanyCosts(companyId: number, query: FleetCostListQuery) {
  return withTenantTransaction(companyId, async (transaction) => {
    const filter = and(
      eq(fleetCosts.companyId, companyId),
      query.category ? eq(fleetCosts.category, query.category) : undefined,
    );
    const [items, [total]] = await Promise.all([
      transaction
        .select({
          id: fleetCosts.id,
          vehicleId: fleetCosts.vehicleId,
          vehiclePlate: vehicles.plate,
          category: fleetCosts.category,
          description: fleetCosts.description,
          amountCents: fleetCosts.amountCents,
          occurredAt: fleetCosts.occurredAt,
          createdAt: fleetCosts.createdAt,
        })
        .from(fleetCosts)
        .innerJoin(
          vehicles,
          and(
            eq(vehicles.id, fleetCosts.vehicleId),
            eq(vehicles.companyId, companyId),
          ),
        )
        .where(filter)
        .orderBy(desc(fleetCosts.occurredAt), desc(fleetCosts.createdAt))
        .limit(query.pageSize)
        .offset(query.offset),
      transaction.select({ total: count() }).from(fleetCosts).where(filter),
    ]);
    return { items, totalItems: total?.total ?? 0 };
  });
}

export async function createCompanyCost(companyId: number, input: FleetCostInput) {
  return withTenantTransaction(companyId, async (transaction) => {
    const [vehicle] = await transaction
      .select({ id: vehicles.id })
      .from(vehicles)
      .where(and(eq(vehicles.id, input.vehicleId), eq(vehicles.companyId, companyId)))
      .limit(1);
    if (!vehicle) {
      return { kind: "vehicle-not-found" as const };
    }

    const [item] = await transaction
      .insert(fleetCosts)
      .values({ ...input, companyId })
      .returning({ id: fleetCosts.id });
    if (!item) {
      throw new Error("Fleet cost insert returned no row");
    }
    return { kind: "created" as const, id: item.id };
  });
}
