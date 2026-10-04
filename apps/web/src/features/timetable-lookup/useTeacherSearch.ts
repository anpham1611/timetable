import { useQuery } from "@tanstack/react-query";
import {
  teacherSearchResponseSchema,
  type TeacherSearchResponse,
} from "@timetable/shared";

async function fetchTeachers(
  q: string,
  timetableId: number | null
): Promise<TeacherSearchResponse> {
  const tkb = timetableId != null ? `&tkb=${timetableId}` : "";
  const res = await fetch(`/teachers?q=${encodeURIComponent(q)}${tkb}`);
  if (!res.ok) {
    throw new Error(`Teacher search failed: ${res.status}`);
  }
  return teacherSearchResponseSchema.parse(await res.json());
}

/**
 * Searches teachers by name within the selected published TKB (null → server
 * default active TKB). Disabled (no request) while the query is empty.
 */
export function useTeacherSearch(q: string, timetableId: number | null = null) {
  const query = q.trim();
  return useQuery({
    queryKey: ["directory", "teachers", query, timetableId],
    queryFn: () => fetchTeachers(query, timetableId),
    enabled: query.length > 0,
  });
}
