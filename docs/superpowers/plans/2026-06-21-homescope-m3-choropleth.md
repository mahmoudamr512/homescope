# HomeScope M3 — Choropleth and Metric Switching Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans.

**Goal:** A live choropleth across all four resolutions from self-hosted PMTiles, with instant metric switching via feature-state (no geometry refetch), a legend, and metric/resolution controls.

**Architecture:** Typed Next.js route handlers read `region_metric_current` via `@homescope/db` and return an id->value map per resolution+metric. The map loads PMTiles via the pmtiles protocol (one vector source per resolution, `promoteId: "id"`), hydrates feature-state with values, and colors via an `interpolate` over `["feature-state","value"]`. Switching metric updates the paint expression and re-hydrates feature-state; switching resolution toggles layer visibility by zoom. Ramps come from `basemap-style.md` (YlGnBu sequential, RdBu diverging at 0).

**Tech Stack:** Next route handlers, @homescope/db (Drizzle/postgres.js), MapLibre + pmtiles, TanStack Query.

## Global Constraints

(Inherits prior milestones.) Recolor must not refetch or re-render geometry (FR-6); chrome never uses data-ramp colors.

---

### Task 1: Web DB access + env
- `apps/web` depends on `@homescope/db`; `.env.local` sets `DATABASE_URL` (localhost:5433). `src/lib/db.ts` re-exports `getDb`. Commit.

### Task 2: API route handlers (typed, validated)
- `GET /api/metrics` -> registry. `GET /api/regions/current?resolution=&metric=` -> `{ resolution, metric, values: Record<string, number>, domain: [number, number] }`. Zod-validate query params; 400 on bad input. Domain = 2nd/98th percentile (sequential) or symmetric about 0 (diverging). Commit.

### Task 3: Ramp + format helpers
- `apps/web/src/lib/ramps.ts`: YlGnBu/RdBu palettes, `buildFillColorExpression(ramp, domain)`, colorblind alt. `apps/web/src/lib/format.ts`: currency/number/percent formatters keyed off metric.format. Unit tests for format + domain math. Commit.

### Task 4: PMTiles map with 4 resolutions + feature-state recolor
- Register pmtiles protocol; add 4 vector sources (state/metro/county/zip) from `/tiles/*.pmtiles`, `promoteId: "id"`, with fill + line layers; zoom-driven visibility. Hydrate feature-state from the current API; recolor by updating the fill-color paint expression. No-data hatch retained. Commit.

### Task 5: Controls + legend
- Metric segmented control, resolution segmented control (auto-by-zoom + manual), legend (gradient, domain labels, no-data, colorblind toggle), all reading tokens. Wire to TanStack Query. Commit.

### Task 6: Verify
- `pnpm build` + runtime smoke (API returns values; page serves). Commit any fixes; push.

## Self-Review
Covers FR-2..FR-8, FR-6 (feature-state recolor), NFR-1. Search/detail panel are M4/M5.
