import { Rich } from "../../utils/text.jsx";
import {
  DynamicChartRenderer,
  Empty,
} from "../../components/CustomChartWidgets.jsx";
import { useDynamicCharts, TabDynamicCharts } from "../../utils/dynamicChartManager.js";
import "./Template6.css";

export {
  compact,
  deriveSentiment,
  deriveThemeRows,
} from "../template5/parts.jsx";

const TAB_ICONS = {
  overview: "fa-solid fa-house-chimney-window",
  "sentiment analysis": "fa-solid fa-chart-line",
  sentiment: "fa-solid fa-chart-line",
  "themes & topics": "fa-solid fa-hashtag",
  themes: "fa-solid fa-hashtag",
  "media coverage": "fa-solid fa-newspaper",
  coverage: "fa-solid fa-newspaper",
  "key stories": "fa-solid fa-star",
  stories: "fa-solid fa-star",
  "message consistency": "fa-solid fa-circle-check",
  "media types": "fa-solid fa-photo-film",
  "competitor breakdown": "fa-solid fa-users-line",
  "reputation scorecard": "fa-solid fa-gauge-high",
  "trust pillars": "fa-solid fa-landmark",
  "weight sensitivity": "fa-solid fa-sliders",
  "competitor benchmarks": "fa-solid fa-users",
  "impact breakdown": "fa-solid fa-chart-simple",
};

// rgba (not solid hex) so the shared background video/gradient shows through
const STORYBOARD_GRADIENTS = [
  ["rgba(99,102,241,0.82)", "rgba(139,92,246,0.82)"],
  ["rgba(139,92,246,0.82)", "rgba(236,72,153,0.82)"],
  ["rgba(236,72,153,0.82)", "rgba(245,158,11,0.82)"],
  ["rgba(245,158,11,0.82)", "rgba(16,185,129,0.82)"],
  ["rgba(16,185,129,0.82)", "rgba(6,182,212,0.82)"],
];
const STORYBOARD_LABELS = [
  "KEY SIGNAL",
  "DATA POINT",
  "INSIGHT",
  "TREND",
  "WATCHLIST",
];

