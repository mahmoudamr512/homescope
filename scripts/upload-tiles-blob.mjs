// Uploads the built PMTiles to Vercel Blob and prints NEXT_PUBLIC_TILES_URL.
// Usage: BLOB_READ_WRITE_TOKEN=... node scripts/upload-tiles-blob.mjs
// The token comes from your Vercel Blob store (Storage -> your store -> tokens).
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { put } from "@vercel/blob";

const here = dirname(fileURLToPath(import.meta.url));
const tilesDir = join(here, "..", "apps", "web", "public", "tiles");

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error("Set BLOB_READ_WRITE_TOKEN (from your Vercel Blob store) and re-run.");
  process.exit(1);
}

const files = readdirSync(tilesDir).filter((f) => f.endsWith(".pmtiles"));
if (files.length === 0) {
  console.error(`No .pmtiles found in ${tilesDir}. Run "build-tiles" first.`);
  process.exit(1);
}

let base = null;
for (const file of files) {
  const data = readFileSync(join(tilesDir, file));
  const { url } = await put(`tiles/${file}`, data, {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/octet-stream",
  });
  console.log(`uploaded ${file} -> ${url}`);
  base = url.slice(0, url.lastIndexOf("/"));
}

console.log(`\nSet this on Vercel:\nNEXT_PUBLIC_TILES_URL=${base}`);
