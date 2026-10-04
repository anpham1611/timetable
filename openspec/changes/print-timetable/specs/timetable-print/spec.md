# Spec Delta

## Purpose

Lets a viewer produce a clean paper copy of the timetable grid they are currently viewing, using the browser's native print facility, without surrounding page UI.

## ADDED Requirements

### Requirement: Print control visibility

The system SHALL display a Print control within the timetable result area only when a resolved timetable grid is displayed. The control MUST NOT appear while no selection has been made, while the grid is loading, or when loading failed.

#### Scenario: Control shown with a displayed grid

- **WHEN** a class, student, or teacher is selected and its resolved timetable grid is displayed
- **THEN** a Print control is visible in the result area

#### Scenario: Control hidden with no grid

- **WHEN** no selection has been made, or the grid is still loading, or loading failed
- **THEN** no Print control is shown

### Requirement: Invoke browser print

The system SHALL, when the Print control is activated, invoke the browser's native print dialog for the currently displayed timetable.

#### Scenario: Activating Print opens the print dialog

- **WHEN** the user activates the Print control while a grid is displayed
- **THEN** the browser's native print dialog is opened for the current page

### Requirement: Print output contains only the timetable grid

When the page is printed, the printed output SHALL contain only the displayed timetable grid — its title, optional subtitle, and the period/day table. Surrounding interactive page UI (lookup tabs, search fields, the Print control itself, and the application footer) MUST be excluded from the printed output.

#### Scenario: Surrounding UI excluded in print

- **WHEN** the page is printed while a timetable grid is displayed
- **THEN** the printed output shows the grid's title, subtitle (if present), and the full period/day table
- **AND** the lookup tabs, search inputs, the Print control, and the footer do not appear in the printed output

### Requirement: Legible printed grid

The printed timetable grid SHALL be legible on paper: the full set of day columns is visible without horizontal clipping, text uses readable contrast on a white background, and screen-only highlight styling (such as the current-day column tint) does not degrade print legibility.

#### Scenario: Full grid fits the page

- **WHEN** a timetable grid with all day columns is printed
- **THEN** every day column and period row is present in the printed output without being clipped off the page

#### Scenario: Readable contrast on paper

- **WHEN** the grid is printed
- **THEN** grid text renders in a dark color on a white background so cell contents remain readable
