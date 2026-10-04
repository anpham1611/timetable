import { describe, expect, it } from "vitest";
import {
  gridCellSchema,
  gridSlotSchema,
  weekGridSchema,
} from "./grid.js";

describe("gridCellSchema", () => {
  it("fills defaults for an otherwise minimal class cell", () => {
    const cell = gridCellSchema.parse({
      subjectName: "Ngữ văn",
      subjectShortCode: "Ngữ văn",
      teachers: ["Quỳnh.PVN"],
    });
    expect(cell.className).toBeNull();
    expect(cell.room).toBeNull();
    expect(cell.isRoomMove).toBe(false);
    expect(cell.choiceGroup).toBeNull();
    expect(cell.category).toBeNull();
  });

  it("accepts an elective cell with a room move and choice group", () => {
    const cell = gridCellSchema.parse({
      subjectName: "Hóa học",
      subjectShortCode: "Hóa học #6",
      teachers: ["Hương.ĐTL"],
      room: "11A2",
      isRoomMove: true,
      choiceGroup: "Tự chọn (TC3)",
      category: 3,
    });
    expect(cell.isRoomMove).toBe(true);
    expect(cell.choiceGroup).toBe("Tự chọn (TC3)");
    expect(cell.room).toBe("11A2");
  });

  it("accepts a teacher cell carrying the class taught", () => {
    const cell = gridCellSchema.parse({
      subjectName: "Sinh học",
      subjectShortCode: "Chuyên 1",
      className: "11A5",
    });
    expect(cell.className).toBe("11A5");
    expect(cell.teachers).toEqual([]);
  });
});

describe("gridSlotSchema", () => {
  it("accepts an empty slot", () => {
    const slot = gridSlotSchema.parse({ day: 5, periodId: 7, cell: null });
    expect(slot.cell).toBeNull();
  });

  it("rejects a day outside Thứ 2..7", () => {
    expect(() =>
      gridSlotSchema.parse({ day: 8, periodId: 1, cell: null })
    ).toThrow();
  });
});

describe("weekGridSchema", () => {
  it("accepts a well-formed grid", () => {
    const grid = weekGridSchema.parse({
      title: "Lớp 11A5",
      timetableId: 2,
      days: [2, 3, 4, 5, 6, 7],
      periods: [
        { id: 1, session: "SANG", ordinal: 1, startTime: "07g00", endTime: "07g45" },
        { id: 6, session: "CHIEU", ordinal: 1, startTime: null, endTime: null },
      ],
      slots: [
        {
          day: 2,
          periodId: 1,
          cell: { subjectName: "Toán", subjectShortCode: "Toán", teachers: ["Anh.NV"] },
        },
        { day: 2, periodId: 6, cell: null },
      ],
    });
    expect(grid.subtitle).toBeNull();
    expect(grid.slots).toHaveLength(2);
  });
});
