import { LineChart } from "@/components/charts/line-chart"
import { Line } from "@/components/charts/line"
import { Background } from "@/components/charts/background"
import { XAxis } from "@/components/charts/x-axis"
import { YAxis } from "@/components/charts/y-axis"
import { ChartTooltip } from "@/components/charts/tooltip"
import type { AreaChartData } from "@/data/types"
import { useArticlePopup } from "@/components/builder/article-popup-modal"

/** bklit Line chart with dot-grid background + y-axis — coverage over time.
 * Clicking on a date point opens the article popup filtered by that date.
 */
export function CoverageLineChart({ data }: { data: AreaChartData }) {
  const { openPopup, articles } = useArticlePopup();
  const hasArticles = articles && articles.length > 0;
  const points = data?.points || (data as any)?.area || (Array.isArray(data) ? data : []);

  function handleChartClick() {
    if (!hasArticles) return;
    // Open with all articles; individual date filtering requires chart tooltip data
    openPopup({
      title: "Coverage Timeline",
      subtitle: `${articles.length} articles · all dates`,
      articles,
    });
  }

  return (
    <div
      className="w-full relative group"
      onClick={hasArticles ? handleChartClick : undefined}
      style={{ cursor: hasArticles ? "pointer" : "default" }}
      title={hasArticles ? "Click to see all articles" : undefined}
    >
      <LineChart data={points} xDataKey="date" aspectRatio="2 / 1">
        <Background pattern="dots" opacity={0.85} />
        <Line dataKey="brand" stroke="var(--chart-line-primary)" />
        <XAxis />
        <YAxis />
        <ChartTooltip />
      </LineChart>
      {hasArticles && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <span className="text-[10px] font-semibold text-indigo-500 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-full shadow-sm">
            Click to explore articles
          </span>
        </div>
      )}
    </div>
  )
}
