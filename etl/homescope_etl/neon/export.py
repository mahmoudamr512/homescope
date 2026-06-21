"""Copy a slim subset of the local database into a hosted Neon database.

The hosted database omits the heavy `geom` column (geometry is served from PMTiles;
search uses `centroid`), keeps full monthly history for state/metro/county, and keeps
only the most recent `zip_months` of history for ZIPs. This fits comfortably inside
Neon's free tier. The target must already have the schema applied (db:migrate).
"""

from __future__ import annotations

from datetime import date

import psycopg

from homescope_etl.db import get_dsn
from homescope_etl.generate.generator import END_PERIOD

REGION_COLUMNS = (
    "region_id, resolution, geoid, name, parent_state_geoid, parent_county_geoid, geom, centroid"
)


def _zip_cutoff(zip_months: int) -> date:
    month_index = END_PERIOD.year * 12 + (END_PERIOD.month - 1) - (zip_months - 1)
    return date(month_index // 12, month_index % 12 + 1, 1)


def _stream_copy(src: psycopg.Connection, dst: psycopg.Connection, out_sql: str, in_sql: str) -> None:
    with src.cursor() as sc, dst.cursor() as dc:
        with sc.copy(out_sql) as out, dc.copy(in_sql) as dst_copy:
            for block in out:
                dst_copy.write(block)
    dst.commit()


def export_neon(target_dsn: str, zip_months: int = 12) -> None:
    cutoff = _zip_cutoff(zip_months)
    print(f"exporting slim dataset (zip history from {cutoff.isoformat()}) to target")

    with psycopg.connect(get_dsn()) as src, psycopg.connect(target_dsn) as dst:
        with dst.cursor() as cur:
            cur.execute("TRUNCATE region_metric_monthly, regions, metrics CASCADE")
        dst.commit()

        _stream_copy(src, dst, "COPY metrics TO STDOUT", "COPY metrics FROM STDIN")

        # NULL out geom; centroid still copies (as hex EWKB in text COPY).
        _stream_copy(
            src,
            dst,
            (
                "COPY (SELECT region_id, resolution, geoid, name, parent_state_geoid, "
                "parent_county_geoid, NULL AS geom, centroid FROM regions) TO STDOUT"
            ),
            f"COPY regions ({REGION_COLUMNS}) FROM STDIN",
        )

        _stream_copy(
            src,
            dst,
            (
                "COPY (SELECT * FROM region_metric_monthly "
                "WHERE split_part(region_id, ':', 1) <> 'zip' "
                f"OR period >= DATE '{cutoff.isoformat()}') TO STDOUT"
            ),
            "COPY region_metric_monthly FROM STDIN",
        )

        with dst.cursor() as cur:
            cur.execute("REFRESH MATERIALIZED VIEW region_metric_current")
            cur.execute("SELECT count(*) FROM region_metric_monthly")
            monthly = cur.fetchone()
            cur.execute("SELECT count(*) FROM region_metric_current")
            current = cur.fetchone()
        dst.commit()

    print(
        f"exported {monthly[0] if monthly else 0} monthly rows, "
        f"{current[0] if current else 0} current rows"
    )
