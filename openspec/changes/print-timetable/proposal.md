# Proposal

## Why

Students and teachers need a paper copy of the timetable they are viewing (to post on a wall, carry, or hand out). Today the app only renders the grid on screen with no clean way to print it — browser printing captures the whole page chrome (tabs, search inputs, footer) and clips the wide grid.

## What Changes

- Add a **Print** button to the timetable result area, shown only when a resolved timetable grid is displayed.
- Clicking the button opens the browser's native print dialog for the current timetable.
- Printed output contains only the timetable grid (title/subtitle + table) — surrounding page UI (tabs, search fields, buttons, footer, highlights) is excluded or neutralized for print.
- Print layout is legible on paper: full grid visible without horizontal clipping, readable contrast, no interactive-only affordances.

Out of scope:
- Server-side PDF generation or file download.
- Custom print settings UI (paper size, orientation pickers) — rely on the browser's print dialog.
- Printing multiple timetables at once or batch export.

## Capabilities

### New Capabilities
- `timetable-print`: Printing a displayed timetable grid — the Print control, its visibility, and the print-only presentation of the grid.

### Modified Capabilities
<!-- none -->

## Impact

- Frontend only (`apps/web`). No API, database, or shared-contract changes.
- Touches the timetable grid view feature (`apps/web/src/features/timetable-grid-view`) to add the Print control and print-specific Tailwind styling.
- Uses the browser `window.print()` API; no new dependencies.
