import type { MetricDefinition } from "@homescope/contract";

const numberFormat = new Intl.NumberFormat("en-US");

export function formatValue(value: number, format: MetricDefinition["format"]): string {
  if (format === "currency") {
    return value >= 1_000_000
      ? `$${(value / 1_000_000).toFixed(2)}M`
      : `$${Math.round(value / 1000)}K`;
  }
  if (format === "percent") {
    return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
  }
  return numberFormat.format(Math.round(value));
}
