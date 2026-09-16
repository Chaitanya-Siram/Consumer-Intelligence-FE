import { cn } from "@/lib/utils"

export interface IconProps {
  /** Material Symbols name, e.g. "bar_chart", "more_horiz". */
  name: string
  /** Pixel size (also drives optical size). Default 20. */
  size?: number
  /** Filled vs outlined. Default false (outlined). */
  fill?: boolean
  /** Font weight axis (100–700). Default 400. */
  weight?: number
  className?: string
}

/** Single icon primitive — Google Material Symbols (Outlined). */
export function Icon({
  name,
  size = 20,
  fill = false,
  weight = 400,
  className,
}: IconProps) {
  return (
    <span
      aria-hidden
      className={cn("material-symbols-outlined select-none", className)}
      style={{
        fontSize: size,
        lineHeight: 1,
        fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' ${weight}, 'GRAD' 0, 'opsz' ${size}`,
      }}
    >
      {name}
    </span>
  )
}
