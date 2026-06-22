import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "How it's built — a geospatial data product",
  description: `How ${siteConfig.author}, ${siteConfig.jobTitle}, engineered ${siteConfig.name}: MapLibre, PMTiles, PostGIS, and a drift-resilient Python ETL.`,
  alternates: { canonical: `${siteConfig.url}/how-its-built` },
};

const outcomes = [
  {
    title: "Large datasets, zero lag",
    body: "33,000+ ZIP polygons recolor the instant you switch metrics — geometry is fetched once as vector tiles and never re-rendered.",
  },
  {
    title: "ETL that survives schema drift",
    body: "Every source is validated against an explicit contract; a drifted feed is rejected with a precise diagnostic and isolated, so bad data never corrupts good data.",
  },
  {
    title: "End-to-end ownership",
    body: "Data modeling, the pipeline, a typed API over PostGIS, the interactive UI, CI, and the production deploy — designed and shipped as one coherent system.",
  },
];

const sections = [
  {
    title: "What it is",
    body: "An interactive choropleth of US housing-market data across four geographic resolutions — state, metro, county, and ZIP. Boundaries are real US Census geometry; metric values are synthetic, deterministic, and clearly labeled. The point is a production-shaped geospatial data product, end to end.",
  },
  {
    title: "Architecture",
    body: "A typed pnpm monorepo: a Next.js (App Router) front end with MapLibre GL JS rendering self-hosted PMTiles, typed route handlers over Postgres + PostGIS, a shared Zod contract, and a Python ETL. Everything runs locally with one Docker Compose command and deploys to Vercel + Neon at ~$0.",
  },
  {
    title: "The performance trick",
    body: "Switching metrics never refetches or re-renders geometry — values are pushed via MapLibre feature-state and the fill expression interpolates over them. That is what keeps tens of thousands of regions instant.",
  },
  {
    title: "Proper data modeling",
    body: "A dimensional model over PostGIS — region and metric dimensions, a monthly fact table, and a materialized view for fast map shading — with a single cross-language metric registry as the source of truth.",
  },
];

