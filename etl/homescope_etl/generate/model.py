"""Typed models for generated metric observations."""

from __future__ import annotations

from datetime import date

from pydantic import BaseModel


class MetricObservation(BaseModel):
    """A single (region, metric, period) value ready to load into the fact table."""

    region_id: str
    metric_key: str
    period: date
    value: float
