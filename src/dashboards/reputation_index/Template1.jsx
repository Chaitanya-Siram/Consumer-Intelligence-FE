import { useMemo } from "react";
import { Rich } from "../../utils/text.jsx";
import { DynamicChartRenderer, ChartCard } from "../../components/CustomChartWidgets.jsx";
import {
  StoryboardPanel,
  WhatsNext,
} from "../../components/StoryboardPanel.jsx";
import { useDynamicCharts, TabDynamicCharts } from "../../utils/dynamicChartManager.js";

const PILLARS_LIST = ["Trust", "Value", "Advocacy", "Social", "Brand", "Risk"];

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

          <div className="kpirow">
            <div className="kpi">
              <div
                className="kpi__val"
                style={{
                  color: riGauge.band === "red" ? "#ef4444" : "var(--accent-a)",
                }}
              >
                {riGauge.value ?? "—"}
              </div>
              <div className="kpi__lbl">Reputation Score</div>
            </div>
            <div className="kpi">
              <div
                className="kpi__val"
                style={{ color: riGauge.delta > 0 ? "#10b981" : "#ef4444" }}
              >
                {riGauge.delta > 0
                  ? `+${riGauge.delta}`
                  : (riGauge.delta ?? "—")}
              </div>
              <div className="kpi__lbl">Delta vs Prior</div>
            </div>
            <div className="kpi">
              <div className="kpi__val">
                {riGauge.band ? String(riGauge.band).toUpperCase() : "—"}
              </div>
              <div className="kpi__lbl">Risk Band</div>
            </div>
          </div>

          <div className="chartgrid">
            {byId.ri_timeseries && (
              <ChartCard
                title={byId.ri_timeseries.title}
                subtitle={byId.ri_timeseries.description}
                insight={ins("ri_timeseries")}
                analysis={analysisOf("ri_timeseries")}
                onOpenAnalysis={() =>
                  openAnalysis("ri_timeseries", byId.ri_timeseries.title)
                }
              >
                <DynamicChartRenderer
                  chart={formattedTimeseriesChart}
                  dateInsights={dateIns("ri_timeseries")}
                />
              </ChartCard>
            )}
            {byId.pillar_radar && (
              <ChartCard
                title={byId.pillar_radar.title}
                subtitle={byId.pillar_radar.description}
                insight={ins("pillar_radar")}
                analysis={analysisOf("pillar_radar")}
                onOpenAnalysis={() =>
                  openAnalysis("pillar_radar", byId.pillar_radar.title)
                }
              >
                <DynamicChartRenderer chart={byId.pillar_radar} />
              </ChartCard>
            )}
          </div>

          {byId.trust_waterfall && (
            <ChartCard
              title={byId.trust_waterfall.title}
              subtitle={byId.trust_waterfall.description}
              insight={ins("trust_waterfall")}
              analysis={analysisOf("trust_waterfall")}
              onOpenAnalysis={() =>
                openAnalysis("trust_waterfall", byId.trust_waterfall.title)
              }
              wide
            >
              <DynamicChartRenderer chart={byId.trust_waterfall} />
            </ChartCard>
          )}
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

      {/* ── Pillar Analysis ── */}
      {tab === "Pillar Analysis" && (
        <div className="dashstack">
          <StoryboardPanel chapter={chapterFor("Pillar Analysis")} />
          <div className="chartgrid">
            {byId.pillar_radar && (
              <ChartCard
                title={byId.pillar_radar.title}
                subtitle={byId.pillar_radar.description}
                insight={ins("pillar_radar")}
                analysis={analysisOf("pillar_radar")}
                onOpenAnalysis={() =>
                  openAnalysis("pillar_radar", byId.pillar_radar.title)
                }
              >
                <DynamicChartRenderer chart={byId.pillar_radar} />
              </ChartCard>
            )}
            {byId.pillar_bar && (
              <ChartCard
                title={byId.pillar_bar.title}
                subtitle={byId.pillar_bar.description}
                insight={ins("pillar_bar")}
                analysis={analysisOf("pillar_bar")}
                onOpenAnalysis={() =>
                  openAnalysis("pillar_bar", byId.pillar_bar.title)
                }
              >
                <DynamicChartRenderer chart={byId.pillar_bar} />
              </ChartCard>
            )}
          </div>
          {byId.pillar_small_multiples && (
            <ChartCard
              title={byId.pillar_small_multiples.title}
              subtitle={byId.pillar_small_multiples.description}
              insight={ins("pillar_small_multiples")}
              analysis={analysisOf("pillar_small_multiples")}
              onOpenAnalysis={() =>
                openAnalysis(
                  "pillar_small_multiples",
                  byId.pillar_small_multiples.title,
                )
              }
              wide
            >
              <DynamicChartRenderer chart={formattedSmallMultiplesChart} />
            </ChartCard>
          )}
          <TabDynamicCharts activeTab="Pillar Analysis" ChartCardComp={ChartCard} DynamicRendererComp={DynamicChartRenderer} />
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
            chapter={chapterFor("Pillar Analysis")}
            allChapters={chapters}
            onSwitchTab={setTab}
          />
        </div>
      )}

      {/* ── Trust & Sentiment ── */}
      {tab === "Trust & Sentiment" && (
        <div className="dashstack">
          <StoryboardPanel chapter={chapterFor("Trust & Sentiment")} />
          <div className="chartgrid">
            {byId.trust_kpi_breakdown && (
              <ChartCard
                title={byId.trust_kpi_breakdown.title}
                subtitle={byId.trust_kpi_breakdown.description}
                insight={ins("trust_kpi_breakdown")}
                analysis={analysisOf("trust_kpi_breakdown")}
                onOpenAnalysis={() =>
                  openAnalysis(
                    "trust_kpi_breakdown",
                    byId.trust_kpi_breakdown.title,
                  )
                }
              >
                <DynamicChartRenderer chart={byId.trust_kpi_breakdown} />
              </ChartCard>
            )}
            {byId.trust_waterfall && (
              <ChartCard
                title={byId.trust_waterfall.title}
                subtitle={byId.trust_waterfall.description}
                insight={ins("trust_waterfall")}
                analysis={analysisOf("trust_waterfall")}
                onOpenAnalysis={() =>
                  openAnalysis("trust_waterfall", byId.trust_waterfall.title)
                }
              >
                <DynamicChartRenderer chart={byId.trust_waterfall} />
              </ChartCard>
            )}
          </div>
          <div className="chartgrid">
            {byId.sentiment_coverage && (
              <ChartCard
                title={byId.sentiment_coverage.title}
                subtitle={byId.sentiment_coverage.description}
                insight={ins("sentiment_coverage")}
                analysis={analysisOf("sentiment_coverage")}
                onOpenAnalysis={() =>
                  openAnalysis(
                    "sentiment_coverage",
                    byId.sentiment_coverage.title,
                  )
                }
              >
                <DynamicChartRenderer chart={formattedSentimentCoverageChart} />
              </ChartCard>
            )}
            {byId.net_sentiment_coverage && (
              <ChartCard
                title={byId.net_sentiment_coverage.title}
                subtitle={byId.net_sentiment_coverage.description}
                insight={ins("net_sentiment_coverage")}
                analysis={analysisOf("net_sentiment_coverage")}
                onOpenAnalysis={() =>
                  openAnalysis(
                    "net_sentiment_coverage",
                    byId.net_sentiment_coverage.title,
                  )
                }
              >
                <DynamicChartRenderer
                  chart={formattedNetSentimentChart}
                  dateInsights={dateIns("net_sentiment_coverage")}
                />
              </ChartCard>
            )}
          </div>
          <TabDynamicCharts activeTab="Trust & Sentiment" ChartCardComp={ChartCard} DynamicRendererComp={DynamicChartRenderer} />
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
            chapter={chapterFor("Trust & Sentiment")}
            allChapters={chapters}
            onSwitchTab={setTab}
          />
        </div>
      )}

      {/* ── Media Coverage ── */}
      {tab === "Media Coverage" && (
        <div className="dashstack">
          <StoryboardPanel chapter={chapterFor("Media Coverage")} />
          <div className="chartgrid">
            {byId.coverage_volume && (
              <ChartCard
                title={byId.coverage_volume.title}
                subtitle={byId.coverage_volume.description}
                insight={ins("coverage_volume")}
                analysis={analysisOf("coverage_volume")}
                onOpenAnalysis={() =>
                  openAnalysis("coverage_volume", byId.coverage_volume.title)
                }
              >
                <DynamicChartRenderer chart={byId.coverage_volume} />
              </ChartCard>
            )}
            {byId.tier1_share && (
              <ChartCard
                title={byId.tier1_share.title}
                subtitle={byId.tier1_share.description}
                insight={ins("tier1_share")}
                analysis={analysisOf("tier1_share")}
                onOpenAnalysis={() =>
                  openAnalysis("tier1_share", byId.tier1_share.title)
                }
              >
                <DynamicChartRenderer chart={formattedTier1ShareChart} />
              </ChartCard>
            )}
          </div>
          <div className="chartgrid">
            {byId.source_treemap && (
              <ChartCard
                title={byId.source_treemap.title}
                subtitle={byId.source_treemap.description}
                insight={ins("source_treemap")}
                analysis={analysisOf("source_treemap")}
                onOpenAnalysis={() =>
                  openAnalysis("source_treemap", byId.source_treemap.title)
                }
              >
                <DynamicChartRenderer chart={byId.source_treemap} />
              </ChartCard>
            )}
            {byId.theme_volume && (
              <ChartCard
                title={byId.theme_volume.title}
                subtitle={byId.theme_volume.description}
                insight={ins("theme_volume")}
                analysis={analysisOf("theme_volume")}
                onOpenAnalysis={() =>
                  openAnalysis("theme_volume", byId.theme_volume.title)
                }
              >
                <DynamicChartRenderer chart={byId.theme_volume} />
              </ChartCard>
            )}
          </div>
          {byId.theme_pillar_heatmap && (
            <ChartCard
              title={byId.theme_pillar_heatmap.title}
              subtitle={byId.theme_pillar_heatmap.description}
              insight={ins("theme_pillar_heatmap")}
              analysis={analysisOf("theme_pillar_heatmap")}
              onOpenAnalysis={() =>
                openAnalysis(
                  "theme_pillar_heatmap",
                  byId.theme_pillar_heatmap.title,
                )
              }
              wide
            >
              <DynamicChartRenderer chart={byId.theme_pillar_heatmap} />
            </ChartCard>
          )}
          <TabDynamicCharts activeTab="Media Coverage" ChartCardComp={ChartCard} DynamicRendererComp={DynamicChartRenderer} />
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
            chapter={chapterFor("Media Coverage")}
            allChapters={chapters}
            onSwitchTab={setTab}
          />
        </div>
      )}

      {/* ── Risk & Sensitivity ── */}
      {tab === "Risk & Sensitivity" && (
        <div className="dashstack">
          <StoryboardPanel chapter={chapterFor("Risk & Sensitivity")} />
          <div className="chartgrid">
            {byId.risk_negative_coverage && (
              <ChartCard
                title={byId.risk_negative_coverage.title}
                subtitle={byId.risk_negative_coverage.description}
                insight={ins("risk_negative_coverage")}
                analysis={analysisOf("risk_negative_coverage")}
                onOpenAnalysis={() =>
                  openAnalysis(
                    "risk_negative_coverage",
                    byId.risk_negative_coverage.title,
                  )
                }
              >
                <DynamicChartRenderer
                  chart={formattedRiskNegativeChart}
                  dateInsights={dateIns("risk_negative_coverage")}
                />
              </ChartCard>
            )}
            {byId.weight_sensitivity && (
              <ChartCard
                title={byId.weight_sensitivity.title}
                subtitle={byId.weight_sensitivity.description}
                insight={ins("weight_sensitivity")}
                analysis={analysisOf("weight_sensitivity")}
                onOpenAnalysis={() =>
                  openAnalysis(
                    "weight_sensitivity",
                    byId.weight_sensitivity.title,
                  )
                }
              >
                <DynamicChartRenderer chart={byId.weight_sensitivity} />
              </ChartCard>
            )}
          </div>
          {byId.ri_decomposition_coverage && (
            <ChartCard
              title={byId.ri_decomposition_coverage.title}
              subtitle={byId.ri_decomposition_coverage.description}
              insight={ins("ri_decomposition_coverage")}
              analysis={analysisOf("ri_decomposition_coverage")}
              onOpenAnalysis={() =>
                openAnalysis(
                  "ri_decomposition_coverage",
                  byId.ri_decomposition_coverage.title,
                )
              }
              wide
            >
              <DynamicChartRenderer chart={formattedDecompositionChart} />
            </ChartCard>
          )}
          <TabDynamicCharts activeTab="Risk & Sensitivity" ChartCardComp={ChartCard} DynamicRendererComp={DynamicChartRenderer} />
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
            chapter={chapterFor("Risk & Sensitivity")}
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
