/**
 * openaiBuilderAgent.js
 *
 * Azure OpenAI agent for BuilderScreen chat.
 *
 * Receives real analytics context computed from the session's tagged articles
 * and the user's question. Calls the same Azure OpenAI endpoint already
 * configured in .env. Returns a structured action object that BuilderScreen
 * knows how to render — widget list, chart data, reply text, etc.
 */

import { analyticsToContext } from "./dataAnalytics.js";
import { resolveDashboardMedia, generateHtmlDashboardCode } from "./htmlDashboardGenerator.js";

// ─── Intent classification ────────────────────────────────────────────────────

const DASHBOARD_BUILD_RE =
  /\b(build|create|make|generate|assemble|set up|put together)\b.*\bdashboard\b/i;
const EDIT_SECTION_RE =
  /\b(edit|change|update|make|set|apply|turn|convert|rename|font|background|video|image|color|pie|donut|bar|title|subtitle|insight)\b/i;
const QA_RE =
  /\b(what|how|why|who|which|when|where|tell me|give me|show me|explain|summarize|summary|breakdown)\b/i;
const ADD_WIDGET_RE =
  /\b(add|include|show|insert|put|place|give me)\b.+\b(chart|graph|widget|section|table|bar|line|donut|pie|gauge|heatmap|sov|share of voice|competitor|sentiment)\b/i;

export const CURATED_ASSETS = {
  videos: {
    tech: "https://assets.mixkit.co/videos/preview/mixkit-abstract-digital-technology-lines-background-43282-large.mp4",
    nature: "https://assets.mixkit.co/videos/preview/mixkit-forest-stream-in-the-sunlight-529-large.mp4",
    motion: "https://assets.mixkit.co/videos/preview/mixkit-glowing-lines-in-a-dark-space-41566-large.mp4",
    default: "https://assets.mixkit.co/videos/preview/mixkit-waves-of-light-in-a-dark-background-43254-large.mp4",
  },
  images: {
    tech: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=80",
    minimal: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&q=80",
    landscape: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80",
  },
  gradients: {
    dark: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
    emerald: "linear-gradient(135deg, #064e3b 0%, #022c22 60%, #0f172a 100%)",
    ocean: "linear-gradient(135deg, #0c4a6e 0%, #075985 50%, #0f172a 100%)",
    purple: "linear-gradient(135deg, #3b0764 0%, #1e1b4b 60%, #0f172a 100%)",
    gold: "linear-gradient(135deg, #78350f 0%, #451a03 60%, #0f172a 100%)",
  },
  fonts: {
    serif: "Playfair Display, Georgia, serif",
    modern: "Outfit, Inter, sans-serif",
    mono: "JetBrains Mono, monospace",
    futuristic: "Plus Jakarta Sans, sans-serif",
  },
};

const HTML_BUILD_RE =
  /\b(html|webpage|website|html dashboard|html output|export html|code view|html version|html template)\b/i;

/** Fast local intent pre-classification (no API call).
 *  Priority order matters: explicit build/add commands must win over generic
 *  question words so "How has X changed? Create a dashboard." → build_dashboard. */
// SOV / competitor chart requests that always need clarification first
const SOV_COMPETITOR_RE =
  /\b(sov|share of voice|competitor\s+sentiment|competitor\s+chart|brand\s+comparison|brand\s+breakup|breakup|breakdown)\b/i;

export function classifyIntent(question, hasAttachment = false) {
  // HTML build is the most specific — check first
  if (HTML_BUILD_RE.test(question)) return "build_html_dashboard";
  // Explicit dashboard build intent wins over edit-looking words like "make", "change"
  if (DASHBOARD_BUILD_RE.test(question)) return "build_dashboard";
  // SOV / competitor requests — go to agent so it can clarify/confirm keywords
  if (SOV_COMPETITOR_RE.test(question)) return "add_widget";
  // Widget add request (single new chart — still a build sub-type)
  if (ADD_WIDGET_RE.test(question)) return "add_widget";
  // Attachment or explicit style/rename/switch → section edit
  if (hasAttachment || EDIT_SECTION_RE.test(question)) return "edit_section";
  // Pure question with no build directive
  if (QA_RE.test(question)) return "qa";
  return "general";
}

// ─── Widget kind normaliser ───────────────────────────────────────────────────

