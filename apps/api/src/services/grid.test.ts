import { describe, expect, it } from "vitest";
import {
  grade,
  lesson,
  lessonTeacher,
  period,
  room,
  schoolClass,
  student,
  studentLesson,
  subject,
  teacher,
  timetable,
} from "../db/schema.js";
import { createTestDb, type Db } from "../db/testdb.js";
import {
  resolveClassGrid,
  resolveStudentGrid,
  resolveTeacherGrid,
} from "./grid.js";

/**
 * Seeds a small but representative schedule:
 * - class 11A5, home room R-11A5
 * - Monday period 1: Toán (Anh.NV), regular in home room
 * - Tuesday period 1: elective slot — Hóa (room R-11A2, co-taught) attended by
 *   student Vĩ, and a second elective CNNN (room R-11C3) he does not attend
 * - teacher Tâm teaches the Hóa elective only
 */
async function seed(db: Db) {
  const [tkb] = await db
    .insert(timetable)
    .values([{ ordinal: 1, effectiveFrom: new Date("2026-09-01T00:00:00Z"), isActive: 1 }])
    .returning({ id: timetable.id })
    .all();
  const tkbId = tkb!.id;

  const [g11] = await db.insert(grade).values([{ name: "11", timetableId: tkbId }]).returning({ id: grade.id }).all();
  const rooms = await db
    .insert(room)
    .values([
      { name: "R-11A5", timetableId: tkbId },
      { name: "R-11A2", timetableId: tkbId },
      { name: "R-11C3", timetableId: tkbId },
    ])
    .returning({ id: room.id, name: room.name })
    .all();
  const rId = (n: string) => rooms.find((r) => r.name === n)!.id;

  const [cls] = await db
    .insert(schoolClass)
    .values([{ name: "11A5", gradeId: g11!.id, homeRoomId: rId("R-11A5"), timetableId: tkbId }])
    .returning({ id: schoolClass.id })
    .all();

  const [vi] = await db
    .insert(student)
    .values([{ name: "Cao Hoàng Vĩ", classId: cls!.id, timetableId: tkbId }])
    .returning({ id: student.id })
    .all();

  const teachers = await db
    .insert(teacher)
    .values([
      { name: "Nguyễn Văn Anh", shortCode: "Anh.NV", timetableId: tkbId },
      { name: "Hồ Minh Tâm", shortCode: "Tâm.HM", timetableId: tkbId },
      { name: "Nguyễn Hoài Mai", shortCode: "Mai.NH", timetableId: tkbId },
    ])
    .returning({ id: teacher.id, name: teacher.name })
    .all();
  const tId = (n: string) => teachers.find((t) => t.name === n)!.id;

  const periods = await db
    .insert(period)
    .values([{ session: "SANG", ordinal: 1, startTime: "07g00", endTime: "07g45" }])
    .returning({ id: period.id })
    .all();
  const p1 = periods[0]!.id;

  const subjects = await db
    .insert(subject)
    .values([
      { name: "Toán", shortCode: "Toán", timetableId: tkbId },
      { name: "Hóa học", shortCode: "Hóa học #6", timetableId: tkbId },
      { name: "Công nghệ nông nghiệp", shortCode: "CNNN #2", timetableId: tkbId },
    ])
    .returning({ id: subject.id, shortCode: subject.shortCode })
    .all();
  const sId = (c: string) => subjects.find((s) => s.shortCode === c)!.id;

  const [toan] = await db
    .insert(lesson)
    .values([{ timetableId: tkbId, classId: cls!.id, periodId: p1, day: 2, subjectId: sId("Toán"), roomId: rId("R-11A5") }])
    .returning({ id: lesson.id })
    .all();
  await db.insert(lessonTeacher).values({ lessonId: toan!.id, teacherId: tId("Nguyễn Văn Anh") }).run();

  const [hoa] = await db
    .insert(lesson)
    .values([{ timetableId: tkbId, classId: cls!.id, periodId: p1, day: 3, subjectId: sId("Hóa học #6"), roomId: rId("R-11A2"), category: 3, choiceGroup: "Tự chọn (TC3)" }])
    .returning({ id: lesson.id })
    .all();
  await db.insert(lessonTeacher).values([
    { lessonId: hoa!.id, teacherId: tId("Hồ Minh Tâm") },
    { lessonId: hoa!.id, teacherId: tId("Nguyễn Hoài Mai") },
  ]).run();

  const [cnnn] = await db
    .insert(lesson)
    .values([{ timetableId: tkbId, classId: cls!.id, periodId: p1, day: 3, subjectId: sId("CNNN #2"), roomId: rId("R-11C3"), category: 1, choiceGroup: "Tự chọn (TC2)" }])
    .returning({ id: lesson.id })
    .all();

  await db.insert(studentLesson).values({ studentId: vi!.id, lessonId: hoa!.id }).run();

  return { classId: cls!.id, studentId: vi!.id, tamId: tId("Hồ Minh Tâm"), p1, cnnnId: cnnn!.id, tkbId };
}

