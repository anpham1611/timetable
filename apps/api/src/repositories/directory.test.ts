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
async function seedDirectory(db: Db) {
  await db
    .insert(timetable)
    .values([
      { ordinal: 1, effectiveFrom: new Date("2026-09-01T00:00:00Z"), isActive: 1 },
      { ordinal: 2, effectiveFrom: new Date("2026-09-15T00:00:00Z"), isActive: 1 },
    ])
    .run();
  const TKB1 = 1;
  const TKB2 = 2;

  const [g11, g12] = await db
    .insert(grade)
    .values([
      { name: "11", timetableId: TKB1 },
      { name: "12", timetableId: TKB1 },
    ])
    .returning({ id: grade.id })
    .all();

  const classes = await db
    .insert(schoolClass)
    .values([
      { name: "11B", gradeId: g11!.id, timetableId: TKB1 },
      { name: "11A", gradeId: g11!.id, timetableId: TKB1 },
      { name: "12A", gradeId: g12!.id, timetableId: TKB1 },
    ])
    .returning({ id: schoolClass.id, name: schoolClass.name })
    .all();
  const byName = new Map(classes.map((c) => [c.name, c.id]));

  await db
    .insert(student)
    .values([
      { name: "Nguyen Van An", classId: byName.get("11A")!, timetableId: TKB1 },
      { name: "Tran Thi Binh", classId: byName.get("11B")!, timetableId: TKB1 },
    ])
    .run();

  await db
    .insert(teacher)
    .values([
      { name: "Do Minh Hung", timetableId: TKB1 },
      { name: "Ngo Thi Lan", timetableId: TKB1 },
    ])
    .run();

  // A class/student/teacher belonging to the *other* TKB, to prove scoping.
  const [g2] = await db
    .insert(grade)
    .values([{ name: "OTHER", timetableId: TKB2 }])
    .returning({ id: grade.id })
    .all();
  const [otherClass] = await db
    .insert(schoolClass)
    .values([{ name: "OTHERCLASS", gradeId: g2!.id, timetableId: TKB2 }])
    .returning({ id: schoolClass.id })
    .all();
  await db
    .insert(student)
    .values([{ name: "Other Student", classId: otherClass!.id, timetableId: TKB2 }])
    .run();
  await db
    .insert(teacher)
    .values([{ name: "Other Teacher", timetableId: TKB2 }])
    .run();

  return { byName, TKB1, TKB2 };
}

describe("directory repository — listClasses", () => {
  it("returns classes joined to grade, ordered by grade then class name", async () => {
    const db = await createTestDb();
    const { TKB1 } = await seedDirectory(db);
    const rows = await listClasses(TKB1, db);
    expect(rows.map((r) => r.name)).toEqual(["11A", "11B", "12A"]);
    expect(rows[0]!.gradeName).toBe("11");
    expect(rows[2]!.gradeName).toBe("12");
  });

  it("returns only the requested TKB's classes", async () => {
    const db = await createTestDb();
    const { TKB2 } = await seedDirectory(db);
    const rows = await listClasses(TKB2, db);
    expect(rows.map((r) => r.name)).toEqual(["OTHERCLASS"]);
  });

  it("returns an empty list when there are no classes for the TKB", async () => {
    const db = await createTestDb();
    await seedDirectory(db);
    expect(await listClasses(999, db)).toEqual([]);
  });
});

describe("directory repository — searchStudents", () => {
  it("matches by case-insensitive substring within the TKB", async () => {
    const db = await createTestDb();
    const { TKB1 } = await seedDirectory(db);
    const rows = await searchStudents("nguyen", TKB1, db);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.name).toBe("Nguyen Van An");
    expect(rows[0]!.className).toBe("11A");
  });

  it("does not match students from another TKB", async () => {
    const db = await createTestDb();
    const { TKB1 } = await seedDirectory(db);
    expect(await searchStudents("Other", TKB1, db)).toEqual([]);
  });

  it("returns an empty list when nothing matches", async () => {
    const db = await createTestDb();
    const { TKB1 } = await seedDirectory(db);
    expect(await searchStudents("zzz", TKB1, db)).toEqual([]);
  });
});

describe("directory repository — searchTeachers", () => {
  it("matches teachers by substring within the TKB", async () => {
    const db = await createTestDb();
    const { TKB1 } = await seedDirectory(db);
    const rows = await searchTeachers("do", TKB1, db);
    expect(rows.map((r) => r.name)).toContain("Do Minh Hung");
  });

  it("does not match teachers from another TKB", async () => {
    const db = await createTestDb();
    const { TKB1 } = await seedDirectory(db);
    expect(await searchTeachers("Other", TKB1, db)).toEqual([]);
  });

  it("returns an empty list when nothing matches", async () => {
    const db = await createTestDb();
    const { TKB1 } = await seedDirectory(db);
    expect(await searchTeachers("zzz", TKB1, db)).toEqual([]);
  });
});
