# Tasks

## 1. Print control and trigger

- [x] 1.1 Add a Print button ("In") to `TimetableResult` that renders only in the data-present branch (the same branch that renders `TimetableGrid`), wired to call `window.print()` on activation. Verify by rendering a resolved grid and confirming the button appears; render the no-selection, loading, and error states and confirm it does not.
- [x] 1.2 Extend `TimetableResult.test.tsx` with cases asserting the Print button is present with a displayed grid and absent in the no-selection/loading/not-found states, and that activating it calls a stubbed `window.print`. Verify `pnpm --filter @timetable/web test` passes.

## 2. Print-only presentation

- [x] 2.1 Add `print:hidden` to the Print button and to the non-grid lookup UI (tabs list and other non-grid controls in `TimetableLookupSection` / tab components) and to the `Footer`, so only the grid prints. Verify in browser print preview that tabs, search inputs, button, and footer are absent while the grid shows.
- [x] 2.2 Add `print:` overrides on the grid in `TimetableGrid.tsx`: make the table wrapper `print:overflow-visible` (no column clipping), force dark-on-white contrast (`print:text-black`, white background), and remove the current-day tint for print. Verify in print preview that all day columns/period rows are visible and text is readable.

## 3. Integration verification

- [x] 3.1 Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` from the repo root and confirm all pass.