describe("resolveClassGrid", () => {
  it("returns a full grid with every slot present and a regular cell", async () => {
    const db = await createTestDb();
    const { classId, p1 } = await seed(db);
    const grid = (await resolveClassGrid(classId, undefined, db))!;
    expect(grid.title).toBe("Lớp 11A5");
    // 6 days × 1 period = 6 slots.
    expect(grid.slots).toHaveLength(6);
    const mon = grid.slots.find((s) => s.day === 2 && s.periodId === p1)!;
    expect(mon.cell?.subjectShortCode).toBe("Toán");
    expect(mon.cell?.teachers).toEqual(["Anh.NV"]);
    expect(mon.cell?.isRoomMove).toBe(false);
  });

  it("marks empty slots as null", async () => {
    const db = await createTestDb();
    const { classId } = await seed(db);
    const grid = (await resolveClassGrid(classId, undefined, db))!;
    const empty = grid.slots.find((s) => s.day === 7)!;
    expect(empty.cell).toBeNull();
  });

  it("returns null for an unknown class", async () => {
    const db = await createTestDb();
    await seed(db);
    expect(await resolveClassGrid(99999, undefined, db)).toBeNull();
  });
});

describe("resolveStudentGrid", () => {
  it("resolves the elective slot to the lesson the student attends, with room move", async () => {
    const db = await createTestDb();
    const { studentId, p1 } = await seed(db);
    const grid = (await resolveStudentGrid(studentId, undefined, db))!;
    expect(grid.title).toBe("Cao Hoàng Vĩ");
    expect(grid.subtitle).toBe("Lớp 11A5");
    const elective = grid.slots.find((s) => s.day === 3 && s.periodId === p1)!;
    expect(elective.cell?.subjectShortCode).toBe("Hóa học #6");
    expect(elective.cell?.choiceGroup).toBe("Tự chọn (TC3)");
    expect(elective.cell?.isRoomMove).toBe(true);
    expect(elective.cell?.room).toBe("R-11A2");
    expect(elective.cell?.teachers).toEqual(["Tâm.HM", "Mai.NH"]);
  });

  it("does not show electives the student is not enrolled in", async () => {
    const db = await createTestDb();
    const { studentId } = await seed(db);
    const grid = (await resolveStudentGrid(studentId, undefined, db))!;
    const cells = grid.slots.map((s) => s.cell?.subjectShortCode).filter(Boolean);
    expect(cells).not.toContain("CNNN #2");
  });

  it("returns null for an unknown student", async () => {
    const db = await createTestDb();
    await seed(db);
    expect(await resolveStudentGrid(99999, undefined, db)).toBeNull();
  });
});

