import { customType, date, numeric, pgEnum, pgTable, primaryKey, text } from "drizzle-orm/pg-core";

// PostGIS geometry columns are created by the SQL migration; here they are
// represented as opaque custom-typed columns so queries can reference them.
const geometry = customType<{ data: string; driverData: string }>({
  dataType() {
    return "geometry";
  },
});

export const resolutionEnum = pgEnum("resolution", ["state", "metro", "county", "zip"]);

export const regions = pgTable("regions", {
  regionId: text("region_id").primaryKey(),
  resolution: resolutionEnum("resolution").notNull(),
  geoid: text("geoid").notNull(),
  name: text("name").notNull(),
  parentStateGeoid: text("parent_state_geoid"),
  parentCountyGeoid: text("parent_county_geoid"),
  geom: geometry("geom"),
  centroid: geometry("centroid"),
});

export const metrics = pgTable("metrics", {
  metricKey: text("metric_key").primaryKey(),
  label: text("label").notNull(),
  unit: text("unit").notNull(),
  format: text("format").notNull(),
  aggregation: text("aggregation").notNull(),
});

export const regionMetricMonthly = pgTable(
  "region_metric_monthly",
  {
    regionId: text("region_id").notNull(),
    metricKey: text("metric_key").notNull(),
    period: date("period").notNull(),
    value: numeric("value").notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.regionId, t.metricKey, t.period] }),
  }),
);

export type Resolution = (typeof resolutionEnum.enumValues)[number];
export type Region = typeof regions.$inferSelect;
export type RegionMetricRow = typeof regionMetricMonthly.$inferSelect;
