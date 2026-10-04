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
export function getClasses(timetableId?: number, db?: Db): ClassListResponse {
  const tkb = resolveReadTimetableId(timetableId, db);
  if (tkb === null) return classListResponseSchema.parse({ items: [] });
  const rows = db ? listClasses(tkb, db) : listClasses(tkb);
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
export function getStudents(
  q: string,
  timetableId?: number,
  db?: Db
): StudentSearchResponse {
  const parsed = searchQuerySchema.safeParse(q);
  const tkb = resolveReadTimetableId(timetableId, db);
  if (!parsed.success || tkb === null) {
    return studentSearchResponseSchema.parse({ items: [] });
  }
  const rows = db
    ? searchStudents(parsed.data, tkb, db)
    : searchStudents(parsed.data, tkb);
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
export function getTeachers(
  q: string,
  timetableId?: number,
  db?: Db
): TeacherSearchResponse {
  const parsed = searchQuerySchema.safeParse(q);
  const tkb = resolveReadTimetableId(timetableId, db);
  if (!parsed.success || tkb === null) {
    return teacherSearchResponseSchema.parse({ items: [] });
  }
  const rows = db
    ? searchTeachers(parsed.data, tkb, db)
    : searchTeachers(parsed.data, tkb);
  const items = rows.map((r) => ({ id: r.id, name: r.name }));
  return teacherSearchResponseSchema.parse({ items });
}
