import {
  isDriver,
  isDriverListResponse,
  type DriverDraft,
  type DriverListResponse,
  type DriverStatus,
} from "./types";
import { readApiError, redirectOnUnauthorized } from "../../lib/api";

export type LicenseAlert = {
  id: number;
  name: string;
  dueAt: string;
};

function isLicenseAlert(value: unknown): value is LicenseAlert {
  return typeof value === "object" && value !== null &&
    "id" in value && typeof value.id === "number" &&
    "name" in value && typeof value.name === "string" &&
    "dueAt" in value && typeof value.dueAt === "string";
}

export async function listLicenseAlerts(): Promise<LicenseAlert[]> {
  const response = await fetch("/api/drivers/alerts", { cache: "no-store" });
  if (!response.ok) {
    redirectOnUnauthorized(response);
    throw new Error(await readApiError(response, "Não foi possível carregar os alertas de CNH."));
  }
  const payload: unknown = await response.json();
  if (!Array.isArray(payload) || !payload.every(isLicenseAlert)) {
    throw new Error("A resposta dos alertas de CNH está em um formato inválido.");
  }
  return payload;
}

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
