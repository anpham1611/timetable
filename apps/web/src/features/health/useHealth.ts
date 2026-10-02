import { useQuery } from "@tanstack/react-query";
import { healthResponseSchema, type HealthResponse } from "@timetable/shared";

async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch("/health");
  if (!res.ok) {
    throw new Error(`Health request failed: ${res.status}`);
  }
  // Validate the response against the shared contract.
  return healthResponseSchema.parse(await res.json());
}

export function useHealth() {
  return useQuery({
    queryKey: ["health"],
    queryFn: fetchHealth,
  });
}
