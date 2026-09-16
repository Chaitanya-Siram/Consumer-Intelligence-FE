import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import NumberFlow from "@number-flow/react";
import { Rich } from "../utils/text.jsx";

function compact(n) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}

export default function ShadcnAnimatedScatterChart({
  chart,
  dateInsights = [],
  height = 250,
}) {
  const containerRef = useRef(null);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [isMounted, setIsMounted] = useState(false);

  // Trigger @bklit spring reveal animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 60);
    return () => clearTimeout(timer);
  }, []);

  // Extract raw data
  const rawData = useMemo(() => {
    const source = chart?.data || chart;
    if (Array.isArray(source)) return source;
    if (source && typeof source === "object") {
      return Object.keys(source)
        .filter(
          (key) =>
            key !== "title" &&
            key !== "description" &&
            key !== "type" &&
            key !== "chart_id" &&
            typeof source[key] !== "function"
        )
        .map((key) => {
          const val = source[key];
          return typeof val === "object"
            ? { ...val, label: key }
            : { label: key, value: Number(val) || 0 };
        });
    }
    return [];
  }, [chart]);

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
        No scatter data available
      </div>
    );
  }

  // Calculate extent for Reach, Sentiment, and Count
  const processedData = rawData.map((d, i) => {
    const label = String(d.label || d.name || d.publication || `Outlet ${i + 1}`);
    const reach = Number(d.total_reach ?? d.reach ?? d.x ?? 0);
    const sentiment = Number(d.net_sentiment ?? d.sentiment ?? d.y ?? 0);
    const count = Math.max(1, Number(d.total_count ?? d.count ?? d.z ?? 1));

    const color =
      d.color ||
      (sentiment > 0
        ? "#10B981"
        : sentiment < 0
        ? "#EF4444"
        : "#94A3B8");

    return {
      raw: d,
      label,
      reach,
      sentiment,
      count,
      color,
    };
  });

  // Calculate axis domains
  const maxReach = Math.max(10, ...processedData.map((d) => d.reach));
  const maxCount = Math.max(1, ...processedData.map((d) => d.count));
  const rawMinSent = Math.min(-10, ...processedData.map((d) => d.sentiment));
  const rawMaxSent = Math.max(10, ...processedData.map((d) => d.sentiment));

  // Nice bounds for Y axis (Net Sentiment)
  const minSentiment = Math.floor(rawMinSent / 10) * 10;
  const maxSentiment = Math.ceil(rawMaxSent / 10) * 10;

  // Layout Padding
  const margin = { top: 25, right: 25, bottom: 42, left: 55 };
  const svgWidth = 600;
  const svgHeight = height;
  const plotWidth = svgWidth - margin.left - margin.right;
  const plotHeight = svgHeight - margin.top - margin.bottom;

  // Scales
  const getX = (reach) => margin.left + (reach / maxReach) * plotWidth;
  const getY = (sentiment) => {
    const range = maxSentiment - minSentiment || 1;
    const pct = (sentiment - minSentiment) / range;
    return margin.top + plotHeight - pct * plotHeight;
  };
  const getRadius = (count) => {
    return 6 + Math.min(18, Math.sqrt(count / maxCount) * 16);
  };

  // X Axis Ticks (Reach)
  const xTicks = [0, maxReach * 0.25, maxReach * 0.5, maxReach * 0.75, maxReach];

  // Y Axis Ticks (5 evenly spaced ticks)
  const numYTicks = 5;
  const yStep = (maxSentiment - minSentiment) / (numYTicks - 1);
  const yTicks = Array.from({ length: numYTicks }, (_, i) =>
    Math.round(minSentiment + i * yStep)
  );

  const hoveredCX = hoveredItem ? getX(hoveredItem.reach) : null;
  const hoveredCY = hoveredItem ? getY(hoveredItem.sentiment) : null;

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        minHeight: height,
      }}
    >
      {/* Legend Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingLeft: "12px",
          paddingRight: "12px",
          marginBottom: "8px",
        }}
      >
        <div
          style={{
            fontSize: "11px",
            fontWeight: "700",
            color: "var(--ink3, #6B7894)",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          Bubble Size: Article Count
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11.5px", fontWeight: "600", color: "var(--ink2, #37445B)" }}>
            <span style={{ width: "9px", height: "9px", borderRadius: "50%", background: "#10B981" }} />
            Positive (+ Sentiment)
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11.5px", fontWeight: "600", color: "var(--ink2, #37445B)" }}>
            <span style={{ width: "9px", height: "9px", borderRadius: "50%", background: "#94A3B8" }} />
            Neutral (0)
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11.5px", fontWeight: "600", color: "var(--ink2, #37445B)" }}>
            <span style={{ width: "9px", height: "9px", borderRadius: "50%", background: "#EF4444" }} />
            Negative (- Sentiment)
          </div>
        </div>
      </div>

      {/* SVG Scatter Chart */}
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        style={{
          width: "100%",
          height: "100%",
          overflow: "visible",
        }}
      >
        <defs>
          <clipPath id="scatter-grow-clip">
            <rect
              x="0"
              y="0"
              width={isMounted ? "100%" : "0%"}
              height="100%"
              style={{
                transition: "width 1100ms cubic-bezier(0.85, 0, 0.15, 1)",
              }}
            />
          </clipPath>
        </defs>

        {/* Static Y-Axis & X-Axis Line & Labels */}
        <line
          x1={margin.left}
          x2={margin.left}
          y1={margin.top}
          y2={margin.top + plotHeight}
          stroke="rgba(0,0,0,0.15)"
        />

        {/* Y Axis Ticks & Labels */}
        {yTicks.map((val, idx) => {
          const y = getY(val);
          return (
            <g key={`y-tick-label-${idx}`}>
              <line
                x1={margin.left - 5}
                x2={margin.left}
                y1={y}
                y2={y}
                stroke="rgba(0,0,0,0.2)"
              />
              <text
                x={margin.left - 10}
                y={y + 4}
                textAnchor="end"
                fontSize="11"
                fill="#6B7894"
                fontWeight="500"
              >
                {val > 0 ? `+${val}` : val}
              </text>
            </g>
          );
        })}

        {/* X Axis Line */}
        <line
          x1={margin.left}
          x2={margin.left + plotWidth}
          y1={margin.top + plotHeight}
          y2={margin.top + plotHeight}
          stroke="rgba(0,0,0,0.15)"
        />

        {/* X Axis Ticks & Labels (Reach) */}
        {xTicks.map((val, idx) => {
          const x = getX(val);
          return (
            <g key={`x-tick-${idx}`} transform={`translate(${x}, ${margin.top + plotHeight})`}>
              <line y2="5" stroke="rgba(0,0,0,0.2)" />
              <text
                y="18"
                textAnchor="middle"
                fontSize="11"
                fill="#6B7894"
                fontWeight="500"
              >
                {compact(val)}
              </text>
            </g>
          );
        })}

        {/* Axis Labels */}
        <text
          x={margin.left + plotWidth / 2}
          y={svgHeight - 8}
          textAnchor="middle"
          fontSize="11.5"
          fontWeight="700"
          fill="#37445B"
        >
          Total Reach →
        </text>
        <text
          transform={`rotate(-90)`}
          x={-(margin.top + plotHeight / 2)}
          y="18"
          textAnchor="middle"
          fontSize="11.5"
          fontWeight="700"
          fill="#37445B"
        >
          Net Sentiment →
        </text>

        {/* Clip-Path Reveal Group for Grid & Bubbles */}
        <g clipPath="url(#scatter-grow-clip)">
          {/* Horizontal Grid lines */}
          {yTicks.map((val, idx) => {
            const y = getY(val);
            return (
              <line
                key={`y-grid-${idx}`}
                x1={margin.left}
                x2={margin.left + plotWidth}
                y1={y}
                y2={y}
                stroke={val === 0 ? "rgba(0,0,0,0.25)" : "rgba(0,0,0,0.06)"}
                strokeDasharray={val === 0 ? "4,4" : "2,2"}
                strokeWidth={val === 0 ? 1.5 : 1}
              />
            );
          })}

          {/* Line Chart Style Crosshairs on Hover */}
          {hoveredItem && hoveredCX != null && hoveredCY != null && (
            <>
              {/* Vertical Crosshair Line */}
              <line
                x1={hoveredCX}
                x2={hoveredCX}
                y1={margin.top}
                y2={margin.top + plotHeight}
                stroke={hoveredItem.color}
                strokeDasharray="4,4"
                strokeWidth={1.5}
                opacity={0.7}
              />
              {/* Horizontal Crosshair Line */}
              <line
                x1={margin.left}
                x2={margin.left + plotWidth}
                y1={hoveredCY}
                y2={hoveredCY}
                stroke={hoveredItem.color}
                strokeDasharray="4,4"
                strokeWidth={1.5}
                opacity={0.7}
              />
            </>
          )}

          {/* Scatter Bubbles with Line Chart Hover Dim & Focus */}
          {processedData.map((d, idx) => {
            const cx = getX(d.reach);
            const cy = getY(d.sentiment);
            const r = getRadius(d.count);
            const isHovered = hoveredItem?.label === d.label;
            const isAnyHovered = hoveredItem != null;

            return (
              <g
                key={`bubble-${idx}`}
                className="cursor-pointer"
                onMouseEnter={(e) => {
                  setHoveredItem(d);
                  const rect = containerRef.current?.getBoundingClientRect();
                  if (rect) {
                    setTooltipPos({
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top,
                    });
                  }
                }}
                onMouseMove={(e) => {
                  const rect = containerRef.current?.getBoundingClientRect();
                  if (rect) {
                    setTooltipPos({
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top,
                    });
                  }
                }}
                onMouseLeave={() => setHoveredItem(null)}
                style={{
                  transition: "opacity 0.25s ease, filter 0.25s ease",
                  opacity: isAnyHovered ? (isHovered ? 1 : 0.35) : 1,
                  filter: isAnyHovered && !isHovered ? "blur(1.5px)" : "none",
                }}
              >
                {/* Outer Glow Aura on Hover */}
                {isHovered && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={r + 8}
                    fill="none"
                    stroke={d.color}
                    strokeWidth="2.5"
                    opacity="0.75"
                    style={{ animation: "ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite" }}
                  />
                )}

                {/* Main Bubble */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? r + 3 : r}
                  fill={d.color}
                  fillOpacity={isHovered ? 0.95 : 0.78}
                  stroke="#ffffff"
                  strokeWidth={isHovered ? 2.5 : 1.5}
                  style={{
                    transition: "all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
                    filter: isHovered
                      ? "drop-shadow(0 6px 16px rgba(0,0,0,0.3))"
                      : "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
                  }}
                />
              </g>
            );
          })}
        </g>
      </svg>

      {/* Line Chart Style Animated X-Axis Ticker Pill */}
      <AnimatePresence>
        {hoveredItem && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            style={{
              position: "absolute",
              bottom: "8px",
              left: `${(getX(hoveredItem.reach) / svgWidth) * 100}%`,
              transform: "translateX(-50%)",
              background: "#0B1220",
              color: "#ffffff",
              borderRadius: "9999px",
              padding: "4px 12px",
              fontSize: "11.5px",
              fontWeight: "700",
              boxShadow: "0 6px 20px rgba(0, 0, 0, 0.25)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              pointerEvents: "none",
              zIndex: 90,
            }}
          >
            <span style={{ color: "#94A3B8", fontSize: "10.5px" }}>Reach:</span>
            <NumberFlow
              value={hoveredItem.reach}
              format={{ notation: "compact", maximumFractionDigits: 1 }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Hover Tooltip Popup */}
      {hoveredItem && (
        <div
          style={{
            position: "absolute",
            left: Math.min(tooltipPos.x + 12, (containerRef.current?.offsetWidth || 500) - 220),
            top: Math.max(10, tooltipPos.y - 85),
            zIndex: 100,
            background: "#ffffff",
            border: "1px solid rgba(0, 0, 0, 0.1)",
            boxShadow: "0 10px 28px rgba(0, 0, 0, 0.16)",
            borderRadius: "10px",
            padding: "10px 14px",
            minWidth: "190px",
            pointerEvents: "none",
            animation: "tooltipFade 0.2s ease-out",
          }}
        >
          <div
            style={{
              fontSize: "12.5px",
              fontWeight: "700",
              color: "var(--ink, #0B1220)",
              marginBottom: "6px",
              borderBottom: "1px solid rgba(0,0,0,0.06)",
              paddingBottom: "4px",
              wordBreak: "break-word",
            }}
          >
            {hoveredItem.label}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              fontSize: "11.5px",
              marginBottom: "3px",
            }}
          >
            <span style={{ color: "var(--ink2, #37445B)", fontWeight: "500" }}>
              Net Sentiment:
            </span>
            <span
              style={{
                fontWeight: "700",
                fontFamily: "monospace",
                color: hoveredItem.sentiment > 0 ? "#10B981" : hoveredItem.sentiment < 0 ? "#EF4444" : "#94A3B8",
              }}
            >
              {hoveredItem.sentiment > 0 ? `+${hoveredItem.sentiment}` : hoveredItem.sentiment}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              fontSize: "11.5px",
              marginBottom: "3px",
            }}
          >
            <span style={{ color: "var(--ink2, #37445B)", fontWeight: "500" }}>
              Total Count (Articles):
            </span>
            <span style={{ fontWeight: "700", fontFamily: "monospace", color: "var(--ink, #0B1220)" }}>
              <NumberFlow value={hoveredItem.count} />
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              fontSize: "11.5px",
            }}
          >
            <span style={{ color: "var(--ink2, #37445B)", fontWeight: "500" }}>
              Total Reach:
            </span>
            <span style={{ fontWeight: "700", fontFamily: "monospace", color: "var(--ink, #0B1220)" }}>
              <NumberFlow
                value={hoveredItem.reach}
                format={{ notation: "compact", maximumFractionDigits: 1 }}
              />
            </span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes tooltipFade {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
