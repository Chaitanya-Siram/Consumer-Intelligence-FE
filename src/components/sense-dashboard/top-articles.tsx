import { Icon } from "../../components/ui/icon";
import type { Article } from "../../data/types";

/**
 * Top Articles — two columns (positive / negative), each a stack of article
 * cards. Handles both array of Articles and { POS: [...], NEG: [...] } chart data objects.
 */
export function TopArticles({
  articles,
  data,
}: {
  articles?: Article[] | Record<string, any>;
  data?: Article[] | Record<string, any>;
}) {
  const input = articles || data || [];

  let positive: any[] = [];
  let negative: any[] = [];
  let neutral: any[] = [];

  if (Array.isArray(input)) {
    positive = input.filter(
      (a) =>
        a?.sentiment === "positive" ||
        a?.sentiment === "POS" ||
        String(a?.sentiment || "")
          .toLowerCase()
          .includes("pos"),
    );
    negative = input.filter(
      (a) =>
        a?.sentiment === "negative" ||
        a?.sentiment === "NEG" ||
        String(a?.sentiment || "")
          .toLowerCase()
          .includes("neg"),
    );

    neutral = input.filter(
      (a) =>
        a?.sentiment === "neutral" ||
        a?.sentiment === "NEU" ||
        String(a?.sentiment || "")
          .toLowerCase()
          .includes("neu"),
    );

    // Fallback if articles array is not tagged with sentiment
    if (
      positive.length === 0 &&
      negative.length === 0 &&
      neutral.length === 0 &&
      input.length > 0
    ) {
      positive = input.slice(0, Math.ceil(input.length / 2));
      negative = input.slice(Math.ceil(input.length / 2));
      neutral = input.slice(Math.ceil(input.length / 2));
    }
  } else if (input && typeof input === "object") {
    const posRaw = (input as any).POS || (input as any).positive || [];
    const negRaw = (input as any).NEG || (input as any).negative || [];
    const neutralRaw = (input as any).NEU || (input as any).neutral || [];

    positive = Array.isArray(posRaw)
      ? posRaw.map((a: any) => ({
          title: a.title,
          source: a.domain || a.source || "News",
          date: a.date ? String(a.date).slice(0, 10) : "",
          category: a.theme || a.category || "General",
          body: a.content || a.body || a.snippet || "",
          image: a.image,
          sentiment: "positive",
        }))
      : [];

    negative = Array.isArray(negRaw)
      ? negRaw.map((a: any) => ({
          title: a.title,
          source: a.domain || a.source || "News",
          date: a.date ? String(a.date).slice(0, 10) : "",
          category: a.theme || a.category || "General",
          body: a.content || a.body || a.snippet || "",
          image: a.image,
          sentiment: "negative",
        }))
      : [];

    neutral = Array.isArray(neutralRaw)
      ? neutralRaw.map((a: any) => ({
          title: a.title,
          source: a.domain || a.source || "News",
          date: a.date ? String(a.date).slice(0, 10) : "",
          category: a.theme || a.category || "General",
          body: a.content || a.body || a.snippet || "",
          image: a.image,
          sentiment: "neutral",
        }))
      : [];
  }

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
        <ArticleColumn
          title="Top Positive Articles"
          color="#007e84"
          items={positive}
        />
        <ArticleColumn
          title="Top Negative Articles"
          color="#c5390e"
          items={negative}
        />
        <ArticleColumn
          title="Top Neutral Articles"
          color="#1a3c4dff"
          items={neutral}
        />
      </div>
    </section>
  );
}

function ArticleColumn({
  title,
  color,
  items,
}: {
  title: string;
  color: string;
  items: any[];
}) {
  return (
    <div className="flex flex-col">
      <div
        className="border-b pb-3"
        style={{ borderColor: "var(--sense-hairline)" }}
      >
        <p className="type-title" style={{ color }}>
          {title} ({items.length})
        </p>
      </div>
      {items.length > 0 ? (
        items.map((a, i) => (
          <ArticleCard key={a.title || a.id || i} article={a} />
        ))
      ) : (
        <p className="type-caption text-muted-foreground pt-4 italic">
          No articles found for this sentiment.
        </p>
      )}
    </div>
  );
}

function ArticleCard({ article }: { article: any }) {
  const source = article.source || article.domain || "News";
  const date = article.date || "";
  const category = article.category || article.theme || "General";
  const bodyText = article.body || article.content || article.snippet || "";

  return (
    <article
      className="flex flex-col gap-4 border-b py-5 last:border-b-0"
      style={{ borderColor: "var(--sense-hairline)" }}
    >
      {/* top row: meta + headline, thumbnail on the right */}
      <div className="flex items-start gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <p className="type-caption text-muted-foreground">
            {source} · {date} · {category}
          </p>
          <h4 className="cursor-pointer text-[15px] font-semibold leading-snug tracking-[-0.01em] text-foreground decoration-1 underline-offset-2 hover:underline">
            {article.title}
          </h4>
        </div>
        {article.image && (
          <div
            className="size-[92px] shrink-0 overflow-hidden rounded-md"
            style={{
              background: "linear-gradient(135deg, #eceef1 0%, #dfe2e7 100%)",
            }}
          >
            <img
              src={article.image}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
        )}
      </div>

      {bodyText && (
        <p className="type-caption text-muted-foreground leading-relaxed">
          {bodyText}
        </p>
      )}
    </article>
  );
}
