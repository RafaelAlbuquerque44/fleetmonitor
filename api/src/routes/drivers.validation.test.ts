import { describe, expect, test } from "bun:test";
import { parseDriverInput, parseDriverListQuery } from "./drivers.validation";

const validDriver = {
  fullName: "  Ana Souza ",
  cpf: "529.982.247-25",
  licenseNumber: "12345678901",
  licenseCategory: "AB",
  licenseExpiresAt: "2030-12-31",
};

describe("parseDriverInput", () => {
  test("normalizes valid driver data and applies defaults", () => {
    expect(parseDriverInput(validDriver)).toEqual({
      value: {
        fullName: "Ana Souza",
        cpf: "52998224725",
        licenseNumber: "12345678901",
        licenseCategory: "AB",
        licenseExpiresAt: "2030-12-31",
        phone: null,
        status: "active",
      },
    });
  });

  test.each([
    ["non-object payload", null],
    ["invalid CPF", { ...validDriver, cpf: "111.111.111-11" }],
    ["invalid license number", { ...validDriver, licenseNumber: "123" }],
    ["unknown license category", { ...validDriver, licenseCategory: "X" }],
    ["invalid license expiry", { ...validDriver, licenseExpiresAt: "2030-02-30" }],
    ["unknown status", { ...validDriver, status: "pending" }],
  ])("rejects %s", (_name, payload) => {
    expect(parseDriverInput(payload)).toHaveProperty("error");
  });
});

describe("parseDriverListQuery", () => {
  test("applies pagination defaults and trims the search query", () => {
    expect(parseDriverListQuery(new URLSearchParams("q=%20ana%20"))).toEqual({
      value: {
        page: 1,
        pageSize: 25,
        offset: 0,
        query: "ana",
        status: undefined,
      },
    });
  });

  test("parses a valid status filter and page", () => {
    expect(parseDriverListQuery(new URLSearchParams("page=2&status=inactive"))).toEqual({
      value: {
        page: 2,
        pageSize: 25,
        offset: 25,
        query: "",
        status: "inactive",
      },
    });
  });

  test.each([
    ["zero page", "page=0"],
    ["oversized page", "pageSize=101"],
    ["unknown status", "status=pending"],
  ])("rejects %s", (_name, query) => {
    expect(parseDriverListQuery(new URLSearchParams(query))).toHaveProperty("error");
  });
});
