import { and, eq, sql } from "drizzle-orm";
import { db as defaultDb, type DbOrTx } from "../db/index.js";
import {
  grade,
  lesson,
  lessonTeacher,
  period,
  room,
  schoolClass,
  student,
  subject,
  teacher,
  timetable,
} from "../db/schema.js";

/**
 * Insert-only persistence for an import. Every row is created fresh and tagged
 * with the new timetable id — no resolve-or-create against other timetables, no
 * update, no delete. Each import therefore produces a self-contained snapshot.
 */

/**
 * Create a new timetable (TKB): inactive, taking the next ordinal after the
 * current max. Returns the new timetable id.
 */
export async function createTimetable(
  effectiveFrom: Date,
  db: DbOrTx = defaultDb
): Promise<number> {
  const max = await db
    .select({ max: sql<number>`coalesce(max(${timetable.ordinal}), 0)` })
    .from(timetable)
    .get();
  const nextOrdinal = (max?.max ?? 0) + 1;
  const inserted = await db
    .insert(timetable)
    .values({ ordinal: nextOrdinal, effectiveFrom, isActive: 0 })
    .run();
  return Number(inserted.lastInsertRowid);
}

export async function insertGrade(
  timetableId: number,
  name: string,
  db: DbOrTx = defaultDb
): Promise<number> {
  const r = await db.insert(grade).values({ timetableId, name: name.trim() }).run();
  return Number(r.lastInsertRowid);
}

export async function insertRoom(
  timetableId: number,
  name: string,
  db: DbOrTx = defaultDb
): Promise<number> {
  const r = await db.insert(room).values({ timetableId, name: name.trim() }).run();
  return Number(r.lastInsertRowid);
}

export async function insertClass(
  timetableId: number,
  name: string,
  gradeId: number,
  homeRoomId: number | null,
  db: DbOrTx = defaultDb
): Promise<number> {
  const r = await db
    .insert(schoolClass)
    .values({ timetableId, name: name.trim(), gradeId, homeRoomId })
    .run();
  return Number(r.lastInsertRowid);
}

export async function insertStudent(
  timetableId: number,
  name: string,
  classId: number,
  db: DbOrTx = defaultDb
): Promise<number> {
  const r = await db
    .insert(student)
    .values({ timetableId, name: name.trim(), classId })
    .run();
  return Number(r.lastInsertRowid);
}

export async function insertTeacher(
  timetableId: number,
  name: string,
  shortCode: string,
  db: DbOrTx = defaultDb
): Promise<number> {
  const r = await db
    .insert(teacher)
    .values({ timetableId, name: name.trim(), shortCode: shortCode.trim() })
    .run();
  return Number(r.lastInsertRowid);
}

export async function insertSubject(
  timetableId: number,
  name: string,
  shortCode: string,
  db: DbOrTx = defaultDb
): Promise<number> {
  const r = await db
    .insert(subject)
    .values({ timetableId, name: name.trim(), shortCode: shortCode.trim() })
    .run();
  return Number(r.lastInsertRowid);
}

/**
 * Resolve-or-create the canonical (session, ordinal) period row. Periods are the
 * ten fixed grid slots shared across all timetables (not a per-TKB snapshot), so
 * this one entity is reused rather than re-inserted.
 */
export async function ensurePeriod(
  session: string,
  ordinal: number,
  db: DbOrTx = defaultDb
): Promise<number> {
  const existing = await db
    .select({ id: period.id })
    .from(period)
    .where(and(eq(period.session, session), eq(period.ordinal, ordinal)))
    .get();
  if (existing) return existing.id;
  const r = await db.insert(period).values({ session, ordinal }).run();
  return Number(r.lastInsertRowid);
}

/** Insert one lesson row and return its id. */
export async function insertLesson(
  values: {
    timetableId: number;
    classId: number;
    periodId: number;
    day: number;
    subjectId: number;
    roomId: number | null;
    category: number | null;
    choiceGroup: string | null;
  },
  db: DbOrTx = defaultDb
): Promise<number> {
  const r = await db.insert(lesson).values(values).run();
  return Number(r.lastInsertRowid);
}

/** Link a teacher to a lesson (multi-teacher cells insert several). */
export async function insertLessonTeacher(
  lessonId: number,
  teacherId: number,
  db: DbOrTx = defaultDb
): Promise<void> {
  await db.insert(lessonTeacher).values({ lessonId, teacherId }).run();
}
