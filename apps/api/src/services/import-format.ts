/**
 * The Excel import format contract — the single source of truth shared by the
 * template generator and the workbook parser, so the two cannot drift.
 *
 * The workbook is normalized across six sheets. Each entity is declared once
 * with an explicit business code; later sheets reference those codes:
 *   - Meta:    key/value, carries the TKB effective date.
 *   - Grade:   gradeCode, gradeName
 *   - Class:   classCode, className, gradeCode (→Grade), homeRoom?
 *   - Teacher: teacherCode, teacherName
 *   - Student: studentCode, studentName, classCode (→Class)
 *   - Lesson:  classCode (→Class), day, session, periodOrdinal, subjectName,
 *              subjectShortCode, teacherCodes? (→Teacher, comma-separated),
 *              room?, choiceGroup?
 *
 * Business keys are matched after {@link normalizeKey} so trailing spaces and
 * case differences do not create duplicate rows.
 */

export const META_SHEET = "Meta";
export const GRADE_SHEET = "Grade";
export const CLASS_SHEET = "Class";
export const TEACHER_SHEET = "Teacher";
export const STUDENT_SHEET = "Student";
export const LESSON_SHEET = "Lesson";

/** All required sheets, in dependency order (parents before children). */
export const REQUIRED_SHEETS = [
  META_SHEET,
  GRADE_SHEET,
  CLASS_SHEET,
  TEACHER_SHEET,
  STUDENT_SHEET,
  LESSON_SHEET,
] as const;

/** Key used in the Meta sheet for the TKB effective date (YYYY-MM-DD). */
export const META_EFFECTIVE_FROM_KEY = "effectiveFrom";

export const GRADE_COLUMNS = ["gradeCode", "gradeName"] as const;
export const CLASS_COLUMNS = [
  "classCode",
  "className",
  "gradeCode",
  "homeRoom",
] as const;
export const TEACHER_COLUMNS = ["teacherCode", "teacherName"] as const;
export const STUDENT_COLUMNS = [
  "studentCode",
  "studentName",
  "classCode",
] as const;
export const LESSON_COLUMNS = [
  "classCode",
  "day",
  "session",
  "periodOrdinal",
  "subjectName",
  "subjectShortCode",
  "teacherCodes",
  "room",
  "choiceGroup",
] as const;

export type GradeColumn = (typeof GRADE_COLUMNS)[number];
export type ClassColumn = (typeof CLASS_COLUMNS)[number];
export type TeacherColumn = (typeof TEACHER_COLUMNS)[number];
export type StudentColumn = (typeof STUDENT_COLUMNS)[number];
export type LessonColumn = (typeof LESSON_COLUMNS)[number];

/** Required (non-empty) columns per sheet. Optional ones are omitted. */
export const REQUIRED_GRADE_COLUMNS: readonly GradeColumn[] = [
  "gradeCode",
  "gradeName",
];
export const REQUIRED_CLASS_COLUMNS: readonly ClassColumn[] = [
  "classCode",
  "className",
  "gradeCode",
];
export const REQUIRED_TEACHER_COLUMNS: readonly TeacherColumn[] = [
  "teacherCode",
  "teacherName",
];
export const REQUIRED_STUDENT_COLUMNS: readonly StudentColumn[] = [
  "studentCode",
  "studentName",
  "classCode",
];
export const REQUIRED_LESSON_COLUMNS: readonly LessonColumn[] = [
  "classCode",
  "day",
  "session",
  "periodOrdinal",
  "subjectName",
  "subjectShortCode",
];

/** The header row expected for each entity sheet. */
export const SHEET_HEADERS: Record<string, readonly string[]> = {
  [GRADE_SHEET]: GRADE_COLUMNS,
  [CLASS_SHEET]: CLASS_COLUMNS,
  [TEACHER_SHEET]: TEACHER_COLUMNS,
  [STUDENT_SHEET]: STUDENT_COLUMNS,
  [LESSON_SHEET]: LESSON_COLUMNS,
};

/** Separator for multiple teacher codes within one Lesson cell. */
export const TEACHER_DELIMITER = ",";

/** Accepted session values. */
export const SESSIONS = ["SANG", "CHIEU"] as const;
export type Session = (typeof SESSIONS)[number];

/** Valid teaching days (Thứ 2..Thứ 7 → 2..7). */
export const VALID_DAYS = [2, 3, 4, 5, 6, 7] as const;

/** Valid period ordinals within a session. */
export const VALID_PERIOD_ORDINALS = [1, 2, 3, 4, 5] as const;

/**
 * Normalizes a business key for matching: trims surrounding whitespace,
 * collapses internal runs of whitespace to a single space, and uppercases.
 * Returns an empty string for nullish input.
 */
export function normalizeKey(value: string | null | undefined): string {
  if (value == null) return "";
  return value.trim().replace(/\s+/g, " ").toUpperCase();
}
