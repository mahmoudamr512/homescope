# HomeScope M2 — ETL Resilience and Tiles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Turn the ETL into a resilient adapter -> validate -> normalize -> stage/load pipeline that fails loudly on schema drift without corrupting good data, proven by contract tests; and build self-hosted PMTiles per resolution for the map.

**Architecture:** Each data source becomes a self-contained adapter exposing `fetch() -> RawPayload`. Raw payloads are validated against explicit Pydantic contracts; a drift fails that batch with a structured diagnostic and leaves prior good data intact. A normalization layer maps validated payloads into canonical observations before the staged transactional load. Tiles are built per resolution from PostGIS via a GDAL/tippecanoe step into PMTiles.

**Tech Stack:** Python 3.12, Pydantic 2, psycopg, pytest; GDAL + tippecanoe (PMTiles) in the ETL image.

## Global Constraints

(Inherits M0/M1 constraints.) Additionally:
- Drift must be rejected with a human-readable diagnostic naming the field and expected-vs-actual.
- A rejected source must not mutate previously-loaded good data (transactional isolation).
- Re-running with identical inputs yields identical DB state (idempotency).
- Contract tests cover: happy path, drift rejection, partial-failure isolation, idempotency.

---

### Task 1: RawPayload contract + source adapter protocol

**Files:**
- Create: `etl/homescope_etl/pipeline/contracts.py` (Pydantic `RawMetricRecord`, `RawPayload`)
- Create: `etl/homescope_etl/pipeline/adapter.py` (`SourceAdapter` Protocol with `name` + `fetch()`)
- Test: `etl/tests/test_contracts.py`

**Interfaces:**
- Produces: `RawMetricRecord` (region_id, metric_key, period, value with validators), `RawPayload` (source name + records), `SourceAdapter` protocol.

- [ ] Step 1: Define Pydantic models with strict validators (period as date, value finite float, metric_key non-empty). `model_config = ConfigDict(extra="forbid")` so unexpected fields are drift.
- [ ] Step 2: Tests: valid record parses; extra field raises; bad period raises; non-finite value raises.
- [ ] Step 3: Commit `feat(etl): add raw payload contracts and adapter protocol`.

### Task 2: Synthetic source adapter (wraps the generator)

**Files:**
- Create: `etl/homescope_etl/pipeline/sources/synthetic.py` (`SyntheticSource` adapter)
- Modify: generator import path as needed.
- Test: `etl/tests/test_synthetic_source.py`

**Interfaces:**
- Consumes: generator + a list of RegionRef. Produces: `RawPayload` of `RawMetricRecord`.

- [ ] Step 1: Implement `SyntheticSource(regions, months, seed).fetch() -> RawPayload`.
- [ ] Step 2: Test the payload is non-empty and every record validates.
- [ ] Step 3: Commit `feat(etl): add synthetic source adapter`.

### Task 3: Broken-source fixture + validation stage (drift defense)

**Files:**
- Create: `etl/homescope_etl/pipeline/sources/broken.py` (`BrokenSource` emitting a drifted payload)
- Create: `etl/homescope_etl/pipeline/validate.py` (`validate_payload` -> raises `SchemaDriftError` with diagnostic)
- Create: `etl/homescope_etl/pipeline/errors.py` (`SchemaDriftError`)
- Test: `etl/tests/test_validation.py`

**Interfaces:**
- Produces: `validate_payload(raw: dict, source: str) -> RawPayload` raising `SchemaDriftError` (message names field + expected vs actual) on drift.

- [ ] Step 1: `BrokenSource` returns records with a renamed field (e.g. `metricKey` instead of `metric_key`) and a bad type.
- [ ] Step 2: `validate_payload` parses each record via Pydantic; on `ValidationError` raise `SchemaDriftError` with a formatted diagnostic.
- [ ] Step 3: Tests: valid payload passes; broken payload raises `SchemaDriftError` whose message names the offending field.
- [ ] Step 4: Commit `feat(etl): add schema-drift validation with broken-source fixture`.

