import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import type { DashboardDetail } from "@/data/types";
import { renderWidget, widgetDef, type WidgetKind } from "./widget-registry";
import type { CategoryViz } from "./category-chart";
import type { CoverBg } from "./cover-kpi-card";
import { Skeleton } from "@/components/ui/skeleton";
import "@/dashboards/template7/Template7.css";

export const WIDGET_DND_TYPE = "application/x-widget-id";

export interface CardStyle {
  backgroundType?: "color" | "gradient" | "image" | "video";
  backgroundColor?: string;
  bgImage?: string;
  bgVideo?: string;
  textColor?: string;
  titleFont?: string;
  borderColor?: string;
  seriesColor?: string;
}

export interface CanvasWidget {
  id: string;
  kind: WidgetKind;
  /** Column span: 1 = full width, 0.5 = half (two per row). */
  span?: 0.5 | 1;
  /** Chart-type override for category widgets (donut/pie/bar). */
  viz?: CategoryViz;
  /** Optional insight/narrative shown under the chart. */
  insight?: string;
  /** Cover-KPI title override. */
  title?: string;
  /** Subtitle override. */
  subtitle?: string;
  /** Cover-KPI background (gradient / image / video). */
  cover?: CoverBg;
  /** Gauge: use the dual-arc gradient variant. */
  gaugeGradient?: boolean;
  /** Executive-summary body text. */
  summary?: string;
  /** Ad-hoc chart payload for the "dynamic" kind — see widget-registry's
   * DynamicChart. Carried on the widget itself (unlike every other kind,
   * which reads from `detail`) because it's a one-off answer chart, e.g.
   * from the PR Intent engine, not part of the project's live dashboard. */
  chart?: import("./widget-registry").DynamicChart;
  /** Real-data payload computed from session tagged articles. */
  liveData?: Record<string, any>;
  /** Custom section card styling (background colors/videos/images, fonts, text colors). */
  cardStyle?: CardStyle;
}

/**
 * Right dashboard panel — assembled canvas built with Template 7 styling.
 * Renders full-bleed hero tiles, dynamic chart sections, data tables, and media assets.
 */
