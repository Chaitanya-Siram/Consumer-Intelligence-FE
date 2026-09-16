import Template4Core, {
  compact,
  deriveSentiment,
  deriveThemeRows,
} from "../template4/parts.jsx";

const TABS = [
  "Overview",
  "Coverage & Sentiment",
  "Share of Voice",
  "PR Impact",
  "Competitive",
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
    sentiment,
    coverage,
    shareOfVoice,
    mergedPRImpactChart,
    totalCount,
    totalReach,
  } = props;

  const sentimentDerived = deriveSentiment(sentiment);
  const themeRows = deriveThemeRows(shareOfVoice);

  const extraKpis = [
    { val: compact(totalCount), label: "Total Articles", tone: "blue" },
    { val: compact(totalReach), label: "Total Reach" },
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
    <Template4Core
      brandLabel={project?.name || "PR Impact"}
      onBack={onBack}
      templateMode={templateMode}
      onChangeTemplate={onChangeTemplate}
      hero={hero}
      badges={[project?.name || "PR Impact"]}
      activeVideoSrc={activeVideoSrc}
      tabs={TABS}
      tab={tab}
      setTab={setTab}
      chapters={props.chapters}
      overall={overall}
      sentiment={sentimentDerived}
      extraKpis={extraKpis}
      themeRows={themeRows}
      themeLabel="Share of Voice"
      findings={findings}
      centerByTab={centerByTab}
    />
  );
}
