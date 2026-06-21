"""Database-backed contract tests for the resilient pipeline.

Marked `db` so they run locally in the ETL container (against the compose
Postgres) and are skipped in CI, which has no database.
"""

from __future__ import annotations

import psycopg
import pytest

from homescope_etl.db import get_dsn
from homescope_etl.generate.load import fetch_regions
from homescope_etl.pipeline.run import run_pipeline
from homescope_etl.pipeline.sources.broken import BrokenSource
from homescope_etl.pipeline.sources.synthetic import SyntheticSource

pytestmark = pytest.mark.db


def _regions():
    with psycopg.connect(get_dsn()) as conn:
        return fetch_regions(conn)


def _fact_stats() -> tuple[int, float]:
    with psycopg.connect(get_dsn()) as conn, conn.cursor() as cur:
        cur.execute("SELECT count(*), coalesce(sum(value), 0) FROM region_metric_monthly")
        row = cur.fetchone()
        return (int(row[0]), float(row[1]))


def test_happy_path_loads():
    regions = _regions()[:50]
    report = run_pipeline([SyntheticSource(regions, months=24, seed=7)])
    assert report.loaded > 0
    assert "synthetic" in report.succeeded
    count, _ = _fact_stats()
    assert count == report.loaded


def test_broken_source_is_isolated():
    regions = _regions()[:50]
    # Establish good data first.
    run_pipeline([SyntheticSource(regions, months=24, seed=7)])
    before = _fact_stats()
    # A run with only the broken source must not touch existing good data.
    report = run_pipeline([BrokenSource()])
    assert report.loaded == 0
    assert report.rejected and report.rejected[0][0] == "broken"
    after = _fact_stats()
    assert after == before


def test_idempotent_reload():
    regions = _regions()[:50]
    run_pipeline([SyntheticSource(regions, months=24, seed=7)])
    first = _fact_stats()
    run_pipeline([SyntheticSource(regions, months=24, seed=7)])
    second = _fact_stats()
    assert first == second