describe("resolveTeacherGrid", () => {
  it("returns only the slots the teacher teaches, labelled with the class", async () => {
    const db = await createTestDb();
    const { tamId, p1 } = await seed(db);
    const grid = (await resolveTeacherGrid(tamId, undefined, db))!;
    expect(grid.title).toBe("GV. Hồ Minh Tâm");
    const taught = grid.slots.filter((s) => s.cell !== null);
    expect(taught).toHaveLength(1);
    expect(taught[0]!.day).toBe(3);
    expect(taught[0]!.periodId).toBe(p1);
    expect(taught[0]!.cell?.className).toBe("11A5");
    expect(taught[0]!.cell?.subjectShortCode).toBe("Hóa học #6");
  });

  it("returns null for an unknown teacher", async () => {
    const db = await createTestDb();
    await seed(db);
    expect(await resolveTeacherGrid(99999, undefined, db)).toBeNull();
  });
});

describe("timetable (TKB) scoping", () => {
  it("resolves the default active TKB when none is specified", async () => {
    const db = await createTestDb();
    const { classId, tkbId } = await seed(db);
    const grid = (await resolveClassGrid(classId, undefined, db))!;
    expect(grid.timetableId).toBe(tkbId);
  });

  it("resolves an explicitly requested TKB", async () => {
    const db = await createTestDb();
    const { classId, tkbId } = await seed(db);
    const grid = (await resolveClassGrid(classId, tkbId, db))!;
    expect(grid.timetableId).toBe(tkbId);
  });

  it("returns null for a non-existent requested TKB", async () => {
    const db = await createTestDb();
    const { classId, tkbId } = await seed(db);
    expect(await resolveClassGrid(classId, tkbId + 999, db)).toBeNull();
  });

  it("only resolves a class within its own TKB snapshot", async () => {
    const db = await createTestDb();
    const { classId, tkbId } = await seed(db);
    // A second TKB with its own class + a single lesson (independent snapshot).
    const [tkb2] = await db
      .insert(timetable)
      .values([{ ordinal: 2, effectiveFrom: new Date("2026-09-15T00:00:00Z"), isActive: 1 }])
      .returning({ id: timetable.id })
      .all();
    const [g2] = await db
      .insert(grade)
      .values([{ name: "11", timetableId: tkb2!.id }])
      .returning({ id: grade.id })
      .all();
    const [cls2] = await db
      .insert(schoolClass)
      .values([{ name: "11A5", gradeId: g2!.id, timetableId: tkb2!.id }])
      .returning({ id: schoolClass.id })
      .all();
    const [subj2] = await db
      .insert(subject)
      .values([{ name: "Toán", shortCode: "Toán", timetableId: tkb2!.id }])
      .returning({ id: subject.id })
      .all();
    const periodRow = (await db.select({ id: period.id }).from(period).get())!;
    await db.insert(lesson)
      .values([{ timetableId: tkb2!.id, classId: cls2!.id, periodId: periodRow.id, day: 7, subjectId: subj2!.id }])
      .run();

    // Each class resolves within its own TKB.
    const g1 = (await resolveClassGrid(classId, tkbId, db))!;
    const gOther = (await resolveClassGrid(cls2!.id, tkb2!.id, db))!;
    expect(g1.slots.some((s) => s.cell !== null)).toBe(true);
    expect(gOther.slots.some((s) => s.cell !== null)).toBe(true);

    // A cross-TKB reference (TKB-1 class requested under TKB-2) is not found.
    expect(await resolveClassGrid(classId, tkb2!.id, db)).toBeNull();
    expect(await resolveClassGrid(cls2!.id, tkbId, db)).toBeNull();
  });

  it("returns null when no timetable can be resolved (no active TKB)", async () => {
    const db = await createTestDb();
    const { classId } = await seed(db);
    // Deactivate the only TKB; with no active TKB and no explicit request, null.
    await db.update(timetable).set({ isActive: 0 }).run();
    expect(await resolveClassGrid(classId, undefined, db)).toBeNull();
  });
});
