import * as XLSX from "xlsx";
import { buildHeaderLookup, findColumn, str } from "./normalize";
import type { RosterRecord } from "@/types/domain";

export function parseRosterSheet(sheet: XLSX.WorkSheet): RosterRecord[] {
  const headerRow = (XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][])[0] as
    | string[]
    | undefined;
  if (!headerRow) return [];
  const lookup = buildHeaderLookup(headerRow.map(String));

  const msidCol = findColumn(lookup, ["msid"]);
  const empIdCol = findColumn(lookup, ["employeeid"]);
  const nameCol = findColumn(lookup, ["employeename"]);
  const amCol = findColumn(lookup, ["amname", "supervisor"]);
  const siteCol = findColumn(lookup, ["site"]);

  if (!msidCol) return [];

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null });

  return rows
    .filter((r) => r[msidCol] != null && String(r[msidCol]).trim() !== "")
    .map((r) => ({
      msid: String(r[msidCol]).trim(),
      employee_id: empIdCol ? str(r[empIdCol]) : null,
      employee_name: nameCol ? str(r[nameCol]) : null,
      am_name: amCol ? str(r[amCol]) : null,
      site: siteCol ? str(r[siteCol]) : null,
    }));
}
