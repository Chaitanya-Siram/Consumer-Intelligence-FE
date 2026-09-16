/**
 * dataAnalytics.js
 *
 * Pure-JS aggregator: takes a raw tagged-article array (from getTaggedArticles)
 * and produces chart-ready summaries for every widget kind used in BuilderScreen.
 * No mock data — every number here comes directly from the real articles.
 */

// ─── Helpers ────────────────────────────────────────────────────────────────

function toList(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(Boolean);
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {
      // not JSON — comma-separated
      return val.split(",").map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
}

function normalisedSentiment(article) {
  const raw = (article.sentiment || article.articlesentiment || "").toLowerCase().trim();
  if (!raw) return "Unassigned";
  if (raw.includes("pos")) return "Positive";
  if (raw.includes("neg")) return "Negative";
  if (raw.includes("neu")) return "Neutral";
  return "Unassigned";
}

/** Extract YYYY-MM-DD from any date string without relying on TZ-sensitive Date. */
function dayKey(dateStr) {
  if (!dateStr) return null;
  const m = String(dateStr).match(/(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

/** Derive a source label: domain from URL, or the publication field. */
function sourceLabel(article) {
  const pub = article.publication || article.source || article.outlet || "";
  if (pub) return pub.trim();
  try {
    const url = new URL(article.url || "");
    return url.hostname.replace(/^www\./, "");
  } catch {
    return "Unknown";
  }
}

// ─── Main export ────────────────────────────────────────────────────────────

/**
 * Compute all analytics from a tagged-article array.
 *
 * @param {object[]} articles  Raw array from getTaggedArticles()
 * @returns {Analytics}
 */
export function computeAnalytics(articles) {
  if (!Array.isArray(articles) || articles.length === 0) {
    return emptyAnalytics();
  }

  // ── Sentiment ──────────────────────────────────────────────────────────────
  const sentimentCounts = { Positive: 0, Negative: 0, Neutral: 0, Unassigned: 0 };
  for (const a of articles) {
    sentimentCounts[normalisedSentiment(a)]++;
  }
  const SENTIMENT_COLORS = {
    Positive: "#10b981",
    Negative: "#ef4444",
    Neutral: "#64748b",
    Unassigned: "#cbd5e1",
  };

  const sentimentData = Object.entries(sentimentCounts)
    .filter(([, v]) => v > 0)
    .map(([label, value]) => ({
      label,
      value,
      color: SENTIMENT_COLORS[label] || "#64748b",
    }));

  // ── Themes ────────────────────────────────────────────────────────────────
  const themeCounts = {};
  for (const a of articles) {
    const theme = (a.theme || a.category || "").trim();
    if (theme) themeCounts[theme] = (themeCounts[theme] || 0) + 1;
  }
  const themeDistribution = Object.entries(themeCounts)
    .map(([theme, count]) => ({ theme, articles: count }))
    .sort((a, b) => b.articles - a.articles)
    .slice(0, 10);

  // ── Coverage over time (daily article count) ───────────────────────────────
  const dateCounts = {};
  for (const a of articles) {
    const d = dayKey(a.date || a.published_at || a.created_at);
    if (d) dateCounts[d] = (dateCounts[d] || 0) + 1;
  }
  const coverageOverTime = Object.entries(dateCounts)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, value]) => ({ date, value }));

  // ── Top publications ───────────────────────────────────────────────────────
  const pubCounts = {};
  for (const a of articles) {
    const src = sourceLabel(a);
    pubCounts[src] = (pubCounts[src] || 0) + 1;
  }
  const topPublications = Object.entries(pubCounts)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // ── Brand mentions ─────────────────────────────────────────────────────────
  const brandCounts = {};
  for (const a of articles) {
    for (const b of toList(a.brand_of_interest)) {
      brandCounts[b] = (brandCounts[b] || 0) + 1;
    }
  }
  const brandMentions = Object.entries(brandCounts)
    .map(([brand, count]) => ({ brand, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // ── Competitor mentions ────────────────────────────────────────────────────
  const competitorCounts = {};
  for (const a of articles) {
    for (const c of toList(a.competitors)) {
      competitorCounts[c] = (competitorCounts[c] || 0) + 1;
    }
  }
  const competitorMentions = Object.entries(competitorCounts)
    .map(([competitor, count]) => ({ competitor, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // ── Top articles (by relevancy confidence) ─────────────────────────────────
  const topArticles = [...articles]
    .sort(
      (a, b) =>
        (Number(b.relevancy_confidence) || 0) -
        (Number(a.relevancy_confidence) || 0),
    )
    .slice(0, 10)
    .map((a) => ({
      id: a.id,
      title: a.title || "(Untitled)",
      url: a.url || "",
      sentiment: normalisedSentiment(a),
      relevancy_confidence: Number(a.relevancy_confidence) || 0,
      theme: a.theme || "",
      source: sourceLabel(a),
      date: dayKey(a.date || a.published_at) || "",
      relevancy_reason: a.relevancy_reason || "",
    }));

  // ── Section breakdown ──────────────────────────────────────────────────────
  const sectionCounts = {};
  for (const a of articles) {
    const sec = (a.section || "").trim();
    if (sec) sectionCounts[sec] = (sectionCounts[sec] || 0) + 1;
  }
  const sectionBreakdown = Object.entries(sectionCounts)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  // ── Average confidence ─────────────────────────────────────────────────────
  const confidenceValues = articles
    .map((a) => Number(a.relevancy_confidence))
    .filter((v) => !isNaN(v) && v > 0);
  const avgRelevancyConfidence =
    confidenceValues.length > 0
      ? Math.round(
          (confidenceValues.reduce((s, v) => s + v, 0) / confidenceValues.length) * 10,
        ) / 10
      : 0;

  // ── KPIs ───────────────────────────────────────────────────────────────────
  const positiveCount = sentimentCounts.Positive;
  const positivePercent =
    articles.length > 0 ? Math.round((positiveCount / articles.length) * 100) : 0;
  const topTheme = themeDistribution[0]?.theme || "N/A";
  const topSource = topPublications[0]?.label || "N/A";

  const kpis = [
    {
      label: "Total Articles",
      value: articles.length,
      format: "number",
      suffix: "",
    },
    {
      label: "Positive Sentiment",
      value: positivePercent,
      format: "percent",
      suffix: "%",
    },
    {
      label: "Avg Relevancy Score",
      value: avgRelevancyConfidence,
      format: "number",
      suffix: "%",
    },
    {
      label: "Top Theme",
      value: topTheme,
      format: "text",
    },
  ];

  // ── Narrative summary (for executive-summary widget) ─────────────────────
  const narrativeSummary = buildNarrative({
    total: articles.length,
    positivePercent,
    topTheme,
    topSource,
    avgRelevancyConfidence,
    sentimentCounts,
    themeDistribution,
    topPublications,
    coverageOverTime,
  });

  return {
    totalArticles: articles.length,
    sentiment: sentimentCounts,
    sentimentData,
    themeDistribution,
    coverageOverTime,
    topPublications,
    topArticles,
    brandMentions,
    competitorMentions,
    sectionBreakdown,
    avgRelevancyConfidence,
    positivePercent,
    topTheme,
    topSource,
    kpis,
    narrativeSummary,
  };
}

function buildNarrative({
  total,
  positivePercent,
  topTheme,
  topSource,
  avgRelevancyConfidence,
  sentimentCounts,
  themeDistribution,
  topPublications,
  coverageOverTime,
}) {
  const dateRange =
    coverageOverTime.length >= 2
      ? `from ${coverageOverTime[0].date} to ${coverageOverTime[coverageOverTime.length - 1].date}`
      : "across the reporting period";

  const topThemes = themeDistribution
    .slice(0, 3)
    .map((t) => t.theme)
    .join(", ");
  const topPubs = topPublications
    .slice(0, 3)
    .map((p) => p.label)
    .join(", ");

  return [
    `A total of ${total} articles were tagged ${dateRange}.`,
    `${positivePercent}% of coverage carried a positive sentiment; negative accounted for ${Math.round((sentimentCounts.Negative / total) * 100)}%.`,
    topTheme !== "N/A"
      ? `The dominant theme was "${topTheme}", followed by ${topThemes}.`
      : "No dominant theme was detected.",
    topSource !== "N/A"
      ? `Leading sources included ${topPubs || topSource}.`
      : "Source distribution was broad.",
    `Average relevancy confidence across all articles was ${avgRelevancyConfidence}%.`,
  ].join(" ");
}

function emptyAnalytics() {
  return {
    totalArticles: 0,
    sentiment: { Positive: 0, Negative: 0, Neutral: 0, Unassigned: 0 },
    sentimentData: [],
    themeDistribution: [],
    coverageOverTime: [],
    topPublications: [],
    topArticles: [],
    brandMentions: [],
    competitorMentions: [],
    sectionBreakdown: [],
    avgRelevancyConfidence: 0,
    positivePercent: 0,
    topTheme: "N/A",
    topSource: "N/A",
    kpis: [],
    narrativeSummary: "No article data available yet.",
  };
}

/**
 * Build a compact text context string to send to the LLM.
 * Avoids sending raw article bodies — only aggregated numbers.
 */
export function analyticsToContext(analytics) {
  const a = analytics;
  if (!a || a.totalArticles === 0) return "No article data available.";

  const sentimentStr = Object.entries(a.sentiment || {})
    .filter(([, v]) => v > 0)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");

  const themeStr = (a.themeDistribution || [])
    .slice(0, 5)
    .map((t) => `"${t.theme}" (${t.articles})`)
    .join(", ");

  const pubStr = (a.topPublications || [])
    .slice(0, 5)
    .map((p) => `${p.label} (${p.value})`)
    .join(", ");

  const dateRange =
    a.coverageOverTime && a.coverageOverTime.length >= 2
      ? `${a.coverageOverTime[0].date} → ${a.coverageOverTime[a.coverageOverTime.length - 1].date}`
      : "across reporting period";

  return `
REAL DATA FROM SESSION (${a.totalArticles} tagged articles):
- Date range: ${dateRange}
- Sentiment: ${sentimentStr}
- Positive sentiment rate: ${a.positivePercent}%
- Top themes: ${themeStr || "none"}
- Top publications: ${pubStr || "none"}
- Avg relevancy confidence: ${a.avgRelevancyConfidence}%
- Brands mentioned: ${(a.brandMentions || []).slice(0, 5).map((b) => b.brand).join(", ") || "none"}
- Competitors mentioned: ${(a.competitorMentions || []).slice(0, 5).map((c) => c.competitor).join(", ") || "none"}
`.trim();
}


/**
 * Validate and transform a widget's chart type if requested by user.
 * Returns { possible: true, newKind, newViz, newLiveData, replyText }
 * OR { possible: false, reason }
 */
export function validateAndTransformChart(widget, requestedTargetType, analytics) {

  if (!widget) {
    return { possible: false, reason: "No target section selected to transform." };
  }

  const currentKind = widget.kind;
  const target = String(requestedTargetType || "").toLowerCase().trim();

  let requestedKind = null;
  let requestedViz = null;

  if (target.includes("pie")) {
    requestedViz = "pie";
  } else if (target.includes("donut")) {
    requestedViz = "donut";
  } else if (target.includes("bar")) {
    requestedViz = "bar";
    requestedKind = "themes";
  } else if (target.includes("line") || target.includes("trend") || target.includes("area")) {
    requestedKind = "line";
  } else if (target.includes("table")) {
    requestedKind = "table";
  } else if (target.includes("heatmap")) {
    requestedKind = "competitor-heatmap";
  }

  // 1. Text / Narrative Content Check (Executive Summary)
  if (currentKind === "executive-summary") {
    if (requestedViz === "pie" || requestedViz === "donut" || requestedKind === "line" || requestedKind === "themes") {
      return {
        possible: false,
        reason: `The Executive Summary section consists of qualitative text narrative content rather than numeric data points, so it cannot be rendered as a ${target.toUpperCase()} chart. You can transform Sentiment, Themes, or Coverage sections into charts instead.`,
      };
    }
  }

  // 2. Multi-dimensional Matrix Content Check (Competitor Heatmap)
  if (currentKind === "competitor-heatmap" && (requestedViz === "pie" || requestedViz === "donut")) {
    return {
      possible: false,
      reason: `The Competitor Heatmap contains a 2D matrix of weekly competitor scores across time, which cannot be converted into a 1D ${requestedViz.toUpperCase()} chart slice without discarding competitor metrics.`,
    };
  }

  // 3. Category Widgets (Sentiment, Themes, Publications)
  if (currentKind === "sentiment" || currentKind === "themes" || currentKind === "publications") {
    if (requestedViz === "pie" || requestedViz === "donut" || requestedViz === "bar") {
      return {
        possible: true,
        newKind: currentKind,
        newViz: requestedViz,
        replyText: `Successfully transformed ${widget.title || currentKind} chart into a ${requestedViz.toUpperCase()} visualization.`,
      };
    }

    if (requestedKind === "line") {
      if (!analytics || !analytics.coverageOverTime || analytics.coverageOverTime.length === 0) {
        return {
          possible: false,
          reason: `No time-series date points exist in the current session data to plot a Line chart for ${widget.title || currentKind}.`,
        };
      }
      return {
        possible: true,
        newKind: "line",
        newViz: undefined,
        newLiveData: {
          area: analytics.coverageOverTime.map((d) => ({ date: d.date, value: d.value })),
        },
        replyText: `Transformed ${widget.title || currentKind} section into a Line chart displaying article volume over time.`,
      };
    }
  }

  // 4. Line / Time Series Widgets
  if (currentKind === "line") {
    if (requestedViz === "bar" || requestedKind === "themes") {
      return {
        possible: true,
        newKind: "themes",
        newViz: "bar",
        newLiveData: {
          themeDistribution: analytics?.themeDistribution || [],
        },
        replyText: `Transformed Coverage line chart into a Bar chart showing top theme distribution.`,
      };
    }

    if (requestedViz === "pie" || requestedViz === "donut") {
      const datesCount = analytics?.coverageOverTime?.length || 0;
      if (datesCount > 15) {
        return {
          possible: false,
          reason: `The Coverage line chart has ${datesCount} daily time-series data points. Rendering more than 15 slices in a ${requestedViz.toUpperCase()} chart creates extreme slice clutter and unreadable labels. Consider converting to a Bar chart instead.`,
        };
      }
      return {
        possible: true,
        newKind: "sentiment",
        newViz: requestedViz,
        newLiveData: {
          sentiment: {
            data: analytics?.sentimentData || [],
            centerLabel: String(analytics?.totalArticles || 0),
          },
        },
        replyText: `Transformed Line chart into a ${requestedViz.toUpperCase()} chart.`,
      };
    }
  }

  return {
    possible: true,
    newKind: requestedKind || currentKind,
    newViz: requestedViz || widget.viz,
    replyText: `Updated ${widget.title || currentKind} visualization.`,
  };
}

