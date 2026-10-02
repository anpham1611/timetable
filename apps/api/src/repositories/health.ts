import { sql } from "drizzle-orm";
import { db } from "../db/index.js";

/**
 * Repository layer: the only place that touches the database.
 * Proves DB connectivity for the health check.
 */
export async function pingDatabase(): Promise<boolean> {
  const result = db.get<{ ok: number }>(sql`SELECT 1 as ok`);
  return result?.ok === 1;
}
