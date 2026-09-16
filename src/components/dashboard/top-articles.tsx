import { Icon } from "@/components/ui/icon"
import type { Article } from "@/data/types"

/**
 * Top Articles — two columns (positive / negative), each a stack of article
 * cards. Layout from the sense Figma; card content per the reference.
 */
export function TopArticles({ articles }: { articles: Article[] }) {
  const positive = articles.filter((a) => a.sentiment === "positive")
  const negative = articles.filter((a) => a.sentiment === "negative")

  return (
    <section className="flex flex-col gap-5 rounded-[var(--sense-radius)] bg-white p-[20px]">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h3 className="type-title text-foreground">Top Articles</h3>
          <p className="type-caption mt-1 text-muted-foreground">
            Highest-reach stories this period, split by sentiment.
          </p>
        </div>
        <button
          type="button"
          aria-label="More options"
          className="-mr-1 -mt-1 flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Icon name="more_horiz" size={20} />
        </button>
      </header>

      <div className="grid gap-10 md:grid-cols-2">
        <ArticleColumn title="Top Positive Articles" color="#007e84" items={positive} />
        <ArticleColumn title="Top Negative Articles" color="#c5390e" items={negative} />
      </div>
    </section>
  )
}

function ArticleColumn({
  title,
  color,
  items,
}: {
  title: string
  color: string
  items: Article[]
}) {
  return (
    <div className="flex flex-col">
      <div
        className="border-b pb-3"
        style={{ borderColor: "var(--sense-hairline)" }}
      >
        <p className="type-title" style={{ color }}>
          {title}
        </p>
      </div>
      {items.map((a) => (
        <ArticleCard key={a.title} article={a} />
      ))}
    </div>
  )
}

function ArticleCard({ article }: { article: Article }) {
  return (
    <article
      className="flex flex-col gap-4 border-b py-5 last:border-b-0"
      style={{ borderColor: "var(--sense-hairline)" }}
    >
      {/* top row: meta + headline, thumbnail on the right */}
      <div className="flex items-start gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <p className="type-caption text-muted-foreground">
            {article.source} · {article.date} · {article.category}
          </p>
          {article.url ? (
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[15px] font-semibold leading-snug tracking-[-0.01em] text-foreground underline-offset-2 hover:underline hover:text-indigo-600 transition-colors decoration-1"
            >
              {article.title}
            </a>
          ) : (
            <h4 className="text-[15px] font-semibold leading-snug tracking-[-0.01em] text-foreground">
              {article.title}
            </h4>
          )}
        </div>
        <div
          className="size-[92px] shrink-0 overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #eceef1 0%, #dfe2e7 100%)",
          }}
        >
          {article.image && (
            <img
              src={article.image}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none"
              }}
            />
          )}
        </div>
      </div>

      <p className="type-caption text-muted-foreground">{article.body}</p>
    </article>
  )
}
