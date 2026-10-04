import { describe, expect, it } from "vitest";
import { visitCountResponseSchema } from "./visit-counter.js";

describe("visitCountResponseSchema", () => {
  it("accepts a zero count", () => {
    expect(visitCountResponseSchema.parse({ count: 0 })).toEqual({ count: 0 });
  });

  it("accepts a positive integer count", () => {
    expect(visitCountResponseSchema.parse({ count: 9000 })).toEqual({ count: 9000 });
  });

  it("rejects a negative count", () => {
    expect(() => visitCountResponseSchema.parse({ count: -1 })).toThrow();
  });

  it("rejects a non-integer count", () => {
    expect(() => visitCountResponseSchema.parse({ count: 1.5 })).toThrow();
  });
});
