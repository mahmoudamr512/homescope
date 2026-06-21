import { type NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getMetric, metricKeySchema } from "@homescope/contract";
import { getDb } from "@homescope/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

const resolutionSchema = z.enum(["state", "metro", "county", "zip"]);

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor((sorted.length - 1) * p)));
  return sorted[idx] ?? 0;
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const resolution = resolutionSchema.safeParse(params.get("resolution"));
  const metric = metricKeySchema.safeParse(params.get("metric"));
  if (!resolution.success || !metric.success) {
    return NextResponse.json({ error: "invalid resolution or metric" }, { status: 400 });
  }

  const db = getDb();
  const rows = await db.execute<{ region_id: string; value: string }>(sql`
    SELECT c.region_id, c.value
    FROM region_metric_current c
    JOIN regions reg ON reg.region_id = c.region_id
    WHERE reg.resolution = ${resolution.data} AND c.metric_key = ${metric.data}
  `);

  const values: Record<string, number> = {};
  for (const row of rows) {
    values[row.region_id] = Number(row.value);
  }

  const sorted = Object.values(values).sort((a, b) => a - b);
  const lo = percentile(sorted, 0.02);
  const hi = percentile(sorted, 0.98);
  const ramp = getMetric(metric.data).ramp;
  const domain: [number, number] =
    ramp === "diverging" ? [-Math.max(Math.abs(lo), Math.abs(hi), 1), Math.max(Math.abs(lo), Math.abs(hi), 1)] : [lo, hi];

  return NextResponse.json({
    resolution: resolution.data,
    metric: metric.data,
    values,
    domain,
  });
}
