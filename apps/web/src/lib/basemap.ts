import type { StyleSpecification } from "maplibre-gl";

// Muted, desaturated basemap so the choropleth carries all the color.
// Reads the resolved --map-land token at call time for theme correctness.
export function createBaseStyle(): StyleSpecification {
  const land =
    typeof window !== "undefined"
      ? getComputedStyle(document.documentElement).getPropertyValue("--map-land").trim() ||
        "#F4F6F8"
      : "#F4F6F8";

  return {
    version: 8,
    glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
    sources: {},
    layers: [{ id: "land", type: "background", paint: { "background-color": land } }],
  };
}
