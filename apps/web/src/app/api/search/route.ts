import { type NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb } from "@homescope/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const db = getDb();
  const like = `%${q}%`;
  const rows = await db.execute<{
    region_id: string;
    name: string;
    resolution: string;
    lng: number;
    lat: number;
  }>(sql`
    SELECT region_id, name, resolution, ST_X(centroid) AS lng, ST_Y(centroid) AS lat
    FROM regions
    WHERE name ILIKE ${like} OR geoid ILIKE ${like}
    ORDER BY
      CASE resolution
        WHEN 'state' THEN 0 WHEN 'metro' THEN 1 WHEN 'county' THEN 2 ELSE 3
      END,
      name
    LIMIT 20
  `);

  return NextResponse.json({
    results: rows.map((r) => ({
      regionId: r.region_id,
      name: r.name,
      resolution: r.resolution,
      lng: r.lng,
      lat: r.lat,
    })),
  });
}
