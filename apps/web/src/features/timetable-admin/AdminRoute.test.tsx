import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AdminRoute } from "./AdminRoute.js";

function renderRoute() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <AdminRoute />
    </QueryClientProvider>
  );
}

describe("AdminRoute login flow", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    sessionStorage.clear();
  });

  it("shows the login form when there is no session", () => {
    sessionStorage.clear();
    renderRoute();
    expect(
      screen.getByRole("heading", { name: "Đăng nhập quản trị" })
    ).toBeInTheDocument();
  });

  it("logs in with correct credentials and shows the admin page", async () => {
    sessionStorage.clear();
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (String(url) === "/api/admin/login" && init?.method === "POST") {
        return new Response(JSON.stringify({ token: "tok" }), { status: 200 });
      }
      return new Response(JSON.stringify({ items: [] }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);
    renderRoute();

    fireEvent.change(screen.getByLabelText("Tên đăng nhập"), {
      target: { value: "admin" },
    });
    fireEvent.change(screen.getByLabelText("Mật khẩu"), {
      target: { value: "s3cret" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));

    expect(
      await screen.findByRole("heading", { name: "Quản trị thời khóa biểu" })
    ).toBeInTheDocument();
    expect(sessionStorage.getItem("admin-session-token")).toBe("tok");
  });

  it("shows an error on wrong credentials and stays on the login form", async () => {
    sessionStorage.clear();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 401 }))
    );
    renderRoute();

    fireEvent.change(screen.getByLabelText("Tên đăng nhập"), {
      target: { value: "admin" },
    });
    fireEvent.change(screen.getByLabelText("Mật khẩu"), {
      target: { value: "nope" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /không đúng/
    );
    expect(
      screen.getByRole("heading", { name: "Đăng nhập quản trị" })
    ).toBeInTheDocument();
    expect(sessionStorage.getItem("admin-session-token")).toBeNull();
  });

  it("logs out and returns to the login form", async () => {
    sessionStorage.setItem("admin-session-token", "tok");
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (String(url) === "/api/admin/logout" && init?.method === "POST") {
        return new Response(null, { status: 204 });
      }
      return new Response(JSON.stringify({ items: [] }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);
    renderRoute();

    const logoutBtn = await screen.findByRole("button", { name: "Đăng xuất" });
    fireEvent.click(logoutBtn);

    expect(
      await screen.findByRole("heading", { name: "Đăng nhập quản trị" })
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(sessionStorage.getItem("admin-session-token")).toBeNull();
    });
  });
});
