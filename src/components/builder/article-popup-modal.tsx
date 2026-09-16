"use client";

/**
 * ArticlePopupModal — context + modal for showing filtered articles
 * when the user clicks any chart element (donut segment, bar, line point).
 *
 * Usage:
 *   1. Wrap canvas with <ArticlePopupProvider articles={rawArticles}>
 *   2. In any chart component: const { openPopup } = useArticlePopup()
 *      openPopup({ title: "Positive Articles", filterFn: a => a.sentiment === "Positive" })
 */

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import { Icon } from "@/components/ui/icon";

/* ────────────────────────────────────────────────────────────── types ── */

export interface RawArticle {
  id?: string;
  title?: string;
  url?: string;
  source?: string;
  publication?: string;
  outlet?: string;
  sentiment?: string;
  articlesentiment?: string;
  theme?: string;
  category?: string;
  date?: string;
  published_at?: string;
  relevancy_confidence?: number;
  body?: string;
  excerpt?: string;
  summary?: string;
}

interface PopupPayload {
  title: string;
  /** Optional label under the title, e.g. "8 of 184 articles" */
  subtitle?: string;
  /** Filtered article list to display */
  articles: RawArticle[];
}

interface ArticlePopupCtx {
  /** Open the popup with filtered articles. Pass null articles to close. */
  openPopup: (payload: PopupPayload) => void;
  closePopup: () => void;
  /** Raw session articles for consumer-side filtering */
  articles: RawArticle[];
}

/* ─────────────────────────────────────────────────────────── context ── */

const Ctx = createContext<ArticlePopupCtx>({
  openPopup: () => {},
  closePopup: () => {},
  articles: [],
});

export function useArticlePopup() {
  return useContext(Ctx);
}

/* ─────────────────────────────────────────────────────────── helpers ── */

function normSentiment(a: RawArticle): string {
  const raw = (a.sentiment || a.articlesentiment || "").toLowerCase().trim();
  if (raw.startsWith("pos")) return "Positive";
  if (raw.startsWith("neg")) return "Negative";
  if (raw.startsWith("neu")) return "Neutral";
  return "Unassigned";
}

function sourceLabel(a: RawArticle): string {
  const pub = a.publication || a.source || a.outlet || "";
  if (pub) return pub;
  try {
    const u = new URL(a.url || "");
    return u.hostname.replace(/^www\./, "");
  } catch {
    return "Unknown";
  }
}

function sentimentColor(s: string) {
  if (s === "Positive")  return { bg: "#d1fae5", text: "#065f46" };
  if (s === "Negative")  return { bg: "#fee2e2", text: "#991b1b" };
  if (s === "Neutral")   return { bg: "#f1f5f9", text: "#475569" };
  return                        { bg: "#f1f5f9", text: "#64748b" };
}

const AVATAR_GRADS = [
  "linear-gradient(135deg,#6366f1,#8b5cf6)",
  "linear-gradient(135deg,#0d9488,#06b6d4)",
  "linear-gradient(135deg,#f59e0b,#f97316)",
  "linear-gradient(135deg,#e11d48,#f43f5e)",
  "linear-gradient(135deg,#3b82f6,#6366f1)",
  "linear-gradient(135deg,#7c3aed,#a78bfa)",
];

/* ─────────────────────────────────────────────────────────── modal ── */

function ArticleCard({ article, index }: { article: RawArticle; index: number }) {
  const sent  = normSentiment(article);
  const sc    = sentimentColor(sent);
  const src   = sourceLabel(article);
  const title = article.title || "(Untitled)";
  const url   = article.url || "";
  const theme = article.theme || article.category || "";
  const date  = (article.date || article.published_at || "").slice(0, 10);
  const body  = article.body || article.excerpt || article.summary || "";
  const conf  = article.relevancy_confidence;
  const grad  = AVATAR_GRADS[index % AVATAR_GRADS.length];
  const initial = src[0]?.toUpperCase() || "?";

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.035, duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className="flex gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200"
    >
      {/* Avatar */}
      <div
        className="shrink-0 size-10 rounded-xl flex items-center justify-center text-white text-sm font-bold"
        style={{ background: grad }}
      >
        {initial}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        {/* Source + date row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full truncate max-w-[140px]">
            {src}
          </span>
          {date && (
            <span className="text-[11px] text-slate-400 font-medium">{date}</span>
          )}
          {conf != null && (
            <span className="text-[11px] text-slate-400 font-medium ml-auto">
              {Math.round(conf)}% relevance
            </span>
          )}
        </div>

        {/* Title — hyperlink */}
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[14px] font-semibold leading-snug text-slate-900 hover:text-indigo-600 underline-offset-2 hover:underline decoration-indigo-300 transition-colors line-clamp-2"
          >
            {title}
          </a>
        ) : (
          <p className="text-[14px] font-semibold leading-snug text-slate-900 line-clamp-2">
            {title}
          </p>
        )}

        {/* Theme + sentiment row */}
        <div className="flex items-center gap-2 flex-wrap">
          {theme && (
            <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full truncate max-w-[180px]">
              {theme}
            </span>
          )}
          <span
            className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
            style={{ background: sc.bg, color: sc.text }}
          >
            {sent}
          </span>
        </div>

        {/* Excerpt */}
        {body && (
          <p className="text-[12px] text-slate-500 leading-relaxed line-clamp-3 mt-0.5">
            {body}
          </p>
        )}
      </div>
    </motion.article>
  );
}

