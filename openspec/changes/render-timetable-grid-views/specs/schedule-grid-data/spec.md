# Spec Delta

## Purpose

The weekly schedule structure (days, sessions, periods) and the lesson placements that fill it — subjects, rooms, teacher codes, electives, room moves, and multi-teacher cells — together with the read endpoints that resolve a complete weekly grid for a class, a student, or a teacher.

## ADDED Requirements

### Requirement: Lessons belong to a published timetable

Every lesson SHALL belong to exactly one published timetable (TKB). A class, student, or teacher therefore has a distinct set of lessons per TKB, and the same class may have different schedules across different published TKBs.

#### Scenario: Lesson scoped to a TKB

- **WHEN** a lesson is defined
- **THEN** it references exactly one published timetable

#### Scenario: Different schedules across TKBs

- **WHEN** two published timetables both contain lessons for the same class
- **THEN** each timetable's lessons are independent, and resolving the class for one TKB does not include the other TKB's lessons

### Requirement: Grid resolves for a selected or default timetable

Each resolve endpoint SHALL accept an optional published-timetable selector and SHALL resolve the grid from that timetable's lessons. When no timetable is specified, the system SHALL resolve the default active timetable (the same default the home view highlights).

#### Scenario: Explicit timetable requested

- **WHEN** a client requests a class/student/teacher grid for a specific published timetable
- **THEN** the resolved grid contains only that timetable's lessons

#### Scenario: No timetable specified

- **WHEN** a client requests a grid without specifying a timetable
- **THEN** the system resolves the default active timetable's lessons

#### Scenario: No active timetable

- **WHEN** a grid is requested without a timetable and no active timetable exists
- **THEN** the system responds with a not-found result rather than an arbitrary schedule

### Requirement: Weekly grid structure

The system SHALL define the fixed weekly grid as six teaching days Thứ 2 through Thứ 7, each divided into two sessions SÁNG (morning) and CHIỀU (afternoon), with five ordered periods per session. Each period SHALL have a session, an ordinal 1–5, and an optional display time range.

#### Scenario: Grid axes are fixed

- **WHEN** a weekly grid is resolved
- **THEN** it exposes the six days in order Thứ 2, Thứ 3, Thứ 4, Thứ 5, Thứ 6, Thứ 7
- **AND** two sessions SÁNG then CHIỀU, each with five ordered periods

#### Scenario: Period carries a display time

- **WHEN** a period defines a start and end time (e.g. 07g00–07g45)
- **THEN** the resolved grid includes that time range for the period
- **AND** when a period has no configured time, the time range is absent rather than erroneous

### Requirement: Lesson placement

The system SHALL place lessons into (day, session, period) slots. A lesson SHALL reference a subject with a display name and short code, SHALL belong to one class, and SHALL carry zero or more teachers and an optional room and cell category.

#### Scenario: A lesson occupies one slot

- **WHEN** a lesson is defined for a class on a given day, session, and period
- **THEN** it appears in exactly that slot of the class's grid
- **AND** carries its subject name, subject short code, and teacher short code(s)

#### Scenario: Empty slot

- **WHEN** no lesson is placed in a (day, session, period) slot for a class
- **THEN** the resolved grid marks that slot as empty rather than omitting it

#### Scenario: Multi-teacher lesson

- **WHEN** a lesson is taught by more than one teacher
- **THEN** the resolved cell lists every teacher's short code for that lesson

### Requirement: Room and room-move

A lesson MAY be taught in a room other than the class's home room. When a lesson's room differs from the home room, the system SHALL mark the lesson as a room move and expose the room and a move note.

#### Scenario: Lesson in the home room

- **WHEN** a lesson is taught in the class's home room
- **THEN** the resolved cell is not flagged as a room move and needs no room note

#### Scenario: Lesson moved to another room

- **WHEN** a lesson's room differs from the class's home room
- **THEN** the resolved cell is flagged as a room move
- **AND** exposes the destination room and a move note

### Requirement: Elective choice groups

The system SHALL support elective slots where students of one class split across different subjects in the same (day, session, period). An elective lesson SHALL carry a choice-group label (e.g. "Tự chọn (TC1)", "Ngoại ngữ 2") and the system SHALL record which elective lesson each student attends.

#### Scenario: Class grid shows the elective slot

- **WHEN** a class has an elective slot where students split across subjects
- **THEN** the class grid represents that slot without implying one subject for all students

#### Scenario: Student resolves to their elective lesson

- **WHEN** a student attends a specific elective lesson in an elective slot
- **THEN** the student's grid shows that student's subject, teacher, room, choice-group label, and room-move note for the slot
- **AND** does not show the other electives offered in the same slot

### Requirement: Resolve class grid endpoint

The system SHALL expose a read endpoint that returns the complete weekly grid for a given class, with every (day, session, period) slot filled with the class's lesson or marked empty.

#### Scenario: Class grid returned

- **WHEN** a client requests the grid for an existing class
- **THEN** the response contains the grid axes and one cell per slot
- **AND** each non-empty cell includes subject name, subject short code, and teacher short code(s)

#### Scenario: Unknown class

- **WHEN** a client requests the grid for a class that does not exist
- **THEN** the system responds with a not-found result rather than an empty grid

### Requirement: Resolve student grid endpoint

The system SHALL expose a read endpoint that returns the weekly grid for a given student, based on the student's class but with elective slots resolved to the lessons that student attends.

#### Scenario: Student grid resolves electives

- **WHEN** a client requests the grid for an existing student
- **THEN** the response is the student's class grid
- **AND** each elective slot shows only the lesson that student attends, with its choice-group label and any room-move note

#### Scenario: Unknown student

- **WHEN** a client requests the grid for a student that does not exist
- **THEN** the system responds with a not-found result

### Requirement: Resolve teacher grid endpoint

The system SHALL expose a read endpoint that returns the weekly grid for a given teacher, containing only the slots that teacher teaches, each identifying the subject and the class taught.

#### Scenario: Teacher grid returned

- **WHEN** a client requests the grid for an existing teacher
- **THEN** the response contains the grid axes
- **AND** only slots the teacher teaches are non-empty, each showing the subject and the class (e.g. Lớp 11A5); all other slots are empty

#### Scenario: Teacher teaches a shared lesson

- **WHEN** a teacher co-teaches a lesson with other teachers
- **THEN** that slot appears in the teacher's grid

#### Scenario: Unknown teacher

- **WHEN** a client requests the grid for a teacher that does not exist
- **THEN** the system responds with a not-found result
