import {
  isVehicle,
  isFleetSummary,
  isVehicleListResponse,
  type FleetSummary,
  type VehicleDraft,
  type VehicleListResponse,
  type VehicleStatus,
} from "./types";
import { readApiError, redirectOnUnauthorized } from "../../lib/api";

export async function listVehicles(
  page: number,
  pageSize: number,
  query: string,
  status: "all" | VehicleStatus,
): Promise<VehicleListResponse> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    q: query.trim(),
    status,
  });
  const response = await fetch(`/api/vehicles?${params}`);

  if (!response.ok) {
    redirectOnUnauthorized(response);
    throw new Error(await readApiError(response, "Não foi possível carregar os veículos."));
  }

  const payload: unknown = await response.json();
  if (!isVehicleListResponse(payload)) {
    throw new Error("A resposta da API está em um formato inválido.");
  }
  return payload;
}

export async function getFleetSummary(): Promise<FleetSummary> {
  const response = await fetch("/api/vehicles/summary");

  if (!response.ok) {
    redirectOnUnauthorized(response);
    throw new Error(await readApiError(response, "Não foi possível carregar o resumo da frota."));
  }

  const payload: unknown = await response.json();
  if (!isFleetSummary(payload)) {
    throw new Error("A resposta da API está em um formato inválido.");
  }
  return payload;
}

export async function saveVehicle(
  draft: VehicleDraft,
  vehicleId?: number,
): Promise<void> {
  const response = await fetch(
    vehicleId ? `/api/vehicles/${vehicleId}` : "/api/vehicles",
    {
      method: vehicleId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...draft, plate: draft.plate.trim().toUpperCase() }),
    },
  );

  if (!response.ok) {
    redirectOnUnauthorized(response);
    throw new Error(await readApiError(response, "Não foi possível salvar o veículo."));
  }

  const payload: unknown = await response.json();
  if (!isVehicle(payload)) {
    throw new Error("A resposta da API está em um formato inválido.");
  }
}

export async function deleteVehicle(vehicleId: number): Promise<void> {
  const response = await fetch(`/api/vehicles/${vehicleId}`, { method: "DELETE" });
  if (!response.ok) {
    redirectOnUnauthorized(response);
    throw new Error(await readApiError(response, "Não foi possível remover o veículo."));
  }
}
