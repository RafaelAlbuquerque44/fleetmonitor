import {
  isDriver,
  isDriverListResponse,
  type DriverDraft,
  type DriverListResponse,
  type DriverStatus,
} from "./types";
import { readApiError, redirectOnUnauthorized } from "../../lib/api";

export async function listDrivers(
  page: number,
  pageSize: number,
  query: string,
  status: "all" | DriverStatus,
): Promise<DriverListResponse> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    q: query.trim(),
    status,
  });
  const response = await fetch(`/api/drivers?${params}`);
  if (!response.ok) {
    redirectOnUnauthorized(response);
    throw new Error(await readApiError(response, "Não foi possível carregar os motoristas."));
  }

  const payload: unknown = await response.json();
  if (!isDriverListResponse(payload)) {
    throw new Error("A resposta da API está em um formato inválido.");
  }
  return payload;
}

export async function saveDriver(draft: DriverDraft, driverId?: number): Promise<void> {
  const response = await fetch(
    driverId ? `/api/drivers/${driverId}` : "/api/drivers",
    {
      method: driverId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    },
  );
  if (!response.ok) {
    redirectOnUnauthorized(response);
    throw new Error(await readApiError(response, "Não foi possível salvar o motorista."));
  }

  const payload: unknown = await response.json();
  if (!isDriver(payload)) {
    throw new Error("A resposta da API está em um formato inválido.");
  }
}

export async function deleteDriver(driverId: number): Promise<void> {
  const response = await fetch(`/api/drivers/${driverId}`, { method: "DELETE" });
  if (!response.ok) {
    redirectOnUnauthorized(response);
    throw new Error(await readApiError(response, "Não foi possível remover o motorista."));
  }
}
