import React, { useState, useMemo } from "react";
import { Rich } from "../utils/text.jsx";

const DEFAULT_SPIDER_COLORS = [
  "#6366F1", // Indigo
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#3B82F6", // Blue
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#00C9A7", // Teal
];

export default function ShadcnAnimatedSpiderMap({
  chart,
  height = 400,
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Normalize hub & connected nodes
  const { hubTitle, nodes, maxVal, totalVal } = useMemo(() => {
    const raw = chart?.data || chart || [];
    let items = [];

    if (Array.isArray(raw)) {
      items = raw.map((item, idx) => ({
        id: item.id || `node_${idx}`,
        label: item.label || item.name || item.domain || `Node ${idx + 1}`,
        value: Number(item.value ?? item.count ?? item.reach ?? 10),
        status: item.status || "active",
        color: item.color || DEFAULT_SPIDER_COLORS[idx % DEFAULT_SPIDER_COLORS.length],
      }));
    } else if (typeof raw === "object") {
      items = Object.entries(raw)
        .filter(([k]) => !["title", "description", "chart_type", "chart_id", "hub"].includes(k))
        .map(([k, v], idx) => ({
          id: `node_${idx}`,
          label: k,
          value: typeof v === "number" ? v : Number(v?.value ?? v?.count ?? 10),
          status: "active",
          color: DEFAULT_SPIDER_COLORS[idx % DEFAULT_SPIDER_COLORS.length],
        }));
    }

    if (items.length === 0) {
      items = [
        { id: "1", label: "North America", value: 8500, color: "#6366F1" },
        { id: "2", label: "Europe & UK", value: 6200, color: "#8B5CF6" },
        { id: "3", label: "Asia-Pacific", value: 5400, color: "#EC4899" },
        { id: "4", label: "Latin America", value: 3100, color: "#3B82F6" },
        { id: "5", label: "Middle East", value: 2400, color: "#10B981" },
        { id: "6", label: "Global Syndication", value: 4100, color: "#F59E0B" },
      ];
    }

    const hub = chart?.hub || chart?.title || "Central Network Hub";
    const max = Math.max(...items.map((n) => n.value), 1);
    const sum = items.reduce((acc, n) => acc + n.value, 0) || 1;

    return { hubTitle: hub, nodes: items, maxVal: max, totalVal: sum };
  }, [chart]);

  // Calculate Radial Coordinates around Center (200, 180)
  const cx = 200;
  const cy = 175;
  const radius = 125;

  const radialNodes = useMemo(() => {
    const total = nodes.length;
    return nodes.map((node, i) => {
      const angle = (i * (2 * Math.PI)) / total - Math.PI / 2;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      return { ...node, x, y, angle };
    });
  }, [nodes]);

  const activeNode = hoveredIndex !== null ? radialNodes[hoveredIndex] : null;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        minHeight: height,
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        padding: "16px",
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
              color: "#EC4899",
            }}
          >
            Spider / Network Topology Map
          </span>
          <h3 style={{ fontSize: "16px", fontWeight: "700", color: "var(--ink, #0F172A)", margin: "2px 0 0 0" }}>
            {chart?.title || "Connected Network Distribution"}
          </h3>
        </div>
        <div
          style={{
            fontSize: "12px",
            fontWeight: "600",
            padding: "4px 10px",
            borderRadius: "20px",
            background: "rgba(236, 72, 153, 0.12)",
            color: "#EC4899",
          }}
        >
          {nodes.length} Connected Spokes
        </div>
      </div>

      {chart?.description && (
        <div style={{ fontSize: "12px", color: "var(--ink2, #475569)", marginTop: "-8px" }}>
          <Rich text={chart.description} />
        </div>
      )}

      {/* Main Graphic Canvas + Connected Node Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 240px",
          gap: "16px",
          alignItems: "center",
          flex: 1,
        }}
      >
        {/* SVG Spider Hub Canvas */}
        <div style={{ position: "relative", width: "100%", height: "320px" }}>
          <svg viewBox="0 0 400 350" style={{ width: "100%", height: "100%", overflow: "visible" }}>
            <defs>
              <radialGradient id="spider-center-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#6366F1" stopOpacity="0.1" />
              </radialGradient>
              <filter id="spider-glow-filter" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Concentric Radial Guide Rings */}
            <circle cx={cx} cy={cy} r={radius * 0.4} fill="none" stroke="rgba(99, 102, 241, 0.1)" strokeDasharray="3 3" />
            <circle cx={cx} cy={cy} r={radius * 0.75} fill="none" stroke="rgba(99, 102, 241, 0.12)" strokeDasharray="4 4" />
            <circle cx={cx} cy={cy} r={radius} fill="none" stroke="rgba(99, 102, 241, 0.15)" />

            {/* Connecting Spoke Rays & Pulsing Particles */}
            {radialNodes.map((node, idx) => {
              const isHovered = hoveredIndex === idx;
              const isDimmed = hoveredIndex !== null && !isHovered;

              return (
                <g key={node.id}>
                  {/* Spoke Line */}
                  <line
                    x1={cx}
                    y1={cy}
                    x2={node.x}
                    y2={node.y}
                    stroke={isHovered ? node.color : "rgba(148, 163, 184, 0.4)"}
                    strokeWidth={isHovered ? 2.5 : 1.2}
                    strokeDasharray={isHovered ? "none" : "4 2"}
                    style={{ opacity: isDimmed ? 0.2 : 1, transition: "all 0.3s ease" }}
                  />

                  {/* Pulsing Animated Ray Particle */}
                  <circle r={isHovered ? 4 : 3} fill={node.color} filter="url(#spider-glow-filter)">
                    <animateMotion
                      path={`M ${cx} ${cy} L ${node.x} ${node.y}`}
                      dur={`${2 + (idx % 3) * 0.6}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                </g>
              );
            })}

            {/* Central Hub Node */}
            <g style={{ cursor: "pointer" }}>
              <circle cx={cx} cy={cy} r={32} fill="url(#spider-center-glow)" />
              <circle cx={cx} cy={cy} r={22} fill="#4F46E5" filter="url(#spider-glow-filter)" />
              <text x={cx} y={cy + 4} fontSize="10" fontWeight="800" fill="#ffffff" textAnchor="middle">
                HUB
              </text>
            </g>

            {/* Radial Satellite Nodes */}
            {radialNodes.map((node, idx) => {
              const isHovered = hoveredIndex === idx;
              const isDimmed = hoveredIndex !== null && !isHovered;
              const nodeSize = 12 + Math.min(10, (node.value / maxVal) * 10);

              return (
                <g
                  key={node.id}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  style={{
                    cursor: "pointer",
                    opacity: isDimmed ? 0.3 : 1,
                    transition: "all 0.25s ease",
                  }}
                >
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={nodeSize}
                    fill={node.color}
                    stroke="#ffffff"
                    strokeWidth={isHovered ? 3 : 1.5}
                    filter={isHovered ? "url(#spider-glow-filter)" : "none"}
                  />
                  <text
                    x={node.x}
                    y={node.y + (node.y > cy ? nodeSize + 14 : -nodeSize - 6)}
                    fontSize="11"
                    fontWeight={isHovered ? "700" : "600"}
                    fill={isHovered ? "#4F46E5" : "#1E293B"}
                    textAnchor="middle"
                  >
                    {node.label}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Active Node Info Card Popup */}
          {activeNode && (
            <div
              style={{
                position: "absolute",
                top: "10px",
                left: "10px",
                background: "rgba(15, 23, 42, 0.96)",
                border: `1px solid ${activeNode.color}`,
                borderRadius: "10px",
                padding: "8px 12px",
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
                backdropFilter: "blur(12px)",
                color: "#ffffff",
                fontSize: "12px",
                animation: "fadeInSpiderCard 0.15s ease-out",
                zIndex: 20,
              }}
            >
              <div style={{ fontWeight: "700", color: activeNode.color }}>{activeNode.label}</div>
              <div style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
                <span>Metrics: <strong>{activeNode.value.toLocaleString()}</strong></span>
                <span>Share: <strong>{((activeNode.value / totalVal) * 100).toFixed(1)}%</strong></span>
              </div>
            </div>
          )}
        </div>

        {/* Connected Node Details Panel */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            background: "rgba(15, 23, 42, 0.04)",
            borderRadius: "12px",
            padding: "10px 12px",
            maxHeight: "320px",
            overflowY: "auto",
          }}
        >
          <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748B", textTransform: "uppercase" }}>
            Network Nodes ({nodes.length})
          </span>

          {nodes.map((node, idx) => {
            const isHovered = hoveredIndex === idx;
            const pct = ((node.value / totalVal) * 100).toFixed(1);

            return (
              <div
                key={node.id}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  background: isHovered ? "rgba(99, 102, 241, 0.12)" : "transparent",
                  cursor: "pointer",
                  borderLeft: `3px solid ${node.color}`,
                  transition: "background 0.2s ease",
                }}
              >
                <div>
                  <div style={{ fontSize: "12px", fontWeight: "600", color: isHovered ? "#4F46E5" : "#1E293B" }}>
                    {node.label}
                  </div>
                  <div style={{ fontSize: "10px", color: "#64748B" }}>{pct}% of total volume</div>
                </div>
                <div style={{ fontSize: "13px", fontWeight: "700", color: node.color }}>
                  {node.value.toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes fadeInSpiderCard {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
