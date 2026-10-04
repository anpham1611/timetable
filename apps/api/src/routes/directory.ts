import type { FastifyInstance } from "fastify";
import {
  getClasses,
  getStudents,
  getTeachers,
} from "../services/directory.js";

interface SearchQuerystring {
  q?: string;
  tkb?: string;
}

interface ClassesQuerystring {
  tkb?: string;
}

/** Parse an optional ?tkb= query into a timetable id, or undefined when absent. */
function parseTkb(raw: string | undefined): number | undefined {
  if (raw === undefined || raw === "") return undefined;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : undefined;
}

/**
 * Route layer: HTTP only, delegates to services. Exposes the school-directory
 * read endpoints that feed the lookup selectors. An optional `?tkb=` selects
 * the published timetable whose directory snapshot is read; omitted → the
 * default active TKB.
 */
export async function directoryRoutes(app: FastifyInstance): Promise<void> {
  app.get<{ Querystring: ClassesQuerystring }>("/classes", async (req) => {
    return getClasses(parseTkb(req.query.tkb));
  });

  app.get<{ Querystring: SearchQuerystring }>("/students", async (req) => {
    return getStudents(req.query.q ?? "", parseTkb(req.query.tkb));
  });

  app.get<{ Querystring: SearchQuerystring }>("/teachers", async (req) => {
    return getTeachers(req.query.q ?? "", parseTkb(req.query.tkb));
  });
}
