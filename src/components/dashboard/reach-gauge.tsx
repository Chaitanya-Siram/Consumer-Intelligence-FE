import { Gauge } from "@/components/charts/gauge"

/** Wrapper around the bklit notch Gauge for the dashboard's headline metric. */
export function ReachGauge({
  value,
  centerValue,
  label,
  formatOptions,
  gradient = false,
}: {
  /** Fill level 0–100. */
  value: number
  /** Center statistic. */
  centerValue: number
  label: string
  formatOptions?: {
    notation?: "compact" | "standard"
    minimumFractionDigits?: number
    maximumFractionDigits?: number
  }
  /** Dual-arc gradient variant (foreground + background hex ramps). */
  gradient?: boolean
}) {
  return (
    <div className="w-full max-w-[400px]">
      <Gauge
        value={value}
        centerValue={centerValue}
        defaultLabel={label}
        spacing={25}
        formatOptions={
          formatOptions ?? { notation: "compact", maximumFractionDigits: 1 }
        }
        {...(gradient
          ? {
              useGradient: true,
              activeGradient: ["#7c5cff", "#4f8ef7"] as const,
              inactiveGradient: ["#cbdcf5", "#e8f0fb"] as const,
            }
          : { activeFill: "#a8622f", inactiveFillOpacity: 0.4 })}
      />
    </div>
  )
}
