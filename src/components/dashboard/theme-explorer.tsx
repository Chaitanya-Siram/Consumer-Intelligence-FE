import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Icon } from "@/components/ui/icon"
import { easeOut } from "@/components/motion/motion-primitives"
import type { ThemeInsight } from "@/data/types"

type Variant = "positive" | "negative"

const VARIANTS: Record<
  Variant,
  {
    label: string
    activeBg: string
    activeText: string
    inactiveBg: string
    inactiveBorder: string
    gradient: string
  }
> = {
  positive: {
    label: "Positive",
    activeBg: "#a1ffd9",
    activeText: "#004c4c",
    inactiveBg: "#eafff7",
    inactiveBorder: "#a1ffd9",
    gradient: "linear-gradient(135deg,#c9ffe9 0%,#5fd6ac 55%,#0b5353 100%)",
  },
  negative: {
    label: "Negative",
    activeBg: "#ffd6db",
    activeText: "#9f0000",
    inactiveBg: "#fff2f4",
    inactiveBorder: "#fad6db",
    gradient: "linear-gradient(135deg,#ffd6db 0%,#f0787f 55%,#9f0000 100%)",
  },
}

/**
 * Insights explainer (sense spec). Pill tabs on the left switch the theme;
 * the headline + body on the right swap gracefully.
 */
export function ThemeExplorer({
  variant,
  subtitle,
  themes,
}: {
  variant: Variant
  subtitle: string
  themes: ThemeInsight[]
}) {
  const [active, setActive] = useState(0)
  const v = VARIANTS[variant]
  const theme = themes[active]

  return (
    <section className="flex flex-col gap-[12px] rounded-[var(--sense-radius)] bg-white">
      {/* header — same as the other cards */}
      <div className="flex items-start justify-between gap-4 px-[20px] py-[12px]">
        <div>
          <h3 className="type-title text-foreground">{v.label}</h3>
          <p className="type-caption mt-1 text-muted-foreground">{subtitle}</p>
        </div>
        <button
          type="button"
          aria-label="More options"
          className="-mt-1 flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Icon name="more_horiz" size={20} />
        </button>
      </div>

      {/* pills (left) + content (right) */}
      <div className="flex min-h-[360px] gap-[24px] p-[20px]">
        <div className="flex w-[260px] shrink-0 flex-col items-start gap-[8px]">
          {themes.map((t, i) => {
            const on = i === active
            return (
              <button
                key={t.label}
                type="button"
                onClick={() => setActive(i)}
                aria-current={on ? "true" : undefined}
                className="flex items-center rounded-full border px-[16px] py-[10px] text-left text-[13px] font-medium leading-[normal] tracking-[-0.13px] transition-colors"
                style={
                  on
                    ? {
                        backgroundColor: v.activeBg,
                        borderColor: v.activeBg,
                        color: v.activeText,
                      }
                    : {
                        backgroundColor: v.inactiveBg,
                        borderColor: v.inactiveBorder,
                        color: "#000",
                      }
                }
              >
                {t.label}
              </button>
            )
          })}
        </div>

        <div className="min-w-0 max-w-[600px] flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              className="flex flex-col gap-[20px]"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.24, ease: easeOut }}
            >
              <p className="text-[24px] font-medium leading-[1.4] tracking-[-0.02rem] text-[#0b5353]">
                {theme.summary}
              </p>
              <p className="text-[13px] font-medium leading-[1.5] text-[#626262]">
                {theme.insight}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
