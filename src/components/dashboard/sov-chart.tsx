"use client";

/**
 * SovChart — Share of Voice horizontal bar chart.
 * Shows brand vs competitors as % of total article volume.
 * Clicking a bar opens the article popup filtered by that brand/competitor name.
 */

import { useArticlePopup, filterByTheme, filterBySource } from "@/components/builder/article-popup-modal";

export interface SovEntry {
  label: string;
  value: number;
  pct: number;
  isBrand?: boolean;
}

interface SovChartProps {
  data: SovEntry[];
}

const BRAND_COLOR = "#4f46e5";
const COMP_COLORS = [
  "#0d9488", "#f59e0b", "#e11d48", "#8b5cf6",
  "#06b6d4", "#10b981", "#f97316", "#3b82f6",
];

export function SovChart({ data }: SovChartProps) {
  const { openPopup, articles } = useArticlePopup();
  const hasArticles = articles.length > 0;

  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const sorted = [...data].sort((a, b) => b.pct - a.pct);

  function handleBarClick(entry: SovEntry) {
    if (!hasArticles) return;
    const filtered = filterBySource(articles, entry.label)
      .concat(filterByTheme(articles, entry.label));
    // Deduplicate by id/title
    const seen = new Set<string>();
    const deduped = filtered.filter(a => {
      const key = a.id ?? a.title ?? "";
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    const result = deduped.length > 0 ? deduped : articles.slice(0, 20);
    openPopup({
      title: `${entry.label} — Share of Voice`,
      subtitle: `${entry.pct}% of total coverage (${entry.value.toLocaleString()} articles)`,
      articles: result,
    });
  }

  return (
    <div className="flex flex-col gap-3 py-2 w-full">
      {/* Stacked total bar */}
      <div className="mb-2">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
            Share of Voice — {total.toLocaleString()} total articles
          </span>
        </div>
        <div className="h-8 w-full flex rounded-lg overflow-hidden shadow-sm">
          {sorted.map((entry, i) => {
            const color = entry.isBrand ? BRAND_COLOR : COMP_COLORS[(i - (sorted.findIndex(e => e.isBrand) !== -1 && entry.isBrand ? 0 : 1)) % COMP_COLORS.length];
            return (
              <div
                key={entry.label}
                title={`${entry.label}: ${entry.pct}%`}
                onClick={() => handleBarClick(entry)}
                className="transition-opacity hover:opacity-80 cursor-pointer"
                style={{ width: `${entry.pct}%`, minWidth: entry.pct > 0 ? "2px" : 0, background: color }}
              />
            );
          })}
        </div>
      </div>

      {/* Individual bars */}
      {sorted.map((entry, i) => {
        const colorIdx = sorted.findIndex(e => e.label === entry.label);
        const color = entry.isBrand ? BRAND_COLOR : COMP_COLORS[(colorIdx) % COMP_COLORS.length];
        return (
          <div
            key={entry.label}
            className="group flex items-center gap-3 cursor-pointer rounded-lg px-2 py-1.5 hover:bg-slate-50 transition-colors"
            onClick={() => handleBarClick(entry)}
          >
            {/* Rank badge */}
            <div
              className="shrink-0 size-6 rounded-md flex items-center justify-center text-white text-[10px] font-bold"
              style={{ background: color }}
            >
              {i + 1}
            </div>

            {/* Label */}
            <div className="w-[110px] shrink-0">
              <p className="text-[13px] font-semibold text-slate-800 truncate leading-tight">
                {entry.label}
              </p>
              {entry.isBrand && (
                <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 rounded-full">
                  Your Brand
                </span>
              )}
            </div>

            {/* Progress bar */}
            <div className="flex-1 flex items-center gap-2">
              <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${entry.pct}%`, background: color }}
                />
              </div>
              <div className="w-[52px] text-right shrink-0">
                <span className="text-[14px] font-bold" style={{ color }}>
                  {entry.pct}%
                </span>
              </div>
              <div className="w-[64px] text-right shrink-0 text-[11px] text-slate-400 font-medium">
                {entry.value.toLocaleString()}
              </div>
            </div>
          </div>
        );
      })}

      {hasArticles && (
        <p className="mt-1 text-[11px] text-slate-400 text-center font-medium">
          ↑ Click any brand to explore its articles
        </p>
      )}
    </div>
  );
}
