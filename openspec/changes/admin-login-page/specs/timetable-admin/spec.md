# Spec Delta

## MODIFIED Requirements

### Requirement: Admin authorization gate

All admin operations (listing all timetables, toggling active state, importing a workbook, and downloading the template) SHALL require a valid admin session supplied with the request. An admin session is obtained by logging in with the configured admin username and password. Requests without a valid session SHALL be rejected and SHALL NOT read or modify any data.

#### Scenario: Request with a valid admin session

- **WHEN** an admin operation is requested with a valid admin session
- **THEN** the operation is authorized and proceeds

#### Scenario: Request with a missing or invalid session

- **WHEN** an admin operation is requested without a session or with an expired, revoked, or otherwise invalid session
- **THEN** the system rejects the request as unauthorized
- **AND** performs no read or write of timetable or directory data

#### Scenario: Admin credentials not configured

- **WHEN** no admin username and password are configured for the system
- **THEN** login SHALL fail and every admin operation SHALL be rejected as unauthorized rather than defaulting to open access

## ADDED Requirements

### Requirement: Admin login

The system SHALL provide an admin login that accepts a username and password and, on a match with the configured admin credentials, establishes an admin session usable to authorize subsequent admin operations. The configured credentials SHALL be held by the server and SHALL NOT be exposed to the browser.

#### Scenario: Login with correct credentials

- **WHEN** a user submits the configured admin username and password
- **THEN** the system establishes an admin session
- **AND** the user reaches the admin management page

#### Scenario: Login with incorrect credentials

- **WHEN** a user submits a username or password that does not match the configured credentials
- **THEN** the system rejects the login and establishes no session
- **AND** the user sees an error and remains on the login page

#### Scenario: Reaching admin without a session

- **WHEN** a user attempts to open the admin management page without a valid session
- **THEN** the user is presented with the login page instead of admin content

### Requirement: Admin session lifetime

An admin session SHALL last until the admin logs out or the browser session ends, whichever comes first; it SHALL NOT persist across browser restarts.

#### Scenario: Admin logs out

- **WHEN** a logged-in admin chooses to log out
- **THEN** the session is ended
- **AND** subsequent admin operations are rejected as unauthorized until the admin logs in again

#### Scenario: Browser session ends

- **WHEN** the browser session ends (for example, the tab or browser is closed) and is later reopened
- **THEN** the admin is no longer logged in and must log in again to perform admin operations
