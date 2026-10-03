import { render } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { Providers } from "@/app/Providers";
import { HomePage } from "@/features/health/HomePage";

const VIEWPORT = 375;

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove("dark");
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: VIEWPORT,
  });
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
  // Mock fetch used by HealthStatus so the render is deterministic.
  vi.stubGlobal(
    "fetch",
    vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ status: "ok" }),
      } as Response)
    )
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

it("uses a mobile-first container that cannot exceed the 375px viewport", () => {
  const { container } = render(
    <Providers>
      <HomePage />
    </Providers>
  );

  const main = container.querySelector("main");
  expect(main).not.toBeNull();

  // The layout container is width-capped by a max-width utility (not a fixed
  // width), so it shrinks to fit a 375px viewport rather than forcing overflow.
  const className = main!.className;
  expect(className).toMatch(/\bmax-w-/);
  expect(className).not.toMatch(/\bw-\[\d/); // no hard-coded fixed pixel width
  expect(window.innerWidth).toBe(VIEWPORT);
});
