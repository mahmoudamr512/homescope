import pytest

from homescope_etl.geometry.sources import RESOLUTION_ORDER, SOURCES, get_source


def test_all_resolutions_present():
    assert set(SOURCES) == set(RESOLUTION_ORDER)


def test_state_source_url():
    assert get_source("state").url.endswith("cb_2023_us_state_500k.zip")


def test_zip_uses_2020_vintage():
    assert "GENZ2020" in get_source("zip").url


def test_unknown_resolution_raises():
    with pytest.raises(ValueError):
        get_source("planet")
