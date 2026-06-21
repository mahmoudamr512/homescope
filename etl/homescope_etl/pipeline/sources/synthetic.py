"""Synthetic source adapter — stands in for a real market-data feed."""

from __future__ import annotations

from collections.abc import Iterator

from homescope_etl.generate.generator import RegionRef, compute_bases, generate_region_series
from homescope_etl.pipeline.adapter import RawData


class SyntheticSource:
    name = "synthetic"

    def __init__(self, regions: list[RegionRef], months: int = 60, seed: int = 42) -> None:
        self._regions = regions
        self._months = months
        self._seed = seed

    def records(self) -> Iterator[RawData]:
        bases = compute_bases(self._regions)
        for region in self._regions:
            series = generate_region_series(
                region.region_id, region.resolution, bases[region.region_id], self._months, self._seed
            )
            for metric_key, points in series.items():
                for period, value in points:
                    yield {
                        "region_id": region.region_id,
                        "metric_key": metric_key,
                        "period": period.isoformat(),
                        "value": value,
                    }
