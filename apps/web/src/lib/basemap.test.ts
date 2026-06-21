import { describe, expect, it } from "vitest";
import { createBaseStyle } from "./basemap";

describe("createBaseStyle", () => {
  it("returns a valid empty-source style v8 with a land background", () => {
    const style = createBaseStyle();
    expect(style.version).toBe(8);
    expect(style.sources).toEqual({});
    const land = style.layers.find((l) => l.id === "land");
    expect(land?.type).toBe("background");
  });
});
