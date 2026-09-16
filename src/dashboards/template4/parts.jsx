import { Rich } from "../../utils/text.jsx";
import {
  DynamicChartRenderer,
  Empty,
} from "../../components/CustomChartWidgets.jsx";
import {
  getCardStyleOverride,
  useDesignAgentUpdate,
} from "../../utils/designAgent.js";
import { useDynamicCharts } from "../../utils/dynamicChartManager.js";
import { LAYOUTS } from "../../workflow/constants.js";
import "./Template4.css";

/* ───────────────────────── helpers ───────────────────────── */

export function nf(n) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return new Intl.NumberFormat("en-US").format(n);
}
export function compact(n) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}
function pct1(n) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  const v = Number(n);
  return `${Number.isInteger(v) ? v : v.toFixed(1)}%`;
}

/** Normalise the many sentiment shapes into {pos,neg,neu,net,total} (percentages). */
export function deriveSentiment(chart) {
  const d = chart?.data;
  if (!d || typeof d !== "object") return null;

  // Shape A — { POS:{count,percentage}, NEG:{...}, NEU:{...}, net_sentiment_score }
  const objShape = ["POS", "NEG", "NEU"].some(
    (k) => d[k] && typeof d[k] === "object",
  );
  if (objShape) {
    const g = (k) => {
      const v = d[k];
      return v && typeof v === "object"
        ? { count: v.count ?? 0, pct: v.percentage }
        : { count: 0, pct: null };
    };
    const pos = g("POS"),
      neg = g("NEG"),
      neu = g("NEU");
    const total = pos.count + neg.count + neu.count;
    const p = (o) =>
      o.pct != null ? o.pct : total ? (o.count / total) * 100 : 0;
    return {
      pos: p(pos),
      neg: p(neg),
      neu: p(neu),
      net: d.net_sentiment_score ?? p(pos) - p(neg),
      total: total || d.total || 0,
    };
  }

  // Shape B — { Brand: { sentiments:{POS,NEG,NEU}, total_mentions, net_sentiment } }
  const first = d[Object.keys(d)[0]];
  if (first && typeof first === "object" && first.sentiments) {
    const s = first.sentiments;
    const total =
      (s.POS || 0) + (s.NEG || 0) + (s.NEU || 0) || first.total_mentions || 0;
    const p = (n) => (total ? (n / total) * 100 : 0);
    return {
      pos: p(s.POS || 0),
      neg: p(s.NEG || 0),
      neu: p(s.NEU || 0),
      net: first.net_sentiment ?? p(s.POS || 0) - p(s.NEG || 0),
      total,
    };
  }
  return null;
}

/** Build top-N theme bar rows from a theme chart (array or object). */
export function deriveThemeRows(chart, max = 6) {
  const data = chart?.data;
  let rows = [];
  if (Array.isArray(data)) {
    rows = data.map((r) => ({
      name: r.theme ?? r.name ?? r.label ?? r.category ?? r.key,
      value: Number(r.count ?? r.volume ?? r.value ?? r.total ?? 0) || 0,
    }));
  } else if (data && typeof data === "object") {
    rows = Object.entries(data).map(([k, v]) => ({
      name: k,
      value:
        typeof v === "number"
          ? v
          : Number(v?.count ?? v?.volume ?? v?.value ?? 0) || 0,
    }));
  }
  rows = rows
    .filter((r) => r.name && r.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, max);
  const maxV = rows.reduce((m, r) => Math.max(m, r.value), 0) || 1;
  return rows.map((r) => ({ ...r, pct: Math.round((r.value / maxV) * 100) }));
}

/* ───────────────────────── components ───────────────────────── */

