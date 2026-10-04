import { describe, expect, it } from "vitest";
import {
  adminTimetableListResponseSchema,
  toggleTimetableRequestSchema,
  importResultSchema,
  importErrorSchema,
  importErrorResponseSchema,
} from "./admin-timetable.js";

describe("adminTimetableListResponseSchema", () => {
  it("accepts a valid list with active and inactive TKBs", () => {
    const res = {
      items: [
        {
          id: 1,
          ordinal: 1,
          effectiveFrom: "2026-09-07",
          isActive: true,
          createdAt: "2026-09-01T00:00:00.000Z",
        },
        {
          id: 2,
          ordinal: 2,
          effectiveFrom: "2026-09-14",
          isActive: false,
          createdAt: "2026-09-02T00:00:00.000Z",
        },
      ],
    };
    expect(adminTimetableListResponseSchema.parse(res)).toEqual(res);
  });

  it("accepts an empty list", () => {
    expect(adminTimetableListResponseSchema.parse({ items: [] })).toEqual({
      items: [],
    });
  });

  it("rejects an item missing isActive", () => {
    expect(() =>
      adminTimetableListResponseSchema.parse({
        items: [
          {
            id: 1,
            ordinal: 1,
            effectiveFrom: "2026-09-07",
            createdAt: "2026-09-01T00:00:00.000Z",
          },
        ],
      })
    ).toThrow();
  });

  it("rejects a malformed effectiveFrom", () => {
    expect(() =>
      adminTimetableListResponseSchema.parse({
        items: [
          {
            id: 1,
            ordinal: 1,
            effectiveFrom: "07/09/2026",
            isActive: true,
            createdAt: "2026-09-01T00:00:00.000Z",
          },
        ],
      })
    ).toThrow();
  });
});

describe("toggleTimetableRequestSchema", () => {
  it("accepts a boolean isActive", () => {
    expect(toggleTimetableRequestSchema.parse({ isActive: false })).toEqual({
      isActive: false,
    });
  });

  it("rejects a non-boolean isActive", () => {
    expect(() =>
      toggleTimetableRequestSchema.parse({ isActive: "yes" })
    ).toThrow();
  });

  it("rejects a missing isActive", () => {
    expect(() => toggleTimetableRequestSchema.parse({})).toThrow();
  });
});

describe("importResultSchema", () => {
  it("accepts a valid result summary", () => {
    const res = {
      timetableId: 3,
      lessonsCreated: 120,
      gradesCreated: 3,
      classesCreated: 4,
      subjectsCreated: 10,
      teachersCreated: 8,
      roomsCreated: 2,
      studentsCreated: 0,
    };
    expect(importResultSchema.parse(res)).toEqual(res);
  });

  it("rejects negative counts", () => {
    expect(() =>
      importResultSchema.parse({
        timetableId: 3,
        lessonsCreated: -1,
        gradesCreated: 0,
        classesCreated: 0,
        subjectsCreated: 0,
        teachersCreated: 0,
        roomsCreated: 0,
        studentsCreated: 0,
      })
    ).toThrow();
  });
});

describe("importErrorSchema", () => {
  it("accepts a full located error", () => {
    const err = {
      sheet: "Lesson",
      row: 14,
      column: "teacherCodes",
      message: "teacherCode 'NVA' not found in Teacher sheet",
    };
    expect(importErrorSchema.parse(err)).toEqual(err);
  });

  it("accepts a sheet-level error without row/column", () => {
    const err = { sheet: "Grade", message: "missing required sheet" };
    expect(importErrorSchema.parse(err)).toEqual(err);
  });

  it("rejects a non-positive row", () => {
    expect(() =>
      importErrorSchema.parse({ sheet: "Lesson", row: 0, message: "x" })
    ).toThrow();
  });

  it("rejects an empty message", () => {
    expect(() =>
      importErrorSchema.parse({ sheet: "Lesson", message: "" })
    ).toThrow();
  });

  it("wraps in a response body", () => {
    const body = {
      error: { sheet: "Meta", message: "missing effectiveFrom" },
    };
    expect(importErrorResponseSchema.parse(body)).toEqual(body);
  });
});