function getTabIcon(name) {
  return TAB_ICONS[String(name).toLowerCase()] || "fa-solid fa-circle";
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function truncate(text, max = 150) {
  if (!text || text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
}

/* ── Chart-bearing card, shared by every tab ── */
export function T6Card({
  title,
  sub,
  chart,
  children,
  analysis,
  onOpenAnalysis,
  insight,
  dateInsights,
  wide = false,
  className = "",
}) {
  return (
    <div
      className={`t6-card ${className}`}
      style={wide ? { gridColumn: "1 / -1" } : undefined}
    >
      <div className="t6-card-head">
        <div>
          {title && <h3 className="t6-card-title">{title}</h3>}
          {sub && <p className="t6-card-sub">{sub}</p>}
        </div>
      </div>
      <div className="t6-card-body">
        {children ??
          (chart ? (
            <DynamicChartRenderer chart={chart} dateInsights={dateInsights} />
          ) : (
            <Empty />
          ))}
      </div>
      {(insight || analysis || onOpenAnalysis) && (
        <div className="t6-card-insight">
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

/* ── Storyboard "watch for" cards, rendered inline at the top of a tab body ── */
function T6StoryboardCards({ chapter }) {
  const watches = chapter?.what_to_watch_for || [];
  if (!watches.length) return null;
  return (
    <div className="t6-storyboard-grid">
      {watches.map((w, i) => {
        const [ac1, ac2] =
          STORYBOARD_GRADIENTS[i % STORYBOARD_GRADIENTS.length];
        return (
          <div
            key={i}
            className="t6-storyboard-card"
            style={{ background: `linear-gradient(135deg, ${ac1}, ${ac2})` }}
          >
            <div className="t6-storyboard-num">
              {pad(i + 1)} · {STORYBOARD_LABELS[i % STORYBOARD_LABELS.length]}
            </div>
            <p className="t6-storyboard-body">{w}</p>
            <div className="t6-storyboard-arrow">→</div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Gradient "What's Next" banner, shown at the bottom of every tab ── */
function T6Banner({ chapters, tabs, activeIdx, setTab }) {
  if (!Array.isArray(chapters) || !chapters.length) return null;

  const isLast = activeIdx === tabs.length - 1;
  const sorted = [...chapters].sort((a, b) => a.chapter - b.chapter);

  if (isLast) {
    return (
      <div className="t6-banner">
        <div>
          <div className="t6-banner-eyebrow">
            <span className="t6-banner-dot" />
            Story complete
          </div>
          <h3 className="t6-banner-title">You've reviewed every chapter</h3>
          <p className="t6-banner-sub">
            Jump back to any tab to revisit a chapter, or start again from the
            top.
          </p>
        </div>
        <button className="t6-banner-btn" onClick={() => setTab(tabs[0])}>
          Start over
          <i className="fa-solid fa-rotate-right" />
        </button>
      </div>
    );
  }

  const nextName = tabs[activeIdx + 1];
  const nextChapter =
    sorted.find(
      (c) => c.tab_name?.toLowerCase() === String(nextName).toLowerCase(),
    ) || sorted[activeIdx + 1];
  if (!nextChapter || (!nextChapter.title && !nextChapter.description))
    return null;

  return (
    <div className="t6-banner">
      <div>
        <div className="t6-banner-eyebrow">
          <span className="t6-banner-dot" />
          What's next · {nextChapter.tab_name || nextName}
        </div>
        <h3 className="t6-banner-title">{nextChapter.title || nextName}</h3>
        {nextChapter.description && (
          <p className="t6-banner-sub">{nextChapter.description}</p>
        )}
      </div>
      <button
        className="t6-banner-btn"
        onClick={() => {
          setTab(nextName);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      >
        Continue · {nextName}
        <i className="fa-solid fa-arrow-right" />
      </button>
    </div>
  );
}

export default function Template6Core({
  brandLabel,
  onBack,
  templateMode,
  onChangeTemplate,
  hero = {},
  activeVideoSrc,
  tabs = [],
  tab,
  setTab,
  kpis = [],
  findings = [],
  centerByTab = {},
  chapters = [],
  overall,
  chartsData,
}) {
  const activeTab = tab && tabs.includes(tab) ? tab : tabs[0];
  const { customTabsData } = useDynamicCharts(activeTab, { chartsData });
  const activeIdx = Math.max(0, tabs.indexOf(activeTab));
  const isOverview = activeIdx === 0;
  const cards = centerByTab[activeTab] || [];

  const currentChapter =
    (Array.isArray(chapters) &&
      chapters.length &&
      (chapters.find(
        (c) => c.tab_name?.toLowerCase() === String(activeTab).toLowerCase(),
      ) ||
        chapters[activeIdx])) ||
    null;

  const spotlightWatch = currentChapter?.what_to_watch_for?.[0];
  const spotlightFinding = !spotlightWatch ? findings[0] : null;

  const headlineTitle =
    currentChapter?.title ||
    [hero.lead, hero.em].filter(Boolean).join(" ") ||
    `${brandLabel} · ${activeTab}`;
  const headlineDesc = currentChapter?.description || overall || hero.sub || "";

  const primaryKpi = kpis[0];
  const restKpis = kpis.slice(1);

  const nextTabName = activeIdx < tabs.length - 1 ? tabs[activeIdx + 1] : null;
  const lastTabName = tabs[tabs.length - 1];

  return (
    <div className="t6-root">
      {activeVideoSrc && (
        <video
          className="t6-bg-video"
          src={activeVideoSrc}
          autoPlay
          muted
          loop
          playsInline
        />
      )}
      <div className="t6-bg-tint" />
      <div className="t6-aura t6-aura--a" />
      <div className="t6-aura t6-aura--b" />
      <div className="t6-aura t6-aura--c" />

      <div className="t6-container">
        {/* ── Topbar ── */}
        <header className="t6-topbar">
          <div className="t6-topbar-brand">
            <span className="t6-topbar-logo">
              <i className="fa-solid fa-bolt" />
            </span>
            {brandLabel}
          </div>

          <nav className="t6-tab-pills">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`t6-tab-pill ${activeTab === t ? "active" : ""}`}
              >
                <i className={getTabIcon(t)} />
                {t}
              </button>
            ))}
          </nav>

          <div className="t6-topbar-actions">
            {onBack && (
              <button className="t6-back-btn" onClick={onBack}>
                <i className="fa-solid fa-arrow-left" /> Back to dashboards
              </button>
            )}
            {onChangeTemplate && (
              <div className="t6-mode-row">
                <button
                  className={`t6-mode-btn ${templateMode === "classic" ? "active" : ""}`}
                  onClick={() => onChangeTemplate("classic")}
                >
                  Standard
                </button>
                <button
                  className={`t6-mode-btn ${templateMode === "editorial" ? "active" : ""}`}
                  onClick={() => onChangeTemplate("editorial")}
                >
                  Compact
                </button>
                <button
                  className={`t6-mode-btn ${templateMode === "merger" ? "active" : ""}`}
                  onClick={() => onChangeTemplate("merger")}
                >
                  Executive
                </button>
                <button
                  className={`t6-mode-btn ${templateMode === "impact" ? "active" : ""}`}
                  onClick={() => onChangeTemplate("impact")}
                >
                  Detailed
                </button>
                <button
                  className={`t6-mode-btn ${templateMode === "glass" ? "active" : ""}`}
                  onClick={() => onChangeTemplate("glass")}
                >
                  Glass
                </button>
                <button
                  className={`t6-mode-btn ${templateMode === "bento" ? "active" : ""}`}
                  onClick={() => onChangeTemplate("bento")}
                >
                  Bento
                </button>
              </div>
            )}
            <button className="t6-export-btn" onClick={() => window.print()}>
              Export report
              <i className="fa-solid fa-arrow-up-right-from-square" />
            </button>
          </div>
        </header>

        {/* <div className="t6-hero">
          <div className="t6-eyebrow">{hero.kicker || `${brandLabel} · ${activeTab}`}</div>
          <p className="t6-subtitle">{hero.sub}</p>
        </div> */}

        {/* ── Overview bento grid ── */}
        {/* {isOverview && ( */}
        <div className="t6-bento">
          <div className="t6-glass-card t6-bento-headline">
            {activeVideoSrc && (
              <video
                className="t6-bento-headline-video"
                src={activeVideoSrc}
                autoPlay
                muted
                loop
                playsInline
              />
            )}
            <div
              style={{
                position: "relative",
                zIndex: 1,
                display: "flex",
                flexDirection: "column",
                height: "100%",
                justifyContent: "space-between",
              }}
            >
              <div>
                <h2 className="t6-headline-title">{headlineTitle}</h2>
                {headlineDesc && (
                  <p className="t6-headline-desc">{headlineDesc}</p>
                )}
              </div>

              {kpis.length > 0 && (
                <div className="t6-headline-stats">
                  {kpis.slice(0, 3).map((k, i) => (
                    <div key={i}>
                      <div
                        className={`t6-headline-stat-val${i === kpis.length - 1 || i === 2 ? " t6-headline-stat-val--accent" : ""}`}
                      >
                        {k.value}
                      </div>
                      <div className="t6-headline-stat-label">{k.label}</div>
                    </div>
                  ))}
                </div>
              )}

              <div className="t6-headline-actions">
                {nextTabName && (
                  <button
                    className="t6-btn-primary"
                    onClick={() => setTab(nextTabName)}
                  >
                    Explore {nextTabName}
                  </button>
                )}
                {lastTabName && lastTabName !== nextTabName && (
                  <button
                    className="t6-btn-secondary"
                    onClick={() => setTab(lastTabName)}
                  >
                    {lastTabName}
                  </button>
                )}
              </div>
            </div>
          </div>

          {(spotlightWatch || spotlightFinding) && (
            <div className="t6-grad-card t6-grad-card--b">
              <span className="t6-spotlight-kicker">Watch item</span>
              <h3 className="t6-spotlight-title">
                {spotlightWatch
                  ? "Signal to watch"
                  : spotlightFinding?.tag || "Key finding"}
              </h3>
              <p className="t6-spotlight-desc">
                {truncate(spotlightWatch || spotlightFinding?.body, 150)}
              </p>
            </div>
          )}

          {primaryKpi && (
            <div className="t6-grad-card t6-grad-card--a t6-bento-kpi">
              <span className="t6-kpi-label">{primaryKpi.label}</span>
              <div className="t6-kpi-value">{primaryKpi.value}</div>
            </div>
          )}
        </div>
        {/* )} */}

        {isOverview && restKpis.length > 0 && (
          <div className="t6-kpi-strip">
            {restKpis.map((k, i) => (
              <div key={i} className="t6-glass-card t6-bento-neutral">
                <div className="t6-neutral-label">{k.label}</div>
                <div className="t6-neutral-value">{k.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── Storyboard "watch for" cards for non-overview tabs ── */}
        {!isOverview && <T6StoryboardCards chapter={currentChapter} />}

        {/* ── Chart cards ── */}
        <div
          className={`t6-tabbody${cards.length <= 1 ? " t6-tabbody--single" : ""}`}
          style={{
            marginTop:
              !isOverview && currentChapter?.what_to_watch_for?.length ? 14 : 0,
          }}
        >
          {isOverview && overall && (
            <T6Card
              className="t6-summary-card"
              title="Executive Summary"
              children={<Rich text={overall} />}
            />
          )}
          <>
            {cards.map((c, i) => (
              <T6Card
                key={i}
                title={c.title}
                sub={c.sub}
                chart={c.chart}
                analysis={c.analysis}
                onOpenAnalysis={c.onOpenAnalysis}
                insight={c.insight}
                dateInsights={c.dateInsights}
                wide={c.wide}
              >
                {c.children}
              </T6Card>
            ))}

            {/* ── Custom Dynamic Tabs Created by Chatbot ── */}
            {customTabsData?.[activeTab] && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: 16,
                  marginTop: 24,
                }}
              >
                {customTabsData[activeTab].map((c, i) => (
                  <T6Card
                    key={c.chart_id || i}
                    title={c.title}
                    sub={c.description}
                    chart={c}
                  />
                ))}
              </div>
            )}
          </>
          {cards.length === 0 && !(isOverview && overall) && <Empty />}
        </div>

        <TabDynamicCharts
          activeTab={activeTab}
          chartsData={chartsData}
          ChartCardComp={({ title, subtitle, children, wide }) => (
            <T6Card title={title} sub={subtitle} wide={wide}>
              {children}
            </T6Card>
          )}
          DynamicRendererComp={DynamicChartRenderer}
        />

        <T6Banner
          chapters={chapters}
          tabs={tabs}
          activeIdx={activeIdx}
          setTab={setTab}
        />
      </div>
    </div>
  );
}
