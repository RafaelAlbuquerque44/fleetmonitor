import { and, count, eq, ilike, or, sql } from "drizzle-orm";
import { drivers, vehicles } from "./schema";
import { withTenantTransaction } from "./tenant";
import type { VehicleInput, VehicleListQuery } from "../routes/vehicles.validation";

export async function listCompanyVehicles(companyId: number, query: VehicleListQuery) {
  return withTenantTransaction(companyId, async (transaction) => {
    const filteredBy = and(
      eq(vehicles.companyId, companyId),
      query.status ? eq(vehicles.status, query.status) : undefined,
      query.query.length === 0
        ? undefined
        : or(
            ilike(vehicles.plate, `%${query.query}%`),
            ilike(vehicles.make, `%${query.query}%`),
            ilike(vehicles.model, `%${query.query}%`),
            sql`${vehicles.year}::text ILIKE ${`%${query.query}%`}`,
          ),
    );

    const [items, [filteredCount], statusRows] = await Promise.all([
      transaction
        .select({
          id: vehicles.id,
          plate: vehicles.plate,
          make: vehicles.make,
          model: vehicles.model,
          year: vehicles.year,
          status: vehicles.status,
        })
        .from(vehicles)
        .where(filteredBy)
        .orderBy(vehicles.plate)
        .limit(query.pageSize)
        .offset(query.offset),
      transaction
        .select({ total: count() })
        .from(vehicles)
        .where(filteredBy),
      transaction
        .select({ status: vehicles.status, total: count() })
        .from(vehicles)
        .where(eq(vehicles.companyId, companyId))
        .groupBy(vehicles.status),
    ]);

    const statusCounts = { operational: 0, maintenance: 0, inactive: 0 };
    for (const row of statusRows) {
      statusCounts[row.status] = row.total;
    }

    return {
      items,
      totalItems: filteredCount?.total ?? 0,
      statusCounts,
    };
  });
}

export async function getCompanyVehicle(companyId: number, vehicleId: number) {
  return withTenantTransaction(companyId, async (transaction) => {
    const [vehicle] = await transaction
      .select({
        id: vehicles.id,
        plate: vehicles.plate,
        make: vehicles.make,
        model: vehicles.model,
        year: vehicles.year,
        status: vehicles.status,
      })
      .from(vehicles)
      .where(and(eq(vehicles.id, vehicleId), eq(vehicles.companyId, companyId)))
      .limit(1);
    return vehicle ?? null;
  });
}

export async function createCompanyVehicle(companyId: number, input: VehicleInput) {
  return withTenantTransaction(companyId, async (transaction) => {
    const [vehicle] = await transaction
      .insert(vehicles)
      .values({ ...input, companyId })
      .returning({
        id: vehicles.id,
        plate: vehicles.plate,
        make: vehicles.make,
        model: vehicles.model,
        year: vehicles.year,
        status: vehicles.status,
      });
    if (!vehicle) {
      throw new Error("Vehicle insert returned no row");
    }
    return vehicle;
  });
}

export async function updateCompanyVehicle(
  companyId: number,
  vehicleId: number,
  input: VehicleInput,
) {
  return withTenantTransaction(companyId, async (transaction) => {
    const [vehicle] = await transaction
      .update(vehicles)
      .set(input)
      .where(and(eq(vehicles.id, vehicleId), eq(vehicles.companyId, companyId)))
      .returning({
        id: vehicles.id,
        plate: vehicles.plate,
        make: vehicles.make,
        model: vehicles.model,
        year: vehicles.year,
        status: vehicles.status,
      });
    return vehicle ?? null;
  });
}

export async function deleteCompanyVehicle(companyId: number, vehicleId: number) {
  return withTenantTransaction(companyId, async (transaction) => {
    const [vehicle] = await transaction
      .delete(vehicles)
      .where(and(eq(vehicles.id, vehicleId), eq(vehicles.companyId, companyId)))
      .returning({ id: vehicles.id });
    return vehicle ?? null;
  });
}

export async function getCompanyFleetStatusRows(companyId: number) {
  return withTenantTransaction(companyId, async (transaction) => {
    const [vehicleStatusRows, driverStatusRows] = await Promise.all([
      transaction
        .select({ status: vehicles.status, total: count() })
        .from(vehicles)
        .where(eq(vehicles.companyId, companyId))
        .groupBy(vehicles.status),
      transaction
        .select({ status: drivers.status, total: count() })
        .from(drivers)
        .where(eq(drivers.companyId, companyId))
        .groupBy(drivers.status),
    ]);
    return { vehicleStatusRows, driverStatusRows };
  });
}
