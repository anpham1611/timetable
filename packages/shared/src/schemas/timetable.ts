import { z } from "zod";

/**
 * Contract for an active published timetable (TKB) as shown on the home view.
 * `effectiveFrom` is an ISO date string (YYYY-MM-DD); the web layer formats it
 * as dd/mm/yyyy. `ordinal` is the display number {n} in "TKB {n} - ...".
 */
export const activeTimetableSchema = z.object({
  id: z.number().int(),
  ordinal: z.number().int(),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD"),
});

export type ActiveTimetable = z.infer<typeof activeTimetableSchema>;

/**
 * Contract for the GET /timetables/active endpoint.
 * `defaultSelectedId` is the TKB to highlight by default, or null when empty.
 */
export const activeTimetablesResponseSchema = z.object({
  items: z.array(activeTimetableSchema),
  defaultSelectedId: z.number().int().nullable(),
});

export type ActiveTimetablesResponse = z.infer<typeof activeTimetablesResponseSchema>;
