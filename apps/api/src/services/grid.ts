import {
  weekGridSchema,
  type GridCell,
  type GridDay,
  type GridSlot,
  type WeekGrid,
} from "@timetable/shared";
import type { Db } from "../db/index.js";
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
  type LessonRow,
  type PeriodRow,
} from "../repositories/grid.js";
import { computeDefaultSelectedId } from "./timetable.js";

/** The six grid days, Thứ 2..Thứ 7. */
const DAYS: GridDay[] = [2, 3, 4, 5, 6, 7];

/**
 * Resolve the published TKB to render:
 *   - an explicit `requested` id when it exists, else null (caller → 404);
 *   - otherwise the default active TKB (home view's defaultSelectedId), or null
 *     when no active TKB exists.
 */
function resolveTimetableId(
  requested: number | undefined,
  db?: Db
): number | null {
  if (requested !== undefined) {
    const exists = db ? timetableExists(requested, db) : timetableExists(requested);
    return exists ? requested : null;
  }
  const rows = db ? listActiveTimetableRows(db) : listActiveTimetableRows();
  return computeDefaultSelectedId(
    rows.map((r) => ({ id: r.id, ordinal: 0, effectiveFrom: r.effectiveFrom, isActive: 1 }))
  );
}

function periodsPayload(periods: PeriodRow[]) {
  return periods.map((p) => ({
    id: p.id,
    session: p.session === "SANG" ? ("SANG" as const) : ("CHIEU" as const),
    ordinal: p.ordinal,
    startTime: p.startTime,
    endTime: p.endTime,
  }));
}

/**
 * Build the full slot list for the grid from a map of (day, periodId) -> cell.
 * Every (day, period) coordinate is emitted; absent coordinates become empty.
 */
function buildSlots(
  periods: PeriodRow[],
  cellAt: (day: GridDay, periodId: number) => GridCell | null
): GridSlot[] {
  const slots: GridSlot[] = [];
  for (const day of DAYS) {
    for (const p of periods) {
      slots.push({ day, periodId: p.id, cell: cellAt(day, p.id) });
    }
  }
  return slots;
}

function key(day: number, periodId: number): string {
  return `${day}:${periodId}`;
}

/**
 * Resolve the weekly grid for a class within a published TKB. `timetableId`
 * selects the TKB; omit it to use the default active TKB. Returns null when the
 * class does not exist or no timetable can be resolved.
 */
export function resolveClassGrid(
  classId: number,
  timetableId?: number,
  db?: Db
): WeekGrid | null {
  const tkb = resolveTimetableId(timetableId, db);
  if (tkb === null) return null;
  const cls = db ? findClass(classId, tkb, db) : findClass(classId, tkb);
  if (!cls) return null;
  const periods = db ? listPeriods(db) : listPeriods();
  const lessons = db ? lessonsForClass(classId, tkb, db) : lessonsForClass(classId, tkb);
  const teachersByLesson = db
    ? teachersForLessons(lessons.map((l) => l.id), db)
    : teachersForLessons(lessons.map((l) => l.id));

  const byCoord = new Map<string, GridCell>();
  for (const l of lessons) {
    // When a class has an elective slot with several lessons, keep the first
    // encountered; the class view represents the slot without implying one
    // subject for all students.
    const k = key(l.day, l.periodId);
    if (byCoord.has(k)) continue;
    byCoord.set(k, classCell(l, cls.homeRoomId, teachersByLesson.get(l.id) ?? []));
  }

  const grid: WeekGrid = {
    title: `Lớp ${cls.name}`,
    subtitle: null,
    timetableId: tkb,
    days: DAYS,
    periods: periodsPayload(periods),
    slots: buildSlots(periods, (day, pid) => byCoord.get(key(day, pid)) ?? null),
  };
  return weekGridSchema.parse(grid);
}

/**
 * Resolve the weekly grid for a student within a published TKB: the student's
 * class grid, but elective slots resolved to the single lesson the student
 * attends. Returns null when the student does not exist or no timetable resolves.
 */
