import { describe, expect, test } from "bun:test";
import { parseContactRequest } from "./contact.validation";

describe("parseContactRequest", () => {
  test("trims fields, normalizes email, and makes company optional", () => {
    expect(
      parseContactRequest({
        name: "  Joana Silva ",
        email: " JOANA@EXAMPLE.COM ",
        companyName: " ",
        message: "  Gostaria de conhecer a plataforma. ",
      }),
    ).toEqual({
      value: {
        name: "Joana Silva",
        email: "joana@example.com",
        companyName: null,
        message: "Gostaria de conhecer a plataforma.",
      },
    });
  });

  test.each([
    ["non-object payload", null],
    [
      "missing name",
      { email: "joana@example.com", message: "Olá" },
    ],
    [
      "invalid email",
      { name: "Joana", email: "invalid", message: "Olá" },
    ],
    [
      "empty message",
      { name: "Joana", email: "joana@example.com", message: " " },
    ],
    [
      "too-long message",
      { name: "Joana", email: "joana@example.com", message: "x".repeat(5001) },
    ],
  ])("rejects %s", (_name, payload) => {
    expect(parseContactRequest(payload)).toHaveProperty("error");
  });
});
