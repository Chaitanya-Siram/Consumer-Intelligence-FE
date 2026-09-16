import { TopNarrativesList } from "../../components/TopNarrativesList.jsx";
import Template6Core, { compact, deriveSentiment, deriveThemeRows } from "../template6/parts.jsx";

const TABS = [
  "Overview",
  "Sentiment",
  "Coverage",
  "Channels & Publications",
  "Message Consistency",
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
    totalCount,
    totalReach,
    formattedCoverageChart,
    formattedSentimentChart,
    formattedConsistencyTimeChart,
    topNarratives,
  } = props;

  const sentimentDerived = deriveSentiment(byId.sentiment_breakdown_by_competitors) || { pos: 0, neg: 0, neu: 0, net: 0, total: 0 };
  const themeRows = deriveThemeRows(byId.media_types_by_competitors);

  const kpis = [
    { 
      label: "Total Volume", 
      value: compact(totalCount || 0), 
      icon: "fa-solid fa-file-text", 
      iconBg: "rgba(30,95,232,0.14)", 
      iconFg: "var(--iv-royal)",
      sparkPath: sparkPath([3, 5, 4, 6, 8, 7, 9, 8, 10, 9, 11], 140, 34)
    },
    { 
      label: "Net Sentiment", 
      value: `${Math.round(sentimentDerived.net || 0)}%`, 
      icon: "fa-solid fa-heart-pulse", 
      iconBg: "rgba(196,34,41,0.14)", 
      iconFg: "var(--iv-vision-red)",
      sparkPath: sparkPath([4, 6, 3, 5, 2, 4, 3, 5, 4, 6, 7], 140, 34)
    },
    { 
      label: "Aggregate Reach", 
      value: compact(totalReach || 0), 
      icon: "fa-solid fa-radio", 
      iconBg: "rgba(43,184,245,0.16)", 
      iconFg: "var(--iv-cyan-bright)",
      sparkPath: sparkPath([1, 2, 4, 3, 5, 6, 8, 7, 9, 10, 11], 140, 34)
    },
    { 
      label: "Neutral Share", 
      value: `${Math.round(sentimentDerived.neu || 0)}%`, 
      icon: "fa-solid fa-scale-balanced", 
      iconBg: "rgba(63,212,122,0.16)", 
      iconFg: "var(--iv-green-bright)",
      sparkPath: sparkPath([8, 7, 8, 7, 8, 8, 7, 8, 8, 7, 8], 140, 34)
    }
  ];

  const card = (title, sub, chart, id, customRender) => ({
    title,
    sub,
    chart,
    children: customRender,
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
    <Template6Core
      brandLabel={project?.name || "Narrative Intelligence"}
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
