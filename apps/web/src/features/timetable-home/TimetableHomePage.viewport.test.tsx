import { render } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { Providers } from "@/app/Providers";
import { TimetableHomePage } from "./TimetableHomePage";
import { resetVisitLatch } from "./useVisitCount";

const VIEWPORT = 375;

beforeEach(() => {
  resetVisitLatch();
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
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      if (typeof url === "string" && url.startsWith("/timetables/active")) {
        return new Response(
          JSON.stringify({
            items: [{ id: 1, ordinal: 1, effectiveFrom: "2026-09-01" }],
            defaultSelectedId: 1,
          }),
          { status: 200 }
        );
      }
      return new Response(JSON.stringify({ count: 9000 }), { status: 200 });
    })
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

it("uses a mobile-first container that cannot exceed the 375px viewport", () => {
  const { container } = render(
    <Providers>
      <TimetableHomePage />
    </Providers>
  );

  const main = container.querySelector("main");
  expect(main).not.toBeNull();

  const className = main!.className;
  expect(className).toMatch(/\bmax-w-/);
  expect(className).not.toMatch(/\bw-\[\d/);
  expect(window.innerWidth).toBe(VIEWPORT);
});
