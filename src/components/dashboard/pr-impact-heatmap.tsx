import { HeatmapChart } from "@/components/charts/heatmap/heatmap-chart"
import { HeatmapCells } from "@/components/charts/heatmap/heatmap-cells"
import { HeatmapSeparator } from "@/components/charts/heatmap/heatmap-separator"
import { HeatmapXAxis } from "@/components/charts/heatmap/heatmap-x-axis"
import { HeatmapYAxis } from "@/components/charts/heatmap/heatmap-y-axis"
import { HeatmapTooltip } from "@/components/charts/heatmap/heatmap-tooltip"
import { HeatmapLegend } from "@/components/charts/heatmap/heatmap-legend"
import type { HeatmapColumn } from "@/components/charts/heatmap/heatmap-context"
import type { HeatmapLevelColors } from "@/components/charts/heatmap/heatmap-colors"
import type { CompetitorHeatmap } from "@/data/types"

/**
 * PR Impact heatmap — competitors (rows) × weeks (columns), coloured on a
 * red → orange → green scale by PR-impact level (0 = low/red, 4 = high/green).
 * Same bklit heatmap engine as the media heatmap, with a custom level ramp and
 * company row labels.
 */

// 5-step red → orange → green ramp, index-aligned to contribution levels 0–4.
const RAMP: HeatmapLevelColors = [
  "#e5484d",
  "#f2711c",
  "#f5b301",
  "#8bc34a",
  "#2e9e4f",
]

export function PrImpactHeatmap({ data }: { data: CompetitorHeatmap }) {
  if (!data || !data.companies || !data.weeks || data.companies.length === 0) {
    return <div className="p-4 text-xs text-slate-400 text-center">No heatmap data available</div>;
  }

  const columns: HeatmapColumn[] = data.weeks.map((week, col) => ({
    bin: col,
    bins: data.companies.map((_, row) => ({
      bin: row,
      count: week.scores[row] ?? 0,
      date: new Date(week.weekStart),
    })),
  }))

  return (
    <div className="w-full">
      <HeatmapChart
        data={columns}
        gap={3}
        layout="fluid"
        levelColors={RAMP}
        margin={{ top: 56, right: 12, bottom: 0, left: 104 }}
      >
        <HeatmapCells
          cornerRadius={999}
          inactiveOpacity={0.8}
          inactiveScale={0.94}
        />
        <HeatmapSeparator
          groupBy="quarter"
          showLabels
          labelClassName="text-[var(--chart-3)]"
          spacing={12}
          startOffset={14}
          strokeOpacity={0.6}
        />
        <HeatmapXAxis />
        <HeatmapYAxis labels={data.companies} />
        <HeatmapTooltip />
      </HeatmapChart>

      <div className="mt-5">
        <HeatmapLegend
          align="center"
          cornerRadius={999}
          gap={3}
          lessLabel="Low impact"
          moreLabel="High impact"
          colorScale={(level) => RAMP[Math.max(0, Math.min(4, level ?? 0))]}
          inactiveOpacity={0.8}
          inactiveScale={0.94}
        />
      </div>
    </div>
  )
}

