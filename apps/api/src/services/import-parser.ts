import ExcelJS from "exceljs";
import type { ImportError } from "@timetable/shared";
import {
  CLASS_SHEET,
  GRADE_SHEET,
  LESSON_SHEET,
  META_EFFECTIVE_FROM_KEY,
  META_SHEET,
  REQUIRED_CLASS_COLUMNS,
  REQUIRED_GRADE_COLUMNS,
  REQUIRED_LESSON_COLUMNS,
  REQUIRED_SHEETS,
  REQUIRED_STUDENT_COLUMNS,
  REQUIRED_TEACHER_COLUMNS,
  SHEET_HEADERS,
  STUDENT_SHEET,
  TEACHER_DELIMITER,
  TEACHER_SHEET,
  VALID_DAYS,
  VALID_PERIOD_ORDINALS,
  normalizeKey,
  type Session,
} from "./import-format.js";

/** A parsed grade row. */
export interface ParsedGrade {
  code: string;
  name: string;
}
/** A parsed class row referencing its grade by code. */
export interface ParsedClass {
  code: string;
  name: string;
  gradeCode: string;
  homeRoom: string | null;
}
/** A parsed teacher row. */
export interface ParsedTeacher {
  code: string;
  name: string;
}
/** A parsed student row referencing its class by code. */
export interface ParsedStudent {
  code: string;
  name: string;
  classCode: string;
}
/** A parsed lesson row referencing its class/teachers by code. */
export interface ParsedLesson {
  classCode: string;
  day: number;
  session: Session;
  periodOrdinal: number;
  subjectName: string;
  subjectShortCode: string;
  teacherCodes: string[];
  room: string | null;
  choiceGroup: string | null;
}

/** The complete, validated in-memory import plan. */
export interface ImportPlan {
  effectiveFrom: string; // YYYY-MM-DD
  grades: ParsedGrade[];
  classes: ParsedClass[];
  teachers: ParsedTeacher[];
  students: ParsedStudent[];
  lessons: ParsedLesson[];
}

/**
 * A located import error. Carries the structured {@link ImportError} location so
 * the route can return it as the 400 body and the admin can see exactly where
 * the problem is.
 */
export class ImportParseError extends Error {
  readonly detail: ImportError;
  constructor(detail: ImportError) {
    super(`${detail.sheet}${detail.row ? ` row ${detail.row}` : ""}: ${detail.message}`);
    this.name = "ImportParseError";
    this.detail = detail;
  }
}

function fail(detail: ImportError): never {
  throw new ImportParseError(detail);
}

function cellText(value: ExcelJS.CellValue): string {
  if (value == null) return "";
  if (typeof value === "object") {
    const obj = value as unknown as Record<string, unknown>;
    if ("text" in obj && typeof obj.text === "string") return obj.text;
    if ("result" in obj && obj.result != null) return String(obj.result);
    if ("richText" in obj && Array.isArray(obj.richText)) {
      return (obj.richText as { text: string }[]).map((t) => t.text).join("");
    }
  }
  return String(value);
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Reads a sheet's header row and returns a column-name → 1-based index map. */
function headerIndex(ws: ExcelJS.Worksheet): Map<string, number> {
  const headers = (ws.getRow(1).values as unknown[]).map((v) =>
    v == null ? "" : String(v).trim()
  );
  const map = new Map<string, number>();
  headers.forEach((h, i) => {
    if (h) map.set(h, i); // exceljs values are 1-based (index 0 is empty)
  });
  return map;
}

/**
 * Validates that every required sheet exists and each entity sheet's header row
 * contains its contract columns. Fails with a located error on the first gap.
 */
function validateStructure(wb: ExcelJS.Workbook): void {
  for (const sheet of REQUIRED_SHEETS) {
    if (!wb.getWorksheet(sheet)) {
      fail({ sheet, message: `missing required sheet "${sheet}"` });
    }
  }
  for (const [sheet, headers] of Object.entries(SHEET_HEADERS)) {
    const ws = wb.getWorksheet(sheet)!;
    const present = headerIndex(ws);
    for (const col of headers) {
      if (!present.has(col)) {
        fail({ sheet, column: col, message: `missing column "${col}"` });
      }
    }
  }
}

/** Reads the effective date from the Meta sheet, validating its presence/format. */
function parseEffectiveFrom(wb: ExcelJS.Workbook): string {
  const meta = wb.getWorksheet(META_SHEET)!;
  let value: string | null = null;
  meta.eachRow((row) => {
    const key = cellText(row.getCell(1).value).trim();
    if (key === META_EFFECTIVE_FROM_KEY) {
      value = cellText(row.getCell(2).value).trim();
    }
  });
  if (!value) {
    fail({ sheet: META_SHEET, message: `missing "${META_EFFECTIVE_FROM_KEY}"` });
  }
  if (!ISO_DATE.test(value)) {
    fail({
      sheet: META_SHEET,
      message: `${META_EFFECTIVE_FROM_KEY} must be a YYYY-MM-DD date`,
    });
  }
  return value;
}

/**
 * Iterate an entity sheet's data rows (after the header). Wholly empty rows are
 * skipped. `handler(get, rowNumber)` reads a column's trimmed text via `get`.
 */
function eachDataRow(
  ws: ExcelJS.Worksheet,
  columns: readonly string[],
  handler: (get: (col: string) => string, rowNumber: number) => void
): void {
  const idx = headerIndex(ws);
  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const get = (col: string) =>
      cellText(row.getCell(idx.get(col)!).value).trim();
    const anyValue = columns.some((c) => get(c) !== "");
    if (!anyValue) return;
    handler(get, rowNumber);
  });
}

