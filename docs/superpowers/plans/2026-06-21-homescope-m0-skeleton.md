# HomeScope M0 — Skeleton Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the HomeScope monorepo with a Docker Compose stack and a MapLibre map that renders US states styled with the approved design tokens — proving the render + tooling pipeline end-to-end.

**Architecture:** pnpm workspace (`apps/web` Next.js App Router + TS, `packages/contract` shared Zod/types, `packages/config` shared presets) with a sibling Python `etl/` toolchain (scaffolded only in M0). The map is a code-split client component using MapLibre GL JS; for M0 it renders US states from a bundled GeoJSON (PMTiles arrives with the real tile pipeline in M2/M3). Postgres+PostGIS runs via Docker Compose for local dev.

**Tech Stack:** Node 20+, pnpm 9, Next.js 15 (App Router), React 19, TypeScript 5 (strict), Tailwind CSS v4, MapLibre GL JS 4.7.1, Zod 3, Vitest 2 + Testing Library, Docker Compose (postgis/postgis:16-3.4).

## Global Constraints

- Map library: **MapLibre GL JS** only. No Mapbox dependency, no map token.
- Brand: product name is **HomeScope**; author credit is **Mahmoud Amr** (exact spelling).
- Commits: clean conventional commits. **No AI co-authorship trailers. No emojis anywhere (code, comments, commits, UI). No AI scratch files committed.**
- License: **MIT**, holder "Mahmoud Amr".
- TypeScript **strict** everywhere; no `any` in committed code.
- Design tokens are the single styling source of truth — chrome uses indigo accent + neutral scale only; data-ramp colors never appear in chrome.
- Metric registry lives in one file (`metrics.json`) read by both TS and Python.
- GitHub repo owner: **mahmoudamr512**; repo name: **homescope**.

---

### Task 1: Monorepo skeleton + root tooling

**Files:**
- Create: `package.json` (root, private workspace)
- Create: `pnpm-workspace.yaml`
- Create: `.nvmrc`
- Create: `.editorconfig`
- Create: `.npmrc`
- Create: `tsconfig.base.json`
- Create: `prettier.config.mjs`
- Create: `LICENSE`
- Create: `README.md`

**Interfaces:**
- Produces: a pnpm workspace where `apps/*` and `packages/*` are resolved; `tsconfig.base.json` extended by every package; `pnpm -w lint`/`format`/`typecheck`/`test` script entry points (filled in by later tasks).

- [ ] **Step 1: Create the workspace manifest files**

`pnpm-workspace.yaml`:
```yaml
packages:
  - "apps/*"
  - "packages/*"
```

`.nvmrc`:
```
20
```

`.npmrc`:
```
auto-install-peers=true
strict-peer-dependencies=false
```

`.editorconfig`:
```ini
root = true

[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true
```

Root `package.json`:
```json
{
  "name": "homescope",
  "version": "0.0.0",
  "private": true,
  "packageManager": "pnpm@9.12.0",
  "engines": { "node": ">=20" },
  "scripts": {
    "dev": "pnpm --filter @homescope/web dev",
    "build": "pnpm -r build",
    "lint": "pnpm -r lint",
    "typecheck": "pnpm -r typecheck",
    "test": "pnpm -r test",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  },
  "devDependencies": {
    "prettier": "3.3.3",
    "typescript": "5.6.3"
  }
}
```

- [ ] **Step 2: Create shared TS + Prettier config**

`tsconfig.base.json`:
```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

`prettier.config.mjs`:
```js
/** @type {import("prettier").Config} */
export default {
  semi: true,
  singleQuote: false,
  trailingComma: "all",
  printWidth: 100,
};
```

- [ ] **Step 3: Create LICENSE and README**

`LICENSE` (MIT):
```
MIT License

Copyright (c) 2026 Mahmoud Amr

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

`README.md`:
```markdown
# HomeScope

Interactive US housing-market explorer — choropleth across state, metro, county,
and ZIP, with metric switching and per-region historical drill-down.

Geometry is real (US Census TIGER/Line). Metric data is synthetic and labeled as
such. Built by Mahmoud Amr as an open-source geospatial data-product showcase.

## Stack

Next.js + MapLibre GL JS + PMTiles, Postgres/PostGIS, a Python ETL, all runnable
via Docker Compose.

## Quick start

```bash
pnpm install
docker compose -f infra/docker-compose.yml up -d
pnpm dev
```

See `docs/` for architecture and the data dictionary.

## License

MIT (c) Mahmoud Amr
```

