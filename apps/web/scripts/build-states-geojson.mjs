// Builds a simplified US states GeoJSON from the us-atlas TopoJSON package.
// Output is gitignored and regenerated on demand / prebuild.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { feature } from "topojson-client";
import statesTopo from "us-atlas/states-10m.json" with { type: "json" };

const here = dirname(fileURLToPath(import.meta.url));
const outPath = join(here, "..", "public", "data", "states.geojson");

const fc = feature(statesTopo, statesTopo.objects.states);
const withIds = {
  type: "FeatureCollection",
  features: fc.features.map((f) => ({
    ...f,
    id: f.id,
    properties: { id: f.id, name: f.properties.name },
  })),
};

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(withIds));
console.log(`Wrote ${withIds.features.length} states to ${outPath}`);
