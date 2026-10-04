import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useClasses } from "./useClasses.js";
import { useStudentSearch } from "./useStudentSearch.js";
import { useTeacherSearch } from "./useTeacherSearch.js";

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>
  );
}

function stubFetch(body: unknown) {
  const fn = vi.fn(
    async () => new Response(JSON.stringify(body), { status: 200 })
  );
  vi.stubGlobal("fetch", fn);
  return fn;
}

afterEach(() => vi.unstubAllGlobals());

describe("useClasses", () => {
  function Probe() {
    const { data } = useClasses();
    return <span>classes:{data?.items.length ?? -1}</span>;
  }

  it("parses the class list response", async () => {
    stubFetch({ items: [{ id: 1, name: "11A", grade: { id: 1, name: "11" } }] });
    renderWithClient(<Probe />);
    expect(await screen.findByText("classes:1")).toBeInTheDocument();
  });
});

describe("useStudentSearch", () => {
  function Probe({ q }: { q: string }) {
    const { data } = useStudentSearch(q);
    return <span>students:{data?.items.length ?? -1}</span>;
  }

  it("fetches and parses results for a non-empty query", async () => {
    stubFetch({
      items: [{ id: 1, name: "An", class: { id: 1, name: "11A" } }],
    });
    renderWithClient(<Probe q="an" />);
    expect(await screen.findByText("students:1")).toBeInTheDocument();
  });

  it("does not fetch for an empty query", () => {
    const fn = stubFetch({ items: [] });
    renderWithClient(<Probe q="   " />);
    expect(fn).not.toHaveBeenCalled();
  });
});

describe("useTeacherSearch", () => {
  function Probe({ q }: { q: string }) {
    const { data } = useTeacherSearch(q);
    return <span>teachers:{data?.items.length ?? -1}</span>;
  }

  it("fetches and parses results for a non-empty query", async () => {
    stubFetch({ items: [{ id: 1, name: "Hung" }] });
    renderWithClient(<Probe q="hung" />);
    expect(await screen.findByText("teachers:1")).toBeInTheDocument();
  });

  it("does not fetch for an empty query", () => {
    const fn = stubFetch({ items: [] });
    renderWithClient(<Probe q="" />);
    expect(fn).not.toHaveBeenCalled();
  });
});
