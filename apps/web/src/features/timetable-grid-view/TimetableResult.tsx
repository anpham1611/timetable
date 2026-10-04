import { Button } from "@/components/ui/button";
import { TimetableGrid } from "./TimetableGrid.js";
import { GridNotFoundError, useGrid, type GridKind } from "./useGrid.js";

export interface TimetableResultProps {
  kind: GridKind;
  id: number | null;
  /** Published TKB to resolve; null uses the server's default active TKB. */
  timetableId?: number | null;
}

/**
 * Result area for a lookup selection: fetches the resolved grid for the current
 * class/student/teacher within the selected TKB and renders it, with loading
 * and not-found states. When no selection is made yet, renders nothing.
 */
export function TimetableResult({ kind, id, timetableId = null }: TimetableResultProps) {
  const { data, isLoading, isError, error } = useGrid(kind, id, timetableId);

  if (id === null) return null;

  if (isLoading) {
    return (
      <p className="mt-4 text-sm text-muted-foreground" role="status">
        Đang tải thời khóa biểu…
      </p>
    );
  }

  if (isError) {
    const message =
      error instanceof GridNotFoundError
        ? "Không tìm thấy thời khóa biểu."
        : "Không tải được thời khóa biểu.";
    return (
      <p className="mt-4 text-sm text-destructive" role="alert">
        {message}
      </p>
    );
  }

  if (!data) return null;

  return (
    <div>
      <div className="mt-4 flex justify-end print:hidden">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => window.print()}
        >
          In
        </Button>
      </div>
      <TimetableGrid grid={data} />
    </div>
  );
}
