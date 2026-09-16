import { Area, AreaChart } from "@/components/charts/area-chart"
import { Grid } from "@/components/charts/grid"
import { XAxis } from "@/components/charts/x-axis"
import { ChartTooltip } from "@/components/charts/tooltip"
import type { AreaChartData } from "@/data/types"

/**
 * Typed wrapper around the bklit Area chart. Accepts the app's `AreaChartData`
 * contract and renders a multi-series area with grid, x-axis and tooltip.
 */
export function AreaCoverageChart({ data }: { data: AreaChartData }) {
  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-x-5 gap-y-2">
        {data.series.map((s) => (
          <span
            key={s.key}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground"
          >
            <span
              className="size-2.5 rounded-full"
              style={{ background: s.color }}
            />
            {s.label}
          </span>
        ))}
      </div>

      <AreaChart data={data.points} xDataKey="date" aspectRatio="2.4 / 1">
        <Grid horizontal />
        {data.series.map((s) => (
          <Area
            key={s.key}
            dataKey={s.key}
            fill={s.color}
            fillOpacity={s.fillOpacity ?? 0.25}
          />
        ))}
        <XAxis />
        <ChartTooltip />
      </AreaChart>
    </div>
  )
}