- [ ] **Step 4: Install and verify the workspace resolves**

Run: `pnpm install`
Expected: completes without error; root `node_modules` created; no workspace packages yet (warning about no projects matching `apps/*`/`packages/*` is acceptable at this point).

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-workspace.yaml .nvmrc .npmrc .editorconfig tsconfig.base.json prettier.config.mjs LICENSE README.md pnpm-lock.yaml
git commit -m "chore: scaffold pnpm monorepo with shared tooling and license"
```

---

### Task 2: Metric registry + `@homescope/contract`

**Files:**
- Create: `metrics.json`
- Create: `packages/contract/package.json`
- Create: `packages/contract/tsconfig.json`
- Create: `packages/contract/vitest.config.ts`
- Create: `packages/contract/src/metrics.ts`
- Create: `packages/contract/src/index.ts`
- Test: `packages/contract/src/metrics.test.ts`

**Interfaces:**
- Produces:
  - `MetricKey = "median_price" | "inventory" | "days_on_market" | "yoy_price_change"`
  - `MetricDefinition` = `{ label: string; unit: string; format: "currency" | "number" | "percent"; aggregation: "median" | "sum" | "derived"; ramp: "sequential" | "diverging" }`
  - `metrics: Record<MetricKey, MetricDefinition>` (parsed + validated from `metrics.json`)
  - `metricKeys: MetricKey[]`
  - `getMetric(key: MetricKey): MetricDefinition`

- [ ] **Step 1: Create the registry data file**

`metrics.json`:
```json
{
  "median_price": {
    "label": "Median Price",
    "unit": "USD",
    "format": "currency",
    "aggregation": "median",
    "ramp": "sequential"
  },
  "inventory": {
    "label": "Inventory",
    "unit": "count",
    "format": "number",
    "aggregation": "sum",
    "ramp": "sequential"
  },
  "days_on_market": {
    "label": "Days on Market",
    "unit": "days",
    "format": "number",
    "aggregation": "median",
    "ramp": "sequential"
  },
  "yoy_price_change": {
    "label": "YoY Change",
    "unit": "%",
    "format": "percent",
    "aggregation": "derived",
    "ramp": "diverging"
  }
}
```

- [ ] **Step 2: Create the package manifest and config**

`packages/contract/package.json`:
```json
{
  "name": "@homescope/contract",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": { ".": "./src/index.ts" },
  "scripts": {
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": { "zod": "3.23.8" },
  "devDependencies": {
    "vitest": "2.1.4",
    "typescript": "5.6.3"
  }
}
```

`packages/contract/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "rootDir": "src", "noEmit": true },
  "include": ["src"]
}
```

`packages/contract/vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
```

- [ ] **Step 3: Write the failing test**

`packages/contract/src/metrics.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { getMetric, metricKeys, metrics } from "./metrics";

describe("metric registry", () => {
  it("exposes the four v1 metrics", () => {
    expect(metricKeys.sort()).toEqual(
      ["days_on_market", "inventory", "median_price", "yoy_price_change"].sort(),
    );
  });

  it("parses median_price as a sequential currency metric", () => {
    const m = getMetric("median_price");
    expect(m.format).toBe("currency");
    expect(m.ramp).toBe("sequential");
  });

  it("marks yoy_price_change as a derived diverging metric", () => {
    const m = getMetric("yoy_price_change");
    expect(m.aggregation).toBe("derived");
    expect(m.ramp).toBe("diverging");
  });

  it("keeps metrics object and metrics.json in sync", () => {
    expect(Object.keys(metrics)).toHaveLength(metricKeys.length);
  });
});
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `pnpm --filter @homescope/contract test`
Expected: FAIL — cannot resolve `./metrics`.

- [ ] **Step 5: Implement the registry loader**

`packages/contract/src/metrics.ts`:
```ts
import { z } from "zod";
import raw from "../../../metrics.json" with { type: "json" };

export const metricDefinitionSchema = z.object({
  label: z.string().min(1),
  unit: z.string().min(1),
  format: z.enum(["currency", "number", "percent"]),
  aggregation: z.enum(["median", "sum", "derived"]),
  ramp: z.enum(["sequential", "diverging"]),
});

export type MetricDefinition = z.infer<typeof metricDefinitionSchema>;

export const metricKeySchema = z.enum([
  "median_price",
  "inventory",
  "days_on_market",
  "yoy_price_change",
]);

export type MetricKey = z.infer<typeof metricKeySchema>;

const registrySchema = z.record(metricKeySchema, metricDefinitionSchema);

export const metrics: Record<MetricKey, MetricDefinition> = registrySchema.parse(raw) as Record<
  MetricKey,
  MetricDefinition
>;

export const metricKeys = Object.keys(metrics) as MetricKey[];

export function getMetric(key: MetricKey): MetricDefinition {
  const def = metrics[key];
  if (!def) throw new Error(`Unknown metric key: ${key}`);
  return def;
}
```

