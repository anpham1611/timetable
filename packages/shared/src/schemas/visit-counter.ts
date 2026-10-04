import { z } from "zod";

/**
 * Contract for the POST /visits endpoint (and visit-count reads).
 * The count is a single global, non-negative integer tally of home-page visits.
 */
export const visitCountResponseSchema = z.object({
  count: z.number().int().nonnegative(),
});

export type VisitCountResponse = z.infer<typeof visitCountResponseSchema>;
