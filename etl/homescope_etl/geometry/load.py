"""Download Census boundary shapefiles and load them into the regions table.

Per resolution: download + unzip, ogr2ogr the shapefile into a staging table
(reprojected to EPSG:4326, promoted to MultiPolygon), then transform the staging
rows into canonical `regions` rows inside a transaction.
"""

from __future__ import annotations

import subprocess
import tempfile
import urllib.request
import zipfile
from pathlib import Path

import psycopg

from homescope_etl.db import get_dsn, ogr_pg_string
from homescope_etl.geometry.sources import RESOLUTION_ORDER, GeometrySource, get_source

# region_id, resolution, geoid, name, parent_state_geoid built from staging columns.
TRANSFORM_SQL: dict[str, str] = {
    "state": """
        INSERT INTO regions (region_id, resolution, geoid, name, parent_state_geoid, geom, centroid)
        SELECT 'state:' || geoid, 'state', geoid, name, geoid, geom, ST_PointOnSurface(geom)
        FROM staging_state
        ON CONFLICT (region_id) DO UPDATE
        SET name = EXCLUDED.name, geom = EXCLUDED.geom, centroid = EXCLUDED.centroid,
            parent_state_geoid = EXCLUDED.parent_state_geoid;
    """,
    "county": """
        INSERT INTO regions (region_id, resolution, geoid, name, parent_state_geoid, geom, centroid)
        SELECT 'county:' || geoid, 'county', geoid, namelsad, left(geoid, 2),
               geom, ST_PointOnSurface(geom)
        FROM staging_county
        ON CONFLICT (region_id) DO UPDATE
        SET name = EXCLUDED.name, geom = EXCLUDED.geom, centroid = EXCLUDED.centroid,
            parent_state_geoid = EXCLUDED.parent_state_geoid;
    """,
    "metro": """
        INSERT INTO regions (region_id, resolution, geoid, name, geom, centroid)
        SELECT 'metro:' || geoid, 'metro', geoid, name, geom, ST_PointOnSurface(geom)
        FROM staging_metro
        ON CONFLICT (region_id) DO UPDATE
        SET name = EXCLUDED.name, geom = EXCLUDED.geom, centroid = EXCLUDED.centroid;
    """,
    "zip": """
        INSERT INTO regions (region_id, resolution, geoid, name, geom, centroid)
        SELECT 'zip:' || geoid20, 'zip', geoid20, geoid20, geom, ST_PointOnSurface(geom)
        FROM staging_zip
        ON CONFLICT (region_id) DO UPDATE
        SET geom = EXCLUDED.geom, centroid = EXCLUDED.centroid;
    """,
}

# ZCTAs have no county field; derive the parent county by point-in-polygon on the
# ZCTA centroid. Requires counties to be loaded first.
ZIP_PARENT_SQL = """
    UPDATE regions z
    SET parent_county_geoid = c.geoid,
        parent_state_geoid = c.parent_state_geoid
    FROM regions c
    WHERE z.resolution = 'zip' AND c.resolution = 'county'
      AND ST_Contains(c.geom, z.centroid);
"""


def _download_shapefile(src: GeometrySource, workdir: Path) -> Path:
    zip_path = workdir / f"{src.resolution}.zip"
    print(f"  downloading {src.url}")
    urllib.request.urlretrieve(src.url, zip_path)  # noqa: S310 (trusted census.gov host)
    with zipfile.ZipFile(zip_path) as zf:
        zf.extractall(workdir)
    return next(workdir.glob("*.shp"))


def _ogr_load(shp: Path, table: str) -> None:
    cmd = [
        "ogr2ogr",
        "-f",
        "PostgreSQL",
        ogr_pg_string(),
        str(shp),
        "-nln",
        table,
        "-overwrite",
        "-lco",
        "GEOMETRY_NAME=geom",
        "-nlt",
        "PROMOTE_TO_MULTI",
        "-t_srs",
        "EPSG:4326",
    ]
    subprocess.run(cmd, check=True)


def load_resolution(resolution: str) -> int:
    src = get_source(resolution)
    with tempfile.TemporaryDirectory() as tmp:
        shp = _download_shapefile(src, Path(tmp))
        _ogr_load(shp, f"staging_{resolution}")

    with psycopg.connect(get_dsn()) as conn:
        with conn.cursor() as cur:
            cur.execute(TRANSFORM_SQL[resolution])
            if resolution == "zip":
                cur.execute(ZIP_PARENT_SQL)
            cur.execute("SELECT count(*) FROM regions WHERE resolution = %s", (resolution,))
            row = cur.fetchone()
            count = int(row[0]) if row else 0
            # Staging is a build artifact; drop it so it never reaches a hosted DB.
            cur.execute(f"DROP TABLE IF EXISTS staging_{resolution}")
        conn.commit()
    return count


def load_geometry(resolutions: list[str]) -> None:
    for resolution in [r for r in RESOLUTION_ORDER if r in resolutions]:
        print(f"loading {resolution} geometry")
        count = load_resolution(resolution)
        print(f"loaded {count} {resolution} regions")
