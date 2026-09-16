import React, { useState, useEffect, useRef } from "react";
import { BarChart } from "./charts/bar-chart";
import { Bar } from "./charts/bar";
import { BarXAxis } from "./charts/bar-x-axis";
import { BarYAxis } from "./charts/bar-y-axis";
import { Grid } from "./charts/grid";
import { YAxis } from "./charts/y-axis";
import { XAxis } from "./charts/x-axis";
import { ChartTooltip } from "./charts/tooltip";
import { useChartStable } from "./charts/chart-context";
import { Rich } from "../utils/text.jsx";
import { useChartAi } from "../context/ChartAiContext.jsx";
import { DynamicChartRenderer } from "./CustomChartWidgets.jsx";

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

function AiPeakBarMarkers({
  dateInsights,
  primaryKey,
  lineColor,
  orientation,
}) {
  const { data, barScale, valueScale, barXAccessor } = useChartStable();

  if (
    !dateInsights ||
    !dateInsights.length ||
    !data ||
    !data.length ||
    typeof valueScale !== "function" ||
    typeof barScale !== "function"
  )
    return null;

  const isHorizontal = orientation === "horizontal";

  return (
    <g className="pointer-events-none">
      {data.map((d, i) => {
        const pointDateStr =
          d.dateStr ||
          (d.date ? new Date(d.date).toISOString().slice(0, 10) : "");
        const matched = dateInsights.find(
          (di) => String(di.date).slice(0, 10) === pointDateStr,
        );
        if (!matched) return null;

        const val = d[primaryKey];
        if (typeof val !== "number") return null;

        const catPos = barScale(barXAccessor(d)) ?? 0;
        const valPos = valueScale(val) ?? 0;
        const bw = barScale.bandwidth ? barScale.bandwidth() : 30;

        const cx = isHorizontal ? valPos + 12 : catPos + bw / 2;
        const cy = isHorizontal ? catPos + bw / 2 : valPos - 14;

        return (
          <g key={`ai-bar-marker-${i}`} transform={`translate(${cx}, ${cy})`}>
            <circle
              r="10"
              fill="#f59e0b"
              opacity="0.22"
              className="animate-ping"
            />
            <g transform="translate(-9, -9)">
              <rect
                width="18"
                height="18"
                rx="9"
                fill="#ffffff"
                stroke="#f59e0b"
                strokeWidth="1.6"
                style={{
                  filter: "drop-shadow(0 2px 5px rgba(245,158,11,0.3))",
                }}
              />
              <path
                d="M9 3.5L10 7L13.5 8L10 9L9 12.5L8 9L4.5 8L8 7L9 3.5Z"
                fill="#f59e0b"
              />
            </g>
          </g>
        );
      })}
    </g>
  );
}

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

function getBarColor(key, index, fallbackColor) {
  if (SENTIMENT_COLOR_MAP[key]) return SENTIMENT_COLOR_MAP[key];
  if (index === 0) return fallbackColor || "#1D4ED8";
  if (index === 1) return "#00C9A7";
  if (index === 2) return "#7C3AED";
  return "#3B82F6";
}

