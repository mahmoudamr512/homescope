import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

const migrationsDir = join(dirname(fileURLToPath(import.meta.url)), "..", "migrations");
const MIGRATION_NAME = /^\d{4}_[a-z0-9_]+\.sql$/;
const sql = postgres(url, { max: 1, onnotice: () => {} });

async function main(): Promise<void> {
  await sql.unsafe(
    `CREATE TABLE IF NOT EXISTS _migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now());`,
  );

  const rows = await sql<{ name: string }[]>`SELECT name FROM _migrations`;
  const applied = new Set(rows.map((r) => r.name));

  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`skip ${file}`);
      continue;
    }
    if (!MIGRATION_NAME.test(file)) {
      throw new Error(`Invalid migration filename: ${file}`);
    }
    const content = readFileSync(join(migrationsDir, file), "utf8");
    // Run the migration body and record it atomically in one transaction.
    // The bookkeeping insert is parameterized; only the migration SQL itself
    // (developer-authored, never user input) is executed verbatim.
    await sql.begin(async (tx) => {
      await tx.unsafe(content).simple();
      await tx`INSERT INTO _migrations (name) VALUES (${file})`;
    });
    console.log(`applied ${file}`);
  }

  await sql.end();
}

main().catch((err: unknown) => {
  console.error(err);
  process.exitCode = 1;
});