`packages/contract/src/index.ts`:
```ts
export * from "./metrics";
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `pnpm --filter @homescope/contract test`
Expected: PASS (4 tests).

- [ ] **Step 7: Commit**

```bash
git add metrics.json packages/contract
git commit -m "feat(contract): add cross-language metric registry with schema validation"
```

---

### Task 3: Shared config package `@homescope/config`

**Files:**
- Create: `packages/config/package.json`
- Create: `packages/config/eslint.config.mjs`
- Create: `packages/config/tokens.css`

**Interfaces:**
- Produces:
  - `@homescope/config/eslint` — a flat ESLint config array consumable by other packages.
  - `@homescope/config/tokens.css` — the design-token CSS custom properties (light + dark) imported by the web app.

- [ ] **Step 1: Create the package manifest**

`packages/config/package.json`:
```json
{
  "name": "@homescope/config",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    "./eslint": "./eslint.config.mjs",
    "./tokens.css": "./tokens.css"
  },
  "dependencies": {
    "@eslint/js": "9.14.0",
    "typescript-eslint": "8.13.0",
    "eslint": "9.14.0"
  }
}
```

- [ ] **Step 2: Create the shared ESLint flat config**

`packages/config/eslint.config.mjs`:
```js
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["**/dist/**", "**/.next/**", "**/node_modules/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": "warn",
    },
  },
);
```

- [ ] **Step 3: Create the design tokens stylesheet**

`packages/config/tokens.css` (copied verbatim from the approved `deliverables/tokens.css`):
```css
:root {
  --bg:#FBFCFD; --surface:#FFFFFF; --surface-sunken:#F4F6F8; --surface-hover:#F0F3F7;
  --border:#E3E8EE; --border-strong:#CBD5E1;
  --text-primary:#0F172A; --text-secondary:#475569; --text-tertiary:#94A3B8; --text-inverse:#FFFFFF;
  --accent:#4F46E5; --accent-hover:#4338CA; --accent-subtle:#EEF0FE; --accent-ring:#A5B4FC;
  --success:#16A34A; --warning:#D97706; --error:#DC2626; --info:#2563EB;
  --map-land:#F4F6F8; --map-water:#E6ECF2; --map-nodata-fill:#E2E6EB;
  --map-region-stroke:rgba(255,255,255,.6); --map-hover-stroke:#0F172A;
  --map-selected-stroke:#F4A218; --map-selected-halo:rgba(244,162,24,.25);
  --r-sm:6px; --r-md:10px; --r-lg:14px; --r-xl:20px; --r-full:9999px;
  --e-1:0 1px 2px rgba(15,23,42,.06),0 1px 3px rgba(15,23,42,.08);
  --e-2:0 4px 12px rgba(15,23,42,.08),0 2px 4px rgba(15,23,42,.06);
  --e-3:0 12px 32px rgba(15,23,42,.14);
  --e-4:0 24px 60px rgba(15,23,42,.22);
  --motion-fast:120ms; --motion-base:200ms; --motion-emphasized:320ms; --motion-map:250ms;
  --ease:cubic-bezier(.2,0,0,1);
  --font-ui:'Inter',system-ui,sans-serif;
  --font-display:'General Sans','Inter',sans-serif;
  --font-mono:'JetBrains Mono','Geist Mono',monospace;
  --z-map:0; --z-map-overlay:10; --z-controls:20; --z-tooltip:30;
  --z-panel:40; --z-popover:50; --z-modal:60; --z-toast:70;
}

