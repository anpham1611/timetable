# Design

## Context

The directory data (`grade`, `class`, `student`, `teacher`, `teacher_class`) and the lookup tabs already exist; a selection currently records a target but renders nothing. The `timetable` table is only a published-TKB header (ordinal, effectiveFrom, isActive) — it holds no schedule cells. There is no period/subject/room/lesson model and no grid-resolve endpoint. The stack is fixed: Fastify + Drizzle/SQLite with strict `routes → services → repositories → drizzle` layering; shared Zod contracts in `packages/shared`; React 19 + TanStack Query + Tailwind + shadcn/ui on the web, mobile-first at 375px. The three provided HTML examples are the fidelity target for the rendered grid.

## Goals / Non-Goals

**Goals:**
- A schedule data model expressive enough to resolve all three example grids: periods with times, two sessions, six days, subjects with short codes, rooms with a home-room concept, teacher short codes, multi-teacher cells, elective choice-groups, and per-student elective enrollment.
- Three resolve endpoints (by class, by student, by teacher) returning one uniform `WeekGrid` shape the view renders directly — the view does no slot arithmetic.
- Faithful rendering of the example grids, including today-highlight, SÁNG/CHIỀU session rows, em-dash empties, and horizontal scroll at 375px.
- Seed data rich enough to demonstrate every cell variant end-to-end.

**Non-Goals:**
- Excel import of real timetables (separate future change — seed data only here).
- Printing / PDF export (print-specific styling is isolated behind `print:` but not a deliverable here).
- Editing timetables; multiple concurrent published TKBs; calendar-date-specific lessons (model is a recurring weekly pattern).

## Decisions

### Data model

New tables (Drizzle/SQLite), additive to the existing schema:

- `period` — `(id, session TEXT 'SANG'|'CHIEU', ordinal 1..5, start_time TEXT?, end_time TEXT?)`. The ten canonical rows (2 sessions × 5) are seeded; times nullable (afternoon period 1 has no time in the examples).
- `subject` — `(id, name, short_code)` e.g. `("Ngữ văn","Ngữ văn")`, `("Sinh học","Sinh học #1")`. Short code is the cell display label.
- `room` — `(id, name)`. Each class has a home room: add `home_room_id` to `class` (nullable) rather than a new table.
- `teacher.short_code` — add a short-code column to `teacher` (e.g. `Anh.NV`); the existing `name` stays for the directory/search.
- `lesson` — the core placement: `(id, timetable_id, class_id, period_id, day INTEGER 2..7, subject_id, room_id?, category INTEGER?, choice_group TEXT?)`. `timetable_id` ties the lesson to one published TKB, so a class can have a different schedule in each TKB. `day` uses the Thứ number. `choice_group` non-null marks an elective lesson (multiple lessons can share the same `timetable_id + class_id + day + period_id` when elective).
- `lesson_teacher` — join `(lesson_id, teacher_id)` for multi-teacher cells.
- `student_lesson` — join `(student_id, lesson_id)` recording which elective lesson a student attends. Non-elective lessons apply to the whole class and need no row here.

Room-move is derived, not stored: a lesson is a "move" when `room_id` is set and differs from the class's `home_room_id`.

### Resolve logic (service layer)

One internal builder produces a `WeekGrid` = ordered days + `[{session, periods:[{period, cell}]}]`. Each resolver first selects the published TKB: an explicit `timetableId` when supplied, otherwise the default active TKB (the home view's `defaultSelectedId` — the active TKB with the highest ordinal). When no timetable is resolved (no active TKB and none requested) the resolver returns `null` → 404. All lesson queries are then scoped to that `timetable_id`. The three endpoints differ only in cell selection:

- **Class grid**: all non-elective lessons for the class; elective slots represented as a choice-group cell (the view shows the slot without implying one subject). Keeps the class view simple and matches example 1.
- **Student grid**: start from the student's class; for elective slots, replace with the single lesson joined through `student_lesson`; compute room-move and attach `choice_group`. Matches example 2.
- **Teacher grid**: all lessons joined through `lesson_teacher` for the teacher, across all classes; empty elsewhere; cell shows subject + class name. Matches example 3.

All repository queries live in a new `repositories/grid.ts`; services in `services/grid.ts`; routes in `routes/grid.ts` — mirroring the existing `directory.*` triple. Unknown id → service returns `null` → route responds 404.

### Shared contract

New `packages/shared/src/schemas/grid.ts`: `weekGridSchema` (days, sessions, periods, cells) and a discriminated cell (`empty` | `class` | `student` | `teacher` variants, or one unified cell with optional fields). Prefer one unified `GridCell` with optional `room`, `isRoomMove`, `choiceGroup`, `className`, `teachers[]`, `category` so the three endpoints share one response type and the view switches on which fields are present. Endpoints: `GET /grids/class/:classId`, `/grids/student/:studentId`, `/grids/teacher/:teacherId`, each accepting an optional `?tkb=<timetableId>` query; omitting it resolves the default active TKB.

### Web rendering

New `features/timetable-grid-view` with a `TimetableGrid` component rendering the shared `WeekGrid` (chrome, session rows, today-highlight via current weekday, em-dash empties, `.tt-scroll` horizontal scroll). `timetable-lookup` calls the matching resolve endpoint via TanStack Query on selection, passing the TKB currently selected on the home view (falling back to the default active TKB), and renders `TimetableGrid` in the result area, with loading and not-found states. Cell presentation branches by present fields (teacher line "GV:" for class/student, "Lớp:" for teacher, elective label + room-move indicator for student). Styling reuses the example's class names and Tailwind, with `print:` variants isolated.

## Risks / Trade-offs

- **Unified cell vs. discriminated union**: a single optional-field cell is simpler to share but lets the view read a field that an endpoint never sets. Mitigation: the view branches on the selection mode it requested, and tests cover each endpoint's cell shape.
- **Elective modeling**: `choice_group` + `student_lesson` is flexible but under-constrained (a student could be enrolled in two electives in one slot). Acceptable for seed-driven data now; Excel import will own validation later.
- **Home-room on `class`**: adding `home_room_id` couples class to room; acceptable and simpler than a separate mapping table for one home room per class.
- **Seed complexity**: rich seed data is the main effort and the only way to exercise every cell variant without Excel import; kept idempotent and isolated in `seed.ts`.
- **`day` as Thứ-number (2..7)**: convenient and matches the domain, but off-by-one against JS `getDay()` (Sun=0) — the today-highlight mapping must be covered by a test.
