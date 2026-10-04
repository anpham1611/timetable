# Design

## Context

See proposal.md — Why. The repo is a scaffolded pnpm workspace with a proven vertical slice (`web → routes → services → repositories → drizzle/SQLite`, shared Zod contract). The only DB table today is the placeholder `health_check`. `/` renders `HomePage` from `features/health`. This change adds the first real feature and the first real tables while following the existing layering and contract conventions.

## Goals / Non-Goals

**Goals:**
- Introduce the timetable-home view and the visit-counter backing, reusing the established layering and shared-contract pattern.
- Add minimal, forward-compatible DB tables for the visit counter and TKB records that the later Excel-import change can extend rather than replace.
- Keep the view mobile-first (375px) and print-clean (no print-specific styling needed yet).

**Non-Goals:**
- Timetable grid/lookup rendering, Excel import, TKB management/archival UI, print layout.
- Per-user/session/anti-bot visit accounting — a single global integer is sufficient.
- Auth or rate-limiting on the increment endpoint.

## Decisions

**1. Visit counter = single-row table, atomic increment.**
`visit_counter(id=1, count)` single fixed row. The increment endpoint does an atomic `UPDATE ... SET count = count + 1` then returns the new value, avoiding a read-modify-write race. Chosen over an append-only "visits" event table (simpler, display needs only the total; an event log is unnecessary now and can be added later if analytics are needed).

**2. Increment is an explicit POST triggered by the web client on home-page load, returning the new total.**
Rationale: counting belongs to a deliberate action and keeps GET reads side-effect-free (idempotent, cache-friendly). `POST /visits` increments and returns `{ count }`. The web view calls it once per mount via a TanStack Query mutation (or a `useQuery` with a stable key that the client fires on mount) and renders the returned count. Alternative considered: increment inside a `GET /visits` — rejected because GETs should not mutate.
   - Double-count nuance: React 19 StrictMode double-invokes effects in dev. We guard the client call so it fires once per real page load (e.g. a module/ref latch), accepting that this is best-effort rather than exactly-once across refreshes — matching the spec's "once per home-page load" intent.

**3. TKB model.**
`timetable` table: `id` (pk), `ordinal` (the display `{n}`), `effective_from` (timestamp, the `{dd/mm/yyyy}`), `is_active` (boolean/int flag, default active), `created_at`. The list endpoint returns active rows (`is_active = 1`) ordered by `effective_from` ascending (stable display order). The later import change writes these rows; here we seed a couple via migration/seed so the view has content.
   - Default selection rule: the API returns the list plus a `defaultSelectedId` = the active TKB whose `effective_from` is the latest value `<= today`; if none are `<= today`, the earliest upcoming one. This keeps the "which is active by default" decision server-side and testable rather than hard-coded in the UI.

**4. Shared contracts in `packages/shared`.**
- `visitCountResponseSchema = { count: number().int().nonnegative() }`.
- `activeTimetableSchema = { id, ordinal: int, effectiveFrom: ISO date string }` and `activeTimetablesResponseSchema = { items: activeTimetable[], defaultSelectedId: number | null }`.
Both ends import these; web validates responses, api validates outputs — same as `healthResponseSchema`.

**5. Formatting lives in the web layer.**
Visit count formatted via `Intl.NumberFormat('vi-VN')`; effective date formatted `dd/mm/yyyy` from the ISO string. The API returns raw values (integer count, ISO date) so formatting stays presentation-only.

**6. New web feature folder `features/timetable-home`.**
Replaces `features/health/HomePage` as the `/` element in `Router.tsx`. Header composed of small components (title/subtitle, visit line, TKB button list) using shadcn `button` primitive; selected state tracked in local React state seeded from `defaultSelectedId`. The `features/health` slice stays as-is (still exercised by `/health` + its tests) but is no longer the landing page.

## Risks / Trade-offs

- **Best-effort counting (StrictMode/refresh/bots inflate or, rarely, miss counts)** → Accept; spec requires "once per home-page load", not exact analytics. Guard the client call to avoid dev double-fire.
- **Concurrent increments racing** → Mitigated by a single atomic SQL `UPDATE ... count + 1` in the repository, not a read-then-write in the service.
- **Seed data vs. future Excel import ownership of `timetable` rows** → Keep the schema minimal and import-compatible; seed rows are clearly marked and can be removed/overwritten by the import change.
- **No auth on `POST /visits`** → Low value target; out of scope for this change. Can add rate-limiting later without changing the contract.

## Migration Plan

1. Add `visit_counter` and `timetable` tables to the Drizzle schema; generate a migration with drizzle-kit.
2. Seed `visit_counter` with the single row (`id=1, count=0`) and seed a couple of active `timetable` rows (e.g. ordinals 1 and 2 with effective dates 01/09/2026 and 15/09/2026) so the view renders.
3. Deploy api + web together (shared contract is versioned in-repo). Rollback = revert the migration (drop the two new tables) and redeploy the prior web/api; the `health` slice is untouched so `/` can fall back if needed.
