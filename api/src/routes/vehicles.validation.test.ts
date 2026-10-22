import { describe, expect, test } from "bun:test";
import { parseVehicleInput, parseVehicleListQuery } from "./vehicles.validation";

describe("parseVehicleInput", () => {
  test("normalizes valid vehicle data and uses the default status", () => {
    expect(
      parseVehicleInput({
        plate: "abc1d23",
        make: "  Fiat ",
        model: " Ducato ",
        year: new Date().getFullYear(),
      }),
    ).toEqual({
      value: {
        plate: "ABC1D23",
        make: "Fiat",
        model: "Ducato",
        year: new Date().getFullYear(),
        status: "operational",
      },
    });
  });

  test.each([
    ["non-object payload", null],
    ["invalid license plate", { plate: "invalid" }],
    [
      "empty make",
      { plate: "ABC1D23", make: " ", model: "Ducato", year: 2024 },
    ],
    [
      "too-long model",
      { plate: "ABC1D23", make: "Fiat", model: "m".repeat(101), year: 2024 },
    ],
    [
      "non-integer year",
      { plate: "ABC1D23", make: "Fiat", model: "Ducato", year: 2024.5 },
    ],
    [
      "invalid status",
      {
        plate: "ABC1D23",
        make: "Fiat",
        model: "Ducato",
        year: 2024,
        status: "unknown",
      },
    ],
  ])("rejects %s", (_name, payload) => {
    expect(parseVehicleInput(payload)).toHaveProperty("error");
  });
});

describe("parseVehicleListQuery", () => {
  test("applies pagination defaults and trims the search query", () => {
    expect(parseVehicleListQuery(new URLSearchParams("q=%20fiat%20"))).toEqual({
      value: {
        page: 1,
        pageSize: 25,
        offset: 0,
        query: "fiat",
        status: undefined,
      },
    });
  });

  test("parses valid pagination and status filters", () => {
    expect(
      parseVehicleListQuery(
        new URLSearchParams("page=3&pageSize=50&status=maintenance"),
      ),
    ).toEqual({
      value: {
        page: 3,
        pageSize: 50,
        offset: 100,
        query: "",
        status: "maintenance",
      },
    });
  });

  test.each([
    ["zero page", "page=0"],
    ["non-numeric page", "page=abc"],
    ["zero page size", "pageSize=0"],
    ["page size above the limit", "pageSize=101"],
    ["unknown status", "status=unknown"],
    ["unsafe offset", "page=9007199254740991&pageSize=100"],
  ])("rejects %s", (_name, query) => {
    expect(parseVehicleListQuery(new URLSearchParams(query))).toHaveProperty("error");
  });
});
