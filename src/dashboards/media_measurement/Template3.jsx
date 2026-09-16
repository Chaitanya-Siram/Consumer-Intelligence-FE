import { useMemo, useState } from "react";
import { Rich } from "../../utils/text.jsx";
import {
  DynamicChartRenderer,
  Empty,
  ChartCard,
} from "../../components/CustomChartWidgets.jsx";
import { useDynamicCharts } from "../../utils/dynamicChartManager.js";
import "./Template3.css";
import logoImg from "../../assets/images/image.png";

// ── EDITORIAL CHAPTER OPENER (Chapter banner design) ──
function EditorialChapterOpener({
  chapters,
  currentTab,
  onSwitchTab,
  activeVideoSrc,
}) {
  const currentIndex = chapters.findIndex(
    (c) => c.tab_name?.toLowerCase() === currentTab?.toLowerCase(),
  );
  if (currentIndex === -1) return null;
  const currentChapter = chapters[currentIndex];

  const stepStr = `Chapter ${String(currentIndex + 1).padStart(2, "0")} · of ${String(chapters.length).padStart(2, "0")}`;

  return (
    <div className={`chapter-banner cb-ch0${currentIndex + 1}`}>
      {activeVideoSrc && (
        <video
          key={activeVideoSrc}
          autoPlay
          loop
          muted
          playsInline
          src={activeVideoSrc}
          className="cb-bg-video"
          style={{
            mixBlendMode: "multiply",
            filter: "grayscale(1) contrast(1.15)",
          }}
        />
      )}
      <div className="cb-eyebrow-row">
        <span className="cb-step-pill">{stepStr}</span>
        <span className="cb-eyebrow">
          {currentChapter.section_label || "Overview"}
        </span>
      </div>
      <div className="cb-deck">
        {currentChapter.deck || "What happened · April 27, 2026"}
      </div>
      <h1 className="cb-title">{currentChapter.title}</h1>
      <div className="cb-lead">
        <Rich text={currentChapter.description || ""} />
      </div>
      {currentIndex < chapters.length - 1 && (
        <div
          className="cb-bridge"
          onClick={() => onSwitchTab(chapters[currentIndex + 1].tab_name)}
          style={{ cursor: "pointer" }}
        >
          <span className="cb-bridge-icon">→</span>
          <div className="cb-bridge-text">
            <strong>Where this leads:</strong>{" "}
            {currentChapter.bridge_text ||
              "See how the narrative framed this event in the next chapter."}
          </div>
        </div>
      )}
    </div>
  );
}

// ── EDITORIAL STORY BRIDGE ──
function EditorialStoryBridge({ chapters, currentTab, onSwitchTab }) {
  const currentIndex = chapters.findIndex(
    (c) => c.tab_name?.toLowerCase() === currentTab?.toLowerCase(),
  );
  const nextChapter =
    currentIndex !== -1 && currentIndex < chapters.length - 1
      ? chapters[currentIndex + 1]
      : null;

  if (!nextChapter) {
    return (
      <div className="story-close">
        <div className="story-close-content">
          <div className="story-close-eyebrow">Storyboard Complete</div>
          <div className="story-close-title">
            You have reviewed all narrative chapters
          </div>
          <div className="story-close-body">
            All strategic measurement layers have been analyzed. You can restart
            the storyboard sequence or proceed to explore the detailed flat
            dashboard tables.
          </div>
        </div>
        <div className="story-close-actions">
          <button
            className="story-close-btn primary"
            onClick={() => onSwitchTab(chapters[0]?.tab_name)}
          >
            Restart Storyboard
          </button>
        </div>
      </div>
    );
  }

  const stepNum = String(currentIndex + 2).padStart(2, "0");

  return (
    <div
      className="next-chapter"
      onClick={() => onSwitchTab(nextChapter.tab_name)}
    >
      <div className="nc-left">
        <span className="nc-tag">Continue · Chapter {stepNum}</span>
        <span className="nc-title">{nextChapter.tab_name}</span>
      </div>
      <div className="nc-arrow">
        <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
          <path
            d="M1 7h12M8 2l5 5-5 5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}

const SENT = {
  POS: { label: "Positive", color: "#4D97B4" }, // now teal/positive in theme
  NEG: { label: "Negative", color: "#A0394C" }, // now wine-neg in theme
  NEU: { label: "Neutral", color: "#946470" }, // now mauve/neutral in theme
};

function nf(n) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return new Intl.NumberFormat("en-US").format(n);
}

function compact(n) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}

