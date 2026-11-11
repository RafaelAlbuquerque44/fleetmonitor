import { and, count, eq, ilike, or } from "drizzle-orm";
import { drivers } from "./schema";
import { withTenantTransaction } from "./tenant";
import type { DriverInput, DriverListQuery } from "../routes/drivers.validation";

export async function listCompanyDrivers(companyId: number, query: DriverListQuery) {
  return withTenantTransaction(companyId, async (transaction) => {
    const filteredBy = and(
      eq(drivers.companyId, companyId),
      query.status ? eq(drivers.status, query.status) : undefined,
      query.query.length === 0
        ? undefined
        : or(
            ilike(drivers.fullName, `%${query.query}%`),
            ilike(drivers.cpf, `%${query.query}%`),
            ilike(drivers.licenseNumber, `%${query.query}%`),
            ilike(drivers.phone, `%${query.query}%`),
          ),
    );

    const [items, [filteredCount], statusRows] = await Promise.all([
      transaction
        .select({
          id: drivers.id,
          fullName: drivers.fullName,
          cpf: drivers.cpf,
          licenseNumber: drivers.licenseNumber,
          licenseCategory: drivers.licenseCategory,
          licenseExpiresAt: drivers.licenseExpiresAt,
          phone: drivers.phone,
          status: drivers.status,
        })
        .from(drivers)
        .where(filteredBy)
        .orderBy(drivers.fullName)
        .limit(query.pageSize)
        .offset(query.offset),
      transaction.select({ total: count() }).from(drivers).where(filteredBy),
      transaction
        .select({ status: drivers.status, total: count() })
        .from(drivers)
        .where(eq(drivers.companyId, companyId))
        .groupBy(drivers.status),
    ]);

    const statusCounts = { active: 0, inactive: 0 };
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

export async function getCompanyDriver(companyId: number, driverId: number) {
  return withTenantTransaction(companyId, async (transaction) => {
    const [driver] = await transaction
      .select({
        id: drivers.id,
        fullName: drivers.fullName,
        cpf: drivers.cpf,
        licenseNumber: drivers.licenseNumber,
        licenseCategory: drivers.licenseCategory,
        licenseExpiresAt: drivers.licenseExpiresAt,
        phone: drivers.phone,
        status: drivers.status,
      })
      .from(drivers)
      .where(and(eq(drivers.id, driverId), eq(drivers.companyId, companyId)))
      .limit(1);
    return driver ?? null;
  });
}

export async function createCompanyDriver(companyId: number, input: DriverInput) {
  return withTenantTransaction(companyId, async (transaction) => {
    const [driver] = await transaction
      .insert(drivers)
      .values({ ...input, companyId })
      .returning({
        id: drivers.id,
        fullName: drivers.fullName,
        cpf: drivers.cpf,
        licenseNumber: drivers.licenseNumber,
        licenseCategory: drivers.licenseCategory,
        licenseExpiresAt: drivers.licenseExpiresAt,
        phone: drivers.phone,
        status: drivers.status,
      });
    if (!driver) {
      throw new Error("Driver insert returned no row");
    }
    return driver;
  });
}

export async function updateCompanyDriver(
  companyId: number,
  driverId: number,
  input: DriverInput,
) {
  return withTenantTransaction(companyId, async (transaction) => {
    const [driver] = await transaction
      .update(drivers)
      .set(input)
      .where(and(eq(drivers.id, driverId), eq(drivers.companyId, companyId)))
      .returning({
        id: drivers.id,
        fullName: drivers.fullName,
        cpf: drivers.cpf,
        licenseNumber: drivers.licenseNumber,
        licenseCategory: drivers.licenseCategory,
        licenseExpiresAt: drivers.licenseExpiresAt,
        phone: drivers.phone,
        status: drivers.status,
      });
    return driver ?? null;
  });
}

export async function deleteCompanyDriver(companyId: number, driverId: number) {
  return withTenantTransaction(companyId, async (transaction) => {
    const [driver] = await transaction
      .delete(drivers)
      .where(and(eq(drivers.id, driverId), eq(drivers.companyId, companyId)))
      .returning({ id: drivers.id });
    return driver ?? null;
  });
}
