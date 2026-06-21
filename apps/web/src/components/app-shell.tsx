"use client";

import { useQuery } from "@tanstack/react-query";
import { type MetricKey, getMetric, metricKeys } from "@homescope/contract";
import { useCallback, useMemo, useState } from "react";
import { RESOLUTIONS, type Resolution, fetchCurrent } from "@/lib/api";
import { siteConfig } from "@/lib/site";
import { Legend } from "./controls/legend";
import { Segmented } from "./controls/segmented";
import MapView from "./map/map-view";
import { ThemeToggle } from "./theme-toggle";

const RESOLUTION_LABELS: Record<Resolution, string> = {
  state: "State",
  metro: "Metro",
  county: "County",
  zip: "ZIP",
};

export function AppShell() {
  const [metric, setMetric] = useState<MetricKey>("median_price");
  const [manualResolution, setManualResolution] = useState<Resolution | null>(null);
  const [zoomResolution, setZoomResolution] = useState<Resolution>("state");
  const [colorblind, setColorblind] = useState(false);

  const activeResolution = manualResolution ?? zoomResolution;
  const onZoomResolution = useCallback((r: Resolution) => setZoomResolution(r), []);

  const { data } = useQuery({
    queryKey: ["current", activeResolution, metric],
    queryFn: () => fetchCurrent(activeResolution, metric),
  });

  const metricOptions = useMemo(
    () => metricKeys.map((key) => ({ value: key, label: getMetric(key).label })),
    [],
  );
  const resolutionOptions = RESOLUTIONS.map((r) => ({ value: r, label: RESOLUTION_LABELS[r] }));

  return (
    <main style={{ position: "fixed", inset: 0 }}>
      <MapView
        activeResolution={activeResolution}
        metric={metric}
        values={data?.values}
        domain={data?.domain}
        colorblind={colorblind}
        onZoomResolution={onZoomResolution}
      />

      <header style={topBar}>
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1, flex: "none" }}>
          <span style={{ font: "600 16px var(--font-display)", color: "var(--text-primary)" }}>
            {siteConfig.name}
          </span>
          <span style={{ fontSize: 10.5, color: "var(--text-tertiary)" }}>by Mahmoud Amr</span>
        </div>
        <div style={{ margin: "0 auto" }}>
          <Segmented
            ariaLabel="Metric"
            options={metricOptions}
            value={metric}
            onChange={setMetric}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "none" }}>
          <a href="/how-its-built" style={howBuiltLink}>
            How it&apos;s built
          </a>
          <ThemeToggle />
        </div>
      </header>

      <div style={{ position: "absolute", left: 16, bottom: 16, zIndex: 20 }}>
        <Legend
          metric={metric}
          domain={data?.domain}
          colorblind={colorblind}
          onToggleColorblind={() => setColorblind((v) => !v)}
        />
      </div>

      <div style={bottomRight}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            type="button"
            onClick={() => setManualResolution(null)}
            aria-pressed={manualResolution === null}
            style={autoChip(manualResolution === null)}
          >
            Auto
          </button>
          <Segmented
            ariaLabel="Resolution"
            options={resolutionOptions}
            value={activeResolution}
            onChange={(r) => setManualResolution(r)}
          />
        </div>
        <span style={{ fontSize: 11, color: "var(--text-tertiary)", textAlign: "right" }}>
          Synthetic, illustrative data · real Census boundaries
        </span>
      </div>
    </main>
  );
}

const topBar: React.CSSProperties = {
  position: "absolute",
  top: 16,
  left: 16,
  right: 16,
  zIndex: 30,
  display: "flex",
  alignItems: "center",
  gap: 16,
  padding: "10px 16px",
  background: "color-mix(in srgb, var(--surface) 86%, transparent)",
  backdropFilter: "blur(12px)",
  border: "1px solid var(--border)",
  borderRadius: "var(--r-lg)",
  boxShadow: "var(--e-1)",
};

const bottomRight: React.CSSProperties = {
  position: "absolute",
  right: 16,
  bottom: 16,
  zIndex: 20,
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  gap: 8,
};

const howBuiltLink: React.CSSProperties = {
  fontSize: 12.5,
  color: "var(--text-secondary)",
  textDecoration: "none",
  padding: "0 8px",
};

function autoChip(active: boolean): React.CSSProperties {
  return {
    padding: "6px 12px",
    borderRadius: "var(--r-full)",
    border: "1px solid var(--border)",
    cursor: "pointer",
    font: "600 12px var(--font-ui)",
    background: active ? "var(--accent-subtle)" : "var(--surface)",
    color: active ? "var(--accent)" : "var(--text-secondary)",
  };
}
