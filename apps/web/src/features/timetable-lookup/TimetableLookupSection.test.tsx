import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Providers } from "@/app/Providers";
import { TimetableLookupSection } from "./TimetableLookupSection.js";

const classesBody = {
  items: [
    { id: 1, name: "11A", grade: { id: 1, name: "11" } },
    { id: 2, name: "11B", grade: { id: 1, name: "11" } },
    { id: 3, name: "12A", grade: { id: 2, name: "12" } },
  ],
};

const studentsBody = {
  items: [{ id: 10, name: "Nguyen Van An", class: { id: 1, name: "11A" } }],
};

const teachersBody = {
  items: [{ id: 20, name: "Do Minh Hung" }],
};

const gridBody = {
  title: "Lớp 11A",
  subtitle: null,
  timetableId: 1,
  days: [2, 3, 4, 5, 6, 7],
  periods: [
    { id: 1, session: "SANG", ordinal: 1, startTime: "07g00", endTime: "07g45" },
  ],
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
  ],
};

function mockFetch() {
  return vi.fn(async (url: string) => {
    if (url.startsWith("/classes")) {
      return new Response(JSON.stringify(classesBody), { status: 200 });
    }
    if (url.startsWith("/students")) {
      return new Response(JSON.stringify(studentsBody), { status: 200 });
    }
    if (url.startsWith("/teachers")) {
      return new Response(JSON.stringify(teachersBody), { status: 200 });
    }
    if (url.startsWith("/grids")) {
      return new Response(JSON.stringify(gridBody), { status: 200 });
    }
    return new Response(JSON.stringify({ items: [] }), { status: 200 });
  });
}

function renderSection() {
  return render(
    <Providers>
      <TimetableLookupSection />
    </Providers>
  );
}

describe("TimetableLookupSection", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the three tabs in order with 'Theo lớp' active by default", () => {
    vi.stubGlobal("fetch", mockFetch());
    renderSection();
    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((t) => t.textContent)).toEqual([
      "Theo lớp",
      "Theo học sinh",
      "Theo giáo viên",
    ]);
    const selected = screen.getByRole("tab", { selected: true });
    expect(selected).toHaveTextContent("Theo lớp");
  });

  it("switches content when another tab is activated", async () => {
    vi.stubGlobal("fetch", mockFetch());
    renderSection();

    // By-class selector visible first.
    await screen.findByRole("combobox", { name: "Chọn lớp" });

    screen.getByRole("tab", { name: "Theo giáo viên" }).click();

    await waitFor(() => {
      expect(
        screen.getByRole("combobox", { name: "Tìm giáo viên" })
      ).toBeInTheDocument();
    });
    expect(
      screen.queryByRole("combobox", { name: "Chọn lớp" })
    ).not.toBeInTheDocument();
  });

  it("lists classes grouped by grade in the dropdown", async () => {
    vi.stubGlobal("fetch", mockFetch());
    renderSection();
    const select = await screen.findByRole("combobox", { name: "Chọn lớp" });
    const groups = within(select).getAllByRole("group");
    // One optgroup per grade.
    expect(groups.map((g) => g.getAttribute("label"))).toEqual([
      "Khối 11",
      "Khối 12",
    ]);
  });

  it("keeps per-tab selection independent across tab switches", async () => {
    vi.stubGlobal("fetch", mockFetch());
    renderSection();

    const select = (await screen.findByRole("combobox", {
      name: "Chọn lớp",
    })) as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "1" } });
    expect(select.value).toBe("1");

    // Switch to teacher tab and back; class selection must persist.
    screen.getByRole("tab", { name: "Theo giáo viên" }).click();
    await screen.findByRole("combobox", { name: "Tìm giáo viên" });
    screen.getByRole("tab", { name: "Theo lớp" }).click();

    const selectAgain = (await screen.findByRole("combobox", {
      name: "Chọn lớp",
    })) as HTMLSelectElement;
    expect(selectAgain.value).toBe("1");
  });
});
