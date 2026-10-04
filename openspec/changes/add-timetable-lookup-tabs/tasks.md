# Tasks

## 1. Shared contracts

- [x] 1.1 Add `packages/shared/src/schemas/directory.ts` with Zod schemas: `classListResponse` (`items: [{ id, name, grade: { id, name } }]`), `studentSearchResponse` (`items: [{ id, name, class: { id, name } }]`), `teacherSearchResponse` (`items: [{ id, name }]`), and a shared `searchQuery` (non-empty string) schema. Export from `packages/shared/src/index.ts`. Verify `pnpm --filter @timetable/shared test` and `pnpm typecheck` pass.
- [x] 1.2 Add schema unit tests in `packages/shared/src/schemas/directory.test.ts` covering a valid class/student/teacher response and rejection of an empty search query. Verify the tests pass.

## 2. Database schema & seed

- [x] 2.1 Add `grade`, `class` (FK `grade_id`), `student` (FK `class_id`), `teacher`, and `teacher_class` (FKs `teacher_id`, `class_id`) tables to `apps/api/src/db/schema.ts` reflecting the spec cardinalities. Verify `pnpm --filter @timetable/api run db:generate` produces a migration.
- [x] 2.2 Run/wire the migration and extend `apps/api/src/db/seed.ts` with ≥2 grades, several classes per grade, a handful of students (each in one class), and a few teachers (at least one linked to multiple classes via `teacher_class`). Verify `pnpm --filter @timetable/api run db:migrate` succeeds and seeding runs without error.

## 3. API: list classes

- [x] 3.1 Add `listClasses()` to `apps/api/src/repositories/directory.ts` returning classes joined to their grade, ordered by grade then class name. Verify a repository test against the test DB returns seeded classes in grade order.
- [x] 3.2 Add a `directory` service `getClasses()` that maps repository rows to the `classListResponse` shape, and a `GET /classes` route validating the response against the shared schema. Verify a route test returns 200 with grouped class data and an empty list when none exist.

## 4. API: search students

- [x] 4.1 Add `searchStudents(q)` to the directory repository doing case-insensitive substring match on student name, joined to class, capped at 20. Verify a repository test matches by substring and returns class context.
- [x] 4.2 Add service `searchStudents(q)` and `GET /students?q=` route using the shared `searchQuery`/`studentSearchResponse` schemas; empty/missing `q` → empty list or validation error. Verify route tests cover a match, no-match (empty list), and empty query.

## 5. API: search teachers

- [x] 5.1 Add `searchTeachers(q)` to the directory repository doing case-insensitive substring match on teacher name, capped at 20. Verify a repository test matches by substring independent of classes.
- [x] 5.2 Add service `searchTeachers(q)` and `GET /teachers?q=` route using the shared schemas; empty/missing `q` → empty list or validation error. Verify route tests cover a match, no-match, and empty query.

## 6. Web: lookup section scaffold & tabs

- [x] 6.1 Ensure the shadcn Tabs, Select, and Command/Combobox primitives exist in `apps/web/src/components/ui/` (add via shadcn CLI only after confirming any new dependency with the user). Verify the components import and render in a smoke test.
- [x] 6.2 Create `apps/web/src/features/timetable-lookup/TimetableLookupSection.tsx` with three tabs labelled "Theo lớp", "Theo học sinh", "Theo giáo viên" (first active by default) and mount it in `TimetableHomePage` below the header. Verify a test asserts the three labels render in order, "Theo lớp" is active on load, and switching tabs changes the visible content.

## 7. Web: by-class tab

- [x] 7.1 Add `useClasses` TanStack Query hook calling `GET /classes`. Verify a hook test (mocked fetch) returns parsed class data.
- [x] 7.2 Build `ByClassTab` with a Select dropdown listing classes grouped/ordered by grade, recording the selected class in local state, with an empty-state when no classes. Verify a test covers listing by grade, selecting a class, and the empty state.

## 8. Web: by-student tab

- [x] 8.1 Add `useStudentSearch(q)` hook calling `GET /students?q=` (enabled only for non-empty query). Verify a hook test returns parsed results and skips empty queries.
- [x] 8.2 Build `ByStudentTab` autocomplete that suggests matching students (showing class to disambiguate), records the selected student, and shows a no-results indication. Verify a test covers typing→suggestions, selecting, and no-results.

## 9. Web: by-teacher tab

- [x] 9.1 Add `useTeacherSearch(q)` hook calling `GET /teachers?q=`. Verify a hook test returns parsed results and skips empty queries.
- [x] 9.2 Build `ByTeacherTab` autocomplete that suggests matching teachers, records the selected teacher (identity only), and shows a no-results indication. Verify a test covers typing→suggestions, selecting, and no-results.

## 10. Integration & validation

- [x] 10.1 Verify per-tab selection is independent and that no selection renders a schedule/navigates/prints — add a section-level test asserting selections persist per tab and trigger no navigation/render. 
- [x] 10.2 Run `pnpm lint → pnpm typecheck → pnpm test → pnpm build` and `openspec validate add-timetable-lookup-tabs --strict`; verify all pass.
