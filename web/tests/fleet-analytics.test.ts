import { describe, expect, test } from "bun:test";
import type { FuelRecord, MaintenanceRecord, Tire } from "../src/features/fleet-records/api";
import {
  analyzeMaintenance,
  analyzeTire,
  getFuelDeviation,
  summarizeFuelByVehicle,
  summarizeTires,
} from "../src/features/fleet-records/analytics";

function fuel(overrides: Partial<FuelRecord>): FuelRecord {
  return {
    id: 1,
    vehicleId: 1,
    vehiclePlate: "AAA1A11",
    driverName: "Ana",
    litersMilliliters: 100000,
    amountCents: 60000,
    occurredAt: "2026-01-01",
    odometerKm: 1000,
    station: null,
    route: "A-B",
    consumptionKmpl: null,
    historicalAverageKmpl: null,
    ...overrides,
  };
}

function maintenance(overrides: Partial<MaintenanceRecord>): MaintenanceRecord {
  return {
    id: 1,
    vehicleId: 1,
    vehiclePlate: "AAA1A11",
    problem: "Troca de freios",
    responsible: "Oficina",
    dueAt: null,
    partsUsed: null,
    status: "open",
    occurredAt: "2026-11-01",
    startedAt: "2026-11-01T12:00:00Z",
    completedAt: null,
    ...overrides,
  };
}

function tire(overrides: Partial<Tire>): Tire {
  return {
    id: 1,
    vehicleId: 1,
    vehiclePlate: "AAA1A11",
    position: "Dianteiro esquerdo",
    brand: "Pirelli",
    installedAt: "2026-01-01",
    installedOdometerKm: 0,
    removedAt: null,
    removedOdometerKm: null,
    usageKm: 10000,
    events: [],
    ...overrides,
  };
}

describe("RF 02 - consumption deviation", () => {
  test("flags consumption at least 15% below the historical average", () => {
    expect(getFuelDeviation(fuel({ consumptionKmpl: 4, historicalAverageKmpl: 5 }))?.level).toBe("worse");
    expect(getFuelDeviation(fuel({ consumptionKmpl: 4.5, historicalAverageKmpl: 5 }))?.level).toBe("normal");
    expect(getFuelDeviation(fuel({ consumptionKmpl: 6, historicalAverageKmpl: 5 }))?.level).toBe("better");
    expect(getFuelDeviation(fuel({ consumptionKmpl: null, historicalAverageKmpl: 5 }))).toBeNull();
  });

  test("averages consumption weighted by distance and counts deviations", () => {
    const [summary] = summarizeFuelByVehicle([
      fuel({ id: 1, odometerKm: 1000 }),
      fuel({ id: 2, odometerKm: 1500, litersMilliliters: 100000, consumptionKmpl: 5, historicalAverageKmpl: null }),
      fuel({ id: 3, odometerKm: 1900, litersMilliliters: 100000, consumptionKmpl: 4, historicalAverageKmpl: 5 }),
    ]);
    expect(summary?.averageKmpl).toBeCloseTo(4.5);
    expect(summary?.lastKmpl).toBe(4);
    expect(summary?.deviationCount).toBe(1);
    expect(summary?.totalLiters).toBe(300);
  });
});

describe("RF 09 - maintenance history recommendations", () => {
  test("flags overdue records, stale parts and recurring problems", () => {
    const analysis = analyzeMaintenance(
      [
        maintenance({ id: 1, dueAt: "2026-11-05" }),
        maintenance({ id: 2, vehicleId: 2, vehiclePlate: "BBB2B22", status: "waiting_part", occurredAt: "2026-10-20", problem: "Alternador" }),
        maintenance({ id: 3, vehicleId: 3, vehiclePlate: "CCC3C33", problem: "Vazamento de óleo", status: "completed", occurredAt: "2026-08-01", completedAt: "2026-08-03T12:00:00Z" }),
        maintenance({ id: 4, vehicleId: 3, vehiclePlate: "CCC3C33", problem: "Vazamento de óleo no motor", status: "completed", occurredAt: "2026-09-01", completedAt: "2026-09-02T12:00:00Z" }),
      ],
      "2026-11-12",
    );
    const titles = analysis.insights.map((insight) => insight.title);
    expect(titles).toContain("Prazo vencido");
    expect(titles).toContain("Aguardando peça há muitos dias");
    expect(titles).toContain("Problema recorrente");
    expect(analysis.insights[0]?.severity).toBe("critical");
    expect(analysis.overdueCount).toBe(1);
    expect(analysis.openCount).toBe(2);
    expect(analysis.averageResolutionDays).toBe(1.5);
  });

  test("recommends review for vehicles with frequent maintenance", () => {
    const analysis = analyzeMaintenance(
      ["2026-09-01", "2026-10-01", "2026-11-01"].map((occurredAt, index) =>
        maintenance({ id: index + 1, occurredAt, problem: `Serviço ${"abc"[index]}${index}`, status: "completed", completedAt: `${occurredAt}T12:00:00Z` })),
      "2026-11-12",
    );
    expect(analysis.insights.map((insight) => insight.title)).toContain("Alta frequência de manutenções");
  });
});

describe("RF 32 - tire lifespan", () => {
  test("classifies active tires by consumed life", () => {
    expect(analyzeTire(tire({ usageKm: 30000 }), "2026-11-12").state).toBe("ok");
    expect(analyzeTire(tire({ usageKm: 50000 }), "2026-11-12").state).toBe("attention");
    expect(analyzeTire(tire({ usageKm: 65000 }), "2026-11-12").state).toBe("exceeded");
  });

  test("flags early replacements and summarizes replaced tires by brand", () => {
    const early = tire({ id: 2, usageKm: 20000, removedAt: "2026-06-01", removedOdometerKm: 20000 });
    const normal = tire({ id: 3, brand: "Michelin", usageKm: 58000, removedAt: "2026-06-01", removedOdometerKm: 58000 });
    expect(analyzeTire(early, "2026-11-12").state).toBe("early-replacement");
    expect(analyzeTire(normal, "2026-11-12").state).toBe("replaced-on-time");
    const summary = summarizeTires([early, normal, tire({ id: 4, usageKm: 70000 })], "2026-11-12");
    expect(summary.replaced).toBe(2);
    expect(summary.active).toBe(1);
    expect(summary.alerts).toBe(2);
    expect(summary.byBrand[0]?.brand).toBe("Michelin");
  });
});
