import Template5Core, { compact, deriveSentiment, deriveThemeRows } from "../template5/parts.jsx";

const TABS = [
  "Overview",
  "Sentiment Analysis",
  "Themes & Topics",
  "Media Coverage",
  "Key Stories",
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

  const sentimentDerived = deriveSentiment(sentiment) || { pos: 0, neg: 0, neu: 0, net: 0, total: 0 };
  const themeRows = deriveThemeRows(theme || formattedThemeChart);

  // KPIs matching standalone HTML
  const kpis = [
    { 
      label: "Total Volume", 
      value: compact(totalCount || 0), 
      icon: "fa-solid fa-file-text", 
      iconBg: "rgba(30,95,232,0.14)", 
      iconFg: "var(--iv-royal)",
      sparkPath: sparkPath([1, 3, 2, 5, 4, 7, 5, 8, 7, 9, 8], 140, 34)
    },
    { 
      label: "Net Sentiment", 
      value: `${Math.round(sentimentDerived.net || 0)}%`, 
      icon: "fa-solid fa-heart-pulse", 
      iconBg: "rgba(196,34,41,0.14)", 
      iconFg: "var(--iv-vision-red)",
      sparkPath: sparkPath([5, 4, 6, 3, 7, 5, 8, 4, 9, 3, 10], 140, 34)
    },
    { 
      label: "Aggregate Reach", 
      value: compact(totalReach || 0), 
      icon: "fa-solid fa-radio", 
      iconBg: "rgba(43,184,245,0.16)", 
      iconFg: "var(--iv-cyan-bright)",
      sparkPath: sparkPath([2, 5, 3, 6, 4, 8, 6, 7, 9, 8, 10], 140, 34)
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

  const renderStories = (data) => {
    if (!data) return <Empty />;
    const columns = [
      { key: 'POS', title: 'Positive Stories', color: 'var(--iv-green-bright)', icon: "fa-solid fa-face-smile" },
      { key: 'NEU', title: 'Neutral Stories', color: 'var(--iv-ink-500)', icon: "fa-solid fa-face-meh" },
      { key: 'NEG', title: 'Negative Stories', color: 'var(--iv-vision-red)', icon: "fa-solid fa-face-frown" }
    ];
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', width: '100%' }}>
        {columns.map(col => (
          <div key={col.key} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: col.color, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: `2px solid ${col.color}40`, paddingBottom: '0.5rem', display: "flex", alignItems: "center", gap: "6px" }}>
              <i className={col.icon}></i> {col.title}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {(data[col.key] || []).length === 0 ? (
                <div className="muted" style={{ fontSize: "12px", fontStyle: "italic" }}>No articles.</div>
              ) : (
                (data[col.key] || []).map((article, i) => (
                  <div key={i} style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.3)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.4)', backdropFilter: "blur(8px)" }}>
                    <div style={{ fontSize: '11px', color: 'var(--iv-ink-600)', marginBottom: '6px', fontWeight: 600 }}>
                      {article.domain} • {new Date(article.date).toLocaleDateString()}
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--iv-navy)', lineHeight: 1.4, marginBottom: '8px' }}>
                      {article.title}
                    </div>
                    <div style={{ fontSize: '12.5px', color: 'var(--iv-ink-700)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {article.content}
                    </div>
                  </div>
                ))
              )}
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
        renderStories(byId.top_articles_by_sentiment.data)
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
    <Template5Core
      brandLabel={project?.name || "Media Measurement"}
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
