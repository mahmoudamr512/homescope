# HomeScope ETL

Python pipeline: extract -> validate -> normalize -> load -> tile.
Stages are implemented across milestones M1 (data model + generator) and M2
(drift defense + tiles). Run with `python -m homescope_etl run` once available.

## Setup

```bash
cd etl
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
```
