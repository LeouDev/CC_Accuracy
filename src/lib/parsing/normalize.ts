export function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function buildHeaderLookup(headers: string[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const h of headers) {
    map.set(normalizeHeader(h), h);
  }
  return map;
}

export function findColumn(lookup: Map<string, string>, aliases: string[]): string | undefined {
  for (const alias of aliases) {
    const found = lookup.get(alias);
    if (found) return found;
  }
  return undefined;
}

export function excelValueToIsoDate(v: unknown): string | null {
  if (v == null || v === "") return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "number") {
    const ms = Math.round((v - 25569) * 86400 * 1000);
    return new Date(ms).toISOString().slice(0, 10);
  }
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

/**
 * Parses timestamp text like "05/01/2026 09:24 AM CDT" into an ISO date.
 * These columns are stored as plain text (not real date cells), and the
 * trailing US timezone abbreviation (CDT/CST/etc) isn't reliably parsed by
 * JS's Date constructor across engines, so the MM/DD/YYYY prefix is matched
 * directly via regex instead of relying on lenient Date parsing.
 */
export function parseTimestampToIsoDate(v: unknown): string | null {
  if (v == null || v === "") return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "number") return excelValueToIsoDate(v);

  const s = String(v).trim();
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(s);
  if (match) {
    const [, m, d, y] = match;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return excelValueToIsoDate(s);
}

export function str(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}
