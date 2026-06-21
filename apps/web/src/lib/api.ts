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

export interface RegionDetail {
  region: { region_id: string; resolution: Resolution; geoid: string; name: string };
  values: Record<string, number>;
}

export async function fetchRegion(regionId: string): Promise<RegionDetail> {
  const res = await fetch(`/api/regions/${encodeURIComponent(regionId)}`);
  if (!res.ok) throw new Error("Failed to load region");
  return res.json() as Promise<RegionDetail>;
}

export type TimeRange = "1Y" | "3Y" | "5Y" | "All";
export const TIME_RANGES: TimeRange[] = ["1Y", "3Y", "5Y", "All"];

export interface SeriesResponse {
  regionId: string;
  metric: MetricKey;
  range: TimeRange;
  points: { period: string; value: number }[];
}

export async function fetchSeries(
  regionId: string,
  metric: MetricKey,
  range: TimeRange,
): Promise<SeriesResponse> {
  const res = await fetch(
    `/api/regions/${encodeURIComponent(regionId)}/series?metric=${metric}&range=${range}`,
  );
  if (!res.ok) throw new Error("Failed to load series");
  return res.json() as Promise<SeriesResponse>;
}

/** Auto resolution from zoom (metro is manual-only). */
export function resolutionForZoom(zoom: number): Resolution {
  if (zoom < 4) return "state";
  if (zoom < 6) return "county";
  return "zip";
}
