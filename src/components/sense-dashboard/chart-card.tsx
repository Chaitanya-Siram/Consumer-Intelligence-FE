import { motion } from "motion/react"
import type { ReactNode } from "react"
import { staggerItem } from "@/components/motion/motion-primitives"
import { cn } from "@/lib/utils"

/** Framed container for a chart with an editorial title/description header. */
export function ChartCard({
  title,
  description,
  aside,
  children,
  className,
}: {
  title: string
  description?: string
  aside?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <motion.section
      variants={staggerItem}
      className={cn(
        "flex flex-col rounded-xl border bg-card p-6 shadow-sm",
        className
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-foreground">
            {title}
          </h3>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {aside}
      </div>
      <div className="flex-1">{children}</div>
    </motion.section>
  )
}
