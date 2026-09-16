import { memo, useMemo, useState, useEffect, Fragment } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  ScatterChart,
  Scatter,
  ZAxis,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LabelList,
  ReferenceLine,
} from "recharts";
import { Rich } from "../utils/text.jsx";
import { useChartAi } from "../context/ChartAiContext.jsx";
import ShadcnAnimatedBarChart from "./ShadcnAnimatedBarChart.jsx";
import ShadcnAnimatedPieChart from "./ShadcnAnimatedPieChart.jsx";
import ShadcnAnimatedAreaChart from "./ShadcnAnimatedAreaChart.jsx";
import ShadcnAnimatedScatterChart from "./ShadcnAnimatedScatterChart.jsx";
import ShadcnAnimatedRadarChart from "./ShadcnAnimatedRadarChart.jsx";
import ShadcnAnimatedHeatmapChart from "./ShadcnAnimatedHeatmapChart.jsx";
import ShadcnAnimatedUSMap from "./ShadcnAnimatedUSMap.jsx";
import ShadcnAnimatedSpiderMap from "./ShadcnAnimatedSpiderMap.jsx";
import {
  getChartColorOverride,
  getCardStyleOverride,
  useDesignAgentUpdate,
} from "../utils/designAgent.js";

import { chartStyles } from "../theme/chartStyles.js";
import ShadcnAnimatedLineChart from "./ShadcnAnimatedLineChart.jsx";
import { getChartTypeOverride } from "../utils/dynamicChartManager.js";
import { cn } from "../lib/utils";

export function getTheme() {
  const mode = localStorage.getItem("dashboard_template_mode") || "classic";
  return chartStyles[mode] || chartStyles.sense || chartStyles.classic;
}

const PILLARS_LIST = ["Trust", "Value", "Advocacy", "Social", "Brand", "Risk"];

const chartColorOverrides = new Map();

if (typeof window !== "undefined") {
  window.addEventListener("update_chart_style", (e) => {
    const { chart_title_or_id, color } = e.detail || {};
    if (chart_title_or_id && color) {
      const key = String(chart_title_or_id).toLowerCase().trim();
      chartColorOverrides.set(key, color);
      chartColorOverrides.set(key.replace(/[^a-z0-9]/g, ""), color);
      window.dispatchEvent(new Event("chart_style_updated"));
    }
  });
}

export function useChartStyleUpdate() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const handler = () => setTick((t) => t + 1);
    window.addEventListener("chart_style_updated", handler);
    return () => window.removeEventListener("chart_style_updated", handler);
  }, []);
}

function colorFor(key, i, chart) {
  if (chart) {
    const titleKey = chart.title || chart.chart_id || "";
    const override =
      getChartColorOverride(titleKey) || chart.override_color || chart.color;
    if (override) return override;
  }
  const theme = getTheme();
  return (
    theme.sentiment[key] ||
    theme.pillars[key] ||
    theme.palette[i % theme.palette.length]
  );
}

const AXIS = "var(--chart-axis)";
const AXIS_LINE = "var(--chart-axis-line)";
const GRID = "var(--chart-grid)";
const TICK = "var(--chart-tick)";

function nf(n) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}

