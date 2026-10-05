import { eq, sql } from "drizzle-orm";
import { db as defaultDb, type Db } from "../db/index.js";
import { visitCounter } from "../db/schema.js";

/**
 * Repository layer: the only place that touches the database.
 * The single global counter lives in visit_counter row id=1.
 */

async function ensureRow(db: Db): Promise<void> {
  await db.insert(visitCounter).values({ id: 1, count: 0 }).onConflictDoNothing().run();
}

/**
 * Atomically increments the global visit counter and returns the new total.
 * Uses a single SQL UPDATE to avoid a read-modify-write race.
 */
export async function incrementVisitCount(db: Db = defaultDb): Promise<number> {
  await ensureRow(db);
  await db
    .update(visitCounter)
    .set({ count: sql`${visitCounter.count} + 1` })
    .where(eq(visitCounter.id, 1))
    .run();
  const row = await db.get<{ count: number }>(
    sql`SELECT count FROM visit_counter WHERE id = 1`
  );
  return row?.count ?? 0;
}

/** Returns the current global visit total. */
export async function getVisitCount(db: Db = defaultDb): Promise<number> {
  await ensureRow(db);
  const row = await db.get<{ count: number }>(
    sql`SELECT count FROM visit_counter WHERE id = 1`
  );
  return row?.count ?? 0;
}
