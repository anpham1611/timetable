import { describe, expect, it } from "vitest";
import {
  formatEffectiveDate,
  formatVisitCount,
  timetableLabel,
} from "./format.js";

describe("formatVisitCount", () => {
  it("formats with vi-VN dot thousands separators", () => {
    expect(formatVisitCount(9000)).toBe("9.000");
    expect(formatVisitCount(1234567)).toBe("1.234.567");
  });

  it("formats zero", () => {
    expect(formatVisitCount(0)).toBe("0");
  });

  it("returns a neutral placeholder when unavailable", () => {
    expect(formatVisitCount(undefined)).toBe("—");
  });
});

describe("formatEffectiveDate", () => {
  it("formats an ISO date as dd/mm/yyyy", () => {
    expect(formatEffectiveDate("2026-09-01")).toBe("01/09/2026");
    expect(formatEffectiveDate("2026-09-15")).toBe("15/09/2026");
  });
});

describe("timetableLabel", () => {
  it("builds the TKB label", () => {
    expect(timetableLabel(1, "2026-09-01")).toBe("TKB 1 - 01/09/2026");
  });
});
