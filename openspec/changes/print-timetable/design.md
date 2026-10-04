# Design

## Context

See proposal.md — Why. The timetable grid is rendered by `TimetableGrid` inside `TimetableResult`, which lives below the lookup tabs in `TimetableLookupSection`, alongside a global `Footer`. The grid already wraps its table in `overflow-x-auto` for small screens and tints the current-day column (`bg-primary/10`). The project uses Tailwind, and an existing precedent (`Footer.tsx`) uses Tailwind `print:` variants, which AGENTS.md calls the expected approach for print styling.

## Goals / Non-Goals

**Goals:**
- Add a Print control scoped to the grid result and drive printing via `window.print()`.
- Produce a print stylesheet that shows only the grid and neutralizes screen-only styling, using Tailwind `print:` variants kept isolated so screen views are untouched.

**Non-Goals:**
- No server-side rendering, PDF generation, or download.
- No custom paper-size/orientation controls — defer to the browser dialog.
- No change to the grid's data model or resolver.

## Decisions

- **Trigger via `window.print()` on a button inside the result area.** The button renders only when `TimetableResult` has grid data, satisfying the visibility requirement for free (same condition that renders `TimetableGrid`). Alternative — a page-level toolbar button — was rejected because it would need to know whether a grid is currently shown and duplicate that state.

- **Isolate print output with a "print root + hide siblings" approach rather than a hidden print-only clone.** Mark the grid's wrapper as the print target and hide everything else at print time. Concretely: add `print:hidden` to the non-grid UI (lookup tabs list/other tabs' controls, the Print button itself, the footer) and ensure the grid container has no `print:hidden`. This avoids maintaining a second copy of the grid markup that could drift from the on-screen version. Alternative — duplicating the grid into a dedicated print container — was rejected as higher maintenance for a grid whose shape already varies by view.

- **Neutralize screen-only grid styling with `print:` overrides on the grid itself.** Replace `overflow-x-auto` behavior for print (`print:overflow-visible`) so no columns are clipped, force readable contrast (`print:text-black`, white background) mirroring the Footer precedent, and drop the current-day tint for print so the highlight does not print as a gray band. These overrides live next to existing classes on the grid elements.

- **Button placement and labeling.** The button sits above the grid in `TimetableResult`, labeled in Vietnamese ("In") consistent with the rest of the UI, and carries `print:hidden` so it never appears in output.

## Risks / Trade-offs

- **Browsers may not print background colors by default** → rely on dark text on white rather than background fills for legibility; do not depend on `bg-*` tints surviving print.
- **Hiding siblings could accidentally hide the grid if the print root is nested under a hidden ancestor** → keep `print:hidden` on specific sibling elements (tabs controls, footer, button), never on an ancestor that contains the grid, and verify a wide grid renders fully in a print-preview check during implementation.
- **Other inactive tabs' content** is not rendered by the Tabs primitive, so only the active tab's grid is present — no special handling needed, but confirm during testing.
