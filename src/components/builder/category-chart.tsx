import { PieChart } from "@/components/charts/pie-chart"
import { PieSlice } from "@/components/charts/pie-slice"
import { PieCenter } from "@/components/charts/pie-center"
import { RankedBarChart } from "@/components/dashboard/ranked-bar-chart"
import type { CategoryDatum } from "@/data/types"

export type CategoryViz = "donut" | "pie" | "bar"

const FALLBACK = [
  "var(--chart-1)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-2)",
  "var(--chart-5)",
]

function getSentimentColor(label: string): string | undefined {
  const l = String(label || "").toLowerCase().trim();
  if (l.includes("pos")) return "#10b981";
  if (l.includes("neg")) return "#ef4444";
  if (l.includes("neu")) return "#64748b";
  if (l.includes("unas") || l.includes("mix")) return "#cbd5e1";
  return undefined;
}

/**
 * Renders category data as a donut, pie or horizontal bar — same bklit
 * primitives, switchable chart type (used by the builder's "make it a pie" etc).
 */
export function CategoryChart({
  data,
  centerLabel = "Total",
  viz,
}: {
  data: CategoryDatum[]
  centerLabel?: string
  viz: CategoryViz
}) {
  const colored = data.map((d, i) => ({
    ...d,
    color: d.color ?? getSentimentColor(d.label) ?? FALLBACK[i % FALLBACK.length],
  }))

  if (viz === "bar") {
    return (
      <RankedBarChart
        gradientId="cat-bar-grad"
        color="#6d5ef6"
        data={colored.map((d) => ({ label: d.label, value: d.value }))}
      />
    )
  }

  const innerRadius = viz === "donut" ? 96 : 0
  return (
    <div className="flex w-full flex-col items-center gap-6">
      <PieChart
        data={colored}
        size={300}
        innerRadius={innerRadius}
        padAngle={0.015}
        cornerRadius={3}
      >
        {colored.map((_, i) => (
          <PieSlice key={i} index={i} />
        ))}
        {viz === "donut" && <PieCenter defaultLabel={centerLabel} />}
      </PieChart>

      <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
        {colored.map((d) => (
          <li
            key={d.label}
            className="type-caption inline-flex items-center gap-2 text-muted-foreground"
          >
            <span
              className="size-2.5 rounded-full"
              style={{ background: d.color }}
            />
            {d.label}
          </li>
        ))}
      </ul>
    </div>
  )
}
