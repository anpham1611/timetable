import { describe, expect, it } from "vitest";
import { healthResponseSchema } from "@timetable/shared";
import { buildServer } from "./index.js";

describe("GET /health", () => {
  it("returns a valid HealthResponse", async () => {
    const app = buildServer();
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    expect(healthResponseSchema.parse(res.json())).toEqual({ status: "ok" });
    await app.close();
  });
});
