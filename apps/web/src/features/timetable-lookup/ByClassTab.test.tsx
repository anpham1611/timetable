import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Providers } from "@/app/Providers";
import { ByClassTab } from "./ByClassTab.js";

function mockFetch(body: unknown) {
  return vi.fn(async () => new Response(JSON.stringify(body), { status: 200 }));
}

function renderTab(onSelect: (id: number) => void = () => {}) {
  return render(
    <Providers>
      <ByClassTab selectedClassId={null} onSelectClass={onSelect} />
    </Providers>
  );
}

const classes = {
  items: [
    { id: 1, name: "11A", grade: { id: 1, name: "11" } },
    { id: 2, name: "12A", grade: { id: 2, name: "12" } },
  ],
};

describe("ByClassTab", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("records the selected class", async () => {
    vi.stubGlobal("fetch", mockFetch(classes));
    const onSelect = vi.fn();
    renderTab(onSelect);
    const select = (await screen.findByRole("combobox", {
      name: "Chọn lớp",
    })) as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "2" } });
    expect(onSelect).toHaveBeenCalledWith(2);
  });

  it("shows an empty-state when there are no classes", async () => {
    vi.stubGlobal("fetch", mockFetch({ items: [] }));
    renderTab();
    expect(await screen.findByText("Hiện chưa có lớp nào.")).toBeInTheDocument();
  });
});
