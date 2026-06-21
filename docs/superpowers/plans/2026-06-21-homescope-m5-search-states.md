# HomeScope M5 — Search, States, Accessibility

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans.

**Goal:** Location search with fly-to + select, a reset/home control, loading/error affordances, and accessibility/responsive polish.

### Task 1: Search API
- `GET /api/search?q=` -> `{ results: [{ regionId, name, resolution, lng, lat }] }`, name/geoid ILIKE, ranked state->metro->county->zip, limit 20. Parameterized. Commit.

### Task 2: Search box + fly-to
- Debounced search box in the top bar; grouped results dropdown; pick -> set resolution + select + fly to centroid. MapView gains a `focus` prop that triggers `flyTo`. Reset control returns to the national view and clears selection. Commit.

### Task 3: States + a11y/responsive
- Loading shimmer on the legend/panel while data loads; error retry in the panel; keyboard-accessible controls (already buttons/inputs with aria); responsive: panel becomes full-width sheet under 640px. Commit.

### Task 4: Verify
- typecheck/lint/test/build + smoke of search. Push.

## Self-Review
Covers FR-14, FR-15, UX-1 essentials, NFR-8 surrounding-control accessibility.
