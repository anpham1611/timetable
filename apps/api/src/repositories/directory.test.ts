import { describe, expect, it } from "vitest";
import {
  grade,
  schoolClass,
  student,
  teacher,
  timetable,
} from "../db/schema.js";
import { createTestDb, type Db } from "../db/testdb.js";
import { listClasses, searchStudents, searchTeachers } from "./directory.js";

/** Seeds two TKBs; directory rows are scoped to TKB 1 unless noted. */
function seedDirectory(db: Db) {
  db.insert(timetable)
    .values([
      { ordinal: 1, effectiveFrom: new Date("2026-09-01T00:00:00Z"), isActive: 1 },
      { ordinal: 2, effectiveFrom: new Date("2026-09-15T00:00:00Z"), isActive: 1 },
    ])
    .run();
  const TKB1 = 1;
  const TKB2 = 2;

  const [g11, g12] = db
    .insert(grade)
    .values([
      { name: "11", timetableId: TKB1 },
      { name: "12", timetableId: TKB1 },
    ])
    .returning({ id: grade.id })
    .all();

  const classes = db
    .insert(schoolClass)
    .values([
      { name: "11B", gradeId: g11!.id, timetableId: TKB1 },
      { name: "11A", gradeId: g11!.id, timetableId: TKB1 },
      { name: "12A", gradeId: g12!.id, timetableId: TKB1 },
    ])
    .returning({ id: schoolClass.id, name: schoolClass.name })
    .all();
  const byName = new Map(classes.map((c) => [c.name, c.id]));

  db.insert(student)
    .values([
      { name: "Nguyen Van An", classId: byName.get("11A")!, timetableId: TKB1 },
      { name: "Tran Thi Binh", classId: byName.get("11B")!, timetableId: TKB1 },
    ])
    .run();

  db.insert(teacher)
    .values([
      { name: "Do Minh Hung", timetableId: TKB1 },
      { name: "Ngo Thi Lan", timetableId: TKB1 },
    ])
    .run();

  // A class/student/teacher belonging to the *other* TKB, to prove scoping.
  const [g2] = db
    .insert(grade)
    .values([{ name: "OTHER", timetableId: TKB2 }])
    .returning({ id: grade.id })
    .all();
  const [otherClass] = db
    .insert(schoolClass)
    .values([{ name: "OTHERCLASS", gradeId: g2!.id, timetableId: TKB2 }])
    .returning({ id: schoolClass.id })
    .all();
  db.insert(student)
    .values([{ name: "Other Student", classId: otherClass!.id, timetableId: TKB2 }])
    .run();
  db.insert(teacher)
    .values([{ name: "Other Teacher", timetableId: TKB2 }])
    .run();

  return { byName, TKB1, TKB2 };
}

describe("directory repository — listClasses", () => {
  it("returns classes joined to grade, ordered by grade then class name", () => {
    const db = createTestDb();
    const { TKB1 } = seedDirectory(db);
    const rows = listClasses(TKB1, db);
    expect(rows.map((r) => r.name)).toEqual(["11A", "11B", "12A"]);
    expect(rows[0]!.gradeName).toBe("11");
    expect(rows[2]!.gradeName).toBe("12");
  });

  it("returns only the requested TKB's classes", () => {
    const db = createTestDb();
    const { TKB2 } = seedDirectory(db);
    const rows = listClasses(TKB2, db);
    expect(rows.map((r) => r.name)).toEqual(["OTHERCLASS"]);
  });

  it("returns an empty list when there are no classes for the TKB", () => {
    const db = createTestDb();
    seedDirectory(db);
    expect(listClasses(999, db)).toEqual([]);
  });
});

describe("directory repository — searchStudents", () => {
  it("matches by case-insensitive substring within the TKB", () => {
    const db = createTestDb();
    const { TKB1 } = seedDirectory(db);
    const rows = searchStudents("nguyen", TKB1, db);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.name).toBe("Nguyen Van An");
    expect(rows[0]!.className).toBe("11A");
  });

  it("does not match students from another TKB", () => {
    const db = createTestDb();
    const { TKB1 } = seedDirectory(db);
    expect(searchStudents("Other", TKB1, db)).toEqual([]);
  });

  it("returns an empty list when nothing matches", () => {
    const db = createTestDb();
    const { TKB1 } = seedDirectory(db);
    expect(searchStudents("zzz", TKB1, db)).toEqual([]);
  });
});

describe("directory repository — searchTeachers", () => {
  it("matches teachers by substring within the TKB", () => {
    const db = createTestDb();
    const { TKB1 } = seedDirectory(db);
    const rows = searchTeachers("do", TKB1, db);
    expect(rows.map((r) => r.name)).toContain("Do Minh Hung");
  });

  it("does not match teachers from another TKB", () => {
    const db = createTestDb();
    const { TKB1 } = seedDirectory(db);
    expect(searchTeachers("Other", TKB1, db)).toEqual([]);
  });

  it("returns an empty list when nothing matches", () => {
    const db = createTestDb();
    const { TKB1 } = seedDirectory(db);
    expect(searchTeachers("zzz", TKB1, db)).toEqual([]);
  });
});