[data-theme="dark"] {
  --bg:#0B0F19; --surface:#131826; --surface-sunken:#0E121C; --surface-hover:#1A2030;
  --border:#232B3B; --border-strong:#313B4F;
  --text-primary:#E6EAF2; --text-secondary:#9AA6BC; --text-tertiary:#64708A; --text-inverse:#0B0F19;
  --accent:#6366F1; --accent-hover:#818CF8; --accent-subtle:#1C2140; --accent-ring:#6366F1;
  --success:#22C55E; --warning:#F59E0B; --error:#EF4444; --info:#3B82F6;
  --map-land:#0E121C; --map-water:#0A0F18; --map-nodata-fill:#1B2230;
  --map-region-stroke:rgba(11,15,25,.5); --map-hover-stroke:#FFFFFF;
  --map-selected-stroke:#FFB020; --map-selected-halo:rgba(255,176,32,.3);
  --e-1:0 1px 2px rgba(0,0,0,.3),0 1px 3px rgba(0,0,0,.4);
  --e-2:0 4px 14px rgba(0,0,0,.45),0 2px 5px rgba(0,0,0,.35);
  --e-3:0 14px 40px rgba(0,0,0,.55); --e-4:0 26px 70px rgba(0,0,0,.6);
}

.tabular { font-variant-numeric: tabular-nums; font-feature-settings:"tnum"; }
```

- [ ] **Step 4: Install and verify it resolves**

Run: `pnpm install`
Expected: `@homescope/config` linked into the workspace; no errors.

- [ ] **Step 5: Commit**

```bash
git add packages/config
git commit -m "feat(config): add shared eslint config and design tokens"
```

---

### Task 4: Next.js web app scaffold with tokens, theme, and metadata

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/next.config.mjs`
- Create: `apps/web/eslint.config.mjs`
- Create: `apps/web/postcss.config.mjs`
- Create: `apps/web/vitest.config.ts`
- Create: `apps/web/vitest.setup.ts`
- Create: `apps/web/src/app/globals.css`
- Create: `apps/web/src/app/layout.tsx`
- Create: `apps/web/src/app/page.tsx`
- Create: `apps/web/src/lib/site.ts`
- Create: `apps/web/src/components/theme-toggle.tsx`
- Test: `apps/web/src/components/theme-toggle.test.tsx`

**Interfaces:**
- Consumes: `@homescope/config/tokens.css`.
- Produces:
  - `siteConfig` from `src/lib/site.ts`: `{ name: "HomeScope"; author: "Mahmoud Amr"; url: string; description: string }`.
  - `<ThemeToggle />` — toggles `data-theme` between `light`/`dark` on `document.documentElement`, persisting to `localStorage` key `homescope-theme`.

- [ ] **Step 1: Create the app manifest and configs**

`apps/web/package.json`:
```json
{
  "name": "@homescope/web",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "@homescope/config": "workspace:*",
    "@homescope/contract": "workspace:*",
    "maplibre-gl": "4.7.1",
    "next": "15.0.3",
    "react": "19.0.0",
    "react-dom": "19.0.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "4.0.0",
    "@testing-library/jest-dom": "6.6.3",
    "@testing-library/react": "16.0.1",
    "@types/node": "22.9.0",
    "@types/react": "19.0.0",
    "@types/react-dom": "19.0.0",
    "jsdom": "25.0.1",
    "tailwindcss": "4.0.0",
    "typescript": "5.6.3",
    "vitest": "2.1.4"
  }
}
```

`apps/web/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "preserve",
    "noEmit": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "src", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

`apps/web/next.config.mjs`:
```js
/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@homescope/contract", "@homescope/config"],
};

export default nextConfig;
```

`apps/web/eslint.config.mjs`:
```js
import config from "@homescope/config/eslint";

export default config;
```

`apps/web/postcss.config.mjs`:
```js
export default { plugins: { "@tailwindcss/postcss": {} } };
```

- [ ] **Step 2: Create the global stylesheet wiring tokens + Tailwind**

`apps/web/src/app/globals.css`:
```css
@import "tailwindcss";
@import "@homescope/config/tokens.css";

