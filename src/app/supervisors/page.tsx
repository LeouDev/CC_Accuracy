"use client";

import { useMemo } from "react";
import { useFilteredCases } from "@/hooks/useEnrichedData";
import { EChart } from "@/components/charts/EChart";
import { DataGate } from "@/components/ui/DataGate";
import { DataTable } from "@/components/tables/DataTable";
import { AccuracyCell } from "@/components/ui/AccuracyCell";

interface SupervisorStat {
  supervisor: string;
  teamSize: number;
  total: number;
  passing: number;
  accuracy: number;
}

export default function SupervisorsPage() {
  const cases = useFilteredCases();

  const stats = useMemo(() => {
    const map = new Map<string, { total: number; passing: number; techs: Set<string> }>();
    for (const c of cases) {
      const entry = map.get(c.supervisor) ?? { total: 0, passing: 0, techs: new Set<string>() };
      if (c.score !== null) {
        entry.total += 1;
        entry.passing += c.score;
      }
      entry.techs.add(c.technician_msid);
      map.set(c.supervisor, entry);
    }
    const arr: SupervisorStat[] = Array.from(map.entries()).map(([supervisor, v]) => ({
      supervisor,
      teamSize: v.techs.size,
      total: v.total,
      passing: v.passing,
      accuracy: v.total ? (v.passing / v.total) * 100 : 0,
    }));
    arr.sort((a, b) => b.accuracy - a.accuracy);
    return arr;
  }, [cases]);

  return (
    <div className="space-y-6">
      <DataGate hasRows={stats.length > 0}>
        <div className="chart-card p-4">
          <h2 className="mb-3 text-sm font-semibold">Accuracy by Supervisor / AM</h2>
          <EChart
            option={{
              backgroundColor: "transparent",
              grid: { left: 140, right: 30, top: 10, bottom: 20 },
              tooltip: {},
              xAxis: {
                type: "value",
                max: 100,
                splitNumber: 2,
                axisLabel: { color: "#94a3b8", formatter: "{value}%" },
              },
              yAxis: {
                type: "category",
                data: [...stats].reverse().map((s) => s.supervisor),
                axisLabel: { color: "#94a3b8", fontSize: 10 },
              },
              series: [
                {
                  type: "bar",
                  data: [...stats].reverse().map((s) => Number(s.accuracy.toFixed(1))),
                  color: "#4f8dff",
                },
              ],
            }}
            height={Math.max(240, stats.length * 28)}
          />
        </div>

        <DataTable
          rows={stats}
          filename="supervisor-leaderboard"
          columns={[
            { key: "supervisor", header: "Supervisor / AM", accessor: (r) => r.supervisor },
            { key: "teamSize", header: "Team Size", accessor: (r) => r.teamSize },
            { key: "total", header: "Total Audits", accessor: (r) => r.total },
            {
              key: "accuracy",
              header: "Accuracy %",
              accessor: (r) => Number(r.accuracy.toFixed(1)),
              render: (r) => <AccuracyCell value={r.accuracy} />,
            },
            { key: "failurePct", header: "Failure %", accessor: (r) => Number((100 - r.accuracy).toFixed(1)) },
          ]}
        />
      </DataGate>
    </div>
  );
}
