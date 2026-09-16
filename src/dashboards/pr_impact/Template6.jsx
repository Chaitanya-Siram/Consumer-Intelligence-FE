import Template6Core, { compact, deriveSentiment, deriveThemeRows } from "../template6/parts.jsx";

const TABS = [
  "Overview",
  "Coverage & Sentiment",
  "Share of Voice",
  "PR Impact",
  "Competitive",
];

function sparkPath(vals, w = 140, h = 34) {
  const max = Math.max(...vals, 1);
  const step = w / (vals.length - 1);
  return vals.map((v, i) => `${i === 0 ? 'M' : 'L'} ${(i * step).toFixed(1)} ${(h - (v / max) * h).toFixed(1)}`).join(' ');
}

export default function Template6(props) {
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
    sentiment,
    coverage,
    shareOfVoice,
    mergedPRImpactChart,
    totalCount,
    totalReach,
  } = props;

  const sentimentDerived = deriveSentiment(sentiment) || { pos: 0, neg: 0, neu: 0, net: 0, total: 0 };
  const themeRows = deriveThemeRows(shareOfVoice);

  const kpis = [
    { 
      label: "Total Volume", 
      value: compact(totalCount || 0), 
      icon: "fa-solid fa-file-text", 
      iconBg: "rgba(30,95,232,0.14)", 
      iconFg: "var(--iv-royal)",
      sparkPath: sparkPath([1, 2, 4, 3, 5, 6, 8, 7, 9, 8, 10], 140, 34)
    },
    { 
      label: "Net Sentiment", 
      value: `${Math.round(sentimentDerived.net || 0)}%`, 
      icon: "fa-solid fa-heart-pulse", 
      iconBg: "rgba(196,34,41,0.14)", 
      iconFg: "var(--iv-vision-red)",
      sparkPath: sparkPath([6, 5, 7, 4, 8, 6, 9, 5, 10, 4, 11], 140, 34)
    },
    { 
      label: "Aggregate Reach", 
      value: compact(totalReach || 0), 
      icon: "fa-solid fa-radio", 
      iconBg: "rgba(43,184,245,0.16)", 
      iconFg: "var(--iv-cyan-bright)",
      sparkPath: sparkPath([2, 4, 3, 5, 4, 7, 5, 8, 7, 9, 10], 140, 34)
    },
    { 
      label: "Neutral Share", 
      value: `${Math.round(sentimentDerived.neu || 0)}%`, 
      icon: "fa-solid fa-scale-balanced", 
      iconBg: "rgba(63,212,122,0.16)", 
      iconFg: "var(--iv-green-bright)",
      sparkPath: sparkPath([7, 8, 8, 7, 8, 8, 7, 8, 8, 7, 8], 140, 34)
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
      coverage && card("Coverage Over Time", coverage.description, coverage, "datewise_coverage"),
      sentiment && card("Sentiment Distribution", sentiment.description, sentiment, "sentiment_distribution"),
      byId.pr_impact && card("PR Impact Scale", byId.pr_impact.description, byId.pr_impact, "pr_impact"),
      shareOfVoice && card("Share of Voice", shareOfVoice.description, shareOfVoice, "share_of_voice"),
    ].filter(Boolean),
    "Coverage & Sentiment": [
      coverage && card("Coverage Over Time", coverage.description, coverage, "datewise_coverage"),
      sentiment && card("Sentiment Distribution", sentiment.description, sentiment, "sentiment_distribution"),
    ].filter(Boolean),
    "Share of Voice": [
      shareOfVoice && card("Share of Voice", shareOfVoice.description, shareOfVoice, "share_of_voice"),
    ].filter(Boolean),
    "PR Impact": [
      byId.pr_impact && card("PR Impact Scale", byId.pr_impact.description, byId.pr_impact, "pr_impact"),
      mergedPRImpactChart && card("PR Comparison", "Brand performance vs competitors", mergedPRImpactChart),
    ].filter(Boolean),
    Competitive: [
      byId.competitive_matrix && card(byId.competitive_matrix.title || "Competitive Matrix", byId.competitive_matrix.description, byId.competitive_matrix, "competitive_matrix"),
      byId.publication_tier && card(byId.publication_tier.title || "Publication Tier", byId.publication_tier.description, byId.publication_tier, "publication_tier"),
    ].filter(Boolean),
  };

  const findings = [
    overall && { tag: "PR Impact", tone: "", body: overall },
    ins?.("sentiment_distribution") && { tag: "Sentiment", tone: "neg", body: ins("sentiment_distribution") },
    ins?.("datewise_coverage") && { tag: "Coverage", tone: "", body: ins("datewise_coverage") },
    ins?.("share_of_voice") && { tag: "Share of Voice", tone: "amb", body: ins("share_of_voice") },
  ].filter(Boolean);

  return (
    <Template6Core
      brandLabel={project?.name || "PR Impact"}
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
