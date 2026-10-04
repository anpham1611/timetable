import { eq, sql } from "drizzle-orm";
import { db as defaultDb, type Db } from "../db/index.js";
import { visitCounter } from "../db/schema.js";

/**
 * Repository layer: the only place that touches the database.
 * The single global counter lives in visit_counter row id=1.
 */

function ensureRow(db: Db): void {
  db.insert(visitCounter).values({ id: 1, count: 0 }).onConflictDoNothing().run();
}

/**
 * Atomically increments the global visit counter and returns the new total.
 * Uses a single SQL UPDATE to avoid a read-modify-write race.
 */
export function incrementVisitCount(db: Db = defaultDb): number {
  ensureRow(db);
  db.update(visitCounter)
    .set({ count: sql`${visitCounter.count} + 1` })
    .where(eq(visitCounter.id, 1))
    .run();
  const row = db.get<{ count: number }>(
    sql`SELECT count FROM visit_counter WHERE id = 1`
  );
  return row?.count ?? 0;
}

/** Returns the current global visit total. */
export function getVisitCount(db: Db = defaultDb): number {
  ensureRow(db);
  const row = db.get<{ count: number }>(
    sql`SELECT count FROM visit_counter WHERE id = 1`
  );
  return row?.count ?? 0;
}
