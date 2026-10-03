import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ThemeProvider } from "@/app/ThemeProvider";
import { ThemeToggle } from "./ThemeToggle.js";

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

it("toggles between light and dark, updating the dark class", () => {
  render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>
  );

  // Starts light (system -> not dark).
  expect(document.documentElement.classList.contains("dark")).toBe(false);

  fireEvent.click(screen.getByRole("button", { name: /switch to dark theme/i }));
  expect(document.documentElement.classList.contains("dark")).toBe(true);
  expect(localStorage.getItem("timetable-theme")).toBe("dark");

  fireEvent.click(screen.getByRole("button", { name: /switch to light theme/i }));
  expect(document.documentElement.classList.contains("dark")).toBe(false);
  expect(localStorage.getItem("timetable-theme")).toBe("light");
});
