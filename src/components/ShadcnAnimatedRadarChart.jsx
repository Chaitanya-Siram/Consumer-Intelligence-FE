import React, { useState, useMemo } from "react";
import { RadarChart } from "./charts/radar-chart";
import { RadarGrid } from "./charts/radar-grid";
import { RadarAxis } from "./charts/radar-axis";
import { RadarLabels } from "./charts/radar-labels";
import { RadarArea } from "./charts/radar-area";
import { Rich } from "../utils/text.jsx";

const DEFAULT_RADAR_PALETTE = [
  "#10B981", // Emerald Green
  "#1D4ED8", // Royal Blue
  "#F59E0B", // Amber Gold
  "#EF4444", // Coral Red
  "#7C3AED", // Deep Purple
  "#00C9A7", // Teal
];

export default function ShadcnAnimatedRadarChart({
  chart,
  height = 360,
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Normalize metrics & data series
  const { metrics, dataSeries } = useMemo(() => {
    const raw = chart?.data || chart;
    if (!raw) return { metrics: [], dataSeries: [] };

    // Format 1: Explicit metrics & data
    if (chart?.metrics && Array.isArray(chart.metrics) && chart?.data && Array.isArray(chart.data)) {
      return {
        metrics: chart.metrics,
        dataSeries: chart.data.map((item, idx) => ({
          label: item.label || item.name || `Series ${idx + 1}`,
          color: item.color || DEFAULT_RADAR_PALETTE[idx % DEFAULT_RADAR_PALETTE.length],
          values: item.values || {},
        })),
      };
    }

    // Format 2: Array of metric objects e.g. [{ metric: "Reach", "Brand A": 80, "Brand B": 60 }]
    if (Array.isArray(raw)) {
      if (raw.length === 0) return { metrics: [], dataSeries: [] };

      const firstRow = raw[0];
      const metricKey = Object.keys(firstRow).find((k) =>
        ["metric", "name", "category", "attribute", "label", "key"].includes(k.toLowerCase())
      ) || Object.keys(firstRow)[0];

      const seriesKeys = Object.keys(firstRow).filter((k) => k !== metricKey && typeof firstRow[k] === "number");

      const extractedMetrics = raw.map((row, i) => ({
        key: `metric_${i}`,
        label: String(row[metricKey] || `Metric ${i + 1}`),
      }));

      const extractedSeries = seriesKeys.map((sKey, idx) => {
        const values = {};
        raw.forEach((row, i) => {
          values[`metric_${i}`] = Number(row[sKey]) || 0;
        });
        return {
          label: sKey,
          color: DEFAULT_RADAR_PALETTE[idx % DEFAULT_RADAR_PALETTE.length],
          values,
        };
      });

      return { metrics: extractedMetrics, dataSeries: extractedSeries };
    }

    // Format 3: Single key-value object e.g. { Reach: 85, Sentiment: 70, Engagement: 90 }
    if (typeof raw === "object") {
      const keys = Object.keys(raw).filter(
        (k) =>
          k !== "title" &&
          k !== "description" &&
          k !== "type" &&
          k !== "chart_id" &&
          typeof raw[k] !== "function"
      );

      const extractedMetrics = keys.map((k, i) => ({
        key: `m_${i}`,
        label: k,
      }));

      const values = {};
      keys.forEach((k, i) => {
        const v = typeof raw[k] === "number" ? raw[k] : Number(raw[k]?.value ?? raw[k]?.score ?? 50);
        values[`m_${i}`] = isNaN(v) ? 50 : Math.min(100, Math.max(0, v));
      });

      return {
        metrics: extractedMetrics,
        dataSeries: [
          {
            label: chart?.title || "Performance",
            color: chart?.color || DEFAULT_RADAR_PALETTE[0],
            values,
          },
        ],
      };
    }

    return { metrics: [], dataSeries: [] };
  }, [chart]);

  if (!metrics.length || !dataSeries.length) {
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
        No radar data available
      </div>
    );
  }

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        minHeight: height,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Series Legend Header */}
      {dataSeries.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "16px",
            width: "100%",
            paddingRight: "12px",
            marginBottom: "6px",
          }}
        >
          {dataSeries.map((series, idx) => {
            const isHovered = hoveredIndex === idx;
            return (
              <div
                key={series.label}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "12px",
                  fontWeight: "600",
                  color: isHovered ? "var(--ink, #0B1220)" : "var(--ink2, #37445B)",
                  cursor: "pointer",
                  opacity: hoveredIndex !== null && !isHovered ? 0.4 : 1,
                  transition: "opacity 0.2s ease, color 0.2s ease",
                }}
              >
                <span
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "3px",
                    background: series.color,
                    display: "inline-block",
                  }}
                />
                <span>{series.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Radar Chart Container */}
      <div
        style={{
          width: "100%",
          height: height - 30,
          animation: "fadeInZoom 0.4s ease-out",
        }}
      >
        <RadarChart
          data={dataSeries}
          metrics={metrics}
          levels={5}
          margin={55}
          animate={true}
          enterDurationMs={1100}
          hoveredIndex={hoveredIndex}
          onHoverChange={setHoveredIndex}
        >
          <RadarGrid showLabels={true} />
          <RadarAxis />
          <RadarLabels offset={24} fontSize={11} interactive={true} />
          {dataSeries.map((item, index) => (
            <RadarArea
              key={item.label || index}
              index={index}
              color={item.color}
              showPoints={true}
              showGlow={true}
            />
          ))}
        </RadarChart>
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
