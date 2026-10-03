import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppLayout } from "./AppLayout.js";

describe("AppLayout", () => {
  it("renders route content followed by the app-wide footer", () => {
    render(
      <AppLayout>
        <main>Route content</main>
      </AppLayout>,
    );

    expect(screen.getByText("Route content")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Quản trị/i })).toBeInTheDocument();
  });

  it("renders exactly one footer", () => {
    render(
      <AppLayout>
        <main>Content</main>
      </AppLayout>,
    );
    expect(screen.getAllByRole("contentinfo")).toHaveLength(1);
  });
});
