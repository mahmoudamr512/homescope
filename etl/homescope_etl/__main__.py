"""HomeScope ETL command-line entrypoint."""

from __future__ import annotations

import argparse

from homescope_etl.generate.load import generate_metrics
from homescope_etl.geometry.load import load_geometry
from homescope_etl.geometry.sources import RESOLUTION_ORDER


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

    args = parser.parse_args()
    if args.command == "load-geometry":
        load_geometry(args.resolution)
    elif args.command == "generate-metrics":
        generate_metrics(months=args.months, seed=args.seed)


if __name__ == "__main__":
    main()
