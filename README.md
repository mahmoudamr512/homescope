# HomeScope

Interactive US housing-market explorer — choropleth across state, metro, county,
and ZIP, with metric switching and per-region historical drill-down.

Geometry is real (US Census TIGER/Line). Metric data is synthetic and labeled as
such. Built by Mahmoud Amr as an open-source geospatial data-product showcase.

## Stack

Next.js + MapLibre GL JS + PMTiles, Postgres/PostGIS, a Python ETL, all runnable
via Docker Compose.

## Quick start

```bash
pnpm install
docker compose -f infra/docker-compose.yml up -d
pnpm dev
```

See `docs/` for architecture and the data dictionary.

## License

MIT (c) Mahmoud Amr
