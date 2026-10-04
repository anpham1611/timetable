import { useQuery } from "@tanstack/react-query";
import {
  classListResponseSchema,
  type ClassListResponse,
} from "@timetable/shared";

async function fetchClasses(
  timetableId: number | null
): Promise<ClassListResponse> {
  const suffix = timetableId != null ? `?tkb=${timetableId}` : "";
  const res = await fetch(`/classes${suffix}`);
  if (!res.ok) {
    throw new Error(`Classes request failed: ${res.status}`);
  }
  return classListResponseSchema.parse(await res.json());
}

/** Classes for the selected published TKB (null → server default active TKB). */
export function useClasses(timetableId: number | null = null) {
  return useQuery({
    queryKey: ["directory", "classes", timetableId],
    queryFn: () => fetchClasses(timetableId),
  });
}