function ArticlePopupModal({
  payload,
  onClose,
}: {
  payload: PopupPayload;
  onClose: () => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const arts = payload.articles;

  return (
    /* Backdrop — slides panel in from LEFT so canvas charts stay fully visible */
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-start"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Frosted backdrop — click anywhere outside panel to close */}
      <div
        className="absolute inset-0 bg-slate-950/20 backdrop-blur-[1px]"
        onClick={onClose}
      />

      {/* LEFT-side drawer panel — overlays the chat column, keeps canvas visible */}
      <motion.div
        className="relative z-10 flex flex-col h-full w-full max-w-[500px] bg-[#F5F6FA] shadow-2xl border-r border-slate-200"
        initial={{ x: "-100%" }}
        animate={{ x: 0 }}
        exit={{ x: "-100%" }}
        transition={{ type: "spring", stiffness: 340, damping: 36 }}
      >
        {/* Header */}
        <div className="shrink-0 flex items-start justify-between gap-4 px-6 pt-6 pb-5 bg-white border-b border-slate-100">
          <div className="min-w-0">
            <h2 className="text-[17px] font-bold text-slate-900 tracking-tight leading-tight">
              {payload.title}
            </h2>
            {payload.subtitle && (
              <p className="text-[12px] text-slate-500 mt-1 font-medium">
                {payload.subtitle}
              </p>
            )}
            {!payload.subtitle && (
              <p className="text-[12px] text-slate-500 mt-1 font-medium">
                {arts.length} article{arts.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 flex size-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors"
            aria-label="Close"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        {/* Article list */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3"
        >
          {arts.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 h-48 text-center">
              <div className="size-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <Icon name="article" size={24} />
              </div>
              <p className="text-[14px] font-semibold text-slate-500">
                No articles found for this filter
              </p>
              <p className="text-[12px] text-slate-400 max-w-[220px]">
                Try clicking a different chart segment or check your session data.
              </p>
            </div>
          ) : (
            arts.map((a, i) => (
              <ArticleCard key={a.id ?? `${a.title}-${i}`} article={a} index={i} />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-6 py-4 bg-white border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-medium">
            {arts.length} result{arts.length !== 1 ? "s" : ""}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-[12px] font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────────────────── provider ── */

export function ArticlePopupProvider({
  children,
  articles,
}: {
  children: ReactNode;
  articles: RawArticle[];
}) {
  const [payload, setPayload] = useState<PopupPayload | null>(null);

  const openPopup = useCallback((p: PopupPayload) => setPayload(p), []);
  const closePopup = useCallback(() => setPayload(null), []);

  return (
    <Ctx.Provider value={{ openPopup, closePopup, articles }}>
      {children}
      <AnimatePresence>
        {payload && (
          <ArticlePopupModal
            key="article-popup"
            payload={payload}
            onClose={closePopup}
          />
        )}
      </AnimatePresence>
    </Ctx.Provider>
  );
}

/* ─────────────────────────────── convenience filter helpers (exported) ── */

/** Filter raw articles by normalised sentiment label */
export function filterBySentiment(articles: RawArticle[], label: string) {
  const lo = label.toLowerCase();
  return articles.filter((a) => normSentiment(a).toLowerCase() === lo);
}

/** Filter raw articles by theme (case-insensitive substring) */
export function filterByTheme(articles: RawArticle[], theme: string) {
  const lo = theme.toLowerCase();
  return articles.filter(
    (a) => (a.theme || a.category || "").toLowerCase() === lo
  );
}

/** Filter raw articles by source domain */
export function filterBySource(articles: RawArticle[], src: string) {
  const lo = src.toLowerCase();
  return articles.filter((a) => sourceLabel(a).toLowerCase() === lo);
}

/** Filter raw articles by date key (YYYY-MM-DD prefix match) */
export function filterByDate(articles: RawArticle[], date: string) {
  return articles.filter((a) => {
    const d = (a.date || a.published_at || "").slice(0, 10);
    return d === date;
  });
}
