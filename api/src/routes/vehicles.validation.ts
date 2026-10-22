import { vehicleStatusEnum } from "../db/schema";

export type VehicleInput = {
  plate: string;
  make: string;
  model: string;
  year: number;
  status: (typeof vehicleStatusEnum.enumValues)[number];
};

export type VehicleInputResult = { value: VehicleInput } | { error: string };

export type VehicleListQuery = {
  page: number;
  pageSize: number;
  offset: number;
  query: string;
  status: (typeof vehicleStatusEnum.enumValues)[number] | undefined;
};

export type VehicleListQueryResult =
  | { value: VehicleListQuery }
  | { error: string };

export function parseVehicleInput(payload: unknown): VehicleInputResult {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    return { error: "Os dados do veículo são inválidos." };
  }

  const values = payload as Record<string, unknown>;
  const plate = typeof values.plate === "string" ? values.plate.trim().toUpperCase() : "";
  const make = typeof values.make === "string" ? values.make.trim() : "";
  const model = typeof values.model === "string" ? values.model.trim() : "";
  const year = values.year;
  const status =
    values.status === undefined
      ? "operational"
      : vehicleStatusEnum.enumValues.find((value) => value === values.status);

  if (!/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(plate)) {
    return { error: "Informe uma placa válida com 7 caracteres." };
  }
  if (make.length === 0 || make.length > 100 || model.length === 0 || model.length > 100) {
    return { error: "Informe a marca e o modelo do veículo (até 100 caracteres)." };
  }
  if (
    typeof year !== "number" ||
    !Number.isInteger(year) ||
    year < 1900 ||
    year > new Date().getFullYear() + 1
  ) {
    return { error: "Informe um ano de fabricação válido." };
  }
  if (!status) {
    return { error: "Selecione um status válido para o veículo." };
  }

  return { value: { plate, make, model, year, status } };
}

export function parseVehicleListQuery(
  params: URLSearchParams,
): VehicleListQueryResult {
  const pageValue = params.get("page") ?? "1";
  const pageSizeValue = params.get("pageSize") ?? "25";
  const page = Number(pageValue);
  const pageSize = Number(pageSizeValue);
  const statusValue = params.get("status") ?? "all";

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

  const status =
    statusValue === "all"
      ? undefined
      : vehicleStatusEnum.enumValues.find((value) => value === statusValue);
  if (statusValue !== "all" && !status) {
    return { error: "Filtro de status inválido." };
  }

  const offset = (page - 1) * pageSize;
  if (!Number.isSafeInteger(offset)) {
    return { error: "Número de página inválido." };
  }

  return {
    value: {
      page,
      pageSize,
      offset,
      query: (params.get("q") ?? "").trim(),
      status,
    },
  };
}
