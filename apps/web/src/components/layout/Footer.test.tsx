import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ADMIN_EMAIL_PLACEHOLDER } from "@/lib/adminEmail";
import { Footer } from "./Footer.js";

describe("Footer", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("renders the Vietnamese data-source disclaimer", () => {
    render(<Footer />);
    expect(
      screen.getByText(/Dữ liệu tổng hợp từ file thời khóa biểu Excel của trường/i),
    ).toBeInTheDocument();
  });

  it("renders Quản trị as a mailto link using the configured admin email", () => {
    vi.stubEnv("VITE_ADMIN_EMAIL", "admin@school.edu.vn");
    render(<Footer />);
    const link = screen.getByRole("link", { name: /Quản trị/i });
    expect(link).toHaveAttribute("href", "mailto:admin@school.edu.vn");
  });

  it("falls back to the placeholder email when none is configured", () => {
    vi.stubEnv("VITE_ADMIN_EMAIL", "");
    render(<Footer />);
    const link = screen.getByRole("link", { name: /Quản trị/i });
    expect(link).toHaveAttribute("href", `mailto:${ADMIN_EMAIL_PLACEHOLDER}`);
  });
});
