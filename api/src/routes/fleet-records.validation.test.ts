import { describe, expect, test } from "bun:test";
import {
  parseFuelRecordInput,
  parseMaintenanceRecordInput,
  parseOdometerReadingInput,
  parsePreventiveMaintenancePlanInput,
  parseTireEventInput,
  parseTireInput,
  parseVehicleServiceInput,
} from "./fleet-records.validation";

const validFuelRecord = {
  vehicleId: 1,
  driverId: 2,
  litersMilliliters: 50_000,
  amountCents: 10_000,
  occurredAt: "2026-11-08",
  odometerKm: 120_000,
  station: "Posto Central",
  route: "Centro - Filial",
};

const validMaintenanceRecord = {
  vehicleId: 1,
  problem: "Revisão do veículo",
  responsible: "Equipe de manutenção",
  dueAt: "2026-11-10",
  partsUsed: null,
  status: "open",
  occurredAt: "2026-11-08",
  completedAt: null,
};

describe("parseFuelRecordInput", () => {
  test("accepts a valid record with calendar-date input", () => {
    expect(parseFuelRecordInput(validFuelRecord)).toEqual({ value: validFuelRecord });
    const { station: _station, ...withoutStation } = validFuelRecord;
    expect(parseFuelRecordInput(withoutStation)).toEqual({
      value: { ...withoutStation, station: null },
    });
  });

  test.each([
    ["timestamp instead of calendar date", { ...validFuelRecord, occurredAt: "2026-11-08T10:00:00.000Z" }],
    ["non-increasing odometer", { ...validFuelRecord, odometerKm: -1 }],
    ["zero liters", { ...validFuelRecord, litersMilliliters: 0 }],
    ["invalid calendar date", { ...validFuelRecord, occurredAt: "2026-02-30" }],
  ])("rejects %s", (_name, payload) => {
    expect(parseFuelRecordInput(payload)).toHaveProperty("error");
  });
});

describe("parseMaintenanceRecordInput", () => {
  test("requires a completion date only for completed records", () => {
    expect(parseMaintenanceRecordInput(validMaintenanceRecord)).toHaveProperty("value");
    expect(
      parseMaintenanceRecordInput({
        ...validMaintenanceRecord,
        status: "completed",
        completedAt: "2026-11-09",
      }),
    ).toHaveProperty("value");
    expect(
      parseMaintenanceRecordInput({
        ...validMaintenanceRecord,
        status: "completed",
        completedAt: null,
      }),
    ).toHaveProperty("error");
    expect(
      parseMaintenanceRecordInput({
        ...validMaintenanceRecord,
        status: "completed",
        completedAt: "2026-11-07",
      }),
    ).toHaveProperty("error");
  });
});

describe("parseTireInput and parseTireEventInput", () => {
  test("accepts installation and operational event data", () => {
    expect(
      parseTireInput({
        vehicleId: 1,
        position: "Dianteiro esquerdo",
        brand: "Marca",
        installedAt: "2026-11-08",
        installedOdometerKm: 120_000,
      }),
    ).toHaveProperty("value");
    expect(
      parseTireEventInput({
        type: "inspection",
        description: "Inspeção visual",
        occurredAt: "2026-11-08",
        odometerKm: 120_000,
      }),
    ).toHaveProperty("value");
  });

  test("does not accept replacement as a standalone event", () => {
    expect(
      parseTireEventInput({
        type: "replacement",
        description: "Substituído",
        occurredAt: "2026-11-08",
        odometerKm: 120_000,
      }),
    ).toHaveProperty("error");
  });
});

describe("preventive maintenance inputs", () => {
  test("accepts mileage readings, configured intervals and washing records", () => {
    expect(parseOdometerReadingInput({
      vehicleId: 1,
      driverId: 2,
      occurredAt: "2026-11-08",
      odometerKm: 120_000,
    })).toHaveProperty("value");
    expect(parsePreventiveMaintenancePlanInput({
      vehicleId: 1,
      serviceType: "oil_change",
      intervalKm: 10_000,
      lastServiceOdometerKm: 110_000,
    })).toHaveProperty("value");
    expect(parseVehicleServiceInput({
      vehicleId: 1,
      driverId: 2,
      serviceType: "washing",
      occurredAt: "2026-11-08",
      odometerKm: 120_000,
    })).toMatchObject({
      value: {
        serviceType: "washing",
        description: null,
      },
    });
  });

  test("rejects incomplete or invalid preventive maintenance data", () => {
    expect(parseOdometerReadingInput({
      vehicleId: 1,
      driverId: 2,
      occurredAt: "2026-11-08",
      odometerKm: -1,
    })).toHaveProperty("error");
    expect(parsePreventiveMaintenancePlanInput({
      vehicleId: 1,
      serviceType: "washing",
      intervalKm: 0,
      lastServiceOdometerKm: 0,
    })).toHaveProperty("error");
    expect(parseVehicleServiceInput({
      vehicleId: 1,
      driverId: null,
      serviceType: "unknown",
      occurredAt: "2026-11-08",
      odometerKm: 120_000,
    })).toHaveProperty("error");
  });
});
