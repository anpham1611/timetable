import type { FastifyInstance } from "fastify";
import { recordVisit } from "../services/visit-counter.js";

/**
 * Route layer: HTTP only. Calls services, never repositories directly.
 * POST /visits records one home-page visit and returns the new total.
 */
export async function visitRoutes(app: FastifyInstance): Promise<void> {
  app.post("/visits", async () => {
    return recordVisit();
  });
}
