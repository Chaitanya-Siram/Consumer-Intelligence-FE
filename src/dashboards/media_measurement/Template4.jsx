import Template4Core, {
  compact,
  deriveSentiment,
  deriveThemeRows,
} from "../template4/parts.jsx";

const TABS = [
  "Overview",
  "Sentiment Analysis",
  "Themes & Topics",
  "Media Coverage",
  "Key Stories",
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
    sentiment,
    coverage,
    theme,
    syndication,
    totalCount,
    totalReach,
    overall,
    formattedThemeChart,
    formattedSyndicationChart,
    formattedReachSentimentChart,
    formattedSentimentOverTimeChart,
  } = props;

  const sentimentDerived = deriveSentiment(sentiment);
  const themeRows = deriveThemeRows(theme || formattedThemeChart);

  const extraKpis = [
    { val: compact(totalCount), label: "Total Articles", tone: "blue" },
    { val: compact(totalReach), label: "Total Reach" },
  ];

  const card = (title, sub, chart, id, customRender, wide = false) => ({
    title,
    sub,
    chart,
    children: customRender,
    analysis: id ? !!analysisOf?.(id) : false,
    onOpenAnalysis: id ? () => openAnalysis?.(id, title) : undefined,
    insight: id ? ins?.(id) : undefined,
    dateInsights: id ? dateIns?.(id) : undefined,
    wide,
  });

  const renderT4Articles = (data) => {
    if (!data) return null;
    const columns = [
      { key: 'POS', title: 'Positive Stories', color: '#10b981' },
      { key: 'NEU', title: 'Neutral Stories', color: '#6b7280' },
      { key: 'NEG', title: 'Negative Stories', color: '#ef4444' }
    ];
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', width: '100%', marginTop: '1rem' }}>
        {columns.map(col => (
          <div key={col.key} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: col.color, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: `2px solid ${col.color}40`, paddingBottom: '0.5rem' }}>
              {col.title}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {(data[col.key] || []).map((article, i) => (
                <div key={i} style={{ padding: '1.25rem', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                   <div style={{ fontSize: '11px', color: 'var(--text-soft)', marginBottom: '6px', fontWeight: 600 }}>{article.domain} • {new Date(article.date).toLocaleDateString()}</div>
                   <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-strong)', lineHeight: 1.4, marginBottom: '8px' }}>{article.title}</div>
                   <div style={{ fontSize: '12.5px', color: 'var(--text-soft)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{article.content}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const dynamicCharts = props.dynamicCharts || [];
  const BASE_TABS = [
    "Overview",
    "Sentiment Analysis",
    "Themes & Topics",
    "Media Coverage",
    "Key Stories",
  ];
  const TABS = props.TABS || (dynamicCharts.length ? [...BASE_TABS, "Dynamic Charts"] : BASE_TABS);

  const centerByTab = {
    Overview: [
      coverage && card("Coverage Over Time", coverage.description, coverage, "datewise_coverage"),
      sentiment && card("Sentiment Distribution", sentiment.description, sentiment, "sentiment_distribution"),
      formattedThemeChart && card("Theme Distribution", "Conversation themes by volume", formattedThemeChart, "theme_distribution"),
      formattedSyndicationChart && card("Original vs Syndicated", syndication?.description, formattedSyndicationChart, "original_vs_syndicated"),
    ].filter(Boolean),
    "Sentiment Analysis": [
      sentiment && card("Sentiment Distribution", sentiment.description, sentiment, "sentiment_distribution"),
      formattedSentimentOverTimeChart && card("Sentiment Over Time", "Daily positive / neutral / negative split", formattedSentimentOverTimeChart, "sentiment_distribution"),
    ].filter(Boolean),
    "Themes & Topics": [
      (formattedThemeChart || theme) && card("Theme Distribution", theme?.description || "Which topics carried the volume", formattedThemeChart || theme, "theme_distribution"),
    ].filter(Boolean),
    "Media Coverage": [
      byId.top_publications && card("Top Publications", "Distribution of original coverage", byId.top_publications, "top_publications", null, true),
      formattedReachSentimentChart && card("Publication Reach × Sentiment", byId.publication_reach_sentiment?.description, formattedReachSentimentChart, "publication_reach_sentiment", null, true),
      byId.publish_time_heatmap && card(byId.publish_time_heatmap.title || "Publish Time", byId.publish_time_heatmap.description, byId.publish_time_heatmap, "publish_time_heatmap", null, true),
      byId.top_authors_by_publications && card("Top Authors", "Bylines with highest publication count", byId.top_authors_by_publications, "top_authors_by_publications", null, true),
    ].filter(Boolean),
    "Key Stories": [
      byId.top_articles_by_sentiment && card(
        byId.top_articles_by_sentiment.title || "Key Stories", 
        byId.top_articles_by_sentiment.description, 
        byId.top_articles_by_sentiment, 
        "top_articles_by_sentiment",
        renderT4Articles(byId.top_articles_by_sentiment.data)
      ),
    ].filter(Boolean),
    "Dynamic Charts": (dynamicCharts || []).map((c) =>
      card(c.title, c.description, c, c.chart_id || c.title)
    ),
  };

  const findings = [
    overall && { tag: "Overview", tone: "", body: overall },
    ins?.("datewise_coverage") && { tag: "Coverage", tone: "", body: ins("datewise_coverage") },
    ins?.("sentiment_distribution") && { tag: "Sentiment", tone: "neg", body: ins("sentiment_distribution") },
    ins?.("theme_distribution") && { tag: "Themes", tone: "amb", body: ins("theme_distribution") },
  ].filter(Boolean);

  return (
    <Template4Core
      brandLabel={project?.name || "Media Measurement"}
      onBack={onBack}
      templateMode={templateMode}
      onChangeTemplate={onChangeTemplate}
      hero={hero}
      badges={[project?.name || "Media Measurement"]}
      activeVideoSrc={activeVideoSrc}
      tabs={TABS}
      tab={tab}
      setTab={setTab}
      chapters={props.chapters}
      overall={overall}
      sentiment={sentimentDerived}
      extraKpis={extraKpis}
      themeRows={themeRows}
      findings={findings}
      centerByTab={centerByTab}
    />
  );
}
