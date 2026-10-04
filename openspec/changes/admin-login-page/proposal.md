# Proposal

## Why

The admin area is currently gated by a single shared secret token that is baked
into the web build (`VITE_ADMIN_TOKEN`) and sent on every request. There is no
login step: anyone who loads the admin build already holds the token, the
secret is shipped to the browser, and there is no notion of "logging in" or
"logging out". A simple username + password login page gives admins a familiar
entry point and keeps the secret on the server instead of in the client bundle.

## What Changes

- Add an admin **login page**: an admin enters a username and password; on
  success they reach the timetable admin page, on failure they see an error and
  stay on the login page.
- The API verifies the submitted username/password against credentials
  configured in its environment (`ADMIN_USERNAME`, `ADMIN_PASSWORD`) and, on
  success, issues an opaque **session token**. Admin API requests are authorized
  by that session token rather than by a client-held shared secret.
- The admin session lasts until the browser tab/session ends (no "remember me"),
  and an admin can explicitly **log out** to end it.
- **BREAKING**: Remove the shared static-token gate. The `x-admin-token` header
  flow and the `VITE_ADMIN_TOKEN` / `ADMIN_TOKEN` environment variables are
  replaced. The admin password is no longer present in the web build.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `timetable-admin`: The authorization gate changes from "a valid shared admin
  token supplied with the request" to "a valid admin session obtained by logging
  in with a configured username and password". Adds login, session-based
  authorization, and logout behavior.

## Impact

- **API**: new login and logout endpoints; session token issue/verify; admin
  gate (`requireAdmin`) now checks a session token; config reads
  `ADMIN_USERNAME` / `ADMIN_PASSWORD` instead of `ADMIN_TOKEN`.
- **Web**: new login page and route; admin page guarded behind login; session
  token stored in `sessionStorage` and attached to admin requests; a logout
  control; removal of `VITE_ADMIN_TOKEN` / `x-admin-token` usage.
- **Config/Docs**: `.env` keys change (`ADMIN_USERNAME`, `ADMIN_PASSWORD`
  replace `ADMIN_TOKEN`; `VITE_ADMIN_TOKEN` removed).
- **Note**: The `timetable-admin` capability is introduced by the in-progress
  `import-timetable-admin` change; this change assumes that boundary and revises
  its authorization requirement.
