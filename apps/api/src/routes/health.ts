import type { FastifyInstance } from "fastify";
import { getHealth } from "../services/health.js";

/**
 * Route layer: HTTP only. Calls services, never repositories directly.
 */
export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get("/health", async () => {
    return await getHealth();
  });
}