### Task 4: Normalize + staged transactional load + isolation

**Files:**
- Create: `etl/homescope_etl/pipeline/normalize.py` (`RawPayload -> list[MetricObservation]`)
- Create: `etl/homescope_etl/pipeline/load.py` (`load_observations` staged/transactional/idempotent)
- Create: `etl/homescope_etl/pipeline/run.py` (`run_pipeline(adapters)` orchestrator: per source fetch->validate->normalize; a failing source is skipped with a logged diagnostic, good sources still load)
- Modify: `etl/homescope_etl/__main__.py` (CLI `run` uses the pipeline)
- Test: `etl/tests/test_pipeline_db.py` (marked `db`): happy path loads; broken source is isolated (good data remains); idempotency (same inputs -> same row count + checksum).

**Interfaces:**
- Produces: `run_pipeline(adapters: list[SourceAdapter]) -> RunReport` (loaded counts, rejected sources). Staged load: COPY to temp, swap within a transaction, refresh matview.

- [ ] Step 1: Normalize maps validated records to `MetricObservation`.
- [ ] Step 2: Load stages rows then swaps transactionally; idempotent.
- [ ] Step 3: Orchestrator isolates per-source failures (try/except SchemaDriftError -> record rejection, continue).
- [ ] Step 4: DB contract tests (marked `db`, run locally in the container, skipped in CI): happy path, partial-failure isolation, idempotency.
- [ ] Step 5: Run the pipeline in the container; verify fact rows match M1. Commit `feat(etl): add normalize, staged load, and resilient orchestrator`.

### Task 5: tippecanoe in the ETL image

**Files:**
- Modify: `infra/Dockerfile.etl` (add tippecanoe; resolve the earlier build failure with explicit build deps + verified clone)

- [ ] Step 1: Add a build stage that compiles tippecanoe (or installs a prebuilt binary). Verify `tippecanoe --version` in the image. If source build is unreliable, fall back to a GDAL 3.8+ base image with the native PMTiles driver and document the choice.
- [ ] Step 2: Commit `build(etl): add tippecanoe for tile generation`.

### Task 6: Tile build per resolution -> PMTiles

**Files:**
- Create: `etl/homescope_etl/tiles/build.py` (export each resolution from PostGIS to GeoJSONSeq via ogr2ogr, run tippecanoe -> `data/tiles/<resolution>.pmtiles` with per-resolution min/max zoom + simplification)
- Modify: `etl/homescope_etl/__main__.py` (CLI `build-tiles [--resolution ...]`)

**Interfaces:**
- Produces: `data/tiles/{state,metro,county,zip}.pmtiles`, each feature carrying `id` (= region_id) for client feature-state joins.

- [ ] Step 1: Per resolution: `ogr2ogr` PostGIS -> GeoJSONSeq (region_id as `id`, name), then `tippecanoe -o <res>.pmtiles -l regions --minimum-zoom --maximum-zoom --drop-densest-as-needed --coalesce-densest-as-needed` with zoom bands (state 0-5, metro 3-7, county 4-8, zip 6-12).
- [ ] Step 2: Run for state first; verify the pmtiles file exists and `tippecanoe-decode`/`pmtiles` shows tiles. Then all resolutions.
- [ ] Step 3: Commit `feat(etl): build per-resolution pmtiles`.

### Task 7: ETL CI for the pipeline

**Files:**
- Modify: `.github/workflows/ci.yml` (etl job already runs `-m "not db"`; ensure new pure tests run)

- [ ] Step 1: Confirm contract/validation/normalize unit tests (not `db`) run in CI; DB and tile tests stay local.
- [ ] Step 2: Commit if changes needed.

## Self-Review

Covers ETL-1..ETL-8 (adapters, schema validation with diagnostic, normalization, staged transactional load, idempotency, tile build, orchestration, contract tests) and the M2 milestone. The drift-defense path is fully unit-tested in CI; DB-touching and tile tests run locally in the container. Tile tooling risk (tippecanoe build) has a documented GDAL-native fallback.
