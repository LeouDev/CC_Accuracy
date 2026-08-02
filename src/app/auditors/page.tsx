"use client";

import { useMemo } from "react";
import { useFilteredCases } from "@/hooks/useEnrichedData";
import { KpiCard } from "@/components/ui/KpiCard";
import { EChart } from "@/components/charts/EChart";
import { DataGate } from "@/components/ui/DataGate";
import { DataTable } from "@/components/tables/DataTable";

interface AuditorStat {
  auditor: string;
  assigned: number;
  audited: number;
  notAudited: number;
  complianceRate: number;
  agree: number;
  disagree: number;
  disagreeRate: number;
}

export default function AuditorsPage() {
  const cases = useFilteredCases();

  // Assigned auditor + finding blank/null -> "Not Audited"; assigned + Agree/Disagree -> "Audited";
  // no assigned auditor -> excluded from compliance entirely.
  const compliance = useMemo(() => {
    let audited = 0;
    let notAudited = 0;
    for (const c of cases) {
      if (!c.auditor) continue;
      if (c.has_human_finding) audited += 1;
      else notAudited += 1;
    }
    const assigned = audited + notAudited;
    return { audited, notAudited, assigned, rate: assigned ? (audited / assigned) * 100 : 0 };
  }, [cases]);

  const stats = useMemo(() => {
    const map = new Map<
      string,
      { audited: number; notAudited: number; agree: number; disagree: number }
    >();
    for (const c of cases) {
      if (!c.auditor) continue;
      const entry = map.get(c.auditor) ?? { audited: 0, notAudited: 0, agree: 0, disagree: 0 };
      if (c.has_human_finding) {
        entry.audited += 1;
        if (c.auditor_finding === "Agree") entry.agree += 1;
        else entry.disagree += 1;
      } else {
        entry.notAudited += 1;
      }
      map.set(c.auditor, entry);
    }
    const arr: AuditorStat[] = Array.from(map.entries()).map(([auditor, v]) => {
      const assigned = v.audited + v.notAudited;
      return {
        auditor,
        assigned,
        audited: v.audited,
        notAudited: v.notAudited,
        complianceRate: assigned ? (v.audited / assigned) * 100 : 0,
        agree: v.agree,
        disagree: v.disagree,
        disagreeRate: v.audited ? (v.disagree / v.audited) * 100 : 0,
      };
    });
    arr.sort((a, b) => b.assigned - a.assigned);
    return arr;
  }, [cases]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard
          label="Auditor Audit Compliance"
          value={`${compliance.rate.toFixed(1)}%`}
          sub="Audited / (Audited + Not Audited)"
          tone={compliance.rate >= 90 ? "success" : compliance.rate >= 75 ? "warning" : "danger"}
        />
        <KpiCard label="Assigned Cases" value={compliance.assigned.toLocaleString()} />
        <KpiCard label="Audited" value={compliance.audited.toLocaleString()} tone="success" />
        <KpiCard label="Not Audited" value={compliance.notAudited.toLocaleString()} tone="danger" />
      </div>

      <DataGate hasRows={stats.length > 0}>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="chart-card p-4 lg:col-span-2">
            <h2 className="mb-3 text-sm font-semibold">Audit Status by Auditor</h2>
            <EChart
              option={{
                backgroundColor: "transparent",
                grid: { left: 100, right: 30, top: 36, bottom: 20 },
                tooltip: { trigger: "axis" },
                legend: { top: 0, textStyle: { color: "#94a3b8", fontSize: 10 } },
                xAxis: { type: "value", axisLabel: { color: "#94a3b8" } },
                yAxis: {
                  type: "category",
                  data: [...stats].reverse().map((s) => s.auditor),
                  axisLabel: { color: "#94a3b8" },
                },
                series: [
                  {
                    name: "Audited",
                    type: "bar",
                    stack: "status",
                    data: [...stats].reverse().map((s) => s.audited),
                    color: "#4ade80",
                  },
                  {
                    name: "Not Audited",
                    type: "bar",
                    stack: "status",
                    data: [...stats].reverse().map((s) => s.notAudited),
                    color: "#f87171",
                  },
                ],
              }}
              height={Math.max(240, stats.length * 28) + 26}
            />
          </div>

          <div className="chart-card p-4">
            <h2 className="mb-3 text-sm font-semibold">Overall Audit Status</h2>
            <EChart
              option={{
                backgroundColor: "transparent",
                tooltip: { trigger: "item" },
                legend: { bottom: 0, textStyle: { color: "#94a3b8", fontSize: 10 } },
                series: [
                  {
                    type: "pie",
                    radius: ["45%", "72%"],
                    data: [
                      { name: "Audited", value: compliance.audited, itemStyle: { color: "#4ade80" } },
                      {
                        name: "Not Audited",
                        value: compliance.notAudited,
                        itemStyle: { color: "#f87171" },
                      },
                    ],
                    label: { color: "#e8edf7" },
                  },
                ],
              }}
              height={220}
            />
          </div>
        </div>

        <DataTable
          rows={stats}
          filename="auditor-compliance"
          columns={[
            { key: "auditor", header: "Auditor", accessor: (r) => r.auditor },
            { key: "assigned", header: "Assigned Cases", accessor: (r) => r.assigned },
            { key: "audited", header: "Audited", accessor: (r) => r.audited },
            { key: "notAudited", header: "Not Audited", accessor: (r) => r.notAudited },
            {
              key: "complianceRate",
              header: "Compliance %",
              accessor: (r) => Number(r.complianceRate.toFixed(1)),
            },
            { key: "agree", header: "Agree", accessor: (r) => r.agree },
            { key: "disagree", header: "Disagree", accessor: (r) => r.disagree },
            {
              key: "disagreeRate",
              header: "Disagree Rate %",
              accessor: (r) => Number(r.disagreeRate.toFixed(1)),
            },
          ]}
        />
      </DataGate>
    </div>
  );
}
