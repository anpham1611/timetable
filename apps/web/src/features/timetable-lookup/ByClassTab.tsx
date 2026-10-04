import { useMemo } from "react";
import type { ClassItem } from "@timetable/shared";
import { Select } from "@/components/ui/select";
import { useClasses } from "./useClasses.js";

export interface ByClassTabProps {
  selectedClassId: number | null;
  onSelectClass: (id: number) => void;
  timetableId?: number | null;
}

/** Groups classes by grade, preserving the server's (grade, class) ordering. */
function groupByGrade(items: ClassItem[]) {
  const groups: { gradeName: string; classes: ClassItem[] }[] = [];
  for (const item of items) {
    let group = groups.find((g) => g.gradeName === item.grade.name);
    if (!group) {
      group = { gradeName: item.grade.name, classes: [] };
      groups.push(group);
    }
    group.classes.push(item);
  }
  return groups;
}

export function ByClassTab({
  selectedClassId,
  onSelectClass,
  timetableId = null,
}: ByClassTabProps) {
  const { data } = useClasses(timetableId);
  const items = data?.items ?? [];
  const groups = useMemo(() => groupByGrade(items), [items]);

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Hiện chưa có lớp nào.
      </p>
    );
  }

  return (
    <Select
      aria-label="Chọn lớp"
      value={selectedClassId ?? ""}
      onChange={(e) => {
        const id = Number(e.target.value);
        if (!Number.isNaN(id)) onSelectClass(id);
      }}
    >
      <option value="" disabled>
        Chọn lớp
      </option>
      {groups.map((group) => (
        <optgroup key={group.gradeName} label={`Khối ${group.gradeName}`}>
          {group.classes.map((cls) => (
            <option key={cls.id} value={cls.id}>
              {cls.name}
            </option>
          ))}
        </optgroup>
      ))}
    </Select>
  );
}
