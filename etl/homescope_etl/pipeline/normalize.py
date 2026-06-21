"""Normalization stage: a validated record into a canonical observation."""

from __future__ import annotations

from homescope_etl.generate.model import MetricObservation
from homescope_etl.pipeline.contracts import RawMetricRecord


def normalize(record: RawMetricRecord) -> MetricObservation:
    return MetricObservation(
        region_id=record.region_id,
        metric_key=record.metric_key,
        period=record.period,
        value=record.value,
    )
