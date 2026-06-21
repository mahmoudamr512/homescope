import { z } from "zod";
import raw from "../../../metrics.json";

export const metricDefinitionSchema = z.object({
  label: z.string().min(1),
  unit: z.string().min(1),
  format: z.enum(["currency", "number", "percent"]),
  aggregation: z.enum(["median", "sum", "derived"]),
  ramp: z.enum(["sequential", "diverging"]),
});

export type MetricDefinition = z.infer<typeof metricDefinitionSchema>;

export const metricKeySchema = z.enum([
  "median_price",
  "inventory",
  "days_on_market",
  "yoy_price_change",
]);

export type MetricKey = z.infer<typeof metricKeySchema>;

const registrySchema = z.record(metricKeySchema, metricDefinitionSchema);

export const metrics = registrySchema.parse(raw) as Record<MetricKey, MetricDefinition>;

export const metricKeys = Object.keys(metrics) as MetricKey[];

export function getMetric(key: MetricKey): MetricDefinition {
  const def = metrics[key];
  if (!def) throw new Error(`Unknown metric key: ${key}`);
  return def;
}
