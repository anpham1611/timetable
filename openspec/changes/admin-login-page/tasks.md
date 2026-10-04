# Tasks

> Sequencing: apply/archive this change only after the sibling
> `import-timetable-admin` change, since it edits that change's admin code and
> MODIFIES its `timetable-admin` spec.

## 1. Shared contracts

- [x] 1.1 Add `loginRequestSchema` (`{ username: string, password: string }`) and `loginResponseSchema` (`{ token: string }`) with exported types to `packages/shared/src/schemas/`, and export from the shared index.
- [x] 1.2 Add a unit test asserting valid/invalid shapes for the login schemas.

## 2. API credentials & sessions

- [x] 2.1 Replace `getAdminToken()` in `apps/api/src/config.ts` with `getAdminCredentials()` reading `ADMIN_USERNAME` + `ADMIN_PASSWORD` (trimmed); return `undefined` if either is unset/empty (fail closed). Update `config.test.ts`.
- [x] 2.2 Add a session store module in the API (in-memory set/map) with `createSession()` → random opaque token (`crypto.randomBytes`), `isValidSession(token)`, and `revokeSession(token)`.

## 3. API auth endpoints & gate

- [x] 3.1 Rewrite `apps/api/src/middleware/requireAdmin.ts` to read a Bearer token from the `authorization` header and authorize via `isValidSession`; reject with 401 when credentials unconfigured, header missing, or session invalid. Remove `x-admin-token`.
- [x] 3.2 Add `POST /login` (not gated) in the admin routes: validate body with `loginRequestSchema`, constant-time compare username+password against configured credentials, create a session, return `{ token }`; 401 on mismatch or unconfigured.
- [x] 3.3 Add `POST /logout` (gated by `requireAdmin`) that revokes the caller's session and returns 204.
- [x] 3.4 Update `admin.test.ts` / `admin-import.test.ts` to log in and send the Bearer session token; add tests for login success/failure, unconfigured-credentials rejection, logout invalidation, and gate rejection without a session.

## 4. Web session handling

- [x] 4.1 Replace `apps/web/src/features/timetable-admin/adminToken.ts` with an `adminSession` module: get/set/clear the session token in `sessionStorage` and build `authorization: Bearer` headers. Remove `VITE_ADMIN_TOKEN` from `vite-env.d.ts`.
- [x] 4.2 Update `useAdminTimetables.ts` and the template download in `TimetableAdminPage.tsx` to use the Bearer auth headers; on a 401, clear the stored session.

## 5. Web login page & guard

- [x] 5.1 Add a `LoginForm`/login view (React Hook Form + Zod resolver using `loginRequestSchema`, shadcn/ui inputs + Button) that POSTs to `/api/admin/login`, stores the returned token, and shows an error on failure.
- [x] 5.2 Guard the `/admin` route in `Router.tsx` (or within the admin feature) to render the login view when no session token exists and the admin page when it does.
- [x] 5.3 Add a logout control to the admin page that calls `POST /api/admin/logout`, clears `sessionStorage`, and returns to the login view.
- [x] 5.4 Add/update web tests: login success navigates to admin, wrong credentials show an error, `/admin` without a session shows login, logout returns to login. Update `Router.test.tsx`.

## 6. Config, docs & verification

- [x] 6.1 Update any `.env`/example and docs to use `ADMIN_USERNAME` + `ADMIN_PASSWORD` and drop `ADMIN_TOKEN` / `VITE_ADMIN_TOKEN`.
- [x] 6.2 Run `pnpm lint → pnpm typecheck → pnpm test → pnpm build`; all must pass.
