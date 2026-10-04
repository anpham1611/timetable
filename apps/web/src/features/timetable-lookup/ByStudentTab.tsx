import { useState } from "react";
import type { StudentItem } from "@timetable/shared";
import {
  Autocomplete,
  type AutocompleteOption,
} from "@/components/ui/autocomplete";
import { useStudentSearch } from "./useStudentSearch.js";

export interface ByStudentTabProps {
  selectedStudent: StudentItem | null;
  onSelectStudent: (student: StudentItem) => void;
  timetableId?: number | null;
}

export function ByStudentTab({
  selectedStudent,
  onSelectStudent,
  timetableId = null,
}: ByStudentTabProps) {
  const [query, setQuery] = useState(selectedStudent?.name ?? "");
  const { data } = useStudentSearch(query, timetableId);
  const students = data?.items ?? [];

  const options: AutocompleteOption[] = students.map((s) => ({
    id: s.id,
    label: s.name,
    detail: s.class.name,
  }));

  return (
    <Autocomplete
      aria-label="Tìm học sinh"
      placeholder="Nhập tên học sinh"
      query={query}
      onQueryChange={setQuery}
      options={options}
      noResultsLabel="Không tìm thấy học sinh."
      onSelect={(option) => {
        const student = students.find((s) => s.id === option.id);
        if (student) {
          onSelectStudent(student);
          setQuery(student.name);
        }
      }}
    />
  );
}
