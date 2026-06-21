"""Validation stage: parse one raw record against its contract or fail loudly."""

from __future__ import annotations

from pydantic import ValidationError

from homescope_etl.pipeline.adapter import RawData
from homescope_etl.pipeline.contracts import RawMetricRecord
from homescope_etl.pipeline.errors import SchemaDriftError


def validate_record(raw: RawData, source: str) -> RawMetricRecord:
    try:
        return RawMetricRecord.model_validate(raw)
    except ValidationError as exc:
        first = exc.errors()[0]
        loc = ".".join(str(part) for part in first.get("loc", ())) or "<record>"
        msg = first.get("msg", "invalid")
        raise SchemaDriftError(source, f"field '{loc}': {msg}") from exc
