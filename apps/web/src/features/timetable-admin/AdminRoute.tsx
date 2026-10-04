import { useState } from "react";
import { hasSession } from "./adminSession.js";
import { LoginForm } from "./LoginForm.js";
import { TimetableAdminPage } from "./TimetableAdminPage.js";

/**
 * Route guard for the admin area. Renders the login form until an admin session
 * exists, then the admin management page. Logging in or out flips `loggedIn`,
 * which swaps the rendered view without a full navigation.
 */
export function AdminRoute() {
  const [loggedIn, setLoggedIn] = useState<boolean>(() => hasSession());

  if (!loggedIn) {
    return <LoginForm onSuccess={() => setLoggedIn(true)} />;
  }
  return <TimetableAdminPage onLogout={() => setLoggedIn(false)} />;
}
