"""Pipeline error types."""

from __future__ import annotations


class SchemaDriftError(Exception):
    """Raised when a source payload fails its contract (schema drift)."""

    def __init__(self, source: str, detail: str) -> None:
        self.source = source
        self.detail = detail
        super().__init__(f"schema drift in source '{source}': {detail}")
