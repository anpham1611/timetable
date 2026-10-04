import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetVisitLatch, useVisitCount } from "./useVisitCount.js";

function Probe() {
  const { data } = useVisitCount();
  return <span>count:{data?.count ?? "…"}</span>;
}

function renderProbe() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <Probe />
    </QueryClientProvider>
  );
}

describe("useVisitCount", () => {
  beforeEach(() => {
    resetVisitLatch();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ count: 42 }), { status: 200 }))
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts /visits once per mount and exposes the parsed count", async () => {
    renderProbe();
    expect(await screen.findByText("count:42")).toBeInTheDocument();

    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    const visitCalls = fetchMock.mock.calls.filter(
      ([url, opts]) => url === "/visits" && opts?.method === "POST"
    );
    expect(visitCalls).toHaveLength(1);
  });
});
