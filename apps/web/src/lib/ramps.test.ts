import { describe, expect, it } from "vitest";
import { RDBU, YLGNBU, rampColors, rampStops } from "./ramps";
import { formatValue } from "./format";

describe("rampColors", () => {
  it("uses YlGnBu for sequential and RdBu for diverging", () => {
    expect(rampColors("sequential", false)).toEqual(YLGNBU);
    expect(rampColors("diverging", false)).toEqual(RDBU);
  });

  it("switches to colorblind-safe palettes when requested", () => {
    expect(rampColors("sequential", true)).not.toEqual(YLGNBU);
    expect(rampColors("diverging", true)).not.toEqual(RDBU);
  });
});

describe("rampStops", () => {
  it("produces value/color pairs spanning the domain", () => {
    const stops = rampStops([0, 80], YLGNBU);
    expect(stops).toHaveLength(YLGNBU.length * 2);
    expect(stops[0]).toBe(0);
    expect(stops[stops.length - 2]).toBe(80);
  });

  it("guards against a zero-width domain", () => {
    const stops = rampStops([5, 5], YLGNBU);
    expect(stops[stops.length - 2]).toBe(6);
  });
});

describe("formatValue", () => {
  it("formats currency, percent, and number", () => {
    expect(formatValue(450000, "currency")).toBe("$450K");
    expect(formatValue(1_650_000, "currency")).toBe("$1.65M");
    expect(formatValue(4.2, "percent")).toBe("+4.2%");
    expect(formatValue(-3.1, "percent")).toBe("-3.1%");
    expect(formatValue(1234, "number")).toBe("1,234");
  });
});
