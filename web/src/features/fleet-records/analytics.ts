import type { FuelRecord, MaintenanceRecord, Tire } from "./api";

export const fuelDeviationThresholdPercent = 15;
export const standardTireLifeKm = 60000;
export const tireAttentionRatio = 0.8;
export const tireEarlyReplacementRatio = 0.7;

export type FuelDeviationLevel = "normal" | "worse" | "better";

export type FuelDeviation = {
  variationPercent: number;
  level: FuelDeviationLevel;
};

export function getFuelDeviation(record: FuelRecord): FuelDeviation | null {
  if (
    record.consumptionKmpl === null ||
    record.historicalAverageKmpl === null ||
    record.historicalAverageKmpl <= 0
  ) {
    return null;
  }
  const variationPercent =
    ((record.consumptionKmpl - record.historicalAverageKmpl) / record.historicalAverageKmpl) * 100;
  const level: FuelDeviationLevel =
    variationPercent <= -fuelDeviationThresholdPercent
      ? "worse"
      : variationPercent >= fuelDeviationThresholdPercent
        ? "better"
        : "normal";
  return { variationPercent, level };
}

export type VehicleFuelSummary = {
  vehicleId: number;
  vehiclePlate: string;
  recordCount: number;
  averageKmpl: number | null;
  lastKmpl: number | null;
  totalLiters: number;
  totalCostCents: number;
  costPerKmCents: number | null;
  deviationCount: number;
};

export function summarizeFuelByVehicle(records: FuelRecord[]): VehicleFuelSummary[] {
  const groups = new Map<number, FuelRecord[]>();
  for (const record of records) {
    const current = groups.get(record.vehicleId) ?? [];
    current.push(record);
    groups.set(record.vehicleId, current);
  }

  return [...groups.entries()]
    .map(([vehicleId, items]) => {
      const ordered = [...items].sort((a, b) => a.odometerKm - b.odometerKm || a.id - b.id);
      let distanceKm = 0;
      let measuredLiters = 0;
      let measuredCostCents = 0;
      let lastKmpl: number | null = null;
      let deviationCount = 0;
      for (const record of ordered) {
        if (record.consumptionKmpl !== null) {
          const liters = record.litersMilliliters / 1000;
          distanceKm += record.consumptionKmpl * liters;
          measuredLiters += liters;
          measuredCostCents += record.amountCents;
          lastKmpl = record.consumptionKmpl;
        }
        if (getFuelDeviation(record)?.level === "worse") deviationCount += 1;
      }
      return {
        vehicleId,
        vehiclePlate: ordered[0]?.vehiclePlate ?? "",
        recordCount: ordered.length,
        averageKmpl: measuredLiters > 0 ? distanceKm / measuredLiters : null,
        lastKmpl,
        totalLiters: ordered.reduce((sum, record) => sum + record.litersMilliliters, 0) / 1000,
        totalCostCents: ordered.reduce((sum, record) => sum + record.amountCents, 0),
        costPerKmCents: distanceKm > 0 ? measuredCostCents / distanceKm : null,
        deviationCount,
      };
    })
    .sort((a, b) => b.deviationCount - a.deviationCount || a.vehiclePlate.localeCompare(b.vehiclePlate));
}

export type InsightSeverity = "critical" | "warning" | "info";

export type MaintenanceInsight = {
  id: string;
  severity: InsightSeverity;
  vehiclePlate: string;
  title: string;
  detail: string;
};

export type VehicleMaintenanceHistory = {
  vehicleId: number;
  vehiclePlate: string;
  total: number;
  open: number;
  lastOccurredAt: string;
  averageResolutionDays: number | null;
  parts: string[];
};

export type MaintenanceAnalysis = {
  insights: MaintenanceInsight[];
  history: VehicleMaintenanceHistory[];
  openCount: number;
  overdueCount: number;
  averageResolutionDays: number | null;
};

const dayMs = 24 * 60 * 60 * 1000;
const recurrenceWindowDays = 180;
const staleOpenDays = 15;
const stalePartDays = 7;

