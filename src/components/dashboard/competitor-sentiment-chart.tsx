"use client";

/**
 * CompetitorSentimentChart — stacked horizontal bar showing Positive / Neutral / Negative
 * sentiment breakdown per brand/competitor.
 * Clicking a segment opens the article popup filtered by that competitor + sentiment.
 */

import { useArticlePopup, filterBySource, filterByTheme, filterBySentiment } from "@/components/builder/article-popup-modal";

export interface CompetitorSentimentEntry {
  competitor: string;
  positive: number;
  neutral: number;
  negative: number;
  total: number;
  isBrand?: boolean;
}

interface CompetitorSentimentChartProps {
  data: CompetitorSentimentEntry[];
}

const SEG = [
  { key: "positive" as const, label: "Positive", color: "#10b981", textColor: "#065f46", bg: "#d1fae5" },
  { key: "neutral"  as const, label: "Neutral",  color: "#6366f1", textColor: "#3730a3", bg: "#e0e7ff" },
  { key: "negative" as const, label: "Negative", color: "#e11d48", textColor: "#9f1239", bg: "#fee2e2" },
] as const;

export function CompetitorSentimentChart({ data }: CompetitorSentimentChartProps) {
  const { openPopup, articles } = useArticlePopup();
  const hasArticles = articles.length > 0;

  function handleSegmentClick(entry: CompetitorSentimentEntry, sentimentLabel: string) {
    if (!hasArticles) return;
    // Filter articles for this competitor + sentiment
    const byCompetitor = filterBySource(articles, entry.competitor)
      .concat(filterByTheme(articles, entry.competitor));
    const seen = new Set<string>();
    const deduped = byCompetitor.filter(a => {
      const key = a.id ?? a.title ?? "";
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    const bySentiment = filterBySentiment(deduped.length > 0 ? deduped : articles, sentimentLabel);
    openPopup({
      title: `${entry.competitor} — ${sentimentLabel}`,
      subtitle: `${bySentiment.length} ${sentimentLabel.toLowerCase()} articles`,
      articles: bySentiment.length > 0 ? bySentiment : deduped.slice(0, 20),
    });
  }

  function handleRowClick(entry: CompetitorSentimentEntry) {
    if (!hasArticles) return;
    const byCompetitor = filterBySource(articles, entry.competitor)
      .concat(filterByTheme(articles, entry.competitor));
    const seen = new Set<string>();
    const deduped = byCompetitor.filter(a => {
      const key = a.id ?? a.title ?? "";
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    openPopup({
      title: `${entry.competitor} — All Sentiment`,
      subtitle: `${deduped.length || articles.length} articles`,
      articles: deduped.length > 0 ? deduped : articles.slice(0, 20),
    });
  }

  const maxTotal = Math.max(...data.map(d => d.total), 1);

  return (
    <div className="flex flex-col gap-1 w-full py-2">
      {/* Legend */}
      <div className="flex items-center gap-4 mb-3 px-1 flex-wrap">
        {SEG.map(s => (
          <div key={s.key} className="flex items-center gap-1.5">
            <div className="size-2.5 rounded-full" style={{ background: s.color }} />
            <span className="text-[11px] font-semibold text-slate-500">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Rows */}
      {data.map((entry) => {
        const total = entry.total || 1;
        return (
          <div
            key={entry.competitor}
            className="group flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-50 transition-colors cursor-pointer"
            onClick={() => handleRowClick(entry)}
          >
            {/* Competitor name */}
            <div className="w-[110px] shrink-0">
              <p className="text-[12px] font-semibold text-slate-800 truncate leading-tight">
                {entry.competitor}
              </p>
              {entry.isBrand && (
                <span className="text-[9px] font-semibold text-indigo-600 bg-indigo-50 px-1 rounded-full">
                  Your Brand
                </span>
              )}
            </div>

            {/* Stacked bar */}
            <div className="flex-1 flex flex-col gap-1">
              <div className="flex h-6 w-full rounded-md overflow-hidden shadow-sm">
                {SEG.map(s => {
                  const val = entry[s.key];
                  const pct = Math.round((val / total) * 100);
                  return (
                    <div
                      key={s.key}
                      className="transition-opacity hover:opacity-75"
                      style={{ width: `${pct}%`, minWidth: pct > 0 ? "2px" : 0, background: s.color }}
                      title={`${s.label}: ${val} (${pct}%)`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSegmentClick(entry, s.label);
                      }}
                    />
                  );
                })}
              </div>

              {/* Volume bar */}
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-slate-300 rounded-full"
                  style={{ width: `${(entry.total / maxTotal) * 100}%` }}
                />
              </div>
            </div>

            {/* Pct pills */}
            <div className="flex items-center gap-1 shrink-0">
              {SEG.map(s => {
                const val = entry[s.key];
                const pct = Math.round((val / total) * 100);
                if (pct === 0) return null;
                return (
                  <span
                    key={s.key}
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: s.bg, color: s.textColor }}
                  >
                    {pct}%
                  </span>
                );
              })}
            </div>

            {/* Total count */}
            <div className="w-12 text-right shrink-0 text-[11px] font-semibold text-slate-400">
              {entry.total.toLocaleString()}
            </div>
          </div>
        );
      })}

      {hasArticles && (
        <p className="mt-2 text-[11px] text-slate-400 text-center font-medium">
          ↑ Click brand or segment to explore articles
        </p>
      )}
    </div>
  );
}
