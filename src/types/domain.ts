export interface RosterRecord {
  msid: string;
  employee_id: string | null;
  employee_name: string | null;
  am_name: string | null;
  site: string | null;
}

export interface RawDataRecord {
  id?: string;
  case_id: string;
  technician_msid: string;
  business_segment: string | null;
  drug_name: string | null;
  gpi: string | null;
  clinical_decision: string | null;
  auto_insight_decision: string | null;
  auditor_finding: string | null;
  auditor: string | null;
  category: string | null;
  subcategory: string | null;
  comments: string | null;
  priority: string | null;
  case_date: string | null; // ISO date
  month: string | null;
  /** null = not yet auditable (no technician decision recorded) - exclude from Total Audits/Accuracy. */
  score: 0 | 1 | null;
}

export interface CoachingRecord {
  id?: string;
  case_id: string | null;
  technician_msid: string;
  auditor: string | null;
  case_date: string | null;
  date_added_raw: string | null;
  date_added_parsed: string | null;
  is_estimated: boolean;
  is_not_added: boolean;
  compliance_days: number | null;
  comments: string | null;
}

// A raw_data row merged with roster info, ready for the dashboard
export interface EnrichedCase extends RawDataRecord {
  technician_name: string;
  site: string;
  supervisor: string; // AM Name
  week: string; // ISO year-week, e.g. "2026-W07"
  quarter: string; // e.g. "2026-Q1"
  year: number;
  has_human_finding: boolean;
}

export interface EnrichedCoaching extends CoachingRecord {
  technician_name: string;
  site: string;
  supervisor: string;
}

export interface FilterState {
  site: string[];
  supervisor: string[];
  technician: string[];
  auditor: string[];
  category: string[];
  subcategory: string[];
  month: string[];
  quarter: string[];
  year: string[];
  dateFrom: string | null;
  dateTo: string | null;
}

export type FileType = "raw_data" | "roster" | "coaching";
