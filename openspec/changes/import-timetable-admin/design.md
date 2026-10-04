# Design

## Context

See proposal.md — Why. The data model already exists in `apps/api/src/db/schema.ts`: `timetable` (TKB), `grade`/`room`/`class`/`student`/`teacher`/`teacher_class` (directory), and `subject`/`period`/`lesson`/`lesson_teacher`/`student_lesson` (schedule). Today the directory tables are **global** (shared across TKBs) and reads assume that. The DB is `better-sqlite3` (synchronous), which gives real synchronous transactions via `db.transaction(fn)` — the basis for an all-or-nothing import.

The TKB-scoping behavior (directory reads and grids following the active/selected timetable) logically belongs to the `school-directory`, `timetable-lookup`, `schedule-grid-data`, and `timetable-grid-view` capabilities — but those are defined by **sibling in-flight changes** (`add-timetable-lookup-tabs`, `render-timetable-grid-views`), not yet archived into `openspec/specs/`. Rather than author deltas against unarchived specs owned by another change, this change specifies the scoping as a new `timetable-directory-scope` capability. When those siblings archive, the scoping requirements can be reconciled into them.

## Goals / Non-Goals

**Goals:**

- A single admin boundary reused by every admin route (list-all, toggle, import, template).
- Import is atomic: parse + validate entirely before any write, then insert inside one DB transaction, so any failure leaves zero trace.
- Normalized, referentially-validated workbook with **located** errors (sheet, row, value, message), failing on the first error.
- Insert-only history: each import is a self-contained TKB snapshot; never update, reuse, or delete.
- Keep the Excel format knowledge in one place so the parser and the generated template cannot drift.
- Preserve strict one-way layering: routes do auth + HTTP, services do parsing/validation/orchestration, repositories do the only SQL.

**Non-Goals:**

- No streaming/async import (files are small); no background job queue.
- No per-student elective resolution — electives are class-level only.
- No "collect all errors" mode — fail on the first error by decision.
- No merge/update/delete of prior imports.

## Decisions

### Admin gate as a Fastify preHandler reading a shared token

Admin routes sit under a prefix guarded by a `preHandler` comparing the `x-admin-token` header against `ADMIN_TOKEN` (constant-time). Missing/empty config ⇒ always reject (fail closed). *(Unchanged from the original design and already implemented.)*

### `exceljs` for both reading and template generation

One library reads the uploaded `.xlsx` and writes the downloadable template, so the sheet/column contract lives in a single format module consumed by both — the "cannot drift" mechanism. `@fastify/multipart` delivers the upload buffer to the import service.

### Normalized multi-sheet workbook

Six sheets, each entity declared once with an explicit business code, later sheets referencing codes:

- **Meta**: `effectiveFrom` (YYYY-MM-DD).
- **Grade**: `gradeCode`, `gradeName`.
- **Class**: `classCode`, `className`, `gradeCode` (→Grade), `homeRoom?`.
- **Teacher**: `teacherCode`, `teacherName`.
- **Student**: `studentCode`, `studentName`, `classCode` (→Class).
- **Lesson**: `classCode` (→Class), `day` (2–7), `session` (SANG/CHIEU), `periodOrdinal` (1–5), `subjectName`, `subjectShortCode`, `teacherCodes?` (comma-separated →Teacher), `room?`, `choiceGroup?`.

Explicit codes (over human names) make referential validation robust against duplicate names and typos. Lessons reference a **class only**; a student's schedule derives from their class. `choiceGroup` present marks an elective slot (multiple lessons allowed); absent requires a unique slot.

### Validation pipeline: structural → referential/field, fail-fast, located

Parsing builds an in-memory model sheet by sheet in dependency order (Grade → Class → Teacher → Student → Lesson). Validation runs in two tiers and **throws on the first error**:

1. **Structural**: all six sheets present; each sheet's header row matches its contract.
2. **Row-level**: required non-empty fields; `day/session/periodOrdinal` ranges; `effectiveFrom` format; unique business codes within a sheet; cross-sheet references resolve (Class→Grade, Student→Class, Lesson→Class/Teacher); non-elective slot uniqueness.

Errors are a structured value `{ sheet, row, column?, message }` surfaced to the admin (e.g. *"Sheet 'Lesson', row 14: teacherCode 'NVA' not found in Teacher sheet"*). This is exposed via a dedicated `ImportParseError` carrying the structured location, and a matching shared Zod error schema for the HTTP 400 body.

### Insert-only, TKB-scoped snapshots (schema change)

Each import inserts a complete, independent copy of grade/class/teacher/student/subject/room/lesson, all tagged with the new `timetable_id`. No resolve-or-create against prior data. This requires a **migration** adding a nullable-then-backfilled `timetable_id` foreign key to the directory tables (`grade`, `room`, `class`, `student`, `teacher`, `subject`). `teacher_class`/`lesson_teacher`/`student_lesson` remain join rows scoped transitively through their parents. The existing seed data is either migrated under a seed TKB or the seed is updated to assign a timetable.

Alternative considered: keep the directory global and resolve-or-create (the original design). Rejected — it conflicts with "always insert, keep all history," reuses/mutates shared rows, and makes typos permanent global junk.

### TKB-scoped reads

Directory repositories (`school directory`: class list, student/teacher search) and grid repositories gain a `timetableId` filter. Services resolve the timetable the same way grids already do: an explicit selector, else the default active TKB (`computeDefaultSelectedId`), else empty/not-found. The web lookups already thread a `timetableId` (the home view's selection) into their queries; the API honors it for the directory too.

### Room move derived from home room

Room-move is computed at read time (already the case in `grid.ts`): `isRoomMove = lesson.roomId !== null && class.homeRoomId !== null && lesson.roomId !== class.homeRoomId`. Adding the `homeRoomId !== null` guard prevents false "room move" flags for classes with no home room.

### New ordinal on import

The new TKB's `ordinal` is the next value after the current max, keeping `TKB {n}` labels monotonic. Effective date comes from Meta. *(Unchanged.)*

## Risks / Trade-offs

- **Schema migration touches existing read paths** → directory/grid repositories and their tests must be updated to filter by timetable; seed data must be assigned a TKB. Mitigation: do the migration + read changes as their own task group with tests before wiring the new importer.
- **Duplicate-name entities across a workbook** → explicit business codes disambiguate; duplicate codes within a sheet are a validation error.
- **Insert-only snapshots grow the DB per import** → acceptable; each TKB is bounded by a school's size, and history retention is the explicit goal. No dedupe by design.
- **Shared token is coarse** (no per-user audit/rotation flow) → acceptable given the accounts non-goal; fails closed when unset.
- **exceljs loads the whole workbook into memory; one synchronous transaction briefly blocks the event loop** → fine at school data scale; cap upload size via multipart limits.

## Migration Plan

- **DB migration**: add `timetable_id` to `grade`, `room`, `class`, `student`, `teacher`, `subject`; backfill existing rows under a seed/legacy TKB (or regenerate seed). Generated via `drizzle-kit`.
- **Read changes**: update directory/grid repositories + services to filter by the resolved timetable; update their tests.
- **Importer**: replace the single-sheet parser/template/persistence with the multi-sheet, validated, insert-only versions.
- Deploy still requires `ADMIN_TOKEN`; admin routes fail closed until set. Rollback removes the new routes/dependency and the migration; imported TKBs are inactive-by-default and invisible unless activated.

## Open Questions

- Seed strategy: migrate current seed rows under one synthetic TKB vs. rewrite the seed to produce a full snapshot. Resolve during the migration task; it does not change the specs or the import contract.
