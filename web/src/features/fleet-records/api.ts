import { readApiError, redirectOnUnauthorized } from "../../lib/api";

export type FuelRecordDraft = {
  vehicleId: number;
  driverId: number;
  litersMilliliters: number;
  amountCents: number;
  occurredAt: string;
  odometerKm: number;
  station: string | null;
  route: string;
};

export type FuelRecord = {
  id: number;
  vehicleId: number;
  vehiclePlate: string;
  driverName: string;
  litersMilliliters: number;
  amountCents: number;
  occurredAt: string;
  odometerKm: number;
  station: string | null;
  route: string;
  consumptionKmpl: number | null;
  historicalAverageKmpl: number | null;
};

export type MaintenanceRecordStatus =
  | "open"
  | "in_progress"
  | "waiting_part"
  | "waiting_service"
  | "completed";

export type MaintenanceRecordDraft = {
  vehicleId: number;
  problem: string;
  responsible: string;
  dueAt: string | null;
  partsUsed: string | null;
  status: MaintenanceRecordStatus;
  occurredAt: string;
  completedAt: string | null;
};

export type MaintenanceRecord = MaintenanceRecordDraft & {
  id: number;
  vehiclePlate: string;
  startedAt: string;
};

export type TireEventType = "installation" | "problem" | "rotation" | "inspection" | "replacement";

export type TireEvent = {
  id: number;
  type: TireEventType;
  description: string;
  occurredAt: string;
  odometerKm: number;
};

export type Tire = {
  id: number;
  vehicleId: number;
  vehiclePlate: string;
  position: string;
  brand: string;
  installedAt: string;
  installedOdometerKm: number;
  removedAt: string | null;
  removedOdometerKm: number | null;
  usageKm: number;
  events: TireEvent[];
};

export type TireDraft = Pick<Tire, "vehicleId" | "position" | "brand" | "installedAt" | "installedOdometerKm">;
export type TireEventDraft = Pick<TireEvent, "type" | "description" | "occurredAt" | "odometerKm">;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNullableString(value: unknown): value is string | null {
  return typeof value === "string" || value === null;
}

function isFuelRecord(value: unknown): value is FuelRecord {
  return isRecord(value) &&
    typeof value.id === "number" &&
    typeof value.vehicleId === "number" &&
    typeof value.vehiclePlate === "string" &&
    typeof value.driverName === "string" &&
    typeof value.litersMilliliters === "number" &&
    typeof value.amountCents === "number" &&
    typeof value.occurredAt === "string" &&
    typeof value.odometerKm === "number" &&
    isNullableString(value.station) &&
    typeof value.route === "string" &&
    (typeof value.consumptionKmpl === "number" || value.consumptionKmpl === null) &&
    (typeof value.historicalAverageKmpl === "number" || value.historicalAverageKmpl === null);
}

const maintenanceStatuses: MaintenanceRecordStatus[] = [
  "open",
  "in_progress",
  "waiting_part",
  "waiting_service",
  "completed",
];

function isMaintenanceRecord(value: unknown): value is MaintenanceRecord {
  return isRecord(value) &&
    typeof value.id === "number" &&
    typeof value.vehicleId === "number" &&
    typeof value.vehiclePlate === "string" &&
    typeof value.problem === "string" &&
    typeof value.responsible === "string" &&
    isNullableString(value.dueAt) &&
    isNullableString(value.partsUsed) &&
    typeof value.status === "string" &&
    maintenanceStatuses.some((status) => status === value.status) &&
    typeof value.occurredAt === "string" &&
    typeof value.startedAt === "string" &&
    isNullableString(value.completedAt);
}

const tireEventTypes: TireEventType[] = [
  "installation",
  "problem",
  "rotation",
  "inspection",
  "replacement",
];

function isTireEvent(value: unknown): value is TireEvent {
  return isRecord(value) &&
    typeof value.id === "number" &&
    typeof value.type === "string" &&
    tireEventTypes.some((type) => type === value.type) &&
    typeof value.description === "string" &&
    typeof value.occurredAt === "string" &&
    typeof value.odometerKm === "number";
}

function isTire(value: unknown): value is Tire {
  return isRecord(value) &&
    typeof value.id === "number" &&
    typeof value.vehicleId === "number" &&
    typeof value.vehiclePlate === "string" &&
    typeof value.position === "string" &&
    typeof value.brand === "string" &&
    typeof value.installedAt === "string" &&
    typeof value.installedOdometerKm === "number" &&
    isNullableString(value.removedAt) &&
    (typeof value.removedOdometerKm === "number" || value.removedOdometerKm === null) &&
    typeof value.usageKm === "number" &&
    Array.isArray(value.events) &&
    value.events.every(isTireEvent);
}

async function request(path: string, method = "GET", body?: unknown): Promise<unknown> {
  const response = await fetch(path, {
    method,
    ...(body === undefined
      ? {}
      : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
  });
  if (!response.ok) {
    redirectOnUnauthorized(response);
    throw new Error(await readApiError(response, "Não foi possível concluir a operação."));
  }
  if (response.status === 204) return null;
  return response.json();
}

async function requestList<T>(
  path: string,
  isItem: (value: unknown) => value is T,
  label: string,
): Promise<T[]> {
  const value = await request(path);
  if (!Array.isArray(value) || !value.every(isItem)) {
    throw new Error(`A resposta de ${label} está em um formato inválido.`);
  }
  return value;
}

export function listFuelRecords(): Promise<FuelRecord[]> {
  return requestList("/api/fuel-records", isFuelRecord, "abastecimentos");
}

export async function createFuelRecord(draft: FuelRecordDraft): Promise<void> {
  await request("/api/fuel-records", "POST", draft);
}

export function listMaintenanceRecords(): Promise<MaintenanceRecord[]> {
  return requestList("/api/maintenance-records", isMaintenanceRecord, "ocorrências");
}

export async function createMaintenanceRecord(draft: MaintenanceRecordDraft): Promise<void> {
  await request("/api/maintenance-records", "POST", draft);
}

export async function updateMaintenanceRecord(
  id: number,
  draft: MaintenanceRecordDraft,
): Promise<void> {
  await request(`/api/maintenance-records/${id}`, "PUT", draft);
}

export function listTires(): Promise<Tire[]> {
  return requestList("/api/tires", isTire, "pneus");
}

export async function createTire(draft: TireDraft): Promise<void> {
  await request("/api/tires", "POST", draft);
}

export async function createTireEvent(id: number, draft: TireEventDraft): Promise<void> {
  await request(`/api/tires/${id}/events`, "POST", draft);
}
