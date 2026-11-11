import { fleetCostCategoryEnum, maintenanceStatusEnum } from "../db/schema";

export type MaintenanceInput = {
  vehicleId: number;
  description: string;
  status: (typeof maintenanceStatusEnum.enumValues)[number];
  scheduledAt: string | null;
  completedAt: string | null;
  costCents: number | null;
};

export type FleetCostInput = {
  vehicleId: number;
  category: (typeof fleetCostCategoryEnum.enumValues)[number];
  description: string;
  amountCents: number;
  occurredAt: string;
};

export type OperationPageQuery = {
  page: number;
  pageSize: number;
  offset: number;
};

export type MaintenanceListQuery = OperationPageQuery & {
  status: MaintenanceInput["status"] | undefined;
};

export type FleetCostListQuery = OperationPageQuery & {
  category: FleetCostInput["category"] | undefined;
};

export type ValidationResult<T> = { value: T } | { error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSafeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value);
}

function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function optionalDate(value: unknown): string | null | undefined {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  return isIsoDate(value) ? value : undefined;
}

function parsePageQuery(params: URLSearchParams): ValidationResult<OperationPageQuery> {
  const pageValue = params.get("page") ?? "1";
  const pageSizeValue = params.get("pageSize") ?? "25";
  const page = Number(pageValue);
  const pageSize = Number(pageSizeValue);
  const offset = (page - 1) * pageSize;

  if (!/^[1-9]\d*$/.test(pageValue) || !Number.isSafeInteger(page)) {
    return { error: "Número de página inválido." };
  }
  if (
    !/^[1-9]\d*$/.test(pageSizeValue) ||
    !Number.isSafeInteger(pageSize) ||
    pageSize > 100
  ) {
    return { error: "O tamanho da página deve estar entre 1 e 100." };
  }
  if (!Number.isSafeInteger(offset)) {
    return { error: "Número de página inválido." };
  }
  return { value: { page, pageSize, offset } };
}

export function parseMaintenanceInput(payload: unknown): ValidationResult<MaintenanceInput> {
  if (!isRecord(payload)) {
    return { error: "Os dados da manutenção são inválidos." };
  }

  const vehicleId = payload.vehicleId;
  const description =
    typeof payload.description === "string" ? payload.description.trim() : "";
  const status =
    payload.status === undefined
      ? "scheduled"
      : maintenanceStatusEnum.enumValues.find((value) => value === payload.status);
  const scheduledAt = optionalDate(payload.scheduledAt);
  const completedAt = optionalDate(payload.completedAt);
  const costCents =
    payload.costCents === undefined || payload.costCents === null
      ? null
      : payload.costCents;

  if (!isSafeInteger(vehicleId) || vehicleId < 1) {
    return { error: "Selecione um veículo válido." };
  }
  if (description.length === 0 || description.length > 2000) {
    return { error: "Informe a descrição da manutenção (até 2.000 caracteres)." };
  }
  if (!status) {
    return { error: "Selecione um status válido para a manutenção." };
  }
  if (scheduledAt === undefined || completedAt === undefined) {
    return { error: "Informe datas válidas no formato AAAA-MM-DD." };
  }
  if (
    costCents !== null &&
    (!isSafeInteger(costCents) || costCents < 0 || costCents > 2_147_483_647)
  ) {
    return { error: "O custo deve ser um valor inteiro não negativo em centavos." };
  }
  if (status === "completed" && completedAt === null) {
    return { error: "Informe a data de conclusão da manutenção." };
  }
  if (status !== "completed" && completedAt !== null) {
    return { error: "A data de conclusão só pode ser informada para uma manutenção concluída." };
  }

  return {
    value: {
      vehicleId,
      description,
      status,
      scheduledAt,
      completedAt,
      costCents,
    },
  };
}

export function parseFleetCostInput(payload: unknown): ValidationResult<FleetCostInput> {
  if (!isRecord(payload)) {
    return { error: "Os dados do custo são inválidos." };
  }

  const vehicleId = payload.vehicleId;
  const category = fleetCostCategoryEnum.enumValues.find(
    (value) => value === payload.category,
  );
  const description =
    typeof payload.description === "string" ? payload.description.trim() : "";
  const amountCents = payload.amountCents;
  const occurredAt = payload.occurredAt;

  if (!isSafeInteger(vehicleId) || vehicleId < 1) {
    return { error: "Selecione um veículo válido." };
  }
  if (!category) {
    return { error: "Selecione uma categoria de custo válida." };
  }
  if (description.length === 0 || description.length > 500) {
    return { error: "Informe a descrição do custo (até 500 caracteres)." };
  }
  if (
    !isSafeInteger(amountCents) ||
    amountCents < 1 ||
    amountCents > 2_147_483_647
  ) {
    return { error: "Informe um valor inteiro positivo em centavos." };
  }
  if (!isIsoDate(occurredAt)) {
    return { error: "Informe a data do custo no formato AAAA-MM-DD." };
  }

  return {
    value: {
      vehicleId,
      category,
      description,
      amountCents,
      occurredAt,
    },
  };
}

export function parseMaintenanceListQuery(
  params: URLSearchParams,
): ValidationResult<MaintenanceListQuery> {
  const page = parsePageQuery(params);
  if ("error" in page) {
    return page;
  }
  const statusValue = params.get("status") ?? "all";
  const status =
    statusValue === "all"
      ? undefined
      : maintenanceStatusEnum.enumValues.find((value) => value === statusValue);
  if (statusValue !== "all" && !status) {
    return { error: "Filtro de status inválido." };
  }
  return { value: { ...page.value, status } };
}

export function parseCostListQuery(
  params: URLSearchParams,
): ValidationResult<FleetCostListQuery> {
  const page = parsePageQuery(params);
  if ("error" in page) {
    return page;
  }
  const categoryValue = params.get("category") ?? "all";
  const category =
    categoryValue === "all"
      ? undefined
      : fleetCostCategoryEnum.enumValues.find((value) => value === categoryValue);
  if (categoryValue !== "all" && !category) {
    return { error: "Filtro de categoria inválido." };
  }
  return { value: { ...page.value, category } };
}
