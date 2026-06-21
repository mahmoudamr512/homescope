import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "How it's built",
  description: `How ${siteConfig.name} was engineered by ${siteConfig.author} — MapLibre, PMTiles, PostGIS, and a drift-resilient Python ETL.`,
  alternates: { canonical: `${siteConfig.url}/how-its-built` },
};

const sections = [
  {
    title: "What it is",
    body: "HomeScope is an interactive choropleth of US housing-market data across four geographic resolutions — state, metro, county, and ZIP. The boundaries are real US Census geometry; the metric values are synthetic, deterministic, and clearly labeled as such. The point is to demonstrate a production-shaped geospatial data product end to end.",
  },
  {
    title: "Architecture",
    body: "A typed pnpm monorepo: a Next.js (App Router) front end with MapLibre GL JS rendering self-hosted PMTiles, typed route handlers over Postgres + PostGIS, a shared Zod contract, and a Python ETL. Everything runs locally with one Docker Compose command, and deploys cheaply to Vercel + Neon.",
  },
  {
    title: "Rendering a large dataset without lag",
    body: "Geometry is downloaded once as vector tiles. Switching metrics never refetches or re-renders geometry — values are pushed via MapLibre feature-state and the fill expression interpolates over them, so re-coloring 33,000+ ZIP polygons stays instant.",
  },
  {
    title: "An ETL that survives schema drift",
    body: "Each source is an adapter that streams records; every record is validated against an explicit Pydantic contract. A drifted source is rejected with a precise diagnostic and isolated into its own staging table, so bad data never corrupts good data. Loads are staged and swapped atomically, and the whole pipeline is idempotent. A deliberate broken-source fixture and contract tests prove it.",
  },
  {
    title: "Proper data modeling",
    body: "A dimensional model over PostGIS — region and metric dimensions, a monthly fact table, and a materialized view for fast map shading — with a single cross-language metric registry as the source of truth.",
  },
];

export default function HowItsBuiltPage() {
  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "56px 24px 96px" }}>
      <Link href="/" style={{ color: "var(--accent)", fontSize: 14, textDecoration: "none" }}>
        &larr; Back to the map
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: 16, margin: "28px 0 8px" }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "var(--r-full)",
            background: "var(--accent)",
            color: "var(--text-inverse)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            font: "600 20px var(--font-display)",
            flex: "none",
          }}
        >
          MA
        </div>
        <div>
          <h1
            style={{
              font: "600 30px var(--font-display)",
              color: "var(--text-primary)",
              margin: 0,
            }}
          >
            How it&apos;s built
          </h1>
          <p style={{ margin: "4px 0 0", color: "var(--text-tertiary)", fontSize: 14 }}>
            An open-source geospatial data product by {siteConfig.author}
          </p>
        </div>
      </div>

      {sections.map((section) => (
        <section key={section.title} style={{ marginTop: 28 }}>
          <h2
            style={{
              font: "600 18px var(--font-display)",
              color: "var(--text-primary)",
              margin: "0 0 8px",
            }}
          >
            {section.title}
          </h2>
          <p style={{ margin: 0, lineHeight: 1.65, color: "var(--text-secondary)" }}>
            {section.body}
          </p>
        </section>
      ))}

      <section style={{ marginTop: 36, paddingTop: 24, borderTop: "1px solid var(--border)" }}>
        <h2
          style={{ font: "600 18px var(--font-display)", color: "var(--text-primary)", margin: "0 0 12px" }}
        >
          Links
        </h2>
        <ul style={{ display: "flex", flexWrap: "wrap", gap: 12, listStyle: "none", padding: 0, margin: 0 }}>
          <li>
            <a href={siteConfig.repo} style={linkPill}>
              Source on GitHub
            </a>
          </li>
          {siteConfig.portfolio.map((item) => (
            <li key={item.href}>
              <a href={item.href} style={linkPill}>
                {item.label}
              </a>
            </li>
          ))}
        </ul>
        <p style={{ marginTop: 24, fontSize: 13, color: "var(--text-tertiary)" }}>
          Data is synthetic and illustrative; geometry is real US Census TIGER/Line. Built and
          maintained by {siteConfig.author}.
        </p>
      </section>
    </main>
  );
}

const linkPill: React.CSSProperties = {
  display: "inline-block",
  padding: "8px 14px",
  borderRadius: "var(--r-full)",
  border: "1px solid var(--border-strong)",
  color: "var(--text-primary)",
  textDecoration: "none",
  fontSize: 13.5,
  fontWeight: 600,
};
