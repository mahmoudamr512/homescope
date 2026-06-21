# HomeScope — Design Specification

**Status:** Approved (v1.0)
**Date:** 2026-06-21
**Author / Owner:** Mahmoud Amr
**Type:** Portfolio showcase — interactive US housing-market explorer

This document is the approved design. It is the single source of truth that the
implementation plan is derived from. It refines the product SRS into concrete
engineering and product decisions.

---

## 1. Purpose & framing

HomeScope is an interactive, map-based explorer for US housing-market data across
four geographic resolutions — **state, metro (CBSA), county, ZIP (ZCTA)** — with
metric switching and per-region historical drill-down.

It is a **portfolio showcase**. Its job is to prove, in under 30 seconds for a cold
visitor, that Mahmoud Amr can build a real geospatial data product: Mapbox-class
mapping, large datasets without lag, a resilient multi-source ETL, proper
dimensional data modeling, and a polished product surface. Every architectural
choice is also a recruiting artifact.

**Honesty constraint:** geometry is real (Census TIGER/Line); metric data is
synthetic and the UI says so plainly (FR-17). The hard parts — data modeling, an
ETL that survives schema drift, smooth rendering of a large dataset — are real.

## 2. Confirmed decisions

| Decision | Choice | Rationale |
|---|---|---|
| Map library | **MapLibre GL JS** | Free, token-less, self-hosted PMTiles ($0 tiles). API-compatible with Mapbox GL JS, so the same skills/paradigm are demonstrated and learned. |
| Geographic scope | **Full US, all 4 resolutions** | States + metros + counties + ~33k ZCTAs, 60-month series. Honors the >=30k-feature "large dataset" KPI (G3). |
| Local dev | **Docker Compose** | `docker compose up` brings the full stack (Next.js + Postgres/PostGIS + ETL + tile serving). "Run locally in <15 min" story. |
| Self-host prod | **docker-compose.prod.yml** | One-command self-hostable stack for anyone who wants to go live. |
| Hosted prod | **Vercel + Neon** | App on Vercel (no extra paid add-ons); DB on Neon free serverless Postgres with the PostGIS extension. PMTiles as a static file on a CDN. ~$0/mo. |
| Dark mode | **In** | Tokens fully support it. |
| API host | **Next.js route handlers over Postgres** | One typed surface, no separate service. |
| Query layer | **Drizzle ORM + Postgres** | Typed schema + migrations; raw SQL escape hatch for PostGIS. |
| Charts | **Recharts** | Clean time-series, fast to build, small surface. |
| License | **MIT** | Open source. |
| Repo | **github.com/mahmoudamr512** | Created under the user's account. |

**Commit hygiene (hard rules):** clean conventional commits; readable, scoped
changes; **no AI co-authorship trailers; no emojis anywhere; no AI scratch files
committed** (`.remember/`, `.claude/` local artifacts, agent notes are gitignored).

## 3. Architecture overview

```
Browser (Next.js / React / TS)
  - MapLibre GL JS renders PMTiles (no token, no tile bill)
  - Metric registry + legend + feature-state recolor
  - Detail panel + Recharts time series
  - TanStack Query for metric/series/search fetches
        | HTTP range (tiles)            | JSON (metrics/series/search)
  PMTiles archive (static/CDN)     Next route handlers
                                        | Drizzle/SQL
                                   Postgres + PostGIS (Neon / Docker)
                                        ^ load
  ETL (Python): Adapters -> Validate -> Normalize -> Stage/Load -> Tiles
  (synthetic generator + real TIGER geometry)
```

### 3.1 Monorepo layout

```
homescope/
  apps/web/                Next.js App Router + TypeScript (app + API routes)
  packages/
    contract/              Zod schemas + TS types + API DTOs (single TS source of truth)
    config/                Shared tsconfig / eslint / tailwind preset
  etl/                     Python pipeline (Pydantic)
  db/                      Drizzle schema + migrations + PostGIS setup + seed
  infra/
    docker-compose.yml         Local dev stack
    docker-compose.prod.yml    Self-host production stack
    Dockerfile.web
    Dockerfile.etl
  docs/                    architecture.md, data-dictionary.md, specs/
  metrics.json             Cross-language metric registry (TS + Python both read it)
```

JS side is a pnpm workspace. `etl/` is a sibling with its own Python toolchain
(uv/poetry) so the two ecosystems never entangle.

### 3.2 The single metric registry (NFR-3)

`metrics.json` at the repo root is the one source of truth for metrics:

