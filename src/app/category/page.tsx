"use client";

import { useMemo } from "react";
import { useFilteredCases } from "@/hooks/useEnrichedData";
import { EChart } from "@/components/charts/EChart";
import { DataTable } from "@/components/tables/DataTable";
import { classifyReason } from "@/lib/reasonTaxonomy";

export default function CategoryPage() {
  const cases = useFilteredCases();

  const { failuresByCategory, usedFallback } = useMemo(() => {
    const map = new Map<string, number>();
    let fallbackUsed = false;
    for (const c of cases) {
      if (c.score !== 0) continue;
      let key = c.category;
      if (!key) {
        key = classifyReason(c.comments, c.clinical_decision);
        if (key) fallbackUsed = true;
      }
      if (!key) continue;
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    const arr = Array.from(map.entries()).map(([key, count]) => ({ key, count }));
    arr.sort((a, b) => b.count - a.count);
    return { failuresByCategory: arr, usedFallback: fallbackUsed };
  }, [cases]);

  const totalFailures = failuresByCategory.reduce((s, c) => s + c.count, 0);
  const cumulativePct = useMemo(() => {
    let cumulative = 0;
    return failuresByCategory.map((c) => {
      cumulative += c.count;
      return totalFailures ? Number(((cumulative / totalFailures) * 100).toFixed(1)) : 0;
    });
  }, [failuresByCategory, totalFailures]);

  if (failuresByCategory.length === 0) {
    return (
      <div className="glass-card p-8 text-center text-sm text-muted">
        No Category data and no Comments text found on failing cases, so category-level failure
        analysis isn&apos;t available for this dataset yet.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {usedFallback && (
        <div className="glass-card border-warning/40 p-3 text-xs text-muted">
          Some categories here are <strong className="text-foreground">auto-suggested from Comments text</strong>{" "}
          (best-effort keyword match against the standard reason list), not an authoritative Category field. Treat
          them as a starting point, not ground truth.
        </div>
      )}
      <div className="chart-card p-4">
        <h2 className="mb-3 text-sm font-semibold">Failure Pareto — Reason</h2>
        <EChart
          option={{
            backgroundColor: "transparent",
            grid: { left: 40, right: 40, top: 50, bottom: 90 },
            tooltip: { trigger: "axis" },
            legend: { data: ["Failures", "Cumulative %"], top: 0, textStyle: { color: "#94a3b8" } },
            xAxis: {
              type: "category",
              data: failuresByCategory.map((c) => c.key),
              axisLabel: { color: "#94a3b8", rotate: 45, fontSize: 9, width: 100, overflow: "truncate" },
            },
            yAxis: [
              { type: "value", name: "Failures", axisLabel: { color: "#94a3b8" } },
              {
                type: "value",
                name: "Cumulative %",
                max: 100,
                axisLabel: { color: "#94a3b8", formatter: "{value}%" },
              },
            ],
            series: [
              {
                name: "Failures",
                type: "bar",
                data: failuresByCategory.map((c) => c.count),
                color: "#f87171",
              },
              {
                name: "Cumulative %",
                type: "line",
                yAxisIndex: 1,
                data: cumulativePct,
                color: "#fbbf24",
                markLine: {
                  silent: true,
                  symbol: "none",
                  lineStyle: { color: "#94a3b8", type: "dashed" },
                  label: {
                    formatter: "80% threshold",
                    color: "#94a3b8",
                    position: "insideStartTop",
                  },
                  data: [{ yAxis: 80 }],
                },
              },
            ],
          }}
          height={380}
        />
      </div>

      <DataTable
        rows={failuresByCategory}
        filename="category-failures"
        columns={[
          { key: "key", header: "Category / Reason", accessor: (r) => r.key },
          { key: "count", header: "Failures", accessor: (r) => r.count },
        ]}
      />
    </div>
  );
}
