import { type NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb } from "@homescope/db";

export const dynamic = "force-dynamic";

const REGION_ID = /^(state|metro|county|zip):[A-Za-z0-9]+$/;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ regionId: string }> }) {
  const { regionId } = await params;
  if (!REGION_ID.test(regionId)) {
    return NextResponse.json({ error: "invalid region id" }, { status: 400 });
  }

  const db = getDb();
  const regionRows = await db.execute<{
    region_id: string;
    resolution: string;
    geoid: string;
    name: string;
  }>(sql`SELECT region_id, resolution, geoid, name FROM regions WHERE region_id = ${regionId}`);

  const region = regionRows[0];
  if (!region) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const valueRows = await db.execute<{ metric_key: string; value: string }>(
    sql`SELECT metric_key, value FROM region_metric_current WHERE region_id = ${regionId}`,
  );
  const values: Record<string, number> = {};
  for (const row of valueRows) {
    values[row.metric_key] = Number(row.value);
  }

  return NextResponse.json({ region, values });
}
