import { useQuery } from "@tanstack/react-query";
import { weekGridSchema, type WeekGrid } from "@timetable/shared";

export type GridKind = "class" | "student" | "teacher";

/** Thrown when the API responds 404 so the UI can show a not-found message. */
export class GridNotFoundError extends Error {
  constructor(kind: GridKind, id: number) {
    super(`${kind} ${id} not found`);
    this.name = "GridNotFoundError";
  }
}

async function fetchGrid(
  kind: GridKind,
  id: number,
  timetableId: number | null
): Promise<WeekGrid> {
  const query = timetableId != null ? `?tkb=${timetableId}` : "";
  const res = await fetch(`/grids/${kind}/${id}${query}`);
  if (res.status === 404) {
    throw new GridNotFoundError(kind, id);
  }
  if (!res.ok) {
    throw new Error(`Grid request failed: ${res.status}`);
  }
  return weekGridSchema.parse(await res.json());
}

/**
 * Fetches the resolved weekly grid for a class/student/teacher selection within
 * a published TKB. `timetableId` selects the TKB (null → the server's default
 * active TKB). Disabled until an id is supplied. A 404 surfaces as a
 * GridNotFoundError.
 */
export function useGrid(
  kind: GridKind,
  id: number | null,
  timetableId: number | null = null
) {
  return useQuery({
    queryKey: ["grid", kind, id, timetableId],
    queryFn: () => fetchGrid(kind, id as number, timetableId),
    enabled: id !== null,
    retry: false,
  });
}
