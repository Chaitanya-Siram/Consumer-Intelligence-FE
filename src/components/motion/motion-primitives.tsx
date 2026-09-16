import { motion, type Variants } from "motion/react"
import type { ReactNode } from "react"

/** Emil-style strong ease-out. Keep UI transitions crisp and under ~320ms. */
export const easeOut = [0.23, 1, 0.32, 1] as const

/** Page-level enter/exit for route transitions. */
export function PageTransition({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.26, ease: easeOut }}
    >
      {children}
    </motion.div>
  )
}

/** Parent that staggers its children in on mount. */
export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.05, delayChildren: 0.04 },
  },
}

/** Child item — fades and rises. Pairs with `staggerContainer`. */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.32, ease: easeOut },
  },
}

/** Convenience wrapper for a staggered grid/list. */
export function StaggerGroup({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <motion.div
      className={className}
      variants={staggerContainer}
      initial="hidden"
      animate="show"
    >
      {children}
    </motion.div>
  )
}
