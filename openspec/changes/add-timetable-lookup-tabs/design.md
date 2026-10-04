# Design

## Context

See proposal.md — Why. The repo follows strict one-way API layering (`routes → services → repositories → drizzle → db`), shared Zod contracts in `packages/shared`, and a web stack of React 19 + TanStack Query + React Router + shadcn/ui + Tailwind. Existing patterns to mirror: `apps/api/src/{routes,services,repositories}/timetable.ts`, `packages/shared/src/schemas/timetable.ts`, and the web feature folder `apps/web/src/features/timetable-home/`. The current `db/schema.ts` has only `health_check`, `visit_counter`, and `timetable` tables and a `db/seed.ts` — no school directory tables yet.

## Goals / Non-Goals

**Goals:**
- Model grades, classes, students, teachers in the Drizzle/SQLite schema with the cardinalities from the spec, seeded with sample data.
- Expose three read endpoints (list classes, search students, search teachers) behind shared Zod contracts.
- Render a three-tab lookup section below the home header, each tab wired to its endpoint via TanStack Query, recording a per-tab selection in local component state.

**Non-Goals (design-level):**
- No rendering/printing/navigation of the selected schedule (deferred, per proposal).
- No write/admin endpoints for the directory — reference data arrives via seed (and later the Excel-import feature).
- No pagination/infinite-scroll on search; a bounded result cap is sufficient for school-sized rosters.

## Decisions

**Data model.** Four tables: `grade(id, name)`, `class(id, name, grade_id→grade)`, `student(id, name, class_id→class)`, `teacher(id, name)`, plus a `teacher_class(teacher_id→teacher, class_id→class)` join to express the teacher↔many-classes relationship. The join table is added now (the relationship is part of the spec) even though this change does not yet read it for selection — it keeps the schema coherent and avoids a later migration that touches teacher identity.
- *Alternative considered*: a comma-list column on teacher. Rejected — not relational, breaks future per-teacher-class queries.

**Endpoints.** Three GET routes:
- `GET /classes` → `{ items: [{ id, name, grade: { id, name } }] }`, ordered by grade then class name so the client can group without extra logic.
- `GET /students?q=` → `{ items: [{ id, name, class: { id, name } }] }`, name-substring match, empty/absent `q` → empty list (validation via shared schema), results capped (e.g. 20).
- `GET /teachers?q=` → `{ items: [{ id, name }] }`, same query semantics and cap.
- *Alternative considered*: one generic `/directory/search?type=`. Rejected — weaker typing and muddier contracts than three explicit resources.

**Search semantics.** Case-insensitive substring match done in the repository layer (SQL `LIKE` / `lower()`), not the service, keeping SQL in the repository per the layering rule. Diacritics-insensitivity for Vietnamese names is deferred to Open Questions — it does not change contracts or the task breakdown.

**Web composition.** A new `apps/web/src/features/timetable-lookup/` feature with a `TimetableLookupSection` rendering a shadcn Tabs component; three child components (`ByClassTab`, `ByStudentTab`, `ByTeacherTab`) own their query hook and selection state. The section mounts inside `TimetableHomePage` below the header, keeping `timetable-home` behavior untouched. Autocomplete uses shadcn's Command/Combobox primitive; the class picker uses a Select. Any primitive not already vendored is added via the shadcn CLI and flagged before install (per AGENTS.md "ask before adding a dependency").

**Selection state.** Held in component state per tab (lifted to the section only if a later change needs the selection); no router/URL coupling yet, since nothing downstream consumes the selection in this change.

## Risks / Trade-offs

- [New shadcn primitive (combobox/command) may be an unvendored dependency] → Confirm with the user before adding via the shadcn CLI; fall back to a plain filtered input + list if approval is withheld.
- [Substring search without diacritics folding may miss "Nguyễn" when typing "Nguyen"] → Acceptable for the first cut; revisit as an Open Question without contract changes.
- [Seed data shape could drift from real Excel-import data] → Keep seed minimal and representative (≥2 grades, several classes, a handful of students/teachers) purely to exercise the selectors.

## Open Questions

- Diacritics-/accent-insensitive matching for Vietnamese names — desirable, but can be added later purely in the repository layer without changing specs, contracts, or tasks.
