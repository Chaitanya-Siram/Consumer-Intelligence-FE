"use client";

import { RankedBarChart } from "@/components/dashboard/ranked-bar-chart"
import type { ThemeVolume } from "@/data/types"

/**
 * Themes by article volume — thin wrapper over the shared Bklit RankedBarChart.
 * Passes filterMode="theme" so bar-row clicks open articles filtered by theme.
 */
export function ThemeDistributionChart({ data }: { data: ThemeVolume[] }) {
  return (
    <RankedBarChart
      gradientId="iv-theme-grad"
      color="#0d9488"
      filterMode="theme"
      data={data.map((d) => ({ label: d.theme, value: d.articles }))}
    />
  )
}
