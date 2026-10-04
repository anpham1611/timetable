# Proposal

## Why

Students, parents, and teachers land on the app to look up a timetable, but today the home page is only a scaffold stub. They need a clear Vietnamese header that explains what the app is, when the schedule applies, how to look it up, and which published timetable (TKB) they are currently viewing. The school also wants to see how much the page is being used.

## What Changes

- Replace the scaffold home page with a Vietnamese timetable header containing four lines:
  - Title: "Thời khóa biểu".
  - Subtitle: "Áp dụng từ 07/09/2026 · tra theo lớp, học sinh hoặc giáo viên".
  - A visit counter line: "Lượt truy cập: {count}", where `{count}` is a running total that increments on every home-page load and is formatted with vi-VN thousands separators (e.g. `9.000`).
  - A horizontal list of buttons, one per active (non-archived) published TKB, labelled "TKB {n} - {dd/mm/yyyy}". Exactly one button is highlighted as the active/selected TKB using the primary color; clicking another active TKB selects it and moves the highlight.
- Add a global visit counter persisted in the database that increments once per home-page load and is read back for display.
- Add a backend concept of a published timetable (TKB) record with an effective date and an active flag, plus an endpoint to list active TKBs ordered for display. (Excel import that populates these records is a later, separate change; this change only reads/lists them and seeds a small amount of data for the view.)
- Define shared Zod contracts for the visit-counter response and the active-TKB list response, used by both web and api.

Out of scope: the actual timetable grid/lookup by class/student/teacher, Excel import, print layout, and TKB archival/management UI. Selecting a TKB updates which one is highlighted and marked as viewed; rendering its schedule content arrives in later changes.

## Capabilities

### New Capabilities
- `timetable-home`: The landing view that presents the timetable header — title, applicability subtitle, visit-count line, and the selectable list of active published timetables (TKBs) with a default-selected one.
- `visit-counter`: A persistent global page-visit tally that increments on each home-page load and is exposed for display.

### Modified Capabilities
<!-- None. design-system (visual foundation) is unaffected at the requirement level. -->

## Impact

- **packages/shared**: new Zod schemas/types for the visit-counter response and the active-TKB list item/response.
- **apps/api**: new Drizzle tables (`visit_counter`, `timetable` / TKB), repositories, services, and routes to increment+read the visit counter and to list active TKBs; a migration and minimal seed data.
- **apps/web**: replace `features/health/HomePage.tsx` usage on `/` with a new `features/timetable-home` view; TanStack Query hooks to post/read the visit count and fetch active TKBs; header components styled mobile-first with Tailwind and shadcn/ui button primitives.
- **Database**: new tables + migration via drizzle-kit.
