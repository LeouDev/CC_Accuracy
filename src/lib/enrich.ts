import type {
  RawDataRecord,
  RosterRecord,
  CoachingRecord,
  EnrichedCase,
  EnrichedCoaching,
} from "@/types/domain";

const FALLBACK_SITE = "Onshore";
const FALLBACK_SUPERVISOR = "Melvin Suarez";

/** Returns the ISO date (YYYY-MM-DD) of the Saturday that ends the Sun-Sat week containing dateIso. */
function weekEndingSaturday(dateIso: string): string {
  const d = new Date(dateIso + "T00:00:00Z");
  const daysUntilSaturday = (6 - d.getUTCDay() + 7) % 7;
  d.setUTCDate(d.getUTCDate() + daysUntilSaturday);
  return d.toISOString().slice(0, 10);
}

function quarterOf(dateIso: string): string {
  const d = new Date(dateIso + "T00:00:00Z");
  const q = Math.floor(d.getUTCMonth() / 3) + 1;
  return `${d.getUTCFullYear()}-Q${q}`;
}

/** Trims + case-folds names so "alely" and "Alely" collapse to one canonical spelling (most frequent variant wins). */
export function buildNameCanonicalizer(
  names: (string | null | undefined)[],
): (name: string | null | undefined) => string {
  const counts = new Map<string, Map<string, number>>();
  for (const raw of names) {
    if (!raw) continue;
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    const variants = counts.get(key) ?? new Map<string, number>();
    variants.set(trimmed, (variants.get(trimmed) ?? 0) + 1);
    counts.set(key, variants);
  }
  const canonical = new Map<string, string>();
  for (const [key, variants] of counts) {
    let best = "";
    let bestCount = -1;
    for (const [variant, count] of variants) {
      if (count > bestCount) {
        best = variant;
        bestCount = count;
      }
    }
    canonical.set(key, best);
  }
  return (name) => {
    if (!name) return "";
    const trimmed = name.trim();
    if (!trimmed) return "";
    return canonical.get(trimmed.toLowerCase()) ?? trimmed;
  };
}

export function buildEnrichedCases(
  rawRows: RawDataRecord[],
  rosterRows: RosterRecord[],
): EnrichedCase[] {
  const rosterByMsid = new Map(rosterRows.map((r) => [r.msid.trim().toLowerCase(), r]));
  const canonicalize = buildNameCanonicalizer([
    ...rawRows.map((r) => r.auditor),
    ...rosterRows.map((r) => r.am_name),
  ]);

  return rawRows.map((row) => {
    const roster = rosterByMsid.get(row.technician_msid.trim().toLowerCase());
    const dateIso = row.case_date;
    return {
      ...row,
      auditor: row.auditor ? canonicalize(row.auditor) : row.auditor,
      technician_name: roster?.employee_name || row.technician_msid,
      site: roster?.site || FALLBACK_SITE,
      supervisor: roster ? canonicalize(roster.am_name) || FALLBACK_SUPERVISOR : FALLBACK_SUPERVISOR,
      week: dateIso ? weekEndingSaturday(dateIso) : "",
      quarter: dateIso ? quarterOf(dateIso) : "",
      year: dateIso ? new Date(dateIso).getUTCFullYear() : 0,
      has_human_finding: row.auditor_finding === "Agree" || row.auditor_finding === "Disagree",
    };
  });
}

export function buildEnrichedCoaching(
  coachRows: CoachingRecord[],
  rosterRows: RosterRecord[],
): EnrichedCoaching[] {
  const rosterByMsid = new Map(rosterRows.map((r) => [r.msid.trim().toLowerCase(), r]));
  const canonicalize = buildNameCanonicalizer([
    ...coachRows.map((r) => r.auditor),
    ...rosterRows.map((r) => r.am_name),
  ]);

  return coachRows.map((row) => {
    const roster = rosterByMsid.get(row.technician_msid.trim().toLowerCase());
    return {
      ...row,
      auditor: row.auditor ? canonicalize(row.auditor) : row.auditor,
      technician_name: roster?.employee_name || row.technician_msid,
      site: roster?.site || FALLBACK_SITE,
      supervisor: roster ? canonicalize(roster.am_name) || FALLBACK_SUPERVISOR : FALLBACK_SUPERVISOR,
    };
  });
}
