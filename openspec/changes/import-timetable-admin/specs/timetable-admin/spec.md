# Spec Delta

## Purpose

Admin-gated management of published timetables (TKBs): a shared-token authorization boundary protecting admin operations, listing every TKB with its active state, and toggling each TKB's visibility to students and teachers.

## ADDED Requirements

### Requirement: Admin authorization gate

All admin operations (listing all timetables, toggling active state, importing a workbook, and downloading the template) SHALL require a valid admin token supplied with the request. Requests without a valid token SHALL be rejected and SHALL NOT read or modify any data.

#### Scenario: Request with a valid admin token

- **WHEN** an admin operation is requested with the configured admin token
- **THEN** the operation is authorized and proceeds

#### Scenario: Request with a missing or wrong token

- **WHEN** an admin operation is requested without a token or with an incorrect token
- **THEN** the system rejects the request as unauthorized
- **AND** performs no read or write of timetable or directory data

#### Scenario: Admin token not configured

- **WHEN** no admin token is configured for the system
- **THEN** every admin operation is rejected as unauthorized rather than defaulting to open access

### Requirement: List all timetables

The system SHALL expose an admin endpoint that returns every timetable (TKB), both active and inactive, each with its id, display ordinal, effective date, active state, and creation time, ordered deterministically.

#### Scenario: All timetables returned

- **WHEN** an authorized admin requests the full timetable list
- **THEN** the response includes every timetable regardless of active state
- **AND** each entry carries its id, ordinal, effective date, active flag, and creation time

#### Scenario: No timetables exist

- **WHEN** an authorized admin requests the list and no timetables exist
- **THEN** the system returns an empty list rather than an error

### Requirement: Toggle timetable active state

The system SHALL expose an admin endpoint that sets a timetable's active state to a requested value. Activating a timetable makes it eligible for the home view and default selection; deactivating removes it from the home view. A timetable's lessons and directory data are unaffected by the toggle.

#### Scenario: Activate an inactive timetable

- **WHEN** an authorized admin activates an inactive timetable
- **THEN** that timetable becomes active
- **AND** it is thereafter eligible to appear on the home view

#### Scenario: Deactivate an active timetable

- **WHEN** an authorized admin deactivates an active timetable
- **THEN** that timetable becomes inactive
- **AND** it no longer appears on the home view
- **AND** its lessons remain stored and are unchanged

#### Scenario: Toggle an unknown timetable

- **WHEN** an authorized admin toggles the active state of a timetable that does not exist
- **THEN** the system responds with a not-found result and changes nothing
