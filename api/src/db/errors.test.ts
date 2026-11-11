import { describe, expect, test } from "bun:test";
import { getDatabaseErrorCode } from "./errors";

describe("getDatabaseErrorCode", () => {
  test("finds direct and wrapped PostgreSQL error codes", () => {
    expect(getDatabaseErrorCode({ code: "23505" })).toBe("23505");
    expect(
      getDatabaseErrorCode(new Error("Database operation failed", {
        cause: { code: "23503" },
      })),
    ).toBe("23503");
  });

  test("returns undefined when no database code exists", () => {
    expect(getDatabaseErrorCode(new Error("Unexpected failure"))).toBeUndefined();
    expect(getDatabaseErrorCode(null)).toBeUndefined();
  });
});