```json
{
  "median_price":   { "label": "Median Price", "unit": "USD", "format": "currency",
                      "aggregation": "median", "ramp": "sequential" },
  "inventory":      { "label": "Inventory", "unit": "count", "format": "number",
                      "aggregation": "sum", "ramp": "sequential" },
  "days_on_market": { "label": "Days on Market", "unit": "days", "format": "number",
                      "aggregation": "median", "ramp": "sequential" },
  "yoy_price_change": { "label": "YoY Change", "unit": "%", "format": "percent",
                      "aggregation": "derived", "ramp": "diverging" }
}
```

TS imports it (typed via Zod) for the legend, formatters, and color expressions.
Python loads the same file in the generator. **Adding a metric = edit this file +
add one generator branch + one color-ramp entry. No schema migration.**

## 4. Data model (PostGIS — SRS §7.3, verbatim intent)

- **`dim_region`** — `region_id` PK (`{resolution}:{geoid}`), `resolution` enum,
  `geoid`, `name`, `parent_state_geoid`, `parent_county_geoid`, `geom`, `centroid`.
  GIST index on `geom`. Centroid for fly-to.
- **`dim_metric`** — `metric_key` PK, `label`, `unit`, `format`, `aggregation`.
  Seeded from `metrics.json`.
- **`region_metric_monthly`** (fact) — `(region_id, metric_key, period)` PK,
  `value numeric`.
- **`region_metric_current`** (materialized view) — latest period per
  (region, metric), refreshed at end of load. Fast map shading source.

A versioned data dictionary (`docs/data-dictionary.md`) documents every table,
column, unit, and the metric registry.

## 5. ETL pipeline (Python + Pydantic)

Stages: **Extract -> Validate -> Normalize -> Load -> Tile**. One CLI entrypoint
(`python -m homescope_etl run`), schedulable via GitHub Actions cron (ETL-7).

- **ETL-1 Adapters.** Each source is a self-contained `fetch() -> RawPayload`.
  The synthetic generator stands in for real feeds. Adding a source = adding an
  adapter only.
- **ETL-2 Schema validation (drift defense).** Every payload validated against an
  explicit Pydantic contract. On mismatch: reject that source's batch, emit a
  structured human-readable diagnostic (field, expected vs actual), leave
  previously-loaded good data untouched. A committed `broken_source` fixture and a
  test prove clean rejection.
- **ETL-3 Normalization.** Validated payloads mapped into the canonical model,
  isolating source-specific shapes from everything downstream.
- **ETL-4 Staged transactional load.** Load to staging, swap atomically; a
  mid-load failure never half-updates the DB.
- **ETL-5 Idempotency.** Re-running with the same inputs yields the same DB state
  (PK upserts).
- **ETL-6 Tiles.** Real TIGER/Line geometry, simplified per resolution by
  `tippecanoe`, emitted as PMTiles per resolution. Containerized for reproducible
  builds.
- **ETL-8 Contract tests (pytest):** happy path, drift rejection, partial-failure
  isolation, idempotency.

### 5.1 Synthetic data realism (DR-4..DR-6)

Deterministic (seeded RNG). Per-region base price level keyed off a real region
attribute (e.g. land area / a coastal-metro lookup) so coastal/large metros trend
higher. Monthly series (>=60 months) = trend + seasonality + bounded noise (not
white noise). Child regions roughly aggregate to parents (ZCTA -> county ->
metro/state) so cross-resolution numbers are consistent. `yoy_price_change` is
computed from the price series, never independently random. Same seed => same
dataset.

## 6. API contract (typed Next route handlers)

All responses validated against the shared Zod contract in `packages/contract`.

| Route | Purpose |
|---|---|
| `GET /api/metrics` | Metric registry. |
| `GET /api/regions/current?resolution=&metric=` | id->value map to hydrate `feature-state`. Optional `bbox`. |
| `GET /api/regions/[regionId]` | All current metric values + region metadata for the detail panel. |
| `GET /api/regions/[regionId]/series?metric=&range=` | Time series for the chart (1Y/3Y/5Y/All). |
| `GET /api/search?q=` | Matching regions across resolutions (id, name, resolution, centroid). |

Tiles are **not** an API — static PMTiles fetched directly by the map. Client
caching via TanStack Query; server cache headers / Next revalidate.

## 7. Frontend

- **Map.** MapLibre + PMTiles via the pmtiles protocol. Muted desaturated basemap
  (per `basemap-style.md`); brand indigo never appears in map fills; data-ramp
  colors never appear in chrome.
- **Zoom-driven resolution switching** (state->metro->county->ZIP) with ~250ms
  cross-fade; never flash unstyled geometry. Optional manual segmented override.
- **`feature-state` recolor** on metric change: <150ms, no geometry refetch
  (FR-6, the performance centerpiece). Legend + map recolor together (<=200ms).
