import { describe, expect, it } from "vitest";
import {
  grade,
  schoolClass,
  student,
  teacher,
  timetable,
} from "../db/schema.js";
import { createTestDb, type Db } from "../db/testdb.js";
import { getClasses, getStudents, getTeachers } from "./directory.js";

/** Seeds one active TKB and a directory scoped to it. Returns the TKB id. */
function seedDirectory(db: Db): number {
  const [tkb] = db
    .insert(timetable)
    .values([{ ordinal: 1, effectiveFrom: new Date("2026-09-01T00:00:00Z"), isActive: 1 }])
    .returning({ id: timetable.id })
    .all();
  const tkbId = tkb!.id;
  const [g11] = db
    .insert(grade)
    .values([{ name: "11", timetableId: tkbId }])
    .returning({ id: grade.id })
    .all();
  const [c11a] = db
    .insert(schoolClass)
    .values([{ name: "11A", gradeId: g11!.id, timetableId: tkbId }])
    .returning({ id: schoolClass.id })
    .all();
  db.insert(student)
    .values([{ name: "Nguyen Van An", classId: c11a!.id, timetableId: tkbId }])
    .run();
  db.insert(teacher)
    .values([{ name: "Do Minh Hung", timetableId: tkbId }])
    .run();
  return tkbId;
}

describe("directory service — getClasses", () => {
  it("maps rows to the shared class-list contract (default active TKB)", () => {
    const db = createTestDb();
    seedDirectory(db);
    const res = getClasses(undefined, db);
    expect(res.items).toHaveLength(1);
    expect(res.items[0]).toEqual({
      id: expect.any(Number),
      name: "11A",
      grade: { id: expect.any(Number), name: "11" },
    });
  });

  it("returns an empty list when no timetable is active", () => {
    const db = createTestDb();
    expect(getClasses(undefined, db)).toEqual({ items: [] });
  });
});

describe("directory service — getStudents", () => {
  it("returns matching students with class context", () => {
    const db = createTestDb();
    seedDirectory(db);
    const res = getStudents("nguyen", undefined, db);
    expect(res.items).toHaveLength(1);
    expect(res.items[0]!.class.name).toBe("11A");
  });

  it("returns an empty list on no match", () => {
    const db = createTestDb();
    seedDirectory(db);
    expect(getStudents("zzz", undefined, db)).toEqual({ items: [] });
  });

  it("returns an empty list for an empty query", () => {
    const db = createTestDb();
    seedDirectory(db);
    expect(getStudents("   ", undefined, db)).toEqual({ items: [] });
  });
});

describe("directory service — getTeachers", () => {
  it("returns matching teachers by identity only", () => {
    const db = createTestDb();
    seedDirectory(db);
    const res = getTeachers("do", undefined, db);
    expect(res.items.map((t) => t.name)).toContain("Do Minh Hung");
    expect(res.items[0]).not.toHaveProperty("class");
  });

  it("returns an empty list on no match", () => {
    const db = createTestDb();
    seedDirectory(db);
    expect(getTeachers("zzz", undefined, db)).toEqual({ items: [] });
  });

  it("returns an empty list for an empty query", () => {
    const db = createTestDb();
    seedDirectory(db);
    expect(getTeachers("", undefined, db)).toEqual({ items: [] });
  });
});
