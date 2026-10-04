# Proposal

## Why

The home view presents the timetable header and the list of active TKBs, but offers no way to actually look one up. The subtitle already promises lookup "theo lớp, học sinh hoặc giáo viên", yet that affordance does not exist. Users (students, parents, teachers) need to narrow from "all timetables" to the specific class, student, or teacher they care about.

## What Changes

- Add a three-tab lookup section below the home header with fixed Vietnamese tab labels: "Theo lớp" (by class), "Theo học sinh" (by student), "Theo giáo viên" (by teacher). The first tab is active by default.
- **Theo lớp**: a dropdown listing every class, loaded from the database. Classes belong to grades (e.g. grade 11 → 11A, 11B, 11C; grade 12 → 12A, 12B). Each class belongs to exactly one grade; the dropdown groups or orders classes by grade.
- **Theo học sinh**: an autocomplete search box over student names loaded from the database. Each student belongs to exactly one class. Matching students are suggested as the user types; the user picks one.
- **Theo giáo viên**: an autocomplete search box over teacher names loaded from the database. A teacher may teach many classes. Matching teachers are suggested as the user types; the user picks one (teacher identity only).
- Introduce database-backed reference data for grades, classes, students, and teachers, plus read endpoints to populate the selectors (list classes, search students, search teachers).
- Selecting a class, student, or teacher records the active selection within the lookup section. **Out of scope**: rendering, navigating to, or printing the resulting timetable for the selection — that is a separate future change. This change delivers the tabs, the selectors, and the data that feeds them only.

## Capabilities

### New Capabilities
- `timetable-lookup`: the three-tab lookup section on the home view — tab structure, the per-tab selectors (class dropdown, student autocomplete, teacher autocomplete), and recording the current selection. Does not cover displaying the selected schedule.
- `school-directory`: the reference data for the school's organizational entities (grades, classes, students, teachers) and the read/search endpoints that expose them for lookup.

### Modified Capabilities
<!-- None. The home header and TKB list behavior in timetable-home is unchanged;
     the lookup section is additive and owns its own requirements. -->

## Impact

- **Shared contracts** (`packages/shared`): new Zod schemas for class/grade listing, student search, and teacher search request/response shapes.
- **API** (`apps/api`): new Drizzle tables (`grade`, `class`, `student`, `teacher`) with seed data; new repositories, services, and routes for listing classes and searching students/teachers.
- **Web** (`apps/web`): new `timetable-lookup` feature — tabbed section with a class dropdown and two autocomplete inputs, wired via TanStack Query to the new endpoints, rendered below the existing home header.
- **Dependencies**: aim to reuse existing shadcn/ui primitives and current stack; any new primitive (e.g. combobox/command) is introduced via the shadcn CLI and flagged for approval before adding.
