import { describe, expect, it } from "vitest";
import { getMetric, metricKeys, metrics } from "./metrics";

describe("metric registry", () => {
  it("exposes the four v1 metrics", () => {
    expect(metricKeys.sort()).toEqual(
      ["days_on_market", "inventory", "median_price", "yoy_price_change"].sort(),
    );
  });

  it("parses median_price as a sequential currency metric", () => {
    const m = getMetric("median_price");
    expect(m.format).toBe("currency");
    expect(m.ramp).toBe("sequential");
  });

  it("marks yoy_price_change as a derived diverging metric", () => {
    const m = getMetric("yoy_price_change");
    expect(m.aggregation).toBe("derived");
    expect(m.ramp).toBe("diverging");
  });

  it("keeps metrics object and metrics.json in sync", () => {
    expect(Object.keys(metrics)).toHaveLength(metricKeys.length);
  });
});
