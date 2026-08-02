"use client";

import ReactECharts from "echarts-for-react";
import type { EChartsOption, SeriesOption } from "echarts";

/** Rounds bar corners by default so charts feel consistent without repeating itemStyle everywhere. */
function withRoundedBars(option: EChartsOption): EChartsOption {
  if (!option.series) return option;
  const seriesArray = Array.isArray(option.series) ? option.series : [option.series];
  const patched = seriesArray.map((s) => {
    if (s && (s as SeriesOption).type === "bar") {
      const bar = s as SeriesOption & { itemStyle?: Record<string, unknown> };
      return {
        ...bar,
        itemStyle: { borderRadius: 6, ...(bar.itemStyle ?? {}) },
      };
    }
    return s;
  });
  return { ...option, series: patched };
}

export function EChart({ option, height = 320 }: { option: EChartsOption; height?: number }) {
  return (
    <ReactECharts
      option={withRoundedBars(option)}
      style={{ height }}
      notMerge
      opts={{ renderer: "canvas" }}
      onChartReady={(instance: { resize: () => void }) => {
        // ECharts sometimes measures its container before the surrounding grid/flex
        // layout has settled on first paint, leaving series data computed but never
        // actually drawn. Forcing a resize once the instance is ready fixes that.
        requestAnimationFrame(() => instance.resize());
      }}
    />
  );
}