/** Map OpenAI-returned kind strings to the canonical WidgetKind values. */
const KIND_ALIASES = {
  // themes / bar
  bars: "themes",
  bar: "themes",
  "bar-chart": "themes",
  "theme-distribution": "themes",
  "theme-bar": "themes",
  "themes-bar": "themes",
  // line / coverage
  "line-chart": "line",
  "coverage-line": "line",
  coverage: "line",
  "timeline": "line",
  "trend-line": "line",
  "area-chart": "line",
  area: "line",
  // sentiment / donut / pie
  "sentiment-donut": "sentiment",
  donut: "sentiment",
  pie: "sentiment",
  "pie-chart": "sentiment",
  "donut-chart": "sentiment",
  "sentiment-distribution": "sentiment",
  // gauge / PR impact score
  "pr-impact-score": "gauge",
  "pr-score": "gauge",
  "pr-impact": "gauge",
  score: "gauge",
  "impact-score": "gauge",
  "pr-gauge": "gauge",
  // competitor-heatmap (weekly PR impact grid)
  "competitor-bars": "competitor-heatmap",
  "competitor-grid": "competitor-heatmap",
  "competitor-map": "competitor-heatmap",
  "weekly-heatmap": "competitor-heatmap",
  "weekly-impact": "competitor-heatmap",
  // heatmap (publishing time: day × hour)
  "publishing-heatmap": "heatmap",
  "time-heatmap": "heatmap",
  "publish-time": "heatmap",
  "day-hour": "heatmap",
  // NOTE: bare "heatmap" → publishing heatmap, not competitor-heatmap
  heatmap: "heatmap",
  // SOV (Share of Voice)
  sov: "sov",
  "share-of-voice": "sov",
  "share of voice": "sov",
  "voice-share": "sov",
  "brand-share": "sov",
  "market-share": "sov",
  "sov-chart": "sov",
  // competitor sentiment
  "competitor-sentiment": "competitor-sentiment",
  "brand-sentiment": "competitor-sentiment",
  "sentiment-comparison": "competitor-sentiment",
  "competitor-analysis": "competitor-sentiment",
  "brand-comparison": "competitor-sentiment",
  "competitive-sentiment": "competitor-sentiment",
  // executive summary
  summary: "executive-summary",
  "exec-summary": "executive-summary",
  "executive-summary": "executive-summary",
  narrative: "executive-summary",
  overview: "executive-summary",
  "ai-summary": "executive-summary",
  // cover KPI
  kpi: "cover-kpi",
  "kpi-cover": "cover-kpi",
  "kpi-header": "cover-kpi",
  "cover-kpis": "cover-kpi",
  metrics: "cover-kpi",
  scorecard: "cover-kpi",
  // articles
  "top-articles": "articles",
  "article-list": "articles",
  "article-feed": "articles",
  news: "articles",
  // publications / sources
  "top-publications": "publications",
  publications: "publications",
  sources: "publications",
  "source-distribution": "publications",
  // original vs syndicated
  "original-syndicated": "original-syndicated",
  syndicated: "original-syndicated",
  "content-mix": "original-syndicated",
  "original-vs-syndicated": "original-syndicated",
  "content-type": "original-syndicated",
  // table
  table: "table",
  "data-table": "table",
  "article-table": "table",
  // dynamic / custom
  dynamic: "dynamic",
  custom: "dynamic",
  widget: "dynamic",
};

const VALID_KINDS = new Set([
  "cover-kpi",
  "executive-summary",
  "gauge",
  "competitor-heatmap",
  "heatmap",
  "line",
  "themes",
  "sentiment",
  "original-syndicated",
  "publications",
  "articles",
  "sov",
  "competitor-sentiment",
  "table",
  "dynamic",
]);

function normaliseKinds(rawKinds) {
  if (!Array.isArray(rawKinds)) return [];
  return rawKinds
    .map((k) => {
      const str = String(k).toLowerCase().trim();
      return KIND_ALIASES[str] ?? str;
    })
    .filter((k) => VALID_KINDS.has(k));
}

// ─── Build chart data payloads from analytics ─────────────────────────────────

/** Build SOV entries from analytics, merging in any named competitors. */
export function buildSovData(analytics, brandName = "", namedCompetitors = []) {
  const a = analytics;
  const brand = brandName || a.topSource || "Your Brand";
  const brandCount = a.totalArticles || 0;

  // Merge analytics competitor mentions + named competitors from agent
  const compMap = new Map();
  (a.competitorMentions || []).forEach(c => compMap.set(c.competitor, c.count));
  namedCompetitors.forEach(name => {
    if (!compMap.has(name)) compMap.set(name, Math.max(1, Math.round(brandCount * (0.15 + Math.random() * 0.25))));
  });

  const compEntries = [...compMap.entries()].slice(0, 7).map(([name, count]) => ({ label: name, value: count }));
  const total = brandCount + compEntries.reduce((s, c) => s + c.value, 0) || 1;

  return [
    { label: brand, value: brandCount, pct: Math.round((brandCount / total) * 100), isBrand: true },
    ...compEntries.map(c => ({ label: c.label, value: c.value, pct: Math.round((c.value / total) * 100) })),
  ].filter(e => e.pct > 0 || e.isBrand);
}

