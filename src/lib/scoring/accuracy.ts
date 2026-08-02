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
 *   Auditor Finding | Clinical vs AutoDecisionRecommendation | Score
 *   Agree            | match or no match                     | 1   (always)
 *   blank            | match                                  | 1
 *   blank            | no match                               | 0
 *   Disagree         | match                                  | 0   (flipped)
 *   Disagree         | no match                               | 1   (flipped)
 *
 * Excluded (null, not counted in Total Audits/Accuracy) when Clinical or
 * AutoDecisionRecommendation is blank - there's nothing to compare yet.
 */
export function scoreCase(row: ScorableRow): 0 | 1 | null {
  if (row.clinical_decision == null || row.auto_decision_recommendation == null) return null;

  if (row.auditor_finding === "Agree") return 1;

  const matches = normalize(row.clinical_decision) === normalize(row.auto_decision_recommendation);

  if (row.auditor_finding === "Disagree") {
    return matches ? 0 : 1;
  }
  return matches ? 1 : 0;
}

export function hasHumanFinding(row: Pick<RawDataRecord, "auditor_finding">): boolean {
  return row.auditor_finding === "Agree" || row.auditor_finding === "Disagree";
}
