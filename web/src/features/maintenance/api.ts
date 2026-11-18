import { readApiError, redirectOnUnauthorized } from "../../lib/api";

export type PreventiveServiceType =
  | "oil_change"
  | "brake_pads"
  | "washing"
  | "other";

export type PreventiveMaintenanceVehicle = {
  id: number;
  plate: string;
  make: string;
  model: string;
  currentOdometerKm: number | null;
};

export type PreventiveMaintenancePlan = {
  id: number;
  vehicleId: number;
  vehiclePlate: string;
  serviceType: "oil_change" | "brake_pads";
  intervalKm: number;
  lastServiceOdometerKm: number;
};

export type VehicleService = {
  id: number;
  vehicleId: number;
  vehiclePlate: string;
  driverName: string | null;
  serviceType: PreventiveServiceType;
  description: string | null;
  occurredAt: string;
  odometerKm: number;
};

export type OdometerReading = {
  id: number;
  vehicleId: number;
  vehiclePlate: string;
  driverName: string;
  occurredAt: string;
  odometerKm: number;
  distanceKm: number | null;
};

export type PreventiveMaintenanceData = {
  vehicles: PreventiveMaintenanceVehicle[];
  plans: PreventiveMaintenancePlan[];
  services: VehicleService[];
  readings: OdometerReading[];
};

export type OdometerReadingDraft = {
  vehicleId: number;
  driverId: number;
  occurredAt: string;
  odometerKm: number;
};

export type PreventiveMaintenancePlanDraft = {
  vehicleId: number;
  serviceType: "oil_change" | "brake_pads";
  intervalKm: number;
  lastServiceOdometerKm: number;
};

export type VehicleServiceDraft = {
  vehicleId: number;
  driverId: number | null;
  serviceType: PreventiveServiceType;
  description: string | null;
  occurredAt: string;
  odometerKm: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNullableString(value: unknown): value is string | null {
  return typeof value === "string" || value === null;
}

const serviceTypes: PreventiveServiceType[] = [
  "oil_change",
  "brake_pads",
  "washing",
  "other",
];

function isVehicle(value: unknown): value is PreventiveMaintenanceVehicle {
  return isRecord(value) &&
    typeof value.id === "number" &&
    typeof value.plate === "string" &&
    typeof value.make === "string" &&
    typeof value.model === "string" &&
    (typeof value.currentOdometerKm === "number" || value.currentOdometerKm === null);
}

function isPlan(value: unknown): value is PreventiveMaintenancePlan {
  return isRecord(value) &&
    typeof value.id === "number" &&
    typeof value.vehicleId === "number" &&
    typeof value.vehiclePlate === "string" &&
    (value.serviceType === "oil_change" || value.serviceType === "brake_pads") &&
    typeof value.intervalKm === "number" &&
    typeof value.lastServiceOdometerKm === "number";
}

function isVehicleService(value: unknown): value is VehicleService {
  return isRecord(value) &&
    typeof value.id === "number" &&
    typeof value.vehicleId === "number" &&
    typeof value.vehiclePlate === "string" &&
    isNullableString(value.driverName) &&
    typeof value.serviceType === "string" &&
    serviceTypes.some((type) => type === value.serviceType) &&
    isNullableString(value.description) &&
    typeof value.occurredAt === "string" &&
    typeof value.odometerKm === "number";
}

function isOdometerReading(value: unknown): value is OdometerReading {
  return isRecord(value) &&
    typeof value.id === "number" &&
    typeof value.vehicleId === "number" &&
    typeof value.vehiclePlate === "string" &&
    typeof value.driverName === "string" &&
    typeof value.occurredAt === "string" &&
    typeof value.odometerKm === "number" &&
    (typeof value.distanceKm === "number" || value.distanceKm === null);
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
  return response.status === 204 ? null : response.json();
}

export async function getPreventiveMaintenance(): Promise<PreventiveMaintenanceData> {
  const result = await request("/api/maintenance-preventive");
  if (
    !isRecord(result) ||
    !Array.isArray(result.vehicles) ||
    !result.vehicles.every(isVehicle) ||
    !Array.isArray(result.plans) ||
    !result.plans.every(isPlan) ||
    !Array.isArray(result.services) ||
    !result.services.every(isVehicleService) ||
    !Array.isArray(result.readings) ||
    !result.readings.every(isOdometerReading)
  ) {
    throw new Error("Os dados de manutenção estão em um formato inválido.");
  }
  return {
    vehicles: result.vehicles,
    plans: result.plans,
    services: result.services,
    readings: result.readings,
  };
}

export async function savePreventivePlan(draft: PreventiveMaintenancePlanDraft): Promise<void> {
  await request("/api/maintenance-preventive/plans", "POST", draft);
}

export async function saveOdometerReading(
  draft: OdometerReadingDraft,
): Promise<{ distanceKm: number | null; odometerKm: number }> {
  const result = await request("/api/maintenance-preventive/readings", "POST", draft);
  if (
    !isRecord(result) ||
    (typeof result.distanceKm !== "number" && result.distanceKm !== null) ||
    typeof result.odometerKm !== "number"
  ) {
    throw new Error("A resposta da quilometragem está em um formato inválido.");
  }
  return { distanceKm: result.distanceKm, odometerKm: result.odometerKm };
}

export async function saveVehicleService(draft: VehicleServiceDraft): Promise<void> {
  await request("/api/maintenance-preventive/services", "POST", draft);
}
