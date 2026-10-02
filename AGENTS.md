# AGENTS.md

Timetable app: students and teachers view/print timetables; teachers import timetables from Excel.

> **Status: scaffolded.** The pnpm workspace is wired up with `apps/web`, `apps/api`, and `packages/shared`, plus a `/health` vertical slice that proves the full stack (web → api routes → services → repositories → drizzle/SQLite, with a shared Zod contract on both ends). No real timetable/Excel/print features exist yet — those still go through OpenSpec. Keep this file in sync with reality as the code grows.

## Workspace

- **pnpm workspaces** (pnpm `12.8.1`, pinned via `packageManager`). Use `pnpm`, never npm/yarn.
- Root `package.json` is `"type": "module"` — all packages are ESM.
- **Do NOT add Turborepo** (or Nx/Lerna) unless there is a concrete, stated need.
- A root `pnpm-workspace.yaml` listing `apps/*` and `packages/*` must exist before workspace packages resolve — create it when scaffolding.

## Layout

```
apps/
├── web/                       # React 19 + Vite + TS frontend
│   └── src/
│       ├── app/               # App bootstrap, providers, router
│       ├── components/
│       │   ├── ui/            # shadcn/ui primitives (generated — treat as vendored)
│       │   └── layout/        # Application-level layout
│       ├── features/          # Business/domain features
│       ├── hooks/             # Generic reusable hooks
│       ├── lib/               # Generic utilities/infrastructure
│       └── main.tsx
│
└── api/                       # Fastify + TS backend
    └── src/
        ├── routes/            # HTTP routes
        ├── services/          # Business logic/use cases
        ├── repositories/      # Database access
        ├── db/                # Drizzle setup/schema (SQLite)
        ├── middleware/        # Fastify middleware/hooks
        └── index.ts

packages/
└── shared/                    # Shared contracts (imported by web + api; imports neither)
    └── src/
        ├── schemas/           # Zod schemas (source of truth for I/O contracts)
        ├── types/             # Shared domain types
        └── index.ts

openspec/                      # Product specs & changes (spec-driven; see openspec/config.yaml)
AGENTS.md                      # Project-wide agent instructions
```

## Commands

Run from the repo root (pnpm workspace):

- `pnpm dev` — run web + api together (parallel)
- `pnpm test` — run all package test suites (vitest)
- `pnpm lint` — eslint across the workspace
- `pnpm typecheck` — tsc `--noEmit` per package
- `pnpm build` — build `shared`, then both apps
- `pnpm --filter @timetable/api run db:generate` / `db:migrate` — drizzle-kit migrations

## Conventions

- Mobile-first: check at 375px first.
- Validate all input with Zod schemas from `packages/shared`.
- Do not add a new dependency without asking first.
- Every new feature needs an OpenSpec proposal before any code.

## Architecture rules (enforce these)

- **Strict one-way layering** in the API: `routes → services → repositories → drizzle → db`. Never skip or reverse layers — e.g. a route must not touch a repository directly, a service must not run raw SQL.
- `packages/shared` is a leaf: it is imported by **both** web and api but **imports neither**. Put only genuinely shared Zod schemas / contract types here. Frontend-only or backend-only types stay in their app.
- Input/output contracts (request/response shapes) are Zod schemas in `packages/shared` and are the single source of truth for both ends.

## Frontend conventions

- Server state via **TanStack Query**; forms via **React Hook Form** + **Zod** resolver (reuse the shared schemas). Routing via **React Router**.
- Styling: **Tailwind CSS**. UI primitives come from **shadcn/ui** in `components/ui` — add new primitives via the shadcn CLI rather than hand-writing them.
- Print support is a product requirement — keep print-specific styling isolated (Tailwind `print:` variants) so screen views stay clean.

## Backend conventions

- **Drizzle ORM** over **SQLite**. DB access only through `repositories/`. Keep the Drizzle schema in `apps/api/src/db` and generate/run migrations with `drizzle-kit` (wire up `drizzle.config.ts` when scaffolding).
- Excel import (teacher flow) is backend business logic → `services/`, exposed via a `routes/` endpoint, validated against a shared Zod contract.

## OpenSpec

- This project is spec-driven. Product changes go through `openspec/` (see the `openspec-*` skills). Check `openspec/changes/` before implementing a feature.

## Before marking work done

Run, in order: **`pnpm lint` → `pnpm typecheck` → `pnpm test` → `pnpm build`**. All must pass.
