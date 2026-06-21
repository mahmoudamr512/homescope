"""A deliberately drifted source, used to prove the pipeline rejects bad data.

The record uses the camelCase field name `metricKey` instead of `metric_key`,
simulating a silent upstream rename - exactly the kind of drift the validation
stage must catch.
"""

from __future__ import annotations

from collections.abc import Iterator

from homescope_etl.pipeline.adapter import RawData


class BrokenSource:
    name = "broken"

    def records(self) -> Iterator[RawData]:
        yield {
            "region_id": "state:48",
            "metricKey": "median_price",
            "period": "2026-06-01",
            "value": 350000.0,
        }
