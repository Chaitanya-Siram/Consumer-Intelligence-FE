import React, { useState, useMemo } from "react";
import { Rich } from "../utils/text.jsx";

// Simplified high-quality SVG path definitions for US States & Regions
const US_STATE_PATHS = {
  CA: { name: "California", d: "M 25 95 L 35 90 L 45 105 L 50 140 L 40 185 L 20 180 L 10 145 Z" },
  NY: { name: "New York", d: "M 230 65 L 250 60 L 255 75 L 245 85 L 235 80 Z" },
  TX: { name: "Texas", d: "M 115 160 L 155 160 L 165 190 L 150 225 L 120 220 L 105 185 Z" },
  FL: { name: "Florida", d: "M 220 180 L 240 180 L 250 215 L 235 225 L 225 200 Z" },
  IL: { name: "Illinois", d: "M 175 100 L 188 100 L 188 135 L 175 135 Z" },
  PA: { name: "Pennsylvania", d: "M 225 80 L 245 80 L 245 95 L 225 95 Z" },
  OH: { name: "Ohio", d: "M 205 92 L 222 92 L 222 112 L 205 112 Z" },
  GA: { name: "Georgia", d: "M 210 150 L 230 150 L 225 178 L 210 178 Z" },
  NC: { name: "North Carolina", d: "M 220 128 L 250 128 L 245 142 L 220 142 Z" },
  MI: { name: "Michigan", d: "M 185 75 L 202 75 L 202 95 L 185 95 Z" },
  WA: { name: "Washington", d: "M 25 30 L 55 30 L 50 50 L 25 48 Z" },
  VA: { name: "Virginia", d: "M 222 110 L 248 110 L 245 125 L 222 125 Z" },
  MA: { name: "Massachusetts", d: "M 252 62 L 265 62 L 265 70 L 252 70 Z" },
  AZ: { name: "Arizona", d: "M 52 135 L 75 135 L 70 178 L 52 178 Z" },
  CO: { name: "Colorado", d: "M 80 110 L 110 110 L 110 135 L 80 135 Z" },
  NV: { name: "Nevada", d: "M 40 75 L 62 75 L 55 130 L 40 125 Z" },
};

const DEFAULT_MAP_PALETTE = [
  "#6366F1", // Indigo
  "#8B5CF6", // Purple
  "#3B82F6", // Blue
  "#10B981", // Emerald
  "#F59E0B", // Amber
];

