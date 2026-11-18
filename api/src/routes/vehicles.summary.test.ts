import { describe, expect, test } from "bun:test";
import { makeDriverSummary, makeFleetSummary } from "./vehicles.summary";

describe("makeFleetSummary", () => {
  test("aggregates the status counts and operational percentage", () => {
    expect(
      makeFleetSummary(
        [
          { status: "operational", total: 7 },
          { status: "in_operation", total: 0 },
          { status: "stopped", total: 0 },
          { status: "maintenance", total: 2 },
          { status: "waiting_part", total: 0 },
          { status: "waiting_service", total: 0 },
          { status: "maintenance_completed", total: 0 },
          { status: "inactive", total: 1 },
        ],
        new Date("2026-10-22T14:00:00.000Z"),
        3.25,
      ),
    ).toEqual({
      totalVehicles: 10,
      statusCounts: {
        operational: 7,
        in_operation: 0,
        stopped: 0,
        maintenance: 2,
        waiting_part: 0,
        waiting_service: 0,
        maintenance_completed: 0,
        inactive: 1,
      },
      operationalRate: 70,
      averageDowntimeHours: 3.3,
      refreshedAt: "2026-10-22T14:00:00.000Z",
    });
  });

  test("returns zero counts and a zero rate for an empty fleet", () => {
    expect(makeFleetSummary([], new Date("2026-10-22T14:00:00.000Z"))).toEqual({
      totalVehicles: 0,
      statusCounts: {
        operational: 0,
        in_operation: 0,
        stopped: 0,
        maintenance: 0,
        waiting_part: 0,
        waiting_service: 0,
        maintenance_completed: 0,
        inactive: 0,
      },
      operationalRate: 0,
      averageDowntimeHours: 0,
      refreshedAt: "2026-10-22T14:00:00.000Z",
    });
  });

});

describe("makeDriverSummary", () => {
  test("aggregates driver status counts and total", () => {
    expect(
      makeDriverSummary([
        { status: "active", total: 8 },
        { status: "inactive", total: 2 },
      ]),
    ).toEqual({
      totalDrivers: 10,
      driverStatusCounts: { active: 8, inactive: 2 },
    });
  });

  test("returns zero counts when there are no drivers", () => {
    expect(makeDriverSummary([])).toEqual({
      totalDrivers: 0,
      driverStatusCounts: { active: 0, inactive: 0 },
    });
  });
});
