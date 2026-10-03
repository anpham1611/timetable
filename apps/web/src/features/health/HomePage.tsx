import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { HealthStatus } from "./HealthStatus.js";

export function HomePage() {
  return (
    <main className="mx-auto max-w-md p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Timetable</h1>
        <ThemeToggle />
      </div>
      <p className="mt-2 text-muted-foreground">Scaffold is wired up.</p>
      <div className="mt-4">
        <HealthStatus />
      </div>
    </main>
  );
}
