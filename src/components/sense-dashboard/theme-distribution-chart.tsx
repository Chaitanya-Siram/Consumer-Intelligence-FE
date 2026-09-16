import { RankedBarChart } from "@/components/sense-dashboard/ranked-bar-chart"
import type { ThemeVolume } from "@/data/types"

/** Themes by article volume — thin wrapper over the shared RankedBarChart. */
export function ThemeDistributionChart({ data }: { data?: ThemeVolume[] | Record<string, unknown> | null }) {
  const items = Array.isArray(data)
    ? data
    : Array.isArray((data as any)?.data)
      ? (data as any).data
      : []

  const formattedData = items.map((d: any) => ({
    label: d.theme ?? d.label ?? d.name ?? "",
    value: d.articles ?? d.value ?? d.count ?? 0,
  }))

  return (
    <RankedBarChart
      gradientId="iv-theme-grad"
      data={formattedData}
    />
  )
}
