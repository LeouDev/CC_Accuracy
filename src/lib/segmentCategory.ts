const SEGMENT_TO_CATEGORY: Record<string, string> = {
  "external commercial (lctrx)": "Commercial",
  "tpa (lctrx)": "Commercial",
  "uhcgp exchange": "Commercial",
  "fresh start": "Commercial",
  pbm: "Commercial",
  "external commerical (traditional)": "Commercial",
  "external commercial (traditional)": "Commercial",
  hix: "Commercial",
  "egwp/external part d": "Commercial",
  "ffs medicaid": "Commercial",
  "uhc community & state": "Commercial",
  "uhcmr mapd & pdp": "M&R",
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

/** Maps a raw BusinessSegment value to its top-level category (Commercial vs M&R). */
export function getSegmentCategory(businessSegment: string | null | undefined): string {
  if (!businessSegment) return "Unspecified";
  return SEGMENT_TO_CATEGORY[normalize(businessSegment)] ?? "Unspecified";
}
