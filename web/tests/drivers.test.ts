import { describe, expect, test } from "bun:test";
import { isDriverListResponse } from "../src/features/drivers/types";

const response = {
  items: [],
  page: 1,
  pageSize: 25,
  totalItems: 0,
  totalPages: 1,
  statusCounts: { active: 0, inactive: 0 },
};

describe("driver list response", () => {
  test("accepts supported page sizes, including the fleet records page size", () => {
    for (const pageSize of [1, 25, 100]) {
      expect(isDriverListResponse({ ...response, pageSize })).toBe(true);
    }
  });

  test("rejects invalid pagination values", () => {
    for (const pageSize of [0, 101, 2.5]) {
      expect(isDriverListResponse({ ...response, pageSize })).toBe(false);
    }
    expect(isDriverListResponse({ ...response, page: 0 })).toBe(false);
    expect(isDriverListResponse({ ...response, totalItems: -1 })).toBe(false);
    expect(isDriverListResponse({ ...response, totalPages: 0 })).toBe(false);
  });
});
