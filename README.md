# HomeScope

Interactive US housing-market explorer — a choropleth across **state, metro, county, and ZIP**,
with instant metric switching, per-region historical charts, search, and shareable deep links.

Geometry is real (US Census TIGER/Line). Metric data is synthetic, deterministic, and labeled as
such. Built by **Mahmoud Amr** as an open-source geospatial data-product showcase.

- Live: https://homescope.mahmoudamr.dev
- How it's built: https://homescope.mahmoudamr.dev/how-its-built

## What it demonstrates

- **Mapbox-class mapping** with MapLibre GL JS and self-hosted PMTiles (no token, no tile bill).
- **Large datasets without lag** — 33,000+ ZIP polygons recolor instantly via `feature-state`; the
  metric switch never refetches geometry.
- **A drift-resilient ETL** — source adapters validated against explicit Pydantic contracts; a
  drifted source is rejected with a diagnostic and isolated, never corrupting good data.
- **Proper data modeling** — a dimensional model over PostGIS with a single cross-language metric
  registry.

## Stack

Next.js (App Router) + TypeScript · MapLibre GL JS + PMTiles · Postgres + PostGIS · Drizzle ·
Python ETL (Pydantic) · tippecanoe · TanStack Query · Recharts · Tailwind.

## Monorepo layout

```
apps/web         Next.js app + typed API route handlers
packages/contract  Zod schemas + the single metric registry
packages/config    shared ESLint config + design tokens
packages/db        Drizzle schema, migrations, client
etl/             Python pipeline: extract -> validate -> normalize -> load -> tile
infra/           Docker Compose (local + self-host production)
docs/            architecture, data dictionary, specs and plans
```

## Run it locally (under 15 minutes)

```bash
pnpm install
cp .env.example .env
cp .env .env  # web reads apps/web/.env.local; see below

# 1. Database
docker compose -f infra/docker-compose.yml up -d postgres

# 2. Schema + metric dimension
DATABASE_URL=postgresql://homescope:homescope@localhost:5433/homescope \
  pnpm --filter @homescope/db db:migrate
DATABASE_URL=postgresql://homescope:homescope@localhost:5433/homescope \
  pnpm --filter @homescope/db db:seed-metrics

# 3. Geometry, metrics, and tiles (in the ETL container)
docker compose -f infra/docker-compose.yml run --rm etl python -m homescope_etl load-geometry
docker compose -f infra/docker-compose.yml run --rm etl python -m homescope_etl run
docker compose -f infra/docker-compose.yml run --rm etl python -m homescope_etl build-tiles

# 4. App (apps/web/.env.local should contain DATABASE_URL=...localhost:5433...)
pnpm dev
```

## Deploy

- **Vercel + Neon** (cheap, ~$0): import the repo; `vercel.json` builds the web app. Set
  `DATABASE_URL` to your Neon connection string (enable the PostGIS extension), and
  `NEXT_PUBLIC_TILES_URL` to wherever the PMTiles are hosted (CDN/object storage).
- **Self-host**: `infra/docker-compose.prod.yml` runs the full stack; the bootstrap sequence is
  documented at the top of that file.

## Quality

Typed end-to-end. CI runs lint, typecheck, and tests for the app and unit tests for the ETL.
Contract tests prove the ETL rejects drifted sources without corrupting good data.

## License

MIT (c) Mahmoud Amr
