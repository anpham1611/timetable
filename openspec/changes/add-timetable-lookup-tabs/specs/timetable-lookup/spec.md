# Spec Delta

## Purpose

The three-tab lookup section on the home view that lets a user narrow to a specific class, student, or teacher by choosing a lookup mode and selecting a target from database-backed options.

## ADDED Requirements

### Requirement: Three fixed lookup tabs

The home view SHALL display a lookup section with exactly three tabs in this order, with these fixed Vietnamese labels: "Theo lớp" (by class), "Theo học sinh" (by student), "Theo giáo viên" (by teacher). The "Theo lớp" tab SHALL be the active tab on initial load.

#### Scenario: Tabs shown on load

- **WHEN** the home view loads
- **THEN** three tabs labelled "Theo lớp", "Theo học sinh", and "Theo giáo viên" are shown in that order
- **AND** the "Theo lớp" tab is active and its content is visible

#### Scenario: Switching tabs

- **WHEN** a user activates a tab that is not currently active
- **THEN** that tab becomes active and its selector content is shown
- **AND** the previously active tab's content is hidden
- **AND** exactly one tab is active at any time

### Requirement: Class dropdown in the by-class tab

The "Theo lớp" tab SHALL present a dropdown listing every class loaded from the directory, where each option is a class belonging to exactly one grade, and classes SHALL be grouped or ordered by grade.

#### Scenario: Classes are listed grouped by grade

- **WHEN** the "Theo lớp" tab is active and classes are available
- **THEN** a dropdown is shown containing one option per class
- **AND** the options are grouped or ordered by their grade (e.g. all grade-11 classes together, then grade-12)

#### Scenario: A class is selected

- **WHEN** a user picks a class from the dropdown
- **THEN** that class becomes the recorded selection for the by-class tab
- **AND** the dropdown shows the chosen class as its current value

#### Scenario: No classes available

- **WHEN** the "Theo lớp" tab is active and the directory returns no classes
- **THEN** the dropdown shows an empty-state indication and no class can be selected

### Requirement: Student autocomplete in the by-student tab

The "Theo học sinh" tab SHALL present a search input that suggests students by name from the directory as the user types, where each student belongs to exactly one class, and allows selecting one matching student.

#### Scenario: Suggestions appear while typing

- **WHEN** a user types into the student search input
- **THEN** students whose names match the typed text are suggested from the directory
- **AND** each suggestion identifies the student uniquely enough to distinguish same-named students (e.g. showing the student's class)

#### Scenario: A student is selected

- **WHEN** a user picks a suggested student
- **THEN** that student becomes the recorded selection for the by-student tab
- **AND** the input reflects the chosen student

#### Scenario: No matching students

- **WHEN** the typed text matches no students
- **THEN** a no-results indication is shown and no selection is recorded

### Requirement: Teacher autocomplete in the by-teacher tab

The "Theo giáo viên" tab SHALL present a search input that suggests teachers by name from the directory as the user types, and allows selecting one matching teacher as the recorded selection (teacher identity only, independent of the classes they teach).

#### Scenario: Suggestions appear while typing

- **WHEN** a user types into the teacher search input
- **THEN** teachers whose names match the typed text are suggested from the directory

#### Scenario: A teacher is selected

- **WHEN** a user picks a suggested teacher
- **THEN** that teacher becomes the recorded selection for the by-teacher tab
- **AND** the input reflects the chosen teacher
- **AND** the selection is the teacher's identity only, not tied to any one of their classes

#### Scenario: No matching teachers

- **WHEN** the typed text matches no teachers
- **THEN** a no-results indication is shown and no selection is recorded

### Requirement: Selection is scoped per tab

Each tab SHALL track its own current selection independently, and a selection SHALL record only the chosen target without rendering, navigating to, or printing a timetable.

#### Scenario: Selections do not cross tabs

- **WHEN** a user selects a class in the by-class tab and then switches to another tab
- **THEN** the by-class selection is retained for the by-class tab
- **AND** the other tabs show their own independent selection state

#### Scenario: Selection does not render a timetable

- **WHEN** a user selects a class, student, or teacher in any tab
- **THEN** the selection is recorded
- **AND** no schedule grid is displayed and no navigation or print is triggered by the selection
