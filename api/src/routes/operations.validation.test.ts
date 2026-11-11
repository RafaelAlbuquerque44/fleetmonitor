import { describe, expect, test } from "bun:test";
import {
  parseCostListQuery,
  parseFleetCostInput,
  parseMaintenanceInput,
  parseMaintenanceListQuery,
} from "./operations.validation";

describe("parseMaintenanceInput", () => {
  test("normalizes a valid scheduled maintenance order", () => {
    expect(
      parseMaintenanceInput({
        vehicleId: 3,
        description: "  Troca de óleo  ",
        scheduledAt: "2026-11-20",
      }),
    ).toEqual({
      value: {
        vehicleId: 3,
        description: "Troca de óleo",
        status: "scheduled",
        scheduledAt: "2026-11-20",
        completedAt: null,
        costCents: null,
      },
    });
  });

  test("requires a completion date for a completed order", () => {
    expect(
      parseMaintenanceInput({
        vehicleId: 1,
        description: "Revisão",
        status: "completed",
      }),
    ).toHaveProperty("error");
  });

  test("rejects malformed dates, invalid vehicle IDs, and negative costs", () => {
    for (const payload of [
      { vehicleId: 0, description: "Revisão" },
      { vehicleId: 1, description: "Revisão", scheduledAt: "2026-02-30" },
      { vehicleId: 1, description: "Revisão", costCents: -1 },
    ]) {
      expect(parseMaintenanceInput(payload)).toHaveProperty("error");
    }
  });
});

describe("parseFleetCostInput", () => {
  test("accepts integer cents and trims the description", () => {
    expect(
      parseFleetCostInput({
        vehicleId: 9,
        category: "fuel",
        description: "  Abastecimento  ",
        amountCents: 12550,
        occurredAt: "2026-11-08",
      }),
    ).toEqual({
      value: {
        vehicleId: 9,
        category: "fuel",
        description: "Abastecimento",
        amountCents: 12550,
        occurredAt: "2026-11-08",
      },
    });
  });

  test("rejects floating-point amounts and unknown categories", () => {
    expect(
      parseFleetCostInput({
        vehicleId: 1,
        category: "unknown",
        description: "Custo",
        amountCents: 12.5,
        occurredAt: "2026-11-08",
      }),
    ).toHaveProperty("error");
  });
});

describe("operation list queries", () => {
  test("applies safe pagination defaults", () => {
    expect(parseCostListQuery(new URLSearchParams())).toEqual({
      value: { page: 1, pageSize: 25, offset: 0, category: undefined },
    });
    expect(
      parseMaintenanceListQuery(new URLSearchParams("page=2&pageSize=10&status=completed")),
    ).toEqual({
      value: { page: 2, pageSize: 10, offset: 10, status: "completed" },
    });
  });

  test("rejects excessive pages and unknown maintenance statuses", () => {
    expect(parseCostListQuery(new URLSearchParams("pageSize=101"))).toHaveProperty("error");
    expect(
      parseMaintenanceListQuery(new URLSearchParams("status=unknown")),
    ).toHaveProperty("error");
  });

  test("validates optional cost category filters", () => {
    expect(parseCostListQuery(new URLSearchParams("category=fuel"))).toEqual({
      value: { page: 1, pageSize: 25, offset: 0, category: "fuel" },
    });
    expect(parseCostListQuery(new URLSearchParams("category=unknown"))).toHaveProperty("error");
  });
});
