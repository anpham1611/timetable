/**
 * Centralised access to the admin credentials used to gate admin routes.
 *
 * The username and password are read from the `ADMIN_USERNAME` and
 * `ADMIN_PASSWORD` environment variables. When either is unset or empty (after
 * trimming), {@link getAdminCredentials} returns `undefined` so admin login can
 * fail closed — an unconfigured deploy rejects every login (and therefore every
 * admin request) rather than defaulting to open access.
 */
export interface AdminCredentials {
  username: string;
  password: string;
}

export function getAdminCredentials(): AdminCredentials | undefined {
  const username = process.env.ADMIN_USERNAME?.trim();
  const password = process.env.ADMIN_PASSWORD?.trim();
  if (!username || !password) return undefined;
  return { username, password };
}
