import { describe, expect, it } from "vitest";
import { createBaseStyle } from "./basemap";

describe("createBaseStyle", () => {
  it("returns a valid v8 style with light and dark world basemaps", () => {
    const style = createBaseStyle();
    expect(style.version).toBe(8);
    expect(style.sources["carto-light"]).toBeDefined();
    expect(style.sources["carto-dark"]).toBeDefined();
    const light = style.layers.find((l) => l.id === "carto-light");
    expect(light?.type).toBe("raster");
  });
});
