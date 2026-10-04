import { useQuery } from "@tanstack/react-query";
import {
  activeTimetablesResponseSchema,
  type ActiveTimetablesResponse,
} from "@timetable/shared";

async function fetchActiveTimetables(): Promise<ActiveTimetablesResponse> {
  const res = await fetch("/timetables/active");
  if (!res.ok) {
    throw new Error(`Timetable request failed: ${res.status}`);
  }
  return activeTimetablesResponseSchema.parse(await res.json());
}

export function useActiveTimetables() {
  return useQuery({
    queryKey: ["timetables", "active"],
    queryFn: fetchActiveTimetables,
  });
}
