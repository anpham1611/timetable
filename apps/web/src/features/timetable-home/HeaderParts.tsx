import type { ActiveTimetable } from "@timetable/shared";
import { Button } from "@/components/ui/button";
import { formatVisitCount, timetableLabel } from "./format.js";

export function HeaderTitle() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Thời khóa biểu</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Áp dụng từ 10/10/2026 · Tra theo lớp, học sinh hoặc giáo viên
      </p>
    </div>
  );
}

export function VisitCountLine({ count }: { count: number | undefined }) {
  return (
    <p className="text-sm text-muted-foreground">
      Lượt truy cập: {formatVisitCount(count)}
    </p>
  );
}

export interface TimetableButtonsProps {
  items: ActiveTimetable[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

export function TimetableButtons({
  items,
  selectedId,
  onSelect,
}: TimetableButtonsProps) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Hiện chưa có thời khóa biểu nào.
      </p>
    );
  }

  // Newest-first: order the buttons descending by effective date so the most
  // recently effective TKB appears first.
  const ordered = [...items].sort((a, b) =>
    b.effectiveFrom.localeCompare(a.effectiveFrom)
  );

  return (
    <div className="flex flex-wrap gap-2">
      {ordered.map((item) => {
        const isSelected = item.id === selectedId;
        return (
          <Button
            key={item.id}
            variant={isSelected ? "default" : "outline"}
            size="sm"
            aria-pressed={isSelected}
            onClick={() => onSelect(item.id)}
          >
            {timetableLabel(item.ordinal, item.effectiveFrom)}
          </Button>
        );
      })}
    </div>
  );
}
