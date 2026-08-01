const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** Formats a week-ending ISO date (YYYY-MM-DD, always a Saturday) as "WE Aug 1". */
export function formatWeekLabel(weekIso: string): string {
  if (!weekIso) return "";
  const d = new Date(weekIso + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return weekIso;
  return `WE ${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}
