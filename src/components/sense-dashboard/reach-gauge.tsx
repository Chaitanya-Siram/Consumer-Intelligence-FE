import { Gauge } from "@/components/charts/gauge"

/** Wrapper around the bklit notch Gauge for the dashboard's headline metric. */
export function ReachGauge({
  value,
  centerValue,
  label,
  formatOptions,
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
}) {
  return (
    <div className="w-full max-w-[400px]">
      <Gauge
        value={value}
        centerValue={centerValue}
        defaultLabel={label}
        spacing={25}
        inactiveFillOpacity={0.4}
        activeFill="#a8622f"
        formatOptions={
          formatOptions ?? { notation: "compact", maximumFractionDigits: 1 }
        }
      />
    </div>
  )
}
