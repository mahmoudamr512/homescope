# HomeScope Deployment

Target: **Vercel** (app) + **Neon** (Postgres/PostGIS, free tier) + **Vercel Blob** (PMTiles).
Recurring cost ~$0.

## Why the hosted DB is slim

The full dataset is ~1.4 GB (the 8.67M-row monthly fact table). Neon's free tier is
0.5 GB, so the hosted database is a slim subset produced by `export-neon`:

- the `geom` column is omitted (geometry is served from PMTiles; search uses `centroid`,
  and `geom` is never read at runtime),
- full monthly history for state/metro/county,
- the most recent 12 months for ZIPs.

This fits comfortably under 0.5 GB. Everything the app renders still works; ZIP charts
show recent history rather than five years.

## 1. Neon database

1. Create a Neon project. Enable PostGIS: `CREATE EXTENSION IF NOT EXISTS postgis;`
   (the migration also does this).
2. Copy the connection string (`postgresql://...neon.tech/...?sslmode=require`).
3. Apply the schema and seed metrics:
   ```bash
   DATABASE_URL="<neon-url>" pnpm --filter @homescope/db db:migrate
   DATABASE_URL="<neon-url>" pnpm --filter @homescope/db db:seed-metrics
   ```

## 2. Build data + tiles locally, export slim to Neon

```bash
# Full local build (Postgres on 5433 via Docker)
docker compose -f infra/docker-compose.yml up -d postgres
DATABASE_URL=postgresql://homescope:homescope@localhost:5433/homescope \
  pnpm --filter @homescope/db db:migrate
DATABASE_URL=postgresql://homescope:homescope@localhost:5433/homescope \
  pnpm --filter @homescope/db db:seed-metrics
docker compose -f infra/docker-compose.yml run --rm etl python -m homescope_etl load-geometry
docker compose -f infra/docker-compose.yml run --rm etl python -m homescope_etl run
docker compose -f infra/docker-compose.yml run --rm etl python -m homescope_etl build-tiles

# Export the slim subset into Neon (runs from the ETL container; reaches Neon over TLS)
docker compose -f infra/docker-compose.yml run --rm etl \
  python -m homescope_etl export-neon --target "<neon-url>"
```

## 3. PMTiles on Vercel Blob

Upload `apps/web/public/tiles/{state,metro,county,zip}.pmtiles` to Vercel Blob (via the
Vercel MCP or `vercel blob put`). Blob URLs support HTTP range requests, which PMTiles
needs. Note the base URL (e.g. `https://<id>.public.blob.vercel-storage.com/tiles`).

## 4. Vercel project

Import the repo (the root `vercel.json` sets the install/build commands). Set environment
variables in the Vercel project:

| Variable | Value |
|---|---|
| `DATABASE_URL` | the Neon connection string |
| `NEXT_PUBLIC_TILES_URL` | the Vercel Blob tiles base URL |
| `NEXT_PUBLIC_AUTHOR_PHOTO` | optional, e.g. `/mahmoud-amr.jpg` or a full URL |

Deploy. Point your subdomain (`homescope.mahmoudamr.dev`) at the Vercel project.

## 5. Scheduled refresh (optional)

Add a `NEON_DATABASE_URL` repository secret (`gh secret set NEON_DATABASE_URL`). The
"Scheduled ETL refresh" workflow then rebuilds the full dataset in a CI-local Postgres
monthly and re-exports the slim subset to Neon. Without the secret it is a no-op.

## Notes

- Observability (Sentry/web-vitals) is intentionally pluggable and not wired by default.
- For a fully self-hosted alternative, see `infra/docker-compose.prod.yml`.
