import Template5Core, { deriveSentiment, deriveThemeRows } from "../template5/parts.jsx";

const TABS = [
  "Overview",
  "Trust & Sentiment",
  "Pillar Analysis",
  "Risk & Sensitivity",
  "Media Coverage",
];

function sparkPath(vals, w = 140, h = 34) {
  const max = Math.max(...vals, 1);
  const step = w / (vals.length - 1);
  return vals.map((v, i) => `${i === 0 ? 'M' : 'L'} ${(i * step).toFixed(1)} ${(h - (v / max) * h).toFixed(1)}`).join(' ');
}

export default function Template5(props) {
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

  const sentimentDerived = deriveSentiment(byId.sentiment_coverage) || { pos: 0, neg: 0, neu: 0, net: 0, total: 0 };
  const themeRows = deriveThemeRows(byId.theme_volume);

  const kpis = [
    { 
      label: "Reputation Index", 
      value: riGauge?.value ?? "—", 
      icon: "fa-solid fa-gauge-high", 
      iconBg: riGauge?.band === "red" ? "rgba(196,34,41,0.14)" : riGauge?.band === "green" ? "rgba(63,212,122,0.16)" : "rgba(30,95,232,0.14)", 
      iconFg: riGauge?.band === "red" ? "var(--iv-vision-red)" : riGauge?.band === "green" ? "var(--iv-green-bright)" : "var(--iv-royal)",
      sparkPath: sparkPath([5, 6, 5, 7, 6, 8, 7, 7, 8, 8, 9], 140, 34)
    },
    { 
      label: "Delta vs Prior", 
      value: riGauge?.delta != null ? `${riGauge.delta > 0 ? "+" : ""}${riGauge.delta}` : "0.0", 
      icon: "fa-solid fa-clock-rotate-left", 
      iconBg: (riGauge?.delta || 0) >= 0 ? "rgba(63,212,122,0.16)" : "rgba(196,34,41,0.14)", 
      iconFg: (riGauge?.delta || 0) >= 0 ? "var(--iv-green-bright)" : "var(--iv-vision-red)",
      sparkPath: sparkPath([2, 2, 3, 3, 5, 5, 4, 4, 6, 6, 7], 140, 34)
    },
    { 
      label: "Pillar Average", 
      value: "74.8", 
      icon: "fa-solid fa-landmark", 
      iconBg: "rgba(43,184,245,0.16)", 
      iconFg: "var(--iv-cyan-bright)",
      sparkPath: sparkPath([4, 5, 5, 6, 6, 7, 6, 8, 7, 8, 8], 140, 34)
    },
    { 
      label: "Neutral Share", 
      value: `${Math.round(sentimentDerived.neu || 0)}%`, 
      icon: "fa-solid fa-scale-balanced", 
      iconBg: "rgba(63,212,122,0.16)", 
      iconFg: "var(--iv-green-bright)",
      sparkPath: sparkPath([8, 8, 7, 8, 8, 7, 8, 8, 7, 8, 9], 140, 34)
    }
  ];

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
    <Template5Core
      brandLabel={project?.name || "Reputation Index"}
      onBack={onBack}
      templateMode={templateMode}
      onChangeTemplate={onChangeTemplate}
      hero={hero}
      activeVideoSrc={activeVideoSrc}
      tabs={TABS}
      tab={tab}
      setTab={setTab}
      kpis={kpis}
      findings={findings}
      centerByTab={centerByTab}
      chapters={props.chapters}
      overall={overall}
    />
  );
}
