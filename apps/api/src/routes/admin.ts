import { timingSafeEqual } from "node:crypto";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { loginRequestSchema, toggleTimetableRequestSchema } from "@timetable/shared";
import type { Db } from "../db/index.js";
import { getAdminCredentials } from "../config.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import {
  createSession,
  revokeSession,
} from "../middleware/session.js";
import {
  listAdminTimetables,
  toggleTimetableActive,
} from "../services/timetable.js";
import { buildTemplateWorkbook } from "../services/import-template.js";
import { importTimetable } from "../services/import.js";
import { ImportParseError } from "../services/import-parser.js";

const XLSX_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

interface IdParams {
  id: string;
}

/** Parse a positive integer id or return null for an invalid param. */
function parseId(raw: string): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function notFound(reply: FastifyReply, what: string) {
  return reply.code(404).send({ error: `${what} not found` });
}

/** Constant-time string comparison that is safe for mismatched lengths. */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/**
 * Admin routes. The `/login` route is open so an admin can obtain a session by
 * submitting the configured username and password. Every other admin route is
 * gated by {@link requireAdmin} via a preHandler on an encapsulated child
 * scope, so a missing/invalid session (or unconfigured credentials) is rejected
 * before any handler runs.
 *
 * Mounted under the `/admin` prefix in `buildServer`. An optional `db` is
 * threaded through for tests; when omitted the services use the default db.
 */
export async function adminRoutes(
  app: FastifyInstance,
  opts: { db?: Db }
): Promise<void> {
  const { db } = opts;

  // Open: verify credentials and issue a session token. Fails closed (401)
  // when credentials are unconfigured or do not match.
  app.post("/login", async (req, reply) => {
    const parsed = loginRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "invalid request body" });
    }
    const configured = getAdminCredentials();
    if (!configured) {
      return reply.code(401).send({ error: "admin access not configured" });
    }
    const okUser = safeEqual(parsed.data.username, configured.username);
    const okPass = safeEqual(parsed.data.password, configured.password);
    if (!okUser || !okPass) {
      return reply.code(401).send({ error: "unauthorized" });
    }
    return reply.send({ token: createSession() });
  });

  // Everything below is gated by a valid admin session.
  await app.register(async (gated) => {
    gated.addHook("preHandler", requireAdmin);

    // End the caller's session. Always 204 (idempotent).
    gated.post("/logout", async (req, reply) => {
      const token = (
        req as FastifyRequest & { adminSessionToken?: string }
      ).adminSessionToken;
      if (token) revokeSession(token);
      return reply.code(204).send();
    });

    // List every timetable (active and inactive) for the management page.
    gated.get("/timetables", async () => listAdminTimetables(db));

    // Set a timetable's active state. 404 when the id does not exist.
    gated.patch<{ Params: IdParams }>(
      "/timetables/:id/active",
      async (req, reply) => {
        const id = parseId(req.params.id);
        if (id === null) return notFound(reply, "timetable");
        const parsed = toggleTimetableRequestSchema.safeParse(req.body);
        if (!parsed.success) {
          return reply.code(400).send({ error: "invalid request body" });
        }
        const ok = await toggleTimetableActive(id, parsed.data.isActive, db);
        if (!ok) return notFound(reply, "timetable");
        return { id, isActive: parsed.data.isActive };
      }
    );

    // Download the Excel import template matching the importer's expected shape.
    gated.get("/import/template", async (_req, reply) => {
      const buffer = await buildTemplateWorkbook();
      return reply
        .header("content-type", XLSX_CONTENT_TYPE)
        .header(
          "content-disposition",
          'attachment; filename="timetable-import-template.xlsx"'
        )
        .send(buffer);
    });

    // Import an uploaded .xlsx as a new (inactive) timetable. 400 on a bad file.
    gated.post("/import", async (req, reply) => {
      const file = await req.file();
      if (!file) {
        return reply.code(400).send({ error: "missing uploaded file" });
      }
      const buffer = await file.toBuffer();
      try {
        const result = await importTimetable(buffer, db);
        return reply.code(201).send(result);
      } catch (err) {
        if (err instanceof ImportParseError) {
          // Structured, located error: { error: { sheet, row?, column?, message } }
          return reply.code(400).send({ error: err.detail });
        }
        throw err;
      }
    });
  });
}
