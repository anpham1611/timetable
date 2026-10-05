import {
  classListResponseSchema,
  studentSearchResponseSchema,
  teacherSearchResponseSchema,
  searchQuerySchema,
  type ClassListResponse,
  type StudentSearchResponse,
  type TeacherSearchResponse,
} from "@timetable/shared";
import type { Db } from "../db/index.js";
import {
  listClasses,
  searchStudents,
  searchTeachers,
} from "../repositories/directory.js";
import { resolveReadTimetableId } from "./timetable.js";

/**
 * Service: classes within the active/selected TKB mapped to the shared
 * contract, validated. `timetableId` selects the TKB; omit it to use the
 * default active TKB. Returns an empty list (not an error) when there are no
 * classes or no timetable can be resolved.
 */
export async function getClasses(
  timetableId?: number,
  db?: Db
): Promise<ClassListResponse> {
  const tkb = await resolveReadTimetableId(timetableId, db);
  if (tkb === null) return classListResponseSchema.parse({ items: [] });
  const rows = db ? await listClasses(tkb, db) : await listClasses(tkb);
  const items = rows.map((r) => ({
    id: r.id,
    name: r.name,
    grade: { id: r.gradeId, name: r.gradeName },
  }));
  return classListResponseSchema.parse({ items });
}

/**
 * Service: students within the active/selected TKB matching `q`. An
 * empty/whitespace query yields an empty list rather than the full roster (the
 * schema rejects the empty query), as does an unresolvable timetable.
 */
export async function getStudents(
  q: string,
  timetableId?: number,
  db?: Db
): Promise<StudentSearchResponse> {
  const parsed = searchQuerySchema.safeParse(q);
  const tkb = await resolveReadTimetableId(timetableId, db);
  if (!parsed.success || tkb === null) {
    return studentSearchResponseSchema.parse({ items: [] });
  }
  const rows = db
    ? await searchStudents(parsed.data, tkb, db)
    : await searchStudents(parsed.data, tkb);
  const items = rows.map((r) => ({
    id: r.id,
    name: r.name,
    class: { id: r.classId, name: r.className },
  }));
  return studentSearchResponseSchema.parse({ items });
}

/**
 * Service: teachers within the active/selected TKB matching `q`, identity only.
 * Empty query or unresolvable timetable → empty list.
 */
export async function getTeachers(
  q: string,
  timetableId?: number,
  db?: Db
): Promise<TeacherSearchResponse> {
  const parsed = searchQuerySchema.safeParse(q);
  const tkb = await resolveReadTimetableId(timetableId, db);
  if (!parsed.success || tkb === null) {
    return teacherSearchResponseSchema.parse({ items: [] });
  }
  const rows = db
    ? await searchTeachers(parsed.data, tkb, db)
    : await searchTeachers(parsed.data, tkb);
  const items = rows.map((r) => ({ id: r.id, name: r.name }));
  return teacherSearchResponseSchema.parse({ items });
}