function dayNumber(value: string) {
  return Math.floor(Date.parse(`${value.slice(0, 10)}T00:00:00Z`) / dayMs);
}

function normalizeProblem(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3)
    .slice(0, 2)
    .join(" ");
}

const severityOrder: Record<InsightSeverity, number> = { critical: 0, warning: 1, info: 2 };

export function analyzeMaintenance(records: MaintenanceRecord[], today: string): MaintenanceAnalysis {
  const todayNumber = dayNumber(today);
  const insights: MaintenanceInsight[] = [];
  const groups = new Map<number, MaintenanceRecord[]>();
  for (const record of records) {
    const current = groups.get(record.vehicleId) ?? [];
    current.push(record);
    groups.set(record.vehicleId, current);
  }

  let overdueCount = 0;
  const history: VehicleMaintenanceHistory[] = [];
  const resolutionDays: number[] = [];

  for (const [vehicleId, items] of groups) {
    const plate = items[0]?.vehiclePlate ?? "";
    const resolved = items
      .filter((record) => record.completedAt)
      .map((record) => Math.max(0, dayNumber(record.completedAt ?? record.occurredAt) - dayNumber(record.occurredAt)));
    resolutionDays.push(...resolved);

    const parts = new Set<string>();
    for (const record of items) {
      for (const part of (record.partsUsed ?? "").split(/[,;]/)) {
        const trimmed = part.trim();
        if (trimmed) parts.add(trimmed);
      }
    }

    history.push({
      vehicleId,
      vehiclePlate: plate,
      total: items.length,
      open: items.filter((record) => record.status !== "completed").length,
      lastOccurredAt: items.reduce((latest, record) => (record.occurredAt > latest ? record.occurredAt : latest), ""),
      averageResolutionDays: resolved.length === 0 ? null : resolved.reduce((a, b) => a + b, 0) / resolved.length,
      parts: [...parts].slice(0, 6),
    });

    for (const record of items) {
      if (record.status === "completed") continue;
      const age = todayNumber - dayNumber(record.occurredAt);
      if (record.dueAt && dayNumber(record.dueAt) < todayNumber) {
        overdueCount += 1;
        insights.push({
          id: `overdue-${record.id}`,
          severity: "critical",
          vehiclePlate: plate,
          title: "Prazo vencido",
          detail: `"${record.problem}" venceu há ${todayNumber - dayNumber(record.dueAt)} dia(s). Priorize ${record.responsible} para concluir o serviço.`,
        });
      } else if (record.status === "waiting_part" && age > stalePartDays) {
        insights.push({
          id: `part-${record.id}`,
          severity: "warning",
          vehiclePlate: plate,
          title: "Aguardando peça há muitos dias",
          detail: `Ocorrência aberta há ${age} dias. Cobre o fornecedor ou avalie uma peça alternativa para reduzir a indisponibilidade.`,
        });
      } else if (age > staleOpenDays) {
        insights.push({
          id: `stale-${record.id}`,
          severity: "warning",
          vehiclePlate: plate,
          title: "Ocorrência parada",
          detail: `"${record.problem}" está aberta há ${age} dias sem finalização.`,
        });
      }
    }

    const recent = items.filter((record) => todayNumber - dayNumber(record.occurredAt) <= recurrenceWindowDays);
    if (recent.length >= 3) {
      insights.push({
        id: `frequency-${vehicleId}`,
        severity: "warning",
        vehiclePlate: plate,
        title: "Alta frequência de manutenções",
        detail: `${recent.length} ocorrências nos últimos ${recurrenceWindowDays} dias. Considere uma revisão completa ou avaliar a substituição do veículo.`,
      });
    }

    const byProblem = new Map<string, MaintenanceRecord[]>();
    for (const record of items) {
      const key = normalizeProblem(record.problem);
      if (!key) continue;
      byProblem.set(key, [...(byProblem.get(key) ?? []), record]);
    }
    for (const [key, repeated] of byProblem) {
      if (repeated.length >= 2) {
        insights.push({
          id: `repeat-${vehicleId}-${key}`,
          severity: "warning",
          vehiclePlate: plate,
          title: "Problema recorrente",
          detail: `"${repeated[0]?.problem}" aparece ${repeated.length} vezes no histórico. Investigue a causa raiz antes da próxima intervenção.`,
        });
      }
    }
  }

  const averageResolutionDays = resolutionDays.length === 0
    ? null
    : resolutionDays.reduce((a, b) => a + b, 0) / resolutionDays.length;

  return {
    insights: insights.sort(
      (a, b) => severityOrder[a.severity] - severityOrder[b.severity] || a.vehiclePlate.localeCompare(b.vehiclePlate),
    ),
    history: history.sort((a, b) => b.open - a.open || b.total - a.total || a.vehiclePlate.localeCompare(b.vehiclePlate)),
    openCount: records.filter((record) => record.status !== "completed").length,
    overdueCount,
    averageResolutionDays,
  };
}

