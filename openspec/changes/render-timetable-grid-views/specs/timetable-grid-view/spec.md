# Spec Delta

## Purpose

The rendered weekly timetable grid shown in the result area for a selected class, student, or teacher — the shared grid chrome plus the per-view cell content and the elective and room-move presentation.

## ADDED Requirements

### Requirement: Selection triggers grid render

Selecting a class, student, or teacher in the lookup tabs SHALL cause that target's resolved weekly grid to be rendered in the result area.

#### Scenario: Class selection renders grid

- **WHEN** a user selects a class in the by-class tab
- **THEN** the result area renders that class's resolved weekly grid

#### Scenario: Student selection renders grid

- **WHEN** a user selects a student in the by-student tab
- **THEN** the result area renders that student's resolved weekly grid

#### Scenario: Teacher selection renders grid

- **WHEN** a user selects a teacher in the by-teacher tab
- **THEN** the result area renders that teacher's resolved weekly grid

#### Scenario: Switching selection replaces the grid

- **WHEN** a user changes the selection within a tab
- **THEN** the result area replaces the previous grid with the newly selected target's grid

### Requirement: Grid chrome

The grid view SHALL render a result header with a title, then a table whose first column is the period column (period number and, when present, its time range), whose header row lists the six days Thứ 2–Thứ 7, and whose body is split by a full-width SÁNG row and a full-width CHIỀU row, each followed by its five period rows.

#### Scenario: Grid layout rendered

- **WHEN** a resolved grid is displayed
- **THEN** a title header is shown above the table
- **AND** the first column shows each period's number and time range when present
- **AND** the header row lists Thứ 2 through Thứ 7 in order
- **AND** a SÁNG session row precedes the morning periods and a CHIỀU session row precedes the afternoon periods

#### Scenario: Empty cell rendering

- **WHEN** a slot in the resolved grid is empty
- **THEN** that cell renders an em dash (—) placeholder

### Requirement: Today column highlight

The grid view SHALL visually highlight the column for the current weekday when it is one of Thứ 2–Thứ 7.

#### Scenario: Current day highlighted

- **WHEN** the current weekday is one of the six grid days
- **THEN** that day's header and its cells are visually marked as today

#### Scenario: Current day outside the grid

- **WHEN** the current weekday is Sunday (not in the grid)
- **THEN** no day column is marked as today and the grid still renders

### Requirement: Mobile-first horizontal scroll

The grid SHALL be usable at 375px width by allowing the table to scroll horizontally within its container without breaking the surrounding layout.

#### Scenario: Narrow screen

- **WHEN** the grid is viewed at 375px width
- **THEN** the table remains readable and scrolls horizontally inside its scroll container

### Requirement: Class grid cell content

In the by-class view, each non-empty cell SHALL show the subject display name and the teacher short code(s) prefixed "GV:".

#### Scenario: Class cell shows subject and teacher

- **WHEN** a by-class grid cell holds a lesson
- **THEN** the cell shows the subject name
- **AND** a line "GV:" followed by the teacher short code(s)

### Requirement: Student grid cell content

In the by-student view, each non-empty cell SHALL show the subject and teacher, and for an elective lesson SHALL additionally show the choice-group label and, when the lesson is a room move, the destination room and a move indicator.

#### Scenario: Student regular cell

- **WHEN** a by-student grid cell holds a non-elective lesson in the home room
- **THEN** the cell shows the subject name and the teacher short code(s)

#### Scenario: Student elective with room move

- **WHEN** a by-student grid cell holds an elective lesson taught in another room
- **THEN** the cell shows the subject, the teacher, the destination room, a move indicator, and the choice-group label

#### Scenario: Student result header shows class

- **WHEN** a student's grid is displayed
- **THEN** the header shows the student's name and their class

### Requirement: Teacher grid cell content

In the by-teacher view, each non-empty cell SHALL show the subject and the class taught, labelled "Lớp:".

#### Scenario: Teacher cell shows subject and class

- **WHEN** a by-teacher grid cell holds a lesson that teacher teaches
- **THEN** the cell shows the subject name
- **AND** a line "Lớp:" followed by the class name

### Requirement: Grid loading and error states

The grid view SHALL indicate while a grid is loading and SHALL show a message when the selected class, student, or teacher cannot be resolved, instead of rendering a broken or empty grid as if it were data.

#### Scenario: Loading

- **WHEN** a selection's grid is being fetched
- **THEN** a loading indication is shown in the result area

#### Scenario: Not found

- **WHEN** the selected class, student, or teacher cannot be resolved
- **THEN** a not-found message is shown in the result area rather than a grid
