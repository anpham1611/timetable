import { describe, expect, it } from "vitest";
import {
  activeTimetablesResponseSchema,
  adminTimetableListResponseSchema,
} from "@timetable/shared";
import { timetable } from "../db/schema.js";
import { createTestDb } from "../db/testdb.js";
import {
  getActiveTimetables,
  listAdminTimetables,
  toggleTimetableActive,
} from "./timetable.js";

function seedTwo(db: ReturnType<typeof createTestDb>) {
  db.insert(timetable)
    .values([
      { ordinal: 1, effectiveFrom: new Date("2026-09-01T00:00:00Z"), isActive: 1 },
      { ordinal: 2, effectiveFrom: new Date("2026-09-15T00:00:00Z"), isActive: 1 },
    ])
    .run();
}

describe("getActiveTimetables service", () => {
  it("returns a schema-valid payload with ISO dates", () => {
    const db = createTestDb();
    seedTwo(db);
    const res = getActiveTimetables(db);
    expect(() => activeTimetablesResponseSchema.parse(res)).not.toThrow();
    expect(res.items.map((i) => i.effectiveFrom)).toEqual([
      "2026-09-01",
      "2026-09-15",
    ]);
  });

  it("defaults to the latest TKB by effective date", () => {
    const db = createTestDb();
    seedTwo(db);
    // items are ascending by effectiveFrom → items[1] (09-15) is the newest.
    const res = getActiveTimetables(db);
    expect(res.defaultSelectedId).toBe(res.items[1]!.id);
  });

  it("defaults to the latest TKB even when it is far in the future", () => {
    const db = createTestDb();
    db.insert(timetable)
      .values([
        { ordinal: 1, effectiveFrom: new Date("2099-01-01T00:00:00Z"), isActive: 1 },
        { ordinal: 2, effectiveFrom: new Date("2099-06-01T00:00:00Z"), isActive: 1 },
      ])
      .run();
    const res = getActiveTimetables(db);
    // The newest (2099-06-01) is the default even though it is not yet in effect.
    expect(res.items.map((i) => i.effectiveFrom)).toEqual([
      "2099-01-01",
      "2099-06-01",
    ]);
    expect(res.defaultSelectedId).toBe(res.items[1]!.id);
  });

  it("returns a null default for an empty list", () => {
    const db = createTestDb();
    const res = getActiveTimetables(db);
    expect(res.items).toEqual([]);
    expect(res.defaultSelectedId).toBeNull();
  });
});

describe("listAdminTimetables service", () => {
  it("returns active and inactive TKBs in a schema-valid payload", () => {
    const db = createTestDb();
    db.insert(timetable)
      .values([
        { ordinal: 1, effectiveFrom: new Date("2026-09-01T00:00:00Z"), isActive: 1 },
        { ordinal: 2, effectiveFrom: new Date("2026-09-15T00:00:00Z"), isActive: 0 },
      ])
      .run();

    const res = listAdminTimetables(db);
    expect(() => adminTimetableListResponseSchema.parse(res)).not.toThrow();
    expect(res.items.map((i) => i.isActive)).toEqual([true, false]);
  });

  it("returns an empty list when there are no TKBs", () => {
    const db = createTestDb();
    expect(listAdminTimetables(db).items).toEqual([]);
  });
});

describe("toggleTimetableActive service", () => {
  it("toggles an existing TKB", () => {
    const db = createTestDb();
    db.insert(timetable)
      .values({ ordinal: 1, effectiveFrom: new Date("2026-09-01T00:00:00Z"), isActive: 0 })
      .run();

    expect(toggleTimetableActive(1, true, db)).toBe(true);
    expect(listAdminTimetables(db).items[0]!.isActive).toBe(true);
  });

  it("returns false for an unknown TKB id", () => {
    const db = createTestDb();
    expect(toggleTimetableActive(123, true, db)).toBe(false);
  });
});
