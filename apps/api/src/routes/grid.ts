import type { FastifyInstance, FastifyReply } from "fastify";
import {
  resolveClassGrid,
  resolveStudentGrid,
  resolveTeacherGrid,
} from "../services/grid.js";

interface IdParams {
  id: string;
}

interface TkbQuery {
  tkb?: string;
}

/** Parse a positive integer id or return null for an invalid param. */
function parseId(raw: string): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/** Parse an optional ?tkb= query into a timetable id, or undefined when absent. */
function parseTkb(raw: string | undefined): number | undefined {
  if (raw === undefined || raw === "") return undefined;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : undefined;
}

function notFound(reply: FastifyReply, what: string) {
  return reply.code(404).send({ error: `${what} not found` });
}

/**
 * Route layer: HTTP only, delegates to the grid services. Resolves a weekly
 * timetable grid for a class, a student, or a teacher within a published TKB
 * (optional `?tkb=` selects it; omitted → default active TKB). A null service
 * result (unknown id or no resolvable timetable) maps to 404.
 */
export async function gridRoutes(app: FastifyInstance): Promise<void> {
  app.get<{ Params: IdParams; Querystring: TkbQuery }>(
    "/grids/class/:id",
    async (req, reply) => {
      const id = parseId(req.params.id);
      if (id === null) return notFound(reply, "class");
      const grid = resolveClassGrid(id, parseTkb(req.query.tkb));
      if (!grid) return notFound(reply, "class");
      return grid;
    }
  );

  app.get<{ Params: IdParams; Querystring: TkbQuery }>(
    "/grids/student/:id",
    async (req, reply) => {
      const id = parseId(req.params.id);
      if (id === null) return notFound(reply, "student");
      const grid = resolveStudentGrid(id, parseTkb(req.query.tkb));
      if (!grid) return notFound(reply, "student");
      return grid;
    }
  );

  app.get<{ Params: IdParams; Querystring: TkbQuery }>(
    "/grids/teacher/:id",
    async (req, reply) => {
      const id = parseId(req.params.id);
      if (id === null) return notFound(reply, "teacher");
      const grid = resolveTeacherGrid(id, parseTkb(req.query.tkb));
      if (!grid) return notFound(reply, "teacher");
      return grid;
    }
  );
}
