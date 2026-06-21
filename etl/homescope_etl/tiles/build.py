"""Build per-resolution PMTiles from PostGIS geometry via ogr2ogr + tippecanoe.

Each resolution is exported to GeoJSON (region_id exposed as `id`) and tiled into a
single PMTiles archive with a sensible zoom band, so the map fetches geometry once
and recolors client-side via feature-state.
"""

from __future__ import annotations

import subprocess
import tempfile
from pathlib import Path

from homescope_etl.db import ogr_pg_string
from homescope_etl.geometry.sources import RESOLUTION_ORDER

# (min zoom, max zoom) per resolution.
ZOOM: dict[str, tuple[int, int]] = {
    "state": (0, 5),
    "metro": (3, 7),
    "county": (4, 8),
    "zip": (6, 12),
}


def _repo_root() -> Path:
    cwd = Path.cwd()
    for candidate in [cwd, *cwd.parents]:
        if (candidate / "pnpm-workspace.yaml").exists():
            return candidate
    return cwd


def _export_geojson(resolution: str, out: Path) -> None:
    sql = f"SELECT region_id AS id, name, geom FROM regions WHERE resolution = '{resolution}'"
    subprocess.run(
        ["ogr2ogr", "-f", "GeoJSON", str(out), ogr_pg_string(), "-sql", sql, "-nln", "regions"],
        check=True,
    )


def _tippecanoe(geojson: Path, pmtiles: Path, minzoom: int, maxzoom: int) -> None:
    subprocess.run(
        [
            "tippecanoe",
            "-o",
            str(pmtiles),
            "-l",
            "regions",
            "-f",
            "-Z",
            str(minzoom),
            "-z",
            str(maxzoom),
            "--drop-densest-as-needed",
            "--coalesce-densest-as-needed",
            "--detect-shared-borders",
            "--simplification=10",
            str(geojson),
        ],
        check=True,
    )


def build_tiles(resolutions: list[str], out_dir: Path | None = None) -> None:
    out_dir = out_dir or (_repo_root() / "apps" / "web" / "public" / "tiles")
    out_dir.mkdir(parents=True, exist_ok=True)
    for resolution in [r for r in RESOLUTION_ORDER if r in resolutions]:
        minzoom, maxzoom = ZOOM[resolution]
        with tempfile.TemporaryDirectory() as tmp:
            geojson = Path(tmp) / f"{resolution}.geojson"
            print(f"exporting {resolution} geometry")
            _export_geojson(resolution, geojson)
            pmtiles = out_dir / f"{resolution}.pmtiles"
            print(f"tiling {resolution} -> {pmtiles}")
            _tippecanoe(geojson, pmtiles, minzoom, maxzoom)
        print(f"built {pmtiles}")
