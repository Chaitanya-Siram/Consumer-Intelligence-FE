import { useMemo } from "react";
import { Rich } from "../../utils/text.jsx";
import {
  DynamicChartRenderer,
  ChartCard,
} from "../../components/CustomChartWidgets.jsx";
import {
  StoryboardPanel,
  WhatsNext,
} from "../../components/StoryboardPanel.jsx";
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
  sentiment,
  coverage,
  shareOfVoice,
  activeVideoSrc,
  hero,
  TABS,
  stats,
  mergedPRImpactChart,
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
              <div className="kpi__val">{nf(totalCount)}</div>
              <div className="kpi__lbl">Total Articles</div>
            </div>
            <div className="kpi">
              <div className="kpi__val">{compact(totalReach)}</div>
              <div className="kpi__lbl">Total Reach</div>
            </div>
            <div className="kpi">
              <div className="kpi__val">
                {sentiment?.data?.net_sentiment_score ?? "—"}%
              </div>
              <div className="kpi__lbl">Net Sentiment</div>
            </div>
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
            {shareOfVoice && (
              <ChartCard
                title={shareOfVoice.title}
                subtitle={shareOfVoice.description}
                insight={ins("share_of_voice")}
                analysis={analysisOf("share_of_voice")}
                onOpenAnalysis={() =>
                  openAnalysis("share_of_voice", shareOfVoice.title)
                }
              >
                <DynamicChartRenderer chart={shareOfVoice} />
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

      {/* ── Coverage & Sentiment ── */}
      {tab === "Coverage & Sentiment" && (
        <div className="dashstack">
          <StoryboardPanel chapter={chapterFor("Coverage & Sentiment")} />
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
          {sentiment && (
            <div className="chartgrid">
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
            </div>
          )}
          <TabDynamicCharts activeTab="Coverage & Sentiment" ChartCardComp={ChartCard} DynamicRendererComp={DynamicChartRenderer} />
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
            chapter={chapterFor("Coverage & Sentiment")}
            allChapters={chapters}
            onSwitchTab={setTab}
          />
        </div>
      )}

      {/* ── Share of Voice ── */}
      {tab === "Share of Voice" && (
        <div className="dashstack">
          <StoryboardPanel chapter={chapterFor("Share of Voice")} />
          <div className="chartgrid">
            {shareOfVoice && (
              <ChartCard
                title={shareOfVoice.title}
                subtitle={shareOfVoice.description}
                insight={ins("share_of_voice")}
                analysis={analysisOf("share_of_voice")}
                onOpenAnalysis={() =>
                  openAnalysis("share_of_voice", shareOfVoice.title)
                }
              >
                <DynamicChartRenderer chart={shareOfVoice} />
              </ChartCard>
            )}
            {byId.publication_tier && (
              <ChartCard
                title={byId.publication_tier.title}
                subtitle={byId.publication_tier.description}
                insight={ins("publication_tier")}
                analysis={analysisOf("publication_tier")}
                onOpenAnalysis={() =>
                  openAnalysis("publication_tier", byId.publication_tier.title)
                }
              >
                <DynamicChartRenderer chart={byId.publication_tier} />
              </ChartCard>
            )}
          </div>
          <TabDynamicCharts activeTab="Share of Voice" ChartCardComp={ChartCard} DynamicRendererComp={DynamicChartRenderer} />
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
            chapter={chapterFor("Share of Voice")}
            allChapters={chapters}
            onSwitchTab={setTab}
          />
        </div>
      )}

      {/* ── PR Impact ── */}
      {tab === "PR Impact" && (
        <div className="dashstack">
          <StoryboardPanel chapter={chapterFor("PR Impact")} />
          <div className="kpirow">
            <div className="kpi">
              <div className="kpi__val">
                {(byId.pr_impact?.data?.gauge ?? 0).toFixed(2)}
              </div>
              <div className="kpi__lbl">Average PR Score Gauge</div>
            </div>
            <div className="kpi">
              <div className="kpi__val">
                {byId.pr_impact?.data?.rating_scale ?? "—"}
              </div>
              <div className="kpi__lbl">PR Rating Scale</div>
            </div>
          </div>
          {byId.pr_impact && (
            <ChartCard
              title={byId.pr_impact.title}
              subtitle={byId.pr_impact.description}
              insight={ins("pr_impact")}
              analysis={analysisOf("pr_impact")}
              onOpenAnalysis={() =>
                openAnalysis("pr_impact", byId.pr_impact.title)
              }
              wide
            >
              <DynamicChartRenderer chart={byId.pr_impact} />
            </ChartCard>
          )}
          <TabDynamicCharts activeTab="PR Impact" ChartCardComp={ChartCard} DynamicRendererComp={DynamicChartRenderer} />
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
            chapter={chapterFor("PR Impact")}
            allChapters={chapters}
            onSwitchTab={setTab}
          />
        </div>
      )}

      {/* ── Competitive ── */}
      {tab === "Competitive" && (
        <div className="dashstack">
          <StoryboardPanel chapter={chapterFor("Competitive")} />
          {/* <div className="chartgrid"> */}
          {byId.pr_impact_competitors && (
            <ChartCard
              title="PR Score Trend vs Competitors"
              subtitle="Daily PR score comparison with Ford."
              insight={ins("pr_impact_competitors")}
              analysis={analysisOf("pr_impact_competitors")}
              onOpenAnalysis={() =>
                openAnalysis(
                  "pr_impact_competitors",
                  "PR Score Trend vs Competitors",
                )
              }
            >
              <DynamicChartRenderer chart={mergedPRImpactChart} />
            </ChartCard>
          )}
          {byId.competitive_matrix && (
            <ChartCard
              title={byId.competitive_matrix.title}
              subtitle={byId.competitive_matrix.description}
              insight={ins("competitive_matrix")}
              analysis={analysisOf("competitive_matrix")}
              onOpenAnalysis={() =>
                openAnalysis(
                  "competitive_matrix",
                  byId.competitive_matrix.title,
                )
              }
            >
              <DynamicChartRenderer chart={byId.competitive_matrix} />
            </ChartCard>
          )}
          {/* </div> */}
          <TabDynamicCharts activeTab="Competitive" ChartCardComp={ChartCard} DynamicRendererComp={DynamicChartRenderer} />
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
            chapter={chapterFor("Competitive")}
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
