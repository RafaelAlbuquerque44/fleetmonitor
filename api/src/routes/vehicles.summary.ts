import type { vehicleStatusEnum } from "../db/schema";

type VehicleStatus = (typeof vehicleStatusEnum.enumValues)[number];
type VehicleStatusCount = { status: VehicleStatus; total: number };

export function makeFleetSummary(
  statusRows: VehicleStatusCount[],
  refreshedAt = new Date(),
) {
  const statusCounts: Record<VehicleStatus, number> = {
    operational: 0,
    maintenance: 0,
    inactive: 0,
  };
  for (const row of statusRows) {
    statusCounts[row.status] = row.total;
  }

  const totalVehicles = Object.values(statusCounts).reduce(
    (total, statusCount) => total + statusCount,
    0,
  );

  return {
    totalVehicles,
    statusCounts,
    operationalRate:
      totalVehicles === 0
        ? 0
        : Math.round((statusCounts.operational / totalVehicles) * 100),
    refreshedAt: refreshedAt.toISOString(),
  };
}
