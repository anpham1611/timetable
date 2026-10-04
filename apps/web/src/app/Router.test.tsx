import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "./ThemeProvider.js";
import { routes } from "./Router.js";

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <ThemeProvider>
      <QueryClientProvider client={client}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

describe("app routes", () => {
  beforeEach(() => {
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
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ items: [] }), { status: 200 }))
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    sessionStorage.clear();
  });

  it("shows the login form at /admin when not logged in", async () => {
    sessionStorage.clear();
    renderAt("/admin");
    expect(
      await screen.findByRole("heading", { name: "Đăng nhập quản trị" })
    ).toBeInTheDocument();
  });

  it("renders the admin page at /admin when a session exists", async () => {
    sessionStorage.setItem("admin-session-token", "tok");
    renderAt("/admin");
    expect(
      await screen.findByRole("heading", { name: "Quản trị thời khóa biểu" })
    ).toBeInTheDocument();
  });
});
