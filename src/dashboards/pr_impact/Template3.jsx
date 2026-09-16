import { useMemo } from "react";
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

export default function Template3({
  templateMode,
  onChangeTemplate,
  onBack,
  project,
  session,
  tab,
  setTab,
  openAnalysis,
  chapterFor,
  chapters,
  DASHBOARD_KEY,
  byId,
  insights,
  overall,
  ins,
  dateIns,
  analysisOf,
  totalCount,
  totalReach,
  sentiment,
  coverage,
  shareOfVoice,
  activeVideoSrc,
  hero,
  TABS,
  stats,
  mergedPRImpactChart,
}) {
  const { customTabsData } = useDynamicCharts(tab);

  return (
    <div className="pr-impact-merger" data-dashboard-template="merger">
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
                Classic View
              </button>
              <button
                className={`sb-layout-btn ${templateMode === "editorial" ? "active" : ""}`}
                onClick={() => onChangeTemplate("editorial")}
              >
                Editorial View
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

            {/* ── Overview Tab ── */}
            {tab === "Overview" && (
              <div className="dashstack">
                <EditorialChapterOpener
                  chapters={chapters}
                  currentTab={tab}
                  onSwitchTab={setTab}
                  activeVideoSrc={activeVideoSrc}
                />

                {overall && (
                  <div className="hero">
                    <div className="hero-eyebrow">Overall Summary</div>
                    <p className="hero-desc">
                      <Rich text={overall} />
                    </p>
                  </div>
                )}

                <div className="kpi-strip">
                  <EditorialKpiCard
                    val={nf(totalCount)}
                    label="Total Articles"
                  />
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

                <div className="chartgrid">
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
                            <p className="chartcard__sub">
                              {coverage.description}
                            </p>
                          )}
                        </div>
                        {analysisOf("datewise_coverage") && (
                          <button
                            className="ai-btn"
                            onClick={() =>
                              openAnalysis("datewise_coverage", coverage.title)
                            }
                          >
                            ✦ Analysis
                          </button>
                        )}
                      </div>
                      <div className="chartcard__body">
                        <DynamicChartRenderer
                          chart={coverage}
                          dateInsights={dateIns("datewise_coverage")}
                        />
                      </div>
                    </div>
                  )}
                </div>

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
                        <h3 className="chartcard__title">{sentiment.title}</h3>
                        {analysisOf("sentiment_distribution") && (
                          <button
                            className="ai-btn"
                            onClick={() =>
                              openAnalysis(
                                "sentiment_distribution",
                                sentiment.title,
                              )
                            }
                          >
                            ✦ Analysis
                          </button>
                        )}
                      </div>
                      <div className="chartcard__body">
                        <DynamicChartRenderer chart={sentiment} />
                      </div>
                    </div>
                  )}

                  {shareOfVoice && (
                    <div className="chartcard">
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: 12,
                        }}
                      >
                        <h3 className="chartcard__title">
                          {shareOfVoice.title}
                        </h3>
                        {analysisOf("share_of_voice") && (
                          <button
                            className="ai-btn"
                            onClick={() =>
                              openAnalysis("share_of_voice", shareOfVoice.title)
                            }
                          >
                            ✦ Analysis
                          </button>
                        )}
                      </div>
                      <div className="chartcard__body">
                        <DynamicChartRenderer chart={shareOfVoice} />
                      </div>
                    </div>
                  )}
                </div>

                <EditorialStoryBridge
                  chapters={chapters}
                  currentTab={tab}
                  onSwitchTab={setTab}
                />
              </div>
            )}

            {/* ── Coverage & Sentiment Tab ── */}
            {tab === "Coverage & Sentiment" && (
              <div className="dashstack">
                <EditorialChapterOpener
                  chapters={chapters}
                  currentTab={tab}
                  onSwitchTab={setTab}
                  activeVideoSrc={activeVideoSrc}
                />
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
                          <p className="chartcard__sub">
                            {coverage.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="chartcard__body">
                      <DynamicChartRenderer
                        chart={coverage}
                        dateInsights={dateIns("datewise_coverage")}
                      />
                    </div>
                  </div>
                )}

                {sentiment && (
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
                        <h3 className="chartcard__title">{sentiment.title}</h3>
                      </div>
                      <div className="chartcard__body">
                        <DynamicChartRenderer chart={sentiment} />
                      </div>
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

            {/* ── Share of Voice Tab ── */}
            {tab === "Share of Voice" && (
              <div className="dashstack">
                <EditorialChapterOpener
                  chapters={chapters}
                  currentTab={tab}
                  onSwitchTab={setTab}
                  activeVideoSrc={activeVideoSrc}
                />
                <div className="chartgrid">
                  {shareOfVoice && (
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
                            {shareOfVoice.title}
                          </h3>
                        </div>
                      </div>
                      <div className="chartcard__body">
                        <DynamicChartRenderer chart={shareOfVoice} />
                      </div>
                    </div>
                  )}

                  {byId.publication_tier && (
                    <div className="chartcard">
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: 12,
                        }}
                      >
                        <h3 className="chartcard__title">
                          {byId.publication_tier.title}
                        </h3>
                      </div>
                      <div className="chartcard__body">
                        <DynamicChartRenderer chart={byId.publication_tier} />
                      </div>
                    </div>
                  )}
                </div>
                <EditorialStoryBridge
                  chapters={chapters}
                  currentTab={tab}
                  onSwitchTab={setTab}
                />
              </div>
            )}

            {/* ── PR Impact Tab ── */}
            {tab === "PR Impact" && (
              <div className="dashstack">
                <EditorialChapterOpener
                  chapters={chapters}
                  currentTab={tab}
                  onSwitchTab={setTab}
                  activeVideoSrc={activeVideoSrc}
                />
                <div className="kpi-strip">
                  <EditorialKpiCard
                    val={(byId.pr_impact?.data?.gauge ?? 0).toFixed(2)}
                    label="Average PR Score"
                  />
                  <EditorialKpiCard
                    val={byId.pr_impact?.data?.rating_scale ?? "—"}
                    label="Rating Scale"
                    className="teal"
                  />
                </div>
                {byId.pr_impact && (
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
                          {byId.pr_impact.title}
                        </h3>
                      </div>
                    </div>
                    <div className="chartcard__body">
                      <DynamicChartRenderer chart={byId.pr_impact} />
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

            {/* ── Competitive Tab ── */}
            {tab === "Competitive" && (
              <div className="dashstack">
                <EditorialChapterOpener
                  chapters={chapters}
                  currentTab={tab}
                  onSwitchTab={setTab}
                  activeVideoSrc={activeVideoSrc}
                />
                {/* <div className="chartgrid"> */}
                {byId.pr_impact_competitors && (
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
                          PR Score vs Competitor
                        </h3>
                      </div>
                    </div>
                    <div className="chartcard__body">
                      <DynamicChartRenderer chart={mergedPRImpactChart} />
                    </div>
                  </div>
                )}

                {byId.competitive_matrix && (
                  <div className="chartcard">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 12,
                      }}
                    >
                      <h3 className="chartcard__title">
                        {byId.competitive_matrix.title}
                      </h3>
                    </div>
                    <div className="chartcard__body">
                      <DynamicChartRenderer chart={byId.competitive_matrix} />
                    </div>
                  </div>
                )}
                {/* </div> */}
                <EditorialStoryBridge
                  chapters={chapters}
                  currentTab={tab}
                  onSwitchTab={setTab}
                />
              </div>
            )}

            {/* ── Custom Dynamic Tabs Created by Chatbot ── */}
            {customTabsData[tab] && (
              <div className="dashstack">
                <div className="chartgrid">
                  {customTabsData[tab].map((c, i) => (
                    <ChartCard key={c.chart_id || i} title={c.title} subtitle={c.description} wide>
                      <DynamicChartRenderer chart={c} />
                    </ChartCard>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
