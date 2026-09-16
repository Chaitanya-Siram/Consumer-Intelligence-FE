import React, { useState, useRef } from "react";
import { AreaChart, Area } from "./charts/area-chart";
import { Background } from "./charts/background";
import { Grid } from "./charts/grid";
import { XAxis } from "./charts/x-axis";
import { YAxis } from "./charts/y-axis";
import { ChartTooltip } from "./charts/tooltip";
import { useChartStable, useChartHover } from "./charts/chart-context";
import { curveMonotoneX } from "@visx/curve";
import { Rich } from "../utils/text.jsx";
import ShadcnAnimatedBarChart from "./ShadcnAnimatedBarChart";

const SENTIMENT_COLOR_MAP = {
  positive: "#10B981",
  pos: "#10B981",
  Positive: "#10B981",
  POS: "#10B981",
  neutral: "#94A3B8",
  neu: "#94A3B8",
  Neutral: "#94A3B8",
  NEU: "#94A3B8",
  negative: "#EF4444",
  neg: "#EF4444",
  Negative: "#EF4444",
  NEG: "#EF4444",
};

function getAreaColor(key, index, fallbackColor) {
  if (key && SENTIMENT_COLOR_MAP[key]) return SENTIMENT_COLOR_MAP[key];
  if (index === 0) return fallbackColor || "#1D4ED8";
  if (index === 1) return "#00C9A7";
  if (index === 2) return "#7C3AED";
  return "#3B82F6";
}

