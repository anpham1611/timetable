import ExcelJS from "exceljs";
import {
  CLASS_COLUMNS,
  CLASS_SHEET,
  GRADE_COLUMNS,
  GRADE_SHEET,
  LESSON_COLUMNS,
  LESSON_SHEET,
  META_EFFECTIVE_FROM_KEY,
  META_SHEET,
  STUDENT_COLUMNS,
  STUDENT_SHEET,
  TEACHER_COLUMNS,
  TEACHER_SHEET,
} from "./import-format.js";

/**
 * Generates the downloadable Excel import template as a buffer. The workbook's
 * structure is derived entirely from the import format contract, so a filled-in
 * template always matches what {@link parseWorkbook} expects: a `Meta` sheet
 * with the effectiveFrom key, and the five entity sheets (Grade, Class, Teacher,
 * Student, Lesson) whose header rows are exactly their column contracts, each
 * with one illustrative sample row.
 */
export async function buildTemplateWorkbook(): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();

  const meta = wb.addWorksheet(META_SHEET);
  meta.addRow(["key", "value"]);
  meta.addRow([META_EFFECTIVE_FROM_KEY, "2026-09-07"]);

  const grade = wb.addWorksheet(GRADE_SHEET);
  grade.addRow([...GRADE_COLUMNS]);
  grade.addRow(["11", "Khối 11"]);

  const cls = wb.addWorksheet(CLASS_SHEET);
  cls.addRow([...CLASS_COLUMNS]);
  // classCode, className, gradeCode, homeRoom
  cls.addRow(["11A5", "11A5", "11", "P.201"]);

  const teacher = wb.addWorksheet(TEACHER_SHEET);
  teacher.addRow([...TEACHER_COLUMNS]);
  teacher.addRow(["NVA", "Nguyễn Văn A"]);

  const student = wb.addWorksheet(STUDENT_SHEET);
  student.addRow([...STUDENT_COLUMNS]);
  // studentCode, studentName, classCode
  student.addRow(["HS001", "Trần Thị B", "11A5"]);

  const lesson = wb.addWorksheet(LESSON_SHEET);
  lesson.addRow([...LESSON_COLUMNS]);
  // classCode, day, session, periodOrdinal, subjectName, subjectShortCode,
  // teacherCodes, room, choiceGroup
  lesson.addRow(["11A5", 2, "SANG", 1, "Toán", "TOAN", "NVA", "P.201", ""]);

  const out = await wb.xlsx.writeBuffer();
  return Buffer.from(out);
}
