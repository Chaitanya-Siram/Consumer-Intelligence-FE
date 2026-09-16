import { PieChart } from "@/components/charts/pie-chart"
import { PieSlice } from "@/components/charts/pie-slice"
import { PieCenter } from "@/components/charts/pie-center"
import type { PieChartData } from "@/data/types"

function getSentimentColor(label: string): string | undefined {
  const l = String(label || "").toLowerCase().trim();
  if (l.includes("pos")) return "#10b981"; // Green
  if (l.includes("neg")) return "#ef4444"; // Red
  if (l.includes("neu")) return "#64748b"; // Gray
  if (l.includes("unas") || l.includes("mix")) return "#cbd5e1"; // Muted Gray
  return undefined;
}

/**
 * bklit donut Pie for sentiment — positive (green #10b981), negative (red #ef4444),
 * neutral (gray #64748b). Center shows total.
 */
export function SentimentDonut({ data }: { data: PieChartData }) {
  const chartData = (data?.data || []).map((d) => ({
    ...d,
    color: getSentimentColor(d.label) ?? d.color ?? "#64748b",
  }));

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <PieChart
        data={chartData}
        size={300}
        innerRadius={96}
        padAngle={0.015}
        cornerRadius={3}
      >
        {chartData.map((_, i) => (
          <PieSlice key={i} index={i} />
        ))}
        <PieCenter defaultLabel={data?.centerLabel} />
      </PieChart>

      <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
        {chartData.map((d) => (
          <li
            key={d.label}
            className="type-caption inline-flex items-center gap-2 text-muted-foreground font-medium"
          >
            <span
              className="size-2.5 rounded-full inline-block shrink-0"
              style={{ background: d.color }}
            />
            {d.label}
          </li>
        ))}
      </ul>
    </div>
  )
}
