import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db as defaultDb, type Db } from "../db/index.js";
import {
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

/** A period axis row (the ten canonical slots). */
export interface PeriodRow {
  id: number;
  session: string;
  ordinal: number;
  startTime: string | null;
  endTime: string | null;
}

/** All periods, ordered SÁNG before CHIỀU and by ordinal. */
export async function listPeriods(db: Db = defaultDb): Promise<PeriodRow[]> {
  return db
    .select({
      id: period.id,
      session: period.session,
      ordinal: period.ordinal,
      startTime: period.startTime,
      endTime: period.endTime,
    })
    .from(period)
    // SÁNG must sort before CHIỀU (alphabetical would put CHIEU first); then ordinal.
    .orderBy(sql`case ${period.session} when 'SANG' then 0 else 1 end`, asc(period.ordinal))
    .all();
}

export interface ClassRow {
  id: number;
  name: string;
  homeRoomId: number | null;
}

export function findClass(
  classId: number,
  timetableId: number,
  db: Db = defaultDb
): Promise<ClassRow | undefined> {
  return db
    .select({ id: schoolClass.id, name: schoolClass.name, homeRoomId: schoolClass.homeRoomId })
    .from(schoolClass)
    .where(and(eq(schoolClass.id, classId), eq(schoolClass.timetableId, timetableId)))
    .get();
}

export interface StudentRow {
  id: number;
  name: string;
  classId: number;
  className: string;
}

export function findStudent(
  studentId: number,
  timetableId: number,
  db: Db = defaultDb
): Promise<StudentRow | undefined> {
  return db
    .select({
      id: student.id,
      name: student.name,
      classId: schoolClass.id,
      className: schoolClass.name,
    })
    .from(student)
    .innerJoin(schoolClass, eq(student.classId, schoolClass.id))
    .where(and(eq(student.id, studentId), eq(student.timetableId, timetableId)))
    .get();
}

export interface TeacherRow {
  id: number;
  name: string;
}

export function findTeacher(
  teacherId: number,
  timetableId: number,
  db: Db = defaultDb
): Promise<TeacherRow | undefined> {
  return db
    .select({ id: teacher.id, name: teacher.name })
    .from(teacher)
    .where(and(eq(teacher.id, teacherId), eq(teacher.timetableId, timetableId)))
    .get();
}

/**
 * A lesson joined to its subject and (optional) room, without teachers. The
 * `className` is included so the teacher view can label the class taught.
 * Teachers are fetched separately via {@link teachersForLessons}.
 */
export interface LessonRow {
  id: number;
  classId: number;
  className: string;
  periodId: number;
  day: number;
  subjectName: string;
  subjectShortCode: string;
  roomId: number | null;
  roomName: string | null;
  category: number | null;
  choiceGroup: string | null;
}

function selectLessons(db: Db) {
  return db
    .select({
      id: lesson.id,
      classId: lesson.classId,
      className: schoolClass.name,
      periodId: lesson.periodId,
      day: lesson.day,
      subjectName: subject.name,
      subjectShortCode: subject.shortCode,
      roomId: lesson.roomId,
      roomName: room.name,
      category: lesson.category,
      choiceGroup: lesson.choiceGroup,
    })
    .from(lesson)
    .innerJoin(subject, eq(lesson.subjectId, subject.id))
    .innerJoin(schoolClass, eq(lesson.classId, schoolClass.id))
    .leftJoin(room, eq(lesson.roomId, room.id));
}

/** All lessons placed for a class within one published TKB. */
export function lessonsForClass(
  classId: number,
  timetableId: number,
  db: Db = defaultDb
): Promise<LessonRow[]> {
  return selectLessons(db)
    .where(and(eq(lesson.classId, classId), eq(lesson.timetableId, timetableId)))
    .all();
}

/** The lessons a teacher teaches within one published TKB, across all classes. */
export async function lessonsForTeacher(
  teacherId: number,
  timetableId: number,
  db: Db = defaultDb
): Promise<LessonRow[]> {
  const lessonIds = (
    await db
      .select({ lessonId: lessonTeacher.lessonId })
      .from(lessonTeacher)
      .where(eq(lessonTeacher.teacherId, teacherId))
      .all()
  ).map((r) => r.lessonId);
  if (lessonIds.length === 0) return [];
  return selectLessons(db)
    .where(and(inArray(lesson.id, lessonIds), eq(lesson.timetableId, timetableId)))
    .all();
}

/** Whether a timetable (TKB) with this id exists. */
export async function timetableExists(timetableId: number, db: Db = defaultDb): Promise<boolean> {
  const row = await db
    .select({ id: timetable.id })
    .from(timetable)
    .where(eq(timetable.id, timetableId))
    .get();
  return row !== undefined;
}

/**
 * Active timetable rows (is_active=1) ordered by effectiveFrom ascending, used
 * to pick the default TKB when a grid is requested without an explicit one.
 */
export function listActiveTimetableRows(
  db: Db = defaultDb
): Promise<{ id: number; effectiveFrom: Date }[]> {
  return db
    .select({ id: timetable.id, effectiveFrom: timetable.effectiveFrom })
    .from(timetable)
    .where(eq(timetable.isActive, 1))
    .orderBy(asc(timetable.effectiveFrom))
    .all();
}

/** The lesson ids a student is enrolled in (their chosen electives). */
export async function electiveLessonIdsForStudent(
  studentId: number,
  db: Db = defaultDb
): Promise<number[]> {
  return (
    await db
      .select({ lessonId: studentLesson.lessonId })
      .from(studentLesson)
      .where(eq(studentLesson.studentId, studentId))
      .all()
  ).map((r) => r.lessonId);
}

/** Teacher short codes grouped by lesson id, for the supplied lessons. */
export async function teachersForLessons(
  lessonIds: number[],
  db: Db = defaultDb
): Promise<Map<number, string[]>> {
  const byLesson = new Map<number, string[]>();
  if (lessonIds.length === 0) return byLesson;
  const rows = await db
    .select({
      lessonId: lessonTeacher.lessonId,
      name: teacher.name,
      shortCode: teacher.shortCode,
    })
    .from(lessonTeacher)
    .innerJoin(teacher, eq(lessonTeacher.teacherId, teacher.id))
    .where(inArray(lessonTeacher.lessonId, lessonIds))
    .orderBy(asc(lessonTeacher.id))
    .all();
  for (const r of rows) {
    const label = r.shortCode ?? r.name;
    const list = byLesson.get(r.lessonId) ?? [];
    list.push(label);
    byLesson.set(r.lessonId, list);
  }
  return byLesson;
}
