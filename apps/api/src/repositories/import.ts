import { and, eq, sql } from "drizzle-orm";
import { db as defaultDb, type Db } from "../db/index.js";
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
export function createTimetable(
  effectiveFrom: Date,
  db: Db = defaultDb
): number {
  const max = db
    .select({ max: sql<number>`coalesce(max(${timetable.ordinal}), 0)` })
    .from(timetable)
    .get();
  const nextOrdinal = (max?.max ?? 0) + 1;
  const inserted = db
    .insert(timetable)
    .values({ ordinal: nextOrdinal, effectiveFrom, isActive: 0 })
    .run();
  return Number(inserted.lastInsertRowid);
}

export function insertGrade(
  timetableId: number,
  name: string,
  db: Db = defaultDb
): number {
  return Number(
    db.insert(grade).values({ timetableId, name: name.trim() }).run().lastInsertRowid
  );
}

export function insertRoom(
  timetableId: number,
  name: string,
  db: Db = defaultDb
): number {
  return Number(
    db.insert(room).values({ timetableId, name: name.trim() }).run().lastInsertRowid
  );
}

export function insertClass(
  timetableId: number,
  name: string,
  gradeId: number,
  homeRoomId: number | null,
  db: Db = defaultDb
): number {
  return Number(
    db
      .insert(schoolClass)
      .values({ timetableId, name: name.trim(), gradeId, homeRoomId })
      .run().lastInsertRowid
  );
}

export function insertStudent(
  timetableId: number,
  name: string,
  classId: number,
  db: Db = defaultDb
): number {
  return Number(
    db
      .insert(student)
      .values({ timetableId, name: name.trim(), classId })
      .run().lastInsertRowid
  );
}

export function insertTeacher(
  timetableId: number,
  name: string,
  shortCode: string,
  db: Db = defaultDb
): number {
  return Number(
    db
      .insert(teacher)
      .values({ timetableId, name: name.trim(), shortCode: shortCode.trim() })
      .run().lastInsertRowid
  );
}

export function insertSubject(
  timetableId: number,
  name: string,
  shortCode: string,
  db: Db = defaultDb
): number {
  return Number(
    db
      .insert(subject)
      .values({ timetableId, name: name.trim(), shortCode: shortCode.trim() })
      .run().lastInsertRowid
  );
}

/**
 * Resolve-or-create the canonical (session, ordinal) period row. Periods are the
 * ten fixed grid slots shared across all timetables (not a per-TKB snapshot), so
 * this one entity is reused rather than re-inserted.
 */
export function ensurePeriod(
  session: string,
  ordinal: number,
  db: Db = defaultDb
): number {
  const existing = db
    .select({ id: period.id })
    .from(period)
    .where(and(eq(period.session, session), eq(period.ordinal, ordinal)))
    .get();
  if (existing) return existing.id;
  return Number(
    db.insert(period).values({ session, ordinal }).run().lastInsertRowid
  );
}

/** Insert one lesson row and return its id. */
export function insertLesson(
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
  db: Db = defaultDb
): number {
  return Number(db.insert(lesson).values(values).run().lastInsertRowid);
}

/** Link a teacher to a lesson (multi-teacher cells insert several). */
export function insertLessonTeacher(
  lessonId: number,
  teacherId: number,
  db: Db = defaultDb
): void {
  db.insert(lessonTeacher).values({ lessonId, teacherId }).run();
}
