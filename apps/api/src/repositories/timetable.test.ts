import { describe, expect, it } from "vitest";
import { timetable } from "../db/schema.js";
import { createTestDb } from "../db/testdb.js";
import {
  listActiveTimetables,
  listAllTimetables,
  setTimetableActive,
} from "./timetable.js";

describe("timetable repository", () => {
  it("returns only active rows in ascending effective-date order", async () => {
    const db = await createTestDb();
    await db
      .insert(timetable)
      .values([
        { ordinal: 2, effectiveFrom: new Date("2026-09-15T00:00:00Z"), isActive: 1 },
        { ordinal: 1, effectiveFrom: new Date("2026-09-01T00:00:00Z"), isActive: 1 },
        { ordinal: 9, effectiveFrom: new Date("2026-08-01T00:00:00Z"), isActive: 0 },
      ])
      .run();

    const rows = await listActiveTimetables(db);
    expect(rows.map((r) => r.ordinal)).toEqual([1, 2]);
    expect(rows.every((r) => r.isActive === 1)).toBe(true);
  });

  it("returns an empty list when there are no active rows", async () => {
    const db = await createTestDb();
    expect(await listActiveTimetables(db)).toEqual([]);
  });
});

describe("listAllTimetables", () => {
  it("returns active and inactive rows ordered by id", async () => {
    const db = await createTestDb();
    await db
      .insert(timetable)
      .values([
        { ordinal: 1, effectiveFrom: new Date("2026-09-01T00:00:00Z"), isActive: 1 },
        { ordinal: 2, effectiveFrom: new Date("2026-09-15T00:00:00Z"), isActive: 0 },
      ])
      .run();

    const rows = await listAllTimetables(db);
    expect(rows.map((r) => r.id)).toEqual([1, 2]);
    expect(rows.map((r) => r.isActive)).toEqual([1, 0]);
    expect(rows[0]!.createdAt).toBeInstanceOf(Date);
  });

  it("returns an empty list when there are no timetables", async () => {
    const db = await createTestDb();
    expect(await listAllTimetables(db)).toEqual([]);
  });
});

describe("setTimetableActive", () => {
  it("activates and deactivates an existing timetable", async () => {
    const db = await createTestDb();
    await db
      .insert(timetable)
      .values({ ordinal: 1, effectiveFrom: new Date("2026-09-01T00:00:00Z"), isActive: 0 })
      .run();

    expect(await setTimetableActive(1, true, db)).toBe(true);
    expect((await listAllTimetables(db))[0]!.isActive).toBe(1);

    expect(await setTimetableActive(1, false, db)).toBe(true);
    expect((await listAllTimetables(db))[0]!.isActive).toBe(0);
  });

  it("returns false for an unknown id and changes nothing", async () => {
    const db = await createTestDb();
    await db
      .insert(timetable)
      .values({ ordinal: 1, effectiveFrom: new Date("2026-09-01T00:00:00Z"), isActive: 1 })
      .run();

    expect(await setTimetableActive(999, false, db)).toBe(false);
    expect((await listAllTimetables(db))[0]!.isActive).toBe(1);
  });
});
