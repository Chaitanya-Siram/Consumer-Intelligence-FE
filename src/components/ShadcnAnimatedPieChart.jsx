import React, { useState, useEffect, useRef } from "react";
import { PieChart } from "./charts/pie-chart";
import { PieSlice } from "./charts/pie-slice";
import { PieCenter } from "./charts/pie-center";

function compact(n) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}

const DEFAULT_PIE_COLORS = [
  "#1D4ED8", // Primary Royal Blue
  "#00C9A7", // Vibrant Teal
  "#F59E0B", // Amber Gold
  "#7C3AED", // Deep Purple
  "#EF4444", // Coral Red
  "#10B981", // Emerald
];

export default function ShadcnAnimatedPieChart({
  chart,
  height = 250,
  innerRadius = 90,
  padAngle = 0.03,
  cornerRadius = 5,
}) {
  const containerRef = useRef(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Normalize data for PieChart (handles both array and object formats)
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

  const sample = rawData[0] || {};
  const labelKey =
    chart?.x_key ||
    ("name" in sample
      ? "name"
      : "label" in sample
        ? "label"
        : "category" in sample
          ? "category"
          : Object.keys(sample)[0]);

  const valueKey =
    chart?.value_keys?.[0] ||
    chart?.data_key ||
    ("value" in sample
      ? "value"
      : "count" in sample
        ? "count"
        : Object.keys(sample).find(
            (k) => k !== labelKey && typeof sample[k] === "number",
          ) || "value");

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

  const pieData = rawData.map((item, idx) => {
    const rawLabel = String(item[labelKey] ?? `Segment ${idx + 1}`);
    const label =
      rawLabel === "POS"
        ? "Positive"
        : rawLabel === "NEG"
          ? "Negative"
          : rawLabel === "NEU"
            ? "Neutral"
            : rawLabel;

    const val = Number(item[valueKey]) || 0;
    const labelLower = label.toLowerCase();
    const itemColor =
      item.color ||
      SENTIMENT_COLOR_MAP[rawLabel] ||
      SENTIMENT_COLOR_MAP[label] ||
      (labelLower.includes("positive") || labelLower.includes("pos")
        ? "#10B981"
        : labelLower.includes("negative") || labelLower.includes("neg")
          ? "#EF4444"
          : labelLower.includes("neutral") || labelLower.includes("neu")
            ? "#94A3B8"
            : labelLower.includes("original")
              ? "#1D4ED8"
              : labelLower.includes("syndicated")
                ? "#00C9A7"
                : DEFAULT_PIE_COLORS[idx % DEFAULT_PIE_COLORS.length]);

    return {
      label,
      value: val,
      color: itemColor,
    };
  });

  const totalValue = pieData.reduce((acc, d) => acc + d.value, 0);

  // Dynamically compute pie graphic diameter & inner radius based on container height
  const pieGraphicSize = height;
  const computedInnerRadius = innerRadius;
  // innerRadius > 0 ? Math.min(innerRadius, pieGraphicSize * 0.38) : 0;

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        height: height,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          animation: "fadeInZoom 0.4s ease-out",
          boxSizing: "border-box",
        }}
      >
        {/* Pie Graphic Container */}
        <div
          style={{
            position: "relative",
            width: pieGraphicSize,
            height: pieGraphicSize,
            flexShrink: 0,
          }}
        >
          <PieChart
            data={pieData}
            innerRadius={computedInnerRadius}
            padAngle={padAngle}
            cornerRadius={cornerRadius}
            hoveredIndex={hoveredIndex}
            onHoverChange={setHoveredIndex}
          >
            {pieData.map((d, index) => (
              <PieSlice
                key={d.label || index}
                index={index}
                color={d.color}
                hoverEffect="translate"
                hoverOffset={8}
              />
            ))}

            {computedInnerRadius > 0 && (
              <PieCenter defaultLabel="Total">
                {({ activeItem, total }) => {
                  const displayLabel = activeItem ? activeItem.label : "Total";
                  const displayValue = activeItem ? activeItem.value : total;
                  const pct =
                    activeItem && total > 0
                      ? ((activeItem.value / total) * 100).toFixed(1) + "%"
                      : "100%";

                  return (
                    <div
                      style={{
                        textAlign: "center",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "10.5px",
                          fontWeight: "700",
                          color: "var(--ink3, #6B7894)",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        {displayLabel}
                      </span>
                      <span
                        style={{
                          fontSize: "18px",
                          fontWeight: "800",
                          color: "var(--ink, #0B1220)",
                          fontFamily: "JetBrains Mono, monospace",
                          lineHeight: "1.2",
                          marginTop: "1px",
                        }}
                      >
                        {compact(displayValue)}
                      </span>
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: "600",
                          color: activeItem ? activeItem.color : "#1D4ED8",
                          marginTop: "1px",
                        }}
                      >
                        {pct}
                      </span>
                    </div>
                  );
                }}
              </PieCenter>
            )}
          </PieChart>
        </div>

        {/* Bounded & Scrollable Legend Container */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            minWidth: "120px",
            maxWidth: "190px",
            maxHeight: `${height - 12}px`,
            overflowY: "auto",
            paddingRight: "4px",
            boxSizing: "border-box",
          }}
          className="iv-pie-legend-scroll"
        >
          {pieData.map((d, idx) => {
            const isSelected = hoveredIndex === idx;
            const isDimmed = hoveredIndex !== null && !isSelected;
            const pct =
              totalValue > 0
                ? ((d.value / totalValue) * 100).toFixed(1) + "%"
                : "0%";

            return (
              <div
                key={d.label}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "8px",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  background: isSelected ? "rgba(0,0,0,0.08)" : "transparent",
                  opacity: isDimmed ? 0.4 : 1,
                  cursor: "pointer",
                  transition: "all 0.15s ease-in-out",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    overflow: "hidden",
                  }}
                >
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: d.color,
                      display: "inline-block",
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: "11.5px",
                      fontWeight: "600",
                      color: "var(--ink2, #37445B)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                    title={d.label}
                  >
                    {d.label}
                  </span>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: "700",
                      fontFamily: "JetBrains Mono, monospace",
                      color: "var(--ink, #0B1220)",
                    }}
                  >
                    {compact(d.value)}
                  </div>
                  <div
                    style={{
                      fontSize: "9.5px",
                      color: "var(--ink3, #6B7894)",
                      fontWeight: "500",
                    }}
                  >
                    {pct}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeInZoom {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
