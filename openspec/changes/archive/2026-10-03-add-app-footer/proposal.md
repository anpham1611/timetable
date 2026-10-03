# Proposal

## Why

The timetable data shown in the app is aggregated from the school's Excel timetable files and may contain mistakes. Users currently have no on-screen notice of this, and no obvious way to report errors to the training office (phòng đào tạo). A persistent footer gives every view a clear data-source disclaimer and a one-tap way to contact the administrator.

## What Changes

- Add an application-wide footer shown on every view.
- The footer displays the fixed Vietnamese text:
  - Line 1: "Dữ liệu tổng hợp từ file thời khóa biểu Excel của trường. Có sai sót xin báo lại phòng đào tạo."
  - Line 2: "Quản trị" — rendered as a clickable link.
- The "Quản trị" link opens the user's email client (a `mailto:` action) addressed to a configurable administrator email, so users can report errors.
- The administrator email address is read from configuration (with a safe placeholder default), not hard-coded, so it can be set per deployment.

Out of scope:
- No in-app email composition/sending UI; the link hands off to the device's native mail client.
- No new backend endpoint or data model changes.
- No wording configurability for the disclaimer text (it is fixed in this change).

## Capabilities

### New Capabilities
- `app-footer`: A persistent, application-wide footer that displays the fixed Vietnamese data-source disclaimer and an administrator contact link that opens the native email client via `mailto:` to a configurable address.

### Modified Capabilities
<!-- None. -->

## Impact

- Frontend (`apps/web`): a new footer component rendered app-wide (in the app layout/shell), using design-system tokens and supporting print styling per repo conventions.
- Configuration: a new frontend config value for the administrator email (e.g. a `VITE_`-prefixed env var) with a placeholder default.
- No API, database, or shared-package changes.
