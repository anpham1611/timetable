# Spec Delta

## Purpose

The landing view that presents the timetable header in Vietnamese — title, applicability subtitle, live visit count, and a selectable list of active published timetables (TKBs) with one highlighted by default — giving users an at-a-glance entry point before they look up a specific schedule.

## ADDED Requirements

### Requirement: Timetable header title and subtitle

The home view SHALL display a fixed Vietnamese title "Thời khóa biểu" and a subtitle "Áp dụng từ 07/09/2026 · tra theo lớp, học sinh hoặc giáo viên".

#### Scenario: Header text is shown on load

- **WHEN** a user opens the home view
- **THEN** the text "Thời khóa biểu" is shown as the title
- **AND** the text "Áp dụng từ 07/09/2026 · tra theo lớp, học sinh hoặc giáo viên" is shown as the subtitle

### Requirement: Visit count line

The home view SHALL display a line "Lượt truy cập: {count}" where `{count}` is the current global visit total formatted with vi-VN thousands separators (a dot grouping, e.g. `9.000`).

#### Scenario: Visit count is rendered formatted

- **WHEN** the home view loads and the visit count is available
- **THEN** a line reading "Lượt truy cập: {count}" is shown
- **AND** `{count}` is the number returned by the visit-counter capability formatted with a dot as the thousands separator (vi-VN locale)

#### Scenario: Visit count unavailable

- **WHEN** the visit count cannot be retrieved
- **THEN** the view still renders the header and TKB list
- **AND** the visit-count line shows a neutral placeholder instead of a broken or zero-padded value

### Requirement: Active TKB list display

The home view SHALL display one button per active (non-archived) published timetable (TKB), labelled "TKB {n} - {dd/mm/yyyy}" where `{n}` is the TKB's display ordinal and `{dd/mm/yyyy}` is its effective date formatted day/month/year.

#### Scenario: Active TKBs are listed as buttons

- **WHEN** the home view loads and there are active TKBs
- **THEN** one button is rendered per active TKB in a stable display order
- **AND** each button is labelled "TKB {n} - {dd/mm/yyyy}" using that TKB's ordinal and effective date

#### Scenario: No active TKBs

- **WHEN** the home view loads and there are no active TKBs
- **THEN** no TKB buttons are rendered
- **AND** the view shows an empty-state message indicating no timetable is currently available

### Requirement: Default selected TKB

Exactly one active TKB SHALL be highlighted as the selected/active one by default when the list is shown, using the primary color to distinguish it from the others.

#### Scenario: One TKB highlighted by default

- **WHEN** the home view loads with at least one active TKB
- **THEN** exactly one TKB button is visually highlighted with the primary color
- **AND** the remaining TKB buttons are rendered in a non-highlighted style

### Requirement: Selecting a different TKB

When a user activates a non-selected active TKB button, the view SHALL move the selection to that TKB so it becomes the highlighted/active one.

#### Scenario: User selects another TKB

- **WHEN** a user activates a TKB button that is not currently selected
- **THEN** that TKB becomes the highlighted selected one using the primary color
- **AND** the previously selected TKB returns to the non-highlighted style
- **AND** no more than one TKB is highlighted at any time
