# Design

## Context

Admin access today is a static shared secret: the web build embeds
`VITE_ADMIN_TOKEN` (`apps/web/src/features/timetable-admin/adminToken.ts`) and
sends it as the `x-admin-token` header on every admin request. The API compares
it in constant time against `ADMIN_TOKEN`
(`apps/api/src/middleware/requireAdmin.ts`, `apps/api/src/config.ts`), failing
closed when unset. The admin page (`TimetableAdminPage.tsx`) is served
unconditionally at the `/admin` route (`apps/web/src/app/Router.tsx`); there is
no login step and no logout.

Constraints:
- Strict API layering (`routes → services → repositories → drizzle → db`) and
  Zod I/O contracts in `packages/shared` (per root AGENTS.md).
- SQLite via Drizzle is the only persistence; there is no existing session store.
- Mobile-first; UI primitives from shadcn/ui in `components/ui`.
- The `timetable-admin` capability is introduced by the sibling in-progress
  change `import-timetable-admin` and is not yet in `openspec/specs/`.

## Goals / Non-Goals

**Goals:**
- A username/password login page that gates the admin area.
- Admin credentials verified server-side only; never shipped to the browser.
- Admin API requests authorized by a server-issued opaque session token.
- Session lasts until logout or browser-session end; explicit logout.

**Non-Goals:**
- Multiple admin accounts, roles, or a user table.
- Password reset, lockout/rate-limiting, or account management UI.
- Persistent "remember me" across browser restarts.
- Replacing SQLite or introducing a dedicated session datastore/Redis.

## Decisions

### Credentials in API environment
Add `ADMIN_USERNAME` and `ADMIN_PASSWORD` to the API config
(`apps/api/src/config.ts`), replacing `ADMIN_TOKEN`. Login fails closed when
either is unset/empty (mirrors today's fail-closed token behavior). Compare both
username and password with constant-time comparison (reuse the existing
`timingSafeEqual` helper pattern).

### Session token, issued and verified server-side
On successful login, the API generates a cryptographically random opaque token
(`crypto.randomBytes`) and stores it in an **in-memory** session set/map in the
API process. `requireAdmin` changes from token-equality to "is this session
token present and valid". Rationale: the admin tool is small and single-process;
an in-memory set is the simplest thing that keeps the secret off the client and
supports explicit logout. Alternatives considered: (a) signed stateless token
(JWT/HMAC) — avoids storage but can't be revoked on logout without a denylist,
more moving parts; (b) persisting sessions in SQLite — survives restarts but
adds a repository/migration for no stated requirement. In-memory is chosen; a
process restart invalidating sessions is acceptable (admin simply logs in again)
and consistent with the "until session ends" lifetime.

### Transport: session token header, stored in sessionStorage
The web stores the returned session token in `sessionStorage` (scoped to the tab
session; cleared on tab/browser close → satisfies "until browser session ends,
no persistence across restarts"). Admin requests send it as an
`authorization: Bearer <token>` header, replacing `x-admin-token`. `authHeaders()`
in `useAdminTimetables.ts` and the direct fetch in `TimetableAdminPage.tsx` read
the token from a small `adminSession` module (replacing `adminToken.ts`).
Rationale for header + sessionStorage over an HttpOnly cookie: no CSRF surface to
manage, matches the existing header-based fetch wiring, and the simplest change.
Trade-off: token readable by JS — acceptable for this small internal tool and no
worse than today, where the secret is already in client JS.

### Endpoints and contracts
- `POST /api/admin/login` — body `{ username, password }`; returns
  `{ token }` on success, 401 on mismatch or unconfigured credentials. This route
  is NOT behind `requireAdmin`.
- `POST /api/admin/logout` — behind `requireAdmin`; invalidates the caller's
  session; returns 204.
- Existing admin routes keep the `requireAdmin` preHandler, now session-based.
Add Zod schemas (`loginRequestSchema`, `loginResponseSchema`) to
`packages/shared/src/schemas` as the source of truth for both ends.

### Frontend routing / guard
`/admin` renders the admin page only when a session token exists in
`sessionStorage`; otherwise it renders the login page. A 401 from any admin
request clears the stored token and returns the user to login. Logout calls
`POST /api/admin/logout`, clears `sessionStorage`, and shows the login page.
Keep login/admin print-neutral (no `print:` concerns here).

## Risks / Trade-offs

- **In-memory sessions lost on API restart**: all admins must re-login after a
  deploy/restart. Accepted — matches the lightweight lifetime requirement.
- **Token in sessionStorage is JS-readable**: XSS could exfiltrate it. No worse
  than the current embedded token; mitigated by the app's small surface and no
  third-party script injection.
- **No rate limiting on login**: brute-force is possible against a single
  password. Out of scope for this change; note for a future hardening change.
- **Sequencing dependency**: this delta MODIFIES/REMOVES requirements in
  `timetable-admin`, which only lands in `openspec/specs/` once the sibling
  `import-timetable-admin` change is archived. `openspec validate` already warns
  that archiving this delta before then would be refused. Implementation of this
  change also edits code introduced by that sibling change. Therefore this change
  must be applied/archived **after** `import-timetable-admin`.
