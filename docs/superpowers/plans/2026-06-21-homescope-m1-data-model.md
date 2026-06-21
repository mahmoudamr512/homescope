# HomeScope M1 — Data Model, Generator, Geometry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Stand up the PostGIS dimensional model (Drizzle), a deterministic synthetic-metric generator (Python), and a containerized loader that brings real Census geometry into PostGIS — so the database holds real regions and plausible synthetic metrics.

**Architecture:** A `@homescope/db` workspace package owns the Drizzle schema, client, and SQL migrations over Postgres+PostGIS. The ETL runs in Docker (`Dockerfile.etl`: Python 3.12 + GDAL + tippecanoe) so the host's Python 3.14 and missing GDAL/tippecanoe are irrelevant. Geometry comes from Census cartographic boundary shapefiles loaded via `ogr2ogr`; metrics come from a seeded pure-Python generator. Same seed produces the same dataset.

**Tech Stack:** Drizzle ORM + drizzle-kit, postgres.js, Postgres 16 + PostGIS 3.4, Python 3.12 (Pydantic, stdlib RNG), GDAL/ogr2ogr, tippecanoe (M2).

## Global Constraints

(Inherits all M0 global constraints.) Additionally:
- Database is the canonical model from the design spec (dim_region, dim_metric, fact region_metric_monthly, matview region_metric_current).
- Region id format: `{resolution}:{geoid}` (e.g. `state:48`, `county:48453`, `zip:78704`).
- Generator is deterministic: same seed => identical dataset (DR-6).
- Metric registry (`metrics.json`) remains the single source of truth; the DB `dim_metric` is seeded from it.

---

### Task 1: `@homescope/db` package — Drizzle schema

**Files:**
- Create: `packages/db/package.json`
- Create: `packages/db/tsconfig.json`
- Create: `packages/db/eslint.config.mjs`
- Create: `packages/db/drizzle.config.ts`
- Create: `packages/db/src/schema.ts`
- Create: `packages/db/src/client.ts`
- Create: `packages/db/src/index.ts`

**Interfaces:**
- Produces: `regions`, `metrics` (dim), `regionMetricMonthly` (fact) Drizzle tables; `Resolution` enum type `"state" | "metro" | "county" | "zip"`; `getDb()` returning a Drizzle client over postgres.js reading `DATABASE_URL`.

- [ ] Step 1: Create package manifest, tsconfig, eslint config (mirror packages/contract).
- [ ] Step 2: Define the Drizzle schema. `regions` (regionId text PK, resolution enum, geoid text, name text, parentStateGeoid text null, parentCountyGeoid text null). Geometry columns (`geom`, `centroid`) are added via raw SQL migration (Task 2) since drizzle-orm core lacks first-class PostGIS types; the table type carries them as `customType` of `geometry`. `metrics` (metricKey PK, label, unit, format, aggregation). `regionMetricMonthly` (regionId, metricKey, period date, value numeric; composite PK).
- [ ] Step 3: Implement `getDb()` (postgres.js + drizzle). Lazy singleton.
- [ ] Step 4: Export schema + client from index.
- [ ] Step 5: typecheck + lint. Commit `feat(db): add drizzle dimensional schema and client`.

### Task 2: SQL migrations + PostGIS columns + matview

**Files:**
- Create: `packages/db/migrations/0000_init.sql`
- Create: `packages/db/src/migrate.ts`
- Modify: `packages/db/package.json` (add `db:migrate`, `db:generate` scripts)

**Interfaces:**
- Produces: applied schema in Postgres including `geometry(MultiPolygon,4326)` columns, GIST indexes, and the `region_metric_current` materialized view. `migrate.ts` runs all SQL files in order, idempotently.

