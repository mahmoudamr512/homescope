"use client";

import { useQuery } from "@tanstack/react-query";
import { type MetricKey, getMetric, metricKeySchema, metricKeys } from "@homescope/contract";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  NATIONAL_VIEW,
  RESOLUTIONS,
  type Resolution,
  type SearchResult,
  fetchCurrent,
  zoomForResolution,
} from "@/lib/api";
import { siteConfig } from "@/lib/site";
import { Legend } from "./controls/legend";
import { SearchBox } from "./controls/search-box";
import { Segmented } from "./controls/segmented";
import { DetailPanel } from "./detail-panel";
import MapView from "./map/map-view";
import { ThemeToggle } from "./theme-toggle";

const RESOLUTION_LABELS: Record<Resolution, string> = {
  state: "State",
  metro: "Metro",
  county: "County",
  zip: "ZIP",
};

function parseMetric(raw: string | null): MetricKey {
  const parsed = metricKeySchema.safeParse(raw);
  return parsed.success ? parsed.data : "median_price";
}

function parseResolution(raw: string | null): Resolution | null {
  return RESOLUTIONS.includes(raw as Resolution) ? (raw as Resolution) : null;
}

function resolutionFromRegionId(id: string | null): Resolution | null {
  if (!id) return null;
  return parseResolution(id.split(":")[0] ?? null);
}

export function AppShell() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [metric, setMetric] = useState<MetricKey>(() => parseMetric(searchParams.get("metric")));
  const [selectedId, setSelectedId] = useState<string | null>(() => searchParams.get("region"));
  const [manualResolution, setManualResolution] = useState<Resolution | null>(
    () => parseResolution(searchParams.get("resolution")) ?? resolutionFromRegionId(searchParams.get("region")),
  );
  const [zoomResolution, setZoomResolution] = useState<Resolution>("state");
  const [colorblind, setColorblind] = useState(false);
  const [focus, setFocus] = useState<{ lng: number; lat: number; zoom: number } | null>(null);

  const activeResolution = manualResolution ?? zoomResolution;
  const onZoomResolution = useCallback((r: Resolution) => setZoomResolution(r), []);

  const onPick = useCallback((result: SearchResult) => {
    setManualResolution(result.resolution);
    setSelectedId(result.regionId);
    setFocus({ lng: result.lng, lat: result.lat, zoom: zoomForResolution(result.resolution) });
  }, []);

  const onReset = useCallback(() => {
    setManualResolution(null);
    setSelectedId(null);
    setFocus({ ...NATIONAL_VIEW });
  }, []);

  // Keep the URL in sync so any view is shareable/bookmarkable.
  useEffect(() => {
    const params = new URLSearchParams();
    params.set("metric", metric);
    if (manualResolution) params.set("resolution", manualResolution);
    if (selectedId) params.set("region", selectedId);
    router.replace(`/?${params.toString()}`, { scroll: false });
  }, [metric, manualResolution, selectedId, router]);

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
        selectedId={selectedId}
        focus={focus}
        onZoomResolution={onZoomResolution}
        onSelect={setSelectedId}
      />

      <header style={topBar}>
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1, flex: "none" }}>
          <span style={{ font: "600 16px var(--font-display)", color: "var(--text-primary)" }}>
            {siteConfig.name}
          </span>
          <span style={{ fontSize: 10.5, color: "var(--text-tertiary)" }}>by Mahmoud Amr</span>
        </div>
        <div style={{ flex: 1, maxWidth: 320 }}>
          <SearchBox onPick={onPick} />
        </div>
        <Segmented ariaLabel="Metric" options={metricOptions} value={metric} onChange={setMetric} />
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
          <button type="button" onClick={onReset} style={autoChip(false)}>
            Reset view
          </button>
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

      {selectedId && (
        <DetailPanel regionId={selectedId} metric={metric} onClose={() => setSelectedId(null)} />
      )}
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
  flexWrap: "wrap",
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
