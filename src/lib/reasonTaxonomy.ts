/**
 * Best-effort categorization of failing cases from freeform Comments text,
 * using the standardized reason taxonomy from the legacy Excel dashboard.
 * This is NOT authoritative - it's a keyword heuristic used only as a
 * fallback when a case has no real Category value. Always prefer a real
 * `category` column when present.
 */

interface ReasonRule {
  label: string;
  /** Decision prefix this reason applies to, derived from clinical_decision. null = applies regardless. */
  prefix: "Approval" | "Pend" | null;
  test: (comment: string) => boolean;
}

const RULES: ReasonRule[] = [
  {
    label: "Missed Diagnosis/A1c",
    prefix: "Pend",
    test: (c) => /a1c/.test(c) && /(missed|missing)/.test(c) && /diagnos/.test(c),
  },
  {
    label: "Diagnosis/A1c not on chart",
    prefix: "Approval",
    test: (c) => /not on (the )?chart/.test(c) && /(a1c|diagnos)/.test(c),
  },
  {
    label: "Missed Diagnosis",
    prefix: "Pend",
    test: (c) => /(missed|missing)/.test(c) && /diagnos/.test(c),
  },
  {
    label: "Diagnosis not on chart",
    prefix: "Approval",
    test: (c) => /diagnos/.test(c) && /not on (the )?chart/.test(c),
  },
  {
    label: "No QL, TD or TCSE",
    prefix: "Pend",
    test: (c) => /\bql\b/.test(c) && /\btd\b/.test(c) && /tcse/.test(c),
  },
  {
    label: "No QL or TCSE",
    prefix: "Pend",
    test: (c) => (/\bql\b/.test(c) || /tcse/.test(c)) && /no /.test(c),
  },
  {
    label: "Missed QL",
    prefix: "Approval",
    test: (c) => /\bql\b/.test(c) && /(missed|missing)/.test(c),
  },
  {
    label: "Missed TD",
    prefix: "Approval",
    test: (c) => /\btd\b/.test(c) && /(missed|missing)/.test(c),
  },
  {
    label: "Wrong Radio Button",
    prefix: null,
    test: (c) => /radio button/.test(c),
  },
  {
    label: "Auth on file",
    prefix: "Approval",
    test: (c) => /auth\b.*\bfile/.test(c) || /auth on file/.test(c),
  },
  {
    label: "Chart note mismatch",
    prefix: "Approval",
    test: (c) => /chart note/.test(c) && /mismatch/.test(c),
  },
  {
    label: "Multiple/Incorrect Member or No Member Identifiers",
    prefix: null,
    test: (c) =>
      /mismatch member/.test(c) || /no (member )?identifiers?/.test(c) || /incomplete name/.test(c),
  },
  {
    label: "Tech incorrect process, final outcome is valid",
    prefix: "Approval",
    test: (c) => /incorrect process/.test(c) && /valid/.test(c),
  },
];

export function classifyReason(
  comment: string | null | undefined,
  clinicalDecision: string | null | undefined,
): string | null {
  if (!comment) return null;
  const c = comment.toLowerCase();
  const decision = (clinicalDecision ?? "").trim().toLowerCase();
  const prefix: "Approval" | "Pend" | null =
    decision === "approve" ? "Approval" : decision === "pend" ? "Pend" : null;

  for (const rule of RULES) {
    if (rule.prefix && prefix && rule.prefix !== prefix) continue;
    if (rule.test(c)) {
      const usedPrefix = rule.prefix ?? prefix;
      return usedPrefix ? `${usedPrefix} Error: ${rule.label}` : rule.label;
    }
  }
  return null;
}
