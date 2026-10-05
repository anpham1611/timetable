import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { createTestDb } from "../db/testdb.js";
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
import { getActiveTimetables, toggleTimetableActive } from "./timetable.js";
import { getClasses, getStudents, getTeachers } from "./directory.js";
import { resolveClassGrid } from "./grid.js";

/** A complete, valid six-sheet workbook for the E2E flow. */
async function workbook(): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const meta = wb.addWorksheet(META_SHEET);
  meta.addRow(["key", "value"]);
  meta.addRow([META_EFFECTIVE_FROM_KEY, "2026-09-07"]);

  const g = wb.addWorksheet(GRADE_SHEET);
  g.addRow([...GRADE_COLUMNS]);
  g.addRow(["11", "Khối 11"]);

  const c = wb.addWorksheet(CLASS_SHEET);
  c.addRow([...CLASS_COLUMNS]);
  c.addRow(["11A5", "11A5", "11", "P.201"]);

  const t = wb.addWorksheet(TEACHER_SHEET);
  t.addRow([...TEACHER_COLUMNS]);
  t.addRow(["NVA", "Nguyễn Văn A"]);

  const s = wb.addWorksheet(STUDENT_SHEET);
  s.addRow([...STUDENT_COLUMNS]);
  s.addRow(["HS1", "Trần Thị B", "11A5"]);

  const l = wb.addWorksheet(LESSON_SHEET);
  l.addRow([...LESSON_COLUMNS]);
  // A home-room lesson (no move) and a moved lesson.
  l.addRow(["11A5", 2, "SANG", 1, "Toán", "TOAN", "NVA", "P.201", ""]);
  l.addRow(["11A5", 2, "SANG", 2, "Hóa", "HOA", "NVA", "P.Lab", ""]);
  return Buffer.from(await wb.xlsx.writeBuffer());
}

describe("E2E: import → activate → read within the new TKB", () => {
  it("drives the full admin import flow end to end", async () => {
    const db = await createTestDb();

    // 1. Import creates a new inactive TKB snapshot.
    const result = await importTimetable(await workbook(), db);
    expect(result.lessonsCreated).toBe(2);
    const tkb = result.timetableId;

    // 2. Before activation it is not on the public active list.
    expect((await getActiveTimetables(db)).items.find((i) => i.id === tkb)).toBeUndefined();

    // 3. Activate it.
    expect(await toggleTimetableActive(tkb, true, db)).toBe(true);
    const active = await getActiveTimetables(db);
    expect(active.items.find((i) => i.id === tkb)).toBeDefined();
    expect(active.defaultSelectedId).toBe(tkb);

    // 4. Directory lookups resolve from this TKB's snapshot.
    const classes = await getClasses(tkb, db);
    expect(classes.items.map((c) => c.name)).toEqual(["11A5"]);
    const classId = classes.items[0]!.id;

    expect((await getStudents("Trần", tkb, db)).items[0]!.name).toBe("Trần Thị B");
    expect((await getTeachers("Nguyễn", tkb, db)).items[0]!.name).toBe("Nguyễn Văn A");

    // 5. The class grid resolves from this TKB, with a room move only for the
    //    lesson taught outside the home room.
    const grid = (await resolveClassGrid(classId, tkb, db))!;
    expect(grid.timetableId).toBe(tkb);
    const filled = grid.slots.filter((s) => s.cell !== null);
    expect(filled).toHaveLength(2);
    const moves = filled.filter((s) => s.cell!.isRoomMove);
    expect(moves).toHaveLength(1); // only the P.Lab lesson is a move
    expect(moves[0]!.cell!.room).toBe("P.Lab");

    // 6. Reads scoped to a different TKB see nothing of this one.
    expect((await getClasses(tkb + 999, db)).items).toEqual([]);
    expect(await resolveClassGrid(classId, tkb + 999, db)).toBeNull();
  });
});
