"use client";

import { useMemo } from "react";
import { useFilteredCases } from "@/hooks/useEnrichedData";
import { useDataStore } from "@/store/dataStore";
import { KpiCard } from "@/components/ui/KpiCard";
import { EChart } from "@/components/charts/EChart";
import { DataGate } from "@/components/ui/DataGate";
import { buildInsights, groupAccuracy } from "@/lib/insights";

export default function ExecutivePage() {
  const cases = useFilteredCases();
  const lastUpload = useDataStore((s) => s.lastUpload);

  const stats = useMemo(() => {
    const total = cases.length;
    const passing = cases.reduce((sum, c) => sum + c.score, 0);
    const failing = total - passing;
    const accuracy = total ? (passing / total) * 100 : 0;
    const technicians = new Set(cases.map((c) => c.technician_msid)).size;
    const supervisors = new Set(cases.map((c) => c.supervisor)).size;
    const sites = new Set(cases.map((c) => c.site)).size;
    return { total, passing, failing, accuracy, technicians, supervisors, sites };
  }, [cases]);

  const insights = useMemo(() => buildInsights(cases), [cases]);

  const weeklyTrend = useMemo(() => {
    const byWeek = groupAccuracy(cases, (c) => c.week).filter((w) => w.key);
    return byWeek.sort((a, b) => a.key.localeCompare(b.key)).slice(-12);
  }, [cases]);

  const latestUploadDate = Object.values(lastUpload)
    .map((u) => u?.uploaded_at)
    .filter((v): v is string => !!v)
    .sort()
    .reverse()[0];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard
          label="Overall Accuracy"
          value={`${stats.accuracy.toFixed(1)}%`}
          tone={stats.accuracy >= 90 ? "success" : stats.accuracy >= 75 ? "warning" : "danger"}
        />
        <KpiCard label="Total Audits" value={stats.total.toLocaleString()} />
        <KpiCard label="Passing Audits" value={stats.passing.toLocaleString()} tone="success" />
        <KpiCard label="Failing Audits" value={stats.failing.toLocaleString()} tone="danger" />
        <KpiCard label="Total Technicians" value={stats.technicians.toLocaleString()} />
        <KpiCard label="Total Supervisors" value={stats.supervisors.toLocaleString()} />
        <KpiCard label="Total Sites" value={stats.sites.toLocaleString()} />
        <KpiCard
          label="Latest Upload"
          value={latestUploadDate ? new Date(latestUploadDate).toLocaleDateString() : "—"}
        />
      </div>

      <DataGate hasRows={cases.length > 0}>
        <div className="glass-card p-4">
          <h2 className="mb-3 text-sm font-semibold">Accuracy Trend (last 12 weeks)</h2>
          <EChart
            option={{
              backgroundColor: "transparent",
              grid: { left: 40, right: 20, top: 20, bottom: 30 },
              tooltip: { trigger: "axis" },
              xAxis: {
                type: "category",
                data: weeklyTrend.map((w) => w.key),
                axisLabel: { color: "#94a3b8", fontSize: 10 },
              },
              yAxis: { type: "value", max: 100, axisLabel: { color: "#94a3b8", formatter: "{value}%" } },
              series: [
                {
                  type: "line",
                  data: weeklyTrend.map((w) => Number(w.accuracy.toFixed(1))),
                  smooth: true,
                  areaStyle: { opacity: 0.15 },
                  color: "#4f8dff",
                },
              ],
            }}
            height={260}
          />
        </div>

        {insights.length > 0 && (
          <div className="glass-card mt-6 p-4">
            <h2 className="mb-3 text-sm font-semibold">Auto-generated Insights</h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {insights.map((insight) => (
                <li key={insight.label} className="rounded-lg border border-card-border p-3 text-xs">
                  <p className="text-muted">{insight.label}</p>
                  <p className="mt-1 font-medium">{insight.detail}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </DataGate>
    </div>
  );
}
