"use client";

import { type MetricKey, getMetric } from "@homescope/contract";
import { formatValue } from "@/lib/format";
import { rampColors } from "@/lib/ramps";

interface Props {
  metric: MetricKey;
  domain: [number, number] | undefined;
  colorblind: boolean;
  onToggleColorblind: () => void;
}

export function Legend({ metric, domain, colorblind, onToggleColorblind }: Props) {
  const def = getMetric(metric);
  const colors = rampColors(def.ramp, colorblind);
  const gradient = `linear-gradient(90deg, ${colors.join(", ")})`;

  const labels = domain
    ? def.ramp === "diverging"
      ? [formatValue(domain[0], def.format), "0", formatValue(domain[1], def.format)]
      : [formatValue(domain[0], def.format), formatValue(domain[1], def.format)]
    : [];

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-lg)",
        boxShadow: "var(--e-2)",
        padding: 16,
        width: 248,
      }}
    >
      <div
        style={{
          fontSize: 11,
          letterSpacing: ".04em",
          textTransform: "uppercase",
          color: "var(--text-tertiary)",
          fontWeight: 600,
          marginBottom: 10,
        }}
      >
        {def.label} · {def.unit}
      </div>
      <div style={{ height: 12, borderRadius: "var(--r-full)", background: gradient }} />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 6,
          fontSize: 10.5,
          color: "var(--text-secondary)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {labels.map((label, i) => (
          <span key={i} style={{ fontWeight: label === "0" ? 600 : 400 }}>
            {label}
          </span>
        ))}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 12,
          paddingTop: 12,
          borderTop: "1px solid var(--border)",
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontSize: 11.5,
            color: "var(--text-secondary)",
          }}
        >
          <span
            style={{
              width: 16,
              height: 16,
              borderRadius: 4,
              border: "1px solid var(--border)",
              background: "var(--map-nodata-fill)",
            }}
          />
          No data
        </span>
        <label
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 11.5,
            color: "var(--text-secondary)",
            cursor: "pointer",
          }}
        >
          <input type="checkbox" checked={colorblind} onChange={onToggleColorblind} />
          CB-safe
        </label>
      </div>
    </div>
  );
}
