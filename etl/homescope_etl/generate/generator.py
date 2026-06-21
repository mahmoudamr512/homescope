"""Deterministic synthetic-metric generator.

Same seed produces the same dataset. Per-region base price levels are derived from
a stable hash of the region, biased upward for high-cost states and built
hierarchically (county off its state, ZCTA off its county) so child regions roughly
aggregate to their parents. Each monthly series is trend + seasonality + bounded
noise. Year-over-year change is derived from the price series, never independent.
"""

from __future__ import annotations

import hashlib
import math
import random
from dataclasses import dataclass
from datetime import date

METRIC_PRICE = "median_price"
METRIC_INVENTORY = "inventory"
METRIC_DOM = "days_on_market"
METRIC_YOY = "yoy_price_change"

# Fixed anchor (newest month) so the dataset is reproducible regardless of run date.
END_PERIOD = date(2026, 6, 1)
NATIONAL_BASE = 360_000.0

# FIPS for higher-cost states: CA, CO, DC, HI, MA, NJ, NY, WA.
HIGH_COST_STATES = {"06", "08", "11", "15", "25", "34", "36", "53"}

# Rough active-inventory scale by resolution.
INV_SCALE = {"state": 9000.0, "metro": 3000.0, "county": 600.0, "zip": 40.0}

SeriesPoint = tuple[date, float]


@dataclass(frozen=True)
class RegionRef:
    region_id: str
    resolution: str
    geoid: str
    parent_state_geoid: str | None
    parent_county_geoid: str | None


def unit_hash(key: str) -> float:
    """Stable hash of a string into the [0, 1] interval."""
    digest = hashlib.md5(key.encode()).hexdigest()
    return int(digest[:8], 16) / 0xFFFFFFFF


def _state_base(geoid: str) -> float:
    base = 180_000 + unit_hash(f"state:{geoid}") * 420_000
    if geoid in HIGH_COST_STATES:
        base *= 1.6
    return base


def _child_factor(key: str) -> float:
    return 0.7 + unit_hash(key) * 0.6  # 0.7 .. 1.3


def compute_bases(regions: list[RegionRef]) -> dict[str, float]:
    """Compute a base price level per region, hierarchically where possible."""
    bases: dict[str, float] = {}
    state_base: dict[str, float] = {}

    for r in regions:
        if r.resolution == "state":
            level = _state_base(r.geoid)
            state_base[r.geoid] = level
            bases[r.region_id] = level

    for r in regions:
        if r.resolution == "county":
            parent = state_base.get(r.parent_state_geoid or "", NATIONAL_BASE)
            bases[r.region_id] = parent * _child_factor(r.region_id)

    for r in regions:
        if r.resolution == "zip":
            parent: float | None = None
            if r.parent_county_geoid:
                parent = bases.get(f"county:{r.parent_county_geoid}")
            if parent is None:
                parent = state_base.get(r.parent_state_geoid or "", NATIONAL_BASE)
            bases[r.region_id] = parent * _child_factor(r.region_id)

    for r in regions:
        if r.resolution == "metro":
            bases[r.region_id] = 260_000 + unit_hash(r.region_id) * 480_000

    return bases


def _periods(months: int) -> list[date]:
    out: list[date] = []
    year, month = END_PERIOD.year, END_PERIOD.month
    for _ in range(months):
        out.append(date(year, month, 1))
        month -= 1
        if month == 0:
            month = 12
            year -= 1
    out.reverse()  # oldest first
    return out


def generate_region_series(
    region_id: str,
    resolution: str,
    base: float,
    months: int,
    seed: int,
) -> dict[str, list[SeriesPoint]]:
    """Generate the full metric series for one region."""
    rng = random.Random(f"{seed}:{region_id}")
    periods = _periods(months)
    growth = 0.02 + unit_hash(f"g:{region_id}") * 0.05  # 2%..7% annual
    span_years = (months - 1) / 12.0
    start = base / ((1 + growth) ** span_years)

    prices: list[float] = []
    for i, period in enumerate(periods):
        trend = (1 + growth) ** (i / 12.0)
        seasonal = 1 + 0.03 * math.sin(2 * math.pi * (period.month - 3) / 12)
        noise = 1 + rng.uniform(-0.012, 0.012)
        prices.append(round(start * trend * seasonal * noise, 2))

    inv_level = INV_SCALE[resolution] * (0.5 + unit_hash(f"inv:{region_id}"))
    inventories: list[float] = []
    for period in periods:
        seasonal = 1 + 0.18 * math.sin(2 * math.pi * (period.month - 3) / 12)
        noise = 1 + rng.uniform(-0.06, 0.06)
        inventories.append(float(max(0, round(inv_level * seasonal * noise))))

    dom_base = 28 + unit_hash(f"dom:{region_id}") * 40  # 28..68 days
    doms: list[float] = []
    for period in periods:
        seasonal = 1 - 0.15 * math.sin(2 * math.pi * (period.month - 3) / 12)
        noise = 1 + rng.uniform(-0.08, 0.08)
        doms.append(float(min(180, max(7, round(dom_base * seasonal * noise)))))

    yoy: list[SeriesPoint] = []
    for i in range(12, len(prices)):
        change = (prices[i] / prices[i - 12] - 1) * 100
        yoy.append((periods[i], round(change, 2)))

    return {
        METRIC_PRICE: list(zip(periods, prices, strict=True)),
        METRIC_INVENTORY: list(zip(periods, inventories, strict=True)),
        METRIC_DOM: list(zip(periods, doms, strict=True)),
        METRIC_YOY: yoy,
    }
