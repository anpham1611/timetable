# Tasks

## 1. Database schema & migration

- [x] 1.1 Add `period`, `subject`, `room`, `lesson`, `lesson_teacher`, `student_lesson` tables to `apps/api/src/db/schema.ts`; add `short_code` to `teacher` and `home_room_id` (nullable FK → `room`) to `class`.
- [x] 1.2 Generate and run the Drizzle migration (`pnpm --filter @timetable/api run db:generate` then `db:migrate`).
- [x] 1.3 Keep `testdb.ts` in sync so in-memory test DBs include the new tables.

## 2. Seed data

- [x] 2.1 Seed the ten canonical `period` rows (SÁNG 1–5 with times, CHIỀU 1–5; afternoon period 1 time-less) idempotently.
- [x] 2.2 Seed subjects (with short codes), rooms, class home rooms, and teacher short codes.
- [x] 2.3 Seed `lesson` rows for at least one class covering a regular cell, a multi-teacher cell, a room-move cell, and elective slots; add `lesson_teacher` and `student_lesson` rows so a student's electives resolve and a teacher's grid is populated. Keep the seed idempotent.

## 3. Shared contract

- [x] 3.1 Add `packages/shared/src/schemas/grid.ts`: `weekGridSchema` (days, sessions, periods) and a unified `gridCellSchema` (subject, shortCode, teachers[], className?, room?, isRoomMove?, choiceGroup?, category?, empty flag).
- [x] 3.2 Add request/response schemas for resolve-by-class, resolve-by-student, resolve-by-teacher, including a not-found shape. Export from `packages/shared/src/index.ts`.
- [x] 3.3 Unit-test the schemas (valid grid, empty cell, elective cell, teacher cell).

## 4. API: repository layer

- [x] 4.1 Add `apps/api/src/repositories/grid.ts`: query periods/days, class lessons, student elective enrollments, and teacher lessons with the necessary joins (subject, room, teachers).
- [x] 4.2 Unit-test the repository against an in-memory seeded DB.

## 5. API: service layer

- [x] 5.1 Add `apps/api/src/services/grid.ts`: a `WeekGrid` builder plus `resolveClassGrid`, `resolveStudentGrid`, `resolveTeacherGrid`. Derive room-move (`room_id` ≠ class `home_room_id`); resolve student electives via `student_lesson`; return `null` for unknown class/student/teacher.
- [x] 5.2 Unit-test each resolver, including: every slot present (empty where no lesson), multi-teacher cell, student elective resolution, teacher cross-class grid, and the unknown-id → null path.

## 6. API: routes

- [x] 6.1 Add `apps/api/src/routes/grid.ts`: `GET /grids/class/:classId`, `/grids/student/:studentId`, `/grids/teacher/:teacherId`, validating input and responding 404 on null. Register the routes.
- [x] 6.2 Route tests: 200 with a valid grid body per view; 404 for unknown ids.

## 7. Web: grid view component

- [x] 7.1 Add `apps/web/src/features/timetable-grid-view` with a `TimetableGrid` rendering a `WeekGrid`: result header, period/time column, Thứ 2–Thứ 7 headers, SÁNG/CHIỀU session rows, em-dash empties.
- [x] 7.2 Implement today-column highlight by mapping current weekday (JS Sun=0) to the Thứ 2–7 grid; no highlight on Sunday. Cover the mapping with a test.
- [x] 7.3 Implement per-view cell content: class/student "GV:" teacher line; teacher "Lớp:" class line; student elective choice-group label + room + room-move indicator.
- [x] 7.4 Ensure horizontal scroll at 375px via the scroll container; keep print-specific styling isolated behind Tailwind `print:` variants.

## 8. Web: wire lookup selection to render

- [x] 8.1 In `timetable-lookup`, on class/student/teacher selection, fetch the matching grid via TanStack Query and render `TimetableGrid` in the result area; replace the grid when the selection changes.
- [x] 8.2 Show loading and not-found states in the result area instead of a broken/empty grid.
- [x] 8.3 Component tests: selecting each target renders its grid; loading and not-found states render.

## 9. Verification

- [x] 9.1 Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` from the repo root; all pass.
- [x] 9.2 Manually verify the three rendered views visually match the provided HTML examples (class, student with electives/room-moves, teacher).

## 10. Lesson ↔ timetable (TKB) scoping

- [x] 10.1 Add `timetable_id` (FK → `timetable`) to `lesson` in schema + `testdb.ts`; regenerate and run the migration.
- [x] 10.2 Assign seeded lessons to a published TKB; seed a second TKB with a differing schedule to prove independence.
- [x] 10.3 Add an optional timetable selector to the resolve contracts/endpoints (`?tkb=`); scope repository lesson queries by `timetable_id`; default to the active/default TKB and 404 when none resolves.
- [x] 10.4 Web: pass the home view's selected TKB (falling back to the default) into the lookup result fetches.
- [x] 10.5 Tests: per-TKB resolution (explicit tkb, default, no active TKB → 404).
