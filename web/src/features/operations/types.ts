import type { Vehicle } from "../vehicles/types";

export type MaintenanceStatus = "scheduled" | "in_progress" | "completed" | "cancelled";
export type FleetCostCategory = "fuel" | "maintenance" | "toll" | "insurance" | "tax" | "other";

export type MaintenanceOrder = {
  id: number;
  vehicleId: number;
  vehiclePlate: string;
  description: string;
  status: MaintenanceStatus;
  scheduledAt: string | null;
  completedAt: string | null;
  costCents: number | null;
  createdAt: string;
};

export type FleetCost = {
  id: number;
  vehicleId: number;
  vehiclePlate: string;
  category: FleetCostCategory;
  description: string;
  amountCents: number;
  occurredAt: string;
  createdAt: string;
};

export type MaintenanceDraft = Omit<
  MaintenanceOrder,
  "id" | "vehiclePlate" | "createdAt"
>;
export type FleetCostDraft = Omit<FleetCost, "id" | "vehiclePlate" | "createdAt">;

export type PageResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export const maintenanceStatuses: MaintenanceStatus[] = [
  "scheduled",
  "in_progress",
  "completed",
  "cancelled",
];

export const fleetCostCategories: FleetCostCategory[] = [
  "fuel",
  "maintenance",
  "toll",
  "insurance",
  "tax",
  "other",
];

export const maintenanceStatusLabels: Record<MaintenanceStatus, string> = {
  scheduled: "Agendada",
  in_progress: "Em andamento",
  completed: "Concluída",
  cancelled: "Cancelada",
};

export const fleetCostCategoryLabels: Record<FleetCostCategory, string> = {
  fuel: "Combustível",
  maintenance: "Manutenção",
  toll: "Pedágio",
  insurance: "Seguro",
  tax: "Impostos",
  other: "Outro",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isMaintenanceStatus(value: unknown): value is MaintenanceStatus {
  return typeof value === "string" && maintenanceStatuses.some((status) => status === value);
}

function isFleetCostCategory(value: unknown): value is FleetCostCategory {
  return typeof value === "string" && fleetCostCategories.some((category) => category === value);
}

export function isMaintenanceOrder(value: unknown): value is MaintenanceOrder {
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    typeof value.vehicleId === "number" &&
    typeof value.vehiclePlate === "string" &&
    typeof value.description === "string" &&
    isMaintenanceStatus(value.status) &&
    (typeof value.scheduledAt === "string" || value.scheduledAt === null) &&
    (typeof value.completedAt === "string" || value.completedAt === null) &&
    (typeof value.costCents === "number" || value.costCents === null) &&
    typeof value.createdAt === "string"
  );
}

export function isFleetCost(value: unknown): value is FleetCost {
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    typeof value.vehicleId === "number" &&
    typeof value.vehiclePlate === "string" &&
    isFleetCostCategory(value.category) &&
    typeof value.description === "string" &&
    typeof value.amountCents === "number" &&
    typeof value.occurredAt === "string" &&
    typeof value.createdAt === "string"
  );
}

export function isPageResult<T>(
  value: unknown,
  isItem: (item: unknown) => item is T,
): value is PageResult<T> {
  return (
    isRecord(value) &&
    Array.isArray(value.items) &&
    value.items.every(isItem) &&
    typeof value.page === "number" &&
    typeof value.pageSize === "number" &&
    typeof value.totalItems === "number" &&
    typeof value.totalPages === "number"
  );
}

export type OperationVehicle = Pick<Vehicle, "id" | "plate" | "make" | "model">;
