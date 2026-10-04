import { useState } from "react";
import type { TeacherItem } from "@timetable/shared";
import {
  Autocomplete,
  type AutocompleteOption,
} from "@/components/ui/autocomplete";
import { useTeacherSearch } from "./useTeacherSearch.js";

export interface ByTeacherTabProps {
  selectedTeacher: TeacherItem | null;
  onSelectTeacher: (teacher: TeacherItem) => void;
  timetableId?: number | null;
}

export function ByTeacherTab({
  selectedTeacher,
  onSelectTeacher,
  timetableId = null,
}: ByTeacherTabProps) {
  const [query, setQuery] = useState(selectedTeacher?.name ?? "");
  const { data } = useTeacherSearch(query, timetableId);
  const teachers = data?.items ?? [];

  const options: AutocompleteOption[] = teachers.map((t) => ({
    id: t.id,
    label: t.name,
  }));

  return (
    <Autocomplete
      aria-label="Tìm giáo viên"
      placeholder="Nhập tên giáo viên"
      query={query}
      onQueryChange={setQuery}
      options={options}
      noResultsLabel="Không tìm thấy giáo viên."
      onSelect={(option) => {
        const teacher = teachers.find((t) => t.id === option.id);
        if (teacher) {
          onSelectTeacher(teacher);
          setQuery(teacher.name);
        }
      }}
    />
  );
}
