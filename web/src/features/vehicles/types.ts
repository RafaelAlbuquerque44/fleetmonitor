export const vehicleStatuses = [
  "operational",
  "in_operation",
  "stopped",
  "maintenance",
  "waiting_part",
  "waiting_service",
  "maintenance_completed",
  "inactive",
] as const;
export type VehicleStatus = (typeof vehicleStatuses)[number];

export type Vehicle = {
  id: number;
  plate: string;
  chassisNumber: string | null;
  make: string;
  model: string;
  year: number;
  status: VehicleStatus;
};

export type VehicleDraft = Omit<Vehicle, "id" | "chassisNumber"> & {
  chassisNumber: string;
};

export type VehicleStatusCounts = Record<VehicleStatus, number>;
export type DriverStatusCounts = Record<"active" | "inactive", number>;

export type FleetSummary = {
  totalVehicles: number;
  statusCounts: VehicleStatusCounts;
  operationalRate: number;
  averageDowntimeHours: number;
  totalDrivers: number;
  driverStatusCounts: DriverStatusCounts;
  refreshedAt: string;
};

export type VehicleListResponse = {
  items: Vehicle[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  statusCounts: VehicleStatusCounts;
};

export const vehiclePageSize = 25;

export const vehicleStatusLabels: Record<VehicleStatus, string> = {
  operational: "Disponível",
  in_operation: "Em operação",
  stopped: "Parado",
  maintenance: "Em manutenção",
  waiting_part: "Aguardando peça",
  waiting_service: "Aguardando serviço",
  maintenance_completed: "Manutenção finalizada",
  inactive: "Inativo",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isVehicleStatusCounts(value: unknown): value is VehicleStatusCounts {
  return (
    isRecord(value) &&
    vehicleStatuses.every((status) =>
      status in value &&
      typeof value[status] === "number" &&
      Number.isInteger(value[status]) &&
      value[status] >= 0
    )
  );
}

export function isVehicleStatus(value: string): value is VehicleStatus {
  return vehicleStatuses.some((status) => status === value);
}

export function isVehicle(value: unknown): value is Vehicle {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "number" &&
    "plate" in value &&
    typeof value.plate === "string" &&
    "chassisNumber" in value &&
    (typeof value.chassisNumber === "string" || value.chassisNumber === null) &&
    "make" in value &&
    typeof value.make === "string" &&
    "model" in value &&
    typeof value.model === "string" &&
    "year" in value &&
    typeof value.year === "number" &&
    "status" in value &&
    typeof value.status === "string" &&
    isVehicleStatus(value.status)
  );
}

export function isVehicleListResponse(value: unknown): value is VehicleListResponse {
  if (typeof value !== "object" || value === null || !("statusCounts" in value)) {
    return false;
  }

  const statusCounts = value.statusCounts;
  return (
    "items" in value &&
    Array.isArray(value.items) &&
    value.items.every(isVehicle) &&
    "page" in value &&
    typeof value.page === "number" &&
    Number.isInteger(value.page) &&
    value.page > 0 &&
    "pageSize" in value &&
    typeof value.pageSize === "number" &&
    Number.isInteger(value.pageSize) &&
    value.pageSize >= 1 &&
    value.pageSize <= 100 &&
    "totalItems" in value &&
    typeof value.totalItems === "number" &&
    Number.isInteger(value.totalItems) &&
    value.totalItems >= 0 &&
    "totalPages" in value &&
    typeof value.totalPages === "number" &&
    Number.isInteger(value.totalPages) &&
    value.totalPages > 0 &&
    isVehicleStatusCounts(statusCounts)
  );
}

export function isFleetSummary(value: unknown): value is FleetSummary {
  if (typeof value !== "object" || value === null || !("statusCounts" in value)) {
    return false;
  }

  const statusCounts = value.statusCounts;
  return (
    "totalVehicles" in value &&
    typeof value.totalVehicles === "number" &&
    Number.isInteger(value.totalVehicles) &&
    value.totalVehicles >= 0 &&
    isVehicleStatusCounts(statusCounts) &&
    "operationalRate" in value &&
    typeof value.operationalRate === "number" &&
    Number.isFinite(value.operationalRate) &&
    value.operationalRate >= 0 &&
    value.operationalRate <= 100 &&
    "averageDowntimeHours" in value &&
    typeof value.averageDowntimeHours === "number" &&
    Number.isFinite(value.averageDowntimeHours) &&
    value.averageDowntimeHours >= 0 &&
    "totalDrivers" in value &&
    typeof value.totalDrivers === "number" &&
    Number.isInteger(value.totalDrivers) &&
    value.totalDrivers >= 0 &&
    "driverStatusCounts" in value &&
    typeof value.driverStatusCounts === "object" &&
    value.driverStatusCounts !== null &&
    "active" in value.driverStatusCounts &&
    typeof value.driverStatusCounts.active === "number" &&
    Number.isInteger(value.driverStatusCounts.active) &&
    value.driverStatusCounts.active >= 0 &&
    "inactive" in value.driverStatusCounts &&
    typeof value.driverStatusCounts.inactive === "number" &&
    Number.isInteger(value.driverStatusCounts.inactive) &&
    value.driverStatusCounts.inactive >= 0 &&
    value.totalDrivers ===
      value.driverStatusCounts.active + value.driverStatusCounts.inactive &&
    "refreshedAt" in value &&
    typeof value.refreshedAt === "string" &&
    !Number.isNaN(Date.parse(value.refreshedAt))
  );
}