export function resolveStudentGrid(
  studentId: number,
  timetableId?: number,
  db?: Db
): WeekGrid | null {
  const tkb = resolveTimetableId(timetableId, db);
  if (tkb === null) return null;
  const st = db ? findStudent(studentId, tkb, db) : findStudent(studentId, tkb);
  if (!st) return null;
  const cls = db ? findClass(st.classId, tkb, db) : findClass(st.classId, tkb);
  const homeRoomId = cls?.homeRoomId ?? null;
  const periods = db ? listPeriods(db) : listPeriods();
  const lessons = db ? lessonsForClass(st.classId, tkb, db) : lessonsForClass(st.classId, tkb);
  const enrolled = new Set(
    db ? electiveLessonIdsForStudent(studentId, db) : electiveLessonIdsForStudent(studentId)
  );
  const teachersByLesson = db
    ? teachersForLessons(lessons.map((l) => l.id), db)
    : teachersForLessons(lessons.map((l) => l.id));

  const byCoord = new Map<string, GridCell>();
  for (const l of lessons) {
    const k = key(l.day, l.periodId);
    const isElective = l.choiceGroup !== null;
    if (isElective) {
      // Only show the elective the student actually attends.
      if (!enrolled.has(l.id)) continue;
    } else if (byCoord.has(k)) {
      continue;
    }
    byCoord.set(k, classCell(l, homeRoomId, teachersByLesson.get(l.id) ?? []));
  }

  const grid: WeekGrid = {
    title: st.name,
    subtitle: `Lớp ${st.className}`,
    timetableId: tkb,
    days: DAYS,
    periods: periodsPayload(periods),
    slots: buildSlots(periods, (day, pid) => byCoord.get(key(day, pid)) ?? null),
  };
  return weekGridSchema.parse(grid);
}

/**
 * Resolve the weekly grid for a teacher within a published TKB: only the slots
 * the teacher teaches, each cell showing the subject and the class taught.
 * Returns null when the teacher does not exist or no timetable resolves.
 */
export function resolveTeacherGrid(
  teacherId: number,
  timetableId?: number,
  db?: Db
): WeekGrid | null {
  const tkb = resolveTimetableId(timetableId, db);
  if (tkb === null) return null;
  const tt = db ? findTeacher(teacherId, tkb, db) : findTeacher(teacherId, tkb);
  if (!tt) return null;
  const periods = db ? listPeriods(db) : listPeriods();
  const lessons = db ? lessonsForTeacher(teacherId, tkb, db) : lessonsForTeacher(teacherId, tkb);

  const byCoord = new Map<string, GridCell>();
  for (const l of lessons) {
    const k = key(l.day, l.periodId);
    if (byCoord.has(k)) continue;
    byCoord.set(k, {
      subjectName: l.subjectName,
      subjectShortCode: l.subjectShortCode,
      teachers: [],
      className: l.className,
      room: null,
      isRoomMove: false,
      choiceGroup: l.choiceGroup,
      category: l.category,
    });
  }

  const grid: WeekGrid = {
    title: `GV. ${tt.name}`,
    subtitle: null,
    timetableId: tkb,
    days: DAYS,
    periods: periodsPayload(periods),
    slots: buildSlots(periods, (day, pid) => byCoord.get(key(day, pid)) ?? null),
  };
  return weekGridSchema.parse(grid);
}

/** A class/student cell: subject + teachers, with room-move derived from home room. */
function classCell(l: LessonRow, homeRoomId: number | null, teachers: string[]): GridCell {
  // A room move is only meaningful when the class has a home room to move away
  // from; a class with no home room never flags a move.
  const isRoomMove =
    l.roomId !== null && homeRoomId !== null && l.roomId !== homeRoomId;
  return {
    subjectName: l.subjectName,
    subjectShortCode: l.subjectShortCode,
    teachers,
    className: null,
    room: isRoomMove ? l.roomName : null,
    isRoomMove,
    choiceGroup: l.choiceGroup,
    category: l.category,
  };
}
