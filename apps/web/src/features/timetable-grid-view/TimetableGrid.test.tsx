import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { WeekGrid } from "@timetable/shared";
import { TimetableGrid, todayThu } from "./TimetableGrid.js";

const basePeriods = [
  { id: 1, session: "SANG" as const, ordinal: 1, startTime: "07g00", endTime: "07g45" },
  { id: 6, session: "CHIEU" as const, ordinal: 1, startTime: null, endTime: null },
];

function makeGrid(partial: Partial<WeekGrid> = {}): WeekGrid {
  return {
    title: "Lớp 11A5",
    subtitle: null,
    timetableId: 2,
    days: [2, 3, 4, 5, 6, 7],
    periods: basePeriods,
    slots: [
      {
        day: 2,
        periodId: 1,
        cell: {
          subjectName: "Toán",
          subjectShortCode: "Toán",
          teachers: ["Anh.NV"],
          className: null,
          room: null,
          isRoomMove: false,
          choiceGroup: null,
          category: null,
        },
      },
      { day: 2, periodId: 6, cell: null },
    ],
    ...partial,
  };
}

describe("todayThu", () => {
  it("maps Monday..Saturday to Thứ 2..7", () => {
    // 2026-10-05 is a Monday.
    expect(todayThu(new Date("2026-10-05T08:00:00"))).toBe(2);
    expect(todayThu(new Date("2026-10-10T08:00:00"))).toBe(7); // Saturday
  });

  it("returns null on Sunday", () => {
    expect(todayThu(new Date("2026-10-11T08:00:00"))).toBeNull(); // Sunday
  });
});

describe("TimetableGrid", () => {
  it("renders the title, day headers, session rows, and period times", () => {
    render(<TimetableGrid grid={makeGrid()} today={null} />);
    expect(screen.getByText("Lớp 11A5")).toBeInTheDocument();
    expect(screen.getByText("Thứ 2")).toBeInTheDocument();
    expect(screen.getByText("Thứ 7")).toBeInTheDocument();
    expect(screen.getByText("SÁNG")).toBeInTheDocument();
    expect(screen.getByText("CHIỀU")).toBeInTheDocument();
    expect(screen.getByText("07g00 - 07g45")).toBeInTheDocument();
  });

  it("renders a class cell with subject and GV: teacher line", () => {
    render(<TimetableGrid grid={makeGrid()} today={null} />);
    expect(screen.getByText("Toán")).toBeInTheDocument();
    expect(screen.getByText("GV: Anh.NV")).toBeInTheDocument();
  });

  it("renders an em dash for an empty slot", () => {
    render(<TimetableGrid grid={makeGrid()} today={null} />);
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("renders a student elective cell with room move, room, and choice group", () => {
    const grid = makeGrid({
      title: "Cao Hoàng Vĩ",
      subtitle: "Lớp 11A5",
      slots: [
        {
          day: 4,
          periodId: 1,
          cell: {
            subjectName: "Hóa học",
            subjectShortCode: "Hóa học #6",
            teachers: ["Hương.ĐTL"],
            className: null,
            room: "11A2",
            isRoomMove: true,
            choiceGroup: "Tự chọn (TC3)",
            category: 3,
          },
        },
      ],
    });
    render(<TimetableGrid grid={grid} today={null} />);
    expect(screen.getByText("Lớp 11A5")).toBeInTheDocument();
    expect(screen.getByText(/Hóa học #6/)).toBeInTheDocument();
    expect(screen.getByText(/Phòng 11A2/)).toBeInTheDocument();
    expect(screen.getByText("Tự chọn (TC3)")).toBeInTheDocument();
  });

  it("renders a teacher cell with the class taught", () => {
    const grid = makeGrid({
      title: "GV. Đặng Thanh Thảo",
      slots: [
        {
          day: 2,
          periodId: 1,
          cell: {
            subjectName: "Sinh học",
            subjectShortCode: "Chuyên 1",
            teachers: [],
            className: "11A5",
            room: null,
            isRoomMove: false,
            choiceGroup: null,
            category: null,
          },
        },
      ],
    });
    render(<TimetableGrid grid={grid} today={null} />);
    expect(screen.getByText("Lớp: 11A5")).toBeInTheDocument();
  });

  it("highlights the today column header", () => {
    render(<TimetableGrid grid={makeGrid()} today={4} />);
    const header = screen.getByText("Thứ 4");
    expect(header.className).toContain("bg-primary/10");
  });
});
