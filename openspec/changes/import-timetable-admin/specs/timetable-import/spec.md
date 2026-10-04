# Spec Delta

## Purpose

Parsing an uploaded multi-sheet Excel workbook into a brand-new published timetable (TKB): structurally and referentially validating the workbook with precise, located errors; inserting a complete, self-contained directory-and-lesson snapshot scoped to the new TKB; doing so as an all-or-nothing operation; and providing a downloadable template describing the expected format.

## ADDED Requirements

### Requirement: Each import creates a new timetable

An authorized import SHALL always create a new published timetable (TKB) distinct from all existing ones. An import SHALL NOT overwrite, update, merge into, or delete any existing timetable, directory data, or lessons. All prior imports are retained as history.

#### Scenario: Import creates a distinct TKB

- **WHEN** an authorized admin imports a valid workbook
- **THEN** a new timetable is created with its own id
- **AND** no existing timetable, directory data, or lessons are modified or removed

#### Scenario: Repeated imports accumulate as history

- **WHEN** an authorized admin imports two workbooks in succession
- **THEN** two separate new timetables exist, each with its own independent directory snapshot and lessons

### Requirement: Imported timetable starts inactive

A timetable created by import SHALL start inactive and SHALL NOT appear on the home view until an admin activates it.

#### Scenario: New TKB is hidden until activated

- **WHEN** a workbook is imported successfully
- **THEN** the resulting timetable is inactive
- **AND** it does not appear on the home view before an admin activates it

### Requirement: Required workbook sheets

The import workbook SHALL contain the sheets Meta, Grade, Class, Teacher, Student, and Lesson. The Meta sheet SHALL carry the TKB effective date. Each entity sheet SHALL declare its rows once, identified by an explicit business code, and later sheets SHALL reference those codes.

#### Scenario: All required sheets present

- **WHEN** a workbook is imported with the Meta, Grade, Class, Teacher, Student, and Lesson sheets and matching headers
- **THEN** the import proceeds to row validation

#### Scenario: A required sheet is missing

- **WHEN** a workbook is missing one of the required sheets
- **THEN** the import is rejected identifying the missing sheet by name
- **AND** no timetable or data is created

#### Scenario: A sheet has the wrong columns

- **WHEN** a sheet's header row does not match its required columns
- **THEN** the import is rejected identifying the sheet and the missing or unexpected column
- **AND** no timetable or data is created

### Requirement: Import inserts a TKB-scoped directory snapshot

Each import SHALL insert a complete, independent copy of its grades, classes, teachers, students, subjects, and rooms, every row scoped to the newly created timetable. The importer SHALL NOT reuse, update, or reference directory rows from any other timetable. Each timetable therefore owns a self-contained snapshot.

#### Scenario: Directory rows are scoped to the new TKB

- **WHEN** a workbook is imported
- **THEN** the grades, classes, teachers, students, subjects, and rooms it declares are inserted and associated with the new timetable only

#### Scenario: Snapshots are independent across imports

- **WHEN** two workbooks each declare a class with the same code
- **THEN** each timetable has its own class row, and neither import alters the other's directory

### Requirement: Referential validation with located errors

The importer SHALL validate every cross-sheet reference and reject the import on the first error, reporting the sheet name, the row number, the offending value, and a description. A Class SHALL reference an existing Grade; a Student SHALL reference an existing Class; a Lesson SHALL reference an existing Class and existing Teachers. Business codes SHALL be unique within their sheet.

#### Scenario: Class references an unknown grade

- **WHEN** a Class row names a gradeCode that no Grade row declares
- **THEN** the import is rejected with an error naming the Class sheet, that row, and the unknown gradeCode
- **AND** no timetable or data is created

#### Scenario: Lesson references an unknown teacher

- **WHEN** a Lesson row names a teacherCode that no Teacher row declares
- **THEN** the import is rejected with an error naming the Lesson sheet, that row, and the unknown teacherCode

#### Scenario: Lesson references an unknown class

- **WHEN** a Lesson row names a classCode that no Class row declares
- **THEN** the import is rejected with an error naming the Lesson sheet, that row, and the unknown classCode

#### Scenario: Duplicate business code

- **WHEN** two rows in the same entity sheet declare the same business code
- **THEN** the import is rejected with an error naming the sheet, the duplicate row, and the repeated code

### Requirement: Field-level validation with located errors

