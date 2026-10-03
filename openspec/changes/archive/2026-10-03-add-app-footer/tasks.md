# Tasks

## 1. Admin email configuration

- [x] 1.1 Add `VITE_ADMIN_EMAIL` to the Vite env type declarations (e.g. `apps/web/src/vite-env.d.ts` `ImportMetaEnv`).
- [x] 1.2 Add an `apps/web/.env.example` entry documenting `VITE_ADMIN_EMAIL` with the placeholder value.
- [x] 1.3 Add a `lib` helper (e.g. `getAdminEmail()`) that reads `import.meta.env.VITE_ADMIN_EMAIL` and falls back to the documented placeholder when unset/empty.

## 2. Footer component

- [x] 2.1 Create `components/layout/Footer.tsx` rendering the fixed disclaimer paragraph and a "Quản trị" `<a href="mailto:...">` link built from the admin-email helper.
- [x] 2.2 Style with design-system tokens (muted foreground for disclaimer, link/primary token for "Quản trị") and add `print:` variants so it stays readable in print.
- [x] 2.3 Ensure the link is keyboard-focusable and announced as an email link (semantic `<a>`, accessible name).

## 3. App-wide integration

- [x] 3.1 Introduce a layout wrapper (`components/layout/AppLayout.tsx`) that renders route content followed by `Footer`.
- [x] 3.2 Wire the layout into the router/app shell (`App.tsx` or a React Router layout route) so the footer appears on every view exactly once.

## 4. Tests & validation

- [x] 4.1 Add component tests: disclaimer text renders, "Quản trị" link present with correct `mailto:` recipient (configured value and placeholder fallback).
- [x] 4.2 Add a test asserting the footer renders app-wide via the layout.
- [x] 4.3 Run `pnpm lint` → `pnpm typecheck` → `pnpm test` → `pnpm build`; all must pass.
