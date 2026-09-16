import { motion } from "motion/react"
import { Icon } from "@/components/ui/icon"
import type { Kpi } from "@/data/types"
import { formatDelta, formatValue } from "@/lib/format"
import { staggerItem } from "@/components/motion/motion-primitives"
import { cn } from "@/lib/utils"

export function KpiCard({ kpi }: { kpi: Kpi }) {
  const isGood =
    kpi.direction === "flat"
      ? null
      : (kpi.direction === "up") === (kpi.positiveIsGood ?? true)

  const deltaIcon =
    kpi.direction === "up"
      ? "trending_up"
      : kpi.direction === "down"
        ? "trending_down"
        : "trending_flat"

  return (
    <motion.div
      variants={staggerItem}
      className="rounded-xl border bg-card p-5 shadow-sm"
    >
      <p className="text-sm text-muted-foreground">{kpi.label}</p>
      <div className="mt-2 flex items-end justify-between gap-2">
        <span className="text-3xl font-semibold tabular-nums tracking-tight text-foreground">
          {formatValue(kpi.value, {
            format: kpi.format,
            prefix: kpi.prefix,
            suffix: kpi.suffix,
          })}
        </span>
        <span
          className={cn(
            "mb-1 inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium tabular-nums",
            isGood === null && "bg-muted text-muted-foreground",
            isGood === true &&
              "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400",
            isGood === false && "bg-destructive/12 text-destructive"
          )}
        >
          <Icon name={deltaIcon} size={14} />
          {formatDelta(kpi.delta)}
        </span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground/70">vs. prior period</p>
    </motion.div>
  )
}
