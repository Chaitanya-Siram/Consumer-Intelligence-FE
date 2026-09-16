import { useMemo } from "react";
import { Rich } from "../../utils/text.jsx";
import { DynamicChartRenderer, ChartCard } from "../../components/CustomChartWidgets.jsx";
import {
  StoryboardPanel,
  WhatsNext,
} from "../../components/StoryboardPanel.jsx";
import { TopNarrativesList } from "../../components/TopNarrativesList.jsx";
import { useDynamicCharts, TabDynamicCharts } from "../../utils/dynamicChartManager.js";

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

export default function Template1({
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
  activeVideoSrc,
  hero,
  TABS,
  stats,
  brandsList,
  selectedBrand,
  setSelectedBrand,
  selectedBrandChart,
  formattedCoverageChart,
  formattedSentimentChart,
  formattedConsistencyTimeChart,
  topNarratives,
}) {
  const { currentTabCharts, customTabNames, customTabsData } = useDynamicCharts(tab);

  const ALL_TABS = useMemo(() => {
    const base = Array.isArray(TABS) ? TABS : [];
    const extras = customTabNames.filter((name) => !base.includes(name));
    return [...base, ...extras];
  }, [TABS, customTabNames]);

  return (
    <>
      <div
        className="mmhero"
        style={{
          position: "relative",
          width: "100%",
          minHeight: 280,
          overflow: "hidden",
          flexShrink: 0,
          background:
            "linear-gradient(135deg, #0D1628 0%, #160D2E 50%, #0A2540 100%)",
          borderRadius: 20,
          marginBottom: 20,
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
            inset: 0,
            background:
              "radial-gradient(circle at 80% 20%, rgba(99, 91, 255, 0.15), transparent 50%)",
            pointerEvents: "none",
          }}
        />

        <div
          className="mmhero__inner"
          style={{ position: "relative", zIndex: 2 }}
        >
          <div className="mmhero__kicker">
            <span className="mmhero__dot" />
            {hero.kicker}
          </div>
          <h1 className="mmhero__h1">
            {hero.lead} <em>{hero.em}</em>
          </h1>
          <p className="mmhero__sub">{hero.sub}</p>

          <div className="mmhero__stats">
            {stats.map((s, i) => (
              <div className="mmhero__stat" key={i}>
                <div className="mmhero__statn">{s.n}</div>
                <div className="mmhero__statl">{s.l}</div>
              </div>
            ))}
          </div>
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

          <TopNarrativesList narratives={topNarratives} />

          <div className="kpirow">
            <div className="kpi">
              <div className="kpi__val">{nf(totalCount)}</div>
              <div className="kpi__lbl">Total Articles</div>
            </div>
            <div className="kpi">
              <div className="kpi__val">{compact(totalReach)}</div>
              <div className="kpi__lbl">Total Reach</div>
            </div>
          </div>

          <div className="chartgrid">
            {byId.message_consistency && (
              <ChartCard
                title={byId.message_consistency.title}
                subtitle={byId.message_consistency.description}
                insight={ins("message_consistency")}
                analysis={analysisOf("message_consistency")}
                onOpenAnalysis={() =>
                  openAnalysis(
                    "message_consistency",
                    byId.message_consistency.title,
                  )
                }
              >
                <DynamicChartRenderer chart={byId.message_consistency} />
              </ChartCard>
            )}
            {byId.publication_by_brands_and_competitors && (
              <ChartCard
                title={byId.publication_by_brands_and_competitors.title}
                subtitle={
                  byId.publication_by_brands_and_competitors.description
                }
                insight={ins("publication_by_brands_and_competitors")}
                analysis={analysisOf("publication_by_brands_and_competitors")}
                onOpenAnalysis={() =>
                  openAnalysis(
                    "publication_by_brands_and_competitors",
                    byId.publication_by_brands_and_competitors.title,
                  )
                }
              >
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 12 }}
                >
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {brandsList.map((b) => (
                      <button
                        key={b}
                        className={`preset-chip ${selectedBrand === b ? "active" : ""}`}
                        onClick={() => setSelectedBrand(b)}
                        style={{ padding: "4px 10px", fontSize: "11px" }}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                  <DynamicChartRenderer chart={selectedBrandChart} />
                </div>
              </ChartCard>
            )}
          </div>
          <TabDynamicCharts activeTab="Overview" ChartCardComp={ChartCard} DynamicRendererComp={DynamicChartRenderer} />
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
          <WhatsNext
            chapter={chapterFor("Overview")}
            allChapters={chapters}
            onSwitchTab={setTab}
          />
        </div>
      )}

      {/* ── Coverage ── */}
      {tab === "Coverage" && (
        <div className="dashstack">
          <StoryboardPanel chapter={chapterFor("Coverage")} />
          {byId.coverage_overtime_by_competitors && (
            <ChartCard
              title={byId.coverage_overtime_by_competitors.title}
              subtitle={byId.coverage_overtime_by_competitors.description}
              insight={ins("coverage_overtime_by_competitors")}
              analysis={analysisOf("coverage_overtime_by_competitors")}
              onOpenAnalysis={() =>
                openAnalysis(
                  "coverage_overtime_by_competitors",
                  byId.coverage_overtime_by_competitors.title,
                )
              }
              wide
            >
              <DynamicChartRenderer
                chart={formattedCoverageChart}
                dateInsights={dateIns("coverage_overtime_by_competitors")}
              />
            </ChartCard>
          )}
          <TabDynamicCharts activeTab="Coverage" ChartCardComp={ChartCard} DynamicRendererComp={DynamicChartRenderer} />
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
          <WhatsNext
            chapter={chapterFor("Coverage")}
            allChapters={chapters}
            onSwitchTab={setTab}
          />
        </div>
      )}

      {/* ── Sentiment ── */}
      {tab === "Sentiment" && (
        <div className="dashstack">
          <StoryboardPanel chapter={chapterFor("Sentiment")} />
          {byId.sentiment_breakdown_by_competitors && (
            <ChartCard
              title={byId.sentiment_breakdown_by_competitors.title}
              subtitle={byId.sentiment_breakdown_by_competitors.description}
              insight={ins("sentiment_breakdown_by_competitors")}
              analysis={analysisOf("sentiment_breakdown_by_competitors")}
              onOpenAnalysis={() =>
                openAnalysis(
                  "sentiment_breakdown_by_competitors",
                  byId.sentiment_breakdown_by_competitors.title,
                )
              }
              wide
            >
              <DynamicChartRenderer chart={formattedSentimentChart} />
            </ChartCard>
          )}
          <TabDynamicCharts activeTab="Sentiment" ChartCardComp={ChartCard} DynamicRendererComp={DynamicChartRenderer} />
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
          <WhatsNext
            chapter={chapterFor("Sentiment")}
            allChapters={chapters}
            onSwitchTab={setTab}
          />
        </div>
      )}

      {/* ── Message Consistency ── */}
      {tab === "Message Consistency" && (
        <div className="dashstack">
          <StoryboardPanel chapter={chapterFor("Message Consistency")} />
          <div className="chartgrid">
            {byId.message_consistency && (
              <ChartCard
                title={byId.message_consistency.title}
                subtitle={byId.message_consistency.description}
                insight={ins("message_consistency")}
                analysis={analysisOf("message_consistency")}
                onOpenAnalysis={() =>
                  openAnalysis(
                    "message_consistency",
                    byId.message_consistency.title,
                  )
                }
              >
                <DynamicChartRenderer chart={byId.message_consistency} />
              </ChartCard>
            )}
          </div>
          {byId.coverage_message_consistency && (
            <ChartCard
              title={byId.coverage_message_consistency.title}
              subtitle={byId.coverage_message_consistency.description}
              insight={ins("coverage_message_consistency")}
              analysis={analysisOf("coverage_message_consistency")}
              onOpenAnalysis={() =>
                openAnalysis(
                  "coverage_message_consistency",
                  byId.coverage_message_consistency.title,
                )
              }
              wide
            >
              <DynamicChartRenderer
                chart={formattedConsistencyTimeChart}
                dateInsights={dateIns("coverage_message_consistency")}
              />
            </ChartCard>
          )}
          <TabDynamicCharts activeTab="Message Consistency" ChartCardComp={ChartCard} DynamicRendererComp={DynamicChartRenderer} />
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
          <WhatsNext
            chapter={chapterFor("Message Consistency")}
            allChapters={chapters}
            onSwitchTab={setTab}
          />
        </div>
      )}

      {/* ── Channels & Publications ── */}
      {tab === "Channels & Publications" && (
        <div className="dashstack">
          <StoryboardPanel chapter={chapterFor("Channels & Publications")} />
          <div className="chartgrid">
            {byId.publication_by_brands_and_competitors && (
              <ChartCard
                title={byId.publication_by_brands_and_competitors.title}
                subtitle={
                  byId.publication_by_brands_and_competitors.description
                }
                insight={ins("publication_by_brands_and_competitors")}
                analysis={analysisOf("publication_by_brands_and_competitors")}
                onOpenAnalysis={() =>
                  openAnalysis(
                    "publication_by_brands_and_competitors",
                    byId.publication_by_brands_and_competitors.title,
                  )
                }
              >
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 12 }}
                >
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {brandsList.map((b) => (
                      <button
                        key={b}
                        className={`preset-chip ${selectedBrand === b ? "active" : ""}`}
                        onClick={() => setSelectedBrand(b)}
                        style={{ padding: "4px 10px", fontSize: "11px" }}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                  <DynamicChartRenderer chart={selectedBrandChart} />
                </div>
              </ChartCard>
            )}
            {byId.media_types_by_competitors && (
              <ChartCard
                title={byId.media_types_by_competitors.title}
                subtitle={byId.media_types_by_competitors.description}
                insight={ins("media_types_by_competitors")}
                analysis={analysisOf("media_types_by_competitors")}
                onOpenAnalysis={() =>
                  openAnalysis(
                    "media_types_by_competitors",
                    byId.media_types_by_competitors.title,
                  )
                }
              >
                <DynamicChartRenderer chart={byId.media_types_by_competitors} />
              </ChartCard>
            )}
          </div>
          <TabDynamicCharts activeTab="Channels & Publications" ChartCardComp={ChartCard} DynamicRendererComp={DynamicChartRenderer} />
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
          <WhatsNext
            chapter={chapterFor("Channels & Publications")}
            allChapters={chapters}
            onSwitchTab={setTab}
          />
        </div>
      )}

      {/* ── Custom Dynamic Tabs Created by Chatbot ── */}
      {customTabsData[tab] && !TABS.includes(tab) && (
        <div className="dashstack">
          <div className="chartgrid">
            {customTabsData[tab].map((c, i) => (
              <ChartCard key={c.chart_id || i} title={c.title} subtitle={c.description} wide>
                <DynamicChartRenderer chart={c} />
              </ChartCard>
            ))}
          </div>
          <WhatsNext
            chapter={chapterFor(tab)}
            allChapters={chapters}
            onSwitchTab={setTab}
          />
        </div>
      )}
    </>
  );
}
