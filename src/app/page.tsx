"use client";

import { useMemo } from "react";
import { useFilteredCases } from "@/hooks/useEnrichedData";
import { useDataStore } from "@/store/dataStore";
import { KpiCard } from "@/components/ui/KpiCard";
import { EChart } from "@/components/charts/EChart";
import { DataGate } from "@/components/ui/DataGate";
import { buildInsights, groupAccuracy } from "@/lib/insights";
import { ACCURACY_TARGET_PCT } from "@/lib/constants";
import { formatWeekLabel } from "@/lib/formatWeek";

export default function ExecutivePage() {
  const cases = useFilteredCases();
  const lastUpload = useDataStore((s) => s.lastUpload);

  const stats = useMemo(() => {
    const scored = cases.filter((c) => c.score !== null);
    const total = scored.length;
    const passing = scored.reduce((sum, c) => sum + (c.score ?? 0), 0);
    const failing = total - passing;
    const accuracy = total ? (passing / total) * 100 : 0;
    const notYetWorked = cases.length - total;
    const technicians = new Set(cases.map((c) => c.technician_msid)).size;
    const supervisors = new Set(cases.map((c) => c.supervisor)).size;
    const sites = new Set(cases.map((c) => c.site)).size;
    return { total, passing, failing, accuracy, notYetWorked, technicians, supervisors, sites };
  }, [cases]);

  const insights = useMemo(() => buildInsights(cases), [cases]);

  const weeklyTrend = useMemo(() => {
    const byWeek = groupAccuracy(cases, (c) => c.week).filter((w) => w.key);
    return byWeek.sort((a, b) => a.key.localeCompare(b.key)).slice(-12);
  }, [cases]);

  const siteStats = useMemo(
    () => groupAccuracy(cases, (c) => c.site).sort((a, b) => b.accuracy - a.accuracy),
    [cases],
  );

  const monthlyTrend = useMemo(() => {
    const byMonth = groupAccuracy(cases, (c) => (c.case_date ? c.case_date.slice(0, 7) : "")).filter(
      (m) => m.key,
    );
    return byMonth.sort((a, b) => a.key.localeCompare(b.key)).slice(-6);
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
          tone={stats.accuracy >= ACCURACY_TARGET_PCT ? "success" : "danger"}
        />
        <KpiCard
          label="Total Audits"
          value={stats.total.toLocaleString()}
          sub={
            stats.notYetWorked > 0
              ? `${stats.notYetWorked.toLocaleString()} not yet worked (excluded)`
              : undefined
          }
        />
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
        <div className="chart-card p-4">
          <h2 className="mb-3 text-sm font-semibold">Accuracy Trend (last 12 weeks)</h2>
          <EChart
            option={{
              backgroundColor: "transparent",
              grid: { left: 40, right: 20, top: 20, bottom: 30 },
              tooltip: { trigger: "axis" },
              xAxis: {
                type: "category",
                data: weeklyTrend.map((w) => formatWeekLabel(w.key)),
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
                  markLine: {
                    silent: true,
                    symbol: "none",
                    lineStyle: { color: "#c9762f", type: "dashed" },
                    label: { formatter: `Target ${ACCURACY_TARGET_PCT}%`, color: "#c9762f" },
                    data: [{ yAxis: ACCURACY_TARGET_PCT }],
                  },
                },
              ],
            }}
            height={260}
          />
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="chart-card p-4">
            <h2 className="mb-3 text-sm font-semibold">Accuracy by Site</h2>
            <EChart
              option={{
                backgroundColor: "transparent",
                grid: { left: 90, right: 30, top: 10, bottom: 20 },
                tooltip: {},
                xAxis: {
                  type: "value",
                  max: 100,
                  splitNumber: 2,
                  axisLabel: { color: "#94a3b8", formatter: "{value}%" },
                },
                yAxis: {
                  type: "category",
                  data: [...siteStats].reverse().map((s) => s.key),
                  axisLabel: { color: "#94a3b8", fontSize: 10 },
                },
                series: [
                  {
                    type: "bar",
                    data: [...siteStats].reverse().map((s) => Number(s.accuracy.toFixed(1))),
                    color: "#4f8dff",
                  },
                ],
              }}
              height={220}
            />
          </div>

          <div className="chart-card p-4">
            <h2 className="mb-3 text-sm font-semibold">Pass / Fail Split</h2>
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
                      { name: "Passing", value: stats.passing, itemStyle: { color: "#4ade80" } },
                      { name: "Failing", value: stats.failing, itemStyle: { color: "#f87171" } },
                    ],
                    label: { color: "#e8edf7" },
                  },
                ],
              }}
              height={220}
            />
          </div>

          <div className="chart-card p-4">
            <h2 className="mb-3 text-sm font-semibold">Monthly Trend</h2>
            <EChart
              option={{
                backgroundColor: "transparent",
                grid: { left: 36, right: 16, top: 16, bottom: 30 },
                tooltip: { trigger: "axis" },
                xAxis: {
                  type: "category",
                  data: monthlyTrend.map((m) => m.key),
                  axisLabel: { color: "#94a3b8", fontSize: 9, rotate: 30 },
                },
                yAxis: { type: "value", max: 100, axisLabel: { color: "#94a3b8", formatter: "{value}%" } },
                series: [
                  {
                    type: "line",
                    data: monthlyTrend.map((m) => Number(m.accuracy.toFixed(1))),
                    smooth: true,
                    areaStyle: { opacity: 0.15 },
                    color: "#2dd4c8",
                  },
                ],
              }}
              height={220}
            />
          </div>
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
