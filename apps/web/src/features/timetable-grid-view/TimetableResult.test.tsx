import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Providers } from "@/app/Providers";
import { TimetableResult } from "./TimetableResult.js";

const gridBody = {
  title: "Lớp 11A5",
  subtitle: null,
  timetableId: 2,
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

function renderResult(id: number | null) {
  return render(
    <Providers>
      <TimetableResult kind="class" id={id} />
    </Providers>
  );
}

describe("TimetableResult", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("renders nothing when no selection is made", () => {
    vi.stubGlobal("fetch", vi.fn());
    const { container } = renderResult(null);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the resolved grid for a selection", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify(gridBody), { status: 200 }))
    );
    renderResult(5);
    await waitFor(() => {
      expect(screen.getByText("Lớp 11A5")).toBeInTheDocument();
    });
    expect(screen.getByText("Toán")).toBeInTheDocument();
  });

  it("shows a not-found message on a 404", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ error: "class not found" }), { status: 404 }))
    );
    renderResult(999);
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Không tìm thấy thời khóa biểu."
      );
    });
  });

  it("passes the selected TKB as a tkb query param", async () => {
    const fetchMock = vi.fn(
      async () => new Response(JSON.stringify(gridBody), { status: 200 })
    );
    vi.stubGlobal("fetch", fetchMock);
    render(
      <Providers>
        <TimetableResult kind="student" id={7} timetableId={2} />
      </Providers>
    );
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/grids/student/7?tkb=2");
    });
  });

  it("shows a Print button when a grid is displayed and prints on click", async () => {
    const printMock = vi.fn();
    vi.stubGlobal("print", printMock);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify(gridBody), { status: 200 }))
    );
    renderResult(5);
    const printButton = await screen.findByRole("button", { name: "In" });
    expect(printButton).toBeInTheDocument();
    printButton.click();
    expect(printMock).toHaveBeenCalledTimes(1);
  });

  it("does not show a Print button when no selection is made", () => {
    vi.stubGlobal("fetch", vi.fn());
    renderResult(null);
    expect(screen.queryByRole("button", { name: "In" })).not.toBeInTheDocument();
  });

  it("does not show a Print button while loading", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {}))
    );
    renderResult(5);
    expect(screen.queryByRole("button", { name: "In" })).not.toBeInTheDocument();
  });

  it("does not show a Print button on a not-found error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ error: "class not found" }), {
            status: 404,
          })
      )
    );
    renderResult(999);
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
    expect(screen.queryByRole("button", { name: "In" })).not.toBeInTheDocument();
  });
});
