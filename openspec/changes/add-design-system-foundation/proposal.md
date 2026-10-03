# Proposal

## Why

The web app has shadcn/ui wiring declared (`components.json`, `cn` util, CVA deps) but no actual design foundation: `index.css` has no design tokens, `tailwind.config.js` has an empty theme and no dark mode, and there is no way to switch or persist a theme. Every upcoming feature (timetable views, print, Excel import UI) needs a consistent, accessible, themeable visual base to build on, so this foundation must land before feature UI work begins.

## What Changes

- Define shadcn/ui semantic design tokens as CSS custom properties in `index.css`, with a `:root` (light) set and a `.dark` override set, covering background/foreground, card, popover, primary, secondary, muted, accent, destructive, border, input, ring, and the `--radius` token.
- Map those tokens into `tailwind.config.js` `theme.extend` (colors, borderRadius) and enable class-based dark mode (`darkMode: "class"`), so utilities like `bg-background` and `text-foreground` resolve to the tokens.
- Add a theme system: a theme provider mounted in the app that resolves `light` / `dark` / `system`, applies the `dark` class to the document root, and persists the choice (localStorage) with no flash of incorrect theme on load.
- Add a theme toggle UI control so users can switch between light and dark.
- Establish accessibility baselines: token color pairs meet WCAG AA contrast, and a documented responsive baseline (mobile-first, verified at 375px) plus consistent typography and spacing driven by the token scale.
- Add the minimum shadcn/ui primitive(s) needed to validate the foundation (e.g. `button`) under `components/ui/`.

## Capabilities

### New Capabilities
- `design-system`: The application's visual foundation — semantic design tokens, light/dark theming and theme persistence, responsive baseline, accessible color contrast, and consistent typography and spacing that all feature UI builds on.

### Modified Capabilities
<!-- None: no existing specs. -->

## Impact

- `apps/web/src/index.css` — design token CSS variables (`:root`, `.dark`).
- `apps/web/tailwind.config.js` — `darkMode: "class"`, token color + radius mapping.
- `apps/web/src/app/Providers.tsx` (and/or a new theme provider module) — theme resolution, application, and persistence.
- `apps/web/index.html` — pre-hydration inline script to prevent theme flash.
- `apps/web/src/components/ui/` — new directory for shadcn primitives (button, theme toggle).
- No API, shared-package, or database impact. No new runtime dependencies expected (CVA, clsx, tailwind-merge already present); any theme-related dependency would require prior approval per project conventions.
