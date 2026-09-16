import { useMemo } from "react";
import { Rich } from "../../utils/text.jsx";
import {
  DynamicChartRenderer,
  Empty,
  ChartCard,
} from "../../components/CustomChartWidgets.jsx";
import { useDynamicCharts } from "../../utils/dynamicChartManager.js";
import "./Template2.css";
import logoImg from "../../assets/images/image.png";
import UserAvatar from "../../components/UserAvatar.jsx";

const PILLARS_LIST = ["Trust", "Value", "Advocacy", "Social", "Brand", "Risk"];

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
  riGauge,
  activeVideoSrc,
  hero,
  TABS,
  stats,
  formattedTimeseriesChart,
  formattedDecompositionChart,
  formattedSmallMultiplesChart,
  formattedSentimentCoverageChart,
  formattedNetSentimentChart,
  formattedTier1ShareChart,
  formattedRiskNegativeChart,
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
              <EditorialKpiCard
                val={riGauge.value ?? "—"}
                label="Reputation Score"
              />
              <EditorialKpiCard
                val={
                  riGauge.delta > 0
                    ? `+${riGauge.delta}`
                    : (riGauge.delta ?? "—")
                }
                label="Delta vs Prior"
                className="teal"
              />
              <EditorialKpiCard
                val={riGauge.band ? String(riGauge.band).toUpperCase() : "—"}
                label="Risk Band"
                className="crimson"
              />
            </div>

            <div className="chartgrid">
              {byId.ri_timeseries && (
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
                        {byId.ri_timeseries.title}
                      </h3>
                      {byId.ri_timeseries.description && (
                        <p className="chartcard__sub">
                          {byId.ri_timeseries.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="chartcard__body">
                    <DynamicChartRenderer
                      chart={formattedTimeseriesChart}
                      dateInsights={dateIns("ri_timeseries")}
                    />
                  </div>
                  {ins("ri_timeseries") && (
                    <p
                      className="chartcard__insight"
                      style={{
                        marginTop: 12,
                        borderTop: "1px solid #F5EDF0",
                        paddingTop: 10,
                      }}
                    >
                      <Rich text={ins("ri_timeseries")} />
                    </p>
                  )}
                </div>
              )}

              {byId.pillar_radar && (
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
                        {byId.pillar_radar.title}
                      </h3>
                    </div>
                  </div>
                  <div className="chartcard__body">
                    <DynamicChartRenderer chart={byId.pillar_radar} />
                  </div>
                  {ins("pillar_radar") && (
                    <p
                      className="chartcard__insight"
                      style={{
                        marginTop: 12,
                        borderTop: "1px solid #F5EDF0",
                        paddingTop: 10,
                      }}
                    >
                      <Rich text={ins("pillar_radar")} />
                    </p>
                  )}
                </div>
              )}
            </div>

            {byId.trust_waterfall && (
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
                      {byId.trust_waterfall.title}
                    </h3>
                  </div>
                </div>
                <div className="chartcard__body">
                  <DynamicChartRenderer chart={byId.trust_waterfall} />
                </div>
                {ins("trust_waterfall") && (
                  <p
                    className="chartcard__insight"
                    style={{
                      marginTop: 12,
                      borderTop: "1px solid #F5EDF0",
                      paddingTop: 10,
                    }}
                  >
                    <Rich text={ins("trust_waterfall")} />
                  </p>
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

        {/* ── Pillar Analysis Tab ── */}
        {tab === "Pillar Analysis" && (
          <div className="dashstack">
            <EditorialChapterOpener
              chapters={chapters}
              currentTab={tab}
              onSwitchTab={setTab}
            />
            <div className="chartgrid">
              {byId.pillar_radar && (
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
                      {byId.pillar_radar.title}
                    </h3>
                  </div>
                  <div className="chartcard__body">
                    <DynamicChartRenderer chart={byId.pillar_radar} />
                  </div>
                  {ins("pillar_radar") && (
                    <p
                      className="chartcard__insight"
                      style={{
                        marginTop: 12,
                        borderTop: "1px solid #F5EDF0",
                        paddingTop: 10,
                      }}
                    >
                      <Rich text={ins("pillar_radar")} />
                    </p>
                  )}
                </div>
              )}

              {byId.pillar_bar && (
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
                      {byId.pillar_bar.title}
                    </h3>
                  </div>
                  <div className="chartcard__body">
                    <DynamicChartRenderer chart={byId.pillar_bar} />
                  </div>
                  {ins("pillar_bar") && (
                    <p
                      className="chartcard__insight"
                      style={{
                        marginTop: 12,
                        borderTop: "1px solid #F5EDF0",
                        paddingTop: 10,
                      }}
                    >
                      <Rich text={ins("pillar_bar")} />
                    </p>
                  )}
                </div>
              )}
            </div>

            {byId.pillar_small_multiples && (
              <div className="chartcard chartcard--wide">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 12,
                  }}
                >
                  <h3 className="chartcard__title">
                    {byId.pillar_small_multiples.title}
                  </h3>
                </div>
                <div className="chartcard__body">
                  <DynamicChartRenderer chart={formattedSmallMultiplesChart} />
                </div>
                {ins("pillar_small_multiples") && (
                  <p
                    className="chartcard__insight"
                    style={{
                      marginTop: 12,
                      borderTop: "1px solid #F5EDF0",
                      paddingTop: 10,
                    }}
                  >
                    <Rich text={ins("pillar_small_multiples")} />
                  </p>
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

        {/* ── Trust & Sentiment Tab ── */}
        {tab === "Trust & Sentiment" && (
          <div className="dashstack">
            <EditorialChapterOpener
              chapters={chapters}
              currentTab={tab}
              onSwitchTab={setTab}
            />
            <div className="chartgrid">
              {byId.trust_kpi_breakdown && (
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
                      {byId.trust_kpi_breakdown.title}
                    </h3>
                  </div>
                  <div className="chartcard__body">
                    <DynamicChartRenderer chart={byId.trust_kpi_breakdown} />
                  </div>
                  {ins("trust_kpi_breakdown") && (
                    <p
                      className="chartcard__insight"
                      style={{
                        marginTop: 12,
                        borderTop: "1px solid #F5EDF0",
                        paddingTop: 10,
                      }}
                    >
                      <Rich text={ins("trust_kpi_breakdown")} />
                    </p>
                  )}
                </div>
              )}

              {byId.trust_waterfall && (
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
                      {byId.trust_waterfall.title}
                    </h3>
                  </div>
                  <div className="chartcard__body">
                    <DynamicChartRenderer chart={byId.trust_waterfall} />
                  </div>
                  {ins("trust_waterfall") && (
                    <p
                      className="chartcard__insight"
                      style={{
                        marginTop: 12,
                        borderTop: "1px solid #F5EDF0",
                        paddingTop: 10,
                      }}
                    >
                      <Rich text={ins("trust_waterfall")} />
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="chartgrid">
              {byId.sentiment_coverage && (
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
                      {byId.sentiment_coverage.title}
                    </h3>
                  </div>
                  <div className="chartcard__body">
                    <DynamicChartRenderer
                      chart={formattedSentimentCoverageChart}
                    />
                  </div>
                  {ins("sentiment_coverage") && (
                    <p
                      className="chartcard__insight"
                      style={{
                        marginTop: 12,
                        borderTop: "1px solid #F5EDF0",
                        paddingTop: 10,
                      }}
                    >
                      <Rich text={ins("sentiment_coverage")} />
                    </p>
                  )}
                </div>
              )}

              {byId.net_sentiment_coverage && (
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
                      {byId.net_sentiment_coverage.title}
                    </h3>
                  </div>
                  <div className="chartcard__body">
                    <DynamicChartRenderer
                      chart={formattedNetSentimentChart}
                      dateInsights={dateIns("net_sentiment_coverage")}
                    />
                  </div>
                  {ins("net_sentiment_coverage") && (
                    <p
                      className="chartcard__insight"
                      style={{
                        marginTop: 12,
                        borderTop: "1px solid #F5EDF0",
                        paddingTop: 10,
                      }}
                    >
                      <Rich text={ins("net_sentiment_coverage")} />
                    </p>
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

        {/* ── Media Coverage Tab ── */}
        {tab === "Media Coverage" && (
          <div className="dashstack">
            <EditorialChapterOpener
              chapters={chapters}
              currentTab={tab}
              onSwitchTab={setTab}
            />
            <div className="chartgrid">
              {byId.coverage_volume && (
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
                      {byId.coverage_volume.title}
                    </h3>
                  </div>
                  <div className="chartcard__body">
                    <DynamicChartRenderer chart={byId.coverage_volume} />
                  </div>
                  {ins("coverage_volume") && (
                    <p
                      className="chartcard__insight"
                      style={{
                        marginTop: 12,
                        borderTop: "1px solid #F5EDF0",
                        paddingTop: 10,
                      }}
                    >
                      <Rich text={ins("coverage_volume")} />
                    </p>
                  )}
                </div>
              )}

              {byId.tier1_share && (
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
                      {byId.tier1_share.title}
                    </h3>
                  </div>
                  <div className="chartcard__body">
                    <DynamicChartRenderer chart={formattedTier1ShareChart} />
                  </div>
                  {ins("tier1_share") && (
                    <p
                      className="chartcard__insight"
                      style={{
                        marginTop: 12,
                        borderTop: "1px solid #F5EDF0",
                        paddingTop: 10,
                      }}
                    >
                      <Rich text={ins("tier1_share")} />
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="chartgrid">
              {byId.source_treemap && (
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
                      {byId.source_treemap.title}
                    </h3>
                  </div>
                  <div className="chartcard__body">
                    <DynamicChartRenderer chart={byId.source_treemap} />
                  </div>
                  {ins("source_treemap") && (
                    <p
                      className="chartcard__insight"
                      style={{
                        marginTop: 12,
                        borderTop: "1px solid #F5EDF0",
                        paddingTop: 10,
                      }}
                    >
                      <Rich text={ins("source_treemap")} />
                    </p>
                  )}
                </div>
              )}

              {byId.theme_volume && (
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
                      {byId.theme_volume.title}
                    </h3>
                  </div>
                  <div className="chartcard__body">
                    <DynamicChartRenderer chart={byId.theme_volume} />
                  </div>
                  {ins("theme_volume") && (
                    <p
                      className="chartcard__insight"
                      style={{
                        marginTop: 12,
                        borderTop: "1px solid #F5EDF0",
                        paddingTop: 10,
                      }}
                    >
                      <Rich text={ins("theme_volume")} />
                    </p>
                  )}
                </div>
              )}
            </div>

            {byId.theme_pillar_heatmap && (
              <div className="chartcard chartcard--wide">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 12,
                  }}
                >
                  <h3 className="chartcard__title">
                    {byId.theme_pillar_heatmap.title}
                  </h3>
                </div>
                <div className="chartcard__body">
                  <DynamicChartRenderer chart={byId.theme_pillar_heatmap} />
                </div>
                {ins("theme_pillar_heatmap") && (
                  <p
                    className="chartcard__insight"
                    style={{
                      marginTop: 12,
                      borderTop: "1px solid #F5EDF0",
                      paddingTop: 10,
                    }}
                  >
                    <Rich text={ins("theme_pillar_heatmap")} />
                  </p>
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

        {/* ── Risk & Sensitivity Tab ── */}
        {tab === "Risk & Sensitivity" && (
          <div className="dashstack">
            <EditorialChapterOpener
              chapters={chapters}
              currentTab={tab}
              onSwitchTab={setTab}
            />
            <div className="chartgrid">
              {byId.risk_negative_coverage && (
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
                      {byId.risk_negative_coverage.title}
                    </h3>
                  </div>
                  <div className="chartcard__body">
                    <DynamicChartRenderer
                      chart={formattedRiskNegativeChart}
                      dateInsights={dateIns("risk_negative_coverage")}
                    />
                  </div>
                  {ins("risk_negative_coverage") && (
                    <p
                      className="chartcard__insight"
                      style={{
                        marginTop: 12,
                        borderTop: "1px solid #F5EDF0",
                        paddingTop: 10,
                      }}
                    >
                      <Rich text={ins("risk_negative_coverage")} />
                    </p>
                  )}
                </div>
              )}

              {byId.weight_sensitivity && (
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
                      {byId.weight_sensitivity.title}
                    </h3>
                  </div>
                  <div className="chartcard__body">
                    <DynamicChartRenderer chart={byId.weight_sensitivity} />
                  </div>
                  {ins("weight_sensitivity") && (
                    <p
                      className="chartcard__insight"
                      style={{
                        marginTop: 12,
                        borderTop: "1px solid #F5EDF0",
                        paddingTop: 10,
                      }}
                    >
                      <Rich text={ins("weight_sensitivity")} />
                    </p>
                  )}
                </div>
              )}
            </div>

            {byId.ri_decomposition_coverage && (
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
                      {byId.ri_decomposition_coverage.title}
                    </h3>
                  </div>
                </div>
                <div className="chartcard__body">
                  <DynamicChartRenderer chart={formattedDecompositionChart} />
                </div>
                {ins("ri_decomposition_coverage") && (
                  <p
                    className="chartcard__insight"
                    style={{
                      marginTop: 12,
                      borderTop: "1px solid #F5EDF0",
                      paddingTop: 10,
                    }}
                  >
                    <Rich text={ins("ri_decomposition_coverage")} />
                  </p>
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
