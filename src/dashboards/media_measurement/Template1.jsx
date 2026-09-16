import { useMemo, useState } from "react";
import { Rich } from "../../utils/text.jsx";
import {
  DynamicChartRenderer,
  Empty,
  ChartCard,
} from "../../components/CustomChartWidgets.jsx";
import ShadcnAnimatedLineChart from "../../components/ShadcnAnimatedLineChart.jsx";
import ShadcnAnimatedBarChart from "../../components/ShadcnAnimatedBarChart.jsx";
import ShadcnAnimatedPieChart from "../../components/ShadcnAnimatedPieChart.jsx";
import ShadcnAnimatedAreaChart from "../../components/ShadcnAnimatedAreaChart.jsx";
import ShadcnAnimatedScatterChart from "../../components/ShadcnAnimatedScatterChart.jsx";
import ShadcnAnimatedHeatmapChart from "../../components/ShadcnAnimatedHeatmapChart.jsx";
import {
  StoryboardPanel,
  WhatsNext,
} from "../../components/StoryboardPanel.jsx";
import {
  useDynamicCharts,
  TabDynamicCharts,
} from "../../utils/dynamicChartManager.js";

const SENT = {
  POS: { label: "Positive", color: "#10b981" },
  NEG: { label: "Negative", color: "#ef4444" },
  NEU: { label: "Neutral", color: "#94a3b8" },
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

function TopArticles({ data }) {
  const cols = ["POS", "NEU", "NEG"];
  const has = cols.some((k) => (data?.[k] || []).length);
  if (!has) return <Empty />;
  return (
    <div className="storiesgrid">
      {cols.map((k) => (
        <div className="storiescol" key={k}>
          <h4 className="storiescol__head" style={{ color: SENT[k].color }}>
            {SENT[k].label}
          </h4>
          {(data?.[k] || []).map((a, i) => (
            <article className="storycard" key={a.id ?? i}>
              <p className="storycard__title">{a.title}</p>
              <p className="storycard__meta">
                {a.domain || "Unknown"} · {fmtDate(a.date)}
                {a.theme ? ` · ${a.theme}` : ""}
              </p>
              <p className="storycard__snippet">{a.content}</p>
            </article>
          ))}
          {(data?.[k] || []).length === 0 && (
            <p className="muted">No articles.</p>
          )}
        </div>
      ))}
    </div>
  );
}

export default function Template1({
  project,
  session,
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
  TABS,
  stats,
  virtualReport,
}) {
  const { currentTabCharts, customTabNames, customTabsData } =
    useDynamicCharts(tab);

  const ALL_TABS = useMemo(() => {
    const base = Array.isArray(TABS) ? TABS : [];
    const extras = customTabNames.filter((name) => !base.includes(name));
    return [...base, ...extras];
  }, [TABS, customTabNames]);

  return (
    <>
      <div
        style={{
          position: "relative",
          width: "100%",
          minHeight: 360,
          overflow: "hidden",
          flexShrink: 0,
          background:
            "linear-gradient(135deg, #0D1628 0%, #160D2E 50%, #0A2540 100%)",
          borderRadius: 20,
          paddingTop: "6rem",
        }}
      >
        {activeVideoSrc && (
          <video
            key={activeVideoSrc}
            autoPlay
            loop
            muted
            playsInline
            src={activeVideoSrc}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.32,
              filter: "saturate(0.65) brightness(0.85)",
              mixBlendMode: "screen",
            }}
          />
        )}

        <div
          style={{
            position: "absolute",
            bottom: 24,
            left: 36,
            right: 36,
            zIndex: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: 40,
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1, minWidth: 280 }}>
            <button className="brand-BrandHero">
              <span className="brand__dot" />
              {project?.name || "Intelligence"}
            </button>
            <div
              style={{
                fontSize: 12,
                fontFamily: "Inter, SF Pro Display, sans-serif",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.9)",
                marginBottom: 8,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: "50%",
                  background: "#4CB782",
                  display: "inline-block",
                  boxShadow: "0 0 6px #4CB782",
                  fontFamily: "Inter, SF Pro Display, sans-serif",
                }}
              />
              {hero.kicker}
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: "clamp(22px, 3vw, 32px)",
                fontWeight: 800,
                color: "#ffffff",
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
              }}
            >
              {hero.lead}
              {hero.em && (
                <em
                  style={{
                    fontStyle: "normal",
                    color: "rgba(255,255,255,0.75)",
                  }}
                >
                  {" "}
                  {hero.em}
                </em>
              )}
            </h1>

            {hero.sub && (
              <p
                style={{
                  margin: "10px 0 0",
                  fontSize: 12.5,
                  color: "rgba(255,255,255,0.6)",
                  lineHeight: 1.55,
                  maxWidth: 600,
                }}
              >
                {hero.sub}
              </p>
            )}

            {stats.length > 0 && (
              <div style={{ display: "flex", gap: 20, marginTop: 14 }}>
                {stats.map((s, i) => (
                  <div
                    key={i}
                    style={{ display: "flex", flexDirection: "column", gap: 2 }}
                  >
                    <span
                      style={{
                        fontSize: 20,
                        fontWeight: 800,
                        color: "#fff",
                        fontFamily: "JetBrains Mono, monospace",
                      }}
                    >
                      {s.n}
                    </span>
                    <span
                      style={{
                        fontSize: 9,
                        color: "rgba(255,255,255,0.5)",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {s.l}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {virtualReport && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                background: "rgba(255,255,255,0.08)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.12)",
                padding: "16px 20px",
                borderRadius: 16,
                width: 380,
                boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontSize: 9.5,
                    fontWeight: 700,
                    color: "rgba(255,255,255,0.6)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  {virtualReport.day}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: "#ffffff",
                    background: "rgba(255,255,255,0.15)",
                    padding: "2px 8px",
                    borderRadius: 20,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    fontFamily: "JetBrains Mono, monospace",
                  }}
                >
                  {compact(virtualReport.total)} articles
                </span>
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#ffffff",
                  letterSpacing: "-0.01em",
                }}
              >
                {virtualReport.date}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  height: 10,
                  borderRadius: 5,
                  overflow: "hidden",
                  background: "rgba(255,255,255,0.1)",
                  marginTop: 4,
                }}
              >
                <div
                  style={{
                    width: `${(virtualReport.pos / virtualReport.total) * 100}%`,
                    height: "100%",
                    background: SENT.POS.color,
                  }}
                />
                <div
                  style={{
                    width: `${(virtualReport.neut / virtualReport.total) * 100}%`,
                    height: "100%",
                    background: SENT.NEU.color,
                  }}
                />
                <div
                  style={{
                    width: `${(virtualReport.neg / virtualReport.total) * 100}%`,
                    height: "100%",
                    background: SENT.NEG.color,
                  }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 11,
                  color: "rgba(255,255,255,0.7)",
                  marginTop: 2,
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: SENT.POS.color,
                    }}
                  />
                  Pos:{" "}
                  {Math.round((virtualReport.pos / virtualReport.total) * 100)}%
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: SENT.NEU.color,
                    }}
                  />
                  Neu:{" "}
                  {Math.round((virtualReport.neut / virtualReport.total) * 100)}
                  %
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: SENT.NEG.color,
                    }}
                  />
                  Neg:{" "}
                  {Math.round((virtualReport.neg / virtualReport.total) * 100)}%
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="tabbar">
        {ALL_TABS.map((t) => (
          <button
            key={t}
            className={`tabbtn${tab === t ? " tabbtn--on" : ""}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {tab === "Overview" && (
        <div className="dashstack">
          {overall && (
            <section className="summary">
              <p className="summary__kicker">OVERALL SUMMARY</p>
              <p className="summary__body">
                <Rich text={overall} />
              </p>
            </section>
          )}

          <StoryboardPanel chapter={chapterFor("Overview")} />

          <div className="kpirow">
            <div className="kpi">
              <div className="kpi__val">{nf(totalCount)}</div>
              <div className="kpi__lbl">Total Articles</div>
            </div>
            <div className="kpi">
              <div className="kpi__val">{compact(totalReach)}</div>
              <div className="kpi__lbl">Total Reach</div>
            </div>
            {sentiment?.data?.net_sentiment_score != null && (
              <div className="kpi">
                <div className="kpi__val">
                  {sentiment.data.net_sentiment_score}%
                </div>
                <div className="kpi__lbl">Net Sentiment</div>
              </div>
            )}
          </div>

          <div className="chartgrid">
            {coverage && (
              <ChartCard
                title={coverage.title}
                subtitle={coverage.description}
                insight={ins("datewise_coverage")}
                analysis={analysisOf("datewise_coverage")}
                onOpenAnalysis={() =>
                  openAnalysis("datewise_coverage", coverage.title)
                }
              >
                <ShadcnAnimatedLineChart
                  chart={coverage}
                  dateInsights={dateIns("datewise_coverage")}
                />
              </ChartCard>
            )}
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
                {Array.isArray(sentiment?.data) &&
                (sentiment.data[0]?.date ||
                  sentiment.data[0]?.label?.includes("-") ||
                  sentiment.data[0]?.dateStr) ? (
                  <ShadcnAnimatedAreaChart
                    chart={sentiment}
                    dateInsights={dateIns("sentiment_distribution")}
                  />
                ) : (
                  <ShadcnAnimatedPieChart chart={sentiment} />
                )}
              </ChartCard>
            )}
          </div>

          <div className="chartgrid">
            {theme && (
              <ChartCard
                title={theme.title}
                subtitle={theme.description}
                insight={ins("theme_distribution")}
                analysis={analysisOf("theme_distribution")}
                onOpenAnalysis={() =>
                  openAnalysis("theme_distribution", theme.title)
                }
              >
                <ShadcnAnimatedBarChart chart={formattedThemeChart} />
              </ChartCard>
            )}
            {syndication && (
              <ChartCard
                title={syndication.title}
                subtitle={syndication.description}
                insight={ins("original_vs_syndicated")}
                analysis={analysisOf("original_vs_syndicated")}
                onOpenAnalysis={() =>
                  openAnalysis("original_vs_syndicated", syndication.title)
                }
              >
                <ShadcnAnimatedPieChart chart={formattedSyndicationChart} />
              </ChartCard>
            )}
          </div>
          <TabDynamicCharts
            activeTab="Overview"
            ChartCardComp={ChartCard}
            DynamicRendererComp={DynamicChartRenderer}
          />
          <WhatsNext
            chapter={chapterFor("Overview")}
            allChapters={chapters}
            onSwitchTab={setTab}
          />
        </div>
      )}

      {/* ── Sentiment Analysis ── */}
      {tab === "Sentiment Analysis" && (
        <div className="dashstack">
          <StoryboardPanel chapter={chapterFor("Sentiment Analysis")} />
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
            {formattedSentimentOverTimeChart && (
              <ChartCard
                title={formattedSentimentOverTimeChart.title}
                subtitle={formattedSentimentOverTimeChart.description}
                insight={ins("sentiment_distribution")}
                analysis={analysisOf("sentiment_distribution")}
                onOpenAnalysis={() =>
                  openAnalysis(
                    "sentiment_distribution",
                    formattedSentimentOverTimeChart.title,
                  )
                }
              >
                <DynamicChartRenderer
                  chart={formattedSentimentOverTimeChart}
                  dateInsights={dateIns("sentiment_distribution")}
                />
              </ChartCard>
            )}
          </div>
          <TabDynamicCharts
            activeTab="Sentiment Analysis"
            ChartCardComp={ChartCard}
            DynamicRendererComp={DynamicChartRenderer}
          />
          <WhatsNext
            chapter={chapterFor("Sentiment Analysis")}
            allChapters={chapters}
            onSwitchTab={setTab}
          />
        </div>
      )}

      {/* ── Themes & Topics ── */}
      {tab === "Themes & Topics" && (
        <div className="dashstack">
          <StoryboardPanel chapter={chapterFor("Themes & Topics")} />
          {theme && (
            <ChartCard
              title={theme.title}
              subtitle={theme.description}
              insight={ins("theme_distribution")}
              analysis={analysisOf("theme_distribution")}
              onOpenAnalysis={() =>
                openAnalysis("theme_distribution", theme.title)
              }
              wide
            >
              <DynamicChartRenderer chart={formattedThemeChart} />
            </ChartCard>
          )}
          <TabDynamicCharts
            activeTab="Themes & Topics"
            ChartCardComp={ChartCard}
            DynamicRendererComp={DynamicChartRenderer}
          />
          <WhatsNext
            chapter={chapterFor("Themes & Topics")}
            allChapters={chapters}
            onSwitchTab={setTab}
          />
        </div>
      )}

      {/* ── Media Coverage ── */}
      {tab === "Media Coverage" && (
        <div className="dashstack">
          <StoryboardPanel chapter={chapterFor("Media Coverage")} />
          {byId.top_publications && (
            <ChartCard
              title={byId.top_publications.title}
              subtitle={byId.top_publications.description}
              insight={ins("top_publications")}
              analysis={analysisOf("top_publications")}
              onOpenAnalysis={() =>
                openAnalysis("top_publications", byId.top_publications.title)
              }
              wide
            >
              <DynamicChartRenderer chart={byId.top_publications} />
            </ChartCard>
          )}
          {byId.publication_reach_sentiment && (
            <ChartCard
              title={byId.publication_reach_sentiment.title}
              subtitle={byId.publication_reach_sentiment.description}
              insight={ins("publication_reach_sentiment")}
              analysis={analysisOf("publication_reach_sentiment")}
              onOpenAnalysis={() =>
                openAnalysis(
                  "publication_reach_sentiment",
                  byId.publication_reach_sentiment.title,
                )
              }
              wide
            >
              <ShadcnAnimatedScatterChart
                chart={formattedReachSentimentChart}
                height={240}
              />
            </ChartCard>
          )}
          {byId.publish_time_heatmap && (
            <ChartCard
              title={byId.publish_time_heatmap.title}
              subtitle={byId.publish_time_heatmap.description}
              insight={ins("publish_time_heatmap")}
              analysis={analysisOf("publish_time_heatmap")}
              onOpenAnalysis={() =>
                openAnalysis(
                  "publish_time_heatmap",
                  byId.publish_time_heatmap.title,
                )
              }
              wide
            >
              <ShadcnAnimatedHeatmapChart chart={byId.publish_time_heatmap} />
            </ChartCard>
          )}
          {byId.top_authors_by_publications && (
            <ChartCard
              title={byId.top_authors_by_publications.title}
              subtitle={byId.top_authors_by_publications.description}
              insight={ins("top_authors_by_publications")}
              analysis={analysisOf("top_authors_by_publications")}
              onOpenAnalysis={() =>
                openAnalysis(
                  "top_authors_by_publications",
                  byId.top_authors_by_publications.title,
                )
              }
              wide
            >
              <DynamicChartRenderer
                chart={byId.top_authors_by_publications}
              />
            </ChartCard>
          )}
          <TabDynamicCharts
            activeTab="Media Coverage"
            ChartCardComp={ChartCard}
            DynamicRendererComp={DynamicChartRenderer}
          />
          <WhatsNext
            chapter={chapterFor("Media Coverage")}
            allChapters={chapters}
            onSwitchTab={setTab}
          />
        </div>
      )}

      {/* ── Key Stories ── */}
      {tab === "Key Stories" && (
        <div className="dashstack">
          <StoryboardPanel chapter={chapterFor("Key Stories")} />
          {byId.top_articles_by_sentiment && (
            <ChartCard
              title={byId.top_articles_by_sentiment.title}
              subtitle={byId.top_articles_by_sentiment.description}
              insight={ins("top_articles_by_sentiment")}
              analysis={analysisOf("top_articles_by_sentiment")}
              onOpenAnalysis={() =>
                openAnalysis(
                  "top_articles_by_sentiment",
                  byId.top_articles_by_sentiment.title,
                )
              }
              wide
            >
              <TopArticles data={byId.top_articles_by_sentiment.data} />
            </ChartCard>
          )}
          <TabDynamicCharts
            activeTab="Key Stories"
            ChartCardComp={ChartCard}
            DynamicRendererComp={DynamicChartRenderer}
          />
          <WhatsNext
            chapter={chapterFor("Key Stories")}
            allChapters={chapters}
            onSwitchTab={setTab}
          />
        </div>
      )}

      {/* ── Dynamic AI Charts Tab ── */}
      {tab === DYNAMIC_TAB && (
        <div className="dashstack">
          {[...dynamicCharts, ...currentTabCharts].map((c, i) => (
            <ChartCard key={i} title={c.title} subtitle={c.description} wide>
              <DynamicChartRenderer chart={c} />
            </ChartCard>
          ))}
        </div>
      )}
    </>
  );
}
