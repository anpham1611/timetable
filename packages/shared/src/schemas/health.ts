import { z } from "zod";

/**
 * Contract for the GET /health endpoint.
 * Source of truth shared by both api (response) and web (query).
 */
export const healthResponseSchema = z.object({
  status: z.literal("ok"),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
