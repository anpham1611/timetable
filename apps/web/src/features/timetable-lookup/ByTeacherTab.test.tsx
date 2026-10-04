import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { TeacherItem } from "@timetable/shared";
import { Providers } from "@/app/Providers";
import { ByTeacherTab } from "./ByTeacherTab.js";

function mockFetch(body: unknown) {
  return vi.fn(async () => new Response(JSON.stringify(body), { status: 200 }));
}

function renderTab(onSelect: (t: TeacherItem) => void = () => {}) {
  return render(
    <Providers>
      <ByTeacherTab selectedTeacher={null} onSelectTeacher={onSelect} />
    </Providers>
  );
}

describe("ByTeacherTab", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("suggests matching teachers while typing", async () => {
    vi.stubGlobal("fetch", mockFetch({ items: [{ id: 1, name: "Do Minh Hung" }] }));
    renderTab();
    const input = screen.getByRole("combobox", { name: "Tìm giáo viên" });
    fireEvent.change(input, { target: { value: "do" } });
    expect(
      await screen.findByRole("option", { name: "Do Minh Hung" })
    ).toBeInTheDocument();
  });

  it("records the selected teacher (identity only)", async () => {
    vi.stubGlobal("fetch", mockFetch({ items: [{ id: 1, name: "Do Minh Hung" }] }));
    const onSelect = vi.fn();
    renderTab(onSelect);
    const input = screen.getByRole("combobox", { name: "Tìm giáo viên" });
    fireEvent.change(input, { target: { value: "do" } });
    const option = await screen.findByRole("option", { name: "Do Minh Hung" });
    option.click();
    expect(onSelect).toHaveBeenCalledWith({ id: 1, name: "Do Minh Hung" });
  });

  it("shows a no-results indication when nothing matches", async () => {
    vi.stubGlobal("fetch", mockFetch({ items: [] }));
    renderTab();
    const input = screen.getByRole("combobox", { name: "Tìm giáo viên" });
    fireEvent.change(input, { target: { value: "zzz" } });
    await waitFor(() => {
      expect(screen.getByText("Không tìm thấy giáo viên.")).toBeInTheDocument();
    });
  });
});
