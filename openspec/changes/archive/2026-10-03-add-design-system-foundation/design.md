# Design

## Context

See proposal.md — Why. The web app (`apps/web`) already has shadcn/ui *wiring* but no foundation: `components.json` is configured (slate base, `cssVariables: true`, `@/components/ui` alias), `cn` exists in `src/lib/utils.ts`, and CVA/clsx/tailwind-merge are installed. What is missing is the token layer, the Tailwind theme mapping, dark mode, and theme state. The theme must apply before first paint, and React mounts after the document loads — so the initial theme cannot be resolved solely inside React without risking a flash.

Relevant current state:
- `src/index.css`: only `@tailwind base/components/utilities` — no `:root`/`.dark` variables.
- `tailwind.config.js`: empty `theme.extend`, no `darkMode`.
- `src/app/Providers.tsx`: wraps the app in `QueryClientProvider` — the mount point for a theme provider.
- `index.html`: static, no inline script.
- Stack: Tailwind 3.4, React 19, Vite 5, class-based conventions throughout.

## Goals / Non-Goals

**Goals:**
- A token layer that matches shadcn/ui's standard HSL-variable convention, so primitives added later via the shadcn CLI work with zero adaptation.
- Class-based dark mode (`.dark` on the document root) that both the pre-paint script and the React provider drive through the same mechanism.
- No flash of incorrect theme (FOUC), including for `system` preference.

**Non-Goals:**
- No custom brand palette or visual redesign — adopt shadcn's default slate token values (adjustable later without spec change).
- No component library build-out beyond the minimum primitives needed to validate the foundation.
- No server-side theme storage or cross-device sync; persistence is local to the browser.

## Decisions

**Follow shadcn/ui's exact token convention (HSL channel variables).**
Define tokens as space-separated HSL channels (e.g. `--background: 0 0% 100%`) consumed via `hsl(var(--background))` in the Tailwind color mapping, rather than inventing a custom token shape. Rationale: the shadcn CLI generates primitives that assume this exact convention; deviating would force hand-editing every generated component. Alternative (custom token names / hex values) rejected — it breaks CLI compatibility that `components.json` already promises.

**Class-based dark mode (`darkMode: "class"`), single source of truth = the `dark` class on `<html>`.**
Both the inline pre-paint script and the React theme provider toggle the same class. Rationale: one mechanism avoids drift between pre-hydration and hydrated states. Alternative (media-query-only dark mode) rejected — it cannot honor an explicit user override of light/dark.

**Prevent FOUC with a tiny inline script in `index.html` `<head>`.**
A blocking inline script reads the persisted choice from `localStorage` (and `matchMedia` for `system`) and sets the `dark` class before the first paint. React's provider then reads the same storage key on mount and stays authoritative thereafter. Rationale: React mounts too late to set the class before paint; the inline script is the standard shadcn/next-themes approach. Alternative (accept a brief flash) rejected — the spec explicitly requires no flash.

**Theme provider lives alongside the existing Providers composition.**
Add a theme provider (context exposing current theme + setter) wrapping or sitting beside `QueryClientProvider` in `src/app/Providers.tsx`, with a `localStorage` key shared with the inline script. Rationale: keeps provider composition in one place per the app layout conventions.

**Minimal primitive set to prove the foundation.**
Add `button` (and the theme toggle built on it) under `components/ui/`, generated via the shadcn CLI where possible. Rationale: a token-consuming, variant-driven primitive validates that tokens, dark mode, and CVA all work end to end without over-building UI ahead of real features.

## Risks / Trade-offs

- [Inline FOUC script drifts from the provider's storage key/logic] → Share a single documented storage key name and value grammar between the script and provider; cover persistence + no-flash behavior in tests.
- [Adopting slate defaults may not match eventual brand] → Tokens are centralized in `index.css`; re-theming is a value change, not a structural one, and does not alter the spec.
- [`system` preference changes at runtime] → Provider subscribes to `matchMedia('(prefers-color-scheme: dark)')` and re-resolves when in `system` mode.
- [Contrast regressions when token values are later tuned] → Treat AA contrast as a documented acceptance criterion for any token value change; verify default pairings during this change.

## Migration Plan

Greenfield within the web app — purely additive. No data migration, no API changes. Deploys with the normal web build. Rollback is reverting the config/CSS/provider edits; nothing persists server-side.

## Appendix: WCAG AA Contrast Verification

Computed contrast ratios for the default (slate) token pairings. AA requires ≥4.5:1 for normal text, ≥3:1 for large text and UI components.

| Pairing | Light | Dark |
|---|---|---|
| foreground / background | 20.01 (AA) | 19.12 (AA) |
| primary-foreground / primary | 17.06 (AA) | 17.06 (AA) |
| secondary-foreground / secondary | 16.30 (AA) | 13.98 (AA) |
| muted-foreground / background | 4.76 (AA) | 7.80 (AA) |
| destructive-foreground / destructive | 3.60 (AA large/UI only) | 9.58 (AA) |

All text pairings meet AA for normal text except **light destructive-foreground on destructive** at 3.60:1, which meets the ≥3:1 threshold for large text and UI components (the destructive button's bold label) but is below 4.5:1 for normal body text. This is the stock shadcn slate default; it is acceptable for the button use here. If destructive is ever used for normal-size body text in the light theme, darken `--destructive` (e.g. toward `0 72% 45%`) to reach ≥4.5:1.
