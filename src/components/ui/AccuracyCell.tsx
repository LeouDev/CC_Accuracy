import { ACCURACY_TARGET_PCT } from "@/lib/constants";

/** Renders an accuracy value as a colored percentage: green at/above target, red below. */
export function AccuracyCell({ value }: { value: number }) {
  const passing = value >= ACCURACY_TARGET_PCT;
  return (
    <span className={passing ? "font-semibold text-success" : "font-semibold text-danger"}>
      {value.toFixed(1)}%
    </span>
  );
}
