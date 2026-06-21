import { metrics as registry } from "@homescope/contract";
import { getDb } from "./client";
import { metrics as metricsTable } from "./schema";

async function main(): Promise<void> {
  const db = getDb();
  const rows = Object.entries(registry).map(([metricKey, def]) => ({
    metricKey,
    label: def.label,
    unit: def.unit,
    format: def.format,
    aggregation: def.aggregation,
  }));

  for (const row of rows) {
    await db
      .insert(metricsTable)
      .values(row)
      .onConflictDoUpdate({
        target: metricsTable.metricKey,
        set: {
          label: row.label,
          unit: row.unit,
          format: row.format,
          aggregation: row.aggregation,
        },
      });
  }

  console.log(`seeded ${rows.length} metrics`);
  process.exit(0);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
