import { z } from "zod";

/**
 * Contract for a single timetable (TKB) as shown on the admin management page.
 * Unlike the public active-timetables contract, this includes inactive TKBs and
 * exposes `isActive` and `createdAt` so an admin can see and toggle state.
 * `effectiveFrom` and `createdAt` are ISO strings.
 */
export const adminTimetableSchema = z.object({
  id: z.number().int(),
  ordinal: z.number().int(),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD"),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
});

export type AdminTimetable = z.infer<typeof adminTimetableSchema>;

/**
 * Contract for the admin "list all timetables" endpoint: every TKB regardless
 * of active state, in a deterministic order.
 */
export const adminTimetableListResponseSchema = z.object({
  items: z.array(adminTimetableSchema),
});

export type AdminTimetableListResponse = z.infer<
  typeof adminTimetableListResponseSchema
>;

/** Request body for toggling a timetable's active state. */
export const toggleTimetableRequestSchema = z.object({
  isActive: z.boolean(),
});

export type ToggleTimetableRequest = z.infer<
  typeof toggleTimetableRequestSchema
>;

/**
 * Result summary returned by a successful Excel import: the id of the newly
 * created (inactive) timetable plus counts of what was imported, so the admin
 * can confirm the outcome.
 */
export const importResultSchema = z.object({
  timetableId: z.number().int(),
  lessonsCreated: z.number().int().nonnegative(),
  gradesCreated: z.number().int().nonnegative(),
  classesCreated: z.number().int().nonnegative(),
  subjectsCreated: z.number().int().nonnegative(),
  teachersCreated: z.number().int().nonnegative(),
  roomsCreated: z.number().int().nonnegative(),
  studentsCreated: z.number().int().nonnegative(),
});

export type ImportResult = z.infer<typeof importResultSchema>;

/**
 * A located import validation error: identifies exactly where in the workbook
 * the problem is so the admin can fix it. `sheet` names the offending sheet,
 * `row` is the 1-based row number (omitted for sheet/structure-level errors),
 * `column` names the offending column when applicable, and `message` describes
 * the problem.
 */
export const importErrorSchema = z.object({
  sheet: z.string(),
  row: z.number().int().positive().optional(),
  column: z.string().optional(),
  message: z.string().min(1),
});

export type ImportError = z.infer<typeof importErrorSchema>;

/** The HTTP 400 body returned when an import is rejected by validation. */
export const importErrorResponseSchema = z.object({
  error: importErrorSchema,
});

export type ImportErrorResponse = z.infer<typeof importErrorResponseSchema>;
