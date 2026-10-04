import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import {
  META_EFFECTIVE_FROM_KEY,
  META_SHEET,
  REQUIRED_SHEETS,
  SHEET_HEADERS,
} from "./import-format.js";
import { buildTemplateWorkbook } from "./import-template.js";

describe("buildTemplateWorkbook", () => {
  it("produces a workbook whose sheets and headers match the format contract", async () => {
    const buffer = await buildTemplateWorkbook();
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer as unknown as ArrayBuffer);

    // All required sheets exist.
    for (const sheet of REQUIRED_SHEETS) {
      expect(wb.getWorksheet(sheet)).toBeDefined();
    }

    // Each entity sheet's header row equals its column contract exactly.
    for (const [sheet, headers] of Object.entries(SHEET_HEADERS)) {
      const ws = wb.getWorksheet(sheet)!;
      const actual = (ws.getRow(1).values as unknown[])
        .slice(1)
        .map((v) => String(v));
      expect(actual).toEqual([...headers]);
    }

    // Meta carries the effectiveFrom key.
    const meta = wb.getWorksheet(META_SHEET)!;
    const metaKeys = meta
      .getColumn(1)
      .values.slice(1)
      .map((v) => String(v));
    expect(metaKeys).toContain(META_EFFECTIVE_FROM_KEY);
  });
});
