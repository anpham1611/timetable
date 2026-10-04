import { z } from "zod";

/**
 * Resolved weekly timetable grid contract, shared by the by-class, by-student,
 * and by-teacher resolve endpoints. The grid is a fixed recurring weekly
 * pattern: six days (Thứ 2..Thứ 7, encoded 2..7), two sessions (SANG/CHIEU),
 * five ordered periods each. Every (day, session, period) slot is present; an
 * empty slot has `cell: null`.
 */

/** Session identifier: morning (SÁNG) or afternoon (CHIỀU). */
export const gridSessionSchema = z.enum(["SANG", "CHIEU"]);
export type GridSession = z.infer<typeof gridSessionSchema>;

/** The six grid days encoded as Thứ numbers (Thứ 2 = 2 .. Thứ 7 = 7). */
export const gridDaySchema = z.union([
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
  z.literal(7),
]);
export type GridDay = z.infer<typeof gridDaySchema>;

/** A period axis entry: its session, ordinal 1..5, and optional display time. */
export const gridPeriodSchema = z.object({
  id: z.number().int(),
  session: gridSessionSchema,
  ordinal: z.number().int().min(1).max(5),
  startTime: z.string().nullable(),
  endTime: z.string().nullable(),
});
export type GridPeriod = z.infer<typeof gridPeriodSchema>;

/**
 * A single rendered cell. One unified shape covers all three views; a field is
 * present only when the view/lesson populates it:
 * - `subjectName` / `subjectShortCode`: always present on a non-empty cell.
 * - `teachers`: teacher short codes (class/student views).
 * - `className`: the class taught (teacher view).
 * - `room` + `isRoomMove`: a lesson taught outside the class's home room.
 * - `choiceGroup`: an elective's label (e.g. "Tự chọn (TC1)").
 * - `category`: an optional cell category used for coloring.
 */
export const gridCellSchema = z.object({
  subjectName: z.string().min(1),
  subjectShortCode: z.string().min(1),
  teachers: z.array(z.string().min(1)).default([]),
  className: z.string().min(1).nullable().default(null),
  room: z.string().min(1).nullable().default(null),
  isRoomMove: z.boolean().default(false),
  choiceGroup: z.string().min(1).nullable().default(null),
  category: z.number().int().nullable().default(null),
});
export type GridCell = z.infer<typeof gridCellSchema>;

/** One slot: a (day, period) coordinate carrying a cell or null when empty. */
export const gridSlotSchema = z.object({
  day: gridDaySchema,
  periodId: z.number().int(),
  cell: gridCellSchema.nullable(),
});
export type GridSlot = z.infer<typeof gridSlotSchema>;

/** The full resolved grid: axes plus every slot. */
export const weekGridSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().nullable().default(null),
  /** The published TKB this grid was resolved from. */
  timetableId: z.number().int(),
  days: z.array(gridDaySchema),
  periods: z.array(gridPeriodSchema),
  slots: z.array(gridSlotSchema),
});
export type WeekGrid = z.infer<typeof weekGridSchema>;