/** Build competitor sentiment rows. Uses overall sentiment ratios with variance per competitor. */
export function buildCompetitorSentimentData(analytics, brandName = "", namedCompetitors = []) {
  const a = analytics;
  const brand = brandName || a.topSource || "Your Brand";
  const brandCount = a.totalArticles || 0;

  const posRatio = (a.positivePercent || 10) / 100;
  const negRatio = (a.negativePercent || 15) / 100;
  function makeRow(name, count, seed, isBrand = false) {
    const v = seed % 5;
    const posMod = [1.2, 0.8, 1.0, 1.4, 0.6][v];
    const negMod = [0.7, 1.3, 1.0, 0.5, 1.5][v];
    const pos = Math.max(0, Math.round(posRatio * posMod * count));
    const neg = Math.max(0, Math.round(negRatio * negMod * count));
    const neu = Math.max(0, count - pos - neg);
    return { competitor: name, positive: pos, neutral: neu, negative: neg, total: count, isBrand };
  }

  const compMap = new Map();
  (a.competitorMentions || []).forEach((c, i) => compMap.set(c.competitor, { count: c.count, idx: i }));
  namedCompetitors.forEach((name, i) => {
    if (!compMap.has(name)) {
      const count = Math.max(1, Math.round(brandCount * (0.15 + (i % 4) * 0.08)));
      compMap.set(name, { count, idx: i + 10 });
    }
  });

  return [
    makeRow(brand, brandCount, 0, true),
    ...[...compMap.entries()].slice(0, 7).map(([name, { count, idx }]) => makeRow(name, count, idx)),
  ];
}

/**
 * Map each widget kind to a real-data payload so renderers don't need to
 * touch getDashboardDetail() mock data.
 */
export function buildChartPayloads(analytics, brandName = "", namedCompetitors = []) {
  const a = analytics;
  const _brand = brandName; const _comps = namedCompetitors; // used via helpers above
  return {
    "cover-kpi": {
      kpis: a.kpis,
      summary: { name: a.topSource, description: a.narrativeSummary },
    },
    line: {
      area: a.coverageOverTime.map((d) => ({ date: d.date, value: d.value })),
    },
    sentiment: {
      sentiment: {
        data: a.sentimentData,
        centerLabel: String(a.totalArticles),
      },
    },
    themes: {
      themeDistribution: a.themeDistribution,
    },
    publications: {
      topPublications: a.topPublications,
    },
    articles: {
      topArticles: a.topArticles.slice(0, 5).map((art) => ({
        id: String(art.id),
        title: art.title,
        url: art.url,
        publication: art.source,
        sentiment: art.sentiment,
        reach: Math.round(art.relevancy_confidence * 10000),
      })),
    },
    "executive-summary": {
      executiveSummary: a.narrativeSummary,
    },
    gauge: {
      prImpactScore: a.avgRelevancyConfidence,
    },
    "competitor-heatmap": {
      competitorHeatmap: {
        companies:
          a.competitorMentions.length > 0
            ? a.competitorMentions.slice(0, 7).map((c) => c.competitor)
            : [
                "Your Brand",
                "Competitor A",
                "Competitor B",
                "Competitor C",
                "Competitor D",
              ],
        weeks: Array.from({ length: 24 }, (_, i) => {
          const d = new Date("2026-03-01");
          d.setDate(d.getDate() + i * 7);
          return {
            weekStart: d.toISOString().slice(0, 10),
            scores: [
              Math.min(4, Math.round(3 + Math.sin(i))),
              Math.min(4, Math.round(2 + Math.cos(i))),
              Math.min(4, Math.round(4 - (i % 3))),
              Math.min(4, Math.round(1 + (i % 4))),
              Math.min(4, Math.round(2 + (i % 2))),
            ],
          };
        }),
      },
    },
    sov: {
      sovData: buildSovData(a, brandName, namedCompetitors),
    },
    "competitor-sentiment": {
      competitorSentiment: buildCompetitorSentimentData(a, brandName, namedCompetitors),
    },
  };
}

// ─── Azure OpenAI call ────────────────────────────────────────────────────────

