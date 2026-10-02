import { HealthStatus } from "./HealthStatus.js";

export function HomePage() {
  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-bold">Timetable</h1>
      <p className="mt-2 text-slate-600">Scaffold is wired up.</p>
      <div className="mt-4">
        <HealthStatus />
      </div>
    </main>
  );
}
