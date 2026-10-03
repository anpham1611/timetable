import { act, render, renderHook, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider, useTheme, type Theme } from "./ThemeProvider.js";

type MediaListener = (e: { matches: boolean }) => void;

function installMatchMedia(prefersDark: boolean) {
  const listeners = new Set<MediaListener>();
  const state = { matches: prefersDark };
  const mql = {
    get matches() {
      return state.matches;
    },
    media: "(prefers-color-scheme: dark)",
    addEventListener: (_: string, cb: MediaListener) => listeners.add(cb),
    removeEventListener: (_: string, cb: MediaListener) => listeners.delete(cb),
    // legacy fallbacks
    addListener: (cb: MediaListener) => listeners.add(cb),
    removeListener: (cb: MediaListener) => listeners.delete(cb),
    dispatchEvent: () => true,
  };
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => mql)
  );
  return {
    emit(matches: boolean) {
      state.matches = matches;
      listeners.forEach((cb) => cb({ matches }));
    },
  };
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove("dark");
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ThemeProvider", () => {
  it("persists the chosen theme to localStorage and applies the dark class", () => {
    installMatchMedia(false);
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
    });

    act(() => result.current.setTheme("dark"));

    expect(localStorage.getItem("timetable-theme")).toBe("dark");
    expect(result.current.resolvedTheme).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("restores a persisted theme on mount (round-trip)", () => {
    localStorage.setItem("timetable-theme", "dark" satisfies Theme);
    installMatchMedia(false);

    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
    });

    expect(result.current.theme).toBe("dark");
    expect(result.current.resolvedTheme).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("re-resolves when the system preference changes in system mode", () => {
    const media = installMatchMedia(false);
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
    });

    expect(result.current.theme).toBe("system");
    expect(result.current.resolvedTheme).toBe("light");

    act(() => media.emit(true));

    expect(result.current.resolvedTheme).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("ignores system changes when an explicit theme is set", () => {
    const media = installMatchMedia(false);
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
    });

    act(() => result.current.setTheme("light"));
    act(() => media.emit(true));

    expect(result.current.resolvedTheme).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("provides context to descendants", () => {
    installMatchMedia(false);
    function Consumer() {
      const { resolvedTheme } = useTheme();
      return <span>resolved:{resolvedTheme}</span>;
    }
    render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>
    );
    expect(screen.getByText(/resolved:light/)).toBeInTheDocument();
  });
});
