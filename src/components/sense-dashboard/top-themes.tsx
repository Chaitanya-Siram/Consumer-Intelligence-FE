import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Icon } from "@/components/ui/icon"
import { easeOut } from "@/components/motion/motion-primitives"
import type { ThemeInsight } from "@/data/types"
import { cn } from "@/lib/utils"

/**
 * Insights explainer — top positive themes on the left, the selected theme's
 * detail on the right. Selecting a theme swaps the detail with a soft fade/slide.
 */
export function TopThemes({ themes }: { themes: ThemeInsight[] }) {
  const [active, setActive] = useState(0)
  const current = themes[active]

  return (
    <section className="flex flex-col rounded-[var(--sense-radius)] bg-white p-[20px]">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h3 className="type-title text-foreground">Top positive themes</h3>
          <p className="type-caption mt-1 text-muted-foreground">
            What drove favourable coverage this period — select a theme to read the detail.
          </p>
        </div>
        <button
          type="button"
          aria-label="More options"
          className="-mr-1 -mt-1 flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Icon name="more_horiz" size={20} />
        </button>
      </header>

      <div className="mt-8 grid gap-6 md:grid-cols-[minmax(0,320px)_1fr]">
        {/* left: theme list */}
        <ul className="flex flex-col">
          {themes.map((theme, i) => {
            const isActive = i === active
            return (
              <li key={theme.label} className="border-b border-border last:border-b-0">
                <button
                  type="button"
                  onClick={() => setActive(i)}
                  aria-current={isActive ? "true" : undefined}
                  className={cn(
                    "w-full rounded-md px-3 py-3.5 text-left type-body transition-colors",
                    isActive
                      ? "bg-[var(--chart-scale-01)] text-[color:var(--chart-scale-05)]"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  {theme.label}
                </button>
              </li>
            )
          })}
        </ul>

        {/* right: insight detail */}
        <div className="rounded-[var(--sense-radius)] bg-[var(--chart-scale-01)] p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.24, ease: easeOut }}
            >
              <h4 className="type-title text-foreground">{current.label}</h4>
              <p className="type-body mt-2 text-muted-foreground">
                {current.summary}
              </p>
              <p className="type-body mt-4 leading-relaxed text-foreground">
                {current.insight}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
