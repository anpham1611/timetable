import { describe, expect, it } from "vitest";
import { visitCountResponseSchema } from "@timetable/shared";
import { createTestDb } from "../db/testdb.js";
import { recordVisit } from "./visit-counter.js";

describe("recordVisit service", () => {
  it("returns an incremented, schema-valid payload", async () => {
    const db = await createTestDb();
    const first = await recordVisit(db);
    expect(() => visitCountResponseSchema.parse(first)).not.toThrow();
    expect(first.count).toBe(1);

    const second = await recordVisit(db);
    expect(second.count).toBe(2);
  });
});
