"""Orchestrator: stream each source through validate -> normalize -> stage, then swap.

Each source streams into its own staging table with per-record validation, so
memory stays bounded regardless of dataset size. A source that drifts is rejected
with a diagnostic and its staging table is discarded; the remaining good sources
still load via a single atomic swap. If every source fails, nothing is loaded and
previously loaded good data is left untouched.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field

import psycopg

from homescope_etl.db import get_dsn
from homescope_etl.pipeline.adapter import SourceAdapter
from homescope_etl.pipeline.errors import SchemaDriftError
from homescope_etl.pipeline.normalize import normalize
from homescope_etl.pipeline.validate import validate_record


@dataclass
class RunReport:
    loaded: int = 0
    succeeded: list[str] = field(default_factory=list)
    rejected: list[tuple[str, str]] = field(default_factory=list)


def _staging_name(source: str) -> str:
    return "stage_" + re.sub(r"[^a-z0-9_]", "", source.lower())


def _stage_source(conn: psycopg.Connection, adapter: SourceAdapter) -> str:
    table = _staging_name(adapter.name)
    with conn.cursor() as cur:
        cur.execute(f'DROP TABLE IF EXISTS "{table}"')
        cur.execute(f'CREATE TEMP TABLE "{table}" (LIKE region_metric_monthly) ON COMMIT PRESERVE ROWS')
        with cur.copy(
            f'COPY "{table}" (region_id, metric_key, period, value) FROM STDIN'
        ) as copy:
            for raw in adapter.records():
                obs = normalize(validate_record(raw, adapter.name))
                copy.write_row((obs.region_id, obs.metric_key, obs.period, obs.value))
    return table


def run_pipeline(adapters: list[SourceAdapter]) -> RunReport:
    report = RunReport()
    with psycopg.connect(get_dsn(), autocommit=True) as conn:
        staged: list[str] = []
        for adapter in adapters:
            try:
                staged.append(_stage_source(conn, adapter))
                report.succeeded.append(adapter.name)
            except SchemaDriftError as exc:
                with conn.cursor() as cur:
                    cur.execute(f'DROP TABLE IF EXISTS "{_staging_name(exc.source)}"')
                report.rejected.append((exc.source, exc.detail))
                print(f"REJECTED source '{exc.source}': {exc.detail}")

        if not staged:
            print("no valid sources; existing data left untouched")
            return report

        with conn.transaction(), conn.cursor() as cur:
            cur.execute("TRUNCATE region_metric_monthly")
            for table in staged:
                cur.execute(f'INSERT INTO region_metric_monthly SELECT * FROM "{table}"')
            cur.execute("SELECT count(*) FROM region_metric_monthly")
            row = cur.fetchone()
            report.loaded = int(row[0]) if row else 0

        with conn.cursor() as cur:
            cur.execute("REFRESH MATERIALIZED VIEW region_metric_current")
        print(f"loaded {report.loaded} observations from {len(report.succeeded)} source(s)")

    return report
