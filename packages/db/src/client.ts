import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type Database = ReturnType<typeof drizzle<typeof schema>>;

let db: Database | undefined;

export function getDb(): Database {
  if (!db) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    // prepare:false keeps this compatible with transaction-pooled endpoints
    // (e.g. Neon's pgbouncer pooler); max kept low for serverless.
    db = drizzle(postgres(url, { max: 5, prepare: false }), { schema });
  }
  return db;
}
