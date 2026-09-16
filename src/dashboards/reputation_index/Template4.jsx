import Template4Core, {
  deriveSentiment,
  deriveThemeRows,
} from "../template4/parts.jsx";

const TABS = [
  "Overview",
  "Trust & Sentiment",
  "Pillar Analysis",
  "Risk & Sensitivity",
  "Media Coverage",
];

export default function Template4(props) {
  const {
    onBack,
    project,
    templateMode,
    onChangeTemplate,
    tab,
    setTab,
    hero,
    activeVideoSrc,
    byId = {},
    ins,
    dateIns,
    analysisOf,
    openAnalysis,
    overall,
    riGauge,
    formattedTimeseriesChart,
    formattedDecompositionChart,
    formattedSmallMultiplesChart,
    formattedSentimentCoverageChart,
    formattedNetSentimentChart,
    formattedRiskNegativeChart,
  } = props;

  const sentimentDerived = deriveSentiment(byId.sentiment_coverage);
  const themeRows = deriveThemeRows(byId.theme_volume);

  const extraKpis = [
    {
      val: riGauge?.value ?? "—",
      label: "Reputation Index",
      tone: riGauge?.band === "red" ? "neg" : riGauge?.band === "green" ? "pos" : "blue",
      sub: riGauge?.rating || riGauge?.band || undefined,
    },
    riGauge?.delta != null && {
      val: `${riGauge.delta > 0 ? "+" : ""}${riGauge.delta}`,
      label: "Δ vs Prior",
      tone: riGauge.delta >= 0 ? "pos" : "neg",
    },
  ].filter(Boolean);

  const card = (title, sub, chart, id) => ({
    title,
    sub,
    chart,
    analysis: id ? !!analysisOf?.(id) : false,
    onOpenAnalysis: id ? () => openAnalysis?.(id, title) : undefined,
    insight: id ? ins?.(id) : undefined,
    dateInsights: id ? dateIns?.(id) : undefined,
  });

  const centerByTab = {
    Overview: [
      formattedTimeseriesChart && card("Reputation Over Time", "Index trend across the period", formattedTimeseriesChart, "ri_timeseries"),
      formattedNetSentimentChart && card("Net Sentiment", "Sentiment-weighted coverage", formattedNetSentimentChart, "net_sentiment_coverage"),
      byId.theme_volume && card("Theme Volume", byId.theme_volume.description, byId.theme_volume, "theme_volume"),
    ].filter(Boolean),
    "Trust & Sentiment": [
      byId.trust_waterfall && card(byId.trust_waterfall.title || "Trust Waterfall", byId.trust_waterfall.description, byId.trust_waterfall, "trust_waterfall"),
      byId.trust_kpi_breakdown && card(byId.trust_kpi_breakdown.title || "Trust KPI Breakdown", byId.trust_kpi_breakdown.description, byId.trust_kpi_breakdown, "trust_kpi_breakdown"),
      formattedSentimentCoverageChart && card("Sentiment × Coverage", "Tone against coverage volume", formattedSentimentCoverageChart, "sentiment_coverage"),
    ].filter(Boolean),
    "Pillar Analysis": [
      byId.pillar_bar && card(byId.pillar_bar.title || "Pillar Scores", byId.pillar_bar.description, byId.pillar_bar, "pillar_bar"),
      byId.pillar_radar && card(byId.pillar_radar.title || "Pillar Radar", byId.pillar_radar.description, byId.pillar_radar, "pillar_radar"),
      formattedSmallMultiplesChart && card("Pillar Trends", "Per-pillar movement", formattedSmallMultiplesChart, "pillar_small_multiples"),
    ].filter(Boolean),
    "Risk & Sensitivity": [
      formattedRiskNegativeChart && card("Risk: Negative Coverage", "Where exposure concentrates", formattedRiskNegativeChart, "risk_negative_coverage"),
      byId.weight_sensitivity && card(byId.weight_sensitivity.title || "Weight Sensitivity", byId.weight_sensitivity.description, byId.weight_sensitivity, "weight_sensitivity"),
      formattedDecompositionChart && card("Index Decomposition", "What drives the score", formattedDecompositionChart, "ri_decomposition_coverage"),
    ].filter(Boolean),
    "Media Coverage": [
      byId.coverage_volume && card(byId.coverage_volume.title || "Coverage Volume", byId.coverage_volume.description, byId.coverage_volume, "coverage_volume"),
      byId.source_treemap && card(byId.source_treemap.title || "Sources", byId.source_treemap.description, byId.source_treemap, "source_treemap"),
      byId.tier && card(byId.tier.title || "Publication Tier", byId.tier.description, byId.tier, "tier"),
    ].filter(Boolean),
  };

  const findings = [
    overall && { tag: "Reputation", tone: "", body: overall },
    ins?.("ri_timeseries") && { tag: "Trend", tone: "", body: ins("ri_timeseries") },
    ins?.("risk_negative_coverage") && { tag: "Risk", tone: "neg", body: ins("risk_negative_coverage") },
    ins?.("theme_volume") && { tag: "Themes", tone: "amb", body: ins("theme_volume") },
  ].filter(Boolean);

  return (
    <Template4Core
      brandLabel={project?.name || "Reputation Index"}
      onBack={onBack}
      templateMode={templateMode}
      onChangeTemplate={onChangeTemplate}
      hero={hero}
      badges={[project?.name || "Reputation Index"]}
      activeVideoSrc={activeVideoSrc}
      tabs={TABS}
      tab={tab}
      setTab={setTab}
      chapters={props.chapters}
      overall={overall}
      sentiment={sentimentDerived}
      extraKpis={extraKpis}
      themeRows={themeRows}
      themeLabel="Top Themes"
      findings={findings}
      centerByTab={centerByTab}
    />
  );
}
