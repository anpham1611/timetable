import { importResultSchema, type ImportResult } from "@timetable/shared";
import { db as defaultDb, type Db } from "../db/index.js";
import { normalizeKey } from "./import-format.js";
import {
  createTimetable,
  ensurePeriod,
  insertClass,
  insertGrade,
  insertLesson,
  insertLessonTeacher,
  insertRoom,
  insertStudent,
  insertSubject,
  insertTeacher,
} from "../repositories/import.js";
import { parseWorkbook, type ImportPlan } from "./import-parser.js";

/**
 * Imports an Excel workbook buffer as a brand-new published timetable (TKB).
 *
 * The workbook is fully parsed and validated (fail-fast, located errors) before
 * any write. All persistence then runs inside a single transaction, so any
 * failure rolls back to zero new rows (all-or-nothing). Every inserted row —
 * directory and lessons — is tagged with the new TKB, producing a self-contained
 * snapshot; nothing from other timetables is reused, updated, or deleted. The
 * new TKB is inactive and takes the next ordinal. Returns a validated
 * {@link ImportResult}. Throws {@link ImportParseError} on an invalid workbook
 * without touching the database.
 */
export async function importTimetable(
  buffer: Buffer,
  db: Db = defaultDb
): Promise<ImportResult> {
  const plan: ImportPlan = await parseWorkbook(buffer);

  const result = db.transaction((tx) => {
    const timetableId = createTimetable(new Date(plan.effectiveFrom), tx);

    // Directory snapshot: insert each declared entity once, keyed by business
    // code (normalized) so lessons/students can resolve references to the row id.
    const gradeIdByCode = new Map<string, number>();
    for (const g of plan.grades) {
      gradeIdByCode.set(normalizeKey(g.code), insertGrade(timetableId, g.name, tx));
    }

    // Rooms are declared implicitly by class home rooms and lesson rooms; create
    // each distinct room name once within this TKB.
    const roomIdByKey = new Map<string, number>();
    const ensureRoomId = (name: string): number => {
      const key = normalizeKey(name);
      const existing = roomIdByKey.get(key);
      if (existing !== undefined) return existing;
      const id = insertRoom(timetableId, name, tx);
      roomIdByKey.set(key, id);
      return id;
    };

    const classIdByCode = new Map<string, number>();
    for (const c of plan.classes) {
      const gradeId = gradeIdByCode.get(normalizeKey(c.gradeCode))!;
      const homeRoomId = c.homeRoom === null ? null : ensureRoomId(c.homeRoom);
      classIdByCode.set(
        normalizeKey(c.code),
        insertClass(timetableId, c.name, gradeId, homeRoomId, tx)
      );
    }

    let studentsCreated = 0;
    for (const s of plan.students) {
      const classId = classIdByCode.get(normalizeKey(s.classCode))!;
      insertStudent(timetableId, s.name, classId, tx);
      studentsCreated += 1;
    }

    const teacherIdByCode = new Map<string, number>();
    for (const t of plan.teachers) {
      teacherIdByCode.set(
        normalizeKey(t.code),
        insertTeacher(timetableId, t.name, t.code, tx)
      );
    }

    // Subjects are declared on lessons (name + short code); create each distinct
    // short code once within this TKB.
    const subjectIdByCode = new Map<string, number>();
    const ensureSubjectId = (name: string, shortCode: string): number => {
      const key = normalizeKey(shortCode);
      const existing = subjectIdByCode.get(key);
      if (existing !== undefined) return existing;
      const id = insertSubject(timetableId, name, shortCode, tx);
      subjectIdByCode.set(key, id);
      return id;
    };

    let lessonsCreated = 0;
    for (const l of plan.lessons) {
      const classId = classIdByCode.get(normalizeKey(l.classCode))!;
      const subjectId = ensureSubjectId(l.subjectName, l.subjectShortCode);
      const periodId = ensurePeriod(l.session, l.periodOrdinal, tx);
      const roomId = l.room === null ? null : ensureRoomId(l.room);
      const lessonId = insertLesson(
        {
          timetableId,
          classId,
          periodId,
          day: l.day,
          subjectId,
          roomId,
          category: null,
          choiceGroup: l.choiceGroup,
        },
        tx
      );
      lessonsCreated += 1;
      for (const code of l.teacherCodes) {
        insertLessonTeacher(lessonId, teacherIdByCode.get(normalizeKey(code))!, tx);
      }
    }

    return {
      timetableId,
      lessonsCreated,
      gradesCreated: gradeIdByCode.size,
      classesCreated: classIdByCode.size,
      subjectsCreated: subjectIdByCode.size,
      teachersCreated: teacherIdByCode.size,
      roomsCreated: roomIdByKey.size,
      studentsCreated,
    };
  });

  return importResultSchema.parse(result);
}
