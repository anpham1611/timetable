import { healthResponseSchema, type HealthResponse } from "@timetable/shared";
import { pingDatabase } from "../repositories/health.js";

/**
 * Service layer: business logic. Calls repositories, never the DB directly.
 */
export async function getHealth(): Promise<HealthResponse> {
  const dbOk = await pingDatabase();
  if (!dbOk) {
    throw new Error("Database health check failed");
  }
  return healthResponseSchema.parse({ status: "ok" });
}
