import type { RawDataRecord } from "@/types/domain";

export type ScorableRow = Pick<
  RawDataRecord,
  "clinical_decision" | "auto_insight_decision" | "auditor_finding"
>;

/**
 * Modular accuracy scoring. Each rule is tried in order; the first
 * one that applies (returns non-null) determines the score.
 * New rules can be appended without touching existing logic.
 */
type ScoringRule = (row: ScorableRow) => 0 | 1 | null;

const humanFindingRule: ScoringRule = (row) => {
  if (row.auditor_finding === "Agree") return 1;
  if (row.auditor_finding === "Disagree") return 0;
  return null;
};

const systemConsistencyRule: ScoringRule = (row) => {
  if (row.clinical_decision == null || row.auto_insight_decision == null) return null;
  return normalize(row.clinical_decision) === normalize(row.auto_insight_decision) ? 1 : 0;
};

const rules: ScoringRule[] = [humanFindingRule, systemConsistencyRule];

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export function scoreCase(row: ScorableRow): 0 | 1 {
  for (const rule of rules) {
    const result = rule(row);
    if (result !== null) return result;
  }
  return 0;
}

export function hasHumanFinding(row: ScorableRow): boolean {
  return row.auditor_finding === "Agree" || row.auditor_finding === "Disagree";
}
