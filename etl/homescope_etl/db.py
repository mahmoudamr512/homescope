"""Database connection helpers shared across ETL stages."""

from __future__ import annotations

import os
from urllib.parse import urlparse


def get_dsn() -> str:
    """Return the Postgres connection string from the environment."""
    dsn = os.environ.get("DATABASE_URL")
    if not dsn:
        raise RuntimeError("DATABASE_URL is not set")
    return dsn


def ogr_pg_string(dsn: str | None = None) -> str:
    """Translate a postgresql:// URL into an OGR PostgreSQL connection string."""
    parsed = urlparse(dsn or get_dsn())
    parts = [
        f"dbname={parsed.path.lstrip('/')}",
        f"host={parsed.hostname}",
        f"port={parsed.port or 5432}",
        f"user={parsed.username}",
    ]
    if parsed.password:
        parts.append(f"password={parsed.password}")
    return "PG:" + " ".join(parts)
