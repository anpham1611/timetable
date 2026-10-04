# Tasks

## 1. Newest-first ordering on the home view

- [x] 1.1 Sort the active TKB `items` descending by `effectiveFrom` before rendering the buttons (in `apps/web/src/features/timetable-home`, e.g. where `TimetableButtons` receives `items`).
- [x] 1.2 Update home-view tests (`HeaderParts.test.tsx` / `TimetableHomePage*.test.tsx`) to assert the buttons render newest-first.

## 2. Default to the latest TKB

- [x] 2.1 Change `computeDefaultSelectedId` in `apps/api/src/services/timetable.ts` to return the latest TKB by effective date (newest), keeping the function signature and the "rows ascending" precondition.
- [x] 2.2 Update `apps/api/src/services/timetable.test.ts` cases for the new default rule (latest by effective date, including a future-dated TKB and the empty case → null).

## 3. Verification

- [x] 3.1 Run `pnpm lint → pnpm typecheck → pnpm test → pnpm build`; all must pass.
