import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { useChart } from "@/components/charts/chart-context"

/**
 * Static value labels at the end of each horizontal bar. Reads geometry from
 * bklit's useChart (same pattern as the docs' BarLineIndicator): barScale gives
 * each category band, yScale maps the value to an x-length.
 */
export function BarValueLabels({
  data,
  valueKey,
  xKey,
}: {
  data: Record<string, unknown>[]
  valueKey: string
  xKey: string
}) {
  const { barScale, bandWidth, margin, yScale, containerRef, orientation } =
    useChart()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const container = containerRef.current
  if (
    !(mounted && container && barScale && bandWidth && orientation === "horizontal")
  ) {
    return null
  }

  return createPortal(
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 z-40 overflow-visible"
      width="100%"
      height="100%"
    >
      <g transform={`translate(${margin.left},${margin.top})`}>
        {data.map((d) => {
          const cat = String(d[xKey])
          const bandPos = barScale(cat) ?? 0
          const value = Number(d[valueKey]) || 0
          const barW = yScale(value) ?? 0
          return (
            <text
              key={cat}
              x={barW + 8}
              y={bandPos + bandWidth / 2}
              dominantBaseline="central"
              className="text-[12px] font-semibold"
              style={{ fill: "var(--foreground)" }}
            >
              {value}
            </text>
          )
        })}
      </g>
    </svg>,
    container
  )
}
