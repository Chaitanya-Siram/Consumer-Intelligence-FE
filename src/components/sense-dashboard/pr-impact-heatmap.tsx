import React, { useState, useRef, useMemo } from "react";
import type { CompetitorHeatmap } from "@/data/types";

const RAMP = [
  { level: 0, color: "#ef4444", label: "Very Low" },
  { level: 1, color: "#f97316", label: "Low" },
  { level: 2, color: "#f59e0b", label: "Moderate" },
  { level: 3, color: "#84cc16", label: "High" },
  { level: 4, color: "#10b981", label: "Optimal" },
];

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export function PrImpactHeatmap({ data }: { data: CompetitorHeatmap }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewRange, setViewRange] = useState<"6m" | "1y">("6m");
  const [hoveredCell, setHoveredCell] = useState<{
    company: string;
    weekStart: string;
    score: number;
    colIndex: number;
    rowIndex: number;
  } | null>(null);
  const [hoveredLevel, setHoveredLevel] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  if (!data || !data.companies || !data.weeks || data.companies.length === 0) {
    return <div className="p-4 text-xs text-slate-400 text-center">No heatmap data available</div>;
  }

  const companies = data.companies;
  const allWeeks = data.weeks;

  // Slice to last 24 weeks (6 months) by default so cells have generous width & month headers fit cleanly without collision
  const weeks = useMemo(() => {
    if (viewRange === "6m" && allWeeks.length > 24) {
      return allWeeks.slice(allWeeks.length - 24);
    }
    return allWeeks;
  }, [allWeeks, viewRange]);

  // Group weeks by month for clean X-axis month headers without text collision
  const monthHeaders = useMemo(() => {
    const headers: { month: string; colStart: number; colSpan: number }[] = [];
    let currentMonth = "";
    let currentStart = 0;
    let currentSpan = 0;

    weeks.forEach((w, idx) => {
      const dt = new Date(w.weekStart);
      const mName = isNaN(dt.getTime()) ? "" : MONTH_NAMES[dt.getMonth()];
      if (mName && mName !== currentMonth) {
        if (currentMonth) {
          headers.push({ month: currentMonth, colStart: currentStart, colSpan: currentSpan });
        }
        currentMonth = mName;
        currentStart = idx;
        currentSpan = 1;
      } else {
        currentSpan++;
      }
    });
    if (currentMonth) {
      headers.push({ month: currentMonth, colStart: currentStart, colSpan: currentSpan });
    }
    return headers;
  }, [weeks]);

  const handleMouseMove = (e: React.MouseEvent, cellData: any) => {
    setHoveredCell(cellData);
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setTooltipPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  return (
    <div ref={containerRef} className="relative w-full flex flex-col gap-2.5 py-1 px-1 select-none">
      {/* Range Toggle Header */}
      {allWeeks.length > 24 && (
        <div className="flex items-center justify-end px-1">
          <div className="inline-flex items-center p-0.5 rounded-md bg-slate-100 border border-slate-200/80 text-[10.5px] font-medium">
            <button
              type="button"
              onClick={() => setViewRange("6m")}
              className={`px-2 py-0.5 rounded ${
                viewRange === "6m"
                  ? "bg-white text-slate-900 font-bold shadow-2xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              6 Months
            </button>
            <button
              type="button"
              onClick={() => setViewRange("1y")}
              className={`px-2 py-0.5 rounded ${
                viewRange === "1y"
                  ? "bg-white text-slate-900 font-bold shadow-2xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Full Year
            </button>
          </div>
        </div>
      )}

      {/* Grid Container (Scrollable when full year) */}
      <div className="w-full overflow-x-auto scrollbar-thin">
        <div className={`flex flex-col gap-1.5 ${viewRange === "1y" ? "min-w-[640px]" : "min-w-full"}`}>
          
          {/* Month Header Row */}
          <div className="flex items-center text-[11px] font-semibold text-slate-400 border-b border-slate-100 pb-1.5">
            <div className="w-[110px] shrink-0 text-right pr-3 text-slate-400 font-medium text-[10px] uppercase tracking-wider truncate">
              Company
            </div>
            <div className="flex-1 grid gap-[2px]" style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(8px, 1fr))` }}>
              {monthHeaders.map((mh, idx) => (
                <div
                  key={`${mh.month}-${idx}`}
                  className="text-center font-semibold text-slate-500 truncate text-[10.5px]"
                  style={{
                    gridColumnStart: mh.colStart + 1,
                    gridColumnEnd: `span ${mh.colSpan}`,
                  }}
                >
                  {mh.month}
                </div>
              ))}
            </div>
          </div>

          {/* Company Heatmap Rows */}
          {companies.map((company, rowIdx) => {
            const isRowHovered = hoveredCell?.company === company;

            return (
              <div
                key={company}
                className={`flex items-center transition-colors rounded-md p-0.5 ${
                  isRowHovered ? "bg-slate-50" : ""
                }`}
              >
                {/* Company Label */}
                <div
                  className={`w-[110px] shrink-0 text-right pr-3 text-[11.5px] transition-colors truncate ${
                    isRowHovered ? "font-bold text-slate-900" : "font-medium text-slate-700"
                  }`}
                  title={company}
                >
                  {company}
                </div>

                {/* Heatmap Cell Strip */}
                <div
                  className="flex-1 grid gap-[2px] py-0.5"
                  style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(8px, 1fr))` }}
                >
                  {weeks.map((week, colIdx) => {
                    const score = week.scores[rowIdx] ?? 0;
                    const levelObj = RAMP[Math.max(0, Math.min(4, Math.round(score)))] || RAMP[0];
                    const isCellHovered =
                      hoveredCell?.company === company && hoveredCell?.colIndex === colIdx;
                    const isColHovered = hoveredCell?.colIndex === colIdx;
                    const isDimmed =
                      (hoveredCell && !isCellHovered && !isRowHovered && !isColHovered) ||
                      (hoveredLevel !== null && Math.round(score) !== hoveredLevel);

                    return (
                      <div
                        key={`${company}-${colIdx}`}
                        onMouseEnter={(e) =>
                          handleMouseMove(e, {
                            company,
                            weekStart: week.weekStart,
                            score,
                            colIndex: colIdx,
                            rowIndex: rowIdx,
                          })
                        }
                        onMouseMove={(e) =>
                          handleMouseMove(e, {
                            company,
                            weekStart: week.weekStart,
                            score,
                            colIndex: colIdx,
                            rowIndex: rowIdx,
                          })
                        }
                        onMouseLeave={() => setHoveredCell(null)}
                        className="h-[20px] min-w-[8px] rounded-[3px] cursor-pointer transition-all duration-150 relative"
                        style={{
                          backgroundColor: levelObj.color,
                          transform: isCellHovered
                            ? "scale(1.4)"
                            : isRowHovered || isColHovered
                            ? "scale(1.08)"
                            : "scale(1)",
                          zIndex: isCellHovered ? 20 : isRowHovered || isColHovered ? 10 : 1,
                          opacity: isDimmed ? 0.25 : 1,
                          boxShadow: isCellHovered
                            ? `0 4px 12px ${levelObj.color}90, 0 0 0 2px #fff`
                            : "none",
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Compact Legend Footer */}
      <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-100 text-[10.5px] font-medium text-slate-500">
        <span className="text-slate-400 font-normal">Low impact</span>
        <div className="flex items-center gap-2">
          {RAMP.map((rampItem) => (
            <button
              key={rampItem.level}
              type="button"
              onMouseEnter={() => setHoveredLevel(rampItem.level)}
              onMouseLeave={() => setHoveredLevel(null)}
              className="flex items-center gap-1 px-1 py-0.5 rounded transition-transform hover:scale-105"
            >
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ backgroundColor: rampItem.color }}
              />
              <span className="text-[10px] text-slate-600 font-medium">{rampItem.label}</span>
            </button>
          ))}
        </div>
        <span className="text-slate-400 font-normal">High impact</span>
      </div>

      {/* Floating Interactive Tooltip */}
      {hoveredCell && (
        <div
          className="absolute z-50 pointer-events-none bg-slate-900 text-white rounded-lg px-3 py-2 shadow-xl border border-slate-700/50 text-xs flex flex-col gap-1 transition-all duration-75"
          style={{
            left: Math.min(tooltipPos.x + 12, (containerRef.current?.offsetWidth || 400) - 180),
            top: Math.max(0, tooltipPos.y - 70),
          }}
        >
          <div className="font-semibold text-slate-100 flex items-center justify-between gap-3">
            <span>{hoveredCell.company}</span>
            <span
              className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-white"
              style={{
                backgroundColor: RAMP[Math.max(0, Math.min(4, Math.round(hoveredCell.score)))].color,
              }}
            >
              {RAMP[Math.max(0, Math.min(4, Math.round(hoveredCell.score)))].label}
            </span>
          </div>
          <div className="text-[11px] text-slate-300 flex items-center justify-between gap-2">
            <span>Week: {hoveredCell.weekStart}</span>
            <span className="font-mono font-bold text-slate-200">
              Score: {hoveredCell.score} / 4
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
