import type { RawDataRecord } from "@/types/domain";

export type ScorableRow = Pick<
  RawDataRecord,
  "clinical_decision" | "auto_decision_recommendation" | "auditor_finding"
>;

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Accuracy scoring, confirmed truth table:
 *
 *   Clinical vs AutoDecisionRecommendation | Auditor Finding | Score
 *   match                                  | Agree / blank   | 1
 *   no match                               | Agree / blank   | 0
 *   match                                  | Disagree        | 0   (flipped)
 *   no match                               | Disagree        | 1   (flipped)
 *
 * Excluded (null, not counted in Total Audits/Accuracy) when Clinical or
 * AutoDecisionRecommendation is blank - there's nothing to compare yet.
 */
export function scoreCase(row: ScorableRow): 0 | 1 | null {
  if (row.clinical_decision == null || row.auto_decision_recommendation == null) return null;

  const matches = normalize(row.clinical_decision) === normalize(row.auto_decision_recommendation);
  const base: 0 | 1 = matches ? 1 : 0;

  if (row.auditor_finding === "Disagree") {
    return base === 1 ? 0 : 1;
  }
  return base;
}

export function hasHumanFinding(row: Pick<RawDataRecord, "auditor_finding">): boolean {
  return row.auditor_finding === "Agree" || row.auditor_finding === "Disagree";
}
