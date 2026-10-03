import type { ReactNode } from "react";
import { Footer } from "./Footer.js";

/**
 * Application shell that renders route content followed by the app-wide footer,
 * so the footer appears on every view exactly once.
 */
export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
