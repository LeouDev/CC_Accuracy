import * as XLSX from "xlsx";
import {
  buildHeaderLookup,
  findColumn,
  excelValueToIsoDate,
  parseTimestampToIsoDate,
  str,
} from "./normalize";
import type { RawDataRecord } from "@/types/domain";
import { scoreCase } from "@/lib/scoring/accuracy";

export function parseRawDataSheet(sheet: XLSX.WorkSheet): RawDataRecord[] {
  const headerRow = (XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][])[0] as
    | string[]
    | undefined;
  if (!headerRow) return [];
  const lookup = buildHeaderLookup(headerRow.map(String));

  const caseIdCol = findColumn(lookup, ["caseid"]);
  const msidCol = findColumn(lookup, ["technicianmsid"]);
  const segmentCol = findColumn(lookup, ["businesssegment"]);
  const drugCol = findColumn(lookup, ["drugname"]);
  const gpiCol = findColumn(lookup, ["gpi"]);
  const clinicalCol = findColumn(lookup, ["clinicaldecisionbyenhancedtechnician"]);
  const autoInsightCol = findColumn(lookup, ["autoinsightdecision"]);
  const autoRecCol = findColumn(lookup, ["autodecisionrecommendation"]);
  const findingCol = findColumn(lookup, [
    "auditorfindingagreedisagreewtechdecision",
    "auditorfindingagreedisagreewithtechdecision",
  ]);
  const auditorCol = findColumn(lookup, ["auditor"]);
  const categoryCol = findColumn(lookup, ["category"]);
  const subcategoryCol = findColumn(lookup, ["subcategory"]);
  const commentsCol = findColumn(lookup, ["comments", "comment"]);
  const priorityCol = findColumn(lookup, ["priority"]);
  const dateCol = findColumn(lookup, ["date"]);
  const decisionTimestampCol = findColumn(lookup, ["enhancedtechniciandecisiontimestamp"]);
  const monthCol = findColumn(lookup, ["month"]);

  if (!caseIdCol || !msidCol) return [];

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null });

  // case_id has a unique constraint in the DB; source exports sometimes contain
  // the same case more than once (e.g. re-pulled into multiple combined weekly
  // snapshots). Keep the last occurrence so a duplicate doesn't fail the whole upload.
  const byCaseId = new Map<string, RawDataRecord>();

  for (const r of rows) {
    if (r[caseIdCol] == null || String(r[caseIdCol]).trim() === "") continue;
    const base = {
      case_id: String(r[caseIdCol]).trim(),
      technician_msid: (msidCol ? str(r[msidCol]) : null) ?? "",
      business_segment: segmentCol ? str(r[segmentCol]) : null,
      drug_name: drugCol ? str(r[drugCol]) : null,
      gpi: gpiCol ? str(r[gpiCol]) : null,
      clinical_decision: clinicalCol ? str(r[clinicalCol]) : null,
      auto_insight_decision: autoInsightCol ? str(r[autoInsightCol]) : null,
      auto_decision_recommendation: autoRecCol ? str(r[autoRecCol]) : null,
      auditor_finding: findingCol ? str(r[findingCol]) : null,
      auditor: auditorCol ? str(r[auditorCol]) : null,
      category: categoryCol ? str(r[categoryCol]) : null,
      subcategory: subcategoryCol ? str(r[subcategoryCol]) : null,
      comments: commentsCol ? str(r[commentsCol]) : null,
      priority: priorityCol ? str(r[priorityCol]) : null,
      case_date: decisionTimestampCol
        ? (parseTimestampToIsoDate(r[decisionTimestampCol]) ??
          (dateCol ? excelValueToIsoDate(r[dateCol]) : null))
        : dateCol
          ? excelValueToIsoDate(r[dateCol])
          : null,
      month: monthCol ? str(r[monthCol]) : null,
    };
    byCaseId.set(base.case_id, { ...base, score: scoreCase(base) });
  }

  return Array.from(byCaseId.values());
}