- **Choropleth styling** per `basemap-style.md`: sequential YlGnBu, diverging RdBu
  anchored at exactly 0% for YoY, no-data hatch pattern distinct from lowest bin,
  hover/selected via feature-state.
- **Detail panel** (FR-9..FR-13): region name + resolution chip, four stat cards,
  Recharts time series with metric switcher + time-range control, one-line
  generated insight, share button (copies deep link).
- **URL-as-state**: resolution + region id + metric in query params (FR-13).
- **Search** (FR-14): grouped results across resolutions, fly-to + select.
- **Dark mode** via `data-theme` + token CSS variables.
- **All UI states** (UX-1): loading skeletons, empty/default, error+retry,
  no-data region, hover vs selected vs idle.
- **Accessibility** (NFR-8): keyboard-navigable controls, ARIA labels,
  colorblind-safe palette toggle, sufficient contrast.
- **Responsive** (NFR-7): desktop primary; tablet supported; mobile = map +
  draggable bottom sheet, controls collapse.
- **Observability** (NFR-10): Sentry free tier + web-vitals.

### 7.1 Component library (from the approved design tokens)

Button, SegmentedControl, Legend, SearchBox, StatCard, DetailPanel, ChartFrame,
Tooltip, Skeleton, ThemeToggle. Tokens shipped as CSS custom properties +
Tailwind preset; light/dark via `data-theme`.

## 8. Brand & SEO (Mahmoud Amr)

- **"How it's built"** route (FR-16): architecture diagram, synthetic-data + ETL
  resilience story, Mahmoud Amr photo, "Built by Mahmoud Amr," and links to
  `fastnet-landing.vercel.app`, `obvote.com`, `github.com/mahmoudamr512`.
- **SEO:** per-route metadata, OpenGraph/Twitter cards, dynamic OG image
  (`next/og`), JSON-LD `Person` (Mahmoud Amr) + `SoftwareApplication`,
  `sitemap.ts`, `robots.ts`, canonical URLs. Persistent subtle author credit.
- **Provenance label** (FR-17): synthetic/illustrative data stated in-UI.

## 9. Engineering hygiene & tooling

TypeScript strict everywhere; ESLint + Prettier; Vitest (unit/contract on the TS
side); pytest (ETL contract tests); optional Playwright smoke test. TanStack Query
for data fetching. `.gitignore` covers `node_modules`, `.venv`, `data/` build
artifacts, `.remember/`, local `.claude/` state, `.env*`. MIT license.

## 10. Performance targets (showcase KPIs)

| ID | Target |
|---|---|
| G1 / NFR-2 | First meaningful map paint < 2.5s on broadband; map route code-split. |
| G2 / NFR-1 | Metric recolor < 150ms, no network round-trip for loaded viewport. |
| G3 | >=30,000 ZCTA features available; 60fps pan/zoom target. |
| G4 | Click -> detail panel with chart < 500ms. |
| G6 / NFR-5 | Recurring infra cost ~$0-$25/mo. |

## 11. Build sequence (milestones, with review checkpoints)

| Milestone | Outcome |
|---|---|
| **M0 — Skeleton** | Monorepo + Docker Compose; Next.js + MapLibre renders one static PMTiles layer (states). End-to-end render pipeline proven. |
| **M1 — Data model + generator** | PostGIS schema (Drizzle), deterministic synthetic generator, real TIGER geometry loaded. |
| **M2 — ETL + drift defense** | Adapter->validate->normalize->stage/load + pytest contract tests (incl. broken-source). |
| **M3 — Choropleth + metric switch** | All 4 resolutions, feature-state recolor, legend, no-data hatch, colorblind toggle. |
| **M4 — Detail panel + charts** | Click->panel->time series, metric/range switch, deep links. |
| **M5 — Search, states, polish** | Search, loading/empty/error/no-data states, responsive, a11y. |
| **M6 — Brand + deploy** | "How it's built" + Mahmoud Amr branding/SEO, Vercel+Neon deploy, self-host compose, Sentry. |

I will pause for review at each milestone boundary.

## 12. Definition of done

1. Cold visitor explores price/inventory/trend across state->metro->county->ZIP on the subdomain.
2. Metric switch recolors the visible map < 150ms with no geometry refetch.
3. Clicking any region opens a panel with a working historical chart and a shareable deep link.
4. An automated test proves the ETL rejects a drifted source without corrupting good data.
5. "How it's built" links to the repo, architecture diagram, and Mahmoud Amr's portfolio.
6. Data is clearly labeled synthetic; recurring cost is near-zero.

## 13. Out of scope (v1)

Real/live market data; user accounts/auth; write operations; real-time streaming;
property-level data (stops at ZCTA); native mobile apps.
