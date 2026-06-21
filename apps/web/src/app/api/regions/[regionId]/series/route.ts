import { type NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { metricKeySchema } from "@homescope/contract";
import { getDb } from "@homescope/db";

export const dynamic = "force-dynamic";

const REGION_ID = /^(state|metro|county|zip):[A-Za-z0-9]+$/;
const RANGE_MONTHS: Record<string, number | null> = { "1Y": 12, "3Y": 36, "5Y": 60, All: null };

export async function GET(req: NextRequest, { params }: { params: Promise<{ regionId: string }> }) {
  const { regionId } = await params;
  const metric = metricKeySchema.safeParse(req.nextUrl.searchParams.get("metric"));
  const range = req.nextUrl.searchParams.get("range") ?? "5Y";

  if (!REGION_ID.test(regionId) || !metric.success || !(range in RANGE_MONTHS)) {
    return NextResponse.json({ error: "invalid region, metric, or range" }, { status: 400 });
  }

  const db = getDb();
  const rows = await db.execute<{ period: string; value: string }>(sql`
    SELECT period, value FROM region_metric_monthly
    WHERE region_id = ${regionId} AND metric_key = ${metric.data}
    ORDER BY period ASC
  `);

  let points = rows.map((row) => ({ period: row.period, value: Number(row.value) }));
  const months = RANGE_MONTHS[range];
  if (months) points = points.slice(-months);

  return NextResponse.json({ regionId, metric: metric.data, range, points });
}
