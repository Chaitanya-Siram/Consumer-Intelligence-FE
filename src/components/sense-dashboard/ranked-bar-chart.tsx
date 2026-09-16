import { BarChart } from "@/components/charts/bar-chart"
import { Bar } from "@/components/charts/bar"
import { BarYAxis } from "@/components/charts/bar-y-axis"
import { Grid } from "@/components/charts/grid"
import { ChartTooltip } from "@/components/charts/tooltip"
import { BarValueLabels } from "@/components/charts/bar-value-labels"
import type { RankedItem } from "@/data/types"

/**
 * bklit horizontal Bar chart for ranked lists (themes, publications…).
 * "No gap" bars (labels align), teal gradient fill, value labels at each end.
 */
export function RankedBarChart({
  data,
  gradientId,
  color = "#12b3a6",
}: {
  data: RankedItem[]
  gradientId: string
  /** Bar color (a left→right gradient is derived from it). */
  color?: string
}) {
  const rows = data as unknown as Record<string, unknown>[]
  return (
    <div className="w-full">
      <svg width="0" height="0" aria-hidden className="absolute">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={color} stopOpacity="1" />
          </linearGradient>
        </defs>
      </svg>

      <BarChart
        data={rows}
        xDataKey="label"
        orientation="horizontal"
        barGap={0}
        margin={{ top: 8, right: 48, bottom: 12, left: 120 }}
        aspectRatio="4 / 3"
      >
        <Grid horizontal={false} vertical fadeVertical />
        <Bar
          dataKey="value"
          fill={`url(#${gradientId})`}
          stroke={color}
          lineCap="butt"
        />
        <BarYAxis />
        <ChartTooltip showCrosshair={false} />
        <BarValueLabels data={rows} valueKey="value" xKey="label" />
      </BarChart>
    </div>
  )
}
