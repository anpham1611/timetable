import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
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
import { ImportParseError, parseWorkbook } from "./import-parser.js";

type Row = (string | number)[];

interface Sheets {
  effectiveFrom?: string | null;
  grades?: Row[];
  classes?: Row[];
  teachers?: Row[];
  students?: Row[];
  lessons?: Row[];
  omitSheet?: string;
  lessonHeader?: string[];
}

/** A complete, valid workbook; override any sheet via opts. */
async function makeWorkbook(opts: Sheets = {}): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();

  if (opts.omitSheet !== META_SHEET) {
    const meta = wb.addWorksheet(META_SHEET);
    meta.addRow(["key", "value"]);
    const ef = opts.effectiveFrom === undefined ? "2026-09-07" : opts.effectiveFrom;
    if (ef !== null) meta.addRow([META_EFFECTIVE_FROM_KEY, ef]);
  }
  if (opts.omitSheet !== GRADE_SHEET) {
    const g = wb.addWorksheet(GRADE_SHEET);
    g.addRow([...GRADE_COLUMNS]);
    for (const r of opts.grades ?? [["11", "Khối 11"]]) g.addRow(r);
  }
  if (opts.omitSheet !== CLASS_SHEET) {
    const c = wb.addWorksheet(CLASS_SHEET);
    c.addRow([...CLASS_COLUMNS]);
    for (const r of opts.classes ?? [["11A5", "11A5", "11", "P.201"]]) c.addRow(r);
  }
  if (opts.omitSheet !== TEACHER_SHEET) {
    const t = wb.addWorksheet(TEACHER_SHEET);
    t.addRow([...TEACHER_COLUMNS]);
    for (const r of opts.teachers ?? [["NVA", "Nguyễn Văn A"], ["NVB", "Nguyễn Văn B"]]) t.addRow(r);
  }
  if (opts.omitSheet !== STUDENT_SHEET) {
    const s = wb.addWorksheet(STUDENT_SHEET);
    s.addRow([...STUDENT_COLUMNS]);
    for (const r of opts.students ?? [["HS1", "Trần Thị B", "11A5"]]) s.addRow(r);
  }
  if (opts.omitSheet !== LESSON_SHEET) {
    const l = wb.addWorksheet(LESSON_SHEET);
    l.addRow(opts.lessonHeader ?? [...LESSON_COLUMNS]);
    for (const r of opts.lessons ?? [["11A5", 2, "SANG", 1, "Toán", "TOAN", "NVA,NVB", "P.202", ""]])
      l.addRow(r);
  }

  return Buffer.from(await wb.xlsx.writeBuffer());
}

async function expectError(
  buf: Promise<Buffer> | Buffer,
  expected: Partial<{ sheet: string; row: number; column: string; match: RegExp }>
) {
  const buffer = await buf;
  try {
    await parseWorkbook(buffer);
    throw new Error("expected parseWorkbook to throw");
  } catch (err) {
    expect(err).toBeInstanceOf(ImportParseError);
    const detail = (err as ImportParseError).detail;
    if (expected.sheet) expect(detail.sheet).toBe(expected.sheet);
    if (expected.row) expect(detail.row).toBe(expected.row);
    if (expected.column) expect(detail.column).toBe(expected.column);
    if (expected.match) expect(detail.message).toMatch(expected.match);
  }
}

describe("parseWorkbook — success", () => {
  it("parses a complete valid workbook into a plan", async () => {
    const plan = await parseWorkbook(await makeWorkbook());
    expect(plan.effectiveFrom).toBe("2026-09-07");
    expect(plan.grades).toHaveLength(1);
    expect(plan.classes[0]!.homeRoom).toBe("P.201");
    expect(plan.teachers).toHaveLength(2);
    expect(plan.students[0]!.classCode).toBe("11A5");
    expect(plan.lessons[0]!.teacherCodes).toEqual(["NVA", "NVB"]);
    expect(plan.lessons[0]!.room).toBe("P.202");
    expect(plan.lessons[0]!.choiceGroup).toBeNull();
  });
});

