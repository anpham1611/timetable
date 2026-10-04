# Spec Delta

## MODIFIED Requirements

### Requirement: Active TKB list display

The home view SHALL display one button per active (non-archived) published timetable (TKB), labelled "TKB {n} - {dd/mm/yyyy}" where `{n}` is the TKB's display ordinal and `{dd/mm/yyyy}` is its effective date formatted day/month/year. The buttons SHALL be ordered newest-first (descending by effective date), so the most recently effective TKB appears first.

#### Scenario: Active TKBs are listed as buttons

- **WHEN** the home view loads and there are active TKBs
- **THEN** one button is rendered per active TKB, ordered newest-first by effective date
- **AND** each button is labelled "TKB {n} - {dd/mm/yyyy}" using that TKB's ordinal and effective date

#### Scenario: No active TKBs

- **WHEN** the home view loads and there are no active TKBs
- **THEN** no TKB buttons are rendered
- **AND** the view shows an empty-state message indicating no timetable is currently available

### Requirement: Default selected TKB

Exactly one active TKB SHALL be highlighted as the selected/active one by default when the list is shown, using the primary color to distinguish it from the others. The default-selected TKB SHALL be the latest one (the newest by effective date).

#### Scenario: One TKB highlighted by default

- **WHEN** the home view loads with at least one active TKB
- **THEN** exactly one TKB button is visually highlighted with the primary color
- **AND** the highlighted TKB is the latest one by effective date
- **AND** the remaining TKB buttons are rendered in a non-highlighted style
