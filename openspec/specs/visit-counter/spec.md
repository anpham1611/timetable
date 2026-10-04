# visit-counter Specification

## Purpose

A persistent global tally of how many times the home page has been visited, incremented once per home-page load and exposed so the home view can display total usage.

## Requirements

### Requirement: Increment on home-page visit

The system SHALL increment a single global visit counter by one each time the home page is loaded, and this total SHALL persist across restarts.

#### Scenario: Visit increments the counter

- **WHEN** the home page is loaded
- **THEN** the global visit counter is increased by exactly one
- **AND** the new total is persisted durably

#### Scenario: Count survives restart

- **WHEN** the application restarts after visits have been recorded
- **THEN** the visit counter retains the previously accumulated total

### Requirement: Expose current visit total

The system SHALL expose the current global visit total as a non-negative integer that the home view can read for display.

#### Scenario: Read current total

- **WHEN** a client requests the current visit total
- **THEN** the system returns the current global count as a non-negative integer

### Requirement: Single global counter

The visit count SHALL be a single global value, not segmented per timetable, user, or session.

#### Scenario: All visits share one counter

- **WHEN** visits occur from different sessions or for different timetables
- **THEN** every visit increments the same single global counter
