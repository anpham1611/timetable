import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { authHeaders, clearSessionToken } from "./adminSession.js";
import {
  useAdminTimetables,
  useImportTimetable,
  useToggleTimetable,
} from "./useAdminTimetables.js";
import { formatEffectiveDate } from "@/features/timetable-home/format";

/**
 * Admin management page: lists every timetable (newest first), lets an admin
 * activate/deactivate each one, import a new timetable from an Excel file,
 * download the import template, and log out.
 */
export function TimetableAdminPage({ onLogout }: { onLogout?: () => void }) {
  const { data, isLoading, isError } = useAdminTimetables();
  const toggle = useToggleTimetable();
  const importMut = useImportTimetable();
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function onLogoutClick() {
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
        headers: authHeaders(),
      });
    } catch {
      /* ignore network errors; we clear locally regardless */
    } finally {
      clearSessionToken();
      onLogout?.();
    }
  }

  async function onImport(file: File) {
    setMessage(null);
    try {
      const result = await importMut.mutateAsync(file);
      setMessage(
        `Đã nhập TKB mới (#${result.timetableId}): ${result.lessonsCreated} tiết học.`
      );
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Nhập thất bại");
    } finally {
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  function onDownloadTemplate() {
    // Use a token-carrying fetch, then trigger a client-side download.
    void fetch("/api/admin/import/template", {
      headers: authHeaders(),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Tải mẫu thất bại: ${res.status}`);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "timetable-import-template.xlsx";
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch((err) => setMessage(err instanceof Error ? err.message : "Lỗi"));
  }

  return (
    <main className="mx-auto max-w-md p-6 md:max-w-3xl lg:max-w-5xl">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Quản trị thời khóa biểu</h1>
        <Button variant="ghost" size="sm" onClick={() => void onLogoutClick()}>
          Đăng xuất
        </Button>
      </div>

      <section className="mt-4 flex flex-wrap items-center gap-3">
        <Button
          variant="outline"
          onClick={() => fileInput.current?.click()}
          disabled={importMut.isPending}
        >
          {importMut.isPending ? "Đang nhập…" : "Nhập TKB từ Excel"}
        </Button>
        <Button variant="ghost" onClick={onDownloadTemplate}>
          Tải mẫu Excel
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept=".xlsx"
          className="hidden"
          aria-label="Tệp Excel thời khóa biểu"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void onImport(file);
          }}
        />
      </section>

      {message && (
        <p className="mt-3 text-sm text-muted-foreground" role="status">
          {message}
        </p>
      )}

      <section className="mt-6">
        {isLoading && <p>Đang tải…</p>}
        {isError && <p role="alert">Không tải được danh sách TKB.</p>}
        {data && data.items.length === 0 && (
          <p className="text-muted-foreground">Chưa có thời khóa biểu nào.</p>
        )}
        {data && data.items.length > 0 && (
          <ul className="divide-y rounded-md border">
            {data.items.map((tkb) => (
              <li
                key={tkb.id}
                className="flex items-center justify-between gap-4 p-3"
              >
                <span>
                  TKB {tkb.ordinal} - {formatEffectiveDate(tkb.effectiveFrom)}
                  <span
                    className={
                      tkb.isActive
                        ? "ml-2 text-xs text-primary"
                        : "ml-2 text-xs text-muted-foreground"
                    }
                  >
                    {tkb.isActive ? "Đang hiển thị" : "Đang ẩn"}
                  </span>
                </span>
                <Button
                  variant={tkb.isActive ? "secondary" : "default"}
                  size="sm"
                  disabled={toggle.isPending}
                  onClick={() =>
                    toggle.mutate({ id: tkb.id, isActive: !tkb.isActive })
                  }
                >
                  {tkb.isActive ? "Ẩn" : "Hiển thị"}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
