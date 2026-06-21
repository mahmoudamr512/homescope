import type { MetricKey } from "@homescope/contract";

export type Resolution = "state" | "metro" | "county" | "zip";

export const RESOLUTIONS: Resolution[] = ["state", "metro", "county", "zip"];

export interface CurrentResponse {
  resolution: Resolution;
  metric: MetricKey;
  values: Record<string, number>;
  domain: [number, number];
}

export async function fetchCurrent(
  resolution: Resolution,
  metric: MetricKey,
): Promise<CurrentResponse> {
  const res = await fetch(`/api/regions/current?resolution=${resolution}&metric=${metric}`);
  if (!res.ok) throw new Error("Failed to load region values");
  return res.json() as Promise<CurrentResponse>;
}

/** Auto resolution from zoom (metro is manual-only). */
export function resolutionForZoom(zoom: number): Resolution {
  if (zoom < 4) return "state";
  if (zoom < 6) return "county";
  return "zip";
}
