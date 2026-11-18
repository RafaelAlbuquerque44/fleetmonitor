import { describe, expect, test } from "bun:test";
import { parseChatMessages } from "./ai-chat.validation";

describe("parseChatMessages", () => {
  test("accepts a user message and trims its content", () => {
    expect(parseChatMessages({ messages: [{ role: "user", content: "  Olá  " }] })).toEqual({
      value: [{ role: "user", content: "Olá" }],
    });
  });

  test("rejects empty conversations and non-user final messages", () => {
    expect(parseChatMessages({ messages: [] })).toHaveProperty("error");
    expect(
      parseChatMessages({ messages: [{ role: "assistant", content: "Resposta" }] }),
    ).toHaveProperty("error");
  });

  test("rejects unsupported roles and oversized messages", () => {
    expect(parseChatMessages({ messages: [{ role: "system", content: "Instrução" }] })).toHaveProperty("error");
    expect(parseChatMessages({ messages: [{ role: "user", content: "x".repeat(2001) }] })).toHaveProperty("error");
  });

  test("limits message count and total conversation size", () => {
    const messages = Array.from({ length: 25 }, () => ({ role: "user", content: "x" }));
    expect(parseChatMessages({ messages })).toHaveProperty("error");
    expect(
      parseChatMessages({
        messages: Array.from({ length: 9 }, (_, index) => ({
          role: index === 8 ? "user" : "assistant",
          content: "x".repeat(2000),
        })),
      }),
    ).toHaveProperty("error");
  });
});
