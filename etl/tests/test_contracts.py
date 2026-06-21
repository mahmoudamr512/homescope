import pytest
from pydantic import ValidationError

from homescope_etl.pipeline.contracts import RawMetricRecord, RawPayload


def test_valid_record_parses():
    record = RawMetricRecord(
        region_id="state:48", metric_key="median_price", period="2026-06-01", value=350000.0
    )
    assert record.value == 350000.0
    assert record.period.year == 2026


def test_extra_field_is_drift():
    with pytest.raises(ValidationError):
        RawMetricRecord(
            region_id="state:48",
            metric_key="median_price",
            period="2026-06-01",
            value=1.0,
            unexpected="x",
        )


def test_bad_period_rejected():
    with pytest.raises(ValidationError):
        RawMetricRecord(
            region_id="state:48", metric_key="median_price", period="not-a-date", value=1.0
        )


def test_non_finite_value_rejected():
    with pytest.raises(ValidationError):
        RawMetricRecord(
            region_id="state:48", metric_key="median_price", period="2026-06-01", value=float("inf")
        )


def test_empty_region_rejected():
    with pytest.raises(ValidationError):
        RawMetricRecord(
            region_id="   ", metric_key="median_price", period="2026-06-01", value=1.0
        )


def test_payload_wraps_records():
    payload = RawPayload(
        source="synthetic",
        records=[
            {"region_id": "state:48", "metric_key": "median_price", "period": "2026-06-01", "value": 1.0}
        ],
    )
    assert payload.source == "synthetic"
    assert len(payload.records) == 1
