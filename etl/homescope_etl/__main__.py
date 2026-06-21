"""HomeScope ETL command-line entrypoint."""

from __future__ import annotations

import argparse

import psycopg

from homescope_etl.db import get_dsn
from homescope_etl.generate.load import fetch_regions, generate_metrics
from homescope_etl.geometry.load import load_geometry
from homescope_etl.geometry.sources import RESOLUTION_ORDER
from homescope_etl.pipeline.adapter import SourceAdapter
from homescope_etl.pipeline.run import run_pipeline
from homescope_etl.pipeline.sources.broken import BrokenSource
from homescope_etl.pipeline.sources.synthetic import SyntheticSource
from homescope_etl.tiles.build import build_tiles


def main() -> None:
    parser = argparse.ArgumentParser(prog="homescope_etl")
    sub = parser.add_subparsers(dest="command", required=True)

    geo = sub.add_parser("load-geometry", help="Download and load Census geometry")
    geo.add_argument(
        "--resolution", nargs="+", choices=RESOLUTION_ORDER, default=list(RESOLUTION_ORDER)
    )

    gen = sub.add_parser("generate-metrics", help="Generate synthetic metric series")
    gen.add_argument("--months", type=int, default=60)
    gen.add_argument("--seed", type=int, default=42)

    run = sub.add_parser("run", help="Run the resilient adapter->validate->load pipeline")
    run.add_argument("--months", type=int, default=60)
    run.add_argument("--seed", type=int, default=42)
    run.add_argument(
        "--with-broken",
        action="store_true",
        help="Also include the drifted broken source to demonstrate rejection",
    )

    tiles = sub.add_parser("build-tiles", help="Build per-resolution PMTiles")
    tiles.add_argument(
        "--resolution", nargs="+", choices=RESOLUTION_ORDER, default=list(RESOLUTION_ORDER)
    )

    args = parser.parse_args()
    if args.command == "load-geometry":
        load_geometry(args.resolution)
    elif args.command == "generate-metrics":
        generate_metrics(months=args.months, seed=args.seed)
    elif args.command == "run":
        with psycopg.connect(get_dsn()) as conn:
            regions = fetch_regions(conn)
        adapters: list[SourceAdapter] = [SyntheticSource(regions, args.months, args.seed)]
        if args.with_broken:
            adapters.append(BrokenSource())
        run_pipeline(adapters)
    elif args.command == "build-tiles":
        build_tiles(args.resolution)


if __name__ == "__main__":
    main()