export default function ShadcnAnimatedBarChart({
  chart: rawChart,
  dateInsights = [],
  height = 250,
  orientation = "vertical",
  stacked = false,
}) {
  const containerRef = useRef(null);
  const { getEffectiveChart } = useChartAi();
  const chart = getEffectiveChart(rawChart);
  const chartType = String(chart?.chart_type || chart?.type || "bar").toLowerCase().trim();

  // Render bar chart directly without calling DynamicChartRenderer back

  const rawData = Array.isArray(chart?.data)
    ? chart.data
    : Array.isArray(chart)
      ? chart
      : [];

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

  const sample = rawData[0] || {};
  const xKey =
    chart?.x_key ||
    ("date" in sample
      ? "date"
      : "label" in sample
        ? "label"
        : "name" in sample
          ? "name"
          : Object.keys(sample)[0]);

  // Find all keys in sample that match sentiment categories
  const sentimentKeyMatches = Object.keys(sample).filter(
    (k) =>
      k !== xKey &&
      k !== "value" &&
      k !== "count" &&
      k !== "total" &&
      (SENTIMENT_COLOR_MAP[k] || SENTIMENT_COLOR_MAP[k.toLowerCase()]),
  );

  let valueKeys;
  if (sentimentKeyMatches.length > 0) {
    // Prioritize sentiment breakdown keys (POS, NEU, NEG / Positive, Neutral, Negative)
    valueKeys = sentimentKeyMatches;
  } else if (
    chart?.value_keys &&
    Array.isArray(chart.value_keys) &&
    chart.value_keys.length > 0
  ) {
    valueKeys = chart.value_keys;
  } else if (chart?.data_key) {
    valueKeys = [chart.data_key];
  } else {
    valueKeys = Object.keys(sample).filter(
      (k) =>
        k !== xKey &&
        k !== "formattedDate" &&
        k !== "date" &&
        k !== "name" &&
        k !== "label" &&
        typeof sample[k] === "number",
    );
  }

  const hasSentimentKeys = valueKeys.some(
    (k) => SENTIMENT_COLOR_MAP[k] || SENTIMENT_COLOR_MAP[k.toLowerCase()],
  );

  const isStacked =
    stacked ||
    chart?.stacked === true ||
    hasSentimentKeys ||
    chart?.type?.includes("stacked") ||
    sentimentKeyMatches.length > 0;

  const isHorizontal =
    orientation === "horizontal" ||
    chart?.orientation === "horizontal" ||
    chart?.type?.includes("horizontal") ||
    hasSentimentKeys;

  const primaryKey = valueKeys[0] || "count";
  const lineColor = chart?.color || "var(--accent-a, #1D4ED8)";

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

  const margins = isHorizontal
    ? { top: 25, right: 40, bottom: 40, left: 100 }
    : { top: 30, right: 30, bottom: 50, left: 60 };

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        minHeight: height,
      }}
    >
      <div
        style={{
          width: "100%",
          height,
          animation: "fadeInZoom 0.4s ease-out",
        }}
      >
        <BarChart
          data={chartData}
          xDataKey="name"
          aspectRatio={null}
          orientation={isHorizontal ? "horizontal" : "vertical"}
          stacked={isStacked}
          stackGap={isStacked ? 2 : 0}
          margin={margins}
          animationDuration={1100}
          style={{ width: "100%", height }}
        >
          <Grid
            horizontal={!isHorizontal}
            vertical={isHorizontal}
            fadeHorizontal
          />
          {!isHorizontal ? (
            <YAxis numTicks={5} formatLargeNumbers={true} />
          ) : (
            <XAxis numTicks={5} formatLargeNumbers={true} />
          )}

          {valueKeys.map((key, i) => {
            const fill = getBarColor(key, i, lineColor);
            return (
              <Bar
                key={key}
                dataKey={key}
                fill={fill}
                stackGap={isStacked ? 2 : 0}
                lineCap="round"
                animate={true}
                animationType="grow"
              />
            );
          })}

          {isHorizontal ? <BarYAxis /> : <BarXAxis />}
          <AiPeakBarMarkers
            dateInsights={dateInsights}
            primaryKey={primaryKey}
            lineColor={lineColor}
            orientation={isHorizontal ? "horizontal" : "vertical"}
          />

          {/* Custom Tooltip Content */}
          <ChartTooltip
            showDatePill={!isHorizontal}
            showCrosshair={true}
            showDots={true}
            matchCrosshair={true}
            indicatorColor={lineColor}
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
                (point.date instanceof Date
                  ? point.date.toISOString().slice(0, 10)
                  : String(point.name || ""));

              const matchedInsight = dateInsights?.find(
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
                    {point.name || fmtDate(point.date)}
                  </div>

                  {valueKeys.map((key, idx) => {
                    const color = getBarColor(key, idx, lineColor);
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
        </BarChart>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
        @keyframes fadeInZoom {
          from { opacity: 0; transform: scale(0.97); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
