import type { EnrichedCase } from "@/types/domain";
import { formatWeekLabel } from "@/lib/formatWeek";

export interface Insight {
  label: string;
  detail: string;
}

interface GroupStat {
  key: string;
  accuracy: number;
  total: number;
}

export function groupAccuracy(cases: EnrichedCase[], keyFn: (c: EnrichedCase) => string): GroupStat[] {
  const map = new Map<string, { total: number; score: number }>();
  for (const c of cases) {
    const k = keyFn(c);
    if (!k) continue;
    const entry = map.get(k) ?? { total: 0, score: 0 };
    entry.total += 1;
    entry.score += c.score;
    map.set(k, entry);
  }
  return Array.from(map.entries()).map(([key, v]) => ({
    key,
    accuracy: v.total ? (v.score / v.total) * 100 : 0,
    total: v.total,
  }));
}

export function buildInsights(cases: EnrichedCase[]): Insight[] {
  const insights: Insight[] = [];
  if (cases.length === 0) return insights;

  const byTech = groupAccuracy(cases, (c) => c.technician_name).filter((t) => t.total >= 3);
  if (byTech.length > 0) {
    const best = [...byTech].sort((a, b) => b.accuracy - a.accuracy)[0];
    const worst = [...byTech].sort((a, b) => a.accuracy - b.accuracy)[0];
    insights.push({
      label: "Highest accuracy technician",
      detail: `${best.key} — ${best.accuracy.toFixed(1)}% (${best.total} audits)`,
    });
    insights.push({
      label: "Lowest accuracy technician",
      detail: `${worst.key} — ${worst.accuracy.toFixed(1)}% (${worst.total} audits)`,
    });
  }

  const bySite = groupAccuracy(cases, (c) => c.site);
  if (bySite.length > 1) {
    const best = [...bySite].sort((a, b) => b.accuracy - a.accuracy)[0];
    const worst = [...bySite].sort((a, b) => a.accuracy - b.accuracy)[0];
    insights.push({ label: "Best performing site", detail: `${best.key} — ${best.accuracy.toFixed(1)}%` });
    insights.push({ label: "Worst performing site", detail: `${worst.key} — ${worst.accuracy.toFixed(1)}%` });
  }

  const bySupervisor = groupAccuracy(cases, (c) => c.supervisor).filter((s) => s.total >= 3);
  if (bySupervisor.length > 1) {
    const best = [...bySupervisor].sort((a, b) => b.accuracy - a.accuracy)[0];
    insights.push({
      label: "Top performing supervisor/AM team",
      detail: `${best.key} — ${best.accuracy.toFixed(1)}% (${best.total} audits)`,
    });
  }

  const categoryFailures = new Map<string, number>();
  for (const c of cases) {
    if (c.score === 0 && c.category) {
      categoryFailures.set(c.category, (categoryFailures.get(c.category) ?? 0) + 1);
    }
  }
  if (categoryFailures.size > 0) {
    const top = Array.from(categoryFailures.entries()).sort((a, b) => b[1] - a[1])[0];
    insights.push({ label: "Most common failure category", detail: `${top[0]} — ${top[1]} failures` });
  }

  const weeks = Array.from(new Set(cases.map((c) => c.week)))
    .filter(Boolean)
    .sort();
  if (weeks.length >= 2) {
    const byWeek = groupAccuracy(cases, (c) => c.week);
    const last = byWeek.find((w) => w.key === weeks[weeks.length - 1]);
    const prev = byWeek.find((w) => w.key === weeks[weeks.length - 2]);
    if (last && prev) {
      const delta = last.accuracy - prev.accuracy;
      insights.push({
        label: "Biggest week-over-week change",
        detail: `${delta >= 0 ? "+" : ""}${delta.toFixed(1)} pts (${formatWeekLabel(weeks[weeks.length - 2])} → ${formatWeekLabel(weeks[weeks.length - 1])})`,
      });
    }
  }

  const months = Array.from(new Set(cases.map((c) => c.month)))
    .filter((m): m is string => !!m)
    .sort();
  if (months.length >= 2) {
    const byMonth = groupAccuracy(cases, (c) => c.month ?? "");
    const last = byMonth.find((m) => m.key === months[months.length - 1]);
    const prev = byMonth.find((m) => m.key === months[months.length - 2]);
    if (last && prev) {
      const delta = last.accuracy - prev.accuracy;
      insights.push({
        label: "Biggest month-over-month change",
        detail: `${delta >= 0 ? "+" : ""}${delta.toFixed(1)} pts (${months[months.length - 2]} → ${months[months.length - 1]})`,
      });
    }
  }

  return insights;
}
