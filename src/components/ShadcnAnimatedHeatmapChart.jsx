import React, { useState, useEffect, useRef, useMemo } from "react";
import NumberFlow from "@number-flow/react";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const SHORT_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const COLOR_LEVELS = [
  "#F1F5F9", // Level 0: Very Low / 0
  "#BAE6FD", // Level 1: Low
  "#38BDF8", // Level 2: Medium
  "#0284C7", // Level 3: High
  "#0369A1", // Level 4: Very High
];

export const PR_BANDS5 = [
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

export function getPRBandInfo(val) {
  if (val == null || Number.isNaN(Number(val)))
    return { label: "NO DATA", color: "#cbd5e1" };
  const v = Number(val);
  if (v < 0) return PR_BANDS5[0];
  if (v < 15) return PR_BANDS5[1];
  if (v < 30) return PR_BANDS5[2];
  if (v < 45) return PR_BANDS5[3];
  return PR_BANDS5[4];
}

function formatHour(h) {
  const hourNum = Number(h);
  if (isNaN(hourNum)) return String(h);
  if (hourNum === 0) return "12 AM";
  if (hourNum === 12) return "12 PM";
  if (hourNum < 12) return `${hourNum} AM`;
  return `${hourNum - 12} PM`;
}

export default function ShadcnAnimatedHeatmapChart({
  chart,
  height = 340,
  mode,
}) {
  const containerRef = useRef(null);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [isMounted, setIsMounted] = useState(false);

  // Trigger one-time entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 60);
    return () => clearTimeout(timer);
  }, []);

  const isPRComparison =
    mode === "pr_comparison" ||
    chart?.mode === "pr_comparison" ||
    chart?.type === "pr_comparison" ||
    chart?.chart_type === "pr_comparison" ||
    chart?.chart_id === "pr_comparison" ||
    Array.isArray(chart?.brands);

  // 1. Process data for PR Comparison (Brand x Date matrix)
  const prData = useMemo(() => {
    if (!isPRComparison) return null;
    const brands =
      chart?.brands || (Array.isArray(chart?.data) ? chart.data : []);

    const xLabelsSet = new Set();
    brands.forEach((b) => {
      const items = Array.isArray(b.data)
        ? b.data
        : Array.isArray(b.items)
          ? b.items
          : [];
      items.forEach((item) => {
        const lbl = item.label || item.date || item.x || item.time || "";
        if (lbl) xLabelsSet.add(lbl);
      });
    });

    let xLabels = Array.from(xLabelsSet);

    // If fewer than 7 dates exist (e.g. 1 date available), pad past dates to form a full 7-day timeline
    if (xLabels.length > 0 && xLabels.length < 7) {
      const activeDateStr = xLabels[0];
      const activeDt = new Date(activeDateStr);
      const isIso = !isNaN(activeDt.getTime());

      const paddedDates = [];
      const daysToPad = 7 - xLabels.length;

      for (let i = daysToPad; i >= 1; i--) {
        if (isIso) {
          const pastDt = new Date(activeDt);
          pastDt.setDate(pastDt.getDate() - i);
          const formatted = pastDt.toISOString().slice(0, 10);
          if (!xLabels.includes(formatted)) {
            paddedDates.push(formatted);
          }
        } else {
          paddedDates.push(`Past -${i}d`);
        }
      }

      xLabels = [...paddedDates, ...xLabels];
    }

    const rows = brands.map((b) => {
      const brandName = b.brand_name || b.name || b.label || "Brand";
      const brandScore = b.score ?? b.value ?? null;
      const ratingScale = b.rating_scale || "";
      const cellMap = {};

      const items = Array.isArray(b.data)
        ? b.data
        : Array.isArray(b.items)
          ? b.items
          : [];
      items.forEach((item) => {
        const lbl = item.label || item.date || item.x || item.time || "";
        const impact =
          item.pr_impact ?? item.score ?? item.value ?? item.y ?? null;
        const count = item.doc_count ?? item.count ?? item.articles ?? 0;
        if (lbl) {
          cellMap[lbl] = { pr_impact: impact, doc_count: count, raw: item };
        }
      });

      return {
        brandName,
        brandScore,
        ratingScale,
        cells: cellMap,
      };
    });

    return { rows, xLabels };
  }, [chart, isPRComparison]);

  // 2. Process data for standard 7x24 Day/Hour matrix
  const dayHourData = useMemo(() => {
    if (isPRComparison) return null;
    const raw = chart?.data || chart;
    let maxVal = 0;
    const hourSet = new Set();
    const dayMap = {};

    DAYS.forEach((day) => {
      dayMap[day] = {};
      for (let h = 0; h < 24; h++) {
        dayMap[day][h] = 0;
        hourSet.add(h);
      }
    });

    if (Array.isArray(raw)) {
      raw.forEach((d) => {
        const dayName = d.day || d.name || d.label;
        if (dayName && dayMap[dayName] && Array.isArray(d.data)) {
          d.data.forEach((item) => {
            const h = item.hour ?? item.bin ?? item.x;
            const c = Number(item.count ?? item.value ?? item.y ?? 0);
            if (h != null && !isNaN(Number(h))) {
              const hourNum = Number(h);
              dayMap[dayName][hourNum] = c;
              if (c > maxVal) maxVal = c;
              hourSet.add(hourNum);
            }
          });
        }
      });
    }

    const sortedHours = Array.from(hourSet).sort((a, b) => a - b);
    return {
      matrix: dayMap,
      maxCount: Math.max(1, maxVal),
      hours: sortedHours,
    };
  }, [chart, isPRComparison]);

  const getColor = (count, maxCount) => {
    if (count === 0) return COLOR_LEVELS[0];
    const pct = count / maxCount;
    if (pct < 0.25) return COLOR_LEVELS[1];
    if (pct < 0.55) return COLOR_LEVELS[2];
    if (pct < 0.85) return COLOR_LEVELS[3];
    return COLOR_LEVELS[4];
  };

  const handleCellHover = (e, cellInfo) => {
    setHoveredCell(cellInfo);
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setTooltipPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  // -------------------------------------------------------------
  // RENDER A: PR Comparison Matrix (Brand x Date Heatmap)
  // -------------------------------------------------------------
  if (isPRComparison && prData) {
    const { rows, xLabels } = prData;

    return (
      <div
        ref={containerRef}
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          minHeight: height,
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        {/* Legend Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingLeft: "4px",
            paddingRight: "4px",
            flexShrink: 0,
            flexWrap: "wrap",
            gap: "8px",
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
            PR Impact Comparison Heatmap
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "11px",
              flexWrap: "wrap",
            }}
          >
            {PR_BANDS5.map((band) => (
              <div
                key={band.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "10.5px",
                  fontWeight: "600",
                }}
              >
                <span
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "2.5px",
                    background: band.color,
                    display: "inline-block",
                  }}
                />
                <span style={{ color: "#475569" }}>{band.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Heatmap Grid */}
        <div
          style={{
            flex: 1,
            width: "100%",
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `150px repeat(${Math.max(1, xLabels.length)}, minmax(32px, 1fr))`,
              gridTemplateRows: `auto repeat(${Math.max(1, rows.length)}, 38px)`,
              gap: "6px",
              alignItems: "center",
              maxWidth: "100%",
            }}
          >
            {/* Top Header: Dates */}
            <div />
            {xLabels.map((lbl) => (
              <div
                key={`pr-x-${lbl}`}
                style={{
                  fontSize: "10.5px",
                  fontWeight: "600",
                  color:
                    hoveredCell?.xLabel === lbl
                      ? "var(--ink, #0B1220)"
                      : "#94A3B8",
                  textAlign: "center",
                  paddingBottom: "4px",
                  transition: "color 0.22s ease",
                  userSelect: "none",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: "60px",
                }}
              >
                {lbl}
              </div>
            ))}

            {/* Matrix Rows: Brands */}
            {rows.map((row, rowIdx) => {
              const isRowHovered = hoveredCell?.brandName === row.brandName;

              return (
                <React.Fragment key={row.brandName}>
                  {/* Y-Axis Brand Label */}
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: isRowHovered ? "700" : "600",
                      color: isRowHovered ? "var(--ink, #0B1220)" : "#475569",
                      textAlign: "right",
                      paddingRight: "10px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      justifyContent: "center",
                      transition: "color 0.22s ease",
                      userSelect: "none",
                      lineHeight: "1.2",
                    }}
                  >
                    <span>{row.brandName}</span>
                    {row.brandScore != null && (
                      <span
                        style={{
                          fontSize: "10px",
                          fontFamily: "monospace",
                          color: "#64748B",
                          fontWeight: "500",
                        }}
                      >
                        {Number(row.brandScore).toFixed(1)}%
                      </span>
                    )}
                  </div>

                  {/* Cells for each Date */}
                  {xLabels.map((lbl, colIdx) => {
                    const cellData = row.cells[lbl];
                    const impact = cellData?.pr_impact;
                    const docCount = cellData?.doc_count || 0;
                    const bandInfo = getPRBandInfo(impact);
                    const cellColor = bandInfo.color;

                    const isHovered =
                      hoveredCell?.brandName === row.brandName &&
                      hoveredCell?.xLabel === lbl;
                    const isColHovered = hoveredCell?.xLabel === lbl;
                    const isAnyHovered = hoveredCell != null;

                    const delayMs = Math.min(450, rowIdx * 30 + colIdx * 15);

                    return (
                      <div
                        key={`cell-${row.brandName}-${lbl}`}
                        onMouseEnter={(e) =>
                          handleCellHover(e, {
                            brandName: row.brandName,
                            brandScore: row.brandScore,
                            xLabel: lbl,
                            pr_impact: impact,
                            doc_count: docCount,
                          })
                        }
                        onMouseMove={(e) =>
                          handleCellHover(e, {
                            brandName: row.brandName,
                            brandScore: row.brandScore,
                            xLabel: lbl,
                            pr_impact: impact,
                            doc_count: docCount,
                          })
                        }
                        onMouseLeave={() => setHoveredCell(null)}
                        style={{
                          width: "100%",
                          height: "32px",
                          borderRadius: "4px",
                          background: cellColor,
                          border: isHovered
                            ? `2px solid ${bandInfo.color}`
                            : "1px solid rgba(0, 0, 0, 0.05)",
                          cursor: "pointer",
                          transformOrigin: "center center",
                          transition:
                            "transform 0.24s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.24s ease, filter 0.24s ease, box-shadow 0.24s ease, border-color 0.24s ease",
                          transform: isHovered
                            ? "scale(1.05)"
                            : isRowHovered || isColHovered
                              ? "scale(1.03)"
                              : "scale(1)",
                          zIndex: isHovered
                            ? 30
                            : isRowHovered || isColHovered
                              ? 5
                              : 1,
                          opacity: isAnyHovered
                            ? isHovered
                              ? 1
                              : isRowHovered || isColHovered
                                ? 0.95
                                : 0.28
                            : 1,
                          filter:
                            isAnyHovered &&
                            !isHovered &&
                            !isRowHovered &&
                            !isColHovered
                              ? "grayscale(25%)"
                              : "none",
                          boxShadow: isHovered
                            ? `0 6px 20px ${bandInfo.color}66`
                            : "none",
                          animation: isMounted
                            ? "none"
                            : `waveSweep 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${delayMs}ms both`,
                        }}
                      />
                    );
                  })}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Floating Tooltip for PR Comparison */}
        {hoveredCell && (
          <div
            style={{
              position: "absolute",
              left: Math.min(
                tooltipPos.x + 14,
                (containerRef.current?.offsetWidth || 500) - 210,
              ),
              top: Math.max(10, tooltipPos.y - 95),
              zIndex: 100,
              background: "#fff",
              color: "#000",
              borderRadius: "9px",
              padding: "10px 14px",
              fontSize: "11.5px",
              boxShadow: "0 12px 32px rgba(0, 0, 0, 0.35)",
              pointerEvents: "none",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              minWidth: "190px",
              animation: "tooltipFade 0.18s ease-out",
            }}
          >
            <div
              style={{
                fontWeight: "700",
                color: "#000",
                fontSize: "13px",
                marginBottom: "2px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span>{hoveredCell.brandName}</span>
              {hoveredCell.brandScore != null && (
                <span style={{ fontSize: "11px", color: "#94A3B8" }}>
                  Avg: {Number(hoveredCell.brandScore).toFixed(1)}%
                </span>
              )}
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "#000",
                marginBottom: "8px",
              }}
            >
              Period: {hoveredCell.xLabel}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "8px",
                paddingTop: "6px",
                borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                marginBottom: "6px",
              }}
            >
              <span style={{ color: "#000" }}>PR Impact:</span>
              <span
                style={{
                  color: getPRBandInfo(hoveredCell.pr_impact).color,
                  fontWeight: "800",
                  fontSize: "13px",
                  fontFamily: "monospace",
                }}
              >
                {hoveredCell.pr_impact != null
                  ? `${Number(hoveredCell.pr_impact).toFixed(2)}%`
                  : "—"}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "8px",
              }}
            >
              <span style={{ color: "#000" }}>Performance:</span>
              <span
                style={{
                  background: getPRBandInfo(hoveredCell.pr_impact).color,
                  color: "#ffffff",
                  padding: "2px 7px",
                  borderRadius: "4px",
                  fontSize: "10px",
                  fontWeight: "800",
                  textTransform: "uppercase",
                  letterSpacing: "0.03em",
                }}
              >
                {getPRBandInfo(hoveredCell.pr_impact).label}
              </span>
            </div>

            {hoveredCell.doc_count > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "8px",
                  marginTop: "6px",
                }}
              >
                <span style={{ color: "#000" }}>Articles:</span>
                <span
                  style={{
                    color: "#38BDF8",
                    fontWeight: "700",
                    fontFamily: "monospace",
                  }}
                >
                  <NumberFlow value={hoveredCell.doc_count} />
                </span>
              </div>
            )}
          </div>
        )}

        <style>{`
          @keyframes waveSweep {
            from { opacity: 0; transform: scale(0.4) translateY(12px); filter: blur(4px); }
            to { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
          }
          @keyframes tooltipFade {
            from { opacity: 0; transform: translateY(4px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER B: Standard Day x Hour Activity Heatmap
  // -------------------------------------------------------------
  const { matrix, maxCount, hours } = dayHourData || {};

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: height,
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      {/* Legend Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingLeft: "4px",
          paddingRight: "4px",
          flexShrink: 0,
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
          Activity Heatmap (Day × Hour)
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "11.5px",
            color: "var(--ink2, #37445B)",
          }}
        >
          <span style={{ fontSize: "11px", color: "#888" }}>Less</span>
          {COLOR_LEVELS.map((lvlColor, i) => (
            <span
              key={i}
              style={{
                width: "11px",
                height: "11px",
                borderRadius: "2px",
                background: lvlColor,
                display: "inline-block",
                border: "1px solid rgba(0,0,0,0.06)",
              }}
            />
          ))}
          <span style={{ fontSize: "11px", color: "#888" }}>More</span>
        </div>
      </div>

      {/* Full Height Heatmap Grid Table */}
      <div
        style={{
          flex: 1,
          width: "100%",
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: `45px repeat(${hours?.length || 24}, minmax(16px, 1fr))`,
            gridTemplateRows: `auto repeat(${DAYS.length}, 1fr)`,
            gap: "3px",
            alignItems: "stretch",
            minWidth: "600px",
          }}
        >
          {/* Top Header: Hours */}
          <div />
          {hours?.map((h) => (
            <div
              key={`h-head-${h}`}
              style={{
                fontSize: "10px",
                fontWeight: "600",
                color:
                  hoveredCell?.hour === h ? "var(--ink, #0B1220)" : "#94A3B8",
                textAlign: "center",
                paddingBottom: "4px",
                transition: "color 0.22s ease",
                userSelect: "none",
              }}
            >
              {h % 3 === 0
                ? h === 0
                  ? "12 AM"
                  : h === 12
                    ? "12 PM"
                    : h > 12
                      ? `${h - 12} PM`
                      : `${h} AM`
                : ""}
            </div>
          ))}

          {/* Matrix Rows: Days */}
          {DAYS.map((day, dayIdx) => {
            const shortDay = SHORT_DAYS[dayIdx];
            const isRowHovered = hoveredCell?.day === day;

            return (
              <React.Fragment key={day}>
                {/* Y-Axis Day Label */}
                <div
                  style={{
                    fontSize: "11.5px",
                    fontWeight: isRowHovered ? "700" : "500",
                    color: isRowHovered ? "var(--ink, #0B1220)" : "#6B7894",
                    textAlign: "right",
                    paddingRight: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    transition: "color 0.22s ease",
                    userSelect: "none",
                  }}
                >
                  {shortDay}
                </div>

                {/* Cells for each Hour */}
                {hours?.map((h, hIdx) => {
                  const count = matrix[day]?.[h] || 0;
                  const cellColor = getColor(count, maxCount);
                  const isHovered =
                    hoveredCell?.day === day && hoveredCell?.hour === h;
                  const isColHovered = hoveredCell?.hour === h;
                  const isAnyHovered = hoveredCell != null;

                  const delayMs = Math.min(450, dayIdx * 25 + hIdx * 12);

                  return (
                    <div
                      key={`cell-${day}-${h}`}
                      onMouseEnter={(e) =>
                        handleCellHover(e, { day, hour: h, count })
                      }
                      onMouseMove={(e) =>
                        handleCellHover(e, { day, hour: h, count })
                      }
                      onMouseLeave={() => setHoveredCell(null)}
                      style={{
                        width: "100%",
                        aspectRatio: "1 / 1",
                        borderRadius: "3.5px",
                        background: cellColor,
                        border: isHovered
                          ? "2px solid #0284C7"
                          : "1px solid rgba(0, 0, 0, 0.04)",
                        cursor: "pointer",
                        transformOrigin: "center center",
                        transition:
                          "transform 0.24s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.24s ease, filter 0.24s ease, box-shadow 0.24s ease, border-color 0.24s ease",
                        transform: isHovered
                          ? "scale(1.05)"
                          : isRowHovered || isColHovered
                            ? "scale(1.03)"
                            : "scale(1)",
                        zIndex: isHovered
                          ? 30
                          : isRowHovered || isColHovered
                            ? 5
                            : 1,
                        opacity: isAnyHovered
                          ? isHovered
                            ? 1
                            : isRowHovered || isColHovered
                              ? 0.95
                              : 0.28
                          : 1,
                        filter:
                          isAnyHovered &&
                          !isHovered &&
                          !isRowHovered &&
                          !isColHovered
                            ? "grayscale(25%)"
                            : "none",
                        boxShadow: isHovered
                          ? "0 8px 24px rgba(2, 132, 199, 0.38)"
                          : "none",
                        animation: isMounted
                          ? "none"
                          : `waveSweep 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${delayMs}ms both`,
                      }}
                    />
                  );
                })}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Floating Tooltip for Day x Hour */}
      {hoveredCell && !isPRComparison && (
        <div
          style={{
            position: "absolute",
            left: Math.min(
              tooltipPos.x + 14,
              (containerRef.current?.offsetWidth || 500) - 180,
            ),
            top: Math.max(10, tooltipPos.y - 65),
            zIndex: 100,
            background: "#0B1220",
            color: "#ffffff",
            borderRadius: "8px",
            padding: "8px 12px",
            fontSize: "11.5px",
            boxShadow: "0 10px 28px rgba(0, 0, 0, 0.25)",
            pointerEvents: "none",
            animation: "tooltipFade 0.18s ease-out",
          }}
        >
          <div
            style={{
              fontWeight: "600",
              color: "#94A3B8",
              marginBottom: "3px",
              fontSize: "11px",
            }}
          >
            {hoveredCell.day} • {formatHour(hoveredCell.hour)}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontWeight: "700",
              fontSize: "12.5px",
            }}
          >
            <span style={{ color: "#E2E8F0" }}>Articles:</span>
            <span style={{ color: "#38BDF8", fontFamily: "monospace" }}>
              <NumberFlow value={hoveredCell.count} />
            </span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes waveSweep {
          from { opacity: 0; transform: scale(0.4) translateY(12px); filter: blur(4px); }
          to { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
        }
        @keyframes tooltipFade {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
