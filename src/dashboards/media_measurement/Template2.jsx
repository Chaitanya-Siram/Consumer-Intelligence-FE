import { useMemo, useState } from "react";
import { Rich } from "../../utils/text.jsx";
import {
  DynamicChartRenderer,
  Empty,
  ChartCard,
} from "../../components/CustomChartWidgets.jsx";
import { useDynamicCharts } from "../../utils/dynamicChartManager.js";
import ShadcnAnimatedLineChart from "../../components/ShadcnAnimatedLineChart.jsx";
import ShadcnAnimatedBarChart from "../../components/ShadcnAnimatedBarChart.jsx";
import ShadcnAnimatedPieChart from "../../components/ShadcnAnimatedPieChart.jsx";
import ShadcnAnimatedAreaChart from "../../components/ShadcnAnimatedAreaChart.jsx";
import ShadcnAnimatedScatterChart from "../../components/ShadcnAnimatedScatterChart.jsx";
import ShadcnAnimatedHeatmapChart from "../../components/ShadcnAnimatedHeatmapChart.jsx";
import "./Template2.css";
import logoImg from "../../assets/images/image.png";
import UserAvatar from "../../components/UserAvatar.jsx";

// ── EDITORIAL CHAPTER OPENER ──
function EditorialChapterOpener({ chapters, currentTab, onSwitchTab }) {
  const currentIndex = chapters.findIndex(
    (c) => c.tab_name?.toLowerCase() === currentTab?.toLowerCase(),
  );
  const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const currentChapter = currentIndex !== -1 ? chapters[currentIndex] : null;
  const nextChapter =
    currentIndex !== -1 && currentIndex < chapters.length - 1
      ? chapters[currentIndex + 1]
      : null;

  return (
    <div className="chapter-opener">
      <div className="chapter-col">
        <div className="chapter-eyebrow">
          <span className="ico">◀</span> Previously ·{" "}
          {prevChapter ? prevChapter.section_label || "Brief" : "Start"}
        </div>
        {prevChapter ? (
          <>
            <div className="chapter-title">
              {prevChapter.title || prevChapter.tab_name}
            </div>
            <div className="chapter-text">{prevChapter.description}</div>
            <button
              className="chapter-jump"
              onClick={() => onSwitchTab(prevChapter.tab_name)}
            >
              Go back
            </button>
          </>
        ) : (
          <div
            className="chapter-text"
            style={{ fontStyle: "italic", color: "#7A8FA6", marginTop: 8 }}
          >
            First chapter in the sequence.
          </div>
        )}
      </div>

      <div className="chapter-col col-now">
        <div className="chapter-eyebrow now">
          <span className="ico">●</span> This Chapter ·{" "}
          {currentChapter?.section_label || currentChapter?.tab_name}
        </div>
        <div className="chapter-title now">
          {currentChapter?.title || currentChapter?.tab_name}
        </div>
        <div className="chapter-text">
          <Rich text={currentChapter?.description || ""} />
        </div>
      </div>

      <div className="chapter-col">
        <div className="chapter-eyebrow">
          Coming Next ·{" "}
          {nextChapter ? nextChapter.section_label || "Trends" : "End"}{" "}
          <span className="ico">▶</span>
        </div>
        {nextChapter ? (
          <>
            <div className="chapter-title">
              {nextChapter.title || nextChapter.tab_name}
            </div>
            <div className="chapter-text">{nextChapter.description}</div>
            <button
              className="chapter-jump"
              onClick={() => onSwitchTab(nextChapter.tab_name)}
            >
              Skip ahead →
            </button>
          </>
        ) : (
          <div
            className="chapter-text"
            style={{ fontStyle: "italic", color: "#7A8FA6", marginTop: 8 }}
          >
            Final chapter in the sequence.
          </div>
        )}
      </div>
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
    <div className="story-bridge">
      <div className="bridge-num">{stepNum}</div>
      <div className="bridge-content">
        <div className="bridge-eyebrow">The next chapter</div>
        <div className="bridge-question">
          "These metrics show what is happening — but to act on them, we need to
          know why."
        </div>
        <div className="bridge-tagline">
          Continue to <strong>{nextChapter.tab_name}</strong> —{" "}
          {nextChapter.description}
        </div>
      </div>
      <button
        className="bridge-cta"
        onClick={() => onSwitchTab(nextChapter.tab_name)}
      >
        Continue to {nextChapter.tab_name} <span className="arr">→</span>
      </button>
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

// ── CUSTOM EDITORIAL KPI CARD ──
function EditorialKpiCard({ val, label, className = "" }) {
  return (
    <div className={`es-kpi ${className}`}>
      <div className="es-kpi-val">{val}</div>
      <div className="es-kpi-label">{label}</div>
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
export default function Template2({
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
    <div data-dashboard-template="editorial">
      {/* ── Lava-lamp Background Blobs ── */}
      <div className="bg-lava" aria-hidden="true">
        <div className="lava-blob b1" />
        <div className="lava-blob b2" />
        <div className="lava-blob b3" />
        <div className="lava-blob b4" />
        <div className="lava-blob b5" />
      </div>

      {/* ── Unified Clubbed Header for Editorial Theme ── */}
      <header className="top-nav" style={{ width: "100%" }}>
        <div className="nav-brand">
          {onBack && (
            <button
              onClick={onBack}
              title="Back to dashboards"
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "6px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                marginRight: "8px",
              }}
            >
              <svg
                width="18"
                height="18"
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
          <img
            src={logoImg}
            alt="InfoVision Logo"
            style={{ width: 28, height: 28, objectFit: "contain" }}
          />
          <div className="nav-title">AlphaMetricx</div>
        </div>

        <div
          className="ed-header-actions"
          style={{ display: "flex", alignItems: "center", gap: "12px" }}
        >
          <div
            className="ed-layout-switchers"
            style={{
              display: "flex",
              background: "rgba(255, 255, 255, 0.1)",
              borderRadius: "20px",
              padding: "2px",
            }}
          >
            <button
              className={`template-mode-btn ${templateMode === "classic" ? "active" : ""}`}
              onClick={() => onChangeTemplate("classic")}
            >
              Standard
            </button>
            <button
              className={`template-mode-btn ${templateMode === "editorial" ? "active" : ""}`}
              onClick={() => onChangeTemplate("editorial")}
            >
              Compact
            </button>
            <button
              className={`template-mode-btn ${templateMode === "merger" ? "active" : ""}`}
              onClick={() => onChangeTemplate("merger")}
            >
              Executive
            </button>
            <button
              className={`template-mode-btn ${templateMode === "impact" ? "active" : ""}`}
              onClick={() => onChangeTemplate("impact")}
            >
              Detailed
            </button>
          </div>
          <button
            className="iconbtn"
            aria-label="Notifications"
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid rgba(255,255,255,0.2)",
              background: "rgba(255,255,255,0.1)",
              cursor: "pointer",
              color: "#fff",
            }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
          </button>
          <UserAvatar />
        </div>
      </header>

      <div className="story-strip" style={{ width: "100%" }}>
        <div className="story-strip-label">
          <span>Storyboard</span> Progress
        </div>
        <div className="story-strip-track">
          {chapters.map((ch, idx) => {
            const isActive = tab.toLowerCase() === ch.tab_name?.toLowerCase();
            return (
              <button
                key={ch.tab_name}
                onClick={() => setTab(ch.tab_name)}
                className={`story-step ${isActive ? "active" : ""}`}
              >
                <span className="story-step-num">{idx + 1}</span>
                <span className="story-step-label">{ch.tab_name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Page Hero Card with Video ── */}
      <div className="page-hero">
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
              opacity: 0.58,
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
      </div>

      <div className="page-body" style={{ position: "relative", zIndex: 2 }}>
        {/* ── Overview Tab ── */}
        {tab === "Overview" && (
          <div className="dashstack">
            {overall && (
              <section
                className="summary"
                style={{
                  background:
                    "linear-gradient(135deg, #FFF0F4 0%, #FFFDFD 100%)",
                  border: "1px solid #ECE0E4",
                  borderLeft: "4px solid #944564",
                  borderRadius: "12px",
                  padding: "20px 24px",
                  // marginBottom: "24px",
                }}
              >
                <p
                  className="summary__kicker"
                  style={{
                    color: "#944564",
                    fontWeight: 700,
                    fontSize: "11px",
                    letterSpacing: "0.1em",
                  }}
                >
                  OVERALL SUMMARY
                </p>
                <p
                  className="summary__body"
                  style={{
                    color: "#3D5166",
                    fontSize: "13.5px",
                    lineHeight: 1.6,
                    marginTop: 8,
                  }}
                >
                  <Rich text={overall} />
                </p>
              </section>
            )}

            <EditorialChapterOpener
              chapters={chapters}
              currentTab={tab}
              onSwitchTab={setTab}
            />

            {/* Custom Editorial KPI Strip */}
            <div className="es-kpi-grid">
              <EditorialKpiCard val={nf(totalCount)} label="Total Articles" />
              <EditorialKpiCard
                val={compact(totalReach)}
                label="Total Reach"
                className="teal"
              />
              <EditorialKpiCard
                val={`${sentiment?.data?.net_sentiment_score ?? "—"}%`}
                label="Net Sentiment"
                className="crimson"
              />
            </div>

            {coverage && (
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
                    <h3 className="chartcard__title">{coverage.title}</h3>
                    {coverage.description && (
                      <p className="chartcard__sub">{coverage.description}</p>
                    )}
                  </div>
                </div>
                <div className="chartcard__body">
                  <ShadcnAnimatedLineChart
                    chart={coverage}
                    dateInsights={dateIns("datewise_coverage")}
                  />
                </div>
                {renderCardFooter("datewise_coverage", coverage.title)}
              </div>
            )}

            <div className="chartgrid">
              {sentiment && (
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
                      <h3 className="chartcard__title">{sentiment.title}</h3>
                      {sentiment.description && (
                        <p className="chartcard__sub">
                          {sentiment.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="chartcard__body">
                    {Array.isArray(sentiment?.data) && (sentiment.data[0]?.date || sentiment.data[0]?.label?.includes("-") || sentiment.data[0]?.dateStr) ? (
                      <ShadcnAnimatedAreaChart
                        chart={sentiment}
                        dateInsights={dateIns("sentiment_distribution")}
                      />
                    ) : (
                      <ShadcnAnimatedPieChart chart={sentiment} />
                    )}
                  </div>
                  {renderCardFooter("sentiment_distribution", sentiment.title)}
                </div>
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
                      <h3 className="chartcard__title">Theme Distribution</h3>
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
                    <h3 className="chartcard__title">{syndication.title}</h3>
                    {syndication.description && (
                      <p className="chartcard__sub">
                        {syndication.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="chartcard__body">
                  <ShadcnAnimatedPieChart chart={formattedSyndicationChart} />
                </div>
                {renderCardFooter("original_vs_syndicated", syndication.title)}
              </div>
            )}

            {/* ── Custom Dynamic Tabs Created by Chatbot ── */}
            {customTabsData[tab] && (
              <div className="chartgrid">
                {customTabsData[tab].map((c, i) => (
                  <ChartCard key={c.chart_id || i} title={c.title} subtitle={c.description} wide>
                    <DynamicChartRenderer chart={c} />
                  </ChartCard>
                ))}
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
                        <h3 className="chartcard__title">{sentiment.title}</h3>
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
                      <h3 className="chartcard__title">Sentiment Over Time</h3>
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
              <div className="chartgrid">
                {customTabsData[tab].map((c, i) => (
                  <ChartCard key={c.chart_id || i} title={c.title} subtitle={c.description} wide>
                    <DynamicChartRenderer chart={c} />
                  </ChartCard>
                ))}
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
              <div className="chartgrid">
                {customTabsData[tab].map((c, i) => (
                  <ChartCard key={c.chart_id || i} title={c.title} subtitle={c.description} wide>
                    <DynamicChartRenderer chart={c} />
                  </ChartCard>
                ))}
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
                  <ShadcnAnimatedScatterChart
                    chart={formattedReachSentimentChart}
                    height={240}
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
                  <ShadcnAnimatedHeatmapChart chart={byId.publish_time_heatmap} />
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
              <div className="chartgrid">
                {customTabsData[tab].map((c, i) => (
                  <ChartCard key={c.chart_id || i} title={c.title} subtitle={c.description} wide>
                    <DynamicChartRenderer chart={c} />
                  </ChartCard>
                ))}
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
              <div className="chartgrid">
                {customTabsData[tab].map((c, i) => (
                  <ChartCard key={c.chart_id || i} title={c.title} subtitle={c.description} wide>
                    <DynamicChartRenderer chart={c} />
                  </ChartCard>
                ))}
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
            <section
              className="summary"
              style={{
                background: "rgba(255,255,255,0.7)",
                padding: 20,
                borderRadius: 12,
                border: "1px solid #ECE0E4",
              }}
            >
              <p
                className="summary__kicker"
                style={{ color: "#944564", fontWeight: 700 }}
              >
                DYNAMIC CHARTS
              </p>
              <p className="summary__body" style={{ color: "#3D5166" }}>
                Charts generated on demand by the data agent. Ask for more from
                the chat in the bottom-right.
              </p>
            </section>
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

        {/* ── Custom Dynamic Tabs Created by Chatbot ── */}
        {customTabsData[tab] && !chapters.some((ch) => ch.tab_name === tab) && (
          <div className="dashstack">
            <div className="chartgrid">
              {customTabsData[tab].map((c, i) => (
                <ChartCard key={c.chart_id || i} title={c.title} subtitle={c.description} wide>
                  <DynamicChartRenderer chart={c} />
                </ChartCard>
              ))}
            </div>
            <EditorialStoryBridge
              chapters={chapters}
              currentTab={tab}
              onSwitchTab={setTab}
            />
          </div>
        )}
      </div>
    </div>
  );
}
