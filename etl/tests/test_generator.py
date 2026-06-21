from homescope_etl.generate.generator import (
    METRIC_DOM,
    METRIC_INVENTORY,
    METRIC_PRICE,
    METRIC_YOY,
    RegionRef,
    compute_bases,
    generate_region_series,
    unit_hash,
)


def test_unit_hash_deterministic_and_bounded():
    assert unit_hash("x") == unit_hash("x")
    assert 0.0 <= unit_hash("x") <= 1.0


def test_series_is_deterministic():
    a = generate_region_series("state:48", "state", 400_000, 60, 42)
    b = generate_region_series("state:48", "state", 400_000, 60, 42)
    assert a == b


def test_price_series_length_and_positive():
    series = generate_region_series("county:48453", "county", 350_000, 60, 42)
    prices = series[METRIC_PRICE]
    assert len(prices) == 60
    assert all(value > 0 for _, value in prices)


def test_yoy_is_derived_from_price():
    series = generate_region_series("state:06", "state", 800_000, 60, 42)
    prices = series[METRIC_PRICE]
    yoy = series[METRIC_YOY]
    assert len(yoy) == len(prices) - 12
    for k, (period, change) in enumerate(yoy):
        i = k + 12
        expected = round((prices[i][1] / prices[i - 12][1] - 1) * 100, 2)
        assert period == prices[i][0]
        assert abs(change - expected) < 1e-6


def test_dom_and_inventory_bounds():
    series = generate_region_series("zip:78704", "zip", 500_000, 60, 42)
    assert all(7 <= value <= 180 for _, value in series[METRIC_DOM])
    assert all(value >= 0 for _, value in series[METRIC_INVENTORY])


def test_child_base_within_band_of_parent():
    regions = [
        RegionRef("state:48", "state", "48", None, None),
        RegionRef("county:48453", "county", "48453", "48", None),
        RegionRef("zip:78704", "zip", "78704", "48", "48453"),
    ]
    bases = compute_bases(regions)
    assert 0.7 <= bases["county:48453"] / bases["state:48"] <= 1.3
    assert 0.7 <= bases["zip:78704"] / bases["county:48453"] <= 1.3
