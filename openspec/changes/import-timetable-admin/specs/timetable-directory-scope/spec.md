# Spec Delta

## Purpose

Scoping the directory a reader sees — the class list, student search, teacher search, and resolved grids — to the active or selected published timetable (TKB), so each TKB presents its own self-contained snapshot of classes, students, and teachers.

## ADDED Requirements

### Requirement: Directory reads follow the active timetable

When no timetable is explicitly selected, the class list, student search, and teacher search SHALL resolve against the default active timetable's snapshot (the same default the home view highlights). Entities belonging to other timetables SHALL NOT appear.

#### Scenario: Lookups show the active TKB's directory

- **WHEN** a reader opens the lookups with timetable TKB-1 active and no explicit selection
- **THEN** the class list, student search, and teacher search return only TKB-1's classes, students, and teachers

#### Scenario: No active timetable

- **WHEN** no timetable is active and none is selected
- **THEN** the lookups return empty results rather than entities from an arbitrary timetable

### Requirement: Directory reads follow the selected timetable

When a timetable is explicitly selected, the class list, student search, and teacher search SHALL resolve against that timetable's snapshot. Switching the selected timetable SHALL switch the directory shown.

#### Scenario: Selecting another TKB switches the directory

- **WHEN** a reader selects TKB-2
- **THEN** the class list, student search, and teacher search return only TKB-2's classes, students, and teachers
- **AND** TKB-1's entities no longer appear

### Requirement: Grids resolve within the same timetable as the directory

A class, student, or teacher resolved from one timetable's directory SHALL resolve its grid from that same timetable. A reference from one timetable SHALL NOT resolve a grid in another.

#### Scenario: Grid matches the directory's timetable

- **WHEN** a class/student/teacher selected from TKB-2's directory is opened
- **THEN** its weekly grid is resolved from TKB-2's lessons

#### Scenario: Reference outside the timetable

- **WHEN** a grid is requested for a class/student/teacher that does not belong to the requested timetable
- **THEN** the system responds with a not-found result rather than a grid from another timetable
