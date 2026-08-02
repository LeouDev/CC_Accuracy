import { ACCURACY_TARGET_PCT } from "@/lib/constants";

const ACCURACY_ROWS: { finding: string; comparison: string; score: string; tone: "success" | "danger" }[] = [
  { finding: "Agree", comparison: "Match or no match", score: "1 (always)", tone: "success" },
  { finding: "Blank / not completed", comparison: "Match", score: "1", tone: "success" },
  { finding: "Blank / not completed", comparison: "No match", score: "0", tone: "danger" },
  { finding: "Disagree", comparison: "Match", score: "0 (flipped)", tone: "danger" },
  { finding: "Disagree", comparison: "No match", score: "1 (flipped)", tone: "success" },
];

const SEGMENT_ROWS: { segment: string; category: string }[] = [
  { segment: "External Commercial (LCTRx)", category: "Commercial" },
  { segment: "TPA (LCTRx)", category: "Commercial" },
  { segment: "UHCGP Exchange", category: "Commercial" },
  { segment: "Fresh Start", category: "Commercial" },
  { segment: "PBM", category: "Commercial" },
  { segment: "External Commercial (Traditional)", category: "Commercial" },
  { segment: "HIX", category: "Commercial" },
  { segment: "EGWP/External Part D", category: "Commercial" },
  { segment: "FFS Medicaid", category: "Commercial" },
  { segment: "UHC Community & State", category: "Commercial" },
  { segment: "UHCMR MAPD & PDP", category: "M&R" },
];

const SCORE_TONE_CLASS: Record<"success" | "danger", string> = {
  success: "text-success",
  danger: "text-danger",
};

export default function ScoringGuidePage() {
  return (
    <div className="space-y-6">
      <div className="glass-card p-4">
        <h1 className="text-lg font-semibold">Scoring Logic Reference</h1>
        <p className="mt-1 text-sm text-muted">
          A plain-language legend for how every score and status shown across this dashboard is
          calculated. This tab is reference-only — it does not reflect the currently uploaded data.
        </p>
      </div>

      <div className="glass-card p-4">
        <h2 className="mb-1 text-sm font-semibold">Accuracy Score (per case)</h2>
        <p className="mb-3 text-xs text-muted">
          Compares <strong className="text-foreground">ClinicalDecisionByEnhancedTechnician</strong> (the
          technician&apos;s decision) against{" "}
          <strong className="text-foreground">AutoDecisionRecommendation</strong>, then applies the
          Auditor Finding as an override.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-card-border text-muted">
                <th className="px-3 py-2 font-medium">Auditor Finding</th>
                <th className="px-3 py-2 font-medium">Clinical vs. Auto Decision Recommendation</th>
                <th className="px-3 py-2 font-medium">Score</th>
              </tr>
            </thead>
            <tbody>
              {ACCURACY_ROWS.map((r, i) => (
                <tr key={i} className="border-b border-card-border/50">
                  <td className="px-3 py-2">{r.finding}</td>
                  <td className="px-3 py-2">{r.comparison}</td>
                  <td className={`px-3 py-2 font-semibold ${SCORE_TONE_CLASS[r.tone]}`}>{r.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 rounded-lg border border-card-border p-3 text-xs text-muted">
          <strong className="text-foreground">Excluded (score = blank):</strong> if either{" "}
          <strong className="text-foreground">ClinicalDecisionByEnhancedTechnician</strong> or{" "}
          <strong className="text-foreground">AutoDecisionRecommendation</strong> is blank, the case has
          nothing to compare yet and is excluded from Total Audits and Accuracy entirely — it does not
          count as passing or failing.
        </p>
        <p className="mt-2 text-xs text-muted">
          Overall Accuracy = Passing Audits ÷ Total Audits (excluded cases removed from both sides).
          Target benchmark shown on trend charts: <strong className="text-foreground">{ACCURACY_TARGET_PCT}%</strong>.
        </p>
      </div>

      <div className="glass-card p-4">
        <h2 className="mb-1 text-sm font-semibold">Auditor Audit Compliance (per case)</h2>
        <p className="mb-3 text-xs text-muted">
          Tracks whether a case that has an assigned auditor actually received a completed finding.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-card-border text-muted">
                <th className="px-3 py-2 font-medium">Assigned Auditor?</th>
                <th className="px-3 py-2 font-medium">Auditor Finding</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-card-border/50">
                <td className="px-3 py-2">Yes</td>
                <td className="px-3 py-2">Agree or Disagree (completed)</td>
                <td className="px-3 py-2 font-semibold text-success">Audited</td>
              </tr>
              <tr className="border-b border-card-border/50">
                <td className="px-3 py-2">Yes</td>
                <td className="px-3 py-2">Blank / not completed</td>
                <td className="px-3 py-2 font-semibold text-danger">Not Audited</td>
              </tr>
              <tr className="border-b border-card-border/50">
                <td className="px-3 py-2">No</td>
                <td className="px-3 py-2">—</td>
                <td className="px-3 py-2 font-semibold text-muted">Excluded from compliance</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted">
          Auditor Audit Compliance = Audited ÷ (Audited + Not Audited), scoped only to cases that have an
          assigned auditor. See the Auditors tab.
        </p>
      </div>

      <div className="glass-card p-4">
        <h2 className="mb-1 text-sm font-semibold">Business Segment → Category</h2>
        <p className="mb-3 text-xs text-muted">
          Every <strong className="text-foreground">BusinessSegment</strong> value is grouped into
          Commercial or M&amp;R for the Segment filter. Anything not in this list shows as
          &quot;Unspecified&quot;.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-card-border text-muted">
                <th className="px-3 py-2 font-medium">Business Segment</th>
                <th className="px-3 py-2 font-medium">Category</th>
              </tr>
            </thead>
            <tbody>
              {SEGMENT_ROWS.map((r) => (
                <tr key={r.segment} className="border-b border-card-border/50">
                  <td className="px-3 py-2">{r.segment}</td>
                  <td className="px-3 py-2 font-semibold">{r.category}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