/**
 * Parses an uploaded `.xlsx` buffer into a validated {@link ImportPlan}. Runs
 * structural, field-level, duplicate-key, referential, and slot-uniqueness
 * validation in dependency order, failing fast with a located
 * {@link ImportParseError} on the first problem. Never returns a partial plan.
 */
export async function parseWorkbook(buffer: Buffer): Promise<ImportPlan> {
  const wb = new ExcelJS.Workbook();
  try {
    await wb.xlsx.load(buffer as unknown as ArrayBuffer);
  } catch {
    fail({ sheet: "(workbook)", message: "file is not a readable Excel workbook" });
  }

  validateStructure(wb);
  const effectiveFrom = parseEffectiveFrom(wb);

  // --- Grade ---
  const grades: ParsedGrade[] = [];
  const gradeCodes = new Set<string>();
  eachDataRow(wb.getWorksheet(GRADE_SHEET)!, SHEET_HEADERS[GRADE_SHEET]!, (get, row) => {
    for (const col of REQUIRED_GRADE_COLUMNS) {
      if (get(col) === "") fail({ sheet: GRADE_SHEET, row, column: col, message: `missing "${col}"` });
    }
    const code = get("gradeCode");
    const key = normalizeKey(code);
    if (gradeCodes.has(key)) {
      fail({ sheet: GRADE_SHEET, row, column: "gradeCode", message: `duplicate gradeCode "${code}"` });
    }
    gradeCodes.add(key);
    grades.push({ code, name: get("gradeName") });
  });

  // --- Class ---
  const classes: ParsedClass[] = [];
  const classCodes = new Set<string>();
  eachDataRow(wb.getWorksheet(CLASS_SHEET)!, SHEET_HEADERS[CLASS_SHEET]!, (get, row) => {
    for (const col of REQUIRED_CLASS_COLUMNS) {
      if (get(col) === "") fail({ sheet: CLASS_SHEET, row, column: col, message: `missing "${col}"` });
    }
    const code = get("classCode");
    const key = normalizeKey(code);
    if (classCodes.has(key)) {
      fail({ sheet: CLASS_SHEET, row, column: "classCode", message: `duplicate classCode "${code}"` });
    }
    const gradeCode = get("gradeCode");
    if (!gradeCodes.has(normalizeKey(gradeCode))) {
      fail({ sheet: CLASS_SHEET, row, column: "gradeCode", message: `gradeCode "${gradeCode}" not found in Grade sheet` });
    }
    classCodes.add(key);
    const homeRoom = get("homeRoom");
    classes.push({ code, name: get("className"), gradeCode, homeRoom: homeRoom === "" ? null : homeRoom });
  });

  // --- Teacher ---
  const teachers: ParsedTeacher[] = [];
  const teacherCodes = new Set<string>();
  eachDataRow(wb.getWorksheet(TEACHER_SHEET)!, SHEET_HEADERS[TEACHER_SHEET]!, (get, row) => {
    for (const col of REQUIRED_TEACHER_COLUMNS) {
      if (get(col) === "") fail({ sheet: TEACHER_SHEET, row, column: col, message: `missing "${col}"` });
    }
    const code = get("teacherCode");
    const key = normalizeKey(code);
    if (teacherCodes.has(key)) {
      fail({ sheet: TEACHER_SHEET, row, column: "teacherCode", message: `duplicate teacherCode "${code}"` });
    }
    teacherCodes.add(key);
    teachers.push({ code, name: get("teacherName") });
  });

  // --- Student ---
  const students: ParsedStudent[] = [];
  const studentCodes = new Set<string>();
  eachDataRow(wb.getWorksheet(STUDENT_SHEET)!, SHEET_HEADERS[STUDENT_SHEET]!, (get, row) => {
    for (const col of REQUIRED_STUDENT_COLUMNS) {
      if (get(col) === "") fail({ sheet: STUDENT_SHEET, row, column: col, message: `missing "${col}"` });
    }
    const code = get("studentCode");
    const key = normalizeKey(code);
    if (studentCodes.has(key)) {
      fail({ sheet: STUDENT_SHEET, row, column: "studentCode", message: `duplicate studentCode "${code}"` });
    }
    const classCode = get("classCode");
    if (!classCodes.has(normalizeKey(classCode))) {
      fail({ sheet: STUDENT_SHEET, row, column: "classCode", message: `classCode "${classCode}" not found in Class sheet` });
    }
    studentCodes.add(key);
    students.push({ code, name: get("studentName"), classCode });
  });

  // --- Lesson ---
  const lessons: ParsedLesson[] = [];
  // Track occupied non-elective slots: classKey|day|session|ordinal.
  const occupiedSlots = new Set<string>();
  eachDataRow(wb.getWorksheet(LESSON_SHEET)!, SHEET_HEADERS[LESSON_SHEET]!, (get, row) => {
    for (const col of REQUIRED_LESSON_COLUMNS) {
      if (get(col) === "") fail({ sheet: LESSON_SHEET, row, column: col, message: `missing "${col}"` });
    }
    const classCode = get("classCode");
    if (!classCodes.has(normalizeKey(classCode))) {
      fail({ sheet: LESSON_SHEET, row, column: "classCode", message: `classCode "${classCode}" not found in Class sheet` });
    }

    const day = Number(get("day"));
    if (!VALID_DAYS.includes(day as (typeof VALID_DAYS)[number])) {
      fail({ sheet: LESSON_SHEET, row, column: "day", message: `day must be one of ${VALID_DAYS.join(", ")}` });
    }
    const session = get("session").toUpperCase();
    if (session !== "SANG" && session !== "CHIEU") {
      fail({ sheet: LESSON_SHEET, row, column: "session", message: "session must be SANG or CHIEU" });
    }
    const periodOrdinal = Number(get("periodOrdinal"));
    if (!VALID_PERIOD_ORDINALS.includes(periodOrdinal as (typeof VALID_PERIOD_ORDINALS)[number])) {
      fail({ sheet: LESSON_SHEET, row, column: "periodOrdinal", message: `periodOrdinal must be one of ${VALID_PERIOD_ORDINALS.join(", ")}` });
    }

    const teacherCodesRaw = get("teacherCodes")
      .split(TEACHER_DELIMITER)
      .map((x) => x.trim())
      .filter((x) => x !== "");
    for (const tc of teacherCodesRaw) {
      if (!teacherCodes.has(normalizeKey(tc))) {
        fail({ sheet: LESSON_SHEET, row, column: "teacherCodes", message: `teacherCode "${tc}" not found in Teacher sheet` });
      }
    }

    const choiceGroup = get("choiceGroup");
    const isElective = choiceGroup !== "";
    const slotKey = `${normalizeKey(classCode)}|${day}|${session}|${periodOrdinal}`;
    if (!isElective) {
      if (occupiedSlots.has(slotKey)) {
        fail({ sheet: LESSON_SHEET, row, column: "classCode", message: `duplicate lesson for slot (${classCode}, day ${day}, ${session}, period ${periodOrdinal}) — use a choiceGroup for electives` });
      }
      occupiedSlots.add(slotKey);
    }

    const room = get("room");
    lessons.push({
      classCode,
      day,
      session: session as Session,
      periodOrdinal,
      subjectName: get("subjectName"),
      subjectShortCode: get("subjectShortCode"),
      teacherCodes: teacherCodesRaw,
      room: room === "" ? null : room,
      choiceGroup: isElective ? choiceGroup : null,
    });
  });

  if (lessons.length === 0) {
    fail({ sheet: LESSON_SHEET, message: "Lesson sheet has no data rows" });
  }

  return { effectiveFrom, grades, classes, teachers, students, lessons };
}
