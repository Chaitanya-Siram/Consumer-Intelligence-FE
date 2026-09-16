import { motion } from "motion/react";
import type { Kpi } from "@/data/types";
import { formatValue } from "@/lib/format";
import { useCover } from "@/components/cover/cover-provider";
import {
  staggerContainer,
  staggerItem,
} from "@/components/motion/motion-primitives";
import { Rich } from "@/utils/text.jsx";

/**
 * Cover / hero panel — left column. Exact sense spec:
 * 400w, 20px padding, 12px radius, image/video bg + 40% black scrim,
 * bottom-aligned title (40px) + subtitle (16px) + 2×2 glass KPI grid.
 */
export function CoverPanel({
  eyebrow,
  title,
  subtitle,
  kpis,
  defaultCover,
  videoSrc,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  kpis: Kpi[];
  /** Per-dashboard cover image, used unless the user sets a manual override. */
  defaultCover?: string;
  /** Per-tab video source (from activeVideoSrc), changes based on brand topic */
  videoSrc?: string | null;
}) {
  const { cover } = useCover();

  // Manual override (image/video) wins; otherwise fall back to videoSrc if provided,
  // then defaultCover image, then default gradient.
  const resolved =
    cover.kind !== "default"
      ? cover
      : videoSrc
        ? ({ kind: "video", src: videoSrc } as const)
        : defaultCover
          ? ({ kind: "image", src: defaultCover } as const)
          : cover;

  return (
    <aside className="relative flex h-full w-[var(--sense-cover-w)] shrink-0 flex-col justify-end overflow-hidden rounded-[var(--sense-radius)] bg-white p-[20px]">
      <CoverBackground kind={resolved.kind} src={resolved.src} />

      {/* eyebrow — absolute top-left, 20px inset (Figma) */}
      {eyebrow && (
        <span className="type-body absolute left-[20px] top-[20px] z-10 text-white">
          {eyebrow}
        </span>
      )}

      <div className="relative z-10 flex flex-col gap-[32px]">
        <div className="flex flex-col gap-[10px]">
          <motion.h1
            className="type-display text-white"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          >
            {title}
          </motion.h1>
          {/* {subtitle && (
            <div className="type-body text-white leading-relaxed max-h-[160px] overflow-y-auto pr-1">
              <Rich text={subtitle} />
            </div>
          )} */}
        </div>

        <motion.div
          className="flex flex-col gap-[8px]"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          <div className="flex gap-[8px]">
            {kpis.slice(0, 2).map((kpi) => (
              <GlassKpiCard key={kpi.id} kpi={kpi} />
            ))}
          </div>
          <div className="flex gap-[8px]">
            {kpis.slice(2, 4).map((kpi) => (
              <GlassKpiCard key={kpi.id} kpi={kpi} />
            ))}
          </div>
        </motion.div>
      </div>
    </aside>
  );
}

function CoverBackground({
  kind,
  src,
}: {
  kind: "default" | "image" | "video";
  src: string | null;
}) {
  return (
    <div className="absolute inset-0 rounded-[var(--sense-radius)]">
      {/* base gradient — always present, also the fallback if media fails */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: "#5b6ee1",
          backgroundImage: [
            "radial-gradient(120% 80% at 15% 10%, #8ad9ff 0%, transparent 45%)",
            "radial-gradient(120% 90% at 85% 20%, #b98cff 0%, transparent 50%)",
            "radial-gradient(120% 90% at 70% 90%, #5ff0c0 0%, transparent 45%)",
            "radial-gradient(120% 90% at 20% 85%, #ff8ac6 0%, transparent 45%)",
            "linear-gradient(160deg, #6a7bff 0%, #7b5be6 55%, #35c8a6 100%)",
          ].join(","),
        }}
      />
      {kind === "video" && src && (
        <video
          key={src}
          className="absolute inset-0 h-full w-full object-cover"
          src={src}
          autoPlay
          loop
          muted
          playsInline
        />
      )}
      {kind === "image" && src && (
        <img
          key={src}
          className="absolute inset-0 h-full w-full object-cover"
          src={src}
          alt=""
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      )}
      {/* 40% black scrim (Figma) */}
      <div
        className="absolute inset-0"
        style={{ background: "var(--sense-overlay)" }}
      />
    </div>
  );
}

function GlassKpiCard({ kpi }: { kpi: Kpi }) {
  return (
    <motion.div
      variants={staggerItem}
      className="relative h-[160px] flex-1 overflow-hidden rounded-[var(--sense-radius-sm)] border"
      style={{
        borderColor: "var(--sense-glass-border)",
        backdropFilter: "blur(17px)",
        WebkitBackdropFilter: "blur(17px)",
        backgroundImage:
          "linear-gradient(0deg, rgba(0,0,0,0.1), rgba(0,0,0,0.1)), linear-gradient(0deg, rgba(255,255,255,0.4), rgba(255,255,255,0.4))",
      }}
    >
      <span className="type-kpi absolute left-[15px] top-[15px] text-white">
        {formatValue(kpi.value, {
          format: kpi.format === "percent" ? "percent" : "compact",
          prefix: kpi.prefix,
          suffix: kpi.format === "percent" ? undefined : kpi.suffix,
        })}
      </span>
      <span className="type-body absolute left-[15px] top-[120px] text-white">
        {kpi.label}
      </span>
    </motion.div>
  );
}
