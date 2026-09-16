import { useState } from "react"
import { Icon } from "@/components/ui/icon"
import { cn } from "@/lib/utils"

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"]
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

const pad = (n: number) => String(n).padStart(2, "0")
const toIso = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const parse = (iso?: string) => (iso ? new Date(iso + "T00:00:00") : null)
const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()

/** Compact, themed month calendar (replaces the native date picker). */
export function MiniCalendar({
  value,
  onChange,
  min,
  max,
}: {
  value?: string
  onChange: (iso: string) => void
  min?: string
  max?: string
}) {
  const selected = parse(value)
  const today = new Date()
  const [view, setView] = useState(selected ?? today)

  const y = view.getFullYear()
  const m = view.getMonth()
  const startDow = new Date(y, m, 1).getDay()
  const daysInMonth = new Date(y, m + 1, 0).getDate()
  const minD = parse(min)
  const maxD = parse(max)

  const cells: (Date | null)[] = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(y, m, d))

  const step = (delta: number) => setView(new Date(y, m + delta, 1))

  return (
    <div className="w-full select-none">
      <div className="mb-1 flex items-center justify-between px-1">
        <span className="type-caption font-semibold text-foreground">
          {MONTHS[m]} {y}
        </span>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => step(-1)}
            className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Icon name="chevron_left" size={16} />
          </button>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => step(1)}
            className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Icon name="chevron_right" size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-0.5">
        {WEEKDAYS.map((w, i) => (
          <span
            key={i}
            className="flex h-6 items-center justify-center text-[11px] font-medium text-muted-foreground"
          >
            {w}
          </span>
        ))}
        {cells.map((d, i) => {
          if (!d) return <span key={i} />
          const disabled =
            (minD && d < minD) || (maxD && d > maxD) ? true : false
          const isSel = selected && sameDay(d, selected)
          const isToday = sameDay(d, today)
          return (
            <button
              key={i}
              type="button"
              disabled={disabled}
              onClick={() => onChange(toIso(d))}
              className={cn(
                "flex h-7 items-center justify-center rounded-full text-[12px] transition-colors",
                disabled && "pointer-events-none opacity-30",
                isSel
                  ? "bg-[var(--sense-violet,#6952c1)] font-semibold text-white"
                  : "text-foreground hover:bg-muted",
                !isSel && isToday && "ring-1 ring-inset ring-[var(--sense-violet,#6952c1)]"
              )}
            >
              {d.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}
