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
          zIndex: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
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
