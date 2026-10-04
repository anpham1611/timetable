import { randomBytes } from "node:crypto";

/**
 * In-memory admin session store. Sessions live only in the API process: a
 * restart clears them (admins simply log in again), which matches the
 * "until logout or browser session ends" lifetime and keeps the admin tool
 * dependency-free. Tokens are opaque, cryptographically random, and carry no
 * meaning to the client.
 */
const sessions = new Set<string>();

/** Create a new admin session and return its opaque token. */
export function createSession(): string {
  const token = randomBytes(32).toString("hex");
  sessions.add(token);
  return token;
}

/** Whether the given token identifies a live admin session. */
export function isValidSession(token: string): boolean {
  return sessions.has(token);
}

/** End the session identified by the token, if any. Idempotent. */
export function revokeSession(token: string): void {
  sessions.delete(token);
}

/** Clear every session. Intended for test isolation. */
export function clearSessions(): void {
  sessions.clear();
}