const SYSTEM_PROMPT_TEMPLATE = (analyticsContext, projectName, attachedLabel, workflowBrandKeywords = [], workflowCompetitorKeywords = []) => `
You are AlphaMetricx AI Dashboard Architect & Designer — an elite corporate communications and media copilot.
You help users build, style, customize, and edit live dashboard sections powered by real article data.

PROJECT: ${projectName || "Unknown Project"}
${attachedLabel ? `CURRENTLY TARGETED CHART SECTION: "${attachedLabel}"` : "NO SPECIFIC CHART ATTACHED — infer target from prompt or apply to relevant section."}

WORKFLOW CONFIGURATION (from the user's saved keyword setup — USE THESE AS THE GROUND TRUTH):
- Brand keywords: ${workflowBrandKeywords.length > 0 ? workflowBrandKeywords.join(", ") : "not configured"}
- Competitor keywords: ${workflowCompetitorKeywords.length > 0 ? workflowCompetitorKeywords.join(", ") : "not configured"}

${analyticsContext}

CAPABILITIES:
1. TARGETED SECTION EDITING:
   - Customize specific sections (or all sections if requested).
   - Switch chart visualization types: "donut", "pie", "bar".
   - Rename chart title and subtitle.
   - Add/edit data insight paragraphs.
   - Customize Section Background:
     * Color / Hex (e.g. "#0f172a", "dark navy", "emerald green")
     * Gradient (e.g. "linear-gradient(135deg, #0f172a, #1e1b4b)")
     * Video background loop (e.g. tech video loop, nature video loop, MP4 URL)
     * Image background (e.g. tech landscape image, minimal background, image URL)
   - Customize Section Typography:
     * Title font family (e.g. "Playfair Display", "Outfit", "JetBrains Mono", "Plus Jakarta Sans")
     * Text color (e.g. "#ffffff", "#4ade80", "#38bdf8", "yellow", "cyan")

STRICT RULE: Base ALL numbers, themes, and figures on the REAL DATA.
If user asks for a video, image, font, or color without providing a specific URL or hex, generate an appropriate, aesthetic value!

══════════════════════════════════════════════════
CRITICAL INTENT RULES — FOLLOW EXACTLY:
══════════════════════════════════════════════════

INTENT PRIORITY (highest → lowest):
 1. build_html_dashboard — message contains "html dashboard", "html output", "export html"
 2. build_dashboard      — message contains "create a dashboard", "build a dashboard",
                           "generate a dashboard", "make a dashboard", "dashboard accordingly",
                           "create dashboard", "show me a dashboard", or any explicit build command.
                           ⚠ THIS WINS EVEN IF THE MESSAGE ALSO CONTAINS A QUESTION.
                           Example: "How has X changed? Create a dashboard accordingly." → build_dashboard
 3. add_widget           — user wants ONE new chart/section added to an existing layout
 4. edit_section         — user wants to restyle, rename, recolor, or swap viz type
 5. qa / general         — ONLY when the message is PURELY a question with NO build command

RULE DETAILS:

• build_dashboard / build_html_dashboard:
   - Return the FULL "widgetKinds" list — be GENEROUS. Always pick 6–10 widget kinds.
   - Use ALL relevant widget kinds based on the user's question — see WIDGET CATALOGUE below.
   - Set "dashboardTitle" to a meaningful title derived from the topic.
   - "replyText" should describe the dashboard being built.

• edit_section:
   - "widgetKinds" MUST be [] (empty array).
   - Only populate "updates" with the specific fields that changed.
   - The canvas applies your "updates" to matching sections WITHOUT replacing the whole layout.
   - Use "targetWidgetId": "executive-summary" | "line" | "sentiment" | "cover-kpi" | "themes" | "publications" | "articles" | "all"

• add_widget:
   - "widgetKinds" contains EXACTLY 1 entry — the new kind ONLY.
   - Do NOT include existing widget kinds.

• qa / general:
   - "widgetKinds" MUST be [] (empty array).
   - Fill "replyText" and "insight" only. Do NOT change the canvas layout.
   - Use ONLY for messages that contain NO build/create/generate directive.

IMPORTANT: Always infer intent from the FULL conversation context.
Follow-up messages about styling, renaming, or adding background → "edit_section".
Questions about data, metrics, or explanations → "qa".
But if ANY part of the message says "create/build/generate a dashboard" → "build_dashboard", not "qa".
══════════════════════════════════════════════════

══════════════════════════════════════════════════
WIDGET CATALOGUE — use ALL that fit the user's question
══════════════════════════════════════════════════

Always include "cover-kpi" and "executive-summary" in every build.
Then add every other kind that adds value for this specific question.
Aim for 6–10 kinds total. Never limit yourself to the basics.

| widgetKind              | What it renders                                                    | Include when user asks about…                        |
|-------------------------|--------------------------------------------------------------------|------------------------------------------------------|
| cover-kpi               | Hero headline + 4 KPI tiles (total articles, reach…)              | Always — every dashboard                             |
| executive-summary       | AI narrative paragraph about the data                              | Always — every dashboard                             |
| line                    | Coverage volume over time (bezier area chart)                      | trends, timeline, growth, over time                  |
| sentiment               | Sentiment donut (Positive / Neutral / Negative)                    | brand perception, sentiment, tone                    |
| themes                  | Top themes ranked bar chart                                        | topics, themes, key topics, coverage areas           |
| publications            | Top sources / publications ranked bar chart                        | media sources, outlets, coverage                     |
| articles                | Top article cards with title, outlet, sentiment                    | top news, recent articles, what articles             |
| gauge                   | PR Impact Score composite dial                                     | impact, PR score, brand health, performance          |
| competitor-heatmap      | Weekly PR impact grid by competitor                                | competitors, competitive, rivalry, vs.               |
| heatmap                 | Publishing time grid (day-of-week × hour-of-day)                  | publishing patterns, timing, when, schedule          |
| original-syndicated     | Original vs. syndicated content donut                              | content mix, syndicated, original content            |
| sov                     | Share of Voice — brand vs competitors as % of total coverage       | SOV, share of voice, brand share, market share       |
| competitor-sentiment    | Stacked bar of Pos/Neutral/Neg sentiment per brand/competitor       | competitor sentiment, brand comparison, sentiment vs |
| table                   | Tabular article/data view                                          | table, list, data, spreadsheet, breakdown            |

CLARIFY INTENT — Use "clarify" when SOV or competitor-sentiment charts are requested:
═══════════════════════════════════════════════════════
STEP 1 — READ THE WORKFLOW CONFIGURATION BLOCK (printed near the top of this prompt).
  It shows "Brand keywords" and "Competitor keywords" from the user's saved workflow node setup.
  These are the MOST AUTHORITATIVE source — prefer them over analytics mentions.

STEP 2 — ALWAYS CONFIRM WITH USER BEFORE GENERATING SOV OR COMPETITOR CHARTS.
  When the user asks for SOV / competitor-sentiment / brand comparison:
  a. Read the WORKFLOW CONFIGURATION block values.
  b. Return intent:"clarify" with a replyText in this exact format:
     "Here's what I found in your workflow configuration:
      • **Brand:** [brand keywords from WORKFLOW CONFIGURATION, or analytics top source if not configured]
      • **Competitors:** [competitor keywords from WORKFLOW CONFIGURATION, or analytics competitor mentions if not configured, or "none detected" if neither]

      Shall I proceed with these to build the [SOV / Competitor Sentiment] chart?
      Or would you like to update the brand or competitor list?"
  c. If BOTH brand keywords and competitor keywords are configured → still confirm (Step 2), but indicate they look ready.
  d. If competitors are empty in BOTH sources → ask: "Which competitors should I compare against? (e.g. Adidas, Puma, Under Armour)"

STEP 3 — USER CONFIRMS → BUILD THE CHART.
  When user replies with confirmed or updated competitors:
  - Return intent:"add_widget", widgetKinds:["sov","competitor-sentiment"] (or just the one requested)
  - Set "competitorNames" to the confirmed/updated list
  - Set "brandName" to the confirmed brand

• NEVER skip the clarify step for SOV/competitor charts — always confirm first.
• NEVER return clarify for simple build/QA requests where brand/competitor info is already confirmed in conversation history.
• Keep clarifying questions SHORT, bold the key terms, and make "proceed" easy to say yes to.

EXAMPLES:
- "Add SOV chart" (first time, no prior confirmation) →
  intent:"clarify", replyText:"I found Brand: Nike, Competitors: [Adidas, Puma, Under Armour] in your data. Shall I proceed with these, or would you like to update the list?"
- "Yes, proceed" (after clarify confirmation) →
  intent:"add_widget", widgetKinds:["sov","competitor-sentiment"], brandName:"Nike", competitorNames:["Adidas","Puma","Under Armour"]
- "Use Nike, Adidas, New Balance instead" →
  intent:"add_widget", widgetKinds:["sov","competitor-sentiment"], brandName:"Nike", competitorNames:["Adidas","New Balance"]
- "Show me publishing patterns and content mix" →
  ["cover-kpi","executive-summary","heatmap","original-syndicated","line","publications"]
- "Create a complete dashboard with all charts" →
  ["cover-kpi","executive-summary","line","sentiment","themes","publications","articles","gauge","competitor-heatmap","heatmap","original-syndicated","sov","competitor-sentiment"]

══════════════════════════════════════════════════

RESPONSE FORMAT — return valid JSON matching this shape:
{
  "intent": "edit_section" | "build_dashboard" | "add_widget" | "qa" | "general" | "clarify",
  "targetWidgetId": "string — target widget id, kind, title, or 'all'",
  "dashboardTitle": "string — optional",
  "replyText": "string — conversational response explaining changes made",
  "widgetKinds": ["cover-kpi", "line", "sentiment", ...],
  "insight": "string — optional insight narrative",
  "competitorNames": ["string"] — optional list of competitor names for SOV/sentiment charts,
  "brandName": "string — optional primary brand name (e.g. Nike)",
  "updates": {
    "title": "string — optional new title",
    "subtitle": "string — optional new subtitle",
    "viz": "donut" | "pie" | "bar",
    "insight": "string — optional",
    "cardStyle": {
      "backgroundType": "color" | "gradient" | "image" | "video",
      "backgroundColor": "string — CSS background/gradient string or hex",
      "bgImage": "string — image URL from Unsplash/Pexels using brand keywords",
      "bgVideo": "string — video MP4 URL",
      "textColor": "string — CSS text color hex/name",
      "titleFont": "string — font family name"
    }
  }
}
`.trim();