export type TireLifespanState =
  | "ok"
  | "attention"
  | "exceeded"
  | "early-replacement"
  | "replaced-on-time"
  | "replaced-over-limit";

export type TireLifespan = {
  usageKm: number;
  usagePercent: number;
  remainingKm: number;
  daysInUse: number;
  kmPerMonth: number | null;
  problemCount: number;
  state: TireLifespanState;
};

export function analyzeTire(tire: Tire, today: string): TireLifespan {
  const endDate = tire.removedAt ?? today;
  const daysInUse = Math.max(0, dayNumber(endDate) - dayNumber(tire.installedAt));
  const usagePercent = (tire.usageKm / standardTireLifeKm) * 100;
  const ratio = tire.usageKm / standardTireLifeKm;
  const problemCount = tire.events.filter((event) => event.type === "problem").length;
  const state: TireLifespanState = tire.removedAt
    ? ratio > 1
      ? "replaced-over-limit"
      : ratio < tireEarlyReplacementRatio
        ? "early-replacement"
        : "replaced-on-time"
    : ratio >= 1
      ? "exceeded"
      : ratio >= tireAttentionRatio
        ? "attention"
        : "ok";
  return {
    usageKm: tire.usageKm,
    usagePercent,
    remainingKm: Math.max(0, standardTireLifeKm - tire.usageKm),
    daysInUse,
    kmPerMonth: daysInUse >= 30 ? tire.usageKm / (daysInUse / 30) : null,
    problemCount,
    state,
  };
}

export const tireStateLabels: Record<TireLifespanState, string> = {
  ok: "Dentro da vida útil",
  attention: "Próximo do limite",
  exceeded: "Vida útil excedida",
  "early-replacement": "Substituição antecipada",
  "replaced-on-time": "Substituído no padrão",
  "replaced-over-limit": "Substituído após o limite",
};

export type TireFleetSummary = {
  active: number;
  replaced: number;
  alerts: number;
  averageReplacedKm: number | null;
  byBrand: { brand: string; replaced: number; averageKm: number }[];
};

export function summarizeTires(tires: Tire[], today: string): TireFleetSummary {
  const replaced = tires.filter((tire) => tire.removedAt);
  const alerts = tires.filter((tire) => {
    const { state, problemCount } = analyzeTire(tire, today);
    return state === "attention" || state === "exceeded" || state === "early-replacement" || problemCount >= 2;
  }).length;
  const brands = new Map<string, number[]>();
  for (const tire of replaced) {
    brands.set(tire.brand, [...(brands.get(tire.brand) ?? []), tire.usageKm]);
  }
  return {
    active: tires.length - replaced.length,
    replaced: replaced.length,
    alerts,
    averageReplacedKm: replaced.length === 0
      ? null
      : replaced.reduce((sum, tire) => sum + tire.usageKm, 0) / replaced.length,
    byBrand: [...brands.entries()]
      .map(([brand, values]) => ({
        brand,
        replaced: values.length,
        averageKm: values.reduce((a, b) => a + b, 0) / values.length,
      }))
      .sort((a, b) => b.averageKm - a.averageKm),
  };
}