describe("parseWorkbook — structural errors", () => {
  it("rejects a non-workbook buffer", async () => {
    await expectError(Buffer.from("not xlsx"), { match: /readable Excel workbook/ });
  });

  it("rejects a missing sheet, naming it", async () => {
    await expectError(makeWorkbook({ omitSheet: LESSON_SHEET }), {
      sheet: LESSON_SHEET,
      match: /missing required sheet/,
    });
  });

  it("rejects a missing column, naming the sheet and column", async () => {
    const header = [...LESSON_COLUMNS].filter((c) => c !== "subjectShortCode");
    await expectError(makeWorkbook({ lessonHeader: header }), {
      sheet: LESSON_SHEET,
      column: "subjectShortCode",
      match: /missing column/,
    });
  });

  it("rejects a missing effective date", async () => {
    await expectError(makeWorkbook({ effectiveFrom: null }), {
      sheet: META_SHEET,
      match: /effectiveFrom/,
    });
  });
});

describe("parseWorkbook — field errors (located)", () => {
  it("rejects an invalid day with the Lesson row", async () => {
    await expectError(
      makeWorkbook({ lessons: [["11A5", 9, "SANG", 1, "Toán", "TOAN", "NVA", "", ""]] }),
      { sheet: LESSON_SHEET, row: 2, column: "day", match: /day/ }
    );
  });

  it("rejects an invalid session", async () => {
    await expectError(
      makeWorkbook({ lessons: [["11A5", 2, "XX", 1, "Toán", "TOAN", "NVA", "", ""]] }),
      { sheet: LESSON_SHEET, column: "session" }
    );
  });

  it("rejects a missing required field", async () => {
    await expectError(
      makeWorkbook({ lessons: [["", 2, "SANG", 1, "Toán", "TOAN", "NVA", "", ""]] }),
      { sheet: LESSON_SHEET, column: "classCode", match: /missing/ }
    );
  });
});

describe("parseWorkbook — duplicate keys", () => {
  it("rejects a duplicate teacherCode", async () => {
    await expectError(
      makeWorkbook({ teachers: [["NVA", "A"], ["NVA", "B"]] }),
      { sheet: TEACHER_SHEET, row: 3, column: "teacherCode", match: /duplicate/ }
    );
  });
});

describe("parseWorkbook — referential errors", () => {
  it("rejects a class referencing an unknown grade", async () => {
    await expectError(
      makeWorkbook({ classes: [["11A5", "11A5", "ZZ", ""]] }),
      { sheet: CLASS_SHEET, column: "gradeCode", match: /not found in Grade/ }
    );
  });

  it("rejects a student referencing an unknown class", async () => {
    await expectError(
      makeWorkbook({ students: [["HS1", "B", "ZZ"]] }),
      { sheet: STUDENT_SHEET, column: "classCode", match: /not found in Class/ }
    );
  });

  it("rejects a lesson referencing an unknown class", async () => {
    await expectError(
      makeWorkbook({ lessons: [["ZZ", 2, "SANG", 1, "Toán", "TOAN", "NVA", "", ""]] }),
      { sheet: LESSON_SHEET, column: "classCode", match: /not found in Class/ }
    );
  });

  it("rejects a lesson referencing an unknown teacher", async () => {
    await expectError(
      makeWorkbook({ lessons: [["11A5", 2, "SANG", 1, "Toán", "TOAN", "ZZZ", "", ""]] }),
      { sheet: LESSON_SHEET, column: "teacherCodes", match: /not found in Teacher/ }
    );
  });
});

describe("parseWorkbook — slot uniqueness", () => {
  it("rejects two non-elective lessons in the same slot", async () => {
    await expectError(
      makeWorkbook({
        lessons: [
          ["11A5", 2, "SANG", 1, "Toán", "TOAN", "NVA", "", ""],
          ["11A5", 2, "SANG", 1, "Lý", "LY", "NVB", "", ""],
        ],
      }),
      { sheet: LESSON_SHEET, row: 3, match: /duplicate lesson for slot/ }
    );
  });

  it("allows multiple lessons in one slot when each has a choiceGroup", async () => {
    const plan = await parseWorkbook(
      await makeWorkbook({
        lessons: [
          ["11A5", 2, "SANG", 1, "Pháp", "PHAP", "NVA", "", "NN2"],
          ["11A5", 2, "SANG", 1, "Trung", "TRUNG", "NVB", "", "NN2"],
        ],
      })
    );
    expect(plan.lessons).toHaveLength(2);
    expect(plan.lessons.every((l) => l.choiceGroup === "NN2")).toBe(true);
  });
});