function fmtDate(d) {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return String(d);
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── CUSTOM EDITORIAL KPI CARD (kpi-card design) ──
function EditorialKpiCard({ val, label, sub, colorClass }) {
  return (
    <div className={`kpi-card kc-${colorClass || "purple"}`}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{val}</div>
      <div className="kpi-sub">{sub || "articles"}</div>
    </div>
  );
}

// ── KEY ARTICLES WIDGET ──
function EditorialTopArticles({ data }) {
  const cols = ["POS", "NEU", "NEG"];
  const has = cols.some((k) => (data?.[k] || []).length);
  if (!has) return <Empty />;
  return (
    <div className="storiesgrid">
      {cols.map((k) => (
        <div className="storiescol" key={k}>
          <h4
            className="storiescol__head"
            style={{
              color: SENT[k].color,
              borderBottom: `2px solid ${SENT[k].color}`,
              paddingBottom: 6,
            }}
          >
            {SENT[k].label}
          </h4>
          {(data?.[k] || []).map((a, i) => (
            <article
              className="storycard"
              key={a.id ?? i}
              style={{
                background: "#ffffff",
                border: "1px solid #ECE0E4",
                borderRadius: "12px",
                padding: "16px",
                marginBottom: "12px",
                boxShadow: "0 2px 8px rgba(148,69,100,0.03)",
              }}
            >
              <p
                className="storycard__title"
                style={{ fontWeight: 600, color: "#1C2B3A", marginBottom: 6 }}
              >
                {a.title}
              </p>
              <p
                className="storycard__meta"
                style={{ fontSize: "11px", color: "#7A8FA6", marginBottom: 8 }}
              >
                {a.domain || "Unknown"} · {fmtDate(a.date)}
                {a.theme ? ` · ${a.theme}` : ""}
              </p>
              <p
                className="storycard__snippet"
                style={{ fontSize: "12px", color: "#3D5166", lineHeight: 1.5 }}
              >
                {a.content}
              </p>
            </article>
          ))}
          {(data?.[k] || []).length === 0 && (
            <p
              className="muted"
              style={{ padding: "12px 0", color: "#7A8FA6" }}
            >
              No articles.
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

// ── MAIN EDITORIAL VIEW ──
export default function Template3({
  templateMode,
  onChangeTemplate,
  onBack,
  project,
  session,
  chartsData,
  tab,
  setTab,
  openAnalysis,
  chapterFor,
  chapters,
  DASHBOARD_KEY,
  DYNAMIC_TAB,
  dynamicCharts,
  byId,
  insights,
  overall,
  ins,
  dateIns,
  analysisOf,
  sentiment,
  coverage,
  theme,
  syndication,
  totalCount,
  totalReach,
  formattedThemeChart,
  formattedSyndicationChart,
  formattedReachSentimentChart,
  formattedSentimentOverTimeChart,
  activeVideoSrc,
  hero,
}) {
  const { customTabsData } = useDynamicCharts(tab);

  const renderCardFooter = (id, title) => {
    const insightText = ins?.(id);
    const analysisText = analysisOf?.(id);
    if (!insightText && !analysisText) return null;

    return (
      <div
        className="chartcard__insight"
        style={{
          marginTop: 12,
          borderTop: "1px solid #F5EDF0",
          paddingTop: 10,
        }}
      >
        {insightText ? (
          <Rich
            text={insightText}
            style={{ color: "oklch(0.53 0.015 265)", lineHeight: 1.4 }}
            suffix={
              (openAnalysis || analysisText) ? (
                <button
                  type="button"
                  onClick={() => openAnalysis?.(id, title)}
                  className="inline-flex items-center ml-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline cursor-pointer transition-colors"
                  style={{ color: "var(--accent-a, #6366f1)" }}
                >
                  Read More
                </button>
              ) : null
            }
          />
        ) : (openAnalysis || analysisText) ? (
          <Rich
            text={
              typeof analysisText === "string" && analysisText.trim()
                ? (analysisText.trim().length > 160
                    ? analysisText.trim().slice(0, 160) + "…"
                    : analysisText.trim())
                : ""
            }
            style={{ color: "oklch(0.53 0.015 265)", lineHeight: 1.4 }}
            inline={true}
            suffix={
              <button
                type="button"
                onClick={() => openAnalysis?.(id, title)}
                className="inline-flex items-center ml-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline cursor-pointer transition-colors"
                style={{ color: "var(--accent-a, #6366f1)" }}
              >
                Read More
              </button>
            }
          />
        ) : null}
      </div>
    );
  };

  return (
    <div className="media-measurement-merger" data-dashboard-template="merger">
      {/* ── Lava-lamp Background Blobs ── */}
      <div className="bg-lava" aria-hidden="true">
        <div className="lava-blob b1" />
        <div className="lava-blob b2" />
        <div className="lava-blob b3" />
        <div className="lava-blob b4" />
        <div className="lava-blob b5" />
      </div>

      <div className="layout">
        {/* Left Sidebar */}
        <aside className="sidebar">
          <div
            className="sidebar-brand"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
            }}
          >
            <div
              className="sb-logo-row"
              style={{ display: "flex", alignItems: "center", gap: 10 }}
            >
              <img
                src={logoImg}
                alt="InfoVision Logo"
                style={{ width: 28, height: 28, objectFit: "contain" }}
              />
              <div>
                <div className="sb-brand-tag">AlphaMetricx</div>
                {/* <div
                  className="sb-brand-sub"
                  style={{ fontWeight: 700, color: "var(--wine-primary)" }}
                >
                  Intelligence
                </div> */}
              </div>
            </div>
            {onBack && (
              <button
                className="sb-back-btn"
                onClick={onBack}
                title="Back to dashboards"
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "8px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--wine-text-mid)",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--wine-border-light)";
                  e.currentTarget.style.color = "var(--wine-primary)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--wine-text-mid)";
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
              </button>
            )}
          </div>
          <div
            style={{
              padding: "0 22px 10px",
              fontSize: "11px",
              color: "var(--wine-text-light)",
              fontWeight: 500,
            }}
          >
            Project: {project?.name || "Merger Intel"}
          </div>

          <div className="sb-section-label">Story Arc</div>

          <nav className="nav-list">
            {chapters.map((ch, idx) => {
              const isActive = tab.toLowerCase() === ch.tab_name?.toLowerCase();
              return (
                <div
                  key={ch.tab_name}
                  className={`nav-item ${isActive ? "active" : ""}`}
                  onClick={() => setTab(ch.tab_name)}
                >
                  <span className="nav-num">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <div className="nav-text">
                    <span className="nav-tag">
                      Chapter {String(idx + 1).padStart(2, "0")}
                    </span>
                    <span className="nav-title">{ch.tab_name}</span>
                  </div>
                </div>
              );
            })}

            <div className="sb-thread">
              <div className="sb-thread-label">The Through-Line</div>
              <div className="sb-thread-text">
                Pitched. Rejected. Wired out. Angrily covered. Equally absorbed.
                <br />
                Only{" "}
                <strong
                  style={{ color: "var(--wine-primary)", fontWeight: 700 }}
                >
                  one
                </strong>{" "}
                variable moved outcomes — speaking up.
              </div>
            </div>
          </nav>

          <div className="sb-section-label">Layout Mode</div>
          <div className="sb-layouts-switcher">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button
                className={`sb-layout-btn ${templateMode === "classic" ? "active" : ""}`}
                onClick={() => onChangeTemplate("classic")}
              >
                Standard
              </button>
              <button
                className={`sb-layout-btn ${templateMode === "editorial" ? "active" : ""}`}
                onClick={() => onChangeTemplate("editorial")}
              >
                Compact
              </button>
              <button
                className={`sb-layout-btn ${templateMode === "merger" ? "active" : ""}`}
                onClick={() => onChangeTemplate("merger")}
              >
                Executive
              </button>
              <button
                className={`sb-layout-btn ${templateMode === "impact" ? "active" : ""}`}
                onClick={() => onChangeTemplate("impact")}
              >
                Detailed
              </button>
            </div>
          </div>

          <div className="sb-footer">
            <strong>UAL × AAL</strong>
            <br />
            Media Intelligence Analysis
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="main">
          {/* Top Progress Rail */}
          <div className="progress-rail">
            {chapters.map((ch, idx) => {
              const isActive = tab.toLowerCase() === ch.tab_name?.toLowerCase();
              return (
                <div
                  key={ch.tab_name}
                  className={`pr-step ${isActive ? "active" : ""}`}
                  onClick={() => setTab(ch.tab_name)}
                >
                  <div className="pr-num">
                    <span>{String(idx + 1).padStart(2, "0")}</span>
                  </div>
                  <div className="pr-labels">
                    <span className="pr-tag">
                      Chapter {String(idx + 1).padStart(2, "0")}
                    </span>
                    <span className="pr-name">{ch.tab_name}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="content-area">
            {/* ── Page Hero Card with Video ── */}
            {/* <div className="page-hero">
              {activeVideoSrc && (
                <video
                  key={activeVideoSrc}
                  autoPlay
                  loop
                  muted
                  playsInline
                  src={activeVideoSrc}
                  className="page-hero-img"
                  style={{
                    opacity: 0.18,
                    mixBlendMode: "multiply",
                    filter: "grayscale(1) contrast(1.15)",
                  }}
                />
              )}
              <div className="page-hero-overlay">
                <div className="page-hero-text">
                  <span className="page-hero-eyebrow">{hero.kicker}</span>
                  <h1 className="page-hero-title">
                    {hero.lead} <span>{hero.em}</span>
                  </h1>
                  <p className="page-hero-subtitle">{hero.sub}</p>
                </div>
              </div>
            </div> */}

            {tab === "Overview" && (
              <div
                style={{
                  marginBottom: "22px",
                }}
              >
                <EditorialChapterOpener
                  chapters={chapters}
                  currentTab={tab}
                  onSwitchTab={setTab}
                  activeVideoSrc={activeVideoSrc}
                />
              </div>
            )}

            {/* ── Overview Tab ── */}
            {tab === "Overview" && (
              <div className="dashstack">
                {overall && (
                  <div className="hero">
                    <div className="hero-title">Overall Summary</div>
                    <div className="hero-desc">
                      <Rich text={overall} />
                    </div>
                  </div>
                )}

                {/* Custom Editorial KPI Strip (kpi-strip design) */}
                <div className="kpi-strip">
                  <EditorialKpiCard
                    val={nf(totalCount)}
                    label="Negative Coverage"
                    sub={`${Math.round(sentiment?.data?.negative_percentage ?? 81.4)}% of total`}
                    colorClass="neg"
                  />
                  <EditorialKpiCard
                    val={compact(totalReach)}
                    label="Positive Coverage"
                    sub={`${Math.round(sentiment?.data?.positive_percentage ?? 16.9)}% of total`}
                    colorClass="pos"
                  />
                  <EditorialKpiCard
                    val={`~${sentiment?.data?.net_sentiment_score ?? 39.3}`}
                    label="Avg. Sentiment Score"
                    sub="Scale 0–100 · low = negative"
                    colorClass="gold"
                  />
                </div>

                {coverage && (
                  <ChartCard
                    title={coverage.title}
                    subtitle={coverage.description}
                    insight={ins("datewise_coverage")}
                    analysis={analysisOf("datewise_coverage")}
                    onOpenAnalysis={() =>
                      openAnalysis("datewise_coverage", coverage.title)
                    }
                    wide
                  >
                    <DynamicChartRenderer
                      chart={coverage}
                      dateInsights={dateIns("datewise_coverage")}
                    />
                  </ChartCard>
                )}

                <div className="chartgrid">
                  {sentiment && (
                    <ChartCard
                      title={sentiment.title}
                      subtitle={sentiment.description}
                      insight={ins("sentiment_distribution")}
                      analysis={analysisOf("sentiment_distribution")}
                      onOpenAnalysis={() =>
                        openAnalysis("sentiment_distribution", sentiment.title)
                      }
                    >
                      <DynamicChartRenderer chart={sentiment} />
                    </ChartCard>
                  )}

                  {theme && (
                    <div className="chartcard">
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: 12,
                        }}
                      >
                        <div>
                          <h3 className="chartcard__title">
                            Theme Distribution
                          </h3>
                          <p className="chartcard__sub">
                            Drilldown of conversation themes
                          </p>
                        </div>
                      </div>
                      <div className="chartcard__body">
                        <DynamicChartRenderer chart={formattedThemeChart} />
                      </div>
                      {renderCardFooter("theme_distribution", "Theme Distribution")}
                    </div>
                  )}
                </div>

                {syndication && (
                  <div className="chartcard chartcard--wide">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 12,
                      }}
                    >
                      <div>
                        <h3 className="chartcard__title">
                          {syndication.title}
                        </h3>
                        {syndication.description && (
                          <p className="chartcard__sub">
                            {syndication.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="chartcard__body">
                      <DynamicChartRenderer chart={formattedSyndicationChart} />
                    </div>
                    {renderCardFooter("original_vs_syndicated", syndication.title)}
                  </div>
                )}
                {/* ── Custom Dynamic Tabs Created by Chatbot ── */}
                {customTabsData[tab] && (
                  <div className="dashstack">
                    <div className="chartgrid">
                      {customTabsData[tab].map((c, i) => (
                        <ChartCard
                          key={c.chart_id || i}
                          title={c.title}
                          subtitle={c.description}
                          wide
                        >
                          <DynamicChartRenderer chart={c} />
                        </ChartCard>
                      ))}
                    </div>
                  </div>
                )}
                <EditorialStoryBridge
                  chapters={chapters}
                  currentTab={tab}
                  onSwitchTab={setTab}
                />
              </div>
            )}

            {/* ── Sentiment Analysis Tab ── */}
            {tab === "Sentiment Analysis" && (
              <div className="dashstack">
                <EditorialChapterOpener
                  chapters={chapters}
                  currentTab={tab}
                  onSwitchTab={setTab}
                  activeVideoSrc={activeVideoSrc}
                />
                {sentiment && (
                  <>
                    <div className="chartgrid">
                      <div className="chartcard">
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            marginBottom: 12,
                          }}
                        >
                          <div>
                            <h3 className="chartcard__title">
                              {sentiment.title}
                            </h3>
                            {sentiment.description && (
                              <p className="chartcard__sub">
                                {sentiment.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="chartcard__body">
                          <DynamicChartRenderer chart={sentiment} />
                        </div>
                        {renderCardFooter("sentiment_distribution", sentiment.title)}
                      </div>
                    </div>

                    <div className="chartcard chartcard--wide">
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: 12,
                        }}
                      >
                        <div>
                          <h3 className="chartcard__title">
                            Sentiment Over Time
                          </h3>
                          <p className="chartcard__sub">
                            Daily positive / neutral / negative coverage split.
                          </p>
                        </div>
                      </div>
                      <div className="chartcard__body">
                        <DynamicChartRenderer
                          chart={formattedSentimentOverTimeChart}
                          dateInsights={dateIns("sentiment_distribution")}
                        />
                      </div>
                      {renderCardFooter("sentiment_distribution", "Sentiment Over Time")}
                    </div>
                  </>
                )}
                {/* ── Custom Dynamic Tabs Created by Chatbot ── */}
                {customTabsData[tab] && (
                  <div className="dashstack">
                    <div className="chartgrid">
                      {customTabsData[tab].map((c, i) => (
                        <ChartCard
                          key={c.chart_id || i}
                          title={c.title}
                          subtitle={c.description}
                          wide
                        >
                          <DynamicChartRenderer chart={c} />
                        </ChartCard>
                      ))}
                    </div>
                  </div>
                )}
                <EditorialStoryBridge
                  chapters={chapters}
                  currentTab={tab}
                  onSwitchTab={setTab}
                />
              </div>
            )}

            {/* ── Themes & Topics Tab ── */}
            {tab === "Themes & Topics" && (
              <div className="dashstack">
                <EditorialChapterOpener
                  chapters={chapters}
                  currentTab={tab}
                  onSwitchTab={setTab}
                  activeVideoSrc={activeVideoSrc}
                />
                {theme && (
                  <div className="chartcard chartcard--wide">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 12,
                      }}
                    >
                      <div>
                        <h3 className="chartcard__title">{theme.title}</h3>
                        {theme.description && (
                          <p className="chartcard__sub">{theme.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="chartcard__body">
                      <DynamicChartRenderer chart={formattedThemeChart} />
                    </div>
                    {renderCardFooter("theme_distribution", theme.title)}
                  </div>
                )}
                {/* ── Custom Dynamic Tabs Created by Chatbot ── */}
                {customTabsData[tab] && (
                  <div className="dashstack">
                    <div className="chartgrid">
                      {customTabsData[tab].map((c, i) => (
                        <ChartCard
                          key={c.chart_id || i}
                          title={c.title}
                          subtitle={c.description}
                          wide
                        >
                          <DynamicChartRenderer chart={c} />
                        </ChartCard>
                      ))}
                    </div>
                  </div>
                )}
                <EditorialStoryBridge
                  chapters={chapters}
                  currentTab={tab}
                  onSwitchTab={setTab}
                />
              </div>
            )}

            {/* ── Media Coverage Tab ── */}
            {tab === "Media Coverage" && (
              <div className="dashstack">
                <EditorialChapterOpener
                  chapters={chapters}
                  currentTab={tab}
                  onSwitchTab={setTab}
                  activeVideoSrc={activeVideoSrc}
                />
                  {byId.top_publications && (
                    <div className="chartcard chartcard--wide">
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: 12,
                        }}
                      >
                        <div>
                          <h3 className="chartcard__title">Top Publications</h3>
                          <p className="chartcard__sub">
                            Distribution of original coverage
                          </p>
                        </div>
                      </div>
                      <div className="chartcard__body">
                        <DynamicChartRenderer chart={byId.top_publications} />
                      </div>
                      {renderCardFooter("top_publications", byId.top_publications.title)}
                    </div>
                  )}

                  {byId.publication_reach_sentiment && (
                    <div className="chartcard chartcard--wide">
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: 12,
                        }}
                      >
                        <div>
                          <h3 className="chartcard__title">
                            {byId.publication_reach_sentiment.title}
                          </h3>
                          {byId.publication_reach_sentiment.description && (
                            <p className="chartcard__sub">
                              {byId.publication_reach_sentiment.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="chartcard__body">
                        <DynamicChartRenderer
                          chart={formattedReachSentimentChart}
                        />
                      </div>
                      {renderCardFooter("publication_reach_sentiment", byId.publication_reach_sentiment.title)}
                    </div>
                  )}

                {byId.publish_time_heatmap && (
                  <div className="chartcard chartcard--wide">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 12,
                      }}
                    >
                      <div>
                        <h3 className="chartcard__title">
                          {byId.publish_time_heatmap.title}
                        </h3>
                        {byId.publish_time_heatmap.description && (
                          <p className="chartcard__sub">
                            {byId.publish_time_heatmap.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="chartcard__body">
                      <DynamicChartRenderer chart={byId.publish_time_heatmap} />
                    </div>
                    {renderCardFooter("publish_time_heatmap", byId.publish_time_heatmap.title)}
                  </div>
                )}

                {byId.top_authors_by_publications && (
                  <div className="chartcard chartcard--wide">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 12,
                      }}
                    >
                      <div>
                        <h3 className="chartcard__title">Top Authors</h3>
                        <p className="chartcard__sub">
                          Bylines with highest publication count
                        </p>
                      </div>
                    </div>
                    <div className="chartcard__body">
                      <DynamicChartRenderer
                        chart={byId.top_authors_by_publications}
                      />
                    </div>
                    {renderCardFooter("top_authors_by_publications", "Top Authors")}
                  </div>
                )}
                {/* ── Custom Dynamic Tabs Created by Chatbot ── */}
                {customTabsData[tab] && (
                  <div className="dashstack">
                    <div className="chartgrid">
                      {customTabsData[tab].map((c, i) => (
                        <ChartCard
                          key={c.chart_id || i}
                          title={c.title}
                          subtitle={c.description}
                          wide
                        >
                          <DynamicChartRenderer chart={c} />
                        </ChartCard>
                      ))}
                    </div>
                  </div>
                )}
                <EditorialStoryBridge
                  chapters={chapters}
                  currentTab={tab}
                  onSwitchTab={setTab}
                />
              </div>
            )}

            {/* ── Key Stories Tab ── */}
            {tab === "Key Stories" && (
              <div className="dashstack">
                <EditorialChapterOpener
                  chapters={chapters}
                  currentTab={tab}
                  onSwitchTab={setTab}
                  activeVideoSrc={activeVideoSrc}
                />
                {byId.top_articles_by_sentiment && (
                  <div className="chartcard chartcard--wide">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 12,
                      }}
                    >
                      <div>
                        <h3 className="chartcard__title">
                          {byId.top_articles_by_sentiment.title}
                        </h3>
                        {byId.top_articles_by_sentiment.description && (
                          <p className="chartcard__sub">
                            {byId.top_articles_by_sentiment.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="chartcard__body">
                      <EditorialTopArticles
                        data={byId.top_articles_by_sentiment.data}
                      />
                    </div>
                    {renderCardFooter("top_articles_by_sentiment", byId.top_articles_by_sentiment.title)}
                  </div>
                )}
                {/* ── Custom Dynamic Tabs Created by Chatbot ── */}
                {customTabsData[tab] && (
                  <div className="dashstack">
                    <div className="chartgrid">
                      {customTabsData[tab].map((c, i) => (
                        <ChartCard
                          key={c.chart_id || i}
                          title={c.title}
                          subtitle={c.description}
                          wide
                        >
                          <DynamicChartRenderer chart={c} />
                        </ChartCard>
                      ))}
                    </div>
                  </div>
                )}
                <EditorialStoryBridge
                  chapters={chapters}
                  currentTab={tab}
                  onSwitchTab={setTab}
                />
              </div>
            )}

            {/* ── Dynamic Tab ── */}
            {tab === DYNAMIC_TAB && (
              <div className="dashstack">
                <div className="hero">
                  <div className="hero-eyebrow">Dynamic Charts</div>
                  <h2 className="hero-title">
                    Charts generated on demand by the data agent
                  </h2>
                  <p className="hero-desc">
                    Ask for more from the chat in the bottom-right and they will
                    appear here, rendered in the editorial style of this
                    storyboard.
                  </p>
                </div>
                {dynamicCharts.map((chart, i) => (
                  <div className="chartcard chartcard--wide" key={i}>
                    <h3 className="chartcard__title">{chart.title}</h3>
                    {chart.description && (
                      <p className="chartcard__sub">{chart.description}</p>
                    )}
                    <div className="chartcard__body">
                      <DynamicChartRenderer chart={chart} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
