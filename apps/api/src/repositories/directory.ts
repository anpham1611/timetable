import { and, asc, eq, like, sql } from "drizzle-orm";
import { db as defaultDb, type Db } from "../db/index.js";
import { grade, schoolClass, student, teacher } from "../db/schema.js";

const SEARCH_LIMIT = 20;

export interface ClassRow {
  id: number;
  name: string;
  gradeId: number;
  gradeName: string;
}

/**
 * Repository: classes within one published TKB joined to their grade, ordered
 * by grade name then class name so the client can group/order the dropdown.
 */
export async function listClasses(
  timetableId: number,
  db: Db = defaultDb
): Promise<ClassRow[]> {
  return await db
    .select({
      id: schoolClass.id,
      name: schoolClass.name,
      gradeId: grade.id,
      gradeName: grade.name,
    })
    .from(schoolClass)
    .innerJoin(grade, eq(schoolClass.gradeId, grade.id))
    .where(eq(schoolClass.timetableId, timetableId))
    .orderBy(asc(grade.name), asc(schoolClass.name))
    .all();
}

export interface StudentRow {
  id: number;
  name: string;
  classId: number;
  className: string;
}

/**
 * Repository: students within one published TKB whose name matches `q`
 * (case-insensitive substring), joined to their class, capped at SEARCH_LIMIT.
 */
export async function searchStudents(
  q: string,
  timetableId: number,
  db: Db = defaultDb
): Promise<StudentRow[]> {
  const pattern = `%${q.toLowerCase()}%`;
  return await db
    .select({
      id: student.id,
      name: student.name,
      classId: schoolClass.id,
      className: schoolClass.name,
    })
    .from(student)
    .innerJoin(schoolClass, eq(student.classId, schoolClass.id))
    .where(
      and(
        eq(student.timetableId, timetableId),
        like(sql`lower(${student.name})`, pattern)
      )
    )
    .orderBy(asc(student.name))
    .limit(SEARCH_LIMIT)
    .all();
}

export interface TeacherRow {
  id: number;
  name: string;
}

/**
 * Repository: teachers within one published TKB whose name matches `q`
 * (case-insensitive substring), identity only, capped at SEARCH_LIMIT.
 */
export async function searchTeachers(
  q: string,
  timetableId: number,
  db: Db = defaultDb
): Promise<TeacherRow[]> {
  const pattern = `%${q.toLowerCase()}%`;
  return await db
    .select({ id: teacher.id, name: teacher.name })
    .from(teacher)
    .where(
      and(
        eq(teacher.timetableId, timetableId),
        like(sql`lower(${teacher.name})`, pattern)
      )
    )
    .orderBy(asc(teacher.name))
    .limit(SEARCH_LIMIT)
    .all();
}