export default function HowItsBuiltPage() {
  return (
    <main style={{ maxWidth: 820, margin: "0 auto", padding: "48px 24px 96px" }}>
      <Link href="/" style={{ color: "var(--accent)", fontSize: 14, textDecoration: "none" }}>
        &larr; Back to the map
      </Link>

      {/* Hero */}
      <section style={{ display: "flex", gap: 20, alignItems: "center", margin: "28px 0 12px", flexWrap: "wrap" }}>
        {siteConfig.photo ? (
          <img
            src={siteConfig.photo}
            alt={siteConfig.author}
            width={72}
            height={72}
            style={{ width: 72, height: 72, borderRadius: "var(--r-full)", objectFit: "cover", flex: "none" }}
          />
        ) : (
          <div style={avatar}>{siteConfig.initials}</div>
        )}
        <div style={{ flex: 1, minWidth: 240 }}>
          <h1 style={{ font: "600 30px var(--font-display)", color: "var(--text-primary)", margin: 0 }}>
            {siteConfig.author}
          </h1>
          <div style={{ marginTop: 6, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ color: "var(--text-secondary)", fontSize: 15 }}>
              {siteConfig.jobTitle} · {siteConfig.location}
            </span>
            {siteConfig.availableForWork && <span style={availableBadge}>Available for work</span>}
          </div>
        </div>
      </section>

      <p style={{ fontSize: 17, lineHeight: 1.6, color: "var(--text-secondary)", margin: "8px 0 20px" }}>
        {siteConfig.pitch}
      </p>

      {/* Primary CTAs */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
        <a href={siteConfig.upwork} style={ctaPrimary}>
          Hire me on Upwork
        </a>
        <a href={siteConfig.linkedin} style={ctaSecondary}>
          LinkedIn
        </a>
        <a href={`mailto:${siteConfig.email}`} style={ctaSecondary}>
          Email
        </a>
        <a href={siteConfig.repo} style={ctaSecondary}>
          Source
        </a>
      </div>

      {/* Outcomes — what this proves */}
      <h2 style={h2}>What this demonstrates</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12, marginBottom: 8 }}>
        {outcomes.map((o) => (
          <div key={o.title} style={card}>
            <div style={{ font: "600 15px var(--font-display)", color: "var(--text-primary)" }}>
              {o.title}
            </div>
            <p style={{ margin: "6px 0 0", color: "var(--text-secondary)", lineHeight: 1.55 }}>{o.body}</p>
          </div>
        ))}
      </div>

      {sections.map((s) => (
        <section key={s.title} style={{ marginTop: 26 }}>
          <h2 style={h2}>{s.title}</h2>
          <p style={{ margin: 0, lineHeight: 1.65, color: "var(--text-secondary)" }}>{s.body}</p>
        </section>
      ))}

      {/* Skills */}
      <h2 style={{ ...h2, marginTop: 30 }}>Capabilities</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {siteConfig.skills.map((s) => (
          <span key={s} style={badge}>
            {s}
          </span>
        ))}
      </div>

      {/* Closing CTA */}
      <section style={{ marginTop: 36, padding: 24, borderRadius: "var(--r-lg)", border: "1px solid var(--border)", background: "var(--surface-sunken)" }}>
        <h2 style={{ ...h2, marginTop: 0 }}>Let&apos;s build something</h2>
        <p style={{ margin: "0 0 14px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
          {siteConfig.author} is a {siteConfig.jobTitle} available for senior and staff-level
          engineering work — geospatial, data platforms, and AI-native products.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <a href={siteConfig.upwork} style={ctaPrimary}>
            Hire me on Upwork
          </a>
          {siteConfig.portfolio.map((item) => (
            <a key={item.href} href={item.href} style={ctaSecondary}>
              {item.label}
            </a>
          ))}
        </div>
        <p style={{ marginTop: 20, fontSize: 13, color: "var(--text-tertiary)" }}>
          Data is synthetic and illustrative; geometry is real US Census TIGER/Line. Built and
          maintained by {siteConfig.author}.
        </p>
      </section>
    </main>
  );
}

const h2: React.CSSProperties = {
  font: "600 18px var(--font-display)",
  color: "var(--text-primary)",
  margin: "0 0 10px",
};

const avatar: React.CSSProperties = {
  width: 72,
  height: 72,
  borderRadius: "var(--r-full)",
  background: "var(--accent)",
  color: "var(--text-inverse)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  font: "600 24px var(--font-display)",
  flex: "none",
};

const availableBadge: React.CSSProperties = {
  fontSize: 11.5,
  fontWeight: 600,
  padding: "3px 10px",
  borderRadius: "var(--r-full)",
  background: "color-mix(in srgb, var(--success) 16%, transparent)",
  color: "var(--success)",
  border: "1px solid color-mix(in srgb, var(--success) 40%, transparent)",
};

const card: React.CSSProperties = {
  padding: 16,
  borderRadius: "var(--r-md)",
  border: "1px solid var(--border)",
  background: "var(--surface)",
};

const badge: React.CSSProperties = {
  fontSize: 12.5,
  fontWeight: 600,
  padding: "6px 12px",
  borderRadius: "var(--r-full)",
  background: "var(--surface-sunken)",
  color: "var(--text-secondary)",
  border: "1px solid var(--border)",
};

const ctaPrimary: React.CSSProperties = {
  display: "inline-block",
  padding: "10px 18px",
  borderRadius: "var(--r-md)",
  background: "var(--accent)",
  color: "var(--text-inverse)",
  textDecoration: "none",
  font: "600 14px var(--font-ui)",
  boxShadow: "var(--e-1)",
};

const ctaSecondary: React.CSSProperties = {
  display: "inline-block",
  padding: "10px 16px",
  borderRadius: "var(--r-md)",
  border: "1px solid var(--border-strong)",
  color: "var(--text-primary)",
  textDecoration: "none",
  font: "600 13.5px var(--font-ui)",
};
