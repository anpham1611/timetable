import { describe, expect, it } from "vitest";
import { visitCountResponseSchema } from "@timetable/shared";
import { createTestDb } from "../db/testdb.js";
import { recordVisit } from "./visit-counter.js";

describe("recordVisit service", () => {
  it("returns an incremented, schema-valid payload", () => {
    const db = createTestDb();
    const first = recordVisit(db);
    expect(() => visitCountResponseSchema.parse(first)).not.toThrow();
    expect(first.count).toBe(1);

    const second = recordVisit(db);
    expect(second.count).toBe(2);
  });
});
