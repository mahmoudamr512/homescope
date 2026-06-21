import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "How it's built",
  description: `How ${siteConfig.name} was engineered by ${siteConfig.author}.`,
};

export default function HowItsBuiltPage() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "64px 24px" }}>
      <Link href="/" style={{ color: "var(--accent)", fontSize: 14 }}>
        &larr; Back to the map
      </Link>
      <h1
        style={{
          font: "600 28px var(--font-display)",
          color: "var(--text-primary)",
          margin: "16px 0 8px",
        }}
      >
        How it&apos;s built
      </h1>
      <p style={{ lineHeight: 1.6 }}>
        {siteConfig.name} is an open-source geospatial data product built by {siteConfig.author}.
        The full engineering write-up — architecture, the synthetic-data approach, and the
        drift-resilient ETL — lands in the next milestone.
      </p>
    </main>
  );
}
