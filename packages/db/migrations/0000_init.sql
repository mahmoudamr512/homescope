CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TYPE resolution AS ENUM ('state', 'metro', 'county', 'zip');

CREATE TABLE regions (
  region_id text PRIMARY KEY,
  resolution resolution NOT NULL,
  geoid text NOT NULL,
  name text NOT NULL,
  parent_state_geoid text,
  parent_county_geoid text,
  geom geometry(MultiPolygon, 4326),
  centroid geometry(Point, 4326)
);

CREATE INDEX regions_geom_gix ON regions USING GIST (geom);
CREATE INDEX regions_centroid_gix ON regions USING GIST (centroid);
CREATE INDEX regions_resolution_idx ON regions (resolution);
CREATE INDEX regions_parent_county_idx ON regions (parent_county_geoid);

CREATE TABLE metrics (
  metric_key text PRIMARY KEY,
  label text NOT NULL,
  unit text NOT NULL,
  format text NOT NULL,
  aggregation text NOT NULL
);

CREATE TABLE region_metric_monthly (
  region_id text NOT NULL REFERENCES regions (region_id),
  metric_key text NOT NULL REFERENCES metrics (metric_key),
  period date NOT NULL,
  value numeric NOT NULL,
  PRIMARY KEY (region_id, metric_key, period)
);

CREATE INDEX rmm_metric_period_idx ON region_metric_monthly (metric_key, period);

CREATE MATERIALIZED VIEW region_metric_current AS
SELECT DISTINCT ON (region_id, metric_key)
  region_id,
  metric_key,
  period,
  value
FROM region_metric_monthly
ORDER BY region_id, metric_key, period DESC;

CREATE UNIQUE INDEX region_metric_current_pk
  ON region_metric_current (region_id, metric_key);
