import type { FastifyReply, FastifyRequest } from "fastify";
import { getAdminCredentials } from "../config.js";
import { isValidSession } from "./session.js";

/** The request header carrying the admin session token (Bearer scheme). */
export const AUTHORIZATION_HEADER = "authorization";

/** Extract a Bearer token from an Authorization header value, or null. */
export function parseBearerToken(
  raw: string | string[] | undefined
): string | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return null;
  const match = /^Bearer\s+(.+)$/i.exec(value.trim());
  return match ? match[1].trim() : null;
}

/**
 * Fastify preHandler gating admin routes. Rejects with 401 when admin
 * credentials are unset (fail closed), when the request omits a Bearer token,
 * or when the token does not identify a live session. On success it stashes the
 * token on the request (for logout) and proceeds.
 */
export async function requireAdmin(
  req: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  if (!getAdminCredentials()) {
    await reply.code(401).send({ error: "admin access not configured" });
    return;
  }
  const token = parseBearerToken(req.headers[AUTHORIZATION_HEADER]);
  if (!token || !isValidSession(token)) {
    await reply.code(401).send({ error: "unauthorized" });
    return;
  }
  (req as FastifyRequest & { adminSessionToken?: string }).adminSessionToken =
    token;
}