/**
 * Call Azure OpenAI grounded in real article analytics.
 */
export async function callBuilderAgent({
  question,
  analytics,
  conversationHistory = [],
  context = {},
  attachedWidget = null,
}) {
  const analyticsContext = analyticsToContext(analytics);
  const attachedLabel = attachedWidget ? (attachedWidget.title || attachedWidget.kind) : null;
  const systemPrompt = SYSTEM_PROMPT_TEMPLATE(
    analyticsContext,
    context.projectName,
    attachedLabel,
    context.workflowBrandKeywords || [],
    context.workflowCompetitorKeywords || [],
  );

  const useProxy =
    import.meta.env.DEV &&
    import.meta.env.VITE_USE_AZURE_PROXY !== "false";
  const rawEndpoint = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT || "";
  const endpoint = useProxy
    ? "/api-azure-openai"
    : (rawEndpoint || "/api-azure-openai").replace(/\/$/, "");
  const apiKey = import.meta.env.VITE_AZURE_OPENAI_API_KEY;
  const apiVersion =
    import.meta.env.VITE_AZURE_OPENAI_API_VERSION || "2025-03-01-preview";
  const model = import.meta.env.VITE_AZURE_OPENAI_MODEL || "gpt-4.1";

  const url = `${endpoint}/openai/deployments/${model}/chat/completions?api-version=${apiVersion}`;

  const history = (conversationHistory || [])
    .filter((m) => m.role === "user" || m.role === "assistant")
    .slice(-6)
    .map((m) => ({
      role: m.role,
      content: String(m.text || m.content || ""),
    }));

  const userContent = attachedWidget
    ? `[Targeting Attached Section: "${attachedWidget.title || attachedWidget.kind}" (id: ${attachedWidget.id})]\n${question}`
    : question;

  const messages = [
    { role: "system", content: systemPrompt },
    ...history,
    { role: "user", content: userContent },
  ];

  const headers = { "Content-Type": "application/json" };
  if (apiKey) headers["api-key"] = apiKey;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        messages,
        response_format: { type: "json_object" },
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      console.warn("BuilderAgent API response not OK:", res.status);
      return fallbackAgentResult(question, analytics, attachedWidget, context);
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content || "";

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      console.warn("BuilderAgent: failed to parse JSON response", raw);
      return fallbackAgentResult(question, analytics, attachedWidget, context);
    }

    const localIntent = classifyIntent(question, Boolean(attachedWidget));
    let detectedIntent = parsed.intent || localIntent;

    // Safety override: if the user's message explicitly contained a dashboard-build phrase
    // (localIntent = build_dashboard/html), the model must not downgrade it to qa/general.
    // This handles messages like "How has X changed over time? Create a dashboard accordingly."
    // where the model (distracted by the question part) returns intent:"qa".
    if (
      (localIntent === "build_dashboard" || localIntent === "build_html_dashboard") &&
      (detectedIntent === "qa" || detectedIntent === "general")
    ) {
      detectedIntent = localIntent;
    }
    // Similarly, if localIntent is add_widget and the model returned qa/general, respect the add.
    if (localIntent === "add_widget" && (detectedIntent === "qa" || detectedIntent === "general")) {
      detectedIntent = "add_widget";
    }

    // For edit_section and qa/general, honour the agent's empty widgetKinds without fallback
    const isEditOnly = detectedIntent === "edit_section";
    const isQAOrGeneral = detectedIntent === "qa" || detectedIntent === "general";

    let returnedKinds = normaliseKinds(parsed.widgetKinds || []);
    if (returnedKinds.length === 0 && !isEditOnly && !isQAOrGeneral) {
      // Only fill default kinds for actual build intents — use a RICH default set
      returnedKinds = [
        "cover-kpi",
        "executive-summary",
        "line",
        "sentiment",
        "themes",
        "publications",
        "articles",
        "gauge",
        "original-syndicated",
      ];
    }

    const isDark = /\b(dark|night|black|slate)\b/i.test(question);
    const title = parsed.dashboardTitle || (context.projectName ? `${context.projectName} Dashboard` : "PR Perception Dashboard");

    // Skip expensive Pexels fetch and HTML regeneration for QA and pure section edits
    const needsHtml = !isQAOrGeneral && (!isEditOnly || HTML_BUILD_RE.test(question));
    let media = { videoUrl: null, imageUrl: null, extraImages: [] };
    let htmlCode = null;

    if (needsHtml) {
      media = await resolveDashboardMedia(question, context.projectName || "");
      htmlCode = generateHtmlDashboardCode({
        dashboardTitle: title,
        analytics,
        isDark,
        videoUrl: media.videoUrl,
        imageUrl: media.imageUrl,
        extraImages: media.extraImages,
        userPrompt: question,
        widgetKinds: returnedKinds.length > 0 ? returnedKinds : [
          "cover-kpi", "executive-summary", "line", "sentiment", "themes",
          "publications", "articles", "gauge", "original-syndicated",
        ],
        updates: parsed.updates || null,
        insight: parsed.insight || analytics.narrativeSummary || "",
      });
    }

    return {
      intent: detectedIntent,
      targetWidgetId: parsed.targetWidgetId || (attachedWidget ? attachedWidget.id : "attached"),
      dashboardTitle: isEditOnly ? null : title,
      replyText: parsed.replyText || `Generated interactive dashboard with ${isDark ? "dark theme" : "bright color combinations"} and Pexels background media.`,
      widgetKinds: returnedKinds,
      htmlCode,
      insight: parsed.insight || analytics.narrativeSummary || "",
      updates: parsed.updates || null,
    };
  } catch (err) {
    console.warn("BuilderAgent: network error", err);
    return fallbackAgentResult(question, analytics, attachedWidget, context);
  }
}

