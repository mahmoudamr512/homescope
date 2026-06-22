import type { StyleSpecification } from "maplibre-gl";

const CARTO_ATTRIBUTION =
  '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>';

function cartoTiles(variant: "light_all" | "dark_all"): string[] {
  return ["a", "b", "c", "d"].map(
    (s) => `https://${s}.basemaps.cartocdn.com/${variant}/{z}/{x}/{y}.png`,
  );
}

// Muted, token-less world basemap (CARTO) so the whole globe reads as context while
// the choropleth carries the data. Light and dark variants are both present and
// toggled by visibility so theme switches are instant.
export function createBaseStyle(): StyleSpecification {
  return {
    version: 8,
    glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
    sources: {
      "carto-light": {
        type: "raster",
        tiles: cartoTiles("light_all"),
        tileSize: 256,
        attribution: CARTO_ATTRIBUTION,
      },
      "carto-dark": {
        type: "raster",
        tiles: cartoTiles("dark_all"),
        tileSize: 256,
        attribution: CARTO_ATTRIBUTION,
      },
    },
    layers: [
      { id: "bg", type: "background", paint: { "background-color": "#0b0f19" } },
      { id: "carto-light", type: "raster", source: "carto-light", layout: { visibility: "visible" } },
      { id: "carto-dark", type: "raster", source: "carto-dark", layout: { visibility: "none" } },
    ],
  };
}

export function applyBasemapTheme(map: {
  getLayer: (id: string) => unknown;
  setLayoutProperty: (id: string, prop: string, value: string) => void;
}): void {
  const dark =
    typeof document !== "undefined" &&
    document.documentElement.getAttribute("data-theme") === "dark";
  if (map.getLayer("carto-light")) {
    map.setLayoutProperty("carto-light", "visibility", dark ? "none" : "visible");
  }
  if (map.getLayer("carto-dark")) {
    map.setLayoutProperty("carto-dark", "visibility", dark ? "visible" : "none");
  }
}
