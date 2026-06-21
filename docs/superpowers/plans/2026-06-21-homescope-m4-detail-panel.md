# HomeScope M4 — Detail Panel, Charts, Deep Links

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans.

**Goal:** Click a region to open a detail panel with all current metric values, a historical time-series chart (metric + time-range switchers), a generated insight, a share button, and shareable deep links via URL state.

**Architecture:** Two new typed routes return a region's current values and a metric's series. The map gains click-to-select (feature-state `selected`, non-selected dimmed). A `DetailPanel` client component fetches via TanStack Query and charts with Recharts. URL search params (`resolution`, `metric`, `region`) are the source of truth for shareable state.

## Global Constraints
Inherits prior milestones. Selection must not refetch geometry; chart < 500ms (G4).

### Task 1: Region + series API
- `GET /api/regions/[regionId]` -> `{ region, values }`. `GET /api/regions/[regionId]/series?metric=&range=` -> `{ regionId, metric, range, points }`. Validate regionId (`^(state|metro|county|zip):[A-Za-z0-9]+$`), metric, range (1Y/3Y/5Y/All). Commit.

### Task 2: URL state
- AppShell reads/writes `resolution`, `metric`, `region` via next/navigation; page wraps AppShell in Suspense. Commit.

### Task 3: Map selection
- Click `${res}-fill` -> select region id; feature-state `selected`; selected line style + dim others via fill-opacity expression. `selectedId` + `onSelect` props. Commit.

### Task 4: Detail panel + chart
- `DetailPanel`: header (name + resolution chip + close), four stat cards, Recharts line chart with metric + range switch, one-line insight ("Median price up X% YoY"), share (copy deep link). Loading skeleton + error states. Commit.

### Task 5: Verify
- typecheck/lint/test/build + runtime smoke of both routes. Push.

## Self-Review
Covers FR-9..FR-13, G4, UX-4. Search is M5.
