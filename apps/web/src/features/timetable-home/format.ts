/**
 * Formats a visit count with vi-VN thousands separators (dot grouping),
 * e.g. 9000 -> "9.000". Returns a neutral placeholder when unavailable.
 */
export function formatVisitCount(count: number | undefined): string {
  if (count === undefined || count === null || Number.isNaN(count)) {
    return "—";
  }
  return new Intl.NumberFormat("vi-VN").format(count);
}

/**
 * Formats an ISO date string (YYYY-MM-DD) as dd/mm/yyyy without timezone drift.
 */
export function formatEffectiveDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

/** Builds a TKB button label: "TKB {n} - {dd/mm/yyyy}". */
export function timetableLabel(ordinal: number, isoDate: string): string {
  return `TKB ${ordinal} - ${formatEffectiveDate(isoDate)}`;
}