export function T4Hero({ hero = {}, activeVideoSrc, badges = [] }) {
  return (
    <div className="t4-hero">
      {activeVideoSrc && (
        <video
          key={activeVideoSrc}
          className="t4-hero-video"
          src={activeVideoSrc}
          autoPlay
          muted
          loop
          playsInline
        />
      )}
      <div className="t4-hero-overlay" />
      <div className="t4-hero-content">
        {(badges.length > 0 || hero.kicker) && (
          <div className="t4-hero-eyebrow">
            {badges.length > 0 ? (
              badges.map((b, i) => (
                <span className="t4-hero-badge" key={i}>
                  {b}
                </span>
              ))
            ) : (
              <span className="t4-hero-badge">{hero.kicker}</span>
            )}
          </div>
        )}
        <div className="t4-hero-title">
          {hero.lead} {hero.em && <em>{hero.em}</em>}
        </div>
        {hero.sub && <div className="t4-hero-sub">{hero.sub}</div>}
        {hero.stats?.length > 0 && (
          <div className="t4-hero-stats">
            {hero.stats.map((s, i) => (
              <div className="t4-hero-stat" key={i}>
                <div
                  className="t4-hero-stat-val"
                  style={s.color ? { color: s.color } : undefined}
                >
                  {s.val}
                </div>
                <div className="t4-hero-stat-lbl">{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function T4KpiGrid({ kpis = [] }) {
  if (!kpis.length) return null;
  return (
    <div className="t4-kpi-grid">
      {kpis.map((k, i) => (
        <div className="t4-kpi" key={i}>
          <div className={`t4-kpi-val ${k.tone || ""}`}>{k.val}</div>
          <div className="t4-kpi-lbl">{k.label}</div>
          {k.sub && <div className="t4-kpi-sub">{k.sub}</div>}
        </div>
      ))}
    </div>
  );
}

export function T4SentimentBar({ sentiment }) {
  if (!sentiment) return null;
  const { pos = 0, neg = 0, neu = 0 } = sentiment;
  return (
    <div>
      <div className="t4-sent-bar">
        <div className="t4-sent-neg" style={{ width: `${neg}%` }} />
        <div className="t4-sent-neu" style={{ width: `${neu}%` }} />
        <div className="t4-sent-pos" style={{ width: `${pos}%` }} />
      </div>
      <div className="t4-sent-legend">
        <div className="t4-sent-leg-item">
          <span className="t4-sent-dot" style={{ background: "var(--red)" }} />
          Negative <span className="t4-sent-leg-pct">{pct1(neg)}</span>
        </div>
        <div className="t4-sent-leg-item">
          <span
            className="t4-sent-dot"
            style={{ background: "var(--amber)" }}
          />
          Neutral <span className="t4-sent-leg-pct">{pct1(neu)}</span>
        </div>
        <div className="t4-sent-leg-item">
          <span
            className="t4-sent-dot"
            style={{ background: "var(--green)" }}
          />
          Positive <span className="t4-sent-leg-pct">{pct1(pos)}</span>
        </div>
      </div>
    </div>
  );
}

export function T4ThemeBars({ rows = [] }) {
  if (!rows.length) return <div className="t4-empty">No theme data.</div>;
  return (
    <div>
      {rows.map((r, i) => (
        <div className="t4-theme-row" key={i}>
          <div className="t4-theme-name" title={r.name}>
            {r.name}
          </div>
          <div className="t4-theme-track">
            <div className="t4-theme-fill" style={{ width: `${r.pct}%` }} />
          </div>
          <div className="t4-theme-pct">{r.value}</div>
        </div>
      ))}
    </div>
  );
}

export function T4Card({
  title,
  sub,
  chart,
  children,
  analysis,
  onOpenAnalysis,
  insight,
  dateInsights,
}) {
  useDesignAgentUpdate();
  const cardOverride = getCardStyleOverride(
    title || chart?.title || chart?.chart_id,
  );
  const cardStyle = cardOverride
    ? {
        background: cardOverride.background_color,
        borderColor: cardOverride.border_color || "rgba(255,255,255,0.25)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
        color: "#ffffff",
      }
    : {};

  return (
    <div className="t4-card" style={cardStyle}>
      <div className="t4-card-head">
        <div>
          {title && (
            <h3
              className="t4-card-title"
              style={cardOverride ? { color: "#ffffff" } : undefined}
            >
              {title}
            </h3>
          )}
          {sub && (
            <p
              className="t4-card-sub"
              style={
                cardOverride ? { color: "rgba(255,255,255,0.75)" } : undefined
              }
            >
              {sub}
            </p>
          )}
        </div>
      </div>
      <div className="t4-card-body">
        {children ??
          (chart ? (
            <DynamicChartRenderer chart={chart} dateInsights={dateInsights} />
          ) : (
            <Empty />
          ))}
      </div>
      {(insight || analysis || onOpenAnalysis) && (
        <div
          className="t4-card-insight"
          style={cardOverride ? { color: "rgba(255,255,255,0.85)" } : undefined}
        >
          {insight ? (
            <Rich
              text={insight}
              style={{ color: "oklch(0.53 0.015 265)", lineHeight: 1.4 }}
              suffix={
                (onOpenAnalysis || analysis) ? (
                  <button
                    type="button"
                    onClick={onOpenAnalysis}
                    className="inline-flex items-center ml-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline cursor-pointer transition-colors"
                    style={{ color: "var(--accent-a, #6366f1)" }}
                  >
                    Read More
                  </button>
                ) : null
              }
            />
          ) : (onOpenAnalysis || analysis) ? (
            <Rich
              text={
                typeof analysis === "string" && analysis.trim()
                  ? (analysis.trim().length > 160
                      ? analysis.trim().slice(0, 160) + "…"
                      : analysis.trim())
                  : ""
              }
              style={{ color: "oklch(0.53 0.015 265)", lineHeight: 1.4 }}
              inline={true}
              suffix={
                <button
                  type="button"
                  onClick={onOpenAnalysis}
                  className="inline-flex items-center ml-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline cursor-pointer transition-colors"
                  style={{ color: "var(--accent-a, #6366f1)" }}
                >
                  Read More
                </button>
              }
            />
          ) : null}
        </div>
      )}
    </div>
  );
}

export function T4Findings({ items = [] }) {
  if (!items.length) return <div className="t4-empty">No findings yet.</div>;
  return (
    <div>
      {items.map((f, i) => (
        <div className="t4-finding" key={i}>
          {f.tag && (
            <span className={`t4-finding-tag ${f.tone || ""}`}>{f.tag}</span>
          )}
          {f.title && <div className="t4-finding-title">{f.title}</div>}
          {f.body && (
            <div className="t4-finding-body">
              <Rich text={f.body} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function T4ChapterIntro({
  index,
  sectionLabel,
  chapterTitle,
  hook,
  context,
  learnItems = [],
}) {
  return (
    <div className="t4-chapter-intro">
      <div className="t4-ci-inner">
        <div className="t4-ci-left">
          <div className="t4-ci-chapter">
            <span className="t4-ci-chapter-num">{index}</span>
            {chapterTitle}
            {sectionLabel && (
              <>
                <span className="t4-ci-chapter-dot" />
                {sectionLabel}
              </>
            )}
          </div>
          {hook && <div className="t4-ci-hook">{hook}</div>}
          {context && (
            <div className="t4-ci-context">
              <Rich text={String(context)} />
            </div>
          )}
        </div>
        {learnItems.length > 0 && (
          <div className="t4-ci-right">
            <div className="t4-ci-learn-title">What you'll discover</div>
            {learnItems.map((it, i) => (
              <div className="t4-ci-learn-item" key={i}>
                <span className="t4-ci-bullet">{i + 1}</span>
                <span>{it}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function T4NextChapter({ num, title, hook, onClick }) {
  return (
    <div
      className="t4-next-chapter"
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <div className="t4-nc-num">{num}</div>
      <div className="t4-nc-divider" />
      <div className="t4-nc-body">
        <div className="t4-nc-eyebrow">
          <span className="t4-nc-next-pill">Up Next</span>
          Chapter {num}
        </div>
        <div className="t4-nc-title">{title}</div>
        {hook && <div className="t4-nc-hook">{hook}</div>}
      </div>
      <button className="t4-nc-cta" onClick={onClick}>
        Continue reading <span className="t4-nc-cta-arrow">→</span>
      </button>
    </div>
  );
}

export function T4StoryComplete({ tabs = [], onGoTab, onRestart }) {
  return (
    <div className="t4-story-complete">
      <div className="t4-sc-check">✓</div>
      <div className="t4-sc-title">You've reviewed every chapter</div>
      <div className="t4-sc-sub">
        Every section has been analysed — from the headline metrics through each
        deep dive. Jump back to any chapter below, or restart the story.
      </div>
      <div className="t4-sc-chapters">
        {tabs.map((t, i) => (
          <div className="t4-sc-chap-pill" key={t} onClick={() => onGoTab?.(t)}>
            <span className="t4-sc-chap-num">{i + 1}</span>
            {t}
          </div>
        ))}
      </div>
      <div className="t4-sc-actions">
        <button className="t4-sc-action primary" onClick={onRestart}>
          Start over →
        </button>
      </div>
    </div>
  );
}

// Labels come from the shared LAYOUTS list
const TEMPLATE_MODES = [
  { key: "classic", label: LAYOUTS[0] },
  { key: "editorial", label: LAYOUTS[1] },
  { key: "merger", label: LAYOUTS[2] },
  { key: "impact", label: LAYOUTS[3] },
  { key: "glass", label: LAYOUTS[4] },
  { key: "bento", label: LAYOUTS[5] },
];

/* ───────────────────── 3-panel shell / Core ───────────────────── */

export default function Template4Core({
  brandLabel,
  onBack,
  templateMode,
  onChangeTemplate,
  hero,
  badges,
  activeVideoSrc,
  tabs = [],
  tab,
  setTab,
  chapters,
  overall,
  sentiment, // derived {pos,neg,neu,net,total}
  extraKpis = [],
  themeRows = [],
  themeLabel = "Top Themes",
  findings = [],
  centerByTab = {},
}) {
  const activeTab = tab && tabs.includes(tab) ? tab : tabs[0];
  const { customTabsData } = useDynamicCharts(activeTab);
  const cards = centerByTab[activeTab] || [];
  const activeIdx = Math.max(0, tabs.indexOf(activeTab));

  const chapterMeta = (name, idx) => {
    if (Array.isArray(chapters) && chapters.length) {
      return (
        chapters.find(
          (c) => c.tab_name?.toLowerCase() === String(name).toLowerCase(),
        ) ||
        chapters[idx] ||
        null
      );
    }
    return null;
  };
  const cur = chapterMeta(activeTab, activeIdx);
  const learnItems = tabs.filter((t) => t !== activeTab).slice(0, 3);
  const isLast = activeIdx === tabs.length - 1;
  const nextName = !isLast ? tabs[activeIdx + 1] : null;
  const nextMeta = nextName ? chapterMeta(nextName, activeIdx + 1) : null;

  const sentimentKpis = sentiment
    ? [
        { val: pct1(sentiment.neg), label: "Negative", tone: "neg" },
        { val: pct1(sentiment.pos), label: "Positive", tone: "pos" },
        { val: pct1(sentiment.neu), label: "Neutral", tone: "neu" },
        {
          val: Math.round(sentiment.net),
          label: "Net Score",
          tone: "blue",
          sub: "Pos minus Neg",
        },
      ]
    : [];
  const kpis = [...sentimentKpis, ...extraKpis];

  return (
    <div className="t4-root" data-dashboard-template="impact">
      {/* top bar */}
      <div className="t4-topbar">
        {onBack && (
          <button
            className="t4-back"
            onClick={onBack}
            title="Back to dashboards"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
        )}
        <div className="t4-brand">
          <span className="t4-brand-mark">IV</span>
          {brandLabel || "Intelligence"}
        </div>
        {onChangeTemplate && (
          <div className="t4-switch">
            {TEMPLATE_MODES.map((m) => (
              <button
                key={m.key}
                className={`t4-switch-btn ${templateMode === m.key ? "active" : ""}`}
                onClick={() => onChangeTemplate(m.key)}
              >
                {m.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <T4Hero hero={hero} activeVideoSrc={activeVideoSrc} badges={badges} />

      {/* tabs */}
      {tabs.length > 0 && (
        <div className="t4-tabs">
          {tabs.map((t) => (
            <button
              key={t}
              className={`t4-tab ${activeTab === t ? "active" : ""}`}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>
      )}
      <T4ChapterIntro
        index={activeIdx + 1}
        sectionLabel={cur?.section_label || "Overview"}
        chapterTitle={cur?.tab_name || activeTab}
        hook={cur?.title || hero?.lead || activeTab}
        context={cur?.description || overall}
        learnItems={learnItems}
      />
      {/* 3-panel */}
      <div className="t4-panels">
        {/* LEFT */}
        <aside className="t4-left">
          {kpis.length > 0 && (
            <div className="t4-sec">
              <div className="t4-sec-label">Key Metrics</div>
              <T4KpiGrid kpis={kpis} />
            </div>
          )}
          {sentiment && (
            <div className="t4-sec">
              <div className="t4-sec-label">Sentiment Split</div>
              <T4SentimentBar sentiment={sentiment} />
            </div>
          )}
          {themeRows.length > 0 && (
            <div className="t4-sec">
              <div className="t4-sec-label">{themeLabel}</div>
              <T4ThemeBars rows={themeRows} />
            </div>
          )}
        </aside>

        {/* CENTER */}
        <main className="t4-center">
          {cards.length === 0 ? (
            <T4Card title="No charts for this section" />
          ) : (
            <>
              {cards.map((c, i) => (
                <T4Card
                  key={i}
                  title={c.title}
                  sub={c.sub}
                  chart={c.chart}
                  analysis={c.analysis}
                  onOpenAnalysis={c.onOpenAnalysis}
                  insight={c.insight}
                  dateInsights={c.dateInsights}
                >
                  {c.children}
                </T4Card>
              ))}
              {/* ── Custom Dynamic Tabs Created by Chatbot ── */}
              {customTabsData?.[activeTab] && (
                <div
                  className="dashstack"
                  style={{ marginTop: 24, padding: "0 24px" }}
                >
                  <div className="chartgrid">
                    {customTabsData[activeTab].map((c, i) => (
                      <T4Card
                        key={c.chart_id || i}
                        title={c.title}
                        sub={c.description}
                        chart={c}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </main>

        {/* RIGHT */}
        <aside className="t4-right">
          <div className="t4-sec">
            <div className="t4-sec-label">Key Findings</div>
            <T4Findings items={findings} />
          </div>
        </aside>
      </div>
      {isLast ? (
        <T4StoryComplete
          tabs={tabs}
          onGoTab={setTab}
          onRestart={() => setTab(tabs[0])}
        />
      ) : (
        <T4NextChapter
          num={String(activeIdx + 2).padStart(2, "0")}
          title={nextName}
          hook={nextMeta?.description}
          onClick={() => setTab(nextName)}
        />
      )}
    </div>
  );
}
