import { driverLicenseCategoryEnum, driverStatusEnum } from "../db/schema";

export type DriverInput = {
  fullName: string;
  cpf: string;
  licenseNumber: string;
  licenseCategory: (typeof driverLicenseCategoryEnum.enumValues)[number];
  licenseExpiresAt: string;
  phone: string | null;
  status: (typeof driverStatusEnum.enumValues)[number];
};

export type DriverInputResult = { value: DriverInput } | { error: string };

export type DriverListQuery = {
  page: number;
  pageSize: number;
  offset: number;
  query: string;
  status: (typeof driverStatusEnum.enumValues)[number] | undefined;
};

export type DriverListQueryResult =
  | { value: DriverListQuery }
  | { error: string };

function isValidCpf(cpf: string): boolean {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) {
    return false;
  }

  const digits = [...cpf].map(Number);
  const calculateDigit = (length: number) => {
    const sum = digits
      .slice(0, length)
      .reduce((total, digit, index) => total + digit * (length + 1 - index), 0);
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  return calculateDigit(9) === digits[9] && calculateDigit(10) === digits[10];
}

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function parseDriverInput(payload: unknown): DriverInputResult {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    return { error: "Os dados do motorista são inválidos." };
  }

  const values = payload as Record<string, unknown>;
  const fullName = typeof values.fullName === "string" ? values.fullName.trim() : "";
  const cpf =
    typeof values.cpf === "string" ? values.cpf.replace(/\D/g, "") : "";
  const licenseNumber =
    typeof values.licenseNumber === "string"
      ? values.licenseNumber.replace(/\D/g, "")
      : "";
  const licenseCategory = driverLicenseCategoryEnum.enumValues.find(
    (value) => value === values.licenseCategory,
  );
  const licenseExpiresAt =
    typeof values.licenseExpiresAt === "string" ? values.licenseExpiresAt : "";
  const phone =
    typeof values.phone === "string" ? values.phone.trim() : "";
  const status =
    values.status === undefined
      ? "active"
      : driverStatusEnum.enumValues.find((value) => value === values.status);

  if (fullName.length < 2 || fullName.length > 150) {
    return { error: "Informe o nome do motorista (de 2 a 150 caracteres)." };
  }
  if (!isValidCpf(cpf)) {
    return { error: "Informe um CPF válido." };
  }
  if (!/^\d{11}$/.test(licenseNumber)) {
    return { error: "Informe um número de CNH válido com 11 dígitos." };
  }
  if (!licenseCategory) {
    return { error: "Selecione uma categoria de CNH válida." };
  }
  if (!isValidDate(licenseExpiresAt)) {
    return { error: "Informe uma data de validade da CNH válida." };
  }
  if (phone.length > 30) {
    return { error: "O telefone deve ter até 30 caracteres." };
  }
  if (!status) {
    return { error: "Selecione um status válido para o motorista." };
  }

  return {
    value: {
      fullName,
      cpf,
      licenseNumber,
      licenseCategory,
      licenseExpiresAt,
      phone: phone || null,
      status,
    },
  };
}

export function parseDriverListQuery(
  params: URLSearchParams,
): DriverListQueryResult {
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
      : driverStatusEnum.enumValues.find((value) => value === statusValue);
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
