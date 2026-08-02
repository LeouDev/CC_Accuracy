"use client";

import { useMemo } from "react";
import { useFilteredCases } from "@/hooks/useEnrichedData";
import { groupAccuracy } from "@/lib/insights";
import { EChart } from "@/components/charts/EChart";
import { DataGate } from "@/components/ui/DataGate";
import { DataTable } from "@/components/tables/DataTable";
import { AccuracyCell } from "@/components/ui/AccuracyCell";

export default function TechniciansPage() {
  const cases = useFilteredCases();

  const ranking = useMemo(() => {
    const grouped = groupAccuracy(cases, (c) => c.technician_name);
    return grouped.sort((a, b) => b.accuracy - a.accuracy);
  }, [cases]);

  const top10 = ranking.slice(0, 10);
  const bottom10 = [...ranking].sort((a, b) => a.accuracy - b.accuracy).slice(0, 10);

  return (
    <div className="space-y-6">
      <DataGate hasRows={ranking.length > 0}>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="chart-card p-4">
            <h2 className="mb-3 text-sm font-semibold">Top 10 Technicians</h2>
            <EChart
              option={{
                backgroundColor: "transparent",
                grid: { left: 120, right: 30, top: 10, bottom: 20 },
                tooltip: {},
                xAxis: {
                  type: "value",
                  max: 100,
                  splitNumber: 2,
                  axisLabel: { color: "#94a3b8", formatter: "{value}%" },
                },
                yAxis: {
                  type: "category",
                  data: [...top10].reverse().map((t) => t.key),
                  axisLabel: { color: "#94a3b8", fontSize: 10 },
                },
                series: [
                  {
                    type: "bar",
                    data: [...top10].reverse().map((t) => Number(t.accuracy.toFixed(1))),
                    color: "#4ade80",
                  },
                ],
              }}
              height={320}
            />
          </div>
          <div className="chart-card p-4">
            <h2 className="mb-3 text-sm font-semibold">Lowest 10 Technicians</h2>
            <EChart
              option={{
                backgroundColor: "transparent",
                grid: { left: 120, right: 30, top: 10, bottom: 20 },
                tooltip: {},
                xAxis: {
                  type: "value",
                  max: 100,
                  splitNumber: 2,
                  axisLabel: { color: "#94a3b8", formatter: "{value}%" },
                },
                yAxis: {
                  type: "category",
                  data: [...bottom10].reverse().map((t) => t.key),
                  axisLabel: { color: "#94a3b8", fontSize: 10 },
                },
                series: [
                  {
                    type: "bar",
                    data: [...bottom10].reverse().map((t) => Number(t.accuracy.toFixed(1))),
                    color: "#f87171",
                  },
                ],
              }}
              height={320}
            />
          </div>
        </div>

        <DataTable
          rows={ranking}
          filename="technician-ranking"
          columns={[
            { key: "key", header: "Technician", accessor: (r) => r.key },
            {
              key: "accuracy",
              header: "Accuracy %",
              accessor: (r) => Number(r.accuracy.toFixed(1)),
              render: (r) => <AccuracyCell value={r.accuracy} />,
            },
            { key: "total", header: "Total Audits", accessor: (r) => r.total },
            { key: "failing", header: "Failed Audits", accessor: (r) => r.failing },
          ]}
        />
      </DataGate>
    </div>
  );
}
