export interface FormatOptions {
  format?: "number" | "compact" | "percent" | "currency"
  prefix?: string
  suffix?: string
}

/** Format a numeric value for display in KPIs, legends, tooltips. */
export function formatValue(value: number | string, opts: FormatOptions = {}): string {
  const { format, prefix = "", suffix = "" } = opts
  if (typeof value === "string") {
    return `${prefix}${value}${suffix}`
  }
  if (typeof value !== "number" || isNaN(value)) {
    return `${prefix}${String(value ?? "")}${suffix}`
  }
  let core: string
  switch (format) {
    case "compact":
      core = new Intl.NumberFormat(undefined, {
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(value)
      break
    case "percent":
      core = `${value}%`
      break
    case "currency":
      core = new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(value)
      break
    default:
      core = new Intl.NumberFormat().format(value)
  }
  return `${prefix}${core}${suffix}`
}

/** Signed percentage delta, e.g. +6.2% / -1.8%. */
export function formatDelta(delta: number): string {
  const sign = delta > 0 ? "+" : ""
  return `${sign}${delta.toFixed(1)}%`
}
