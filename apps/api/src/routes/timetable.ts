import type { FastifyInstance } from "fastify";
import { getActiveTimetables } from "../services/timetable.js";

/**
 * Route layer: HTTP only. Calls services, never repositories directly.
 * GET /timetables/active lists active TKBs plus the default-selected id.
 */
export async function timetableRoutes(app: FastifyInstance): Promise<void> {
  app.get("/timetables/active", async () => {
    return getActiveTimetables();
  });
}
