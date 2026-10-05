import { describe, expect, it } from "vitest";
import { createTestDb } from "../db/testdb.js";
import { getVisitCount, incrementVisitCount } from "./visit-counter.js";

describe("visit-counter repository", () => {
  it("starts at zero", async () => {
    const db = await createTestDb();
    expect(await getVisitCount(db)).toBe(0);
  });

  it("raises the count by exactly 2 over two increments", async () => {
    const db = await createTestDb();
    const first = await incrementVisitCount(db);
    const second = await incrementVisitCount(db);
    expect(first).toBe(1);
    expect(second).toBe(2);
    expect(await getVisitCount(db)).toBe(2);
  });
});
