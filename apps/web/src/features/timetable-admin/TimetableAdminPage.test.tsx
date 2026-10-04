import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TimetableAdminPage } from "./TimetableAdminPage.js";

function listResponse(items: unknown[]) {
  return new Response(JSON.stringify({ items }), { status: 200 });
}

const TKB_OLD = {
  id: 1,
  ordinal: 1,
  effectiveFrom: "2026-09-01",
  isActive: true,
  createdAt: "2026-09-01T00:00:00.000Z",
};
const TKB_NEW = {
  id: 2,
  ordinal: 2,
  effectiveFrom: "2026-09-15",
  isActive: false,
  createdAt: "2026-09-10T00:00:00.000Z",
};

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <TimetableAdminPage />
    </QueryClientProvider>
  );
}

describe("TimetableAdminPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders all timetables newest-first", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => listResponse([TKB_OLD, TKB_NEW]))
    );
    renderPage();

    const items = await screen.findAllByRole("listitem");
    expect(items).toHaveLength(2);
    // Newest (ordinal 2) should be first.
    expect(items[0]!).toHaveTextContent("TKB 2");
    expect(items[1]!).toHaveTextContent("TKB 1");
  });

  it("toggles a timetable and refetches the list", async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      if (init?.method === "PATCH") return new Response(null, { status: 200 });
      return listResponse([TKB_NEW]);
    });
    vi.stubGlobal("fetch", fetchMock);
    renderPage();

    const toggleBtn = await screen.findByRole("button", { name: "Hiển thị" });
    fireEvent.click(toggleBtn);

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(
          ([u, init]) =>
            String(u) === "/api/admin/timetables/2/active" &&
            (init as RequestInit | undefined)?.method === "PATCH"
        )
      ).toBe(true);
    });
    // The list query is invalidated → fetched again (initial + refetch).
    await waitFor(() => {
      const listCalls = fetchMock.mock.calls.filter(
        ([u, init]) =>
          String(u) === "/api/admin/timetables" &&
          (init as RequestInit | undefined)?.method === undefined
      );
      expect(listCalls.length).toBeGreaterThanOrEqual(2);
    });
  });

  it("imports a file and refetches the list", async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (String(url) === "/api/admin/import" && init?.method === "POST") {
        return new Response(
          JSON.stringify({
            timetableId: 3,
            lessonsCreated: 5,
            gradesCreated: 1,
            classesCreated: 1,
            subjectsCreated: 1,
            teachersCreated: 1,
            roomsCreated: 0,
            studentsCreated: 0,
          }),
          { status: 201 }
        );
      }
      return listResponse([TKB_NEW]);
    });
    vi.stubGlobal("fetch", fetchMock);
    renderPage();

    await screen.findByRole("button", { name: "Nhập TKB từ Excel" });
    const input = screen.getByLabelText("Tệp Excel thời khóa biểu");
    const file = new File(["x"], "tkb.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    fireEvent.change(input, { target: { files: [file] } });

    expect(await screen.findByRole("status")).toHaveTextContent(
      /Đã nhập TKB mới/
    );
    await waitFor(() => {
      const posts = fetchMock.mock.calls.filter(
        ([u, init]) =>
          String(u) === "/api/admin/import" &&
          (init as RequestInit | undefined)?.method === "POST"
      );
      expect(posts).toHaveLength(1);
    });
  });

  it("surfaces a located import error (sheet/row/message) on a 400", async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (String(url) === "/api/admin/import" && init?.method === "POST") {
        return new Response(
          JSON.stringify({
            error: {
              sheet: "Lesson",
              row: 14,
              column: "teacherCodes",
              message: "teacherCode 'NVA' not found in Teacher sheet",
            },
          }),
          { status: 400 }
        );
      }
      return listResponse([TKB_NEW]);
    });
    vi.stubGlobal("fetch", fetchMock);
    renderPage();

    await screen.findByRole("button", { name: "Nhập TKB từ Excel" });
    const input = screen.getByLabelText("Tệp Excel thời khóa biểu");
    const file = new File(["x"], "bad.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    fireEvent.change(input, { target: { files: [file] } });

    const status = await screen.findByRole("status");
    expect(status).toHaveTextContent(/Lesson/);
    expect(status).toHaveTextContent(/14/);
    expect(status).toHaveTextContent(/not found in Teacher/);
  });
});