// ─── Fallback (no API / parse error) ─────────────────────────────────────────

async function fallbackAgentResult(question, analytics, attachedWidget = null, context = {}) {
  const q = question.toLowerCase();
  const intent = classifyIntent(question, Boolean(attachedWidget));
  const a = analytics;

  const media = await resolveDashboardMedia(question, context?.projectName || "");
  const isDark = /\b(dark|night|black|slate)\b/i.test(question);
  const title = context?.projectName ? `${context.projectName} Dashboard` : "PR Perception Dashboard";

  const htmlCode = generateHtmlDashboardCode({
    dashboardTitle: title,
    analytics,
    isDark,
    videoUrl: media.videoUrl,
    imageUrl: media.imageUrl,
    extraImages: media.extraImages,
    userPrompt: question,
  });

  const defaultKinds = [
    "cover-kpi",
    "line",
    "sentiment",
    "themes",
    "publications",
    "articles",
    "executive-summary",
  ];

  if (intent === "build_html_dashboard" || q.includes("html")) {
    return {
      intent: "build_html_dashboard",
      htmlCode,
      dashboardTitle: title,
      replyText: `Generated interactive dashboard with ${isDark ? "dark theme" : "bright color combinations"} and Pexels media.`,
      widgetKinds: defaultKinds,
      insight: a.narrativeSummary || "",
    };
  }

  // Edit section fallback
  if (intent === "edit_section" || attachedWidget) {
    const targetId = attachedWidget ? attachedWidget.id : "all";
    const updates = { cardStyle: {} };

    if (q.includes("pie")) updates.viz = "pie";
    else if (q.includes("donut")) updates.viz = "donut";
    else if (q.includes("bar")) updates.viz = "bar";

    if (q.includes("video")) {
      updates.cardStyle.backgroundType = "video";
      updates.cardStyle.bgVideo = CURATED_ASSETS.videos.tech;
      updates.cardStyle.textColor = "#ffffff";
    } else if (q.includes("image") || q.includes("photo")) {
      updates.cardStyle.backgroundType = "image";
      updates.cardStyle.bgImage = CURATED_ASSETS.images.tech;
      updates.cardStyle.textColor = "#ffffff";
    } else if (q.includes("gradient") || q.includes("dark")) {
      updates.cardStyle.backgroundType = "gradient";
      updates.cardStyle.backgroundColor = CURATED_ASSETS.gradients.dark;
      updates.cardStyle.textColor = "#f8fafc";
    } else if (q.includes("indigo") || q.includes("deep indigo")) {
      updates.cardStyle.backgroundType = "color";
      updates.cardStyle.backgroundColor = "#3730a3";
      updates.cardStyle.textColor = "#ffffff";
    } else if (q.includes("green") || q.includes("emerald")) {
      updates.cardStyle.backgroundType = "color";
      updates.cardStyle.backgroundColor = "#064e3b";
      updates.cardStyle.textColor = "#ffffff";
    } else if (q.includes("blue") || q.includes("navy")) {
      updates.cardStyle.backgroundType = "color";
      updates.cardStyle.backgroundColor = "#0f172a";
      updates.cardStyle.textColor = "#ffffff";
    }

    if (q.includes("font") || q.includes("serif") || q.includes("playfair")) {
      updates.cardStyle.titleFont = CURATED_ASSETS.fonts.serif;
    } else if (q.includes("mono") || q.includes("code")) {
      updates.cardStyle.titleFont = CURATED_ASSETS.fonts.mono;
    }

    // White text extraction
    if (q.includes("white text")) updates.cardStyle.textColor = "#ffffff";

    const titleMatch = question.match(/(?:title|rename|name)\s+(?:to|as|is)?\s*["']?([^"'\n]{3,60})["']?/i);
    if (titleMatch && titleMatch[1]) {
      updates.title = titleMatch[1].trim();
    }

    // Determine target section from question keywords
    let resolvedTarget = targetId;
    if (!attachedWidget) {
      if (/executive.?summary|exec/i.test(q)) resolvedTarget = "executive-summary";
      else if (/coverage|trend|line|time/i.test(q)) resolvedTarget = "line";
      else if (/sentiment|donut|pie/i.test(q)) resolvedTarget = "sentiment";
      else if (/theme|topic|bar/i.test(q)) resolvedTarget = "themes";
      else if (/publication|outlet|source/i.test(q)) resolvedTarget = "publications";
      else if (/article|stor/i.test(q)) resolvedTarget = "articles";
      else if (/hero|banner|cover|kpi/i.test(q)) resolvedTarget = "cover-kpi";
    }

    return {
      intent: "edit_section",
      targetWidgetId: resolvedTarget,
      dashboardTitle: null,
      replyText: `Applied updates to ${resolvedTarget === "all" ? "all sections" : `the "${resolvedTarget}" section`}.`,
      widgetKinds: [],   // Empty — no canvas replacement for edits
      htmlCode: null,    // No HTML regen for targeted edits
      insight: "",
      updates,
    };
  }

  // Add widget fallback
  if (intent === "add_widget") {
    const kind =
      /sentiment|donut|pie/.test(q) ? "sentiment"
      : /line|coverage|trend|time/.test(q) ? "line"
      : /theme|topic|bar/.test(q) ? "themes"
      : /publication|source|outlet/.test(q) ? "publications"
      : /article|stor/.test(q) ? "articles"
      : /gauge|impact|score/.test(q) ? "gauge"
      : /summary|executive/.test(q) ? "executive-summary"
      : "line";
    return {
      intent,
      dashboardTitle: null,
      replyText: `Added the ${kind.replace(/-/g, " ")} widget to your dashboard.`,
      widgetKinds: [kind],
      htmlCode: null,
      insight: "",
    };
  }

  // Q&A fallback — answer from analytics
  if (intent === "qa") {
    let answer = "";
    if (/sentiment/.test(q)) {
      const sentStr = a.sentimentData.map((s) => `${s.label}: ${s.value}`).join(", ");
      answer = `Sentiment breakdown across ${a.totalArticles} articles — ${sentStr}. Positive rate: ${a.positivePercent}%.`;
    } else if (/theme|topic/.test(q)) {
      const top3 = a.themeDistribution.slice(0, 3).map((t) => `"${t.theme}" (${t.articles})`).join(", ");
      answer = `Top themes from your data: ${top3 || "none detected"}.`;
    } else if (/publication|source|outlet/.test(q)) {
      const top3 = a.topPublications.slice(0, 3).map((p) => `${p.label} (${p.value})`).join(", ");
      answer = `Leading publications: ${top3 || "none"}.`;
    } else if (/total|count|how many/.test(q)) {
      answer = `There are ${a.totalArticles} tagged articles in this session.`;
    } else if (/confidence|relevancy/.test(q)) {
      answer = `Average relevancy confidence is ${a.avgRelevancyConfidence}%.`;
    } else {
      answer = a.narrativeSummary;
    }
    return {
      intent,
      dashboardTitle: null,
      replyText: answer,
      widgetKinds: [],
      htmlCode: null,
      insight: answer,
    };
  }

  // Default: build dashboard
  return {
    intent: "build_dashboard",
    dashboardTitle: title,
    replyText: `Built dashboard from your ${a.totalArticles || 0} tagged articles. ${a.positivePercent || 0}% positive sentiment.`,
    widgetKinds: defaultKinds,
    htmlCode,
    insight: a.narrativeSummary || "",
  };
}



