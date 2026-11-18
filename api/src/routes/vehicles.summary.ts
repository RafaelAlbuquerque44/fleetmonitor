import type { driverStatusEnum, vehicleStatusEnum } from "../db/schema";

type VehicleStatus = (typeof vehicleStatusEnum.enumValues)[number];
type VehicleStatusCount = { status: VehicleStatus; total: number };
type DriverStatus = (typeof driverStatusEnum.enumValues)[number];
type DriverStatusCount = { status: DriverStatus; total: number };

export function makeFleetSummary(
  statusRows: VehicleStatusCount[],
  refreshedAt = new Date(),
  averageDowntimeHours = 0,
) {
  const statusCounts: Record<VehicleStatus, number> = {
    operational: 0,
    in_operation: 0,
    stopped: 0,
    maintenance: 0,
    waiting_part: 0,
    waiting_service: 0,
    maintenance_completed: 0,
    inactive: 0,
  };
  for (const row of statusRows) {
    statusCounts[row.status] = row.total;
  }

  const totalVehicles = Object.values(statusCounts).reduce(
    (total, statusCount) => total + statusCount,
    0,
  );
  const availableVehicles =
    statusCounts.operational +
    statusCounts.in_operation +
    statusCounts.maintenance_completed;

  return {
    totalVehicles,
    statusCounts,
    operationalRate:
      totalVehicles === 0
        ? 0
        : Math.round((availableVehicles / totalVehicles) * 100),
    averageDowntimeHours: Number(averageDowntimeHours.toFixed(1)),
    refreshedAt: refreshedAt.toISOString(),
  };
}

export function makeDriverSummary(statusRows: DriverStatusCount[]) {
  const driverStatusCounts: Record<DriverStatus, number> = {
    active: 0,
    inactive: 0,
  };
  for (const row of statusRows) {
    driverStatusCounts[row.status] = row.total;
  }

  return {
    totalDrivers: Object.values(driverStatusCounts).reduce(
      (total, statusCount) => total + statusCount,
      0,
    ),
    driverStatusCounts,
  };
}
