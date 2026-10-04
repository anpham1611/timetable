import { useMemo } from "react";
import type { GridDay, GridPeriod, GridSlot, WeekGrid } from "@timetable/shared";

/** Vietnamese day labels keyed by Thứ number (2..7). */
const DAY_LABELS: Record<GridDay, string> = {
  2: "Thứ 2",
  3: "Thứ 3",
  4: "Thứ 4",
  5: "Thứ 5",
  6: "Thứ 6",
  7: "Thứ 7",
};

/**
 * Maps the current weekday to its Thứ number (2..7), or null when today is
 * Sunday (not part of the grid). JS getDay(): Sun=0, Mon=1 .. Sat=6, so Mon→2.
 */
export function todayThu(date = new Date()): GridDay | null {
  const d = date.getDay();
  if (d >= 1 && d <= 6) return (d + 1) as GridDay;
  return null;
}

export interface TimetableGridProps {
  grid: WeekGrid;
  /** Override for deterministic tests; defaults to the real current weekday. */
  today?: GridDay | null;
}

interface SessionBlock {
  label: string;
  periods: GridPeriod[];
}

function splitSessions(periods: GridPeriod[]): SessionBlock[] {
  const morning = periods.filter((p) => p.session === "SANG");
  const afternoon = periods.filter((p) => p.session === "CHIEU");
  const blocks: SessionBlock[] = [];
  if (morning.length) blocks.push({ label: "SÁNG", periods: morning });
  if (afternoon.length) blocks.push({ label: "CHIỀU", periods: afternoon });
  return blocks;
}

/**
 * Renders a resolved weekly timetable grid: title header, a period/time column,
 * Thứ 2–Thứ 7 day headers, SÁNG/CHIỀU session rows, and one cell per slot. The
 * current weekday's column is highlighted; empty slots render an em dash.
 *
 * One unified cell shape drives all three views (class/student/teacher); the
 * cell shows whatever fields the resolver populated.
 */
export function TimetableGrid({ grid, today }: TimetableGridProps) {
  const highlightDay = today === undefined ? todayThu() : today;
  const sessions = useMemo(() => splitSessions(grid.periods), [grid.periods]);

  const cellByCoord = useMemo(() => {
    const m = new Map<string, GridSlot["cell"]>();
    for (const slot of grid.slots) m.set(`${slot.day}:${slot.periodId}`, slot.cell);
    return m;
  }, [grid.slots]);

  const dayClass = (day: GridDay) =>
    day === highlightDay ? "bg-primary/10 print:bg-transparent" : "";

  return (
    <section aria-label="Thời khóa biểu" className="mt-4 print:mt-0 print:text-black">
      <header className="mb-3">
        <h2 className="text-lg font-semibold">{grid.title}</h2>
        {grid.subtitle ? (
          <p className="text-sm text-muted-foreground print:text-black">{grid.subtitle}</p>
        ) : null}
      </header>

      <div className="overflow-x-auto rounded-md border border-border print:overflow-visible">
        <table className="w-full border-collapse text-sm print:bg-white print:text-black print:[&_*]:text-black">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-muted px-2 py-2 text-left font-medium">
                Tiết
              </th>
              {grid.days.map((day) => (
                <th
                  key={day}
                  className={`min-w-28 px-2 py-2 text-center font-medium ${dayClass(day)}`}
                >
                  {DAY_LABELS[day]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sessions.map((block) => (
              <SessionRows
                key={block.label}
                block={block}
                days={grid.days}
                cellByCoord={cellByCoord}
                dayClass={dayClass}
              />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

interface SessionRowsProps {
  block: SessionBlock;
  days: GridDay[];
  cellByCoord: Map<string, GridSlot["cell"]>;
  dayClass: (day: GridDay) => string;
}

function SessionRows({ block, days, cellByCoord, dayClass }: SessionRowsProps) {
  return (
    <>
      <tr>
        <td
          colSpan={days.length + 1}
          className="bg-muted/60 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
        >
          {block.label}
        </td>
      </tr>
      {block.periods.map((period) => (
        <tr key={period.id} className="border-t border-border">
          <td className="sticky left-0 z-10 bg-background px-2 py-2 align-top">
            <div className="font-medium">{period.ordinal}</div>
            {period.startTime && period.endTime ? (
              <div className="text-[11px] text-muted-foreground">
                {period.startTime} - {period.endTime}
              </div>
            ) : null}
          </td>
          {days.map((day) => {
            const cell = cellByCoord.get(`${day}:${period.id}`) ?? null;
            return (
              <td
                key={day}
                className={`px-2 py-2 align-top ${dayClass(day)}`}
              >
                <GridCellView cell={cell} />
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}

function GridCellView({ cell }: { cell: GridSlot["cell"] }) {
  if (!cell) {
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <div className="space-y-0.5">
      <div className="font-medium">
        {cell.subjectShortCode}
        {cell.isRoomMove ? (
          <span className="ml-1 text-amber-600" title="Di chuyển phòng">
            *
          </span>
        ) : null}
      </div>
      {cell.teachers.length > 0 ? (
        <div className="text-xs text-muted-foreground">
          GV: {cell.teachers.join(", ")}
          {cell.isRoomMove && cell.room ? ` · Phòng ${cell.room}` : ""}
        </div>
      ) : null}
      {cell.className ? (
        <div className="text-xs text-muted-foreground">Lớp: {cell.className}</div>
      ) : null}
      {cell.choiceGroup ? (
        <div className="text-[11px] text-muted-foreground">{cell.choiceGroup}</div>
      ) : null}
    </div>
  );
}
