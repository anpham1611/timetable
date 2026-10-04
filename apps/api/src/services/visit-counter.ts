import { visitCountResponseSchema, type VisitCountResponse } from "@timetable/shared";
import type { Db } from "../db/index.js";
import { incrementVisitCount } from "../repositories/visit-counter.js";

/**
 * Service layer: business logic. Calls repositories, never the DB directly.
 * Records a single home-page visit and returns the new validated total.
 */
export function recordVisit(db?: Db): VisitCountResponse {
  const count = db ? incrementVisitCount(db) : incrementVisitCount();
  return visitCountResponseSchema.parse({ count });
}
