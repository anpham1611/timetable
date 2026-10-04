/**
 * Admin session token handling for the web client.
 *
 * On successful login the API returns an opaque session token. We hold it in
 * `sessionStorage` so it survives in-tab navigation but is cleared when the
 * browser session ends (closing the tab/browser) — there is no persistence
 * across restarts and no "remember me". The token is sent on admin requests as
 * an `authorization: Bearer` header. The admin password is never stored or
 * shipped in the build.
 */
const STORAGE_KEY = "admin-session-token";

/** The current session token, or null when the admin is not logged in. */
export function getSessionToken(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Persist the session token for the current browser session. */
export function setSessionToken(token: string): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, token);
  } catch {
    /* ignore storage failures (e.g. private mode) */
  }
}

/** Remove the session token (logout / rejected session). */
export function clearSessionToken(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** Whether an admin session token is currently present. */
export function hasSession(): boolean {
  return getSessionToken() !== null;
}

/**
 * Build the Authorization header for admin requests. Returns an empty object
 * when there is no session, so the API rejects the request as unauthorized.
 */
export function authHeaders(): Record<string, string> {
  const token = getSessionToken();
  return token ? { authorization: `Bearer ${token}` } : {};
}
