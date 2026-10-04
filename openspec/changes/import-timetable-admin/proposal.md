# Proposal

## Why

The system can already render and look up timetables (TKBs), but there is no way to get timetable data into it — the `timetable` and `lesson` tables are populated only by the seed script. Schools receive their weekly schedule as an Excel file, so administrators need a way to upload that file, have it become a new published timetable, and control which timetables are visible to students and teachers.

## What Changes

- Add an admin-only Excel import flow: an administrator uploads a `.xlsx` file and the system creates a brand-new timetable (TKB) from it. Every import creates a new TKB; imports never overwrite, update, or merge into an existing one, so all prior imports are kept as history.
- The workbook is **normalized across six sheets** — Meta, Grade, Class, Teacher, Student, Lesson — where each entity is declared once with an explicit business code and later sheets reference those codes.
- The importer **validates structurally and referentially**, failing on the first error with a located message (sheet name, row number, offending value, description): required sheets/columns, unique business codes, valid day/session/period, and cross-sheet references (Class→Grade, Student→Class, Lesson→Class/Teacher).
- Each import **inserts a complete, independent directory-and-lesson snapshot scoped to the new TKB** (grades, classes, teachers, students, subjects, rooms, lessons). Nothing is reused, updated, or deleted across imports — pure insert.
- Lessons are placed for a **class** (students belong to a class; a lesson does not reference individual students). Room moves are derived only when a class has a home room that differs; elective slots (choice-group label) allow multiple lessons in one slot.
- A newly imported TKB starts **inactive** (not shown on the home view) until an admin explicitly activates it.
- **Directory reads become TKB-scoped**: the class list, student search, teacher search, and resolved grids resolve against the active/selected timetable's snapshot — when TKB-1 is active you see only TKB-1's classes/students/teachers.
- Add an admin management page that lists all timetables (active and inactive), lets an admin activate/deactivate each one, and lets an admin start a new import.
- Provide a downloadable Excel template describing the expected multi-sheet format, so admins fill in a known shape.
- Gate all admin capabilities (import, list-all, activate/deactivate, template download) behind a shared admin token supplied via configuration; non-admin requests are rejected.

Out of scope: per-user accounts/roles/login, editing individual lessons through the UI, deleting timetables, re-importing into an existing TKB, and per-student elective resolution (electives are shown at the class level only).

## Capabilities

### New Capabilities

- `timetable-admin`: Admin-gated management of published timetables — listing all TKBs with their active state and toggling each TKB active/inactive. Owns the admin authorization boundary and the lifecycle of a TKB's visibility.
- `timetable-import`: Parsing an uploaded multi-sheet Excel workbook into a new published timetable — structural and referential validation with located errors, inserting a TKB-scoped directory-and-lesson snapshot as an all-or-nothing operation, and providing the downloadable template.
- `timetable-directory-scope`: Scoping directory reads (class list, student/teacher search) and resolved grids to the active or selected timetable's snapshot, so each TKB presents its own self-contained directory.

### Modified Capabilities

<!-- The school-directory, timetable-lookup, schedule-grid-data, and timetable-grid-view
     capabilities are defined by sibling in-flight changes, not yet archived into
     openspec/specs/. Their TKB-scoping behavior is specified here under the new
     timetable-directory-scope capability rather than as deltas against unarchived
     specs; see design.md. -->

## Impact

- **Database**: schema migration adding `timetable_id` to the directory tables (grade, class, teacher, student, subject, room) so each import is a self-contained snapshot. Existing global-directory assumptions change.
- **API**: new admin routes under an authenticated prefix (list all timetables, toggle active state, import workbook, download template); new `services/` for multi-sheet parsing/validation and timetable administration; new insert-only `repositories/` writes. Existing directory/grid read repositories and services change to filter by timetable. One-way layering (routes → services → repositories → drizzle) is preserved.
- **Shared contracts**: new Zod schemas in `packages/shared` for the admin timetable list, the activate/deactivate request, the import result summary, and the structured (located) import error.
- **Web**: a new admin feature (route + page) for managing and importing timetables, including a template download link; the lookups carry the selected timetable into directory queries.
- **Dependencies**: adds `exceljs` (backend) for reading `.xlsx` and generating the template, and `@fastify/multipart` for upload — new dependencies in `apps/api`.
- **Config**: a new admin-token environment variable the API reads to gate admin routes.
