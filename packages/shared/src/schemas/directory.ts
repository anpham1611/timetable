import { z } from "zod";

/** A grade (khối), e.g. "11" or "12". */
export const gradeRefSchema = z.object({
  id: z.number().int(),
  name: z.string().min(1),
});

export type GradeRef = z.infer<typeof gradeRefSchema>;

/** A class (lớp) belonging to exactly one grade, e.g. "11A". */
export const classItemSchema = z.object({
  id: z.number().int(),
  name: z.string().min(1),
  grade: gradeRefSchema,
});

export type ClassItem = z.infer<typeof classItemSchema>;

/**
 * Contract for the GET /classes endpoint — every class with its grade so the
 * client can group or order the dropdown by grade.
 */
export const classListResponseSchema = z.object({
  items: z.array(classItemSchema),
});

export type ClassListResponse = z.infer<typeof classListResponseSchema>;

/** Minimal class reference attached to a student for disambiguation. */
export const classRefSchema = z.object({
  id: z.number().int(),
  name: z.string().min(1),
});

export type ClassRef = z.infer<typeof classRefSchema>;

/** A student (học sinh) belonging to exactly one class. */
export const studentItemSchema = z.object({
  id: z.number().int(),
  name: z.string().min(1),
  class: classRefSchema,
});

export type StudentItem = z.infer<typeof studentItemSchema>;

/** Contract for the GET /students?q= search endpoint. */
export const studentSearchResponseSchema = z.object({
  items: z.array(studentItemSchema),
});

export type StudentSearchResponse = z.infer<typeof studentSearchResponseSchema>;

/** A teacher (giáo viên), identity only — independent of the classes taught. */
export const teacherItemSchema = z.object({
  id: z.number().int(),
  name: z.string().min(1),
});

export type TeacherItem = z.infer<typeof teacherItemSchema>;

/** Contract for the GET /teachers?q= search endpoint. */
export const teacherSearchResponseSchema = z.object({
  items: z.array(teacherItemSchema),
});

export type TeacherSearchResponse = z.infer<typeof teacherSearchResponseSchema>;

/**
 * A directory search query. Must be a non-empty, non-whitespace string; an
 * empty or missing query is rejected so callers return an empty list rather
 * than the full roster.
 */
export const searchQuerySchema = z
  .string()
  .trim()
  .min(1, "query must not be empty");

export type SearchQuery = z.infer<typeof searchQuerySchema>;
