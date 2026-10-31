import {
  isDriver,
  isDriverListResponse,
  type DriverDraft,
  type DriverListResponse,
  type DriverStatus,
} from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function readError(response: Response, fallback: string): Promise<string> {
  try {
    const payload: unknown = await response.json();
    if (isRecord(payload) && typeof payload.error === "string") {
      return payload.error;
    }
  } catch {
    return fallback;
  }
  return fallback;
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
    if (response.status === 401) {
      window.location.replace("/login");
    }
    throw new Error(await readError(response, "Não foi possível carregar os motoristas."));
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
    throw new Error(await readError(response, "Não foi possível salvar o motorista."));
  }

  const payload: unknown = await response.json();
  if (!isDriver(payload)) {
    throw new Error("A resposta da API está em um formato inválido.");
  }
}

export async function deleteDriver(driverId: number): Promise<void> {
  const response = await fetch(`/api/drivers/${driverId}`, { method: "DELETE" });
  if (!response.ok) {
    throw new Error(await readError(response, "Não foi possível remover o motorista."));
  }
}