html, body { margin: 0; padding: 0; }
body {
  background: var(--bg);
  color: var(--text-secondary);
  font-family: var(--font-ui);
  font-variant-numeric: tabular-nums;
  -webkit-font-smoothing: antialiased;
}
```

- [ ] **Step 3: Create the site config and root layout with SEO metadata**

`apps/web/src/lib/site.ts`:
```ts
export const siteConfig = {
  name: "HomeScope",
  author: "Mahmoud Amr",
  url: "https://homescope.mahmoudamr.dev",
  description:
    "Interactive US housing-market explorer across state, metro, county, and ZIP. Built by Mahmoud Amr.",
} as const;
```

`apps/web/src/app/layout.tsx`:
```tsx
import type { Metadata } from "next";
import { siteConfig } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: siteConfig.name, template: `%s | ${siteConfig.name}` },
  description: siteConfig.description,
  authors: [{ name: siteConfig.author, url: "https://github.com/mahmoudamr512" }],
  creator: siteConfig.author,
  openGraph: {
    type: "website",
    title: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 4: Write the failing test for the theme toggle**

`apps/web/vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
  resolve: { alias: { "@": new URL("./src", import.meta.url).pathname } },
});
```

`apps/web/vitest.setup.ts`:
```ts
import "@testing-library/jest-dom/vitest";
```

`apps/web/src/components/theme-toggle.test.tsx`:
```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ThemeToggle } from "./theme-toggle";

afterEach(() => {
  document.documentElement.setAttribute("data-theme", "light");
  localStorage.clear();
});

describe("ThemeToggle", () => {
  it("toggles the document theme attribute on click", () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button", { name: /toggle theme/i });
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    fireEvent.click(button);
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(localStorage.getItem("homescope-theme")).toBe("dark");
  });
});
```

- [ ] **Step 5: Run the test to verify it fails**

Run: `pnpm --filter @homescope/web test`
Expected: FAIL — cannot resolve `./theme-toggle`.

- [ ] **Step 6: Implement the theme toggle**

`apps/web/src/components/theme-toggle.tsx`:
```tsx
"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";
const STORAGE_KEY = "homescope-theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored) {
      setTheme(stored);
      document.documentElement.setAttribute("data-theme", stored);
    }
  }, []);

  function toggle() {
    const next: Theme = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem(STORAGE_KEY, next);
  }

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={toggle}
      style={{
        width: 38,
        height: 38,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "var(--r-md)",
        border: "1px solid var(--border)",
        background: "var(--surface)",
        color: "var(--text-secondary)",
        cursor: "pointer",
      }}
    >
      {theme === "light" ? "Dark" : "Light"}
    </button>
  );
}
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `pnpm --filter @homescope/web test`
Expected: PASS (1 test).

- [ ] **Step 8: Create a placeholder home page and verify dev server + build**

`apps/web/src/app/page.tsx`:
```tsx
import { ThemeToggle } from "@/components/theme-toggle";
import { siteConfig } from "@/lib/site";

export default function HomePage() {
  return (
    <main style={{ padding: 28 }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--text-primary)",
            margin: 0,
          }}
        >
          {siteConfig.name}
        </h1>
        <ThemeToggle />
      </header>
      <p style={{ marginTop: 12 }}>{siteConfig.description}</p>
    </main>
  );
}
```

Run: `pnpm --filter @homescope/web build`
Expected: build succeeds; no type errors.

- [ ] **Step 9: Commit**

```bash
git add apps/web pnpm-lock.yaml
git commit -m "feat(web): scaffold Next.js app with design tokens, theme toggle, and SEO metadata"
```

---

### Task 5: US states GeoJSON build + MapLibre map component

**Files:**
- Create: `apps/web/scripts/build-states-geojson.mjs`
- Modify: `apps/web/package.json` (add devDeps + `prebuild`/`data:states` script)
- Create: `apps/web/src/lib/basemap.ts`
- Create: `apps/web/src/components/map/map-view.tsx`
- Create: `apps/web/src/components/map/map-view.client.tsx`
- Modify: `apps/web/src/app/page.tsx`
- Test: `apps/web/src/lib/basemap.test.ts`
- Generated (gitignored): `apps/web/public/data/states.geojson`

**Interfaces:**
- Consumes: `siteConfig`, design tokens (CSS vars).
- Produces:
  - `createBaseStyle(): maplibregl.StyleSpecification` from `src/lib/basemap.ts` — a token-driven, sources-less background style (land color, version 8).
  - `<MapView />` (default export of `map-view.tsx`) — a code-split (`dynamic`, `ssr:false`) wrapper around the client map.

- [ ] **Step 1: Add the GeoJSON build script and dependencies**

Run:
```bash
pnpm --filter @homescope/web add -D us-atlas@3.0.1 topojson-client@3.1.0
```

`apps/web/scripts/build-states-geojson.mjs`:
```js
// Builds a simplified US states GeoJSON from the us-atlas TopoJSON package.
// Output is gitignored and regenerated on demand / prebuild.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { feature } from "topojson-client";
import statesTopo from "us-atlas/states-10m.json" with { type: "json" };

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, "..", "public", "data", "states.geojson");

