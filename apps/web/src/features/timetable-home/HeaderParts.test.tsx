import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TimetableButtons, VisitCountLine } from "./HeaderParts.js";

describe("VisitCountLine", () => {
  it("renders the vi-VN formatted count", () => {
    render(<VisitCountLine count={9000} />);
    expect(screen.getByText("Lượt truy cập: 9.000")).toBeInTheDocument();
  });

  it("renders a neutral placeholder when the count is unavailable", () => {
    render(<VisitCountLine count={undefined} />);
    expect(screen.getByText("Lượt truy cập: —")).toBeInTheDocument();
  });
});

describe("TimetableButtons", () => {
  const items = [
    { id: 1, ordinal: 1, effectiveFrom: "2026-09-01" },
    { id: 2, ordinal: 2, effectiveFrom: "2026-09-15" },
  ];

  it("labels each button as TKB {n} - dd/mm/yyyy", () => {
    render(<TimetableButtons items={items} selectedId={1} onSelect={() => {}} />);
    expect(screen.getByText("TKB 1 - 01/09/2026")).toBeInTheDocument();
    expect(screen.getByText("TKB 2 - 15/09/2026")).toBeInTheDocument();
  });

  it("renders the buttons newest-first by effective date", () => {
    // Pass oldest-first to prove the component reorders to newest-first.
    render(<TimetableButtons items={items} selectedId={1} onSelect={() => {}} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons[0]).toHaveTextContent("TKB 2 - 15/09/2026");
    expect(buttons[1]).toHaveTextContent("TKB 1 - 01/09/2026");
  });

  it("marks exactly the selected button as pressed", () => {
    render(<TimetableButtons items={items} selectedId={2} onSelect={() => {}} />);
    const pressed = screen.getAllByRole("button", { pressed: true });
    expect(pressed).toHaveLength(1);
    expect(pressed[0]).toHaveTextContent("TKB 2 - 15/09/2026");
  });

  it("shows an empty-state when there are no items", () => {
    render(<TimetableButtons items={[]} selectedId={null} onSelect={() => {}} />);
    expect(screen.getByText(/chưa có thời khóa biểu/i)).toBeInTheDocument();
  });

  it("calls onSelect with the clicked id", () => {
    const onSelect = vi.fn();
    render(<TimetableButtons items={items} selectedId={1} onSelect={onSelect} />);
    screen.getByText("TKB 2 - 15/09/2026").click();
    expect(onSelect).toHaveBeenCalledWith(2);
  });
});
