"use client";

import { useMemo } from "react";
import { useFilteredCoaching } from "@/hooks/useEnrichedData";
import { KpiCard } from "@/components/ui/KpiCard";
import { EChart } from "@/components/charts/EChart";
import { DataGate } from "@/components/ui/DataGate";
import { DataTable } from "@/components/tables/DataTable";

export default function CoachingPage() {
  const rows = useFilteredCoaching();

  const stats = useMemo(() => {
    const withCompliance = rows.filter((r) => r.compliance_days != null);
    const avgDays = withCompliance.length
      ? withCompliance.reduce((s, r) => s + (r.compliance_days ?? 0), 0) / withCompliance.length
      : null;
    const notAdded = rows.filter((r) => r.is_not_added).length;
    const estimated = rows.filter((r) => r.is_estimated).length;
    return {
      total: rows.length,
      avgDays,
      notAdded,
      notAddedPct: rows.length ? (notAdded / rows.length) * 100 : 0,
      estimated,
    };
  }, [rows]);

  const byAuditor = useMemo(() => {
    const map = new Map<string, { sum: number; count: number }>();
    for (const r of rows) {
      if (r.compliance_days == null || !r.auditor) continue;
      const entry = map.get(r.auditor) ?? { sum: 0, count: 0 };
      entry.sum += r.compliance_days;
      entry.count += 1;
      map.set(r.auditor, entry);
    }
    return Array.from(map.entries())
      .map(([auditor, v]) => ({ auditor, avgDays: v.sum / v.count, count: v.count }))
      .sort((a, b) => b.avgDays - a.avgDays);
  }, [rows]);

  const byMonthTrend = useMemo(() => {
    const map = new Map<string, { sum: number; count: number }>();
    for (const r of rows) {
      if (r.compliance_days == null || !r.case_date) continue;
      const month = r.case_date.slice(0, 7);
      const entry = map.get(month) ?? { sum: 0, count: 0 };
      entry.sum += r.compliance_days;
      entry.count += 1;
      map.set(month, entry);
    }
    return Array.from(map.entries())
      .map(([month, v]) => ({ month, avgDays: v.sum / v.count }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [rows]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="Coaching Records" value={stats.total.toLocaleString()} />
        <KpiCard
          label="Avg. Compliance Days"
          value={stats.avgDays == null ? "—" : stats.avgDays.toFixed(1)}
          sub={stats.estimated > 0 ? `Includes ${stats.estimated} estimated dates` : undefined}
        />
        <KpiCard
          label="Not Yet Logged"
          value={stats.notAdded.toLocaleString()}
          tone="danger"
          sub={`${stats.notAddedPct.toFixed(1)}% of records`}
        />
        <KpiCard
          label="Estimated Dates"
          value={stats.estimated.toLocaleString()}
          tone="warning"
          sub='From "Added Before" entries'
        />
      </div>

      <DataGate hasRows={rows.length > 0}>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="chart-card p-4">
            <h2 className="mb-3 text-sm font-semibold">Avg. Compliance Days by Auditor</h2>
            <EChart
              option={{
                backgroundColor: "transparent",
                grid: { left: 120, right: 30, top: 10, bottom: 20 },
                tooltip: {},
                xAxis: { type: "value", axisLabel: { color: "#94a3b8" } },
                yAxis: {
                  type: "category",
                  data: [...byAuditor].reverse().map((a) => a.auditor),
                  axisLabel: { color: "#94a3b8", fontSize: 10 },
                },
                series: [
                  {
                    type: "bar",
                    data: [...byAuditor].reverse().map((a) => Number(a.avgDays.toFixed(1))),
                    color: "#fbbf24",
                  },
                ],
              }}
              height={Math.max(240, byAuditor.length * 26)}
            />
          </div>
          <div className="chart-card p-4">
            <h2 className="mb-3 text-sm font-semibold">Compliance Days Trend by Month</h2>
            <EChart
              option={{
                backgroundColor: "transparent",
                grid: { left: 40, right: 20, top: 20, bottom: 40 },
                tooltip: { trigger: "axis" },
                xAxis: {
                  type: "category",
                  data: byMonthTrend.map((m) => m.month),
                  axisLabel: { color: "#94a3b8", rotate: 45, fontSize: 10 },
                },
                yAxis: { type: "value", axisLabel: { color: "#94a3b8" } },
                series: [
                  {
                    type: "line",
                    data: byMonthTrend.map((m) => Number(m.avgDays.toFixed(1))),
                    smooth: true,
                    color: "#2dd4c8",
                  },
                ],
              }}
              height={260}
            />
          </div>
        </div>

        <DataTable
          rows={rows}
          filename="coaching-records"
          columns={[
            { key: "technician_name", header: "Technician", accessor: (r) => r.technician_name },
            { key: "auditor", header: "Auditor", accessor: (r) => r.auditor },
            { key: "supervisor", header: "Supervisor / AM", accessor: (r) => r.supervisor },
            { key: "site", header: "Site", accessor: (r) => r.site },
            { key: "case_date", header: "Case Date", accessor: (r) => r.case_date },
            { key: "date_added_raw", header: "Date Coaching Added (raw)", accessor: (r) => r.date_added_raw },
            { key: "compliance_days", header: "Compliance Days", accessor: (r) => r.compliance_days },
            { key: "is_estimated", header: "Estimated?", accessor: (r) => (r.is_estimated ? "Yes" : "No") },
            { key: "is_not_added", header: "Not Added?", accessor: (r) => (r.is_not_added ? "Yes" : "No") },
          ]}
        />
      </DataGate>
    </div>
  );
}
