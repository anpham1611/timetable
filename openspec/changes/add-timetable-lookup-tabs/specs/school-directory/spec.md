# Spec Delta

## Purpose

The reference data for the school's organizational entities — grades, classes, students, and teachers — and the read endpoints that expose them so lookup selectors can be populated and searched.

## ADDED Requirements

### Requirement: Directory entities and relationships

The system SHALL maintain directory records for grades, classes, students, and teachers with these relationships: each class belongs to exactly one grade; each student belongs to exactly one class; a teacher may be associated with many classes.

#### Scenario: Class belongs to one grade

- **WHEN** a class record exists
- **THEN** it references exactly one grade

#### Scenario: Student belongs to one class

- **WHEN** a student record exists
- **THEN** it references exactly one class

#### Scenario: Teacher may teach many classes

- **WHEN** a teacher record exists
- **THEN** it may be associated with zero, one, or many classes

### Requirement: List classes endpoint

The system SHALL expose a read endpoint that returns all classes, each with its display name and its grade, so a client can present classes grouped or ordered by grade.

#### Scenario: Classes returned with grade

- **WHEN** a client requests the list of classes
- **THEN** the response contains one entry per class
- **AND** each entry includes the class name and the grade it belongs to

#### Scenario: No classes

- **WHEN** a client requests the list of classes and none exist
- **THEN** the response is an empty list rather than an error

### Requirement: Search students endpoint

The system SHALL expose a read endpoint that returns students whose names match a supplied query string, each with enough context to disambiguate same-named students (such as the student's class).

#### Scenario: Matching students returned

- **WHEN** a client requests students matching a non-empty query
- **THEN** the response contains students whose names match the query
- **AND** each entry includes the student's name and class

#### Scenario: No match

- **WHEN** a client requests students matching a query with no matches
- **THEN** the response is an empty list rather than an error

#### Scenario: Empty query

- **WHEN** a client requests students with an empty or missing query
- **THEN** the system returns an empty list or a validation error rather than the full student roster

### Requirement: Search teachers endpoint

The system SHALL expose a read endpoint that returns teachers whose names match a supplied query string, identifying each teacher independently of the classes they teach.

#### Scenario: Matching teachers returned

- **WHEN** a client requests teachers matching a non-empty query
- **THEN** the response contains teachers whose names match the query
- **AND** each entry identifies the teacher (name and a stable identifier)

#### Scenario: No match

- **WHEN** a client requests teachers matching a query with no matches
- **THEN** the response is an empty list rather than an error

#### Scenario: Empty query

- **WHEN** a client requests teachers with an empty or missing query
- **THEN** the system returns an empty list or a validation error rather than the full teacher roster
