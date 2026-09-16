import { PieChart } from "@/components/charts/pie-chart"
import { PieSlice } from "@/components/charts/pie-slice"
import { PieCenter } from "@/components/charts/pie-center"
import type { PieChartData } from "@/data/types"
import { useArticlePopup, filterBySentiment } from "@/components/builder/article-popup-modal"
import { cn } from "@/lib/utils"

function getSentimentColor(label: string): string | undefined {
  const l = String(label || "").toLowerCase().trim();
  if (l.includes("pos")) return "#10b981"; // Green
  if (l.includes("neg")) return "#ef4444"; // Red
  if (l.includes("neu")) return "#64748b"; // Gray
  if (l.includes("unas") || l.includes("mix")) return "#cbd5e1"; // Muted Gray
  return undefined;
}

/**
 * bklit donut Pie for sentiment — clickable segments open article popup.
 * Legend items and individual slices are clickable via the ArticlePopupContext.
 */
export function SentimentDonut({ data }: { data: PieChartData }) {
  const { openPopup, articles } = useArticlePopup();
  const hasArticles = articles && articles.length > 0;

  const chartData = (data?.data || []).map((d) => ({
    ...d,
    color: getSentimentColor(d.label) ?? d.color ?? "#64748b",
  }));

  function handleSegmentClick(label: string) {
    if (!hasArticles) return;
    const filtered = filterBySentiment(articles, label);
    openPopup({
      title: `${label} Articles`,
      subtitle: `${filtered.length} of ${articles.length} articles · ${label.toLowerCase()} sentiment`,
      articles: filtered,
    });
  }

  return (
    <div className="flex w-full flex-col items-center gap-6">
      {/* Wrap the pie chart in a clickable container for "show all" on chart body click */}
      <div
        className={cn("relative", hasArticles && "cursor-pointer")}
        onClick={
          hasArticles
            ? () =>
                openPopup({
                  title: "All Articles by Sentiment",
                  subtitle: `${articles.length} articles`,
                  articles,
                })
            : undefined
        }
        title={hasArticles ? "Click to see all articles" : undefined}
      >
        <PieChart
          data={chartData}
          size={300}
          innerRadius={96}
          padAngle={0.015}
          cornerRadius={3}
        >
          {chartData.map((_, i) => (
            <PieSlice key={i} index={i} />
          ))}
          <PieCenter defaultLabel={data?.centerLabel} />
        </PieChart>

        {/* Subtle "click to explore" ring indicator when articles available */}
        {hasArticles && (
          <div className="absolute inset-0 rounded-full opacity-0 hover:opacity-100 transition-opacity pointer-events-none flex items-center justify-center">
            <div className="text-[10px] font-semibold text-slate-400 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm">
              Click to explore
            </div>
          </div>
        )}
      </div>

      {/* Clickable legend items */}
      <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
        {chartData.map((d) => (
          <li
            key={d.label}
            onClick={hasArticles ? () => handleSegmentClick(d.label) : undefined}
            className={cn(
              "type-caption inline-flex items-center gap-2 text-muted-foreground font-medium",
              hasArticles &&
                "cursor-pointer rounded-full px-3 py-1.5 transition-all hover:bg-slate-100 hover:text-foreground hover:shadow-sm select-none"
            )}
            title={hasArticles ? `Click to see ${d.label.toLowerCase()} articles` : undefined}
          >
            <span
              className="size-2.5 rounded-full inline-block shrink-0"
              style={{ background: d.color }}
            />
            {d.label}
            {hasArticles && (
              <span className="text-[10px] opacity-60 font-bold">↗</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
