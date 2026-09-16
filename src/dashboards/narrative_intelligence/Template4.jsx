import { TopNarrativesList } from "../../components/TopNarrativesList.jsx";
import Template4Core, {
  compact,
  deriveSentiment,
  deriveThemeRows,
} from "../template4/parts.jsx";

const TABS = [
  "Overview",
  "Sentiment",
  "Coverage",
  "Channels & Publications",
  "Message Consistency",
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
    totalCount,
    totalReach,
    formattedCoverageChart,
    formattedSentimentChart,
    formattedConsistencyTimeChart,
    topNarratives,
  } = props;

  const sentimentDerived = deriveSentiment(byId.sentiment_breakdown_by_competitors);
  const themeRows = deriveThemeRows(byId.media_types_by_competitors);

  const extraKpis = [
    { val: compact(totalCount), label: "Total Mentions", tone: "blue" },
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
      topNarratives?.length > 0 && { children: <TopNarrativesList narratives={topNarratives} /> },
      formattedCoverageChart && card("Coverage Over Time", "Volume across competitors", formattedCoverageChart, "coverage_overtime_by_competitors"),
      formattedSentimentChart && card("Sentiment by Competitor", "Tone breakdown across brands", formattedSentimentChart, "sentiment_breakdown_by_competitors"),
      byId.publication_by_brands_and_competitors && card("Publications by Brand", byId.publication_by_brands_and_competitors.description, byId.publication_by_brands_and_competitors, "publication_by_brands_and_competitors"),
    ].filter(Boolean),
    Sentiment: [
      formattedSentimentChart && card("Sentiment by Competitor", "Tone breakdown across brands", formattedSentimentChart, "sentiment_breakdown_by_competitors"),
      byId.sentiment_breakdown_by_competitors && card("Sentiment Breakdown", byId.sentiment_breakdown_by_competitors.description, byId.sentiment_breakdown_by_competitors, "sentiment_breakdown_by_competitors"),
    ].filter(Boolean),
    Coverage: [
      formattedCoverageChart && card("Coverage Over Time", "Volume across competitors", formattedCoverageChart, "coverage_overtime_by_competitors"),
      byId.coverage_overtime_by_competitors && card(byId.coverage_overtime_by_competitors.title || "Coverage by Competitor", byId.coverage_overtime_by_competitors.description, byId.coverage_overtime_by_competitors, "coverage_overtime_by_competitors"),
    ].filter(Boolean),
    "Channels & Publications": [
      byId.media_types_by_competitors && card("Media Types", byId.media_types_by_competitors.description, byId.media_types_by_competitors, "media_types_by_competitors"),
      byId.publication_by_brands_and_competitors && card("Publications by Brand", byId.publication_by_brands_and_competitors.description, byId.publication_by_brands_and_competitors, "publication_by_brands_and_competitors"),
    ].filter(Boolean),
    "Message Consistency": [
      byId.message_consistency && card(byId.message_consistency.title || "Message Consistency", byId.message_consistency.description, byId.message_consistency, "message_consistency"),
      formattedConsistencyTimeChart && card("Consistency Over Time", "Message alignment across the period", formattedConsistencyTimeChart, "coverage_message_consistency"),
    ].filter(Boolean),
  };

  const findings = [
    overall && { tag: "Narrative", tone: "", body: overall },
    ins?.("sentiment_breakdown_by_competitors") && { tag: "Sentiment", tone: "neg", body: ins("sentiment_breakdown_by_competitors") },
    ins?.("coverage_overtime_by_competitors") && { tag: "Coverage", tone: "", body: ins("coverage_overtime_by_competitors") },
    ins?.("message_consistency") && { tag: "Consistency", tone: "amb", body: ins("message_consistency") },
  ].filter(Boolean);

  return (
    <Template4Core
      brandLabel={project?.name || "Narrative Intelligence"}
      onBack={onBack}
      templateMode={templateMode}
      onChangeTemplate={onChangeTemplate}
      hero={hero}
      badges={[project?.name || "Narrative Intelligence"]}
      activeVideoSrc={activeVideoSrc}
      tabs={TABS}
      tab={tab}
      setTab={setTab}
      chapters={props.chapters}
      overall={overall}
      sentiment={sentimentDerived}
      extraKpis={extraKpis}
      themeRows={themeRows}
      themeLabel="Media Types"
      findings={findings}
      centerByTab={centerByTab}
    />
  );
}