The importer SHALL validate each field and reject the import on the first invalid field, reporting the sheet, row, and problem. A Lesson's day SHALL be an integer 2–7 (Thứ 2..Thứ 7), its session SHALL be SANG or CHIEU, and its period ordinal SHALL be 1–5. The Meta effective date SHALL be a YYYY-MM-DD date. Required fields SHALL be non-empty.

#### Scenario: Invalid day

- **WHEN** a Lesson row has a day outside 2–7
- **THEN** the import is rejected naming the Lesson sheet, that row, and the invalid day

#### Scenario: Invalid session or period

- **WHEN** a Lesson row has a session other than SANG/CHIEU or a period ordinal outside 1–5
- **THEN** the import is rejected naming the Lesson sheet, that row, and the invalid value

#### Scenario: Missing effective date

- **WHEN** the Meta sheet has no valid YYYY-MM-DD effective date
- **THEN** the import is rejected naming the Meta sheet and the problem

### Requirement: Lessons are placed for a class

The importer SHALL create each Lesson for its class within the new timetable, placed into a (class, day, session, period) slot, carrying its subject (name and short code), zero or more teachers, and an optional room. A lesson SHALL NOT reference individual students; a student's schedule derives from their class.

#### Scenario: Single-teacher lesson imported

- **WHEN** a Lesson row places a subject for a class at a day/session/period with one teacher
- **THEN** a lesson is created in that slot of the new timetable with that subject and teacher

#### Scenario: Multi-teacher lesson imported

- **WHEN** a Lesson row names more than one teacher for a slot
- **THEN** the created lesson carries every named teacher

### Requirement: Room move derived from home room

A class MAY declare a home room. When a lesson's room is present and the class has a home room that differs, the lesson SHALL be marked as a room move exposing that room. When the lesson has no room, or the class has no home room, the lesson SHALL NOT be flagged as a room move.

#### Scenario: Lesson with no room uses the home room

- **WHEN** a Lesson row has no room and its class has a home room
- **THEN** the lesson is not flagged as a room move

#### Scenario: Lesson moved to another room

- **WHEN** a Lesson row's room differs from its class's home room
- **THEN** the lesson is flagged as a room move exposing that room

#### Scenario: Class without a home room

- **WHEN** a class declares no home room
- **THEN** its lessons are never flagged as room moves

### Requirement: Elective slots allow multiple lessons

A slot (class, day, session, period) SHALL normally hold at most one lesson. When lessons carry a choice-group label, multiple lessons MAY share the same slot as electives. The importer SHALL reject a slot that holds more than one lesson without a choice-group label.

#### Scenario: Duplicate non-elective slot rejected

- **WHEN** two Lesson rows place lessons in the same (class, day, session, period) slot and neither carries a choice-group label
- **THEN** the import is rejected naming the Lesson sheet, the duplicate row, and the conflicting slot

#### Scenario: Elective slot allowed

- **WHEN** multiple Lesson rows share one slot and each carries a choice-group label
- **THEN** all the lessons are created in that slot, each with its label

### Requirement: Import is all-or-nothing

A successful import SHALL be all-or-nothing. On any validation error, or any failure during insertion, the system SHALL create no timetable, directory data, or lessons, and leave all existing data unchanged.

#### Scenario: Unreadable or wrong file

- **WHEN** the uploaded file is not a valid Excel workbook
- **THEN** the import is rejected with an error describing the problem
- **AND** no timetable, directory data, or lessons are created

#### Scenario: A failure during insertion rolls back

- **WHEN** insertion fails partway through
- **THEN** the entire import is rolled back so no new timetable, directory data, or lessons remain

### Requirement: Import returns a result summary

A successful import SHALL return a summary identifying the created timetable and counts of what was inserted (for example, lessons, classes, teachers, and students created), so the admin can confirm the outcome.

#### Scenario: Summary after success

- **WHEN** an import completes successfully
- **THEN** the response identifies the new timetable's id
- **AND** reports how many lessons and directory rows were created

### Requirement: Downloadable import template

The system SHALL provide an admin-accessible downloadable Excel template whose sheets and column headers match what the importer expects, so admins fill in a known shape.

#### Scenario: Admin downloads the template

- **WHEN** an authorized admin requests the import template
- **THEN** the system returns an Excel file with the Meta, Grade, Class, Teacher, Student, and Lesson sheets and their expected column headers

#### Scenario: Template matches the importer

- **WHEN** a downloaded template is filled in according to its headers and imported
- **THEN** the importer accepts the workbook shape
