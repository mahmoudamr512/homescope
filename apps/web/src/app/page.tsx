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
