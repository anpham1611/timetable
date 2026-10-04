import { useQuery } from "@tanstack/react-query";
import {
  studentSearchResponseSchema,
  type StudentSearchResponse,
} from "@timetable/shared";

async function fetchStudents(
  q: string,
  timetableId: number | null
): Promise<StudentSearchResponse> {
  const tkb = timetableId != null ? `&tkb=${timetableId}` : "";
  const res = await fetch(`/students?q=${encodeURIComponent(q)}${tkb}`);
  if (!res.ok) {
    throw new Error(`Student search failed: ${res.status}`);
  }
  return studentSearchResponseSchema.parse(await res.json());
}

/**
 * Searches students by name within the selected published TKB (null → server
 * default active TKB). Disabled (no request) while the query is empty.
 */
export function useStudentSearch(q: string, timetableId: number | null = null) {
  const query = q.trim();
  return useQuery({
    queryKey: ["directory", "students", query, timetableId],
    queryFn: () => fetchStudents(query, timetableId),
    enabled: query.length > 0,
  });
}
