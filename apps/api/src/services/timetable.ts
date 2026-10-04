import {
  activeTimetablesResponseSchema,
  adminTimetableListResponseSchema,
  type ActiveTimetablesResponse,
  type AdminTimetableListResponse,
} from "@timetable/shared";
import type { Db } from "../db/index.js";
import {
  listActiveTimetables,
  listAllTimetables,
  setTimetableActive,
  type TimetableRow,
} from "../repositories/timetable.js";
import {
  listActiveTimetableRows,
  timetableExists,
} from "../repositories/grid.js";

/** Formats a Date as an ISO date string (YYYY-MM-DD) in UTC. */
function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Picks the default-selected TKB: the latest one by effective date (the newest
 * schedule), or null when there are no rows. Rows are expected ascending by
 * effectiveFrom, so the latest is the one with the maximum effective date.
 */
export function computeDefaultSelectedId(
  rows: TimetableRow[]
): number | null {
  if (rows.length === 0) return null;

  let latest = rows[0]!;
  for (const row of rows) {
    if (row.effectiveFrom.getTime() >= latest.effectiveFrom.getTime()) {
      latest = row; // ties resolve to the later row in ascending order
    }
  }
  return latest.id;
}

/**
 * Resolve the published TKB that a read (directory lookup or grid) should use:
 *   - an explicit `requested` id when it exists, else null (caller → empty/404);
 *   - otherwise the default active TKB (the home view's default), or null when
 *     no active TKB exists.
 * This is the single source of truth for "which TKB does a read see", shared by
 * the directory and grid services so lookups and grids stay in lock-step.
 */
export function resolveReadTimetableId(
  requested: number | undefined,
  db?: Db
): number | null {
  if (requested !== undefined) {
    const exists = db ? timetableExists(requested, db) : timetableExists(requested);
    return exists ? requested : null;
  }
  const rows = db ? listActiveTimetableRows(db) : listActiveTimetableRows();
  return computeDefaultSelectedId(
    rows.map((r) => ({
      id: r.id,
      ordinal: 0,
      effectiveFrom: r.effectiveFrom,
      isActive: 1,
    }))
  );
}

/**
 * Service layer: returns active TKBs mapped to the shared contract plus the
 * default-selected id, validated against the shared schema.
 */
export function getActiveTimetables(db?: Db): ActiveTimetablesResponse {
  const rows = db ? listActiveTimetables(db) : listActiveTimetables();
  const items = rows.map((r) => ({
    id: r.id,
    ordinal: r.ordinal,
    effectiveFrom: toIsoDate(r.effectiveFrom),
  }));
  const defaultSelectedId = computeDefaultSelectedId(rows);
  return activeTimetablesResponseSchema.parse({ items, defaultSelectedId });
}

/**
 * Service layer: returns every timetable (active and inactive) mapped to the
 * admin contract and validated against the shared schema.
 */
export function listAdminTimetables(db?: Db): AdminTimetableListResponse {
  const rows = db ? listAllTimetables(db) : listAllTimetables();
  const items = rows.map((r) => ({
    id: r.id,
    ordinal: r.ordinal,
    effectiveFrom: toIsoDate(r.effectiveFrom),
    isActive: r.isActive === 1,
    createdAt: r.createdAt.toISOString(),
  }));
  return adminTimetableListResponseSchema.parse({ items });
}

/**
 * Service layer: sets a timetable's active state. Returns false when no
 * timetable with that id exists (caller maps to not-found).
 */
export function toggleTimetableActive(
  id: number,
  isActive: boolean,
  db?: Db
): boolean {
  return db
    ? setTimetableActive(id, isActive, db)
    : setTimetableActive(id, isActive);
}
