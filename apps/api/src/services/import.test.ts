import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { lesson, student, timetable } from "../db/schema.js";
import { createTestDb, type Db } from "../db/testdb.js";
import {
  CLASS_COLUMNS,
  CLASS_SHEET,
  GRADE_COLUMNS,
  GRADE_SHEET,
  LESSON_COLUMNS,
  LESSON_SHEET,
  META_EFFECTIVE_FROM_KEY,
  META_SHEET,
  STUDENT_COLUMNS,
  STUDENT_SHEET,
  TEACHER_COLUMNS,
  TEACHER_SHEET,
} from "./import-format.js";
import { importTimetable } from "./import.js";

type Row = (string | number)[];

async function workbook(opts: {
  lessons?: Row[];
  students?: Row[];
  effectiveFrom?: string;
} = {}): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const meta = wb.addWorksheet(META_SHEET);
  meta.addRow(["key", "value"]);
  meta.addRow([META_EFFECTIVE_FROM_KEY, opts.effectiveFrom ?? "2026-09-07"]);

  const g = wb.addWorksheet(GRADE_SHEET);
  g.addRow([...GRADE_COLUMNS]);
  g.addRow(["11", "Khối 11"]);

  const c = wb.addWorksheet(CLASS_SHEET);
  c.addRow([...CLASS_COLUMNS]);
  c.addRow(["11A5", "11A5", "11", "P.201"]);
  c.addRow(["11A6", "11A6", "11", ""]);

  const t = wb.addWorksheet(TEACHER_SHEET);
  t.addRow([...TEACHER_COLUMNS]);
  t.addRow(["NVA", "Nguyễn Văn A"]);
  t.addRow(["NVB", "Nguyễn Văn B"]);

  const s = wb.addWorksheet(STUDENT_SHEET);
  s.addRow([...STUDENT_COLUMNS]);
  for (const r of opts.students ?? [["HS1", "Trần Thị B", "11A5"]]) s.addRow(r);

  const l = wb.addWorksheet(LESSON_SHEET);
  l.addRow([...LESSON_COLUMNS]);
  for (const r of opts.lessons ?? [
    ["11A5", 2, "SANG", 1, "Toán", "TOAN", "NVA,NVB", "P.202", ""],
    ["11A6", 3, "CHIEU", 2, "Văn", "VAN", "NVB", "", "Tự chọn"],
  ])
    l.addRow(r);

  return Buffer.from(await wb.xlsx.writeBuffer());
}

/** Wraps the test db so the Nth `.insert(lesson)` throws, to test rollback. */
function failingLessonInsertDb(db: Db, failOnCall: number): Db {
  let calls = 0;
  return new Proxy(db, {
    get(target, prop, receiver) {
      if (prop === "insert") {
        return (table: unknown) => {
          if (table === lesson) {
            calls += 1;
            if (calls === failOnCall) throw new Error("simulated mid-import failure");
          }
          return (target.insert as (t: unknown) => unknown)(table);
        };
      }
      if (prop === "transaction") {
        return (fn: (tx: Db) => unknown) =>
          (target.transaction as (f: (tx: Db) => unknown) => unknown)(() =>
            fn(receiver as Db)
          );
      }
      return Reflect.get(target, prop, receiver);
    },
  }) as Db;
}

describe("importTimetable", () => {
  it("inserts a TKB-scoped snapshot and returns correct counts", async () => {
    const db = createTestDb();
    const res = await importTimetable(await workbook(), db);

    expect(res.lessonsCreated).toBe(2);
    expect(res.gradesCreated).toBe(1);
    expect(res.classesCreated).toBe(2);
    expect(res.teachersCreated).toBe(2);
    expect(res.studentsCreated).toBe(1);
    expect(res.subjectsCreated).toBe(2); // TOAN, VAN
    expect(res.roomsCreated).toBe(2); // P.201 (home room) + P.202 (lesson room)

    const tkb = db.select().from(timetable).all().find((t) => t.id === res.timetableId)!;
    expect(tkb.isActive).toBe(0);
    expect(db.select().from(lesson).all()).toHaveLength(2);
    expect(db.select().from(student).all()).toHaveLength(1);
  });

  it("creates a distinct independent snapshot on a second import", async () => {
    const db = createTestDb();
    const first = await importTimetable(await workbook(), db);
    const second = await importTimetable(await workbook(), db);
    expect(second.timetableId).not.toBe(first.timetableId);
    expect(db.select().from(timetable).all()).toHaveLength(2);
    // Two independent lesson sets.
    expect(db.select().from(lesson).all()).toHaveLength(4);
  });

  it("rolls back entirely when a row fails midway", async () => {
    const db = createTestDb();
    const wrapped = failingLessonInsertDb(db, 2);
    await expect(importTimetable(await workbook(), wrapped)).rejects.toThrow(/mid-import/);
    expect(db.select().from(timetable).all()).toHaveLength(0);
    expect(db.select().from(lesson).all()).toHaveLength(0);
    expect(db.select().from(student).all()).toHaveLength(0);
  });

  it("rejects an invalid workbook without creating anything", async () => {
    const db = createTestDb();
    await expect(importTimetable(Buffer.from("not xlsx"), db)).rejects.toThrow();
    expect(db.select().from(timetable).all()).toHaveLength(0);
  });
});
