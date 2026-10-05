import { asc, eq } from "drizzle-orm";
import { db as defaultDb, type Db } from "../db/index.js";
import { timetable } from "../db/schema.js";

export interface TimetableRow {
  id: number;
  ordinal: number;
  effectiveFrom: Date;
  isActive: number;
}

/** A full timetable row for the admin view, including creation time. */
export interface AdminTimetableRow {
  id: number;
  ordinal: number;
  effectiveFrom: Date;
  isActive: number;
  createdAt: Date;
}

/**
 * Repository layer: returns active (is_active=1) timetable rows ordered by
 * effective date ascending for stable display.
 */
export async function listActiveTimetables(
  db: Db = defaultDb
): Promise<TimetableRow[]> {
  const rows = await db
    .select({
      id: timetable.id,
      ordinal: timetable.ordinal,
      effectiveFrom: timetable.effectiveFrom,
      isActive: timetable.isActive,
    })
    .from(timetable)
    .where(eq(timetable.isActive, 1))
    .orderBy(asc(timetable.effectiveFrom))
    .all();
  return rows;
}

/**
 * Returns every timetable (active and inactive) for the admin view, in a
 * deterministic order (ascending by id).
 */
export async function listAllTimetables(
  db: Db = defaultDb
): Promise<AdminTimetableRow[]> {
  return await db
    .select({
      id: timetable.id,
      ordinal: timetable.ordinal,
      effectiveFrom: timetable.effectiveFrom,
      isActive: timetable.isActive,
      createdAt: timetable.createdAt,
    })
    .from(timetable)
    .orderBy(asc(timetable.id))
    .all();
}

/**
 * Sets a timetable's active state. Returns true when a row was updated, or
 * false when no timetable with that id exists (caller maps to not-found).
 */
export async function setTimetableActive(
  id: number,
  isActive: boolean,
  db: Db = defaultDb
): Promise<boolean> {
  const existing = await db
    .select({ id: timetable.id })
    .from(timetable)
    .where(eq(timetable.id, id))
    .get();
  if (existing === undefined) return false;
  await db
    .update(timetable)
    .set({ isActive: isActive ? 1 : 0 })
    .where(eq(timetable.id, id))
    .run();
  return true;
}
