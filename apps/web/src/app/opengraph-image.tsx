import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";

export const runtime = "edge";
export const alt = `${siteConfig.name} — by ${siteConfig.author}, ${siteConfig.jobTitle}`;
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
          justifyContent: "space-between",
          padding: 72,
          background: "linear-gradient(135deg, #0B0F19 0%, #1C2140 55%, #225EA8 100%)",
          color: "#E6EAF2",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "#6366F1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
            }}
          >
            ◆
          </div>
          <div style={{ fontSize: 26, letterSpacing: 3, color: "#A5B4FC" }}>HOMESCOPE</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 66, fontWeight: 700, lineHeight: 1.05 }}>
            Interactive US Housing
          </div>
          <div style={{ fontSize: 66, fontWeight: 700, lineHeight: 1.05 }}>Market Explorer</div>
          <div style={{ fontSize: 30, marginTop: 24, color: "#9AA6BC" }}>
            State → metro → county → ZIP · 33k+ regions recolor instantly
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 30, color: "#E6EAF2" }}>
            {siteConfig.author} · <span style={{ color: "#818CF8" }}>{siteConfig.jobTitle}</span>
          </div>
          <div
            style={{
              fontSize: 22,
              padding: "10px 20px",
              borderRadius: 999,
              background: "rgba(99,102,241,0.18)",
              border: "1px solid #6366F1",
              color: "#C7D2FE",
            }}
          >
            Available for work
          </div>
        </div>
      </div>
    ),
    size,
  );
}
