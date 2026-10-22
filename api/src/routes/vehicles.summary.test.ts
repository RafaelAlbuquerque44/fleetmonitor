import { describe, expect, test } from "bun:test";
import { makeFleetSummary } from "./vehicles.summary";

describe("makeFleetSummary", () => {
  test("aggregates the status counts and operational percentage", () => {
    expect(
      makeFleetSummary(
        [
          { status: "operational", total: 7 },
          { status: "maintenance", total: 2 },
          { status: "inactive", total: 1 },
        ],
        new Date("2026-10-22T14:00:00.000Z"),
      ),
    ).toEqual({
      totalVehicles: 10,
      statusCounts: { operational: 7, maintenance: 2, inactive: 1 },
      operationalRate: 70,
      refreshedAt: "2026-10-22T14:00:00.000Z",
    });
  });

  test("returns zero counts and a zero rate for an empty fleet", () => {
    expect(makeFleetSummary([], new Date("2026-10-22T14:00:00.000Z"))).toEqual({
      totalVehicles: 0,
      statusCounts: { operational: 0, maintenance: 0, inactive: 0 },
      operationalRate: 0,
      refreshedAt: "2026-10-22T14:00:00.000Z",
    });
  });
});
