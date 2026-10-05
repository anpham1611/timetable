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
  electiveLessonIdsForStudent,
  findClass,
  findStudent,
  findTeacher,
  lessonsForClass,
  lessonsForTeacher,
  listActiveTimetableRows,
  listPeriods,
  teachersForLessons,
  timetableExists,
} from "./grid.js";

/**
 * Builds a minimal schedule: class 11A5 in home room R-11A5, one regular lesson
 * (Toán by Anh.NV), and one elective (Hóa in room R-11A2) that student Vĩ
 * attends, co-taught by two teachers.
 */
async function seedSchedule(db: Db) {
  const [tkb] = await db
    .insert(timetable)
    .values([{ ordinal: 1, effectiveFrom: new Date("2026-09-01T00:00:00Z"), isActive: 1 }])
    .returning({ id: timetable.id })
    .all();
  const tkbId = tkb!.id;

  const [g11] = await db.insert(grade).values([{ name: "11", timetableId: tkbId }]).returning({ id: grade.id }).all();
  const rooms = await db
    .insert(room)
    .values([{ name: "R-11A5", timetableId: tkbId }, { name: "R-11A2", timetableId: tkbId }])
    .returning({ id: room.id, name: room.name })
    .all();
  const roomByName = new Map(rooms.map((r) => [r.name, r.id]));

  const [cls] = await db
    .insert(schoolClass)
    .values([{ name: "11A5", gradeId: g11!.id, homeRoomId: roomByName.get("R-11A5")!, timetableId: tkbId }])
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

  const [p1] = await db
    .insert(period)
    .values([{ session: "SANG", ordinal: 1, startTime: "07g00", endTime: "07g45" }])
    .returning({ id: period.id })
    .all();

  const subjects = await db
    .insert(subject)
    .values([
      { name: "Toán", shortCode: "Toán", timetableId: tkbId },
      { name: "Hóa học", shortCode: "Hóa học #6", timetableId: tkbId },
    ])
    .returning({ id: subject.id, shortCode: subject.shortCode })
    .all();
  const subId = (c: string) => subjects.find((s) => s.shortCode === c)!.id;

  const [regular] = await db
    .insert(lesson)
    .values([
      {
        timetableId: tkbId,
        classId: cls!.id,
        periodId: p1!.id,
        day: 2,
        subjectId: subId("Toán"),
        roomId: roomByName.get("R-11A5")!,
      },
    ])
    .returning({ id: lesson.id })
    .all();
  await db.insert(lessonTeacher).values({ lessonId: regular!.id, teacherId: tId("Nguyễn Văn Anh") }).run();

  const [elective] = await db
    .insert(lesson)
    .values([
      {
        timetableId: tkbId,
        classId: cls!.id,
        periodId: p1!.id,
        day: 3,
        subjectId: subId("Hóa học #6"),
        roomId: roomByName.get("R-11A2")!,
        category: 3,
        choiceGroup: "Tự chọn (TC3)",
      },
    ])
    .returning({ id: lesson.id })
    .all();
  await db.insert(lessonTeacher).values([
    { lessonId: elective!.id, teacherId: tId("Hồ Minh Tâm") },
    { lessonId: elective!.id, teacherId: tId("Nguyễn Hoài Mai") },
  ]).run();
  await db.insert(studentLesson).values({ studentId: vi!.id, lessonId: elective!.id }).run();

  return { classId: cls!.id, studentId: vi!.id, regularId: regular!.id, electiveId: elective!.id, anhId: tId("Nguyễn Văn Anh"), tamId: tId("Hồ Minh Tâm"), tkbId };
}

describe("grid repository", () => {
  it("listPeriods returns periods ordered SÁNG then by ordinal", async () => {
    const db = await createTestDb();
    await db.insert(period)
      .values([
        { session: "CHIEU", ordinal: 1 },
        { session: "SANG", ordinal: 2 },
        { session: "SANG", ordinal: 1 },
      ])
      .run();
    const rows = await listPeriods(db);
    expect(rows.map((p) => `${p.session}${p.ordinal}`)).toEqual(["SANG1", "SANG2", "CHIEU1"]);
  });

  it("findClass / findStudent / findTeacher resolve within the TKB and return undefined otherwise", async () => {
    const db = await createTestDb();
    const { classId, studentId, anhId, tkbId } = await seedSchedule(db);
    expect((await findClass(classId, tkbId, db))?.name).toBe("11A5");
    expect((await findStudent(studentId, tkbId, db))?.className).toBe("11A5");
    expect((await findTeacher(anhId, tkbId, db))?.name).toBe("Nguyễn Văn Anh");
    expect(await findClass(99999, tkbId, db)).toBeUndefined();
    expect(await findStudent(99999, tkbId, db)).toBeUndefined();
    expect(await findTeacher(99999, tkbId, db)).toBeUndefined();
    // Cross-TKB reference resolves to undefined (not another TKB's entity).
    expect(await findClass(classId, tkbId + 999, db)).toBeUndefined();
    expect(await findStudent(studentId, tkbId + 999, db)).toBeUndefined();
    expect(await findTeacher(anhId, tkbId + 999, db)).toBeUndefined();
  });

  it("lessonsForClass returns all class lessons including the elective", async () => {
    const db = await createTestDb();
    const { classId, tkbId } = await seedSchedule(db);
    const rows = await lessonsForClass(classId, tkbId, db);
    expect(rows).toHaveLength(2);
    const elective = rows.find((r) => r.choiceGroup !== null)!;
    expect(elective.subjectShortCode).toBe("Hóa học #6");
    expect(elective.roomName).toBe("R-11A2");
  });

  it("lessonsForClass is scoped to the given TKB", async () => {
    const db = await createTestDb();
    const { classId, tkbId } = await seedSchedule(db);
    expect(await lessonsForClass(classId, tkbId, db)).toHaveLength(2);
    // A different (non-existent) TKB yields no lessons for the same class.
    expect(await lessonsForClass(classId, tkbId + 999, db)).toHaveLength(0);
  });

  it("lessonsForTeacher returns only that teacher's lessons (including co-taught)", async () => {
    const db = await createTestDb();
    const { tamId, electiveId, tkbId } = await seedSchedule(db);
    const rows = await lessonsForTeacher(tamId, tkbId, db);
    expect(rows.map((r) => r.id)).toEqual([electiveId]);
    expect(rows[0]!.className).toBe("11A5");
  });

  it("electiveLessonIdsForStudent returns the student's enrolled lessons", async () => {
    const db = await createTestDb();
    const { studentId, electiveId } = await seedSchedule(db);
    expect(await electiveLessonIdsForStudent(studentId, db)).toEqual([electiveId]);
  });

  it("teachersForLessons groups short codes per lesson", async () => {
    const db = await createTestDb();
    const { regularId, electiveId } = await seedSchedule(db);
    const byLesson = await teachersForLessons([regularId, electiveId], db);
    expect(byLesson.get(regularId)).toEqual(["Anh.NV"]);
    expect(byLesson.get(electiveId)).toEqual(["Tâm.HM", "Mai.NH"]);
  });

  it("timetableExists and listActiveTimetableRows reflect the seeded TKB", async () => {
    const db = await createTestDb();
    const { tkbId } = await seedSchedule(db);
    expect(await timetableExists(tkbId, db)).toBe(true);
    expect(await timetableExists(tkbId + 999, db)).toBe(false);
    expect((await listActiveTimetableRows(db)).map((r) => r.id)).toEqual([tkbId]);
  });
});
