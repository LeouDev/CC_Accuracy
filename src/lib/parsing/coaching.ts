import * as XLSX from "xlsx";
import { buildHeaderLookup, findColumn, excelValueToIsoDate, str } from "./normalize";
import type { CoachingRecord } from "@/types/domain";
import { parseCoachingAddedDate } from "@/lib/scoring/coaching";

export function parseCoachingSheet(sheet: XLSX.WorkSheet): CoachingRecord[] {
  const headerRow = (XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][])[0] as
    | string[]
    | undefined;
  if (!headerRow) return [];
  const lookup = buildHeaderLookup(headerRow.map(String));

  const caseIdCol = findColumn(lookup, ["caseid"]);
  const msidCol = findColumn(lookup, ["technicianmsid"]);
  const auditorCol = findColumn(lookup, ["auditor"]);
  const dateCol = findColumn(lookup, ["date"]);
  const addedCol = findColumn(lookup, ["datecoachingaddedtoglpmasterexcel"]);
  const commentsCol = findColumn(lookup, ["comments", "comment"]);

  if (!msidCol) return [];

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null });

  return rows
    .filter((r) => r[msidCol] != null && String(r[msidCol]).trim() !== "")
    .map((r) => {
      const caseDateIso = dateCol ? excelValueToIsoDate(r[dateCol]) : null;
      const rawAdded = addedCol ? (r[addedCol] as string | number | Date | null) : null;
      const parsed = parseCoachingAddedDate(rawAdded, caseDateIso);
      const rawAddedDisplay =
        rawAdded == null
          ? null
          : rawAdded instanceof Date
            ? rawAdded.toISOString().slice(0, 10)
            : String(rawAdded);

      return {
        case_id: caseIdCol ? str(r[caseIdCol]) : null,
        technician_msid: str(r[msidCol]) ?? "",
        auditor: auditorCol ? str(r[auditorCol]) : null,
        case_date: caseDateIso,
        date_added_raw: rawAddedDisplay,
        date_added_parsed: parsed.dateAddedParsed,
        is_estimated: parsed.isEstimated,
        is_not_added: parsed.isNotAdded,
        compliance_days: parsed.complianceDays,
        comments: commentsCol ? str(r[commentsCol]) : null,
      };
    });
}