function fmtDate(d) {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return String(d);
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Shared axis / grid props ──
const axisProps = new Proxy(
  { stroke: null, tick: null, tickLine: null, axisLine: null },
  {
    get(target, prop) {
      const theme = getTheme();
      if (prop === "stroke") return theme.textColor;
      if (prop === "tick") {
        return {
          fill: theme.textColor,
          fontSize: 11.5,
          fontFamily: theme.fontFamily || "'Inter', system-ui, sans-serif",
          fontWeight: 500,
        };
      }
      if (prop === "tickLine")
        return { stroke: theme.gridColor, strokeWidth: 1 };
      if (prop === "axisLine") return false;
      return target[prop];
    },
    ownKeys(target) {
      return Reflect.ownKeys(target);
    },
    getOwnPropertyDescriptor(target, prop) {
      return {
        enumerable: true,
        configurable: true,
        value: this.get(target, prop),
      };
    },
  },
);

const gridProps = new Proxy(
  { strokeDasharray: null, stroke: null, vertical: null },
  {
    get(target, prop) {
      const theme = getTheme();
      if (prop === "strokeDasharray") return "3 3";
      if (prop === "stroke") return theme.gridColor;
      if (prop === "vertical") return false;
      return target[prop];
    },
    ownKeys(target) {
      return Reflect.ownKeys(target);
    },
    getOwnPropertyDescriptor(target, prop) {
      return {
        enumerable: true,
        configurable: true,
        value: this.get(target, prop),
      };
    },
  },
);

/**
 * GlobalChartDefs — render ALL gradient/filter defs ONCE in a hidden SVG.
 * Include this once at the top of any page that renders charts. Individual
 * chart instances can then reference the IDs without re-declaring them.
 */
export const GlobalChartDefs = memo(function GlobalChartDefs() {
  const theme = getTheme();
  return (
    <svg
      style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
      aria-hidden="true"
    >
      <defs>
        <filter id="chartGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {theme.palette.map((color, i) => (
          <Fragment key={i}>
            {/* Area/Default vertical fade */}
            <linearGradient
              id={`grad-palette-${i}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={color} stopOpacity={0.55} />
              <stop offset="60%" stopColor={color} stopOpacity={0.2} />
              <stop offset="100%" stopColor={color} stopOpacity={0.0} />
            </linearGradient>
            {/* Bar horizontal gradient */}
            <linearGradient
              id={`grad-palette-horiz-${i}`}
              x1="0"
              y1="0"
              x2="1"
              y2="0"
            >
              <stop offset="0%" stopColor={color} stopOpacity={0.95} />
              <stop offset="100%" stopColor={color} stopOpacity={0.65} />
            </linearGradient>
            {/* Bar vertical gradient */}
            <linearGradient
              id={`grad-palette-vert-${i}`}
              x1="0"
              y1="1"
              x2="0"
              y2="0"
            >
              <stop offset="0%" stopColor={color} stopOpacity={0.65} />
              <stop offset="100%" stopColor={color} stopOpacity={0.95} />
            </linearGradient>
          </Fragment>
        ))}
        {Object.entries(theme.sentiment).map(([key, val]) => (
          <Fragment key={key}>
            <linearGradient id={`gradient-${key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={val} stopOpacity={0.5} />
              <stop offset="60%" stopColor={val} stopOpacity={0.18} />
              <stop offset="100%" stopColor={val} stopOpacity={0.0} />
            </linearGradient>
            <linearGradient
              id={`gradient-horiz-${key}`}
              x1="0"
              y1="0"
              x2="1"
              y2="0"
            >
              <stop offset="0%" stopColor={val} stopOpacity={0.95} />
              <stop offset="100%" stopColor={val} stopOpacity={0.65} />
            </linearGradient>
            <linearGradient
              id={`gradient-vert-${key}`}
              x1="0"
              y1="1"
              x2="0"
              y2="0"
            >
              <stop offset="0%" stopColor={val} stopOpacity={0.65} />
              <stop offset="100%" stopColor={val} stopOpacity={0.95} />
            </linearGradient>
          </Fragment>
        ))}
        {Object.entries(theme.pillars).map(([key, val]) => (
          <Fragment key={key}>
            <linearGradient
              id={`gradient-pillar-${key}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={val} stopOpacity={0.5} />
              <stop offset="60%" stopColor={val} stopOpacity={0.18} />
              <stop offset="100%" stopColor={val} stopOpacity={0.0} />
            </linearGradient>
            <linearGradient
              id={`gradient-pillar-horiz-${key}`}
              x1="0"
              y1="0"
              x2="1"
              y2="0"
            >
              <stop offset="0%" stopColor={val} stopOpacity={0.95} />
              <stop offset="100%" stopColor={val} stopOpacity={0.65} />
            </linearGradient>
            <linearGradient
              id={`gradient-pillar-vert-${key}`}
              x1="0"
              y1="1"
              x2="0"
              y2="0"
            >
              <stop offset="0%" stopColor={val} stopOpacity={0.65} />
              <stop offset="100%" stopColor={val} stopOpacity={0.95} />
            </linearGradient>
          </Fragment>
        ))}
        <linearGradient id="gradient-default" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={theme.palette[0]} stopOpacity={0.5} />
          <stop offset="60%" stopColor={theme.palette[0]} stopOpacity={0.18} />
          <stop offset="100%" stopColor={theme.palette[0]} stopOpacity={0.0} />
        </linearGradient>
      </defs>
    </svg>
  );
});

export function Empty() {
  return (
    <div
      className="chartempty"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        height: "200px",
        color: "var(--text-soft)",
        fontSize: "13px",
        opacity: 0.6,
        userSelect: "none",
      }}
    >
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ opacity: 0.5 }}
      >
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <path d="M3 9h18M9 21V9" />
      </svg>
      <span>No data available</span>
    </div>
  );
}

export function AiSparkleIcon({ size = 14, className = "ai-sparkle" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: "inline-block", verticalAlign: "middle" }}
    >
      <path
        d="M12 2C12.4 7.2 16.8 11.6 22 12C16.8 12.4 12.4 16.8 12 22C11.6 16.8 7.2 12.4 2 12C7.2 11.6 11.6 7.2 12 2Z"
        fill="currentColor"
      />
      <path
        d="M19 2C19.2 4.4 21.1 6.3 23.5 6.5C21.1 6.7 19.2 8.6 19 11C18.8 8.6 16.9 6.7 14.5 6.5C16.9 6.3 18.8 4.4 19 2Z"
        fill="currentColor"
        opacity="0.8"
      />
    </svg>
  );
}

export function ChartCard({
  chartId: chartIdProp,
  chartType,
  chartData,
  chart,
  title,
  subtitle,
  insight,
  analysis,
  onOpenAnalysis,
  wide,
  children,
}) {
  useDesignAgentUpdate();
  const { activeChart, openChartAi } = useChartAi();
  const cardOverride = getCardStyleOverride(title);

  const effectiveChartId = chartIdProp || chart?.chart_id || chart?.id || (title ? title.toLowerCase().replace(/\s+/g, "_") : "");
  const isActive = activeChart?.chart_id === effectiveChartId || activeChart?.title === title;

  const isExplicitColor = cardOverride?.background_type === "color";

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

  const cardCustomStyle = cardOverride
    ? {
        position: "relative",
        overflow: "hidden",
        background:
          isVideo || isImage
            ? "rgba(15, 23, 42, 0.75)"
            : cardOverride.background_color,
        borderColor: cardOverride.border_color || "rgba(255, 255, 255, 0.25)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.25)",
        color: "#ffffff",
      }
    : undefined;

  return (
    <div
      className={`chartcard${wide ? " chartcard--wide" : ""}`}
      style={{
        ...cardCustomStyle,
        boxShadow: isActive
          ? "0 0 0 2px #6366F1, 0 12px 32px rgba(99, 102, 241, 0.35)"
          : cardCustomStyle?.boxShadow,
        transform: isActive ? "scale(1.008)" : "none",
        transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
      data-chart-id={effectiveChartId}
      data-chart-title={title}
      data-chart-active={isActive ? "true" : undefined}
    >
      {isVideo && (
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

      <div
        className="chartcard__head"
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "12px",
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <h3
            className="chartcard__title"
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
          {subtitle && (
            <p
              className="chartcard__sub"
              style={
                cardOverride?.text_color
                  ? { color: cardOverride.text_color, opacity: 0.9 }
                  : cardOverride
                    ? { color: "rgba(255, 255, 255, 0.85)" }
                    : undefined
              }
            >
              {subtitle}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            openChartAi({
              chart_id: effectiveChartId,
              title: title,
              chart_type: chartType || chart?.chart_type || "bar",
              data: chartData || chart?.data,
              description: subtitle,
            });
          }}
          className={`edit-with-ai-btn${isActive ? " active" : ""}`}
        >
          <AiSparkleIcon size={14} className="ai-sparkle" />
          <span>Edit with AI</span>
        </button>
      </div>
      <div
        className="chartcard__body"
        style={{ position: "relative", zIndex: 2 }}
      >
        {children}
      </div>
      {(insight || analysis || onOpenAnalysis) && (
        <div
          className="chartcard__insight"
          style={
            cardOverride
              ? {
                  position: "relative",
                  zIndex: 2,
                  color: cardOverride?.text_color || "rgba(255, 255, 255, 0.9)",
                  borderTopColor: cardOverride?.text_color
                    ? "rgba(255, 255, 255, 0.2)"
                    : "rgba(255, 255, 255, 0.2)",
                }
              : undefined
          }
        >
          {insight ? (
            <Rich
              text={insight}
              style={{ color: "oklch(0.53 0.015 265)", lineHeight: 1.4 }}
              suffix={
                (onOpenAnalysis || analysis) ? (
                  <button
                    type="button"
                    onClick={onOpenAnalysis}
                    className="inline-flex items-center ml-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline cursor-pointer transition-colors"
                    style={{ color: "var(--accent-a, #6366f1)" }}
                  >
                    Read More
                  </button>
                ) : null
              }
            />
          ) : (onOpenAnalysis || analysis) ? (
            <Rich
              text={
                typeof analysis === "string" && analysis.trim()
                  ? (analysis.trim().length > 160
                      ? analysis.trim().slice(0, 160) + "…"
                      : analysis.trim())
                  : ""
              }
              style={{ color: "oklch(0.53 0.015 265)", lineHeight: 1.4 }}
              inline={true}
              suffix={
                <button
                  type="button"
                  onClick={onOpenAnalysis}
                  className="inline-flex items-center ml-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline cursor-pointer transition-colors"
                  style={{ color: "var(--accent-a, #6366f1)" }}
                >
                  Read More
                </button>
              }
            />
          ) : null}
        </div>
      )}
    </div>
  );
}

// ── Theme-aware Custom Tooltip ──
export function CustomChartTooltip({ active, payload, label, dateInsights }) {
  if (!active || !payload || !payload.length) return null;

  const uniquePayload = payload.filter(
    (item, index, self) =>
      index ===
      self.findIndex(
        (t) => (t.dataKey || t.name) === (item.dataKey || item.name),
      ),
  );

  const dateStr =
    label ||
    uniquePayload[0]?.payload?.date ||
    uniquePayload[0]?.payload?.label;
  const formattedDate = dateStr ? String(dateStr).slice(0, 10) : "";
  const di = dateInsights?.find(
    (d) => String(d.date).slice(0, 10) === formattedDate,
  );

  const theme = getTheme();
  return (
    <div
      style={{
        background: theme.tooltipBg,
        backdropFilter: "blur(16px)",
        border: `1px solid ${theme.tooltipBorder}`,
        borderRadius: "12px",
        padding: "12px 16px",
        boxShadow:
          "0 8px 32px rgba(0,0,0,0.1), 0 1px 0 rgba(255,255,255,0.05) inset",
        maxWidth: "300px",
        color: theme.tooltipText,
        fontSize: "12px",
        lineHeight: "1.5",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          fontWeight: 700,
          marginBottom: "8px",
          fontSize: "11px",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: theme.textColor,
        }}
      >
        {fmtDate(dateStr) || dateStr}
      </div>
      {uniquePayload.map((item, index) => (
        <div
          key={index}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 20,
            marginBottom: "4px",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: item.color || "#6366f1",
                display: "inline-block",
                flexShrink: 0,
              }}
            />
            <span style={{ color: theme.textColor }}>{item.name}</span>
          </span>
          <span
            style={{
              fontWeight: 700,
              fontVariantNumeric: "tabular-nums",
              fontFamily: "JetBrains Mono, monospace",
            }}
          >
            {nf(item.value)}
          </span>
        </div>
      ))}
      {di && (
        <div
          style={{
            marginTop: "10px",
            paddingTop: "10px",
            borderTop: `1px solid ${theme.tooltipBorder}`,
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              color: "#f59e0b",
              fontWeight: 700,
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            <span>✦</span> AI Summary ({di.pattern_type || "Spike"})
          </div>
          <div
            style={{
              color: theme.tooltipText || "#f1f5f9",
              fontSize: "11.5px",
              lineHeight: "1.45",
            }}
          >
            <Rich text={di.summary} lineHeight="1.45" />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Custom Dot with pulsing AI indicator on peak dates ──
export const renderCustomDot =
  (dateInsights, fill = "#6366f1") =>
  (props) => {
    const { cx, cy, payload } = props;
    const dateStr = payload?.date || payload?.label;
    if (!dateStr)
      return (
        <circle
          cx={cx}
          cy={cy}
          r={3.5}
          fill={fill}
          stroke="var(--panel)"
          strokeWidth={1.5}
        />
      );

    const formattedDate = String(dateStr).slice(0, 10);
    const matchedInsight = dateInsights?.find(
      (di) => String(di.date).slice(0, 10) === formattedDate,
    );

    if (matchedInsight) {
      return (
        <g key={dateStr} style={{ cursor: "pointer" }}>
          <circle cx={cx} cy={cy} r={12} fill={fill} opacity={0.15} />
          <circle
            cx={cx}
            cy={cy}
            r={7.5}
            fill={fill}
            stroke="var(--panel)"
            strokeWidth={2}
          />
          <path
            d={`M ${cx} ${cy - 3} L ${cx + 0.8} ${cy - 0.8} L ${cx + 3} ${cy} L ${cx + 0.8} ${cy + 0.8} L ${cx} ${cy + 3} L ${cx - 0.8} ${cy + 0.8} L ${cx - 3} ${cy} L ${cx - 0.8} ${cy - 0.8} Z`}
            fill="#fff"
          />
        </g>
      );
    }

    return (
      <circle
        cx={cx}
        cy={cy}
        r={3.5}
        fill={fill}
        stroke="var(--panel)"
        strokeWidth={1.5}
      />
    );
  };

function toRows(data) {
  if (Array.isArray(data))
    return data.filter((r) => r && typeof r === "object");
  if (data && typeof data === "object") {
    // Check if the object values are arrays (e.g. { POS: [...], NEG: [...] })
    if (Object.values(data).some(Array.isArray)) {
      return Object.values(data)
        .flat()
        .filter((r) => r && typeof r === "object");
    }
    // Otherwise it's a key-value mapping
    return Object.entries(data).map(([name, v]) => ({
      name,
      value: v && typeof v === "object" ? (v.value ?? v.count ?? 0) : v,
    }));
  }
  return [];
}

function nameKeyOf(rows) {
  if (!rows.length) return "name";
  const row = rows[0];
  for (const k of [
    "name",
    "label",
    "category",
    "theme",
    "brand",
    "domain",
    "source",
    "date",
    "x",
    "key",
    "group",
    "pillar",
    "kpi",
  ]) {
    if (k in row) return k;
  }
  for (const k of Object.keys(row)) if (typeof row[k] !== "number") return k;
  return Object.keys(row)[0] || "name";
}

function valueKeysOf(rows, series, nameKey) {
  if (Array.isArray(series) && series.length) return series;
  if (!rows.length) return ["value"];
  const keys = Object.keys(rows[0]).filter(
    (k) => k !== nameKey && typeof rows[0][k] === "number",
  );
  return keys.length ? keys : ["value"];
}

/**
 * renderDefs — kept for backward compat. The real gradient definitions are now
 * declared once by <GlobalChartDefs> and referenced by ID across all charts.
 * This stub returns an empty <defs> to satisfy recharts' internal SVG structure.
 */
function renderDefs(_chartId) {
  return <defs />;
}

// ── Shared Tooltip style ──
const TOOLTIP_STYLE = new Proxy(
  {
    background: null,
    border: null,
    borderRadius: null,
    color: null,
    fontSize: null,
    boxShadow: null,
    backdropFilter: null,
    padding: null,
  },
  {
    get(target, prop) {
      const theme = getTheme();
      if (prop === "background") return theme.tooltipBg;
      if (prop === "border") return `1px solid ${theme.tooltipBorder}`;
      if (prop === "borderRadius") return "12px";
      if (prop === "color") return theme.tooltipText;
      if (prop === "fontSize") return "12px";
      if (prop === "boxShadow") return "0 4px 12px rgba(0,0,0,0.06)";
      if (prop === "backdropFilter") return "blur(20px)";
      if (prop === "padding") return "10px 14px";
      return target[prop];
    },
    ownKeys(target) {
      return Reflect.ownKeys(target);
    },
    getOwnPropertyDescriptor(target, prop) {
      return {
        enumerable: true,
        configurable: true,
        value: this.get(target, prop),
      };
    },
  },
);

// ── Shared Legend style ──
const legendStyle = new Proxy(
  { fontSize: null, color: null, fontFamily: null, paddingTop: null },
  {
    get(target, prop) {
      const theme = getTheme();
      if (prop === "fontSize") return "11.5px";
      if (prop === "color") return theme.textColor;
      if (prop === "fontFamily")
        return theme.fontFamily || "'Plus Jakarta Sans', system-ui, sans-serif";
      if (prop === "paddingTop") return "8px";
      return target[prop];
    },
    ownKeys(target) {
      return Reflect.ownKeys(target);
    },
    getOwnPropertyDescriptor(target, prop) {
      return {
        enumerable: true,
        configurable: true,
        value: this.get(target, prop),
      };
    },
  },
);

// ── Trust & Score Waterfall Chart ──
export function WaterfallChart({ data }) {
  const rows = useMemo(() => {
    let current = 0;
    return (data || []).map((d) => {
      const val = Number(d.value) || 0;
      let start = 0;
      let diff = val;

      if (d.kind === "add" || d.kind === "subtract") {
        start = current;
        diff = val;
        current += val;
      } else {
        start = 0;
        diff = val;
        current = val;
      }

      const bottom = diff >= 0 ? start : start + diff;
      const height = Math.abs(diff);

      return {
        label: d.label,
        bottom,
        height,
        color:
          d.kind === "total" ? "#6366f1" : diff >= 0 ? "#10b981" : "#ef4444",
        rawVal: val,
      };
    });
  }, [data]);

  if (!rows.length) return <Empty />;
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart
        data={rows}
        margin={{ top: 16, right: 20, left: 8, bottom: 16 }}
      >
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="label" {...axisProps} />
        <YAxis {...axisProps} tickFormatter={nf} width={50} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          cursor={{ fill: "var(--chart-grid)", radius: 6 }}
          formatter={(v, n, props) => [nf(props.payload.rawVal), "Value"]}
        />
        <ReferenceLine
          y={0}
          stroke={AXIS_LINE}
          strokeWidth={1.5}
          ifOverflow="visible"
        />
        <Bar dataKey="bottom" stackId="w" fill="transparent" />
        <Bar dataKey="height" stackId="w" radius={[7, 7, 0, 0]}>
          {rows.map((r, i) => (
            <Cell key={i} fill={r.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Weight Sensitivity Tornado Chart ──
export function TornadoChart({ data }) {
  const rows = useMemo(() => {
    const grouped = {};
    (data || []).forEach((d) => {
      if (!grouped[d.pillar]) grouped[d.pillar] = { pillar: d.pillar };
      if (d.direction === "up") {
        grouped[d.pillar].up = d.delta;
      } else if (d.direction === "down") {
        grouped[d.pillar].down = d.delta;
      }
    });
    return Object.values(grouped);
  }, [data]);

  if (!rows.length) return <Empty />;
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart
        layout="vertical"
        data={rows}
        margin={{ top: 12, right: 20, left: 16, bottom: 8 }}
      >
        <CartesianGrid {...gridProps} horizontal={false} vertical={true} />
        <XAxis type="number" {...axisProps} tickFormatter={nf} />
        <YAxis type="category" dataKey="pillar" {...axisProps} width={88} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          cursor={{ fill: "var(--chart-grid)", radius: 4 }}
          formatter={(v) => [
            v > 0 ? `+${v.toFixed(2)}` : v.toFixed(2),
            "RI Change",
          ]}
        />
        <ReferenceLine
          x={0}
          stroke={AXIS_LINE}
          strokeWidth={1.5}
          ifOverflow="visible"
        />
        <Bar
          dataKey="up"
          fill="#10b981"
          name="Shift Up (+10%)"
          radius={[0, 7, 7, 0]}
          maxBarSize={28}
        />
        <Bar
          dataKey="down"
          fill="#ef4444"
          name="Shift Down (-10%)"
          radius={[7, 0, 0, 7]}
          maxBarSize={28}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Theme × Pillar Heatmap Grid ──
export function HeatmapGrid({ data, pillars = PILLARS_LIST }) {
  const maxVal = useMemo(() => {
    let max = 0;
    (data || []).forEach((d) => {
      Object.values(d.values || {}).forEach((v) => {
        if (v > max) max = v;
      });
    });
    return max || 1;
  }, [data]);

  if (!data || !data.length) return <Empty />;
  return (
    <div style={{ overflowX: "auto", marginTop: 8 }}>
      <table
        style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}
      >
        <thead>
          <tr>
            <th
              style={{
                textAlign: "left",
                padding: "10px 12px",
                color: "var(--text-soft)",
                borderBottom: "1px solid var(--border-default)",
                fontWeight: 600,
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Theme
            </th>
            {pillars.map((p) => (
              <th
                key={p}
                style={{
                  textAlign: "center",
                  padding: "10px 8px",
                  color: "var(--text-soft)",
                  borderBottom: "1px solid var(--border-default)",
                  fontWeight: 600,
                  fontSize: "11px",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                {p}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.theme}>
              <td
                style={{
                  textAlign: "left",
                  padding: "10px 12px",
                  fontWeight: 600,
                  color: "var(--text)",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                {row.theme}
              </td>
              {pillars.map((p) => {
                const val = row.values?.[p] || 0;
                const ratio = val / maxVal;
                return (
                  <td
                    key={p}
                    style={{
                      textAlign: "center",
                      padding: "12px 8px",
                      fontWeight: 700,
                      fontVariantNumeric: "tabular-nums",
                      color: val > 0 ? "#fff" : "var(--text-soft)",
                      borderBottom: "1px solid var(--border)",
                      background:
                        val > 0
                          ? `rgba(99, 91, 255, ${Math.max(0.18, ratio)})`
                          : "transparent",
                      transition: "background 0.2s",
                      borderRadius: 4,
                    }}
                  >
                    {val}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Pillar Scores Radar Chart ──
export function PillarRadarChart({ data }) {
  const rows = useMemo(() => {
    const currentItem = (data || []).find((d) => d.name === "Current");
    const prevItem = (data || []).find((d) => d.name === "Previous");
    return PILLARS_LIST.map((p) => ({
      pillar: p,
      Current: currentItem?.values?.[p] || currentItem?.[p] || 0,
      Previous: prevItem?.values?.[p] || prevItem?.[p] || 0,
    }));
  }, [data]);

  if (!data || !data.length) return <Empty />;
  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart cx="50%" cy="50%" outerRadius="72%" data={rows}>
        <PolarGrid stroke={GRID} strokeDasharray="3 3" />
        <PolarAngleAxis
          dataKey="pillar"
          tick={{
            fill: TICK,
            fontSize: 11.5,
            fontFamily: "'Inter', system-ui, sans-serif",
            fontWeight: 500,
          }}
        />
        <PolarRadiusAxis
          angle={30}
          domain={[0, 100]}
          tick={{ fill: TICK, fontSize: 9.5, fontWeight: 500 }}
          axisLine={false}
          tickCount={4}
        />
        <Radar
          name="Current"
          dataKey="Current"
          stroke="#6366f1"
          strokeWidth={2.5}
          fill="#6366f1"
          fillOpacity={0.22}
          dot={{ r: 3.5, fill: "#6366f1", strokeWidth: 0 }}
        />
        <Radar
          name="Previous"
          dataKey="Previous"
          stroke="#94a3b8"
          strokeWidth={1.5}
          strokeDasharray="4 3"
          fill="#94a3b8"
          fillOpacity={0.08}
        />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Legend wrapperStyle={legendStyle} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

// ── Hourly Heatmap (Days × Hours) ──
export function HourlyHeatmap({ data }) {
  const rows = Array.isArray(data) ? data : [];
  const max = useMemo(() => {
    let m = 0;
    rows.forEach((r) =>
      r.data?.forEach((c) => {
        if (c.count > m) m = c.count;
      }),
    );
    return m || 1;
  }, [rows]);

  if (!rows.length) return <Empty />;
  return (
    <div className="heatmap">
      <div className={cn("heatmap__row", "heatmap__row--head")}>
        <span className="heatmap__day" />
        {Array.from({ length: 24 }).map((_, h) => (
          <span
            key={h}
            className="heatmap__hcell"
            style={{ color: "var(--chart-label)", fontSize: "10px" }}
          >
            {h % 6 === 0 ? `${h}h` : ""}
          </span>
        ))}
      </div>
      {rows.map((r) => (
        <div
          className="heatmap__row"
          key={r.day}
          style={{ display: "flex", alignItems: "center" }}
        >
          <span
            className="heatmap__day"
            style={{
              width: "40px",
              fontSize: "11px",
              color: "var(--chart-label)",
            }}
          >
            {r.day.slice(0, 3)}
          </span>
          {r.data.map((c) => (
            <span
              key={c.hour}
              className="heatmap__cell"
              title={`${r.day} ${c.hour}:00 · ${c.count}`}
              style={{
                flex: 1,
                height: "20px",
                margin: "2px",
                borderRadius: "4px",
                background: c.count
                  ? `rgba(99, 102, 241, ${0.12 + 0.88 * (c.count / max)})`
                  : "var(--surface-2)",
                transition: "background 0.2s",
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Flat Treemap / Ranked List Renderer ──
export function TreemapList({ data, nameKey = "name", valKey = "value" }) {
  const rows = useMemo(() => {
    return (data || [])
      .map((d) => ({
        name: d[nameKey] || d.source || d.label || "Unknown",
        value: Number(d[valKey] || d.size || d.reach || d.articles || 0),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [data, nameKey, valKey]);

  if (!rows.length) return <Empty />;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        padding: "4px 2px",
      }}
    >
      {rows.map((r, i) => {
        const pct = rows[0].value ? (r.value / rows[0].value) * 100 : 0;
        const theme = getTheme();
        const color = theme.palette[i % theme.palette.length];
        return (
          <div
            key={i}
            style={{ display: "flex", flexDirection: "column", gap: "7px" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "12px",
              }}
            >
              <span
                style={{
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "6px",
                    background: `${color}22`,
                    border: `1.5px solid ${color}55`,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "9px",
                    fontWeight: 700,
                    color,
                    flexShrink: 0,
                    fontFamily: "JetBrains Mono, monospace",
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                {r.name}
              </span>
              <span
                style={{
                  color: "var(--chart-label)",
                  fontVariantNumeric: "tabular-nums",
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: "11px",
                  fontWeight: 600,
                }}
              >
                {nf(r.value)}
              </span>
            </div>
            <div
              style={{
                height: "4px",
                borderRadius: "99px",
                background: "var(--chart-grid)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${pct}%`,
                  background: `linear-gradient(90deg, ${color}cc, ${color})`,
                  borderRadius: "99px",
                  transition: "width 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Generic Dynamic Data Table ──
export function DataTable({ data }) {
  const rows = toRows(data);
  const cols = useMemo(() => {
    const set = new Set();
    rows.forEach((r) => Object.keys(r).forEach((k) => set.add(k)));
    return Array.from(set).filter((c) => c !== "id" && c !== "key");
  }, [rows]);

  if (!rows.length) return <Empty />;

  return (
    <div
      className="mmtable__scroll"
      style={{ overflowX: "auto", maxHeight: "280px" }}
    >
      <table
        className="mmtable"
        style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}
      >
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border-default)" }}>
            {cols.map((c) => (
              <th
                key={c}
                style={{
                  textAlign: "left",
                  padding: "10px 12px",
                  textTransform: "capitalize",
                  color: "var(--text-soft)",
                  fontWeight: 600,
                  fontSize: "11px",
                  letterSpacing: "0.06em",
                }}
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 50).map((r, i) => (
            <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
              {cols.map((c) => {
                const val = r[c];
                if (c === "sentiment" && val) {
                  return (
                    <td key={c} style={{ padding: "10px 12px" }}>
                      <span
                        style={{
                          background: `${colorFor(val, 0)}22`,
                          color: colorFor(val, 0),
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontSize: "10.5px",
                          fontWeight: 700,
                          letterSpacing: "0.03em",
                        }}
                      >
                        {val}
                      </span>
                    </td>
                  );
                }
                return (
                  <td
                    key={c}
                    style={{
                      padding: "10px 12px",
                      color:
                        typeof val === "number"
                          ? "var(--text)"
                          : "var(--text-soft)",
                    }}
                  >
                    {typeof val === "number" ? nf(val) : String(val ?? "—")}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── PR Impact Scale (gauge + diverging colored bars) ──
// Five performance bands, boundaries at 0 / 15 / 30 / 45 (percent).
const PR_BANDS5 = [
  { key: "verypoor", label: "VERY POOR", range: "Below 0%", color: "#ef4444" },
  { key: "poor", label: "POOR", range: "0 to 15%", color: "#f0962f" },
  { key: "good", label: "GOOD", range: "15 to 30%", color: "#8ed3a4" },
  { key: "verygood", label: "VERY GOOD", range: "30 to 45%", color: "#46b35e" },
  {
    key: "excellent",
    label: "EXCELLENT",
    range: "Above 45%",
    color: "#1f9d55",
  },
];

function prBandColor(v) {
  if (v < 0) return "#ef4444"; // VERY POOR
  if (v < 15) return "#f0962f"; // POOR
  if (v < 30) return "#8ed3a4"; // GOOD
  if (v < 45) return "#46b35e"; // VERY GOOD
  return "#1f9d55"; // EXCELLENT
}

function prPct(v) {
  if (v == null || Number.isNaN(Number(v))) return "—";
  const n = Number(v);
  return `${Number.isInteger(n) ? n : n.toFixed(2)}%`;
}

// Equal-width visual segments so every band is legible regardless of value range.
const GAUGE_STOPS = [-100, 0, 15, 30, 45, 100];
function gaugeFrac(value) {
  const seg = 1 / (GAUGE_STOPS.length - 1);
  const v = Math.max(
    GAUGE_STOPS[0],
    Math.min(GAUGE_STOPS[GAUGE_STOPS.length - 1], Number(value) || 0),
  );
  for (let i = 0; i < GAUGE_STOPS.length - 1; i++) {
    if (v <= GAUGE_STOPS[i + 1]) {
      const t = (v - GAUGE_STOPS[i]) / (GAUGE_STOPS[i + 1] - GAUGE_STOPS[i]);
      return (i + t) * seg;
    }
  }
  return 1;
}

function PRImpactGauge({ value }) {
  const cx = 100;
  const cy = 92;
  const radius = 70;
  const strokeWidth = 14;

  const START_ANGLE = 180;
  const END_ANGLE = 0;

  const polarToCartesian = (angle, r = radius) => {
    const rad = (Math.PI / 180) * angle;

    return {
      x: cx + r * Math.cos(rad),
      y: cy - r * Math.sin(rad),
    };
  };

  const describeArc = (startAngle, endAngle) => {
    const start = polarToCartesian(startAngle);
    const end = polarToCartesian(endAngle);

    return `
      M ${start.x} ${start.y}
      A ${radius} ${radius} 0 0 1 ${end.x} ${end.y}
    `;
  };

  const segmentAngle = 180 / PR_BANDS5.length;

  const needleAngle = START_ANGLE - gaugeFrac(value) * 180;

  const needleEnd = polarToCartesian(needleAngle, radius - 18);

  return (
    <svg
      width="100%"
      height="125"
      viewBox="0 0 200 125"
      style={{
        display: "block",
        maxWidth: 220,
        overflow: "visible",
      }}
    >
      {/* Colored Segments */}
      {PR_BANDS5.map((band, index) => {
        const start = START_ANGLE - index * segmentAngle;
        const end = START_ANGLE - (index + 1) * segmentAngle;

        return (
          <path
            key={band.key}
            d={describeArc(start, end)}
            fill="none"
            stroke={band.color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        );
      })}

      {/* Labels */}
      {GAUGE_STOPS.map((stop, index) => {
        const angle = START_ANGLE - (180 / (GAUGE_STOPS.length - 1)) * index;

        const p = polarToCartesian(angle, radius + 20);

        return (
          <text
            key={stop}
            x={p.x}
            y={p.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontFamily="Inter"
            fontSize="9"
            fontWeight="600"
            fill="#8D84A8"
          >
            {stop}%
          </text>
        );
      })}

      {/* Needle */}
      <line
        x1={cx}
        y1={cy}
        x2={needleEnd.x}
        y2={needleEnd.y}
        stroke="#4B5563"
        strokeWidth="2.8"
        strokeLinecap="round"
      />

      {/* Needle Center */}
      <circle cx={cx} cy={cy} r="6" fill="#4B5563" />
    </svg>
  );
}

function PRImpactChart({ chart, height = 300 }) {
  const d = chart?.data || {};
  const series = Array.isArray(d.data) ? d.data : [];
  const rows = series.map((r) => ({
    date: r.label ?? r.date ?? r.name,
    value: Number(r.pr_impact ?? r.value ?? 0) || 0,
    docs: r.doc_count ?? 0,
  }));

  return (
    <div
      style={{
        display: "flex",
        gap: 24,
        alignItems: "flex-start",
        flexWrap: "wrap",
        width: "100%",
      }}
    >
      {/* Left column: gauge + score + 5-band legend */}
      <div style={{ width: 196, flexShrink: 0 }}>
        <PRImpactGauge value={d.gauge} />
        <div
          style={{
            fontSize: 11.5,
            fontWeight: 600,
            color: "var(--wine-text-mid, #5a4f7a)",
            marginTop: 2,
          }}
        >
          PR Impact Score
        </div>
        <div
          style={{
            fontSize: 26,
            fontWeight: 800,
            lineHeight: 1.05,
            color: "var(--wine-text-dark, #1a1130)",
            letterSpacing: "-0.02em",
          }}
        >
          {prPct(d.gauge)}
        </div>
        <div
          style={{
            borderTop: "1px solid var(--wine-border, rgba(120,80,200,0.12))",
            margin: "14px 0 12px",
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[...PR_BANDS5].reverse().map((b) => (
            <div
              key={b.key}
              style={{ display: "flex", alignItems: "flex-start", gap: 8 }}
            >
              <span
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 3,
                  background: b.color,
                  marginTop: 1,
                  flexShrink: 0,
                }}
              />
              <div style={{ lineHeight: 1.2 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--wine-text-dark, #1a1130)",
                  }}
                >
                  {b.label}
                </div>
                <div
                  style={{
                    fontSize: 10.5,
                    color: "var(--wine-text-light, #9b90b8)",
                  }}
                >
                  {b.range}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right column: diverging colored bars */}
      <div style={{ flex: 1, minWidth: 320 }}>
        {rows.length === 0 ? (
          <Empty />
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart
              data={rows}
              margin={{ top: 16, right: 16, left: 0, bottom: 8 }}
              barCategoryGap="14%"
            >
              <CartesianGrid {...gridProps} vertical={false} />
              <XAxis
                dataKey="date"
                {...axisProps}
                tickFormatter={fmtDate}
                interval="preserveStartEnd"
                minTickGap={28}
                tick={{
                  fill: getTheme().textColorMuted || "#9b90b8",
                  fontSize: 11,
                  fontFamily:
                    getTheme().fontFamilyMono || "'JetBrains Mono', monospace",
                  fontWeight: 600,
                }}
              />
              <YAxis {...axisProps} tickFormatter={(v) => `${v}%`} width={46} />
              <ReferenceLine
                y={0}
                stroke={AXIS_LINE}
                strokeWidth={1.5}
                ifOverflow="visible"
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                cursor={{ fill: "var(--chart-grid)", radius: 6 }}
                formatter={(v) => [prPct(v), "PR Impact"]}
              />
              <Bar dataKey="value" radius={[3, 3, 0, 0]} maxBarSize={18}>
                {rows.map((r, i) => (
                  <Cell key={i} fill={prBandColor(r.value)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

// ── PR Comparison (per-brand activity heatmap) ──
function PRComparisonChart({ brands = [], height = 300 }) {
  const list = Array.isArray(brands) ? brands.filter(Boolean) : [];
  if (!list.length) return <Empty />;

  return (
    <ShadcnAnimatedHeatmapChart
      chart={{ type: "pr_comparison", brands: list }}
      height={height}
      mode="pr_comparison"
    />
  );
}

// ── Centralized Dynamic Chart Renderer ──
export function DynamicChartRenderer({
  chart: rawChart,
  dateInsights,
  height = 280,
  activeBrand,
}) {
  useChartStyleUpdate();
  const { getEffectiveChart } = useChartAi();
  const chart = getEffectiveChart(rawChart);

  if (!chart) return null;
  if (chart.error) {
    return (
      <div className="agentchart__err">
        Couldn't build this chart: {chart.error}
      </div>
    );
  }

  // PR Comparison: per-brand activity tick strips (supports N competitors).
  if (
    chart.chart_type === "pr_comparison" ||
    chart.chart_id === "pr_comparison"
  ) {
    return <PRComparisonChart brands={chart.brands || []} height={height} />;
  }

  // PR Impact Scale: gauge + diverging colored bars over a nested time series.
  if (
    chart.chart_id === "pr_impact" ||
    (chart.data &&
      typeof chart.data === "object" &&
      !Array.isArray(chart.data) &&
      Array.isArray(chart.data.data) &&
      ("gauge" in chart.data || "rating_scale" in chart.data))
  ) {
    return <PRImpactChart chart={chart} height={height} />;
  }

  useChartStyleUpdate();
  const theme = getTheme();
  const overrideType = getChartTypeOverride(chart.title || chart.chart_id);
  const type = String(overrideType || chart.chart_type || chart.type || "bar")
    .toLowerCase()
    .trim();
  const rows = toRows(chart.data);

  if (!rows.length && type !== "kpi" && type !== "gauge") {
    return <Empty />;
  }

  const nameKey = nameKeyOf(rows);
  const valueKeys = valueKeysOf(rows, chart.series, nameKey);

  // 1. KPI / Gauge
  if (type === "kpi" || type === "gauge") {
    const rawVal = rows.length
      ? (rows[0][valueKeys[0]] ?? rows[0].value)
      : (chart?.data?.value ?? chart?.data);
    const v =
      typeof rawVal === "object"
        ? (rawVal?.value ?? rawVal?.total_count ?? rawVal?.total_reach)
        : rawVal;

    if (
      chart.chart_id === "ri_gauge" ||
      (chart.data && typeof chart.data === "object" && "band" in chart.data)
    ) {
      const gData = chart.data || {};
      return (
        <div className="kpirow" style={{ display: "flex", gap: 16 }}>
          <div className="kpi">
            <div
              className="kpi__val"
              style={{
                color: gData.band === "red" ? "#ef4444" : "var(--accent-a)",
              }}
            >
              {gData.value ?? "—"}
            </div>
            <div className="kpi__lbl">{chart.title || "Score"}</div>
          </div>
          {gData.delta != null && (
            <div className="kpi">
              <div
                className="kpi__val"
                style={{ color: gData.delta > 0 ? "#10b981" : "#ef4444" }}
              >
                {gData.delta > 0 ? `+${gData.delta}` : gData.delta}
              </div>
              <div className="kpi__lbl">Delta vs Prior</div>
            </div>
          )}
          {gData.band && (
            <div className="kpi">
              <div className="kpi__val" style={{ textTransform: "uppercase" }}>
                {gData.band}
              </div>
              <div className="kpi__lbl">Risk Band</div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="agentchart__kpi">
        <span className="agentchart__kpival">
          {typeof v === "number" ? nf(v) : (v ?? "—")}
        </span>
        {chart.y_label && (
          <span className="agentchart__kpilbl">{chart.y_label}</span>
        )}
      </div>
    );
  }

  // 2. Heatmap
  if (
    type === "heatmap" ||
    chart?.chart_type === "heatmap" ||
    chart?.chart_id?.includes("heatmap")
  ) {
    return <ShadcnAnimatedHeatmapChart chart={chart} height={height} />;
  }

  // 3. Table
  if (type === "table") {
    return <DataTable data={chart.data} />;
  }

  // 4. Waterfall
  if (type === "waterfall") {
    return <WaterfallChart data={chart.data} />;
  }

  // 5. Tornado
  if (type === "tornado") {
    return <TornadoChart data={chart.data} />;
  }

  // 6. Radar
  if (
    type === "radar" ||
    chart?.chart_type === "radar" ||
    chart?.chart_id?.includes("radar")
  ) {
    return <ShadcnAnimatedRadarChart chart={chart} height={height} />;
  }

  // 6b. US Map / Regional Heatmap
  if (
    type === "us_map" ||
    type === "usmap" ||
    chart?.chart_type === "us_map" ||
    chart?.chart_type === "usmap"
  ) {
    return <ShadcnAnimatedUSMap chart={chart} height={height} />;
  }

  // 6c. Spider Map / Network Map
  if (
    type === "spider_map" ||
    type === "spidermap" ||
    type === "spider" ||
    type === "network_map" ||
    chart?.chart_type === "spider_map" ||
    chart?.chart_type === "spidermap"
  ) {
    return <ShadcnAnimatedSpiderMap chart={chart} height={height} />;
  }

  // 7. Pie / Donut
  if (type === "pie" || type === "donut") {
    return (
      <ShadcnAnimatedPieChart
        chart={chart}
        height={height}
        innerRadius={type === "donut" ? 90 : 55}
      />
    );
  }

  // 8. Treemap
  if (type === "treemap") {
    return <TreemapList data={rows} nameKey={nameKey} valKey={valueKeys[0]} />;
  }

  // 9. Scatter / Bubble
  if (
    type === "scatter" ||
    type === "bubble" ||
    chart?.chart_id === "publication_reach_sentiment"
  ) {
    const compactHeight = height > 260 ? 240 : height;
    return (
      <ShadcnAnimatedScatterChart
        chart={chart}
        dateInsights={dateInsights}
        height={compactHeight}
      />
    );
  }

  // 10. Area / Stacked Area
  if (type === "area" || type === "stacked_area") {
    if (rows.length <= 1) {
      return (
        <ShadcnAnimatedBarChart
          chart={chart}
          dateInsights={dateInsights}
          height={height}
        />
      );
    }
    return (
      <ShadcnAnimatedAreaChart
        chart={chart}
        dateInsights={dateInsights}
        height={height}
      />
    );
  }

  // 11. Line
  if (type === "line") {
    if (rows.length <= 1) {
      return (
        <ShadcnAnimatedBarChart
          chart={chart}
          dateInsights={dateInsights}
          height={height}
        />
      );
    }
    return (
      <ShadcnAnimatedLineChart
        chart={chart}
        dateInsights={dateInsights}
        height={height}
      />
    );
    /*
    const mainColor = colorFor(valueKeys[0], 0, chart);
    const gradId = `line-area-grad-${Math.random().toString(36).substr(2, 6)}`;
    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={rows}
          margin={{ top: 16, right: 24, left: 8, bottom: 20 }}
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={mainColor} stopOpacity={0.28} />
              <stop offset="95%" stopColor={mainColor} stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid {...gridProps} />
          <XAxis
            dataKey={nameKey}
            {...axisProps}
            tickFormatter={fmtDate}
            interval="preserveStartEnd"
          />
          <YAxis {...axisProps} tickFormatter={nf} width={50} />
          <ReferenceLine
            y={0}
            stroke={AXIS_LINE}
            strokeWidth={1.5}
            ifOverflow="visible"
          />
          <Tooltip
            content={<CustomChartTooltip dateInsights={dateInsights} />}
          />
          {valueKeys.length > 1 && <Legend wrapperStyle={legendStyle} />}
          <Area
            type="monotone"
            dataKey={valueKeys[0]}
            stroke="none"
            fill={`url(#${gradId})`}
            isAnimationActive={true}
            animationDuration={1800}
            animationEasing="ease-out"
          />
          {valueKeys.map((k, i) => (
            <Line
              key={k}
              type="monotone"
              dataKey={k}
              stroke={colorFor(k, i, chart)}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              dot={renderCustomDot(dateInsights, colorFor(k, i, chart))}
              connectNulls={true}
              activeDot={{
                r: 7,
                strokeWidth: 2.5,
                stroke: "#ffffff",
                fill: colorFor(k, i, chart),
              }}
              isAnimationActive={true}
              animationDuration={1800}
              animationEasing="ease-out"
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
    */
  }

  // 12. Default: Bar / Stacked Bar
  const isStacked = type.includes("stacked");
  const isHorizontal =
    type.includes("horizontal") ||
    (rows.length > 8 && !chart.chart_id?.includes("tier"));

  return (
    <ShadcnAnimatedBarChart
      chart={chart}
      dateInsights={dateInsights}
      height={height}
      orientation={isHorizontal ? "horizontal" : "vertical"}
      stacked={isStacked}
    />
  );
}