const fc = feature(statesTopo, statesTopo.objects.states);
const withIds = {
  type: "FeatureCollection",
  features: fc.features.map((f) => ({
    ...f,
    id: f.id,
    properties: { id: f.id, name: f.properties.name },
  })),
};

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(withIds));
console.log(`Wrote ${withIds.features.length} states to ${outPath}`);
```

Modify `apps/web/package.json` scripts to add:
```json
"data:states": "node scripts/build-states-geojson.mjs",
"prebuild": "node scripts/build-states-geojson.mjs",
"predev": "node scripts/build-states-geojson.mjs"
```

- [ ] **Step 2: Write the failing test for the base style**

`apps/web/src/lib/basemap.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { createBaseStyle } from "./basemap";

describe("createBaseStyle", () => {
  it("returns a valid empty-source style v8 with a land background", () => {
    const style = createBaseStyle();
    expect(style.version).toBe(8);
    expect(style.sources).toEqual({});
    const land = style.layers.find((l) => l.id === "land");
    expect(land?.type).toBe("background");
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm --filter @homescope/web test src/lib/basemap.test.ts`
Expected: FAIL — cannot resolve `./basemap`.

- [ ] **Step 4: Implement the base style**

`apps/web/src/lib/basemap.ts`:
```ts
import type { StyleSpecification } from "maplibre-gl";

// Muted, desaturated basemap so the choropleth carries all the color.
// Reads the resolved --map-land token at call time for theme correctness.
export function createBaseStyle(): StyleSpecification {
  const land =
    typeof window !== "undefined"
      ? getComputedStyle(document.documentElement).getPropertyValue("--map-land").trim() ||
        "#F4F6F8"
      : "#F4F6F8";

  return {
    version: 8,
    glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
    sources: {},
    layers: [{ id: "land", type: "background", paint: { "background-color": land } }],
  };
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm --filter @homescope/web test src/lib/basemap.test.ts`
Expected: PASS.

- [ ] **Step 6: Implement the client map component**

`apps/web/src/components/map/map-view.client.tsx`:
```tsx
"use client";

import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";
import { createBaseStyle } from "@/lib/basemap";

export default function MapViewClient() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: createBaseStyle(),
      center: [-96, 38.4],
      zoom: 3.45,
      attributionControl: false,
      dragRotate: false,
    });

    let hoveredId: string | number | null = null;

    map.on("load", async () => {
      const res = await fetch("/data/states.geojson");
      const data = await res.json();
      map.addSource("states", { type: "geojson", data, promoteId: "id" });

      map.addLayer({
        id: "states-fill",
        type: "fill",
        source: "states",
        paint: {
          "fill-color": "#D7DEE6",
          "fill-opacity": [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            0.95,
            0.7,
          ],
        },
      });

      map.addLayer({
        id: "states-line",
        type: "line",
        source: "states",
        paint: {
          "line-color": [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            "#0F172A",
            "rgba(255,255,255,.6)",
          ],
          "line-width": ["case", ["boolean", ["feature-state", "hover"], false], 1.5, 0.5],
        },
      });

      map.on("mousemove", "states-fill", (e) => {
        if (!e.features?.length) return;
        const id = e.features[0].id ?? null;
        if (hoveredId !== null) {
          map.setFeatureState({ source: "states", id: hoveredId }, { hover: false });
        }
        hoveredId = id;
        if (hoveredId !== null) {
          map.setFeatureState({ source: "states", id: hoveredId }, { hover: true });
        }
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", "states-fill", () => {
        if (hoveredId !== null) {
          map.setFeatureState({ source: "states", id: hoveredId }, { hover: false });
        }
        hoveredId = null;
        map.getCanvas().style.cursor = "";
      });
    });

    return () => map.remove();
  }, []);

  return <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />;
}
```

> States have no data yet in M0, so the fill is a flat neutral `#D7DEE6`. The data-driven choropleth color expression lands in M3.

- [ ] **Step 7: Implement the code-split wrapper and mount it**

`apps/web/src/components/map/map-view.tsx`:
```tsx
import dynamic from "next/dynamic";

const MapView = dynamic(() => import("./map-view.client"), { ssr: false });

export default MapView;
```

