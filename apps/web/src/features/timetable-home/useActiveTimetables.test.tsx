import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useActiveTimetables } from "./useActiveTimetables.js";

function Probe() {
  const { data } = useActiveTimetables();
  return (
    <span>
      items:{data?.items.length ?? -1}|default:{String(data?.defaultSelectedId)}
    </span>
  );
}

function renderProbe() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <Probe />
    </QueryClientProvider>
  );
}

describe("useActiveTimetables", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              items: [
                { id: 1, ordinal: 1, effectiveFrom: "2026-09-01" },
                { id: 2, ordinal: 2, effectiveFrom: "2026-09-15" },
              ],
              defaultSelectedId: 2,
            }),
            { status: 200 }
          )
      )
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("parses the mocked active-timetables response", async () => {
    renderProbe();
    expect(await screen.findByText("items:2|default:2")).toBeInTheDocument();
  });
});
