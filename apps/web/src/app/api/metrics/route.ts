import { NextResponse } from "next/server";
import { metricKeys, metrics } from "@homescope/contract";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ metricKeys, metrics });
}