- [ ] Step 1: Author `0000_init.sql`: tables matching the Drizzle schema, plus `ALTER TABLE regions ADD COLUMN geom geometry(MultiPolygon,4326)`, `centroid geometry(Point,4326)`, GIST indexes on both, index on `regions(resolution)`, and `CREATE MATERIALIZED VIEW region_metric_current AS SELECT DISTINCT ON (region_id, metric_key) region_id, metric_key, period, value FROM region_metric_monthly ORDER BY region_id, metric_key, period DESC;` with a unique index for concurrent refresh.
- [ ] Step 2: Implement `migrate.ts` (reads migrations/*.sql sorted, executes each in a transaction, records applied files in a `_migrations` table for idempotency).
- [ ] Step 3: Bring up local PostGIS (`docker compose -f infra/docker-compose.yml up -d postgres`), run `pnpm --filter @homescope/db db:migrate`, verify tables + matview exist (`\dt`, `\dmv`). Re-run to prove idempotency.
- [ ] Step 4: Commit `feat(db): add postgis migrations with geometry columns and current matview`.

### Task 3: Seed `dim_metric` from metrics.json

**Files:**
- Create: `packages/db/src/seed-metrics.ts`
- Modify: `packages/db/package.json` (add `db:seed-metrics`)

**Interfaces:**
- Consumes: `@homescope/contract` metrics registry.
- Produces: `dim_metric` rows upserted from the registry (idempotent).

- [ ] Step 1: Implement upsert of each registry entry into `metrics`.
- [ ] Step 2: Run it; verify 4 rows. Re-run for idempotency.
- [ ] Step 3: Commit `feat(db): seed metric dimension from the registry`.

### Task 4: Containerized ETL base image (GDAL + tippecanoe)

**Files:**
- Create: `infra/Dockerfile.etl`
- Modify: `infra/docker-compose.yml` (add `etl` service, profile `etl`, mounts repo + DATABASE_URL pointing at `postgres:5432`)

**Interfaces:**
- Produces: an `etl` image with Python 3.12, GDAL/ogr2ogr, and tippecanoe; the package installed editable. `docker compose run --rm etl <cmd>` executes pipeline commands against the compose Postgres.

- [ ] Step 1: Write `Dockerfile.etl` (python:3.12-slim-bookworm; apt-get gdal-bin libgdal-dev build-essential git libsqlite3-dev zlib1g-dev; build tippecanoe from source `git clone felt/tippecanoe && make install`; pip install -e etl). 
- [ ] Step 2: Add the `etl` service to compose under profile `etl`.
- [ ] Step 3: Build the image; verify `ogr2ogr --version` and `tippecanoe --version` inside it.
- [ ] Step 4: Commit `build(etl): containerize etl with gdal and tippecanoe`.

### Task 5: Geometry adapter — download + load Census boundaries

**Files:**
- Create: `etl/homescope_etl/geometry/sources.py` (resolution -> Census cartographic boundary URL)
- Create: `etl/homescope_etl/geometry/load.py` (download, unzip, ogr2ogr into staging tables, transform into `regions`)
- Create: `etl/homescope_etl/__main__.py` (CLI: `load-geometry [--resolution ...]`)
- Test: `etl/tests/test_sources.py`

**Interfaces:**
- Consumes: `DATABASE_URL`.
- Produces: `regions` rows with geom + centroid + parent rollups for the requested resolutions. County parent_state from geoid[:2]; ZCTA parent_county via PostGIS spatial join (largest-overlap), ZCTA parent_state from that county.

- [ ] Step 1: `sources.py` maps state/county/metro/zip to GENZ2023 cb_* shapefile URLs (state 500k, county 500k, cbsa 500k, zcta 500k); test the mapping.
- [ ] Step 2: `load.py` per resolution: download zip to a temp dir, ogr2ogr `-f PostgreSQL` into `staging_<res>` (EPSG:4326, MultiPolygon), then `INSERT INTO regions (...) SELECT ...` building region_id, name, parents, geom, `ST_PointOnSurface` centroid; staged + transactional.
- [ ] Step 3: CLI wires `load-geometry`. Run inside the etl container for `--resolution state county` first; verify row counts and a sample geometry (`SELECT region_id, name, ST_GeometryType(geom) FROM regions LIMIT 5`).
- [ ] Step 4: Run full `state metro county zip`. Verify ~50 states, ~3200 counties, ~900 CBSAs, ~33k ZCTAs.
- [ ] Step 5: Commit `feat(etl): load census geometry into postgis`.

### Task 6: Synthetic metric generator

**Files:**
- Create: `etl/homescope_etl/generate/model.py` (Pydantic models for a metric point/series)
- Create: `etl/homescope_etl/generate/generator.py` (deterministic series: base level keyed off region, trend + seasonality + bounded noise; yoy derived from price)
- Create: `etl/homescope_etl/generate/load.py` (write series into `region_metric_monthly`, staged + transactional, idempotent upsert; refresh matview)
- Modify: `etl/homescope_etl/__main__.py` (CLI: `generate-metrics [--months N] [--seed S]`)
- Test: `etl/tests/test_generator.py` (determinism: same seed => identical; yoy derived from price; values within plausible bounds; child regions roughly aggregate to parents)

**Interfaces:**
- Consumes: `regions` table, `metrics.json`.
- Produces: `region_metric_monthly` rows for every (region, metric, month) over >=60 months; refreshed `region_metric_current`.

- [ ] Step 1: Pydantic models + generator with seeded `random.Random(seed + hash(region_id))`. Base price from a per-region deterministic level (hash of geoid scaled into a plausible band, biased up for larger/known-coastal metros via a small lookup). Trend (gentle CAGR) + 12-month seasonality + bounded noise. inventory and days_on_market correlated inversely with demand. yoy computed from price[t]/price[t-12]-1.
- [ ] Step 2: Tests: determinism, yoy correctness, bounds, aggregation sanity. Run with pytest in the etl container.
- [ ] Step 3: Loader writes to staging then swaps; idempotent on PK. Refresh matview concurrently.
- [ ] Step 4: Run `generate-metrics --months 60` in the container; verify fact row counts and `region_metric_current` populated.
- [ ] Step 5: Commit `feat(etl): add deterministic synthetic metric generator`.

### Task 7: ETL CI job + data dictionary

**Files:**
- Modify: `.github/workflows/ci.yml` (add a `etl` job: setup-python 3.12, pip install -e etl[dev], pytest — pure-Python tests only, no DB/GDAL)
- Create: `docs/data-dictionary.md`

- [ ] Step 1: Split generator tests so pure-logic tests (determinism, yoy, bounds) need no DB/GDAL and run in CI; DB-touching tests are marked and skipped in CI.
- [ ] Step 2: Add the etl CI job; verify green.
- [ ] Step 3: Write `docs/data-dictionary.md` documenting every table, column, unit, and the metric registry.
- [ ] Step 4: Commit `ci: run etl unit tests` and `docs: add data dictionary`.

## Self-Review

Covers spec DR-1..DR-8 (geometry sources, simplification deferred to M2 tiles, identifiers, generator, realism, determinism, schema, current matview, data dictionary) and the M1 milestone. Heavy national data load is a documented, deterministic command; correctness is proven on a subset first, then run at scale. ETL is containerized to remove host toolchain dependence.
