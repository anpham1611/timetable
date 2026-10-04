import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { StudentItem } from "@timetable/shared";
import { Providers } from "@/app/Providers";
import { ByStudentTab } from "./ByStudentTab.js";

function mockFetch(body: unknown) {
  return vi.fn(async () => new Response(JSON.stringify(body), { status: 200 }));
}

function renderTab(onSelect: (s: StudentItem) => void = () => {}) {
  return render(
    <Providers>
      <ByStudentTab selectedStudent={null} onSelectStudent={onSelect} />
    </Providers>
  );
}

describe("ByStudentTab", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("suggests matching students (with class) while typing", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({
        items: [{ id: 1, name: "Nguyen Van An", class: { id: 1, name: "11A" } }],
      })
    );
    renderTab();
    const input = screen.getByRole("combobox", { name: "Tìm học sinh" });
    fireEvent.change(input, { target: { value: "nguyen" } });

    const option = await screen.findByRole("option", { name: /Nguyen Van An/ });
    expect(option).toHaveTextContent("11A");
  });

  it("records the selected student", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch({
        items: [{ id: 1, name: "Nguyen Van An", class: { id: 1, name: "11A" } }],
      })
    );
    const onSelect = vi.fn();
    renderTab(onSelect);
    const input = screen.getByRole("combobox", { name: "Tìm học sinh" });
    fireEvent.change(input, { target: { value: "nguyen" } });
    const option = await screen.findByRole("option", { name: /Nguyen Van An/ });
    option.click();
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1, name: "Nguyen Van An" })
    );
  });

  it("shows a no-results indication when nothing matches", async () => {
    vi.stubGlobal("fetch", mockFetch({ items: [] }));
    renderTab();
    const input = screen.getByRole("combobox", { name: "Tìm học sinh" });
    fireEvent.change(input, { target: { value: "zzz" } });
    await waitFor(() => {
      expect(screen.getByText("Không tìm thấy học sinh.")).toBeInTheDocument();
    });
  });
});
