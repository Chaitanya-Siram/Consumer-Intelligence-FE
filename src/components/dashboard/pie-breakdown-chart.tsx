import { PieChart } from "@/components/charts/pie-chart"
import { PieSlice } from "@/components/charts/pie-slice"
import { PieCenter } from "@/components/charts/pie-center"
import type { PieChartData } from "@/data/types"
import { formatValue } from "@/lib/format"

/**
 * Typed wrapper around the bklit Pie (donut) chart with an editorial legend.
 * Consumes the app's `PieChartData` contract.
 */
export function PieBreakdownChart({ data }: { data: PieChartData }) {
  const total = data.data.reduce((sum, d) => sum + d.value, 0)

  return (
    <div className="flex flex-col items-center gap-8 sm:flex-row sm:justify-between">
      <div className="shrink-0">
        <PieChart
          data={data.data}
          size={230}
          innerRadius={72}
          padAngle={0.02}
          cornerRadius={4}
        >
          {data.data.map((_, i) => (
            <PieSlice key={i} index={i} />
          ))}
          <PieCenter
            defaultLabel={data.centerLabel}
            formatOptions={{ notation: "compact", maximumFractionDigits: 1 }}
          />
        </PieChart>
      </div>

      <ul className="w-full space-y-3 sm:max-w-[16rem]">
        {data.data.map((d, i) => {
          const pct = total > 0 ? Math.round((d.value / total) * 100) : 0
          return (
            <li
              key={d.label}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span className="inline-flex items-center gap-2.5 text-foreground">
                <span
                  className="size-2.5 rounded-full"
                  style={{
                    background: d.color ?? `var(--chart-${(i % 5) + 1})`,
                  }}
                />
                {d.label}
              </span>
              <span className="tabular-nums text-muted-foreground">
                {formatValue(d.value, { format: "compact" })} · {pct}%
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
