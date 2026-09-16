import type { ReactNode } from "react";
import { motion } from "motion/react";
import { Icon } from "@/components/ui/icon";
import { staggerItem } from "@/components/motion/motion-primitives";
import { cn } from "@/lib/utils";
import { Rich } from "@/utils/text.jsx";
import { useChartAi } from "@/context/ChartAiContext.jsx";
import { AiSparkleIcon } from "@/components/CustomChartWidgets.jsx";
import {
  getCardStyleOverride,
  useDesignAgentUpdate,
} from "@/utils/designAgent.js";
import { parseCssColor } from "@/api/pexels.js";

/**
 * Borderless chart container. Composition (top→bottom):
 * title + insight snippet (left) with a more (⋯) action top-right,
 * the chart body (fills), then a small info line at the bottom.
 */
export function SenseCard({
  chartId: chartIdProp,
  title,
  snippet,
  footer,
  analysis,
  onOpenAnalysis,
  className,
  children,
}: {
  chartId?: string;
  title: string;
  snippet?: string;
  footer?: string;
  analysis?: string;
  onOpenAnalysis?: () => void;
  className?: string;
  children: ReactNode;
}) {
  useDesignAgentUpdate();
  const { activeChart, openChartAi } = useChartAi();
  const cardOverride = getCardStyleOverride(title);

  const effectiveChartId = chartIdProp || (title ? title.toLowerCase().replace(/\s+/g, "_") : "");
  const isActive = activeChart?.chart_id === effectiveChartId || activeChart?.title === title;

  const isExplicitColor =
    cardOverride?.background_type === "color" ||
    cardOverride?.background_type === "gradient";

  const videoUrl =
    !isExplicitColor &&
    (cardOverride?.video_url ||
      (cardOverride?.background_type === "video"
        ? cardOverride?.background_color
        : null) ||
      (cardOverride?.background_color?.includes?.("pexels.com") ||
      cardOverride?.background_color?.endsWith?.(".mp4")
        ? cardOverride?.background_color
        : null));

  const isVideo = !!videoUrl;

  const imageUrl =
    !isExplicitColor &&
    !isVideo &&
    (cardOverride?.image_url ||
      (cardOverride?.background_type === "image"
        ? cardOverride?.background_color
        : null) ||
      (cardOverride?.background_color?.startsWith?.("http")
        ? cardOverride?.background_color
        : null));

  const isImage = !isExplicitColor && !isVideo && !!imageUrl;

  const parsedBgColor = cardOverride?.background_color
    ? parseCssColor(cardOverride.background_color)
    : undefined;

  const cardCustomStyle = cardOverride
    ? {
        position: "relative" as const,
        overflow: "hidden" as const,
        background:
          isVideo || isImage ? "rgba(15, 23, 42, 0.75)" : parsedBgColor,
        borderColor: cardOverride.border_color || "rgba(255, 255, 255, 0.25)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.25)",
        color: cardOverride.text_color || "#ffffff",
      }
    : undefined;

  return (
    <motion.section
      variants={staggerItem}
      data-chart-id={effectiveChartId}
      data-chart-title={title}
      data-chart-active={isActive ? "true" : undefined}
      style={{
        ...cardCustomStyle,
        boxShadow: isActive
          ? "0 0 0 2px #6366F1, 0 12px 32px rgba(99, 102, 241, 0.35)"
          : cardCustomStyle?.boxShadow,
        transform: isActive ? "scale(1.008)" : "none",
        transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
      className={cn(
        " flex h-full min-h-[260px] flex-col rounded-[var(--sense-radius)] bg-white p-[20px] w-[100%]",
        className,
      )}
    >
      {isVideo && videoUrl && (
        <video
          key={videoUrl}
          autoPlay
          loop
          muted
          playsInline
          src={videoUrl}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.45,
            pointerEvents: "none",
            zIndex: 0,
            filter: "brightness(0.75) contrast(1.1)",
          }}
        />
      )}
      {isVideo && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(15,23,42,0.3) 0%, rgba(15,23,42,0.7) 100%)",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
      )}

      {isImage && imageUrl && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.55,
            pointerEvents: "none",
            zIndex: 0,
            filter: "brightness(0.75) contrast(1.1)",
          }}
        />
      )}
      {isImage && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(15,23,42,0.3) 0%, rgba(15,23,42,0.75) 100%)",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
      )}

      <header
        className={cn(
          "relative",
          "z-10",
          "flex",
          "items-start",
          "justify-between",
          "gap-4",
        )}
      >
        <div className="min-w-0">
          <h3
            className={cn("type-title", "text-foreground")}
            style={
              cardOverride?.text_color
                ? { color: cardOverride.text_color }
                : cardOverride
                  ? { color: "#ffffff" }
                  : undefined
            }
          >
            {title}
          </h3>
          {snippet && (
            <p
              className={cn("type-caption", "mt-1", "text-muted-foreground")}
              style={{ color: "oklch(0.53 0.015 265)" }}
            >
              {snippet}
            </p>
          )}
        </div>
        <div className={cn("flex", "items-center", "gap-2", "shrink-0")}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openChartAi({
                chart_id: effectiveChartId,
                title: title,
                description: snippet,
              });
            }}
            className={`edit-with-ai-btn${isActive ? " active" : ""}`}
          >
            <AiSparkleIcon size={14} className="ai-sparkle" />
            <span>Edit with AI</span>
          </button>

          <button
            type="button"
            aria-label="More options"
            className={cn(
              "-mr-1",
              "-mt-1",
              "flex",
              "size-8",
              "shrink-0",
              "items-center",
              "justify-center",
              "rounded-md",
              "text-muted-foreground",
              "transition-colors",
              "hover:bg-muted",
              "hover:text-foreground",
            )}
          >
            <Icon name="more_horiz" size={20} />
          </button>
        </div>
      </header>

      <div
        className={cn(
          "relative",
          "z-10",
          "flex",
          "min-h-0",
          "flex-1",
          "items-center",
          "justify-center",
          "pt-3",
          "w-[100%]",
        )}
      >
        {children}
      </div>

      {(footer || analysis || onOpenAnalysis) && (
        <div
          className={cn(
            "relative",
            "z-10",
            "mt-5",
            "type-caption",
            "text-muted-foreground",
            "[&_p]:mb-0",
            "[&_p]:leading-normal",
          )}
          style={
            cardOverride?.text_color
              ? { color: cardOverride.text_color }
              : cardOverride
                ? { color: "rgba(255, 255, 255, 0.9)" }
                : undefined
          }
        >
          {footer ? (
            <Rich
              text={footer}
              style={{ color: "oklch(0.53 0.015 265)", lineHeight: 1.4 }}
              suffix={
                onOpenAnalysis || analysis ? (
                  <button
                    type="button"
                    onClick={onOpenAnalysis}
                    className={cn(
                      "inline-flex",
                      "items-center",
                      "ml-1",
                      "text-xs",
                      "font-semibold",
                      "text-indigo-600",
                      "hover:text-indigo-800",
                      "underline",
                      "cursor-pointer",
                      "transition-colors",
                    )}
                    style={{ color: "var(--accent-a, #6366f1)" }}
                  >
                    Read More
                  </button>
                ) : null
              }
            />
          ) : onOpenAnalysis || analysis ? (
            <Rich
              text={
                typeof analysis === "string" && analysis.trim()
                  ? analysis.trim().length > 160
                    ? analysis.trim().slice(0, 160) + "…"
                    : analysis.trim()
                  : ""
              }
              style={{ color: "oklch(0.53 0.015 265)", lineHeight: 1.4 }}
              inline={true}
              suffix={
                <button
                  type="button"
                  onClick={onOpenAnalysis}
                  className={cn(
                    "inline-flex",
                    "items-center",
                    "ml-1",
                    "text-xs",
                    "font-semibold",
                    "text-indigo-600",
                    "hover:text-indigo-800",
                    "underline",
                    "cursor-pointer",
                    "transition-colors",
                  )}
                  style={{ color: "var(--accent-a, #6366f1)" }}
                >
                  Read More
                </button>
              }
            />
          ) : null}
        </div>
      )}
    </motion.section>
  );
}
