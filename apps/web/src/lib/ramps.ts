import type { ExpressionSpecification } from "maplibre-gl";
import type { MetricDefinition } from "@homescope/contract";

// Colorblind-safe data ramps. These live only on the map and legend.
export const YLGNBU = [
  "#FFFFD9",
  "#EDF8B1",
  "#C7E9B4",
  "#7FCDBB",
  "#41B6C4",
  "#1D91C0",
  "#225EA8",
  "#253494",
  "#081D58",
];
export const VIRIDIS = [
  "#440154",
  "#472d7b",
  "#3b528b",
  "#2c728e",
  "#21918c",
  "#28ae80",
  "#5ec962",
  "#addc30",
  "#fde725",
];
export const RDBU = ["#2166AC", "#67A9CF", "#D1E5F0", "#F7F7F7", "#FDDBC7", "#EF8A62", "#B2182B"];
export const PUOR = ["#542788", "#998EC3", "#D8DAEB", "#F7F7F7", "#FEE0B6", "#F1A340", "#B35806"];

export type Ramp = MetricDefinition["ramp"];

export function rampColors(ramp: Ramp, colorblind: boolean): string[] {
  if (ramp === "diverging") return colorblind ? PUOR : RDBU;
  return colorblind ? VIRIDIS : YLGNBU;
}

/** Evenly spaced [value, color, value, color, ...] stops across the domain. */
export function rampStops(domain: [number, number], colors: string[]): (number | string)[] {
  const lo = domain[0];
  const hi = domain[1] > domain[0] ? domain[1] : domain[0] + 1;
  const stops: (number | string)[] = [];
  const last = colors.length - 1;
  for (let i = 0; i < colors.length; i++) {
    stops.push(lo + ((hi - lo) * i) / last, colors[i] as string);
  }
  return stops;
}

/** MapLibre fill-color expression driven by feature-state `value`. */
export function buildFillColor(
  ramp: Ramp,
  domain: [number, number],
  colorblind: boolean,
  nodataColor: string,
): ExpressionSpecification {
  const stops = rampStops(domain, rampColors(ramp, colorblind));
  return [
    "case",
    ["==", ["feature-state", "value"], null],
    nodataColor,
    ["interpolate", ["linear"], ["feature-state", "value"], ...stops],
  ] as unknown as ExpressionSpecification;
}