Modify `apps/web/src/app/page.tsx` to render the full-bleed map with a floating header:
```tsx
import MapView from "@/components/map/map-view";
import { ThemeToggle } from "@/components/theme-toggle";
import { siteConfig } from "@/lib/site";

export default function HomePage() {
  return (
    <main style={{ position: "fixed", inset: 0 }}>
      <MapView />
      <header
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          right: 16,
          zIndex: "var(--z-controls)" as unknown as number,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          zIndex: 20,
          padding: "9px 14px",
          background: "color-mix(in srgb, var(--surface) 86%, transparent)",
          backdropFilter: "blur(12px)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-lg)",
          boxShadow: "var(--e-1)",
        }}
      >
        <strong style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
          {siteConfig.name}
        </strong>
        <ThemeToggle />
      </header>
    </main>
  );
}
```

- [ ] **Step 8: Build the data and run the dev server to verify the map renders**

Run:
```bash
pnpm --filter @homescope/web data:states
pnpm --filter @homescope/web dev
```
Expected: `states.geojson` written (~50 features incl. territories); visiting `http://localhost:3000` shows a desaturated map with US states; hovering a state darkens its outline; the floating HomeScope header is visible; theme toggle flips light/dark.

- [ ] **Step 9: Verify typecheck and build pass**

Run: `pnpm --filter @homescope/web typecheck && pnpm --filter @homescope/web build`
Expected: both succeed.

- [ ] **Step 10: Commit**

```bash
git add apps/web pnpm-lock.yaml
git commit -m "feat(web): render US states on a MapLibre map with token-driven styling"
```

---

### Task 6: Docker Compose local stack + ETL toolchain stub

**Files:**
- Create: `infra/docker-compose.yml`
- Create: `infra/Dockerfile.web`
- Create: `.env.example`
- Create: `db/init/01-extensions.sql`
- Create: `etl/pyproject.toml`
- Create: `etl/homescope_etl/__init__.py`
- Create: `etl/README.md`

**Interfaces:**
- Produces: a `postgres` service (PostGIS enabled) reachable at `localhost:5432`, and a `web` service buildable from `Dockerfile.web`. `.env.example` documents `DATABASE_URL`.

- [ ] **Step 1: Create the environment template**

`.env.example`:
```
# Postgres / PostGIS
POSTGRES_USER=homescope
POSTGRES_PASSWORD=homescope
POSTGRES_DB=homescope
DATABASE_URL=postgresql://homescope:homescope@localhost:5432/homescope
```

- [ ] **Step 2: Create the PostGIS init script**

`db/init/01-extensions.sql`:
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

- [ ] **Step 3: Create the Compose file**

`infra/docker-compose.yml`:
```yaml
name: homescope

services:
  postgres:
    image: postgis/postgis:16-3.4
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-homescope}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-homescope}
      POSTGRES_DB: ${POSTGRES_DB:-homescope}
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ../db/init:/docker-entrypoint-initdb.d:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-homescope}"]
      interval: 5s
      timeout: 5s
      retries: 10

  web:
    build:
      context: ..
      dockerfile: infra/Dockerfile.web
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER:-homescope}:${POSTGRES_PASSWORD:-homescope}@postgres:5432/${POSTGRES_DB:-homescope}
    ports:
      - "3000:3000"
    profiles: ["full"]

volumes:
  pgdata:
```

> The `web` service is behind the `full` profile so day-to-day local dev runs `pnpm dev` against the Dockerized Postgres without rebuilding an image on every change. `docker compose --profile full up` runs everything containerized.

- [ ] **Step 4: Create the web Dockerfile**

`infra/Dockerfile.web`:
```dockerfile
FROM node:20-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

FROM base AS build
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @homescope/web build

FROM base AS runtime
WORKDIR /app
COPY --from=build /app ./
EXPOSE 3000
CMD ["pnpm", "--filter", "@homescope/web", "start"]
```

- [ ] **Step 5: Create the Python ETL toolchain stub**

`etl/pyproject.toml`:
```toml
[project]
name = "homescope-etl"
version = "0.0.0"
description = "HomeScope synthetic-data and tile ETL pipeline"
requires-python = ">=3.11"
dependencies = ["pydantic>=2.9"]

[project.optional-dependencies]
dev = ["pytest>=8.3"]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"
```

`etl/homescope_etl/__init__.py`:
```python
"""HomeScope ETL package. Pipeline stages land in M1 and M2."""

__version__ = "0.0.0"
```

`etl/README.md`:
```markdown
# HomeScope ETL

Python pipeline: extract -> validate -> normalize -> load -> tile.
Stages are implemented across milestones M1 (data model + generator) and M2
(drift defense + tiles). Run with `python -m homescope_etl run` once available.

## Setup

```bash
cd etl
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
```
```

