# Proposal

## Why

The lookup tabs let a user narrow to a specific class, student, or teacher, but selecting one does nothing visible — the previous change explicitly deferred "rendering, navigating to, or printing the resulting timetable" to a future change. This is that change: a selection must now produce the actual weekly schedule grid, which is the whole point of the app for students, parents, and teachers. Delivering it also requires schedule data that does not exist yet (the current `timetable` table is only a published-TKB header with an ordinal and effective date).

## What Changes

- Introduce schedule-grid data: the weekly structure (days Thứ 2–Thứ 7, two sessions SÁNG/CHIỀU, periods with named start/end times), subjects (with short display codes), rooms, teacher short codes (e.g. `Anh.NV`), and the lesson placements that fill each cell of the grid.
- Model the richness the real timetables show:
  - **Electives / choice groups** (Tự chọn TC1–TC4, Ngoại ngữ 2): a single slot where different students in the same class attend different subjects, each with its own teacher and (optionally) a different room.
  - **Room moves**: a lesson that is taught in a room other than the class's home room carries a room and a move note (the `*` note-flag).
  - **Multi-teacher cells**: one lesson taught by more than one teacher (e.g. `GV: Tâm.HM, Mai.NH`; `GV: Quyên+Thal+Vân`).
  - **Cell categories**: a lesson category used to color cells (the examples' `data-type` values).
- Expose read endpoints that resolve a full weekly grid for a given class, a given student, or a given teacher, returning everything the view needs per cell.
- Render three grid views that faithfully reproduce the provided HTML examples:
  - **By class**: every cell shows subject + teacher short code; the class's full schedule.
  - **By student**: the student's class schedule, but electives resolved to the subject that student actually attends, with room, room-move note, and choice-group label shown.
  - **By teacher**: only the slots that teacher teaches, each cell showing the subject and the class taught (`Lớp: 11A5`).
  - All three share the grid chrome: period column with times, day headers, SÁNG/CHIỀU session rows, today-column highlight, empty-cell `—`, and horizontal scroll on narrow (mobile-first 375px) screens.
- Selecting a class, student, or teacher in the lookup tabs renders that grid in the result area; this adds the rendering trigger the lookup tabs intentionally deferred.
- Seed data (classes, students, teachers, subjects, rooms, periods, lessons) is extended so the three views are populated for a demo/dev grid. **Out of scope**: Excel import of timetables (a separate future change) and printing/PDF export.

## Capabilities

### New Capabilities
- `schedule-grid-data`: the weekly schedule structure (days, sessions, periods) and the lesson placements that fill it — subjects, rooms, teacher codes, electives/choice groups, room moves, multi-teacher cells — plus the read endpoints that resolve a complete weekly grid for a class, a student, or a teacher.
- `timetable-grid-view`: the rendered weekly timetable grid on the result area for a class, student, or teacher selection — grid chrome (periods/times, day headers, sessions, today highlight, empty cells, mobile scroll) and the per-view cell content and elective/room-move presentation.

### Modified Capabilities
<!-- None. The lookup tabs' selection behavior (from the not-yet-archived
     add-timetable-lookup-tabs change) is additively extended: `timetable-grid-view`
     owns the new "selection triggers grid render" requirement rather than modifying
     a timetable-lookup spec that does not yet exist in openspec/specs/. -->

The by-class / by-student / by-teacher selection in `timetable-lookup` was intentionally
render-free; this change adds the rendering trigger as a new requirement under
`timetable-grid-view`, so no existing main spec requires a MODIFIED delta.

## Impact

- **Shared contracts** (`packages/shared`): new Zod schemas for a resolved weekly grid (days, sessions, periods, cells) and the by-class / by-student / by-teacher resolve request/response shapes.
- **API** (`apps/api`): new Drizzle tables (`period`, `subject`, `room`, plus teacher short code, and `lesson` with elective-group / room / category / multi-teacher support) with extended seed data; new repository/service/route to resolve a grid by class, student, or teacher. Follows the strict `routes → services → repositories → drizzle` layering.
- **Web** (`apps/web`): `timetable-grid-view` feature rendering the grid; `timetable-lookup` wired so a selection fetches and displays the grid via TanStack Query. Print-friendly styling kept isolated behind Tailwind `print:` variants for a later print change.
- **Dependencies**: reuse the current stack and existing shadcn/ui primitives; no new dependency expected (flag for approval if one becomes necessary).
