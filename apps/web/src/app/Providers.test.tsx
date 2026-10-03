import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { Providers } from "./Providers.js";
import { useTheme } from "./ThemeProvider.js";

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove("dark");
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

it("exposes the theme context to descendants", () => {
  function Consumer() {
    const { resolvedTheme } = useTheme();
    return <span>theme:{resolvedTheme}</span>;
  }
  render(
    <Providers>
      <Consumer />
    </Providers>
  );
  expect(screen.getByText(/theme:light/)).toBeInTheDocument();
});
