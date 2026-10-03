/**
 * Placeholder administrator contact address used when `VITE_ADMIN_EMAIL`
 * is not configured, so the footer's "Quản trị" link never renders broken.
 */
export const ADMIN_EMAIL_PLACEHOLDER = "daotao@example.edu.vn";

/**
 * Resolves the administrator (phòng đào tạo) contact email for the footer.
 * Reads `VITE_ADMIN_EMAIL` from the build-time env and falls back to a
 * documented placeholder when it is unset or empty.
 */
export function getAdminEmail(): string {
  const configured = import.meta.env.VITE_ADMIN_EMAIL?.trim();
  return configured ? configured : ADMIN_EMAIL_PLACEHOLDER;
}
