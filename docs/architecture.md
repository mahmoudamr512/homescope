# HomeScope Architecture

See `docs/superpowers/specs/2026-06-21-homescope-design.md` for the full design.

## Monorepo

- `apps/web` — Next.js App Router app + typed API route handlers.
- `packages/contract` — Zod schemas, TS types, the API contract.
- `packages/config` — shared ESLint config and design tokens.
- `etl/` — Python pipeline (extract -> validate -> normalize -> load -> tile).
- `db/` — Drizzle schema and PostGIS migrations.
- `infra/` — Docker Compose stacks (local + self-host production).

This document is expanded as milestones land.
