import {
  maintenanceRecordStatusEnum,
  maintenanceServiceTypeEnum,
  tireEventTypeEnum,
} from "../db/schema";

type ValidationResult<T> = { value: T } | { error: string };

export type FuelRecordInput = {
  vehicleId: number;
  driverId: number;
  litersMilliliters: number;
  amountCents: number;
  occurredAt: string;
  odometerKm: number;
  station: string | null;
  route: string;
};

export type MaintenanceRecordInput = {
  vehicleId: number;
  problem: string;
  responsible: string;
  dueAt: string | null;
  partsUsed: string | null;
  status: (typeof maintenanceRecordStatusEnum.enumValues)[number];
  occurredAt: string;
  completedAt: string | null;
};

export type TireInput = {
  vehicleId: number;
  position: string;
  brand: string;
  installedAt: string;
  installedOdometerKm: number;
};

export type TireEventInput = {
  type: (typeof tireEventTypeEnum.enumValues)[number];
  description: string;
  occurredAt: string;
  odometerKm: number;
};

export type OdometerReadingInput = {
  vehicleId: number;
  driverId: number;
  occurredAt: string;
  odometerKm: number;
};

export type PreventiveMaintenancePlanInput = {
  vehicleId: number;
  serviceType: "oil_change" | "brake_pads";
  intervalKm: number;
  lastServiceOdometerKm: number;
};

export type VehicleServiceInput = {
  vehicleId: number;
  driverId: number | null;
  serviceType: (typeof maintenanceServiceTypeEnum.enumValues)[number];
  description: string | null;
  occurredAt: string;
  odometerKm: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function trimmedText(value: unknown, limit: number): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text.length > 0 && text.length <= limit ? text : null;
}

function optionalText(value: unknown, limit: number): string | null | undefined {
  if (value === undefined || value === null || value === "") return null;
  return trimmedText(value, limit) ?? undefined;
}

export function parseFuelRecordInput(payload: unknown): ValidationResult<FuelRecordInput> {
  if (!isRecord(payload)) return { error: "Os dados do abastecimento são inválidos." };
  const station = optionalText(payload.station, 200);
  const route = trimmedText(payload.route, 2000);
  if (!isPositiveInteger(payload.vehicleId) || !isPositiveInteger(payload.driverId)) {
    return { error: "Selecione um veículo e um motorista válidos." };
  }
  if (!isPositiveInteger(payload.litersMilliliters) || payload.litersMilliliters > 5_000_000) {
    return { error: "Informe a quantidade abastecida em mililitros." };
  }
  if (!isPositiveInteger(payload.amountCents) || payload.amountCents > 2_147_483_647) {
    return { error: "Informe um valor válido em centavos." };
  }
  if (!isIsoDate(payload.occurredAt)) return { error: "Informe uma data válida para o abastecimento." };
  if (!isNonNegativeInteger(payload.odometerKm) || payload.odometerKm > 2_147_483_647) {
    return { error: "Informe uma quilometragem válida." };
  }
  if (station === undefined) return { error: "O posto informado é inválido." };
  if (!route) return { error: "Informe a rota." };
  return {
    value: {
      vehicleId: payload.vehicleId,
      driverId: payload.driverId,
      litersMilliliters: payload.litersMilliliters,
      amountCents: payload.amountCents,
      occurredAt: payload.occurredAt,
      odometerKm: payload.odometerKm,
      station,
      route,
    },
  };
}

export function parseMaintenanceRecordInput(
  payload: unknown,
): ValidationResult<MaintenanceRecordInput> {
  if (!isRecord(payload)) return { error: "Os dados da ocorrência são inválidos." };
  const problem = trimmedText(payload.problem, 2000);
  const responsible = trimmedText(payload.responsible, 200);
  const partsUsed = optionalText(payload.partsUsed, 2000);
  const dueAt = payload.dueAt === undefined || payload.dueAt === null || payload.dueAt === ""
    ? null
    : isIsoDate(payload.dueAt) ? payload.dueAt : undefined;
  const completedAt = payload.completedAt === undefined || payload.completedAt === null || payload.completedAt === ""
    ? null
    : isIsoDate(payload.completedAt) ? payload.completedAt : undefined;
  const status = maintenanceRecordStatusEnum.enumValues.find((item) => item === payload.status);
  if (!isPositiveInteger(payload.vehicleId)) return { error: "Selecione um veículo válido." };
  if (!problem || !responsible) return { error: "Informe o problema e o responsável." };
  if (partsUsed === undefined) return { error: "As peças utilizadas são inválidas." };
  if (dueAt === undefined || completedAt === undefined || !isIsoDate(payload.occurredAt)) {
    return { error: "Informe datas válidas para a ocorrência." };
  }
  if (!status) return { error: "Selecione uma situação válida para a ocorrência." };
  if (status === "completed" && completedAt === null) {
    return { error: "Informe a data de finalização da ocorrência." };
  }
  if (status !== "completed" && completedAt !== null) {
    return { error: "A data de finalização só pode ser informada para ocorrências finalizadas." };
  }
  if (completedAt !== null && completedAt < payload.occurredAt) {
    return { error: "A finalização não pode ser anterior ao início da ocorrência." };
  }
  return {
    value: {
      vehicleId: payload.vehicleId,
      problem,
      responsible,
      dueAt,
      partsUsed,
      status,
      occurredAt: payload.occurredAt,
      completedAt,
    },
  };
}

