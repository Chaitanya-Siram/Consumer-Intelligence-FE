import { PieChart } from "@/components/charts/pie-chart"
import { PieSlice } from "@/components/charts/pie-slice"
import { PieCenter } from "@/components/charts/pie-center"
import type { PieChartData } from "@/data/types"

/** bklit donut with a right-side legend showing count + percentage per slice. */
export function OriginalSyndicatedDonut({ data }: { data: PieChartData }) {
  const total = data.data.reduce((sum, d) => sum + d.value, 0)

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <PieChart
        data={data.data}
        size={280}
        innerRadius={90}
        padAngle={0.02}
        cornerRadius={4}
      >
        {data.data.map((_, i) => (
          <PieSlice key={i} index={i} />
        ))}
        <PieCenter defaultLabel={data.centerLabel} />
      </PieChart>

      {/* legend below (same style as the sentiment chart) */}
      <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
        {data.data.map((d) => {
          const pct = total > 0 ? (d.value / total) * 100 : 0
          return (
            <li
              key={d.label}
              className="type-caption inline-flex items-center gap-2 text-muted-foreground"
            >
              <span
                className="size-2.5 rounded-full"
                style={{ background: d.color }}
              />
              {d.label} {pct.toFixed(1)}%
            </li>
          )
        })}
      </ul>
    </div>
  )
}
