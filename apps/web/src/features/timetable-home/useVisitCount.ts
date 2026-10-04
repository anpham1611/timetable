import { useQuery } from "@tanstack/react-query";
import { visitCountResponseSchema, type VisitCountResponse } from "@timetable/shared";

/**
 * Module-level latch so the visit is counted once per real page load, even
 * though React 19 StrictMode double-invokes effects/queries in development.
 * Reset only on a full page reload (module re-evaluation).
 */
let visitRecorded = false;
let inFlight: Promise<VisitCountResponse> | null = null;

async function recordVisit(): Promise<VisitCountResponse> {
  if (visitRecorded && inFlight) {
    return inFlight;
  }
  visitRecorded = true;
  inFlight = (async () => {
    const res = await fetch("/visits", { method: "POST" });
    if (!res.ok) {
      throw new Error(`Visit request failed: ${res.status}`);
    }
    return visitCountResponseSchema.parse(await res.json());
  })();
  return inFlight;
}

/** For tests: reset the once-per-load latch. */
export function resetVisitLatch(): void {
  visitRecorded = false;
  inFlight = null;
}

export function useVisitCount() {
  return useQuery({
    queryKey: ["visit-count"],
    queryFn: recordVisit,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}
