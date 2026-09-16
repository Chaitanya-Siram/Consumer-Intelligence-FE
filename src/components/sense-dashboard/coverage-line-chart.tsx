import { LineChart } from "@/components/charts/line-chart"
import { Line } from "@/components/charts/line"
import { Background } from "@/components/charts/background"
import { XAxis } from "@/components/charts/x-axis"
import { YAxis } from "@/components/charts/y-axis"
import { ChartTooltip } from "@/components/charts/tooltip"
import type { AreaChartData } from "@/data/types"

/** bklit Line chart with dot-grid background + y-axis — coverage over time. */
export function CoverageLineChart({ data }: { data: AreaChartData }) {
  return (
    <div className="w-full">
      <LineChart data={data.points} xDataKey="date" aspectRatio="2 / 1">
        <Background pattern="dots" opacity={0.85} />
        <Line dataKey="brand" stroke="var(--chart-line-primary)" />
        <XAxis />
        <YAxis />
        <ChartTooltip />
      </LineChart>
    </div>
  )
}
