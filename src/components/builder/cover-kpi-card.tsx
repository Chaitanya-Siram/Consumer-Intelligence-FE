import { formatValue } from "@/lib/format"
import type { Kpi } from "@/data/types"

export interface CoverBg {
  kind: "default" | "image" | "video"
  src: string | null
}

const COVER_GRADIENT = [
  "radial-gradient(120% 80% at 15% 10%, #8ad9ff 0%, transparent 45%)",
  "radial-gradient(120% 90% at 85% 20%, #b98cff 0%, transparent 50%)",
  "radial-gradient(120% 90% at 70% 90%, #5ff0c0 0%, transparent 45%)",
  "radial-gradient(120% 90% at 20% 85%, #ff8ac6 0%, transparent 45%)",
  "linear-gradient(160deg, #6a7bff 0%, #7b5be6 55%, #35c8a6 100%)",
].join(",")

/**
 * Cover KPI hero card (Figma 472:1575) — configurable background (gradient,
 * image or video) with a large title, subtitle and a row of glass KPI tiles.
 */
export function CoverKpiCard({
  title,
  subtitle,
  kpis,
  cover,
}: {
  title: string
  subtitle: string
  kpis: Kpi[]
  cover?: CoverBg
}) {
  return (
    <div className="relative flex min-h-[440px] w-full flex-1 flex-col justify-end gap-[10px] overflow-hidden rounded-[var(--sense-radius)] p-[20px]">
      {cover?.kind === "video" && cover.src ? (
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src={cover.src}
          autoPlay
          loop
          muted
          playsInline
        />
      ) : cover?.kind === "image" && cover.src ? (
        <img
          className="absolute inset-0 h-full w-full object-cover"
          src={cover.src}
          alt=""
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{ backgroundColor: "#5b6ee1", backgroundImage: COVER_GRADIENT }}
        />
      )}
      <div
        className="absolute inset-0"
        style={{ background: "var(--sense-overlay)" }}
      />

      <h2 className="relative z-10 type-display text-white">{title}</h2>
      <p className="relative z-10 max-w-[560px] type-body text-white">
        {subtitle}
      </p>

      <div className="relative z-10 mt-2 flex flex-wrap gap-[8px]">
        {kpis.slice(0, 4).map((kpi) => (
          <div
            key={kpi.id}
            className="flex min-h-[120px] min-w-[140px] flex-1 flex-col justify-between rounded-[8px] border p-4"
            style={{
              borderColor: "var(--sense-glass-border)",
              backdropFilter: "blur(17px)",
              WebkitBackdropFilter: "blur(17px)",
              backgroundImage:
                "linear-gradient(0deg, rgba(0,0,0,0.1), rgba(0,0,0,0.1)), linear-gradient(0deg, rgba(255,255,255,0.4), rgba(255,255,255,0.4))",
            }}
          >
            <span className="type-kpi text-white">
              {formatValue(kpi.value, {
                format: kpi.format === "percent" ? "percent" : "compact",
                prefix: kpi.prefix,
                suffix: kpi.format === "percent" ? undefined : kpi.suffix,
              })}
            </span>
            <span className="type-body text-white">{kpi.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
