import { useState } from "react";
import type { StudentItem, TeacherItem } from "@timetable/shared";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { TimetableResult } from "@/features/timetable-grid-view/TimetableResult";
import { ByClassTab } from "./ByClassTab.js";
import { ByStudentTab } from "./ByStudentTab.js";
import { ByTeacherTab } from "./ByTeacherTab.js";

/**
 * The three-tab lookup section. Each tab tracks its own selection
 * independently. Selecting a class, student, or teacher renders that target's
 * resolved weekly timetable grid in the result area below the active tab,
 * resolved for the currently selected published TKB (`timetableId`; null uses
 * the server's default active TKB).
 */
export function TimetableLookupSection({
  timetableId = null,
}: {
  timetableId?: number | null;
}) {
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<StudentItem | null>(
    null
  );
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherItem | null>(
    null
  );

  return (
    <section aria-label="Tra cứu thời khóa biểu">
      <Tabs defaultValue="class">
        <TabsList className="print:hidden">
          <TabsTrigger value="class">Theo lớp</TabsTrigger>
          <TabsTrigger value="student">Theo học sinh</TabsTrigger>
          <TabsTrigger value="teacher">Theo giáo viên</TabsTrigger>
        </TabsList>

        <TabsContent value="class" className="mt-3">
          <div className="print:hidden">
            <ByClassTab
              selectedClassId={selectedClassId}
              onSelectClass={setSelectedClassId}
              timetableId={timetableId}
            />
          </div>
          <TimetableResult
            kind="class"
            id={selectedClassId}
            timetableId={timetableId}
          />
        </TabsContent>

        <TabsContent value="student" className="mt-3">
          <div className="print:hidden">
            <ByStudentTab
              selectedStudent={selectedStudent}
              onSelectStudent={setSelectedStudent}
              timetableId={timetableId}
            />
          </div>
          <TimetableResult
            kind="student"
            id={selectedStudent?.id ?? null}
            timetableId={timetableId}
          />
        </TabsContent>

        <TabsContent value="teacher" className="mt-3">
          <div className="print:hidden">
            <ByTeacherTab
              selectedTeacher={selectedTeacher}
              onSelectTeacher={setSelectedTeacher}
              timetableId={timetableId}
            />
          </div>
          <TimetableResult
            kind="teacher"
            id={selectedTeacher?.id ?? null}
            timetableId={timetableId}
          />
        </TabsContent>
      </Tabs>
    </section>
  );
}