export function parseTireInput(payload: unknown): ValidationResult<TireInput> {
  if (!isRecord(payload)) return { error: "Os dados do pneu são inválidos." };
  const position = trimmedText(payload.position, 100);
  const brand = trimmedText(payload.brand, 100);
  if (!isPositiveInteger(payload.vehicleId)) return { error: "Selecione um veículo válido." };
  if (!position || !brand) return { error: "Informe a posição e a marca do pneu." };
  if (!isIsoDate(payload.installedAt)) return { error: "Informe uma data de instalação válida." };
  if (!isNonNegativeInteger(payload.installedOdometerKm) || payload.installedOdometerKm > 2_147_483_647) {
    return { error: "Informe a quilometragem de instalação." };
  }
  return {
    value: {
      vehicleId: payload.vehicleId,
      position,
      brand,
      installedAt: payload.installedAt,
      installedOdometerKm: payload.installedOdometerKm,
    },
  };
}

export function parseTireEventInput(payload: unknown): ValidationResult<TireEventInput> {
  if (!isRecord(payload)) return { error: "Os dados do histórico do pneu são inválidos." };
  const type = tireEventTypeEnum.enumValues.find((item) => item === payload.type);
  const description = trimmedText(payload.description, 2000);
  if (!type || type === "replacement") return { error: "Selecione um tipo de evento válido." };
  if (!description) return { error: "Informe os detalhes do evento." };
  if (!isIsoDate(payload.occurredAt)) return { error: "Informe uma data válida para o evento." };
  if (!isNonNegativeInteger(payload.odometerKm) || payload.odometerKm > 2_147_483_647) {
    return { error: "Informe uma quilometragem válida." };
  }
  return {
    value: {
      type,
      description,
      occurredAt: payload.occurredAt,
      odometerKm: payload.odometerKm,
    },
  };
}

export function parseOdometerReadingInput(
  payload: unknown,
): ValidationResult<OdometerReadingInput> {
  if (!isRecord(payload)) return { error: "Os dados da quilometragem são inválidos." };
  if (!isPositiveInteger(payload.vehicleId) || !isPositiveInteger(payload.driverId)) {
    return { error: "Selecione um veículo e um motorista válidos." };
  }
  if (!isIsoDate(payload.occurredAt)) return { error: "Informe uma data válida para a leitura." };
  if (!isNonNegativeInteger(payload.odometerKm) || payload.odometerKm > 2_147_483_647) {
    return { error: "Informe uma quilometragem válida." };
  }
  return {
    value: {
      vehicleId: payload.vehicleId,
      driverId: payload.driverId,
      occurredAt: payload.occurredAt,
      odometerKm: payload.odometerKm,
    },
  };
}

export function parsePreventiveMaintenancePlanInput(
  payload: unknown,
): ValidationResult<PreventiveMaintenancePlanInput> {
  if (!isRecord(payload)) return { error: "Os dados do lembrete são inválidos." };
  const serviceType = payload.serviceType;
  if (!isPositiveInteger(payload.vehicleId)) return { error: "Selecione um veículo válido." };
  if (serviceType !== "oil_change" && serviceType !== "brake_pads") {
    return { error: "Selecione um item de manutenção preventiva válido." };
  }
  if (!isPositiveInteger(payload.intervalKm) || payload.intervalKm > 1_000_000) {
    return { error: "Informe um intervalo em quilômetros válido." };
  }
  if (!isNonNegativeInteger(payload.lastServiceOdometerKm) || payload.lastServiceOdometerKm > 2_147_483_647) {
    return { error: "Informe a quilometragem válida do último serviço." };
  }
  return {
    value: {
      vehicleId: payload.vehicleId,
      serviceType,
      intervalKm: payload.intervalKm,
      lastServiceOdometerKm: payload.lastServiceOdometerKm,
    },
  };
}

export function parseVehicleServiceInput(
  payload: unknown,
): ValidationResult<VehicleServiceInput> {
  if (!isRecord(payload)) return { error: "Os dados do serviço são inválidos." };
  const serviceType = maintenanceServiceTypeEnum.enumValues.find(
    (item) => item === payload.serviceType,
  );
  const driverId =
    payload.driverId === undefined || payload.driverId === null || payload.driverId === ""
      ? null
      : isPositiveInteger(payload.driverId) ? payload.driverId : undefined;
  const description = optionalText(payload.description, 1000);
  if (!isPositiveInteger(payload.vehicleId)) return { error: "Selecione um veículo válido." };
  if (driverId === undefined) return { error: "Selecione um motorista válido." };
  if (!serviceType) return { error: "Selecione um tipo de serviço válido." };
  if (description === undefined) return { error: "A descrição do serviço é inválida." };
  if (!isIsoDate(payload.occurredAt)) return { error: "Informe uma data válida para o serviço." };
  if (!isNonNegativeInteger(payload.odometerKm) || payload.odometerKm > 2_147_483_647) {
    return { error: "Informe uma quilometragem válida." };
  }
  return {
    value: {
      vehicleId: payload.vehicleId,
      driverId,
      serviceType,
      description,
      occurredAt: payload.occurredAt,
      odometerKm: payload.odometerKm,
    },
  };
}
