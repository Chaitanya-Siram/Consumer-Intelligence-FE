import { useMemo } from "react";
import { Rich } from "../../utils/text.jsx";
import {
  DynamicChartRenderer,
  Empty,
  ChartCard,
} from "../../components/CustomChartWidgets.jsx";
import { useDynamicCharts, TabDynamicCharts } from "../../utils/dynamicChartManager.js";
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

// ── CUSTOM EDITORIAL KPI CARD ──
function EditorialKpiCard({ val, label, className = "" }) {
  return (
    <div className={`es-kpi ${className}`}>
      <div className="es-kpi-val">{val}</div>
      <div className="es-kpi-label">{label}</div>
    </div>
  );
}

export default function Template2({
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
                        <p className="chartcard__sub">{coverage.description}</p>
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
                  {ins("datewise_coverage") && (
                    <div
                      className="chartcard__insight"
                      style={{
                        marginTop: 12,
                        borderTop: "1px solid #F5EDF0",
                        paddingTop: 10,
                      }}
                    >
                      <Rich text={ins("datewise_coverage")} />
                    </div>
                  )}
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
                  {ins("sentiment_distribution") && (
                    <div
                      className="chartcard__insight"
                      style={{
                        marginTop: 12,
                        borderTop: "1px solid #F5EDF0",
                        paddingTop: 10,
                      }}
                    >
                      <Rich text={ins("sentiment_distribution")} />
                    </div>
                  )}
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
                    <h3 className="chartcard__title">{shareOfVoice.title}</h3>
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
                  {ins("share_of_voice") && (
                    <div
                      className="chartcard__insight"
                      style={{
                        marginTop: 12,
                        borderTop: "1px solid #F5EDF0",
                        paddingTop: 10,
                      }}
                    >
                      <Rich text={ins("share_of_voice")} />
                    </div>
                  )}
                </div>
              )}
            </div>

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

        {/* ── Coverage & Sentiment Tab ── */}
        {tab === "Coverage & Sentiment" && (
          <div className="dashstack">
            <EditorialChapterOpener
              chapters={chapters}
              currentTab={tab}
              onSwitchTab={setTab}
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
                      <p className="chartcard__sub">{coverage.description}</p>
                    )}
                  </div>
                </div>
                <div className="chartcard__body">
                  <DynamicChartRenderer
                    chart={coverage}
                    dateInsights={dateIns("datewise_coverage")}
                  />
                </div>
                {ins("datewise_coverage") && (
                  <div
                    className="chartcard__insight"
                    style={{
                      marginTop: 12,
                      borderTop: "1px solid #F5EDF0",
                      paddingTop: 10,
                    }}
                  >
                    <Rich text={ins("datewise_coverage")} />
                  </div>
                )}
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
                  {ins("sentiment_distribution") && (
                    <div
                      className="chartcard__insight"
                      style={{
                        marginTop: 12,
                        borderTop: "1px solid #F5EDF0",
                        paddingTop: 10,
                      }}
                    >
                      <Rich text={ins("sentiment_distribution")} />
                    </div>
                  )}
                </div>
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

        {/* ── Share of Voice Tab ── */}
        {tab === "Share of Voice" && (
          <div className="dashstack">
            <EditorialChapterOpener
              chapters={chapters}
              currentTab={tab}
              onSwitchTab={setTab}
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
                      <h3 className="chartcard__title">{shareOfVoice.title}</h3>
                    </div>
                  </div>
                  <div className="chartcard__body">
                    <DynamicChartRenderer chart={shareOfVoice} />
                  </div>
                  {ins("share_of_voice") && (
                    <div
                      className="chartcard__insight"
                      style={{
                        marginTop: 12,
                        borderTop: "1px solid #F5EDF0",
                        paddingTop: 10,
                      }}
                    >
                      <Rich text={ins("share_of_voice")} />
                    </div>
                  )}
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
                  {ins("publication_tier") && (
                    <div
                      className="chartcard__insight"
                      style={{
                        marginTop: 12,
                        borderTop: "1px solid #F5EDF0",
                        paddingTop: 10,
                      }}
                    >
                      <Rich text={ins("publication_tier")} />
                    </div>
                  )}
                </div>
              )}
            </div>
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

        {/* ── PR Impact Tab ── */}
        {tab === "PR Impact" && (
          <div className="dashstack">
            <EditorialChapterOpener
              chapters={chapters}
              currentTab={tab}
              onSwitchTab={setTab}
            />
            <div className="es-kpi-grid">
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
                    <h3 className="chartcard__title">{byId.pr_impact.title}</h3>
                  </div>
                </div>
                <div className="chartcard__body">
                  <DynamicChartRenderer chart={byId.pr_impact} />
                </div>
                {ins("pr_impact") && (
                  <div
                    className="chartcard__insight"
                    style={{
                      marginTop: 12,
                      borderTop: "1px solid #F5EDF0",
                      paddingTop: 10,
                    }}
                  >
                    <Rich text={ins("pr_impact")} />
                  </div>
                )}
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

        {/* ── Competitive Tab ── */}
        {tab === "Competitive" && (
          <div className="dashstack">
            <EditorialChapterOpener
              chapters={chapters}
              currentTab={tab}
              onSwitchTab={setTab}
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
                    <h3 className="chartcard__title">PR Score vs Competitor</h3>
                  </div>
                </div>
                <div className="chartcard__body">
                  <DynamicChartRenderer chart={mergedPRImpactChart} />
                </div>
                {ins("pr_impact_competitors") && (
                  <div
                    className="chartcard__insight"
                    style={{
                      marginTop: 12,
                      borderTop: "1px solid #F5EDF0",
                      paddingTop: 10,
                    }}
                  >
                    <Rich text={ins("pr_impact_competitors")} />
                  </div>
                )}
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
                {ins("competitive_matrix") && (
                  <div
                    className="chartcard__insight"
                    style={{
                      marginTop: 12,
                      borderTop: "1px solid #F5EDF0",
                      paddingTop: 10,
                    }}
                  >
                    <Rich text={ins("competitive_matrix")} />
                  </div>
                )}
              </div>
            )}
            {/* </div> */}
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
