import { describe, expect, it } from "vitest";
import { grade, schoolClass, teacher, timetable } from "../db/schema.js";
import { createTestDb } from "../db/testdb.js";
import {
  createTimetable,
  ensurePeriod,
  insertClass,
  insertGrade,
  insertRoom,
  insertStudent,
  insertSubject,
  insertTeacher,
} from "./import.js";

describe("import repository — insert-only", () => {
  it("createTimetable makes an inactive TKB with the next ordinal", () => {
    const db = createTestDb();
    db.insert(timetable)
      .values({ ordinal: 3, effectiveFrom: new Date("2026-01-01T00:00:00Z"), isActive: 1 })
      .run();
    const id = createTimetable(new Date("2026-09-07T00:00:00Z"), db);
    const row = db.select().from(timetable).all().find((t) => t.id === id)!;
    expect(row.ordinal).toBe(4);
    expect(row.isActive).toBe(0);
  });

  it("starts ordinals at 1 when no TKBs exist", () => {
    const db = createTestDb();
    const id = createTimetable(new Date("2026-09-07T00:00:00Z"), db);
    expect(db.select().from(timetable).all().find((t) => t.id === id)!.ordinal).toBe(1);
  });

  it("tags every inserted directory row with the given timetable id", () => {
    const db = createTestDb();
    const tkb = createTimetable(new Date("2026-09-07T00:00:00Z"), db);

    const gradeId = insertGrade(tkb, "11", db);
    const roomId = insertRoom(tkb, "P.201", db);
    const classId = insertClass(tkb, "11A5", gradeId, roomId, db);
    insertStudent(tkb, "Trần Thị B", classId, db);
    insertTeacher(tkb, "Nguyễn Văn A", "NVA", db);
    insertSubject(tkb, "Toán", "TOAN", db);

    expect(db.select().from(grade).all().every((r) => r.timetableId === tkb)).toBe(true);
    expect(db.select().from(schoolClass).all().every((r) => r.timetableId === tkb)).toBe(true);
    expect(db.select().from(teacher).all().every((r) => r.timetableId === tkb)).toBe(true);
  });

  it("does not reuse rows across two imports (independent snapshots)", () => {
    const db = createTestDb();
    const tkb1 = createTimetable(new Date("2026-09-07T00:00:00Z"), db);
    const tkb2 = createTimetable(new Date("2026-09-14T00:00:00Z"), db);
    insertGrade(tkb1, "11", db);
    insertGrade(tkb2, "11", db);
    const grades = db.select().from(grade).all();
    expect(grades).toHaveLength(2);
    expect(new Set(grades.map((g) => g.timetableId))).toEqual(new Set([tkb1, tkb2]));
  });

  it("ensurePeriod reuses the canonical (session, ordinal) row", () => {
    const db = createTestDb();
    const a = ensurePeriod("SANG", 1, db);
    const b = ensurePeriod("SANG", 1, db);
    const c = ensurePeriod("CHIEU", 1, db);
    expect(a).toBe(b);
    expect(c).not.toBe(a);
  });
});
