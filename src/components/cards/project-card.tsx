import { Link } from "react-router-dom"
import { motion } from "motion/react"
import { Icon } from "@/components/ui/icon"
import type { Project } from "@/data/types"
import { Badge } from "@/components/ui/badge"
import { staggerItem } from "@/components/motion/motion-primitives"

const statusVariant = {
  active: "success",
  onboarding: "warning",
  archived: "secondary",
} as const

export function ProjectCard({ project }: { project: Project }) {
  return (
    <motion.div variants={staggerItem}>
      <Link
        to={`/projects/${project.id}`}
        className="group block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
      >
        <motion.div
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.99 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
          className="flex h-full flex-col rounded-xl border bg-card p-6 shadow-sm transition-shadow duration-200 group-hover:shadow-md"
        >
          <div className="flex items-start justify-between">
            <span className="flex size-11 items-center justify-center rounded-lg bg-primary/8 text-base font-semibold text-primary">
              {project.monogram}
            </span>
            <Badge variant={statusVariant[project.status]}>
              {project.status}
            </Badge>
          </div>

          <h3 className="mt-4 text-xl font-semibold tracking-tight text-foreground">
            {project.name}
          </h3>
          <p className="mt-0.5 text-xs uppercase tracking-wide text-muted-foreground">
            {project.industry}
          </p>
          <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
            {project.description}
          </p>

          <div className="mt-5 flex items-center justify-between border-t pt-4">
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <Icon name="grid_view" size={16} />
              {project.dashboardCount} dashboards
            </span>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-brand opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              Open
              <Icon name="arrow_outward" size={16} />
            </span>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  )
}
