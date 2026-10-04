# Tasks

## 1. Shared contracts

- [x] 1.1 Add `visitCountResponseSchema` (`{ count: int, nonnegative }`) and `VisitCountResponse` type in `packages/shared/src/schemas/visit-counter.ts`; verify a unit test accepts `{ count: 0 }` and rejects a negative/float count.
- [x] 1.2 Add `activeTimetableSchema` (`{ id, ordinal, effectiveFrom: ISO date string }`) and `activeTimetablesResponseSchema` (`{ items: [...], defaultSelectedId: number | null }`) with types in `packages/shared/src/schemas/timetable.ts`; verify a unit test accepts a valid list and rejects a missing `effectiveFrom`.
- [x] 1.3 Re-export the new schemas and types from `packages/shared/src/index.ts`; verify `pnpm --filter @timetable/shared build` and the shared test suite pass.

## 2. Database schema and migration

- [x] 2.1 Add `visitCounter` table (`id` pk, `count` int default 0) and `timetable` table (`id` pk, `ordinal` int, `effectiveFrom` timestamp, `isActive` int default 1, `createdAt` default now) to `apps/api/src/db/schema.ts`; verify `pnpm typecheck` passes for the api package.
- [x] 2.2 Generate the migration with `pnpm --filter @timetable/api run db:generate` and apply it with `db:migrate`; verify the two tables exist in the SQLite DB.
- [x] 2.3 Seed the single `visit_counter` row (`id=1, count=0`) and two active `timetable` rows (ordinal 1 → 2026-09-01, ordinal 2 → 2026-09-15); verify a query returns both active rows and one counter row.

## 3. Visit-counter backend (routes → services → repositories)

- [x] 3.1 Add repository functions in `apps/api/src/repositories/visit-counter.ts`: `incrementVisitCount()` doing an atomic `UPDATE visit_counter SET count = count + 1 WHERE id = 1` returning the new count, and `getVisitCount()`; verify a repository test shows two increments raise the count by exactly 2.
- [x] 3.2 Add `recordVisit()` service in `apps/api/src/services/visit-counter.ts` that calls the repository and returns a `visitCountResponseSchema`-validated result; verify a service test returns the incremented, schema-valid payload.
- [x] 3.3 Add `visitRoutes` exposing `POST /visits` (increment + return new count) in `apps/api/src/routes/visit-counter.ts` and register it in `index.ts`; verify an integration test POSTs `/visits` twice and sees the count increase by 2.

## 4. Timetable list backend (routes → services → repositories)

- [x] 4.1 Add `listActiveTimetables()` in `apps/api/src/repositories/timetable.ts` returning active rows ordered by `effectiveFrom` ascending; verify a repository test returns only `isActive=1` rows in ascending date order.
- [x] 4.2 Add `getActiveTimetables()` service in `apps/api/src/services/timetable.ts` that maps rows to the shared shape, computes `defaultSelectedId` (latest `effectiveFrom <= today`, else earliest upcoming, else null), and validates against `activeTimetablesResponseSchema`; verify a service test asserts the default-selection rule for past/upcoming/empty cases.
- [x] 4.3 Add `timetableRoutes` exposing `GET /timetables/active` in `apps/api/src/routes/timetable.ts` and register it in `index.ts`; verify an integration test returns the seeded items and a `defaultSelectedId`.

## 5. Web timetable-home view

- [x] 5.1 Add `useVisitCount` hook in `apps/web/src/features/timetable-home/useVisitCount.ts` that POSTs `/visits` once per page load (guarded against React StrictMode double-fire) and exposes the validated count; verify a test asserts a single POST per mount and a parsed count.
- [x] 5.2 Add `useActiveTimetables` hook in `apps/web/src/features/timetable-home/useActiveTimetables.ts` that GETs `/timetables/active` and returns validated `items` + `defaultSelectedId`; verify a test parses a mocked response.
- [x] 5.3 Add header subcomponents: title/subtitle (fixed Vietnamese strings), visit line formatting count via `Intl.NumberFormat('vi-VN')` with a neutral placeholder when unavailable, and a TKB button list rendering `TKB {n} - {dd/mm/yyyy}` with shadcn `button`; verify tests cover the vi-VN formatting, the `dd/mm/yyyy` label, and the unavailable placeholder.
- [x] 5.4 Add `TimetableHomePage` composing the header; track selected TKB in local state seeded from `defaultSelectedId`, highlight exactly one with the primary color, move highlight on click, and show an empty-state when there are no active TKBs; verify tests cover default highlight, selection change (only one highlighted), and empty-state.
- [x] 5.5 Point `/` at `TimetableHomePage` in `apps/web/src/app/Router.tsx`; verify a viewport test renders the header without horizontal overflow at 375px.

## 6. Integration verification

- [x] 6.1 Run `pnpm lint && pnpm typecheck && pnpm test && pnpm build`; verify all pass with the new feature wired end to end (web loads header, visit count increments on load, active TKBs listed with one highlighted).
