# HomeScope Data Dictionary

The canonical model is a small star schema over Postgres + PostGIS. Geometry is
real (US Census cartographic boundaries); metric values are synthetic and
deterministic. The metric registry (`metrics.json` at the repo root) is the single
source of truth for metric metadata and is read by both the TypeScript app and the
Python ETL.

## Conventions

- `region_id` is `{resolution}:{geoid}` — e.g. `state:48`, `county:48453`,
  `metro:12420`, `zip:78704`.
- All geometry is stored in EPSG:4326 (WGS84), MultiPolygon for areas.
- `period` is the first day of the month the value applies to.

## Table: `regions` (dimension)

| Column | Type | Notes |
|---|---|---|
| `region_id` | text (PK) | `{resolution}:{geoid}` |
| `resolution` | enum | `state` \| `metro` \| `county` \| `zip` |
| `geoid` | text | FIPS (state/county/CBSA) or ZCTA5 code |
| `name` | text | Display name |
| `parent_state_geoid` | text null | State FIPS rollup (null for multi-state metros) |
| `parent_county_geoid` | text null | County FIPS rollup (ZCTA via point-in-polygon) |
| `geom` | geometry(MultiPolygon,4326) | Boundary; GIST indexed |
| `centroid` | geometry(Point,4326) | `ST_PointOnSurface` of `geom`; for fly-to/search |

Geometry sources (Census cartographic boundary files):
state/county/CBSA from GENZ2023 `cb_2023_us_*_500k`, ZCTA from GENZ2020
`cb_2020_us_zcta520_500k`.

## Table: `metrics` (dimension)

| Column | Type | Notes |
|---|---|---|
| `metric_key` | text (PK) | `median_price`, `inventory`, `days_on_market`, `yoy_price_change` |
| `label` | text | Display label, e.g. "Median Price" |
| `unit` | text | `USD` \| `count` \| `days` \| `%` |
| `format` | text | `currency` \| `number` \| `percent` |
| `aggregation` | text | `median` \| `sum` \| `derived` |

Seeded from `metrics.json`.

## Table: `region_metric_monthly` (fact)

| Column | Type | Notes |
|---|---|---|
| `region_id` | text (FK -> regions) | |
| `metric_key` | text (FK -> metrics) | |
| `period` | date | Month start |
| `value` | numeric | |
| PK | | (`region_id`, `metric_key`, `period`) |

At least 60 monthly periods per (region, metric). `yoy_price_change` is derived
from the `median_price` series (12-month change) and therefore begins 12 months
after the series start.

## Materialized view: `region_metric_current`

Latest period per (`region_id`, `metric_key`) — the fast source for map shading.
Unique index on (`region_id`, `metric_key`). Refreshed at the end of each load.

## Synthetic data model

Deterministic (seeded). Per-region base price is hashed from the region id into a
plausible band, biased upward for high-cost states, and built hierarchically
(county off its state, ZCTA off its county) so child regions roughly aggregate to
parents. Each series is trend + 12-month seasonality + bounded noise. Same seed
produces an identical dataset.
