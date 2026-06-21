import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";

export const runtime = "edge";
export const alt = `${siteConfig.name} by ${siteConfig.author}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "linear-gradient(135deg, #0B0F19 0%, #1C2140 100%)",
          color: "#E6EAF2",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 28, color: "#A5B4FC", letterSpacing: 2 }}>HOMESCOPE</div>
        <div style={{ fontSize: 68, fontWeight: 700, marginTop: 16, lineHeight: 1.1 }}>
          US Housing Market Explorer
        </div>
        <div style={{ fontSize: 32, marginTop: 28, color: "#9AA6BC" }}>
          Interactive choropleth · MapLibre · PostGIS
        </div>
        <div style={{ fontSize: 30, marginTop: 40, color: "#818CF8" }}>by Mahmoud Amr</div>
      </div>
    ),
    size,
  );
}
