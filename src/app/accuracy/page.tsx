"use client";

import { useMemo, useState } from "react";
import { useFilteredCases } from "@/hooks/useEnrichedData";
import { groupAccuracy } from "@/lib/insights";
import { KpiCard } from "@/components/ui/KpiCard";
import { EChart } from "@/components/charts/EChart";
import { DataGate } from "@/components/ui/DataGate";
import type { EnrichedCase } from "@/types/domain";

type Granularity = "week" | "month" | "quarter" | "year";

export default function AccuracyPage() {
  const cases = useFilteredCases();
  const [granularity, setGranularity] = useState<Granularity>("week");

  const keyFn = useMemo(() => {
    return (c: EnrichedCase) => {
      if (granularity === "week") return c.week;
      if (granularity === "month") return c.month ?? "";
      if (granularity === "quarter") return c.quarter;
      return c.year ? String(c.year) : "";
    };
  }, [granularity]);

  const trend = useMemo(() => {
    const grouped = groupAccuracy(cases, keyFn).filter((g) => g.key);
    grouped.sort((a, b) => a.key.localeCompare(b.key));
    return grouped;
  }, [cases, keyFn]);

  const rolling = useMemo(() => {
    const window = 4;
    return trend.map((_, i) => {
      const slice = trend.slice(Math.max(0, i - window + 1), i + 1);
      const avg = slice.reduce((s, t) => s + t.accuracy, 0) / slice.length;
      return Number(avg.toFixed(1));
    });
  }, [trend]);

  const overallAccuracy = cases.length
    ? (cases.reduce((s, c) => s + c.score, 0) / cases.length) * 100
    : 0;
  const latest = trend[trend.length - 1];
  const previous = trend[trend.length - 2];
  const delta = latest && previous ? latest.accuracy - previous.accuracy : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <KpiCard label="Overall Accuracy" value={`${overallAccuracy.toFixed(1)}%`} />
          <KpiCard label={`Latest ${granularity}`} value={latest ? `${latest.accuracy.toFixed(1)}%` : "—"} />
          <KpiCard
            label="Change vs prior period"
            value={delta == null ? "—" : `${delta >= 0 ? "+" : ""}${delta.toFixed(1)} pts`}
            tone={delta == null ? "default" : delta >= 0 ? "success" : "danger"}
          />
        </div>
        <div className="flex gap-1 rounded-lg border border-card-border p-1 text-xs">
          {(["week", "month", "quarter", "year"] as Granularity[]).map((g) => (
            <button
              key={g}
              onClick={() => setGranularity(g)}
              className={`rounded-md px-3 py-1 capitalize ${
                granularity === g ? "bg-accent text-white" : "text-muted hover:text-foreground"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <DataGate hasRows={trend.length > 0}>
        <div className="glass-card p-4">
          <h2 className="mb-3 text-sm font-semibold">
            Accuracy Trend by {granularity} (with 4-period rolling average)
          </h2>
          <EChart
            option={{
              backgroundColor: "transparent",
              grid: { left: 40, right: 20, top: 30, bottom: 60 },
              tooltip: { trigger: "axis" },
              legend: { data: ["Accuracy %", "Rolling avg"], textStyle: { color: "#94a3b8" }, top: 0 },
              xAxis: {
                type: "category",
                data: trend.map((t) => t.key),
                axisLabel: { color: "#94a3b8", fontSize: 10, rotate: 45 },
              },
              yAxis: { type: "value", max: 100, axisLabel: { color: "#94a3b8", formatter: "{value}%" } },
              series: [
                {
                  name: "Accuracy %",
                  type: "bar",
                  data: trend.map((t) => Number(t.accuracy.toFixed(1))),
                  color: "#4f8dff",
                },
                { name: "Rolling avg", type: "line", data: rolling, smooth: true, color: "#2dd4c8" },
              ],
            }}
            height={340}
          />
        </div>
      </DataGate>
    </div>
  );
}
