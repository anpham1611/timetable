# Spec Delta

## Purpose

A persistent, application-wide footer that shows the Vietnamese data-source disclaimer for the aggregated timetable data and gives users a one-tap way to contact the administrator to report errors.

## ADDED Requirements

### Requirement: Footer disclaimer text

The application SHALL display a footer on every view containing the fixed Vietnamese disclaimer "Dữ liệu tổng hợp từ file thời khóa biểu Excel của trường. Có sai sót xin báo lại phòng đào tạo." as the first line and "Quản trị" as a second element.

#### Scenario: Footer shown on load

- **WHEN** a user opens any view of the application
- **THEN** a footer is shown containing the text "Dữ liệu tổng hợp từ file thời khóa biểu Excel của trường. Có sai sót xin báo lại phòng đào tạo."
- **AND** a "Quản trị" element is shown below or after that disclaimer line

### Requirement: Administrator contact link

The footer SHALL render "Quản trị" as an actionable link that, when activated, opens the user's email client addressed to the configured administrator email so the user can report errors.

#### Scenario: Activating the admin link opens email

- **WHEN** a user activates the "Quản trị" link
- **THEN** the user's native email client is invoked (via a `mailto:` action) with the configured administrator email as the recipient

#### Scenario: Link is keyboard and screen-reader accessible

- **WHEN** a user navigates the footer with a keyboard or assistive technology
- **THEN** the "Quản trị" element is reachable and identifiable as a link that sends an email

### Requirement: Configurable administrator email

The administrator email target of the "Quản trị" link SHALL come from configuration rather than being fixed in the UI, and a safe placeholder SHALL be used when no value is configured.

#### Scenario: Configured email is used

- **WHEN** an administrator email is provided via configuration
- **THEN** the "Quản trị" link's `mailto:` recipient is that configured address

#### Scenario: No email configured

- **WHEN** no administrator email is configured
- **THEN** the "Quản trị" link still renders and targets a documented placeholder address
- **AND** the view does not break or show a broken/empty link

### Requirement: Footer visual integration

The footer SHALL use the application's design-system tokens for color and typography and SHALL remain legible in both light and dark themes and when printed.

#### Scenario: Footer respects theme

- **WHEN** the application renders in either the light or the dark theme
- **THEN** the footer text and link colors resolve from design-system tokens and remain legible against the surface

#### Scenario: Footer appears in print output

- **WHEN** a user prints a view
- **THEN** the footer disclaimer and the administrator contact remain present and readable in the printed output
