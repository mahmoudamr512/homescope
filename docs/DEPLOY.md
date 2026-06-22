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

Create a Blob store in the Vercel dashboard (Storage -> Create -> Blob) and copy its
read-write token. Then upload the four PMTiles with the helper script:

```bash
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..." node scripts/upload-tiles-blob.mjs
```

It uploads `state/metro/county/zip.pmtiles` and prints the `NEXT_PUBLIC_TILES_URL` to
set (e.g. `https://<id>.public.blob.vercel-storage.com/tiles`). Blob URLs support the
HTTP range requests PMTiles needs.

## 4. Vercel project

New Project -> import `mahmoudamr512/homescope`. In the import settings set
**Root Directory = `apps/web`** (Vercel then auto-detects Next.js and installs the pnpm
workspace from the repo root). Add environment variables:

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
