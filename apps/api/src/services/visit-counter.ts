import { visitCountResponseSchema, type VisitCountResponse } from "@timetable/shared";
import type { Db } from "../db/index.js";
import { incrementVisitCount } from "../repositories/visit-counter.js";

/**
 * Service layer: business logic. Calls repositories, never the DB directly.
 * Records a single home-page visit and returns the new validated total.
 */
export async function recordVisit(db?: Db): Promise<VisitCountResponse> {
  const count = db ? await incrementVisitCount(db) : await incrementVisitCount();
  return visitCountResponseSchema.parse({ count });
}
