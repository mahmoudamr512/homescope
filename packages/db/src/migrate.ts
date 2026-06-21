import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

const migrationsDir = join(dirname(fileURLToPath(import.meta.url)), "..", "migrations");
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
    const content = readFileSync(join(migrationsDir, file), "utf8");
    const batch = `BEGIN;\n${content}\nINSERT INTO _migrations (name) VALUES ('${file}');\nCOMMIT;`;
    await sql.unsafe(batch).simple();
    console.log(`applied ${file}`);
  }

  await sql.end();
}

main().catch((err: unknown) => {
  console.error(err);
  process.exitCode = 1;
});
