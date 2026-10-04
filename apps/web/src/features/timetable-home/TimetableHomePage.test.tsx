import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Providers } from "@/app/Providers";
import { TimetableHomePage } from "./TimetableHomePage.js";
import { resetVisitLatch } from "./useVisitCount.js";

function mockFetch(timetablesBody: unknown) {
  return vi.fn(async (url: string) => {
    if (typeof url === "string" && url.startsWith("/timetables/active")) {
      return new Response(JSON.stringify(timetablesBody), { status: 200 });
    }
    if (typeof url === "string" && url.startsWith("/classes")) {
      return new Response(JSON.stringify({ items: [] }), { status: 200 });
    }
    if (
      typeof url === "string" &&
      (url.startsWith("/students") || url.startsWith("/teachers"))
    ) {
      return new Response(JSON.stringify({ items: [] }), { status: 200 });
    }
    // /visits
    return new Response(JSON.stringify({ count: 9000 }), { status: 200 });
  });
}

function renderPage() {
  return render(
    <Providers>
      <TimetableHomePage />
    </Providers>
  );
}

const twoItems = {
  items: [
    { id: 1, ordinal: 1, effectiveFrom: "2026-09-01" },
    { id: 2, ordinal: 2, effectiveFrom: "2026-09-15" },
  ],
  defaultSelectedId: 1,
};

describe("TimetableHomePage", () => {
  beforeEach(() => {
    resetVisitLatch();
    localStorage.clear();
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({
        matches: false,
        media: "(prefers-color-scheme: dark)",
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => true,
      }))
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the Vietnamese header and visit count", async () => {
    vi.stubGlobal("fetch", mockFetch(twoItems));
    renderPage();
    expect(screen.getByText("Thời khóa biểu")).toBeInTheDocument();
    expect(
      screen.getByText("Áp dụng từ 07/09/2026 · tra theo lớp, học sinh hoặc giáo viên")
    ).toBeInTheDocument();
    expect(await screen.findByText("Lượt truy cập: 9.000")).toBeInTheDocument();
  });

  it("lists the TKB buttons newest-first", async () => {
    vi.stubGlobal("fetch", mockFetch(twoItems));
    renderPage();
    await screen.findByText("TKB 2 - 15/09/2026");

    const buttons = screen
      .getAllByRole("button")
      .filter((b) => /^TKB \d+ - /.test(b.textContent ?? ""));
    expect(buttons[0]).toHaveTextContent("TKB 2 - 15/09/2026");
    expect(buttons[1]).toHaveTextContent("TKB 1 - 01/09/2026");
  });

  it("highlights exactly the default TKB by default", async () => {
    vi.stubGlobal("fetch", mockFetch(twoItems));
    renderPage();
    await screen.findByText("TKB 1 - 01/09/2026");

    const pressed = screen.getAllByRole("button", { pressed: true });
    expect(pressed).toHaveLength(1);
    expect(pressed[0]).toHaveTextContent("TKB 1 - 01/09/2026");
  });

  it("moves the highlight when another TKB is selected", async () => {
    vi.stubGlobal("fetch", mockFetch(twoItems));
    renderPage();

    const other = await screen.findByText("TKB 2 - 15/09/2026");
    other.click();

    await waitFor(() => {
      const pressed = screen.getAllByRole("button", { pressed: true });
      expect(pressed).toHaveLength(1);
      expect(pressed[0]).toHaveTextContent("TKB 2 - 15/09/2026");
    });
  });

  it("shows an empty-state when there are no active TKBs", async () => {
    vi.stubGlobal("fetch", mockFetch({ items: [], defaultSelectedId: null }));
    renderPage();
    expect(await screen.findByText(/chưa có thời khóa biểu/i)).toBeInTheDocument();
  });
});
