import { describe, expect, test } from "bun:test";
import { canWriteToFleet } from "./middleware/auth";

process.env.DATABASE_URL =
  "postgres://fleetmonitor:fleetmonitor@localhost:5432/fleetmonitor_test";
process.env.CORS_ORIGINS = "http://localhost:5173,https://fleetmonitor.test";

const { default: app } = await import("./app");

describe("API", () => {
  test("read-only demo users cannot change fleet data", () => {
    expect(canWriteToFleet({ readOnly: true })).toBe(false);
    expect(canWriteToFleet({ readOnly: false })).toBe(true);
  });

  test("health endpoint reports the service status", async () => {
    const response = await app.fetch(new Request("http://localhost/health"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, service: "api" });
  });

  test("allows credentialed PUT preflight from configured origins", async () => {
    const response = await app.fetch(
      new Request("http://localhost/vehicles/1", {
        method: "OPTIONS",
        headers: {
          Origin: "https://fleetmonitor.test",
          "Access-Control-Request-Method": "PUT",
          "Access-Control-Request-Headers": "content-type",
        },
      }),
    );

    expect(response.status).toBe(204);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe(
      "https://fleetmonitor.test",
    );
    expect(response.headers.get("Access-Control-Allow-Credentials")).toBe("true");
    expect(response.headers.get("Access-Control-Allow-Methods")).toContain("PUT");
  });

  test("does not grant CORS access to unconfigured origins", async () => {
    const response = await app.fetch(
      new Request("http://localhost/vehicles", {
        method: "OPTIONS",
        headers: {
          Origin: "https://untrusted.test",
          "Access-Control-Request-Method": "GET",
        },
      }),
    );

    expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });

  test("requires authentication before accessing vehicle routes", async () => {
    const requests = [
      new Request("http://localhost/vehicles"),
      new Request("http://localhost/vehicles/summary"),
      new Request("http://localhost/vehicles/1"),
      new Request("http://localhost/vehicles", { method: "POST" }),
      new Request("http://localhost/vehicles/1", { method: "PUT" }),
      new Request("http://localhost/vehicles/1", { method: "DELETE" }),
    ];

    for (const request of requests) {
      const response = await app.fetch(request);

      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ error: "Autenticação necessária." });
    }
  });

  test("rejects malformed and invalid login payloads without database access", async () => {
    const malformed = await app.fetch(
      new Request("http://localhost/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{",
      }),
    );
    expect(malformed.status).toBe(400);

    const invalid = await app.fetch(
      new Request("http://localhost/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "invalid", password: "" }),
      }),
    );
    expect(invalid.status).toBe(400);
  });

  test("accepts contact requests without requiring a session and validates their payload", async () => {
    const response = await app.fetch(
      new Request("http://localhost/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "", email: "invalid", message: "" }),
      }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toHaveProperty("error");
  });
});
