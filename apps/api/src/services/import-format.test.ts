import { describe, expect, it } from "vitest";
import {
  REQUIRED_SHEETS,
  SHEET_HEADERS,
  GRADE_SHEET,
  CLASS_SHEET,
  TEACHER_SHEET,
  STUDENT_SHEET,
  LESSON_SHEET,
  LESSON_COLUMNS,
  REQUIRED_LESSON_COLUMNS,
  normalizeKey,
} from "./import-format.js";

describe("import format contract", () => {
  it("declares the six required sheets in dependency order", () => {
    expect(REQUIRED_SHEETS).toEqual([
      "Meta",
      "Grade",
      "Class",
      "Teacher",
      "Student",
      "Lesson",
    ]);
  });

  it("defines a stable, non-empty header row for every entity sheet", () => {
    for (const sheet of [
      GRADE_SHEET,
      CLASS_SHEET,
      TEACHER_SHEET,
      STUDENT_SHEET,
      LESSON_SHEET,
    ]) {
      const headers = SHEET_HEADERS[sheet];
      expect(headers).toBeDefined();
      expect(headers!.length).toBeGreaterThan(0);
    }
  });

  it("pins the Lesson columns", () => {
    expect(LESSON_COLUMNS).toEqual([
      "classCode",
      "day",
      "session",
      "periodOrdinal",
      "subjectName",
      "subjectShortCode",
      "teacherCodes",
      "room",
      "choiceGroup",
    ]);
  });

  it("marks required Lesson columns as a subset of all Lesson columns", () => {
    for (const col of REQUIRED_LESSON_COLUMNS) {
      expect(LESSON_COLUMNS).toContain(col);
    }
  });
});

describe("normalizeKey", () => {
  it("trims, collapses whitespace, and uppercases", () => {
    expect(normalizeKey("  11A5  ")).toBe("11A5");
    expect(normalizeKey("Cao  Hoàng   Vĩ")).toBe("CAO HOÀNG VĨ");
  });

  it("returns empty string for nullish input", () => {
    expect(normalizeKey(null)).toBe("");
    expect(normalizeKey(undefined)).toBe("");
  });
});