export function DashboardCanvas({
  widgets,
  detail,
  isLoading = false,
  onReorder,
  onRemove,
  onSetSpan,
  onSetCover,
}: {
  widgets: CanvasWidget[];
  detail: DashboardDetail;
  isLoading?: boolean;
  onReorder: (dragId: string, overId: string) => void;
  onRemove: (id: string) => void;
  onSetSpan: (id: string, span: 0.5 | 1) => void;
  onSetCover: (id: string, cover: CoverBg) => void;
}) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const imgInput = useRef<HTMLInputElement>(null);
  const vidInput = useRef<HTMLInputElement>(null);
  const pendingCover = useRef<string | null>(null);

  const pickImage = (id: string) => {
    pendingCover.current = id;
    imgInput.current?.click();
  };
  const pickVideo = (id: string) => {
    pendingCover.current = id;
    vidInput.current?.click();
  };

  const startDrag = (
    e: React.DragEvent<HTMLButtonElement>,
    id: string
  ) => {
    const card = (e.currentTarget as HTMLElement).closest(
      "[data-card]"
    ) as HTMLElement | null;
    if (card) e.dataTransfer.setDragImage(card, 24, 24);
    e.dataTransfer.effectAllowed = "copyMove";
    e.dataTransfer.setData(WIDGET_DND_TYPE, id);
    setDragId(id);
  };

  if (isLoading) {
    return (
      <div className="t7-content flex flex-col gap-4 p-4" data-dashboard-template="sense">
        <div className="flex items-center justify-between rounded-xl bg-slate-900/90 p-6 text-white backdrop-blur-md">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48 bg-white/20" />
            <Skeleton className="h-4 w-72 bg-white/10" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-9 w-20 bg-white/20" />
            <Skeleton className="h-9 w-20 bg-white/20" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-64 rounded-xl bg-slate-100" />
          <Skeleton className="h-64 rounded-xl bg-slate-100" />
        </div>
      </div>
    );
  }

  if (widgets.length === 0) {
    return (
      <div className="t7-content flex h-full flex-col items-center justify-center gap-3 text-center" data-dashboard-template="sense">
        <span
          className="flex size-12 items-center justify-center rounded-full"
          style={{ backgroundColor: "var(--sense-tile)" }}
        >
          <Icon name="dashboard_customize" size={24} />
        </span>
        <h2 className="type-title text-foreground">Your dashboard is empty</h2>
        <p className="type-caption max-w-xs text-muted-foreground">
          Ask the chat to add a chart, data table, or media section — try “build a PR impact dashboard” or “show sales table”.
        </p>
      </div>
    );
  }

  return (
    <div className="t7-content flex flex-wrap items-stretch gap-[12px]" data-dashboard-template="sense">
      {widgets.map((w) => {
        const def = widgetDef(w.kind);
        const half = w.span === 0.5;
        const dragging = dragId === w.id;
        const isCover = w.kind === "cover-kpi";
        const isFullBleed = isCover || w.kind === "executive-summary";

        const controls = (
          <CardControls
            half={half}
            dark={isFullBleed}
            open={menuId === w.id}
            onToggle={() => setMenuId((m) => (m === w.id ? null : w.id))}
            onClose={() => setMenuId(null)}
            onDragStart={(e) => startDrag(e, w.id)}
            onDragEnd={() => setDragId(null)}
            onSetSpan={(span) => onSetSpan(w.id, span)}
            onRemove={() => onRemove(w.id)}
            coverActions={
              isCover
                ? {
                    onImage: () => pickImage(w.id),
                    onVideo: () => pickVideo(w.id),
                    onReset: () =>
                      onSetCover(w.id, { kind: "default", src: null }),
                  }
                : undefined
            }
          />
        );

        const bgType = w.cardStyle?.backgroundType;
        const isDarkBg =
          bgType === "video" ||
          bgType === "image" ||
          (w.cardStyle?.backgroundColor &&
            (w.cardStyle.backgroundColor.includes("gradient") ||
              w.cardStyle.backgroundColor.includes("#0f") ||
              w.cardStyle.backgroundColor.includes("#1e") ||
              w.cardStyle.backgroundColor.includes("#02") ||
              w.cardStyle.backgroundColor.includes("#11")));

        const cardStyleObj: React.CSSProperties = {
          width: half ? "calc(50% - 6px)" : "100%",
          position: "relative",
          overflow: "hidden",
        };

        if (w.cardStyle?.backgroundColor) {
          cardStyleObj.background = w.cardStyle.backgroundColor;
        }

        if (w.cardStyle?.borderColor) {
          cardStyleObj.borderColor = w.cardStyle.borderColor;
        }

        return (
          <motion.section
            key={w.id}
            layout
            data-card
            transition={{ type: "spring", stiffness: 500, damping: 40 }}
            onDragOver={(e) => {
              e.preventDefault();
              if (dragId && dragId !== w.id) onReorder(dragId, w.id);
            }}
            onDrop={() => setDragId(null)}
            animate={{ scale: dragging ? 0.97 : 1, opacity: dragging ? 0.5 : 1 }}
            style={cardStyleObj}
            className={cn(
              "group flex flex-col rounded-[var(--sense-radius)] bg-white shadow-2xs transition-all hover:shadow-xs border border-slate-100",
              isFullBleed ? "relative overflow-hidden" : "p-[20px]"
            )}
          >
            {/* Background Video Overlay */}
            {bgType === "video" && w.cardStyle?.bgVideo && (
              <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  src={w.cardStyle.bgVideo}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-[1px]" />
              </div>
            )}

            {/* Background Image Overlay */}
            {bgType === "image" && w.cardStyle?.bgImage && (
              <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <img
                  src={w.cardStyle.bgImage}
                  alt="Card Background"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px]" />
              </div>
            )}

            {/* Card Content Layer */}
            <div className="relative z-10 flex flex-col flex-1">
              {isFullBleed ? (
                <>
                  {renderWidget(w.kind, detail, {
                    title: w.title,
                    cover: w.cover,
                    summary: w.summary,
                    liveData: w.liveData,
                  })}
                  <div className="absolute right-3 top-3 z-10">{controls}</div>
                </>
              ) : (
                <>
                  <header className="mb-2 flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <h3
                        className={cn(
                          "type-title",
                          isDarkBg || w.cardStyle?.textColor
                            ? "text-white"
                            : "text-foreground"
                        )}
                        style={{
                          fontFamily: w.cardStyle?.titleFont || undefined,
                          color: w.cardStyle?.textColor || undefined,
                        }}
                      >
                        {w.title ?? def.title}
                      </h3>
                      <p
                        className={cn(
                          "type-caption mt-1 line-clamp-2",
                          isDarkBg || w.cardStyle?.textColor
                            ? "text-white/70"
                            : "text-muted-foreground"
                        )}
                        style={{
                          color: w.cardStyle?.textColor ? `${w.cardStyle.textColor}b3` : undefined,
                        }}
                        title={w.subtitle ?? def.snippet}
                      >
                        {w.subtitle ?? def.snippet}
                      </p>
                    </div>
                    {controls}
                  </header>

                  <div className="flex flex-1 items-center justify-center pt-4">
                    {renderWidget(w.kind, detail, {
                      viz: w.viz,
                      gaugeGradient: w.gaugeGradient,
                      chart: w.chart,
                      liveData: w.liveData,
                    })}
                  </div>

                  {w.insight && (
                    <p
                      className={cn(
                        "mt-5 type-caption whitespace-pre-line",
                        isDarkBg || w.cardStyle?.textColor
                          ? "text-white/80"
                          : "text-muted-foreground"
                      )}
                      style={{
                        color: w.cardStyle?.textColor ? `${w.cardStyle.textColor}cc` : undefined,
                      }}
                    >
                      {w.insight}
                    </p>
                  )}
                </>
              )}
            </div>
          </motion.section>
        );
      })}

      {/* Hidden file inputs for cover background updates */}
      <input
        ref={imgInput}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          const id = pendingCover.current;
          if (f && id) {
            const reader = new FileReader();
            reader.onload = () =>
              onSetCover(id, { kind: "image", src: String(reader.result) });
            reader.readAsDataURL(f);
          }
          e.target.value = "";
        }}
      />
      <input
        ref={vidInput}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          const id = pendingCover.current;
          if (f && id) {
            onSetCover(id, { kind: "video", src: URL.createObjectURL(f) });
          }
          e.target.value = "";
        }}
      />
    </div>
  );
}

