import { describe, expect, it } from "vitest";
import {
  classListResponseSchema,
  studentSearchResponseSchema,
  teacherSearchResponseSchema,
  searchQuerySchema,
} from "./directory.js";

describe("classListResponseSchema", () => {
  it("accepts a valid class list with grades", () => {
    const res = {
      items: [
        { id: 1, name: "11A", grade: { id: 1, name: "11" } },
        { id: 2, name: "12A", grade: { id: 2, name: "12" } },
      ],
    };
    expect(classListResponseSchema.parse(res)).toEqual(res);
  });

  it("accepts an empty class list", () => {
    expect(classListResponseSchema.parse({ items: [] })).toEqual({ items: [] });
  });

  it("rejects a class missing its grade", () => {
    expect(() =>
      classListResponseSchema.parse({ items: [{ id: 1, name: "11A" }] })
    ).toThrow();
  });
});

describe("studentSearchResponseSchema", () => {
  it("accepts students with their class", () => {
    const res = {
      items: [{ id: 1, name: "Nguyen Van A", class: { id: 1, name: "11A" } }],
    };
    expect(studentSearchResponseSchema.parse(res)).toEqual(res);
  });

  it("accepts an empty result", () => {
    expect(studentSearchResponseSchema.parse({ items: [] })).toEqual({
      items: [],
    });
  });
});

describe("teacherSearchResponseSchema", () => {
  it("accepts teachers by identity only", () => {
    const res = { items: [{ id: 1, name: "Tran Thi B" }] };
    expect(teacherSearchResponseSchema.parse(res)).toEqual(res);
  });

  it("accepts an empty result", () => {
    expect(teacherSearchResponseSchema.parse({ items: [] })).toEqual({
      items: [],
    });
  });
});

describe("searchQuerySchema", () => {
  it("accepts a non-empty query", () => {
    expect(searchQuerySchema.parse("abc")).toBe("abc");
  });

  it("trims surrounding whitespace", () => {
    expect(searchQuerySchema.parse("  abc  ")).toBe("abc");
  });

  it("rejects an empty query", () => {
    expect(() => searchQuerySchema.parse("")).toThrow();
  });

  it("rejects a whitespace-only query", () => {
    expect(() => searchQuerySchema.parse("   ")).toThrow();
  });
});
