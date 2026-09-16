import { LinearGradient } from "@visx/gradient"
import { BarChart } from "@/components/charts/bar-chart"
import { Bar } from "@/components/charts/bar"
import { BarXAxis } from "@/components/charts/bar-x-axis"
import { Grid } from "@/components/charts/grid"
import { ChartTooltip } from "@/components/charts/tooltip"
import { BarLineIndicator } from "@/components/charts/bar-line-indicator"
import type { MonthlyPoint } from "@/data/types"

/**
 * bklit Bar chart — "No Gap" variant, matching the bklit reference exactly:
 * tokenized gradient fill (var(--chart-3) → transparent), flat caps,
 * and the animated line indicator on hover.
 */
export function ResultsBarChart({ data }: { data: MonthlyPoint[] }) {
  const rows = data as unknown as Record<string, unknown>[]
  return (
    <BarChart
      data={rows}
      xDataKey="month"
      barGap={0}
      margin={{ top: 8, right: 8, bottom: 40, left: 8 }}
      aspectRatio="16 / 10"
    >
      <LinearGradient id="noGapGradient" from="var(--chart-3)" to="transparent" />
      <Grid horizontal />
      <Bar
        dataKey="value"
        fill="url(#noGapGradient)"
        lineCap="butt"
        stroke="var(--chart-3)"
      />
      <BarXAxis />
      <ChartTooltip showCrosshair={false} showDots={false} />
      <BarLineIndicator data={rows} valueKey="value" xKey="month" />
    </BarChart>
  )
}
