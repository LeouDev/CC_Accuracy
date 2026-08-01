"use client";

import { useMemo } from "react";
import { useFilteredCases } from "@/hooks/useEnrichedData";
import { KpiCard } from "@/components/ui/KpiCard";
import { EChart } from "@/components/charts/EChart";
import { DataGate } from "@/components/ui/DataGate";
import { DataTable } from "@/components/tables/DataTable";

interface AuditorStat {
  auditor: string;
  volume: number;
  agree: number;
  disagree: number;
  disagreeRate: number;
}

export default function AuditorsPage() {
  const cases = useFilteredCases();

  const coverage = useMemo(() => {
    const audited = cases.filter((c) => c.has_human_finding).length;
    return cases.length ? (audited / cases.length) * 100 : 0;
  }, [cases]);

  const stats = useMemo(() => {
    const map = new Map<string, { agree: number; disagree: number }>();
    for (const c of cases) {
      if (!c.auditor || !c.has_human_finding) continue;
      const entry = map.get(c.auditor) ?? { agree: 0, disagree: 0 };
      if (c.auditor_finding === "Agree") entry.agree += 1;
      else entry.disagree += 1;
      map.set(c.auditor, entry);
    }
    const arr: AuditorStat[] = Array.from(map.entries()).map(([auditor, v]) => ({
      auditor,
      volume: v.agree + v.disagree,
      agree: v.agree,
      disagree: v.disagree,
      disagreeRate: v.agree + v.disagree ? (v.disagree / (v.agree + v.disagree)) * 100 : 0,
    }));
    arr.sort((a, b) => b.volume - a.volume);
    return arr;
  }, [cases]);

  return (
    <div className="space-y-6">
      <KpiCard
        label="Audit Coverage"
        value={`${coverage.toFixed(1)}%`}
        sub="Share of cases with a human auditor finding"
      />

      <DataGate hasRows={stats.length > 0}>
        <div className="glass-card p-4">
          <h2 className="mb-3 text-sm font-semibold">Audit Volume by Auditor</h2>
          <EChart
            option={{
              backgroundColor: "transparent",
              grid: { left: 100, right: 30, top: 10, bottom: 20 },
              tooltip: { trigger: "axis" },
              xAxis: { type: "value", axisLabel: { color: "#94a3b8" } },
              yAxis: {
                type: "category",
                data: [...stats].reverse().map((s) => s.auditor),
                axisLabel: { color: "#94a3b8" },
              },
              series: [
                { type: "bar", data: [...stats].reverse().map((s) => s.volume), color: "#4f8dff" },
              ],
            }}
            height={Math.max(240, stats.length * 28)}
          />
        </div>

        <DataTable
          rows={stats}
          filename="auditor-productivity"
          columns={[
            { key: "auditor", header: "Auditor", accessor: (r) => r.auditor },
            { key: "volume", header: "Cases Audited", accessor: (r) => r.volume },
            { key: "agree", header: "Agree", accessor: (r) => r.agree },
            { key: "disagree", header: "Disagree", accessor: (r) => r.disagree },
            { key: "disagreeRate", header: "Disagree Rate %", accessor: (r) => Number(r.disagreeRate.toFixed(1)) },
          ]}
        />
      </DataGate>
    </div>
  );
}
