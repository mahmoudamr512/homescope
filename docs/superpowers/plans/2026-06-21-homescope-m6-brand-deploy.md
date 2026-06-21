# HomeScope M6 — Brand, SEO, Deploy

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans.

**Goal:** The "How it's built" lead-conversion page, Mahmoud Amr branding/SEO throughout, and a deployable configuration (Vercel + Neon, plus self-host compose).

### Task 1: SEO + structured data
- Expanded `siteConfig` (portfolio links, keywords, jobTitle). Richer `metadata` (keywords, OG, Twitter, canonical). JSON-LD `Person` + `SoftwareApplication`. `sitemap.ts`, `robots.ts`, dynamic `opengraph-image`. Commit.

### Task 2: How it's built page
- Editorial page: what it is, architecture, the performance trick, the drift-resilient ETL, data modeling; portfolio + repo links; author credit. Commit.

### Task 3: Deploy
- `NEXT_PUBLIC_TILES_URL` to host PMTiles on a CDN. `vercel.json`. `infra/docker-compose.prod.yml` self-host stack with a documented bootstrap. README deploy section. Commit.

### Task 4: Verify
- typecheck/lint/test/build + smoke of robots/sitemap/og/how-its-built. Push.

## Self-Review
Covers FR-16, FR-17, NFR SEO/brand. Sentry left as a documented future add (web-vitals/observability pluggable).
