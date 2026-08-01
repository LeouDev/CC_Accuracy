export interface ParsedCoachingDate {
  dateAddedParsed: string | null; // ISO date
  isEstimated: boolean;
  isNotAdded: boolean;
  complianceDays: number | null;
}

const ADDED_BEFORE_RE = /added before\s+(\d{1,2})\/(\d{1,2})\/(\d{2,4})/i;

function toIsoDate(month: number, day: number, year: number): string {
  const fullYear = year < 100 ? 2000 + year : year;
  const d = new Date(Date.UTC(fullYear, month - 1, day));
  return d.toISOString().slice(0, 10);
}

/**
 * Parses the messy "Date Coaching Added To GLP Master Excel" column.
 * Accepts: a real Date, an Excel serial number, "Added Before MM/DD/YY"
 * (estimated/upper-bound), or "NOT ADDED" (still outstanding).
 */
export function parseCoachingAddedDate(
  raw: string | number | Date | null | undefined,
  caseDateIso: string | null,
): ParsedCoachingDate {
  if (raw == null || raw === "") {
    return { dateAddedParsed: null, isEstimated: false, isNotAdded: false, complianceDays: null };
  }

  if (typeof raw === "string" && /not added/i.test(raw.trim())) {
    return { dateAddedParsed: null, isEstimated: false, isNotAdded: true, complianceDays: null };
  }

  let iso: string | null = null;
  let isEstimated = false;

  if (raw instanceof Date) {
    iso = raw.toISOString().slice(0, 10);
  } else if (typeof raw === "number") {
    // Excel serial date (days since 1899-12-30)
    const ms = Math.round((raw - 25569) * 86400 * 1000);
    iso = new Date(ms).toISOString().slice(0, 10);
  } else {
    const match = ADDED_BEFORE_RE.exec(raw.trim());
    if (match) {
      const [, m, d, y] = match;
      iso = toIsoDate(Number(m), Number(d), Number(y));
      isEstimated = true;
    } else {
      const parsedDirect = new Date(raw);
      if (!Number.isNaN(parsedDirect.getTime())) {
        iso = parsedDirect.toISOString().slice(0, 10);
      }
    }
  }

  if (!iso) {
    return { dateAddedParsed: null, isEstimated: false, isNotAdded: false, complianceDays: null };
  }

  let complianceDays: number | null = null;
  if (caseDateIso) {
    const diffMs = new Date(iso).getTime() - new Date(caseDateIso).getTime();
    complianceDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  }

  return { dateAddedParsed: iso, isEstimated, isNotAdded: false, complianceDays };
}