export default function ShadcnAnimatedUSMap({
  chart,
  height = 380,
}) {
  const [hoveredState, setHoveredState] = useState(null);

  // Normalize state metrics data
  const { normalizedData, maxVal, totalVal } = useMemo(() => {
    const raw = chart?.data || chart || [];
    let items = [];

    if (Array.isArray(raw)) {
      items = raw.map((item) => {
        const code = String(item.state || item.code || item.name || "").toUpperCase();
        const val = Number(item.value ?? item.count ?? item.reach ?? 0);
        const name = item.label || US_STATE_PATHS[code]?.name || item.name || code;
        return { code, name, value: val };
      });
    } else if (typeof raw === "object") {
      items = Object.entries(raw)
        .filter(([k]) => !["title", "description", "chart_type", "chart_id"].includes(k))
        .map(([k, v]) => {
          const code = k.toUpperCase();
          const val = typeof v === "number" ? v : Number(v?.value ?? v?.count ?? 0);
          const name = US_STATE_PATHS[code]?.name || k;
          return { code, name, value: val };
        });
    }

    // Default mock data if empty
    if (items.length === 0) {
      items = [
        { code: "CA", name: "California", value: 8420 },
        { code: "NY", name: "New York", value: 6510 },
        { code: "TX", name: "Texas", value: 5890 },
        { code: "FL", name: "Florida", value: 4320 },
        { code: "IL", name: "Illinois", value: 3100 },
        { code: "PA", name: "Pennsylvania", value: 2750 },
        { code: "WA", name: "Washington", value: 2410 },
        { code: "GA", name: "Georgia", value: 1980 },
      ];
    }

    const max = Math.max(...items.map((i) => i.value), 1);
    const sum = items.reduce((acc, i) => acc + i.value, 0) || 1;

    return { normalizedData: items, maxVal: max, totalVal: sum };
  }, [chart]);

  const dataMap = useMemo(() => {
    const map = {};
    normalizedData.forEach((item) => {
      map[item.code] = item;
    });
    return map;
  }, [normalizedData]);

  // Color generator for choropleth scale
  const getStateColor = (code) => {
    const item = dataMap[code];
    if (!item || !item.value) return "rgba(226, 232, 240, 0.4)"; // Light slate
    const intensity = Math.min(1, Math.max(0.15, item.value / maxVal));
    return `rgba(99, 102, 241, ${0.25 + intensity * 0.75})`;
  };

  const activeItem = hoveredState ? dataMap[hoveredState] : null;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        minHeight: height,
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        padding: "12px",
        background: "rgba(255, 255, 255, 0.03)",
        borderRadius: "16px",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Header Info */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <span
            style={{
              fontSize: "11px",
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "#818CF8",
            }}
          >
            Geographic Heatmap
          </span>
          <h3 style={{ fontSize: "16px", fontWeight: "700", color: "var(--ink, #0F172A)", margin: "2px 0 0 0" }}>
            {chart?.title || "US Regional Distribution"}
          </h3>
        </div>
        <div
          style={{
            fontSize: "12px",
            fontWeight: "600",
            padding: "4px 10px",
            borderRadius: "20px",
            background: "rgba(99, 102, 241, 0.12)",
            color: "#6366F1",
          }}
        >
          Total: {totalVal.toLocaleString()}
        </div>
      </div>

      {chart?.description && (
        <div style={{ fontSize: "12px", color: "var(--ink2, #475569)", marginTop: "-8px" }}>
          <Rich text={chart.description} />
        </div>
      )}

      {/* Main Map + Leaderboard Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 220px",
          gap: "16px",
          alignItems: "center",
          flex: 1,
        }}
      >
        {/* SVG Map Render */}
        <div style={{ position: "relative", width: "100%", height: "260px" }}>
          <svg viewBox="0 0 280 240" style={{ width: "100%", height: "100%", overflow: "visible" }}>
            <defs>
              <filter id="glow-usmap" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {Object.entries(US_STATE_PATHS).map(([code, meta]) => {
              const item = dataMap[code];
              const isHovered = hoveredState === code;
              const color = getStateColor(code);

              return (
                <g key={code}>
                  <path
                    d={meta.d}
                    fill={color}
                    stroke={isHovered ? "#4F46E5" : "rgba(255, 255, 255, 0.8)"}
                    strokeWidth={isHovered ? 2.5 : 1}
                    filter={isHovered ? "url(#glow-usmap)" : "none"}
                    style={{
                      cursor: "pointer",
                      transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                      transformOrigin: "center",
                    }}
                    onMouseEnter={() => setHoveredState(code)}
                    onMouseLeave={() => setHoveredState(null)}
                  />
                  <text
                    x={getCenterOfPath(meta.d).x}
                    y={getCenterOfPath(meta.d).y}
                    fontSize="7"
                    fontWeight="700"
                    fill={isHovered ? "#ffffff" : "#1E293B"}
                    textAnchor="middle"
                    pointerEvents="none"
                  >
                    {code}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Hover Tooltip Overlay */}
          {activeItem && (
            <div
              style={{
                position: "absolute",
                bottom: "10px",
                left: "10px",
                background: "rgba(15, 23, 42, 0.96)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                borderRadius: "10px",
                padding: "8px 12px",
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
                backdropFilter: "blur(12px)",
                color: "#ffffff",
                fontSize: "12px",
                animation: "fadeInTooltip 0.15s ease-out",
                zIndex: 20,
              }}
            >
              <div style={{ fontWeight: "700", color: "#818CF8" }}>{activeItem.name}</div>
              <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                <span>Value: <strong>{activeItem.value.toLocaleString()}</strong></span>
                <span>Share: <strong>{((activeItem.value / totalVal) * 100).toFixed(1)}%</strong></span>
              </div>
            </div>
          )}
        </div>

        {/* Top States Leaderboard */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            background: "rgba(15, 23, 42, 0.04)",
            borderRadius: "12px",
            padding: "10px 12px",
            maxHeight: "260px",
            overflowY: "auto",
          }}
        >
          <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748B", textTransform: "uppercase" }}>
            Top Regions
          </span>
          {normalizedData.slice(0, 6).map((item, idx) => {
            const pct = ((item.value / totalVal) * 100).toFixed(1);
            const isHovered = hoveredState === item.code;
            return (
              <div
                key={item.code}
                onMouseEnter={() => setHoveredState(item.code)}
                onMouseLeave={() => setHoveredState(null)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  padding: "6px 8px",
                  borderRadius: "8px",
                  background: isHovered ? "rgba(99, 102, 241, 0.15)" : "transparent",
                  cursor: "pointer",
                  transition: "background 0.2s ease",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: "600" }}>
                  <span>{idx + 1}. {item.name}</span>
                  <span style={{ color: "#4F46E5" }}>{item.value.toLocaleString()}</span>
                </div>
                <div style={{ width: "100%", height: "4px", background: "rgba(226, 232, 240, 0.6)", borderRadius: "2px", overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${pct}%`,
                      height: "100%",
                      background: isHovered ? "#4F46E5" : "#818CF8",
                      transition: "width 0.4s ease",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes fadeInTooltip {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// Simple path center point extractor for labels
function getCenterOfPath(d) {
  const coords = d.match(/-?\d+(\.\d+)?/g);
  if (!coords || coords.length < 4) return { x: 50, y: 50 };
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (let i = 0; i < coords.length; i += 2) {
    const x = parseFloat(coords[i]);
    const y = parseFloat(coords[i + 1]);
    if (!isNaN(x)) {
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
    }
    if (!isNaN(y)) {
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  }
  return { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
}
