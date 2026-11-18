import { describe, expect, test } from "bun:test";
import { paginateRecords } from "../src/features/fleet-records/RecordPagination";

describe("fleet record pagination", () => {
  test("keeps all records accessible across pages", () => {
    const records = Array.from({ length: 12 }, (_, index) => index + 1);
    expect(paginateRecords(records, 1).items).toEqual([1, 2, 3, 4, 5]);
    expect(paginateRecords(records, 2).items).toEqual([6, 7, 8, 9, 10]);
    expect(paginateRecords(records, 3)).toEqual({ items: [11, 12], page: 3, totalPages: 3 });
  });

  test("clamps the page when a filtered or refreshed list shrinks", () => {
    expect(paginateRecords([1, 2], 3)).toEqual({ items: [1, 2], page: 1, totalPages: 1 });
    expect(paginateRecords([], 1)).toEqual({ items: [], page: 1, totalPages: 1 });
  });
});
