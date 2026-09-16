"use client";

import { BarChart } from "@/components/charts/bar-chart"
import { Bar } from "@/components/charts/bar"
import { BarYAxis } from "@/components/charts/bar-y-axis"
import { Grid } from "@/components/charts/grid"
import { ChartTooltip } from "@/components/charts/tooltip"
import { BarValueLabels } from "@/components/charts/bar-value-labels"
import type { RankedItem } from "@/data/types"
import { useArticlePopup, filterBySource } from "@/components/builder/article-popup-modal"

/**
 * Bklit horizontal Bar chart for ranked lists (themes, publications…).
 * Renders the original Bklit BarChart with a transparent click-overlay grid
 * so individual rows are clickable without replacing the chart visual.
 *
 * "source"  → filters session articles by publication domain
 * "theme"   → filters session articles by theme label
 */
export function RankedBarChart({
  data,
  gradientId,
  color = "#12b3a6",
  filterMode = "source",
}: {
  data: RankedItem[]
  gradientId: string
  color?: string
  filterMode?: "source" | "theme"
}) {
  const { openPopup, articles } = useArticlePopup();
  const hasArticles = articles && articles.length > 0;
  const rows = data as unknown as Record<string, unknown>[]

  function handleRowClick(label: string, value: number) {
    if (!hasArticles) return;
    const filtered =
      filterMode === "source"
        ? filterBySource(articles, label)
        : articles.filter(
            (a) => (a.theme || a.category || "").toLowerCase() === label.toLowerCase()
          );
    openPopup({
      title: label,
      subtitle: `${filtered.length > 0 ? filtered.length : value} articles · ${filterMode === "source" ? "publication" : "theme"}`,
      articles: filtered,
    });
  }

  // Chart margin constants — must match what BarChart uses for the overlay grid alignment
  const marginTop = 8;
  const marginBottom = 12;
  const marginLeft = 120;
  const marginRight = 48;

  return (
    <div className="w-full relative group">
      {/* Hidden SVG gradient def */}
      <svg width="0" height="0" aria-hidden className="absolute">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={color} stopOpacity="1" />
          </linearGradient>
        </defs>
      </svg>

      {/* Bklit chart — exact original rendering */}
      <BarChart
        data={rows}
        xDataKey="label"
        orientation="horizontal"
        barGap={0}
        margin={{ top: marginTop, right: marginRight, bottom: marginBottom, left: marginLeft }}
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

      {/* Transparent click-overlay grid aligned to the bar rows area.
          Each invisible div covers exactly one horizontal bar row.
          pointer-events-none on the parent keeps Bklit hover/tooltip intact;
          each child row has pointer-events-auto only when articles are loaded. */}
      {hasArticles && (
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            top: `${marginTop}px`,
            bottom: `${marginBottom}px`,
            left: `${marginLeft}px`,
            right: `${marginRight}px`,
          }}
        >
          {data.map((row) => (
            <div
              key={row.label}
              className="pointer-events-auto cursor-pointer hover:bg-indigo-400/10 hover:ring-1 hover:ring-inset hover:ring-indigo-300/30 transition-all rounded"
              style={{ height: `${100 / data.length}%` }}
              title={`Click to see articles from "${row.label}"`}
              onClick={() => handleRowClick(row.label, row.value)}
            />
          ))}
        </div>
      )}

      {/* "Click rows" hint badge — visible on hover */}
      {hasArticles && (
        <div className="absolute top-2 right-14 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <span className="text-[10px] font-semibold text-indigo-500 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-full shadow-sm">
            Click a bar to explore articles
          </span>
        </div>
      )}
    </div>
  )
}
