"use client";

import { useMemo } from "react";
import { useFilteredCases } from "@/hooks/useEnrichedData";
import { EChart } from "@/components/charts/EChart";
import { DataTable } from "@/components/tables/DataTable";

export default function CategoryPage() {
  const cases = useFilteredCases();

  const failuresByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of cases) {
      if (c.score === 0 && c.category) {
        map.set(c.category, (map.get(c.category) ?? 0) + 1);
      }
    }
    const arr = Array.from(map.entries()).map(([key, count]) => ({ key, count }));
    arr.sort((a, b) => b.count - a.count);
    return arr;
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
        No Category/Subcategory data found in the uploaded Raw Data file, so category-level failure
        analysis isn&apos;t available for this dataset. Once the Raw Data file includes Category /
        Subcategory columns, this Pareto and ranking will populate automatically.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="glass-card p-4">
        <h2 className="mb-3 text-sm font-semibold">Failure Pareto — Category</h2>
        <EChart
          option={{
            backgroundColor: "transparent",
            grid: { left: 40, right: 40, top: 30, bottom: 60 },
            tooltip: { trigger: "axis" },
            legend: { data: ["Failures", "Cumulative %"], textStyle: { color: "#94a3b8" } },
            xAxis: {
              type: "category",
              data: failuresByCategory.map((c) => c.key),
              axisLabel: { color: "#94a3b8", rotate: 45, fontSize: 10 },
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
              { name: "Failures", type: "bar", data: failuresByCategory.map((c) => c.count), color: "#f87171" },
              {
                name: "Cumulative %",
                type: "line",
                yAxisIndex: 1,
                data: cumulativePct,
                color: "#fbbf24",
              },
            ],
          }}
          height={340}
        />
      </div>

      <DataTable
        rows={failuresByCategory}
        filename="category-failures"
        columns={[
          { key: "key", header: "Category", accessor: (r) => r.key },
          { key: "count", header: "Failures", accessor: (r) => r.count },
        ]}
      />
    </div>
  );
}
