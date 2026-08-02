"use client";

import { useMemo } from "react";
import { useFilteredCases } from "@/hooks/useEnrichedData";
import { groupAccuracy } from "@/lib/insights";
import { EChart } from "@/components/charts/EChart";
import { DataGate } from "@/components/ui/DataGate";
import { DataTable } from "@/components/tables/DataTable";
import { AccuracyCell } from "@/components/ui/AccuracyCell";

export default function SitesPage() {
  const cases = useFilteredCases();
  const stats = useMemo(
    () => groupAccuracy(cases, (c) => c.site).sort((a, b) => b.accuracy - a.accuracy),
    [cases],
  );

  return (
    <div className="space-y-6">
      <DataGate hasRows={stats.length > 0}>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="chart-card p-4">
            <h2 className="mb-3 text-sm font-semibold">Accuracy by Site</h2>
            <EChart
              option={{
                backgroundColor: "transparent",
                grid: { left: 100, right: 30, top: 10, bottom: 20 },
                tooltip: {},
                xAxis: { type: "value", max: 100, axisLabel: { color: "#94a3b8", formatter: "{value}%" } },
                yAxis: {
                  type: "category",
                  data: [...stats].reverse().map((s) => s.key),
                  axisLabel: { color: "#94a3b8" },
                },
                series: [
                  {
                    type: "bar",
                    data: [...stats].reverse().map((s) => Number(s.accuracy.toFixed(1))),
                    color: "#2dd4c8",
                  },
                ],
              }}
              height={260}
            />
          </div>
          <div className="chart-card p-4">
            <h2 className="mb-3 text-sm font-semibold">Case Volume Distribution</h2>
            <EChart
              option={{
                backgroundColor: "transparent",
                tooltip: { trigger: "item" },
                legend: { bottom: 0, textStyle: { color: "#94a3b8", fontSize: 10 } },
                series: [
                  {
                    type: "pie",
                    radius: ["40%", "70%"],
                    data: stats.map((s) => ({ name: s.key, value: s.total })),
                    label: { color: "#94a3b8" },
                  },
                ],
              }}
              height={260}
            />
          </div>
        </div>

        <DataTable
          rows={stats}
          filename="site-comparison"
          columns={[
            { key: "key", header: "Site", accessor: (r) => r.key },
            { key: "total", header: "Total Audits", accessor: (r) => r.total },
            {
              key: "accuracy",
              header: "Accuracy %",
              accessor: (r) => Number(r.accuracy.toFixed(1)),
              render: (r) => <AccuracyCell value={r.accuracy} />,
            },
          ]}
        />
      </DataGate>
    </div>
  );
}
