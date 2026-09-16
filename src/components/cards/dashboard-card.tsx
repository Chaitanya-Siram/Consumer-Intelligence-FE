import { Link } from "react-router-dom"
import { motion } from "motion/react"
import { Icon } from "@/components/ui/icon"
import type { DashboardSummary } from "@/data/types"
import { Badge } from "@/components/ui/badge"
import { resolveIcon } from "@/lib/icon-map"
import { staggerItem } from "@/components/motion/motion-primitives"
import { cn } from "@/lib/utils"

export function DashboardCard({
  dashboard,
}: {
  dashboard: DashboardSummary
}) {
  const iconName = resolveIcon(dashboard.icon)
  const to = `/projects/${dashboard.projectId}/dashboards/${dashboard.id}`

  const inner = (
    <motion.div
      whileHover={dashboard.ready ? { y: -3 } : undefined}
      whileTap={dashboard.ready ? { scale: 0.99 } : undefined}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className={cn(
        "flex h-full flex-col rounded-xl border bg-card p-6 shadow-sm transition-shadow duration-200",
        dashboard.ready
          ? "group-hover:shadow-md"
          : "opacity-70"
      )}
    >
      <div className="flex items-start justify-between">
        <span className="flex size-11 items-center justify-center rounded-lg bg-primary/8 text-primary">
          <Icon name={iconName} size={20} />
        </span>
        {dashboard.ready ? (
          <Badge variant="outline">{dashboard.category}</Badge>
        ) : (
          <Badge variant="secondary">Coming soon</Badge>
        )}
      </div>

      <h3 className="mt-4 text-lg font-semibold tracking-tight text-foreground">
        {dashboard.name}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
        {dashboard.description}
      </p>

      <div className="mt-5 flex items-center justify-between border-t pt-4">
        <span className="text-sm text-muted-foreground">
          {dashboard.metricCount} widgets
        </span>
        {dashboard.ready && (
          <span className="inline-flex items-center gap-1 text-sm font-medium text-brand opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            Preview
            <Icon name="arrow_outward" size={16} />
          </span>
        )}
      </div>
    </motion.div>
  )

  if (!dashboard.ready) {
    return (
      <motion.div variants={staggerItem} aria-disabled className="cursor-default">
        {inner}
      </motion.div>
    )
  }

  return (
    <motion.div variants={staggerItem}>
      <Link
        to={to}
        className="group block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
      >
        {inner}
      </Link>
    </motion.div>
  )
}
