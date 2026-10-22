export type VehicleStatus = "operational" | "maintenance" | "inactive";

export type Vehicle = {
  id: number;
  plate: string;
  make: string;
  model: string;
  year: number;
  status: VehicleStatus;
};

export type VehicleDraft = Omit<Vehicle, "id">;

export type VehicleStatusCounts = Record<VehicleStatus, number>;

export type FleetSummary = {
  totalVehicles: number;
  statusCounts: VehicleStatusCounts;
  operationalRate: number;
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
  operational: "Operacional",
  maintenance: "Em manutenção",
  inactive: "Inativo",
};

export function isVehicleStatus(value: string): value is VehicleStatus {
  return value === "operational" || value === "maintenance" || value === "inactive";
}

export function isVehicle(value: unknown): value is Vehicle {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "number" &&
    "plate" in value &&
    typeof value.plate === "string" &&
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
    value.pageSize === vehiclePageSize &&
    "totalItems" in value &&
    typeof value.totalItems === "number" &&
    Number.isInteger(value.totalItems) &&
    value.totalItems >= 0 &&
    "totalPages" in value &&
    typeof value.totalPages === "number" &&
    Number.isInteger(value.totalPages) &&
    value.totalPages > 0 &&
    typeof statusCounts === "object" &&
    statusCounts !== null &&
    "operational" in statusCounts &&
    typeof statusCounts.operational === "number" &&
    Number.isInteger(statusCounts.operational) &&
    statusCounts.operational >= 0 &&
    "maintenance" in statusCounts &&
    typeof statusCounts.maintenance === "number" &&
    Number.isInteger(statusCounts.maintenance) &&
    statusCounts.maintenance >= 0 &&
    "inactive" in statusCounts &&
    typeof statusCounts.inactive === "number" &&
    Number.isInteger(statusCounts.inactive) &&
    statusCounts.inactive >= 0
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
    typeof statusCounts === "object" &&
    statusCounts !== null &&
    "operational" in statusCounts &&
    typeof statusCounts.operational === "number" &&
    Number.isInteger(statusCounts.operational) &&
    statusCounts.operational >= 0 &&
    "maintenance" in statusCounts &&
    typeof statusCounts.maintenance === "number" &&
    Number.isInteger(statusCounts.maintenance) &&
    statusCounts.maintenance >= 0 &&
    "inactive" in statusCounts &&
    typeof statusCounts.inactive === "number" &&
    Number.isInteger(statusCounts.inactive) &&
    statusCounts.inactive >= 0 &&
    "operationalRate" in value &&
    typeof value.operationalRate === "number" &&
    Number.isFinite(value.operationalRate) &&
    value.operationalRate >= 0 &&
    value.operationalRate <= 100 &&
    "refreshedAt" in value &&
    typeof value.refreshedAt === "string" &&
    !Number.isNaN(Date.parse(value.refreshedAt))
  );
}
