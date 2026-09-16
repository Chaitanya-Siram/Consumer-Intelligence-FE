import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { motion, useSpring } from "motion/react"
import { useChart } from "@/components/charts/chart-context"

/**
 * Animated line indicator for the bklit Bar chart (ported from the bklit
 * docs example). On hover, a 2px line springs from the baseline to the top
 * of the active bar. Pair with <ChartTooltip showCrosshair={false} showDots={false} />.
 */
function AnimatedBarLine({
  barX,
  barTopY,
  barBottomY,
  width,
  isHovered,
}: {
  barX: number
  barTopY: number
  barBottomY: number
  width: number
  isHovered: boolean
}) {
  const animatedY = useSpring(barBottomY, { stiffness: 300, damping: 30 })
  const animatedOpacity = useSpring(0, { stiffness: 300, damping: 30 })

  useEffect(() => {
    animatedY.set(isHovered ? barTopY : barBottomY)
    animatedOpacity.set(isHovered ? 1 : 0)
  }, [isHovered, barTopY, barBottomY, animatedY, animatedOpacity])

  return (
    <motion.rect
      fill="var(--chart-indicator-color)"
      height={2}
      style={{ opacity: animatedOpacity, y: animatedY }}
      width={width}
      x={barX}
    />
  )
}

export function BarLineIndicator({
  data,
  valueKey,
  xKey,
}: {
  data: Record<string, unknown>[]
  valueKey: string
  xKey: string
}) {
  const {
    barScale,
    bandWidth,
    innerHeight,
    margin,
    containerRef,
    hoveredBarIndex,
    yScale,
  } = useChart()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const container = containerRef.current
  if (!(mounted && container && bandWidth && barScale)) return null

  return createPortal(
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-50 overflow-visible"
      height="100%"
      width="100%"
    >
      <g transform={`translate(${margin.left},${margin.top})`}>
        {data.map((d, i) => {
          const xVal = d[xKey]
          const groupX = barScale(String(xVal)) ?? 0
          const yVal = d[valueKey]
          const barTopY =
            typeof yVal === "number" ? (yScale(yVal) ?? innerHeight) : innerHeight
          return (
            <AnimatedBarLine
              key={String(xVal)}
              barBottomY={innerHeight}
              barTopY={barTopY}
              barX={groupX}
              isHovered={hoveredBarIndex === i}
              width={bandWidth}
            />
          )
        })}
      </g>
    </svg>,
    container
  )
}
