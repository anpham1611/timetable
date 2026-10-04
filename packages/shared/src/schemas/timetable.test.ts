import { describe, expect, it } from "vitest";
import {
  activeTimetableSchema,
  activeTimetablesResponseSchema,
} from "./timetable.js";

describe("activeTimetableSchema", () => {
  it("accepts a valid timetable item", () => {
    const item = { id: 1, ordinal: 1, effectiveFrom: "2026-09-01" };
    expect(activeTimetableSchema.parse(item)).toEqual(item);
  });

  it("rejects a missing effectiveFrom", () => {
    expect(() =>
      activeTimetableSchema.parse({ id: 1, ordinal: 1 })
    ).toThrow();
  });

  it("rejects a malformed effectiveFrom", () => {
    expect(() =>
      activeTimetableSchema.parse({ id: 1, ordinal: 1, effectiveFrom: "01/09/2026" })
    ).toThrow();
  });
});

describe("activeTimetablesResponseSchema", () => {
  it("accepts a valid list with a default selection", () => {
    const res = {
      items: [
        { id: 1, ordinal: 1, effectiveFrom: "2026-09-01" },
        { id: 2, ordinal: 2, effectiveFrom: "2026-09-15" },
      ],
      defaultSelectedId: 1,
    };
    expect(activeTimetablesResponseSchema.parse(res)).toEqual(res);
  });

  it("accepts an empty list with a null default", () => {
    const res = { items: [], defaultSelectedId: null };
    expect(activeTimetablesResponseSchema.parse(res)).toEqual(res);
  });
});
