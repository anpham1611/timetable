# Tasks

## 1. Token layer and Tailwind theme mapping

- [x] 1.1 Define shadcn/ui semantic design tokens as HSL channel variables in `apps/web/src/index.css` under `@layer base`, with a `:root` (light) set and a `.dark` override set covering background/foreground, card, popover, primary, secondary, muted, accent, destructive, border, input, ring, and `--radius`; verify every token is defined in both blocks and `pnpm --filter @timetable/web build` succeeds.
- [x] 1.2 Add a base layer rule applying `bg-background text-foreground` (and a border default) to the app body in `index.css`; verify the app renders with token-driven surface colors in the browser.
- [x] 1.3 Set `darkMode: "class"` and map the tokens into `theme.extend.colors` (via `hsl(var(--token))`) and `theme.extend.borderRadius` (via `--radius`) in `apps/web/tailwind.config.js`; verify `bg-background`, `text-foreground`, and `rounded-lg` resolve to token values and `pnpm --filter @timetable/web typecheck` passes.

## 2. Theme state, persistence, and no-flash

- [x] 2.1 Add a pre-paint inline script in `apps/web/index.html` `<head>` that reads the persisted theme from `localStorage` (resolving `system` via `matchMedia`) and sets/removes the `dark` class on `<html>` before first paint; verify that loading with a dark-resolved preference paints the first frame in dark (no light flash) in the browser.
- [x] 2.2 Implement a theme provider module under `apps/web/src/app/` exposing the current theme (`light` | `dark` | `system`) and a setter, that applies the `dark` class, persists the choice to the same `localStorage` key as the inline script, and re-resolves on `matchMedia` change when in `system` mode; verify a unit test covers persistence round-trip and system-change re-resolution.
- [x] 2.3 Mount the theme provider in `apps/web/src/app/Providers.tsx` alongside `QueryClientProvider`; verify a test asserts the provider context is available to descendants and existing app tests still pass.

## 3. Primitives and theme toggle UI

- [x] 3.1 Add the shadcn/ui `button` primitive under `apps/web/src/components/ui/` (via the shadcn CLI where possible, consuming `cn` and CVA); verify it renders with token-driven variants and `pnpm --filter @timetable/web typecheck` passes.
- [x] 3.2 Build a theme toggle control that switches between light and dark using the theme provider; verify a test asserts clicking it updates the resolved theme and toggles the `dark` class, and render it in the app so the switch is reachable in the UI.

## 4. Accessibility and responsive verification

- [x] 4.1 Verify default token text/interactive color pairings meet WCAG AA contrast (≥4.5:1 normal, ≥3:1 large) in both light and dark themes, record the checked pairings and ratios in `design.md` or a note, and adjust any failing token value in `index.css`.
- [x] 4.2 Verify the app renders at a 375px-wide viewport with no layout-induced horizontal overflow in both themes (manual check at 375px and/or an automated viewport test), and confirm the shared typography/spacing scale is applied to the sample UI.

## 5. Integration check

- [x] 5.1 Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` from the repo root and verify all pass with the design foundation in place.
