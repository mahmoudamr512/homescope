"""Explicit Pydantic contract every raw source record is validated against.

`extra="forbid"` makes unexpected fields a hard failure, which is the primary
defense against silent upstream schema drift.
"""

from __future__ import annotations

import math
from datetime import date

from pydantic import BaseModel, ConfigDict, field_validator


class RawMetricRecord(BaseModel):
    model_config = ConfigDict(extra="forbid")

    region_id: str
    metric_key: str
    period: date
    value: float

    @field_validator("region_id", "metric_key")
    @classmethod
    def _non_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("must be non-empty")
        return v

    @field_validator("value")
    @classmethod
    def _finite(cls, v: float) -> float:
        if not math.isfinite(v):
            raise ValueError("must be a finite number")
        return v
