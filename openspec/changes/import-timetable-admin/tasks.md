# Tasks

## 1. Dependencies and configuration

- [x] 1.1 Add `exceljs` and `@fastify/multipart` to `apps/api` and verify `pnpm install` succeeds and both import without error in a throwaway script
- [x] 1.2 Document and read an `ADMIN_TOKEN` env var in the API (config access point), verifying that when unset the value resolves to empty/undefined (used later to fail closed)

## 2. Shared contracts

- [x] 2.1 Add `adminTimetableSchema` + `adminTimetableListResponseSchema` (id, ordinal, effectiveFrom, isActive, createdAt) to `packages/shared`, export from index, and verify a schema unit test parses a valid list and rejects a missing field
- [x] 2.2 Add `toggleTimetableRequestSchema` (`isActive: boolean`) and `importResultSchema` (timetableId + counts) to `packages/shared`, export them, and verify unit tests cover valid and invalid payloads
- [x] 2.3 Extend the shared contracts for the redesign: add a located import-error schema (`{ sheet, row, column?, message }`) and expand `importResultSchema` with directory counts (classes/teachers/students/subjects/rooms created); export and unit-test valid/invalid payloads

## 3. Admin authorization gate

- [x] 3.1 Implement a Fastify `preHandler` that constant-time compares a request header against `ADMIN_TOKEN`, rejecting with 401 when the header is missing/wrong or when `ADMIN_TOKEN` is unset; register admin routes under a guarded prefix
- [x] 3.2 Add route tests verifying: valid token passes, wrong/missing token is rejected with no side effects, and unset `ADMIN_TOKEN` rejects all admin requests

## 4. Timetable administration (list + toggle)

- [x] 4.1 Add repository functions to list all timetables (active and inactive, deterministic order) and to set a timetable's `isActive`, returning not-found when the id does not exist; verify with repository tests against a test DB
- [x] 4.2 Add an admin service that maps rows to `adminTimetableListResponseSchema` and validates the toggle request; verify service unit tests cover empty list and unknown-id toggle
- [x] 4.3 Add admin routes `GET` (list all) and the toggle endpoint wired to the service; verify route tests confirm the list includes inactive TKBs and that toggling changes visibility on the public `/timetables/active` endpoint

## 5. Schema migration: TKB-scoped directory

- [x] 5.1 Add `timetable_id` (FK → timetable) to `grade`, `room`, `class`, `student`, `teacher`, `subject` in the Drizzle schema and in `db/testdb.ts`; generate the drizzle-kit migration and verify it applies cleanly
- [x] 5.2 Update the seed (`db/seed.ts`) to create a seed timetable and assign every directory/lesson row to it; verify seeding runs and the home view still shows the seeded TKB
- [x] 5.3 Backfill/verify: confirm existing read code compiles against the new columns (failures here are expected and fixed in group 6) and that `pnpm --filter @timetable/api run db:migrate` succeeds

## 6. TKB-scoped directory and grid reads

- [x] 6.1 Add a `timetableId` filter to the directory repositories (class list, student search, teacher search) and update their services to resolve the timetable (explicit selector → default active → empty); verify repository/service tests return only the selected TKB's entities and empty when none active
- [x] 6.2 Add a `timetableId` filter to the grid repositories/services so a class/student/teacher resolves its grid within the requested timetable and returns not-found for a cross-timetable reference; update grid tests
- [x] 6.3 Thread the selected `timetableId` from the web lookups into the directory queries; verify the class/student/teacher lookups request the active/selected TKB and update affected web tests
- [x] 6.4 Guard room-move detection so a class with no home room never flags a move (`homeRoomId !== null && roomId !== homeRoomId`); verify a grid test with a home-room-less class shows no room move

## 7. Multi-sheet import format and template

- [x] 7.1 Replace the format-contract module with the six-sheet contract (Meta, Grade, Class, Teacher, Student, Lesson) — sheet names, per-sheet column headers, delimiters, and key-normalization rules — consumed by both parser and template; verify a unit test asserts each sheet's headers are stable and non-empty
- [x] 7.2 Rewrite template generation from the new contract (all six sheets with headers and one illustrative row per sheet) and keep the admin download route; verify a test opens the generated workbook and asserts every sheet's sheet-name and headers equal the contract

## 8. Multi-sheet import parsing, validation, and persistence

- [x] 8.1 Rewrite the parser to build an in-memory model per sheet in dependency order and validate fail-fast with located errors — structural (sheets/headers), field-level (day 2–7, session, period 1–5, dates, required), duplicate business codes, and referential (Class→Grade, Student→Class, Lesson→Class/Teacher); verify unit tests for each error class assert the `{sheet,row,column?,message}` location and that no plan is produced
- [x] 8.2 Add the non-elective slot-uniqueness check (reject a second lesson in one (class,day,session,period) without a choice-group label; allow multiple with labels); verify tests for the rejected and allowed cases
- [x] 8.3 Replace the import repository with insert-only, TKB-scoped writes: insert grade/class/teacher/student/subject/room (all tagged with the new timetable id) plus lessons and lesson_teacher; no resolve-or-create, no update/delete; verify repository tests confirm every inserted row carries the new timetable id and prior data is untouched
- [x] 8.4 Rewrite the import service to parse+validate then persist inside one `db.transaction`, assign the next ordinal, mark the TKB inactive, and return the expanded `importResultSchema`; verify tests prove validation errors and mid-insert failures both roll back to zero new rows, and a success returns correct counts
- [x] 8.5 Update the import route to return the located error body (HTTP 400) on an `ImportParseError` and the result summary (201) on success, behind the admin gate; verify route tests import a filled template (new inactive TKB with expected lessons), reject an invalid workbook with a located error, and confirm a second import creates a distinct independent snapshot

## 9. Web admin page

- [x] 9.1 Add an admin feature/page listing all timetables (sorted newest-first by createdAt for display) with active-state toggles (TanStack Query against the admin endpoints, admin token supplied via header), a new-import upload form, and a template download link; verify it renders the list, toggles update state, and an import triggers a refetch
- [x] 9.2 Add the admin route to the web router and verify navigating to it shows the admin page
- [x] 9.3 Surface located import errors in the admin page (show sheet/row/message on a 400); verify a test renders the error location returned by a failed import

## 10. Integration verification

- [x] 10.1 End-to-end check: download the six-sheet template → fill → import via admin UI/API → activate the new TKB → confirm it appears on the home view and its class/student/teacher lookups and grids resolve from that TKB's snapshot only
- [x] 10.2 Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` from the repo root and verify all pass