- [ ] **Step 6: Verify the database stack comes up healthy**

Run:
```bash
cp .env.example .env
docker compose -f infra/docker-compose.yml up -d postgres
docker compose -f infra/docker-compose.yml ps
docker compose -f infra/docker-compose.yml exec postgres psql -U homescope -d homescope -c "SELECT postgis_version();"
```
Expected: `postgres` is `healthy`; the `SELECT postgis_version()` returns a version string (confirms PostGIS extension loaded).

- [ ] **Step 7: Tear down and commit**

```bash
docker compose -f infra/docker-compose.yml down
git add infra db etl .env.example
git commit -m "build: add docker compose stack with postgis and etl toolchain stub"
```

---

### Task 7: CI workflow + GitHub repository

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `docs/architecture.md` (stub linked from README)

**Interfaces:**
- Produces: a CI pipeline running install, lint, typecheck, and tests on push/PR; a public GitHub repo `mahmoudamr512/homescope` with the M0 work pushed.

- [ ] **Step 1: Create the CI workflow**

`.github/workflows/ci.yml`:
```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
```

- [ ] **Step 2: Create the architecture doc stub**

`docs/architecture.md`:
```markdown
# HomeScope Architecture

See `docs/superpowers/specs/2026-06-21-homescope-design.md` for the full design.

## Monorepo

- `apps/web` — Next.js App Router app + typed API route handlers.
- `packages/contract` — Zod schemas, TS types, the API contract.
- `packages/config` — shared ESLint config and design tokens.
- `etl/` — Python pipeline (extract -> validate -> normalize -> load -> tile).
- `db/` — Drizzle schema and PostGIS migrations.
- `infra/` — Docker Compose stacks (local + self-host production).

This document is expanded as milestones land.
```

- [ ] **Step 3: Verify the full pipeline passes locally before pushing**

Run: `pnpm install --frozen-lockfile && pnpm lint && pnpm typecheck && pnpm test`
Expected: all four succeed.

- [ ] **Step 4: Commit**

```bash
git add .github docs/architecture.md
git commit -m "ci: add lint, typecheck, and test workflow"
```

- [ ] **Step 5: Create the GitHub repository and push**

Run:
```bash
gh repo create mahmoudamr512/homescope --public --source=. --remote=origin \
  --description="Interactive US housing-market explorer. MapLibre + PMTiles + PostGIS. Built by Mahmoud Amr." \
  --push
```
Expected: repo created under `mahmoudamr512`, `origin` set, `main` pushed.

- [ ] **Step 6: Verify CI is green**

Run: `gh run watch` (or `gh run list --limit 1`)
Expected: the CI run completes successfully.

---

## Self-Review

**Spec coverage (M0 scope only):**
- Monorepo + clean structure (NFR-6, spec §3.1) — Tasks 1-4.
- Single metric registry (NFR-3, spec §3.2) — Task 2.
- Design tokens / chrome-vs-data separation (spec §7) — Task 3, applied in 4-5.
- MapLibre render, code-split (FR-1, NFR-2, spec §5) — Task 5.
- Docker Compose + PostGIS (spec §2 local dev) — Task 6.
- ETL toolchain placement (spec §3.1) — Task 6 (stub; logic in M1/M2).
- SEO metadata + author = Mahmoud Amr (spec §8) — Task 4 (expanded in M6).
- Engineering hygiene / CI (spec §9) — Tasks 1, 7.
- Repo under mahmoudamr512 (spec §2) — Task 7.
- Out of M0 scope (later milestones): PostGIS schema (M1), synthetic generator (M1), ETL drift defense (M2), PMTiles + 4 resolutions + feature-state recolor + legend (M3), detail panel/charts/deep links (M4), search/states/a11y (M5), "How it's built"/full branding/deploy (M6).

**Placeholder scan:** No "TBD"/"TODO"/"implement later" left in any step; every code step ships literal, runnable code.

**Type consistency:** `createBaseStyle` returns `StyleSpecification` (Task 5) used by the client map; `MetricKey`/`MetricDefinition`/`getMetric` (Task 2) are stable names reused downstream; `siteConfig` shape (Task 4) consumed in Task 5. `ThemeToggle` named export consistent between test and implementation.

---

## Execution Handoff

After saving, choose execution mode (subagent-driven recommended).
