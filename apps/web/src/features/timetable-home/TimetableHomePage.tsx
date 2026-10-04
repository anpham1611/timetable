import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { HeaderTitle, TimetableButtons, VisitCountLine } from "./HeaderParts.js";
import { TimetableLookupSection } from "@/features/timetable-lookup/TimetableLookupSection";
import { useActiveTimetables } from "./useActiveTimetables.js";
import { useVisitCount } from "./useVisitCount.js";

export function TimetableHomePage() {
  const { data: visit } = useVisitCount();
  const { data: timetables } = useActiveTimetables();

  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Seed the selection from the server-provided default once data arrives,
  // unless the user has already chosen a timetable this session.
  useEffect(() => {
    if (selectedId === null && timetables?.defaultSelectedId != null) {
      setSelectedId(timetables.defaultSelectedId);
    }
  }, [selectedId, timetables?.defaultSelectedId]);

  return (
    <main className="mx-auto max-w-md p-6 md:max-w-3xl lg:max-w-5xl">
      <div className="flex items-start justify-between gap-4 print:hidden">
        <HeaderTitle />
        <ThemeToggle />
      </div>

      <div className="mt-2 print:hidden">
        <VisitCountLine count={visit?.count} />
      </div>

      <div className="mt-4 print:hidden">
        <TimetableButtons
          items={timetables?.items ?? []}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </div>

      <div className="mt-6 print:mt-0">
        <TimetableLookupSection timetableId={selectedId} />
      </div>
    </main>
  );
}
