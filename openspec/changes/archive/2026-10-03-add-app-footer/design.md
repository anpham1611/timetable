# Design

## Context

`apps/web` is a React 19 + Vite + React Router SPA. Today there is no shared layout shell: `App.tsx` wraps `Providers` around `Router`, and the single route renders `TimetableHomePage` directly, which owns its own `<main>`. There is currently only one route, but the footer must be app-wide, so it should live above the per-route content rather than inside any single page. No `import.meta.env` usage or `.env` files exist yet, so the admin-email config path is being introduced by this change. Design-system tokens and Tailwind `print:` variants are already the established conventions (see `design-system` spec and AGENTS.md).

## Goals / Non-Goals

**Goals:**
- Render a single footer on every view via a shared layout, independent of route.
- Fixed Vietnamese disclaimer text plus a "Quản trị" `mailto:` link.
- Read the recipient address from configuration with a placeholder fallback.
- Use design-system tokens; legible in light/dark and in print.

**Non-Goals:**
- No in-app mail composition/sending; hand off to the native client via `mailto:`.
- No backend, API, or shared-package changes.
- No configurable disclaimer wording (text is fixed this change).

## Decisions

- **App-wide placement via a layout wrapper.** Introduce a layout component (e.g. `components/layout/AppLayout.tsx`) that renders `{children}`/`<Outlet />` followed by the `Footer`, and wrap the router content with it (in `App.tsx` or as a React Router layout route in `Router.tsx`). This guarantees one footer across all current and future routes without each page re-declaring it. Alternative — adding the footer inside `TimetableHomePage` — is rejected because it is page-scoped and violates the app-wide requirement.
- **New `Footer` component in `components/layout/`.** Keeps it beside `ThemeToggle` as shared layout UI. Renders the disclaimer paragraph and an anchor (`<a href="mailto:...">Quản trị</a>`) for native keyboard/screen-reader link semantics and accessibility.
- **Admin email from `import.meta.env` with placeholder.** Read `import.meta.env.VITE_ADMIN_EMAIL` and fall back to a documented placeholder (e.g. `daotao@example.edu.vn`) when unset/empty, so the link never renders broken. Centralize the resolution in a small `lib` helper (e.g. `getAdminEmail()`) and build `mailto:${email}`. Add the env var typing to Vite env declarations and document it in `.env.example`.
- **Styling via tokens + print variant.** Use muted foreground token for the disclaimer and the primary/link token for "Quản trị"; include `print:` classes so the footer stays present and readable in printed output. No hard-coded colors.

## Risks / Trade-offs

- **mailto: dependence on a configured client.** If the user has no default mail client, activating the link does nothing visible. Accepted: `mailto:` is the standard, lowest-friction approach and in scope per the request; no in-app fallback this change.
- **Placeholder email could ship to production.** Mitigate by documenting `VITE_ADMIN_EMAIL` in `.env.example` and the proposal; the placeholder keeps the UI functional until set.
- **Introducing a layout layer touches app bootstrap.** Minor refactor of `App.tsx`/`Router.tsx`; low risk given the single existing route, and it establishes the correct seam for future shared chrome.
