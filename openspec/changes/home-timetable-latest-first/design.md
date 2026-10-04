# Design

## Context

The home view fetches `GET /timetables/active`, which returns `items` (active
TKBs) plus a `defaultSelectedId`. Today:

- The API repository `listActiveTimetables` returns rows **ascending** by
  `effectiveFrom` (`apps/api/src/repositories/timetable.ts`), and the home view
  renders `TimetableButtons` in that order (`HeaderParts.tsx`,
  `TimetableHomePage.tsx`).
- `computeDefaultSelectedId` (`apps/api/src/services/timetable.ts`) picks the
  latest row with `effectiveFrom <= today`, else the earliest upcoming row. It
  documents and relies on rows being ascending.
- The home view seeds its selection from `defaultSelectedId`
  (`TimetableHomePage.tsx`), and the user can still pick another TKB.

The admin list already sorts newest-first client-side (`useAdminTimetables.ts`,
`sortNewestFirst`) and is out of scope.

## Goals / Non-Goals

**Goals:**
- Home TKB buttons render newest-first (descending by effective date).
- The default-selected TKB is the latest (newest by effective date).

**Non-Goals:**
- Changing which TKBs are active (import/toggle behavior unchanged).
- Changing the admin page.
- Changing the lookup section or selection-switching behavior.

## Decisions

### Order the buttons newest-first in the web layer
Sort `items` descending by `effectiveFrom` where the home view renders them,
keeping ordering a presentation concern of the home feature. The API response
shape is unchanged, so other consumers (e.g. tests asserting the raw list) are
unaffected. Rationale: the only consumer that needs newest-first is the home
view; sorting there avoids changing the repository's ascending contract that
`computeDefaultSelectedId` and other callers depend on. Alternative considered:
reverse the order in the API/repository — rejected because `computeDefaultSelectedId`
and existing API tests assume ascending rows, so it would ripple further for no
added benefit.

### Default to the latest TKB
Change `computeDefaultSelectedId` to return the **latest** TKB by effective date
(the last row when ascending, or equivalently the max `effectiveFrom`), instead
of the latest row already in effect today. The function keeps its signature and
its "rows ascending" precondition, so callers are unchanged; only the selection
rule changes. The `today` argument becomes unused by the new rule — keep the
parameter to avoid churn in callers/tests, or drop it if lint flags it; prefer
keeping the signature stable and referencing it minimally if needed. Rationale:
"newest schedule up front" is the stated intent; tie behavior to effective date,
consistent with the display order.

## Risks / Trade-offs

- **Default now ignores "today"**: a future TKB (effective later) will be the
  default even before it takes effect. This is the intended "latest" behavior;
  accepted per the request.
- **Ordering lives in two places** (home view desc, admin already desc): minor
  duplication, but each is a local presentation choice; no shared sort utility
  is warranted for two call sites.
- **Test updates**: `computeDefaultSelectedId` unit tests and home-view ordering
  tests must be updated to the new expectations; covered in tasks.
