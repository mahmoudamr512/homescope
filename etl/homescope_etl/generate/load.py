"""Load generated metric series into region_metric_monthly (staged, transactional)."""

from __future__ import annotations

import psycopg

from homescope_etl.db import get_dsn
from homescope_etl.generate.generator import RegionRef, compute_bases, generate_region_series


def fetch_regions(conn: psycopg.Connection) -> list[RegionRef]:
    with conn.cursor() as cur:
        cur.execute(
            "SELECT region_id, resolution, geoid, parent_state_geoid, parent_county_geoid "
            "FROM regions"
        )
        return [RegionRef(*row) for row in cur.fetchall()]


def generate_metrics(months: int = 60, seed: int = 42) -> None:
    with psycopg.connect(get_dsn()) as conn:
        regions = _fetch_regions(conn)
        if not regions:
            raise RuntimeError("No regions loaded; run load-geometry first")
        bases = compute_bases(regions)

        with conn.cursor() as cur:
            cur.execute(
                "CREATE TEMP TABLE stage (LIKE region_metric_monthly) ON COMMIT DROP"
            )
            with cur.copy(
                "COPY stage (region_id, metric_key, period, value) FROM STDIN"
            ) as copy:
                for region in regions:
                    series = generate_region_series(
                        region.region_id, region.resolution, bases[region.region_id], months, seed
                    )
                    for metric_key, points in series.items():
                        for period, value in points:
                            copy.write_row((region.region_id, metric_key, period, value))

            # Atomic swap: replace the fact table contents within the transaction.
            cur.execute("TRUNCATE region_metric_monthly")
            cur.execute("INSERT INTO region_metric_monthly SELECT * FROM stage")
        conn.commit()

        with conn.cursor() as cur:
            cur.execute("REFRESH MATERIALIZED VIEW region_metric_current")
        conn.commit()

    print(f"generated {months}-month metrics for {len(regions)} regions")
