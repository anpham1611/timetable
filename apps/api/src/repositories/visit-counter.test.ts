import { describe, expect, it } from "vitest";
import { createTestDb } from "../db/testdb.js";
import { getVisitCount, incrementVisitCount } from "./visit-counter.js";

describe("visit-counter repository", () => {
  it("starts at zero", () => {
    const db = createTestDb();
    expect(getVisitCount(db)).toBe(0);
  });

  it("raises the count by exactly 2 over two increments", () => {
    const db = createTestDb();
    const first = incrementVisitCount(db);
    const second = incrementVisitCount(db);
    expect(first).toBe(1);
    expect(second).toBe(2);
    expect(getVisitCount(db)).toBe(2);
  });
});