function AiSingleMarkerItem({ cx, cy, color, isParentHovered }) {
  const [isSelfHovered, setIsSelfHovered] = useState(false);
  const isHovered = isSelfHovered || isParentHovered;
  const markerColor = color || "#6366F1";

  if (
    typeof cx !== "number" ||
    typeof cy !== "number" ||
    Number.isNaN(cx) ||
    Number.isNaN(cy)
  ) {
    return null;
  }

  return (
    <g
      transform={`translate(${cx}, ${cy - 14})`}
      onMouseEnter={() => setIsSelfHovered(true)}
      onMouseLeave={() => setIsSelfHovered(false)}
      style={{ cursor: "pointer", pointerEvents: "all" }}
    >
      {/* Soft pulsing aura matching line color */}
      <circle
        r="11"
        fill={markerColor}
        opacity={isHovered ? 0.45 : 0.22}
        className="animate-ping"
      />

      {/* AI Badge Icon Container */}
      <g
        transform="translate(-10, -10)"
        style={{
          transform: isHovered
            ? "translate(-10px, -10px) scale(1.25)"
            : "translate(-10px, -10px) scale(1)",
          transformOrigin: "10px 10px",
          transition: "transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        <circle
          cx="10"
          cy="10"
          r="9.5"
          fill={isHovered ? markerColor : "#ffffff"}
          stroke={markerColor}
          strokeWidth="1.8"
          style={{
            filter: `drop-shadow(0 2px 6px ${markerColor}66)`,
            transition: "fill 0.2s ease, stroke 0.2s ease",
          }}
        />
        <path
          d="M10 4.5L11.1 7.8L14.5 9L11.1 10.2L10 13.5L8.9 10.2L5.5 9L8.9 7.8L10 4.5Z"
          fill={isHovered ? "#ffffff" : markerColor}
          style={{ transition: "fill 0.2s ease" }}
        />
        <path
          d="M15.5 4.5L16.1 6.1L17.7 6.7L16.1 7.3L15.5 8.9L14.9 7.3L13.3 6.7L14.9 6.1L15.5 4.5Z"
          fill={isHovered ? "#ffffff" : markerColor}
          opacity="0.85"
          style={{ transition: "fill 0.2s ease" }}
        />
      </g>
    </g>
  );
}

function AiPeakAreaMarkers({ dateInsights, valueKeys = [], primaryKey, lineColor }) {
  const { data, xScale, yScale, xAccessor } = useChartStable();
  const { tooltipData } = useChartHover();

  if (
    !dateInsights ||
    !Array.isArray(dateInsights) ||
    !dateInsights.length ||
    !data ||
    !data.length ||
    typeof xScale !== "function" ||
    typeof yScale !== "function"
  )
    return null;

  const keysToUse = valueKeys && valueKeys.length ? valueKeys : [primaryKey].filter(Boolean);

  return (
    <g style={{ pointerEvents: "all" }}>
      {data.map((d, i) => {
        const pointDateStr =
          d.dateStr ||
          (d.date ? new Date(d.date).toISOString().slice(0, 10) : "");
        const matched = dateInsights.find(
          (di) => String(di.date).slice(0, 10) === pointDateStr
        );
        if (!matched) return null;

        // Pick single peak series key for this insight date
        let bestKey = matched.key || matched.series_key;
        if (!bestKey || !keysToUse.includes(bestKey)) {
          let maxVal = -Infinity;
          keysToUse.forEach((k) => {
            const v = Number(d[k]);
            if (!isNaN(v) && v > maxVal) {
              maxVal = v;
              bestKey = k;
            }
          });
        }

        if (!bestKey || typeof d[bestKey] !== "number") return null;

        const isPointHovered =
          tooltipData?.point &&
          (tooltipData.point === d ||
            tooltipData.point.dateStr === d.dateStr ||
            (tooltipData.point.date &&
              new Date(tooltipData.point.date).toISOString().slice(0, 10) ===
                pointDateStr));

        const cx = xScale(xAccessor(d)) ?? 0;
        const cy = yScale(d[bestKey]) ?? 0;

        const kIdx = keysToUse.indexOf(bestKey);
        const color = getAreaColor(bestKey, kIdx, lineColor);

        return (
          <AiSingleMarkerItem
            key={`ai-marker-${i}-${bestKey}`}
            cx={cx}
            cy={cy}
            color={color}
            isParentHovered={isPointHovered}
          />
        );
      })}
    </g>
  );
}

function fmtDate(d) {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return String(d);
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function nf(n) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}

export default function ShadcnAnimatedAreaChart({
  chart,
  dateInsights = [],
  height = 250,
}) {
  const containerRef = useRef(null);

  // Extract raw data (handles array or object)
  let rawData = [];
  const source = chart?.data || chart;

  if (Array.isArray(source)) {
    rawData = source;
  } else if (source && typeof source === "object") {
    rawData = Object.keys(source)
      .filter(
        (key) =>
          key !== "title" &&
          key !== "description" &&
          key !== "type" &&
          key !== "chart_id" &&
          key !== "net_sentiment_score" &&
          key !== "score" &&
          typeof source[key] !== "function",
      )
      .map((key) => {
        const val =
          typeof source[key] === "object"
            ? source[key].value || source[key].count
            : source[key];
        return {
          name: key,
          value: Number(val) || 0,
        };
      })
      .filter((d) => d.value > 0);
  }

  if (!rawData.length) {
    return (
      <div
        style={{
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#888",
          fontSize: "13px",
        }}
      >
        No chart data available
      </div>
    );
  }

  // Fallback to Bar Chart if there is only 1 data point
  if (rawData.length <= 1) {
    return (
      <ShadcnAnimatedBarChart
        chart={chart}
        dateInsights={dateInsights}
        height={height}
      />
    );
  }

  // Determine keys dynamically
  const sample = rawData[0] || {};
  const xKey =
    chart?.x_key ||
    ("date" in sample
      ? "date"
      : "label" in sample
        ? "label"
        : Object.keys(sample)[0]);

  const valueKeys =
    chart?.value_keys ||
    (chart?.data_key ? [chart.data_key] : null) ||
    Object.keys(sample).filter(
      (k) =>
        k !== xKey && k !== "formattedDate" && typeof sample[k] === "number",
    );

  const primaryKey = valueKeys[0] || "count";
  const lineColor = chart?.color || "var(--accent-a, #1D4ED8)";

  const effectiveDateInsights =
    Array.isArray(dateInsights) && dateInsights.length > 0
      ? dateInsights
      : Array.isArray(chart?.dateInsights) && chart.dateInsights.length > 0
        ? chart.dateInsights
        : Array.isArray(chart?.date_insights) && chart.date_insights.length > 0
          ? chart.date_insights
          : [];

  // Format data for @bklit time-series scaling
  const chartData = rawData.map((item) => {
    const rawVal = item[xKey];
    let parsedDate;
    if (rawVal instanceof Date) {
      parsedDate = rawVal;
    } else if (typeof rawVal === "string" || typeof rawVal === "number") {
      parsedDate = new Date(rawVal);
    } else {
      parsedDate = new Date();
    }
    const isDateValid = !isNaN(parsedDate.getTime());

    return {
      ...item,
      date: isDateValid ? parsedDate : item[xKey],
      dateStr: isDateValid
        ? parsedDate.toISOString().slice(0, 10)
        : String(item[xKey]),
      name: isDateValid ? fmtDate(parsedDate) : String(item[xKey]),
    };
  });

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        minHeight: height,
      }}
    >
      {/* Series Legend Header */}
      {valueKeys.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "16px",
            paddingRight: "12px",
            marginBottom: "8px",
          }}
        >
          {valueKeys.map((key, i) => {
            const color = getAreaColor(key, i, lineColor);
            const displayLabel =
              key === "POS"
                ? "Positive"
                : key === "NEG"
                  ? "Negative"
                  : key === "NEU"
                    ? "Neutral"
                    : key;

            return (
              <div
                key={key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "var(--ink2, #37445B)",
                }}
              >
                <span
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "3px",
                    background: color,
                    display: "inline-block",
                  }}
                />
                <span>{displayLabel}</span>
              </div>
            );
          })}
        </div>
      )}

      <div
        style={{
          width: "100%",
          height,
          animation: "fadeInZoom 0.4s ease-out",
        }}
      >
        <AreaChart
          data={chartData}
          xDataKey="date"
          aspectRatio={null}
          margin={{ top: 30, right: 30, bottom: 50, left: 60 }}
          animationDuration={1100}
          animationEasing="cubic-bezier(0.85, 0, 0.15, 1)"
          style={{ width: "100%", height }}
        >
          <Background pattern="dots" opacity={0.85} />
          <Grid horizontal fadeHorizontal />
          <YAxis numTicks={5} formatLargeNumbers={true} />

          {valueKeys.map((key, i) => {
            const color = getAreaColor(key, i, lineColor);
            return (
              <Area
                key={key}
                dataKey={key}
                curve={curveMonotoneX}
                fill={color}
                fillOpacity={0.25}
                stroke={color}
                strokeWidth={2.6}
                fadeEdges
                showHighlight={true}
              />
            );
          })}

          <XAxis numTicks={6} />
          <AiPeakAreaMarkers
            dateInsights={effectiveDateInsights}
            valueKeys={valueKeys}
            primaryKey={primaryKey}
            lineColor={lineColor}
          />

          {/* Custom Tooltip Content with AI Date Insights Popup */}
          <ChartTooltip
            showDatePill={true}
            showCrosshair={true}
            showDots={true}
            matchCrosshair={true}
            indicatorColor={lineColor}
            indicatorDasharray="4,4"
            backgroundColor="#fff"
            panelStyle={{
              backgroundColor: "#fff",
              border: "1px solid rgba(15, 23, 42, 0.12)",
              boxShadow: "0 16px 40px rgba(15, 23, 42, 0.18)",
              borderRadius: "16px",
              maxWidth: "350px",
              zIndex: 999,
            }}
            content={({ point }) => {
              if (!point) return null;
              const pointDateStr =
                point.dateStr ||
                (point.date
                  ? new Date(point.date).toISOString().slice(0, 10)
                  : "");
              const matchedInsight = effectiveDateInsights?.find(
                (di) => String(di.date).slice(0, 10) === pointDateStr,
              );

              return (
                <div
                  style={{
                    padding: "12px 16px",
                    minWidth: "220px",
                    maxWidth: "330px",
                    // The tooltip box itself caps the height and scrolls when
                    // content overflows it, so nothing here should re-clip —
                    // that was cutting the AI summary off mid-sentence.
                    color: "#0F172A",
                  }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: "700",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      color: "#64748B",
                      marginBottom: "8px",
                      borderBottom: "1px solid #F1F5F9",
                      paddingBottom: "6px",
                    }}
                  >
                    {fmtDate(point.date)}
                  </div>

                  {valueKeys.map((key, idx) => {
                    const color = getAreaColor(key, idx, lineColor);
                    const displayLabel =
                      key === "POS"
                        ? "Positive"
                        : key === "NEG"
                          ? "Negative"
                          : key === "NEU"
                            ? "Neutral"
                            : key;
                    const val = point[key];

                    return (
                      <div
                        key={key}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "16px",
                          marginBottom: "6px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <span
                            style={{
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              background: color,
                              display: "inline-block",
                              boxShadow: `0 0 6px ${color}88`,
                            }}
                          />
                          <span
                            style={{
                              fontSize: "12.5px",
                              color: "#334155",
                              fontWeight: "600",
                            }}
                          >
                            {displayLabel}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: "13px",
                            fontWeight: "700",
                            color: "#0F172A",
                            fontFamily: "JetBrains Mono, monospace",
                          }}
                        >
                          {nf(val)}
                        </span>
                      </div>
                    );
                  })}

                  {matchedInsight && (
                    <div
                      style={{
                        marginTop: "12px",
                        paddingTop: "10px",
                        borderTop: "1px solid #F1F5F9",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "11px",
                          fontWeight: "700",
                          color: "#D97706",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                          marginBottom: "6px",
                        }}
                      >
                        <span>✦</span> AI Summary (
                        {matchedInsight.pattern_type || "Peak"})
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#1E293B",
                          lineHeight: "1.4",
                          wordBreak: "break-word",
                        }}
                      >
                        <Rich text={matchedInsight.summary} lineHeight="1.4" />
                      </div>
                    </div>
                  )}
                </div>
              );
            }}
          />
        </AreaChart>
      </div>

      <style>{`
        @keyframes fadeInZoom {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
