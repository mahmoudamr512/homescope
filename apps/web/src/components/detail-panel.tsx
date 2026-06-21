"use client";

import { useQuery } from "@tanstack/react-query";
import { type MetricKey, getMetric, metricKeys } from "@homescope/contract";
import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TIME_RANGES, type Resolution, type TimeRange, fetchRegion, fetchSeries } from "@/lib/api";
import { formatValue } from "@/lib/format";
import { Segmented } from "./controls/segmented";

const RES_LABEL: Record<Resolution, string> = {
  state: "State",
  metro: "Metro",
  county: "County",
  zip: "ZIP",
};

interface Props {
  regionId: string;
  metric: MetricKey;
  onClose: () => void;
}

export function DetailPanel({ regionId, metric, onClose }: Props) {
  const [chartMetric, setChartMetric] = useState<MetricKey>(metric);
  const [range, setRange] = useState<TimeRange>("5Y");

  const region = useQuery({ queryKey: ["region", regionId], queryFn: () => fetchRegion(regionId) });
  const series = useQuery({
    queryKey: ["series", regionId, chartMetric, range],
    queryFn: () => fetchSeries(regionId, chartMetric, range),
  });

  const def = getMetric(chartMetric);
  const values = region.data?.values;
  const yoy = values?.yoy_price_change;
  const insight =
    yoy === undefined
      ? null
      : `Median price ${yoy >= 0 ? "up" : "down"} ${Math.abs(yoy).toFixed(1)}% YoY`;

  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      // Clipboard may be unavailable; ignore.
    }
  }

  return (
    <aside style={panel} className="hs-panel">
      <div style={header}>
        <div>
          <div style={{ font: "600 17px var(--font-display)", color: "var(--text-primary)" }}>
            {region.data?.region.name ?? "Loading..."}
          </div>
          {region.data && (
            <span style={chip}>{RES_LABEL[region.data.region.resolution]}</span>
          )}
        </div>
        <button type="button" aria-label="Close panel" onClick={onClose} style={closeBtn}>
          ✕
        </button>
      </div>

      {region.isError ? (
        <p style={{ padding: 20, color: "var(--error)" }}>Could not load this region.</p>
      ) : (
        <div style={{ padding: "0 20px 20px", overflowY: "auto" }}>
          <div style={statGrid}>
            {metricKeys.map((key) => {
              const m = getMetric(key);
              const value = values?.[key];
              return (
                <div key={key} style={statCard}>
                  <div style={statLabel}>{m.label}</div>
                  <div style={statValue}>
                    {value === undefined ? "—" : formatValue(value, m.format)}
                  </div>
                </div>
              );
            })}
          </div>

          {insight && <p style={insightStyle}>{insight}</p>}

          <div style={{ display: "flex", justifyContent: "space-between", margin: "16px 0 10px", gap: 8, flexWrap: "wrap" }}>
            <Segmented
              ariaLabel="Chart metric"
              options={metricKeys.map((k) => ({ value: k, label: getMetric(k).label }))}
              value={chartMetric}
              onChange={setChartMetric}
            />
          </div>
          <Segmented
            ariaLabel="Time range"
            options={TIME_RANGES.map((r) => ({ value: r, label: r }))}
            value={range}
            onChange={setRange}
          />

          <div style={{ height: 200, marginTop: 14 }}>
            {series.data && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series.data.points} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
                  <CartesianGrid stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="period"
                    tickFormatter={(p: string) => p.slice(0, 4)}
                    tick={{ fontSize: 10, fill: "var(--text-tertiary)" }}
                    minTickGap={40}
                  />
                  <YAxis
                    width={44}
                    tick={{ fontSize: 10, fill: "var(--text-tertiary)" }}
                    tickFormatter={(v: number) => formatValue(v, def.format)}
                  />
                  <Tooltip
                    formatter={(v: number) => formatValue(v, def.format)}
                    labelFormatter={(l: string) => l.slice(0, 7)}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="var(--accent)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <button type="button" onClick={share} style={shareBtn}>
            Copy share link
          </button>
        </div>
      )}
    </aside>
  );
}

const panel: React.CSSProperties = {
  position: "absolute",
  top: 80,
  right: 16,
  bottom: 16,
  width: 380,
  maxWidth: "calc(100vw - 32px)",
  zIndex: 40,
  display: "flex",
  flexDirection: "column",
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: "var(--r-lg)",
  boxShadow: "var(--e-3)",
  animation: "hs-slidein var(--motion-emphasized) var(--ease)",
};

const header: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  padding: 20,
};

const chip: React.CSSProperties = {
  display: "inline-block",
  marginTop: 6,
  fontSize: 10.5,
  fontWeight: 600,
  padding: "2px 8px",
  borderRadius: "var(--r-full)",
  background: "var(--accent-subtle)",
  color: "var(--accent)",
};

const closeBtn: React.CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: "var(--r-md)",
  border: "1px solid var(--border)",
  background: "var(--surface)",
  color: "var(--text-secondary)",
  cursor: "pointer",
};

const statGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 10,
};

const statCard: React.CSSProperties = {
  background: "var(--surface-sunken)",
  border: "1px solid var(--border)",
  borderRadius: "var(--r-md)",
  padding: "10px 12px",
};

const statLabel: React.CSSProperties = {
  fontSize: 11,
  color: "var(--text-tertiary)",
};

const statValue: React.CSSProperties = {
  font: "600 18px var(--font-display)",
  color: "var(--text-primary)",
  marginTop: 2,
  fontVariantNumeric: "tabular-nums",
};

const insightStyle: React.CSSProperties = {
  margin: "14px 0 0",
  fontSize: 13,
  color: "var(--text-secondary)",
};

const shareBtn: React.CSSProperties = {
  marginTop: 16,
  height: 38,
  width: "100%",
  borderRadius: "var(--r-md)",
  border: "1px solid var(--border-strong)",
  background: "var(--surface)",
  color: "var(--text-primary)",
  font: "600 13px var(--font-ui)",
  cursor: "pointer",
};
