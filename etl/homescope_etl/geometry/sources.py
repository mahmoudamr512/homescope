"""Registry of Census cartographic boundary sources, one per resolution.

State, county, and CBSA come from the 2023 vintage; ZCTA boundaries are only
published in the 2020 cartographic set. Field names are the (lowercased) shapefile
attributes as they land in the ogr2ogr staging tables.
"""

from __future__ import annotations

from dataclasses import dataclass

GENZ2023 = "https://www2.census.gov/geo/tiger/GENZ2023/shp"
GENZ2020 = "https://www2.census.gov/geo/tiger/GENZ2020/shp"

RESOLUTION_ORDER = ["state", "county", "metro", "zip"]


@dataclass(frozen=True)
class GeometrySource:
    resolution: str
    url: str
    geoid_field: str
    name_field: str


SOURCES: dict[str, GeometrySource] = {
    "state": GeometrySource("state", f"{GENZ2023}/cb_2023_us_state_500k.zip", "geoid", "name"),
    "county": GeometrySource(
        "county", f"{GENZ2023}/cb_2023_us_county_500k.zip", "geoid", "namelsad"
    ),
    "metro": GeometrySource("metro", f"{GENZ2023}/cb_2023_us_cbsa_500k.zip", "geoid", "name"),
    "zip": GeometrySource("zip", f"{GENZ2020}/cb_2020_us_zcta520_500k.zip", "geoid20", "geoid20"),
}


def get_source(resolution: str) -> GeometrySource:
    try:
        return SOURCES[resolution]
    except KeyError:
        raise ValueError(f"Unknown resolution: {resolution}") from None
