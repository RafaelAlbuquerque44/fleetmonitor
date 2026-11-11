import { readApiError, redirectOnUnauthorized } from "../../lib/api";
import {
  isFleetCost,
  isMaintenanceOrder,
  isPageResult,
  type FleetCost,
  type FleetCostDraft,
  type MaintenanceDraft,
  type MaintenanceOrder,
  type PageResult,
} from "./types";

const pageSize = 25;

async function requestList<T>(
  path: string,
  page: number,
  isItem: (item: unknown) => item is T,
  fallback: string,
): Promise<PageResult<T>> {
  const response = await fetch(`${path}?page=${page}&pageSize=${pageSize}`);
  if (!response.ok) {
    redirectOnUnauthorized(response);
    throw new Error(await readApiError(response, fallback));
  }
  const payload: unknown = await response.json();
  if (!isPageResult(payload, isItem)) {
    throw new Error("A resposta da API está em um formato inválido.");
  }
  return payload;
}

async function writeJson(
  path: string,
  method: "POST" | "PUT",
  value: unknown,
  fallback: string,
): Promise<void> {
  const response = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(value),
  });
  if (!response.ok) {
    redirectOnUnauthorized(response);
    throw new Error(await readApiError(response, fallback));
  }
}

export function listMaintenance(page: number): Promise<PageResult<MaintenanceOrder>> {
  return requestList(
    "/api/maintenance",
    page,
    isMaintenanceOrder,
    "Não foi possível carregar as manutenções.",
  );
}

export function createMaintenance(draft: MaintenanceDraft): Promise<void> {
  return writeJson(
    "/api/maintenance",
    "POST",
    draft,
    "Não foi possível cadastrar a manutenção.",
  );
}

export function updateMaintenance(
  orderId: number,
  draft: MaintenanceDraft,
): Promise<void> {
  return writeJson(
    `/api/maintenance/${orderId}`,
    "PUT",
    draft,
    "Não foi possível atualizar a manutenção.",
  );
}

export function listCosts(page: number): Promise<PageResult<FleetCost>> {
  return requestList("/api/costs", page, isFleetCost, "Não foi possível carregar os custos.");
}

export function createCost(draft: FleetCostDraft): Promise<void> {
  return writeJson("/api/costs", "POST", draft, "Não foi possível cadastrar o custo.");
}
