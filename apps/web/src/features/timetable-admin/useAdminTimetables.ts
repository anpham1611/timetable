import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  adminTimetableListResponseSchema,
  importResultSchema,
  importErrorResponseSchema,
  type AdminTimetable,
  type AdminTimetableListResponse,
  type ImportResult,
} from "@timetable/shared";
import { authHeaders, clearSessionToken } from "./adminSession.js";

const LIST_KEY = ["admin", "timetables"] as const;

/**
 * Builds a human-readable message from a failed import response. The API returns
 * a located error `{ error: { sheet, row?, column?, message } }`; this formats
 * it as e.g. "Sheet 'Lesson', dòng 14 (teacherCodes): …" so the admin can find
 * and fix the exact cell. Falls back to a status message when the body is not a
 * located error.
 */
async function importErrorMessage(res: Response): Promise<string> {
  try {
    const parsed = importErrorResponseSchema.parse(await res.json());
    const { sheet, row, column, message } = parsed.error;
    const loc = [
      `Sheet '${sheet}'`,
      row != null ? `dòng ${row}` : null,
      column ? `(${column})` : null,
    ]
      .filter(Boolean)
      .join(", ");
    return `${loc}: ${message}`;
  } catch {
    return `Nhập thất bại (HTTP ${res.status})`;
  }
}

/** Clear the stored session when the API rejects us as unauthorized. */
function onUnauthorized(status: number): void {
  if (status === 401) clearSessionToken();
}

async function fetchAdminTimetables(): Promise<AdminTimetableListResponse> {
  const res = await fetch("/api/admin/timetables", { headers: authHeaders() });
  if (!res.ok) {
    onUnauthorized(res.status);
    throw new Error(`Admin timetables request failed: ${res.status}`);
  }
  return adminTimetableListResponseSchema.parse(await res.json());
}

/** Timetables sorted newest-first (by createdAt desc) for the admin display. */
function sortNewestFirst(items: AdminTimetable[]): AdminTimetable[] {
  return [...items].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function useAdminTimetables() {
  return useQuery({
    queryKey: LIST_KEY,
    queryFn: fetchAdminTimetables,
    select: (data) => ({ items: sortNewestFirst(data.items) }),
  });
}

export function useToggleTimetable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { id: number; isActive: boolean }) => {
      const res = await fetch(`/api/admin/timetables/${vars.id}/active`, {
        method: "PATCH",
        headers: { ...authHeaders(), "content-type": "application/json" },
        body: JSON.stringify({ isActive: vars.isActive }),
      });
      if (!res.ok) {
        onUnauthorized(res.status);
        throw new Error(`Toggle failed: ${res.status}`);
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: LIST_KEY });
    },
  });
}

export function useImportTimetable() {
  const qc = useQueryClient();
  return useMutation<ImportResult, Error, File>({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/import", {
        method: "POST",
        headers: authHeaders(),
        body: form,
      });
      if (!res.ok) {
        onUnauthorized(res.status);
        throw new Error(await importErrorMessage(res));
      }
      return importResultSchema.parse(await res.json());
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: LIST_KEY });
    },
  });
}
