import { describe, expect, test } from "bun:test";
import { demoDrivers } from "./demo-drivers";
import { parseDriverInput } from "../routes/drivers.validation";

describe("demo drivers", () => {
  test("contains ten unique records accepted by driver validation", () => {
    expect(demoDrivers).toHaveLength(10);
    expect(new Set(demoDrivers.map((driver) => driver.cpf)).size).toBe(10);
    for (const driver of demoDrivers) {
      expect(parseDriverInput(driver)).toEqual({ value: driver });
    }
  });
});