function CardControls({
  half,
  dark,
  open,
  onToggle,
  onClose,
  onDragStart,
  onDragEnd,
  onSetSpan,
  onRemove,
  coverActions,
}: {
  half: boolean;
  dark: boolean;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  onDragStart: (e: React.DragEvent<HTMLButtonElement>) => void;
  onDragEnd: () => void;
  onSetSpan: (span: 0.5 | 1) => void;
  onRemove: () => void;
  coverActions?: {
    onImage: () => void;
    onVideo: () => void;
    onReset: () => void;
  };
}) {
  const iconBtn = cn(
    "flex size-8 items-center justify-center rounded-md transition-colors",
    dark
      ? "text-white/85 hover:bg-white/20 hover:text-white"
      : "text-muted-foreground hover:bg-muted hover:text-foreground"
  );

  return (
    <div className="flex shrink-0 items-center gap-0.5">
      <button
        type="button"
        aria-label="Drag to reorder"
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        className={cn(
          iconBtn,
          "cursor-grab opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 active:cursor-grabbing"
        )}
      >
        <Icon name="drag_indicator" size={20} />
      </button>

      <div className="relative">
        <button
          type="button"
          aria-label="More options"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={onToggle}
          className={iconBtn}
        >
          <Icon name="more_horiz" size={20} />
        </button>

        <AnimatePresence>
          {open && (
            <>
              <button
                aria-label="Close menu"
                className="fixed inset-0 z-10 cursor-default"
                onClick={onClose}
              />
              <motion.div
                role="menu"
                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={{ duration: 0.13 }}
                className="absolute right-0 top-full z-20 mt-1 w-48 overflow-hidden rounded-[12px] bg-white p-1 text-foreground shadow-lg"
              >
                {coverActions && (
                  <>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        coverActions.onImage();
                        onClose();
                      }}
                      className="flex w-full items-center gap-2 rounded-[8px] px-2.5 py-2 type-caption transition-colors hover:bg-muted"
                    >
                      <Icon name="image" size={16} />
                      Image background
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        coverActions.onVideo();
                        onClose();
                      }}
                      className="flex w-full items-center gap-2 rounded-[8px] px-2.5 py-2 type-caption transition-colors hover:bg-muted"
                    >
                      <Icon name="videocam" size={16} />
                      Video background
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        coverActions.onReset();
                        onClose();
                      }}
                      className="flex w-full items-center gap-2 rounded-[8px] px-2.5 py-2 type-caption transition-colors hover:bg-muted"
                    >
                      <Icon name="gradient" size={16} />
                      Reset to gradient
                    </button>
                  </>
                )}
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onSetSpan(half ? 1 : 0.5);
                    onClose();
                  }}
                  className="flex w-full items-center gap-2 rounded-[8px] px-2.5 py-2 type-caption transition-colors hover:bg-muted"
                >
                  <Icon name={half ? "crop_landscape" : "view_column_2"} size={16} />
                  {half ? "Full width" : "Half width"}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onClose();
                    onRemove();
                  }}
                  className="flex w-full items-center gap-2 rounded-[8px] px-2.5 py-2 type-caption transition-colors hover:bg-muted"
                >
                  <Icon name="delete" size={16} />
                  Remove section
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
