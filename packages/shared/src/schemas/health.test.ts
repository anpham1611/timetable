import { describe, expect, it } from "vitest";
import { healthResponseSchema } from "./health.js";

describe("healthResponseSchema", () => {
  it("accepts a valid health response", () => {
    expect(healthResponseSchema.parse({ status: "ok" })).toEqual({ status: "ok" });
  });

  it("rejects an invalid status", () => {
    expect(() => healthResponseSchema.parse({ status: "down" })).toThrow();
  });
});
