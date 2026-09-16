import type { ReactNode } from "react"
import type { DashboardDetail } from "@/data/types"
import { CoverageLineChart } from "@/components/dashboard/coverage-line-chart"
import { ThemeDistributionChart } from "@/components/dashboard/theme-distribution-chart"
import { SentimentDonut } from "@/components/dashboard/sentiment-donut"
import { OriginalSyndicatedDonut } from "@/components/dashboard/original-syndicated-donut"
import { RankedBarChart } from "@/components/dashboard/ranked-bar-chart"
import { BrandImpactHeatmap } from "@/components/dashboard/brand-impact-heatmap"
import { PrImpactHeatmap } from "@/components/dashboard/pr-impact-heatmap"
import { ReachGauge } from "@/components/dashboard/reach-gauge"
import { TopArticles } from "@/components/dashboard/top-articles"
import { SovChart } from "@/components/dashboard/sov-chart"
import { CompetitorSentimentChart } from "@/components/dashboard/competitor-sentiment-chart"
import { formatValue } from "@/lib/format"
import { CategoryChart, type CategoryViz } from "./category-chart"
import { CoverKpiCard, type CoverBg } from "./cover-kpi-card"
import { ExecSummaryWidget } from "./exec-summary-widget"
import { DynamicChartRenderer } from "@/components/CustomChartWidgets"

export type WidgetKind =
  | "cover-kpi"
  | "executive-summary"
  | "gauge"
  | "competitor-heatmap"
  | "heatmap"
  | "line"
  | "themes"
  | "sentiment"
  | "original-syndicated"
  | "publications"
  | "articles"
  | "sov"
  | "competitor-sentiment"
  | "table"
  | "image"
  | "dynamic"

/** Ad-hoc chart object carried by a "dynamic" widget — the shape
 * CustomChartWidgets.jsx's DynamicChartRenderer expects. Not tied to
 * DashboardDetail like every other widget kind's data, since it comes from
 * a one-off answer (e.g. the PR Intent engine) rather than the project's
 * live dashboard data. */
export interface DynamicChart {
  chart_id?: string
  title?: string
  chart_type: string
  data: unknown
  series?: string[]
  y_label?: string
}

export interface WidgetDef {
  kind: WidgetKind
  title: string
  snippet: string
  /** Prompt keywords that trigger this widget (checked in order). */
  keywords: string[]
}

/** Ordered most-specific first so keyword matching is deterministic. */
export const WIDGETS: WidgetDef[] = [
  {
    kind: "cover-kpi",
    title: "Cover KPIs",
    snippet: "Hero cover with headline metrics.",
    keywords: ["cover kpi", "cover", "kpi", "hero", "headline"],
  },
  {
    kind: "executive-summary",
    title: "Executive Summary",
    snippet: "Narrative summary of the period.",
    keywords: ["executive summary", "exec summary", "executive"],
  },
  {
    kind: "gauge",
    title: "PR Impact Score",
    snippet: "Composite prominence, reach and message pull-through (0–100).",
    keywords: ["gauge", "impact score", "pr score", "score"],
  },
  {
    kind: "competitor-heatmap",
    title: "PR Impact by Competitor",
    snippet: "Weekly PR impact by company — red (low) to green (high).",
    keywords: ["competitor", "competitors", "pr impact", "rival"],
  },
  {
    kind: "heatmap",
    title: "Publishing Time Heatmap",
    snippet: "Article counts by day and hour, as an activity grid.",
    keywords: ["publishing", "time heatmap", "calendar", "activity", "heatmap"],
  },
  {
    kind: "line",
    title: "Coverage Over Time",
    snippet: "Daily article volume across the period.",
    keywords: ["line", "coverage", "volume", "over time", "trend"],
  },
  {
    kind: "themes",
    title: "Theme Distribution",
    snippet: "Top themes by volume of articles.",
    keywords: ["theme", "themes", "distribution", "topic", "topics", "bar"],
  },
  {
    kind: "sentiment",
    title: "Sentiment",
    snippet: "Positive, negative, neutral and unassigned share of coverage.",
    keywords: ["sentiment", "tone", "donut", "positive", "negative"],
  },
  {
    kind: "original-syndicated",
    title: "Original vs Syndicated",
    snippet: "Share of original articles versus syndicated copies.",
    keywords: ["original", "syndicated", "syndication"],
  },
  {
    kind: "publications",
    title: "Top Publications",
    snippet: "Publications ranked by article count.",
    keywords: ["publication", "publications", "outlet", "outlets", "sources"],
  },
  {
    kind: "articles",
    title: "Top Articles",
    snippet: "Highest-reach stories this period, split by sentiment.",
    keywords: ["article", "articles", "stories", "story", "key stories"],
  },
  {
    kind: "sov",
    title: "Share of Voice",
    snippet: "Brand vs competitor share of total article coverage.",
    keywords: ["sov", "share of voice", "share of voices", "voice share", "brand share", "market share"],
  },
  {
    kind: "competitor-sentiment",
    title: "Competitor Sentiment",
    snippet: "Positive / neutral / negative breakdown per brand and competitor.",
    keywords: ["competitor sentiment", "brand sentiment comparison", "sentiment comparison", "competitor analysis", "brand comparison"],
  },
  {
    kind: "table",
    title: "Data Table",
    snippet: "Tabular breakdown of key metrics and status.",
    keywords: ["table", "data table", "spreadsheet", "grid view"],
  },
  {
    kind: "image",
    title: "Media Asset",
    snippet: "AI-generated or uploaded image/visual asset.",
    keywords: ["image", "photo", "picture", "visual", "graphic"],
  },
  {
    kind: "dynamic",
    title: "AI Insight",
    snippet: "Chart and narrative generated for your question.",
    keywords: [],
  },
]

/** Every real, renderable widget kind — used to validate AI-generated output. */
export const KNOWN_WIDGET_KINDS: WidgetKind[] = WIDGETS.map((w) => w.kind)

export interface DashboardPreset {
  label: string
  items: { kind: WidgetKind; span: 0.5 | 1; title?: string }[]
}

/**
 * Detect a "build a whole dashboard" request and return the full preset of
 * sections to assemble (e.g. "build a PR impact dashboard for Tesla").
 */
export function matchDashboard(prompt: string): DashboardPreset | null {
  const p = prompt.toLowerCase()
  const isBuild = /\b(build|create|make|generate|assemble|set up|put together)\b/.test(
    p
  )
  if (!isBuild || !/\bdashboard\b/.test(p)) return null

  if (/pr[\s-]?impact|\bimpact\b|\bpr\b/.test(p)) {
    return {
      label: "PR Impact",
      items: [
        { kind: "cover-kpi", span: 1, title: "PR Impact" },
        { kind: "gauge", span: 0.5 },
        { kind: "sentiment", span: 0.5 },
        { kind: "competitor-heatmap", span: 1 },
        { kind: "themes", span: 0.5 },
        { kind: "publications", span: 0.5 },
        { kind: "articles", span: 1 },
      ],
    }
  }

  return {
    label: "Media",
    items: [
      { kind: "cover-kpi", span: 1 },
      { kind: "line", span: 1 },
      { kind: "sentiment", span: 0.5 },
      { kind: "themes", span: 0.5 },
      { kind: "publications", span: 1 },
      { kind: "articles", span: 1 },
    ],
  }
}

/** First widget whose keyword appears in the prompt (case-insensitive). */
export function matchWidget(prompt: string): WidgetDef | null {
  const p = prompt.toLowerCase()
  return WIDGETS.find((w) => w.keywords.some((k) => p.includes(k))) ?? null
}

export function widgetDef(kind: WidgetKind): WidgetDef {
  return WIDGETS.find((w) => w.kind === kind) ?? WIDGETS[0]
}

/** Category widgets whose chart type can be switched (donut/pie/bar). */
const CATEGORY_KINDS: WidgetKind[] = [
  "sentiment",
  "original-syndicated",
  "themes",
  "publications",
]
export function isCategoryKind(kind: WidgetKind): boolean {
  return CATEGORY_KINDS.includes(kind)
}

function categoryData(kind: WidgetKind, detail: DashboardDetail) {
  switch (kind) {
    case "sentiment":
      return { data: detail.sentiment.data, centerLabel: detail.sentiment.centerLabel }
    case "original-syndicated":
      return {
        data: detail.originalSyndicated.data,
        centerLabel: detail.originalSyndicated.centerLabel,
      }
    case "themes":
      return {
        data: detail.themeDistribution.map((t) => ({
          label: t.theme,
          value: t.articles,
        })),
        centerLabel: "Articles",
      }
    case "publications":
      return {
        data: detail.topPublications.map((p) => ({ label: p.label, value: p.value })),
        centerLabel: "Articles",
      }
    default:
      return { data: [], centerLabel: "" }
  }
}

/** Detect a requested chart type from a prompt. */
export function detectViz(prompt: string): CategoryViz | null {
  const p = prompt.toLowerCase()
  if (/\bpie\b/.test(p)) return "pie"
  if (/donut|doughnut|ring/.test(p)) return "donut"
  if (/\bbars?\b|column/.test(p)) return "bar"
  return null
}

/** Whether the prompt is asking for an insight / narrative. */
export function wantsInsight(prompt: string): boolean {
  return /insight|summary|note|takeaway|line|caption|analysis|narrative/i.test(
    prompt
  )
}

/** Data-derived insight sentence, optionally shaped by an edit direction. */
/** Charts that can carry an insight (everything except the cover hero). */
export function isInsightable(kind: WidgetKind): boolean {
  return kind !== "cover-kpi"
}

/** "add insights for all charts" style bulk request. */
export function wantsAllInsights(prompt: string): boolean {
  const p = prompt.toLowerCase()
  return /insight/.test(p) && /\b(all|every|each)\b/.test(p)
}

/** Build a short snippet insight (for bulk / concise requests). */
function threeLiner(kind: WidgetKind, detail: DashboardDetail): string {
  if (isCategoryKind(kind)) {
    const { data } = categoryData(kind, detail)
    const total = data.reduce((s, x) => s + x.value, 0) || 1
    const sorted = [...data].sort((a, b) => b.value - a.value)
    const pct = (i: number) =>
      sorted[i] ? Math.round((sorted[i].value / total) * 100) : 0
    const second = sorted[1]
      ? `${sorted[1].label} follows at ${pct(1)}%`
      : `the rest of the field stays minor`
    return `${sorted[0].label} leads at ${pct(0)}% of ${total.toLocaleString()}, with ${second} — the top two together carry ${pct(0) + pct(1)}% of the mix.`
  }
  if (kind === "gauge") {
    const s = detail.prImpactScore
    const read =
      s >= 66
        ? "a strong, authoritative footprint"
        : s >= 40
          ? "moderate, with room to grow prominence"
          : "low — visibility needs a push"
    return `PR impact sits at ${s.toFixed(1)} / 100 — ${read}. Outlet authority and story placement are the biggest levers to move it.`
  }
  return `${detail.summary.name} coverage held within a normal band, with no single story or channel dominating the period. Watch for emerging themes that could break the pattern.`
}

/** Build a five-line, data-derived insight (for "detailed" requests). */
function fiveLiner(kind: WidgetKind, detail: DashboardDetail): string {
  if (isCategoryKind(kind)) {
    const { data } = categoryData(kind, detail)
    const total = data.reduce((s, x) => s + x.value, 0) || 1
    const sorted = [...data].sort((a, b) => b.value - a.value)
    const pct = (i: number) =>
      sorted[i] ? Math.round((sorted[i].value / total) * 100) : 0
    const top3 = pct(0) + pct(1) + pct(2)
    return [
      `${sorted[0].label} dominates at ${pct(0)}% of ${total.toLocaleString()} total.`,
      sorted[1]
        ? `${sorted[1].label} is second at ${pct(1)}%.`
        : `The field behind the leader is thin.`,
      sorted[2]
        ? `${sorted[2].label} rounds out the top three at ${pct(2)}%.`
        : `Coverage concentrates in the top two categories.`,
      `Together the top three make up ${top3}% of the mix.`,
      `Focus messaging on ${sorted[0].label} while watching the tail for shifts.`,
    ].join("\n")
  }
  if (kind === "gauge") {
    const s = detail.prImpactScore
    return [
      `PR impact score sits at ${s.toFixed(1)} out of 100.`,
      `That reflects prominence, reach and message pull-through combined.`,
      s >= 66
        ? `The score is strong — coverage is landing with authority.`
        : s >= 40
          ? `The score is moderate — there is clear room to lift prominence.`
          : `The score is low — visibility needs a concerted push.`,
      `Outlet authority and story placement are the biggest levers here.`,
      `Prioritise tier-one placements to move the number next period.`,
    ].join("\n")
  }
  return [
    `${detail.summary.name} coverage held its shape across the window.`,
    `Volume stayed within a normal band with no major spikes.`,
    `The mix of channels and themes was broadly consistent week to week.`,
    `No single story dominated the narrative this period.`,
    `Keep monitoring for emerging themes that could break the pattern.`,
  ].join("\n")
}

export function generateInsight(
  kind: WidgetKind,
  detail: DashboardDetail,
  direction = ""
): string {
  const d = direction.toLowerCase()
  if (/three|3[\s-]?line/.test(d)) return threeLiner(kind, detail)
  if (/detail|detailed|five|5[ -]?line|long|elaborate|expand/.test(d)) {
    return fiveLiner(kind, detail)
  }
  let base = ""

  if (kind === "sentiment" || kind === "original-syndicated") {
    const set =
      kind === "sentiment" ? detail.sentiment.data : detail.originalSyndicated.data
    const total = set.reduce((s, x) => s + x.value, 0) || 1
    const top = [...set].sort((a, b) => b.value - a.value)[0]
    const pct = (v: number) => Math.round((v / total) * 100)
    base = `${top.label} dominates at ${pct(top.value)}% of ${total.toLocaleString()} — the clear driver this period.`
  } else if (kind === "themes") {
    const t = [...detail.themeDistribution].sort((a, b) => b.articles - a.articles)[0]
    base = `“${t.theme}” is the leading theme with ${t.articles} articles, well ahead of the field.`
  } else if (kind === "publications") {
    const p = [...detail.topPublications].sort((a, b) => b.value - a.value)[0]
    base = `${p.label} led distribution with ${p.value} stories this period.`
  } else {
    base = `${detail.summary.name} coverage held steady across the window with no major swings.`
  }

  let text = base
  if (/short|concise|brief|trim|tighter/.test(d)) text = base.split("—")[0].trim() + "."
  else if (/detail|expand|elaborate|more|longer/.test(d))
    text = base + " Track it week-over-week to confirm the trend holds."
  if (/risk|negative|concern|caution|down/.test(d))
    text += " Watch the downside for early risk signals."
  if (/positive|opportunit|strength|up/.test(d))
    text += " Lean into the momentum in outreach."
  return text
}

export interface RenderOpts {
  viz?: CategoryViz
  title?: string
  cover?: CoverBg
  gaugeGradient?: boolean
  summary?: string
  /** Ad-hoc chart payload for the "dynamic" kind (see DynamicChart above). */
  chart?: DynamicChart
  liveData?: Record<string, any>
}

/** Executive-summary text; `rewrite` leads with headline KPI metrics. */
export function generateExecSummary(
  detail: DashboardDetail,
  rewrite = false
): string {
  if (!rewrite) return detail.executiveSummary
  const kpiLine = detail.kpis
    .slice(0, 3)
    .map(
      (k) =>
        `${k.label.toLowerCase()} at ${formatValue(k.value, {
          format: k.format === "percent" ? "percent" : "compact",
          prefix: k.prefix,
          suffix: k.format === "percent" ? undefined : k.suffix,
        })}`
    )
    .join(", ")
  return `Headline metrics this period: ${kpiLine}. ${detail.executiveSummary}`
}

/** Render a widget's chart body; opts override chart type / cover title & bg. */
export function renderWidget(
  kind: WidgetKind,
  detail: DashboardDetail,
  opts: RenderOpts = {}
): ReactNode {
  const effectiveDetail = opts.liveData ? { ...detail, ...opts.liveData } : detail
  if (opts.viz && isCategoryKind(kind)) {
    const { data, centerLabel } = categoryData(kind, effectiveDetail)
    return <CategoryChart data={data} centerLabel={centerLabel} viz={opts.viz} />
  }
  switch (kind) {
    case "cover-kpi":
      return (
        <CoverKpiCard
          title={opts.title ?? effectiveDetail.summary?.name ?? detail.summary?.name}
          subtitle={effectiveDetail.summary?.description ?? detail.summary?.description}
          kpis={effectiveDetail.kpis ?? detail.kpis}
          cover={opts.cover}
        />
      )
    case "executive-summary":
      return (
        <ExecSummaryWidget summary={opts.summary ?? effectiveDetail.executiveSummary ?? detail.executiveSummary} />
      )
    case "gauge":
      return (
        <div className="flex min-h-[280px] w-full items-center justify-center">
          <ReachGauge
            value={effectiveDetail.prImpactScore ?? detail.prImpactScore}
            centerValue={effectiveDetail.prImpactScore ?? detail.prImpactScore}
            label="PR Impact"
            formatOptions={{ notation: "standard", maximumFractionDigits: 1 }}
            gradient={opts.gaugeGradient}
          />
        </div>
      )
    case "competitor-heatmap":
      return <PrImpactHeatmap data={effectiveDetail.competitorHeatmap ?? detail.competitorHeatmap} />
    case "heatmap":
      return <BrandImpactHeatmap data={effectiveDetail.heatmap ?? detail.heatmap} />
    case "line":
      return <CoverageLineChart data={effectiveDetail.area ?? detail.area} />
    case "themes":
      return (
        <div className="w-full">
          <ThemeDistributionChart data={effectiveDetail.themeDistribution ?? detail.themeDistribution} />
        </div>
      )
    case "sentiment":
      return (
        <div className="flex min-h-[360px] w-full items-center justify-center">
          <SentimentDonut data={effectiveDetail.sentiment ?? detail.sentiment} />
        </div>
      )
    case "original-syndicated":
      return <OriginalSyndicatedDonut data={effectiveDetail.originalSyndicated ?? detail.originalSyndicated} />
    case "publications":
      return (
        <div className="w-full">
          <RankedBarChart
            gradientId="build-pub-grad"
            color="#6d5ef6"
            data={effectiveDetail.topPublications ?? detail.topPublications}
            filterMode="source"
          />
        </div>
      )
    case "articles":
      return <TopArticles articles={effectiveDetail.topArticles ?? detail.topArticles} />
    case "sov":
      return (
        <div className="w-full">
          <SovChart data={effectiveDetail.sovData ?? detail.sovData ?? []} />
        </div>
      )
    case "competitor-sentiment":
      return (
        <div className="w-full">
          <CompetitorSentimentChart data={effectiveDetail.competitorSentiment ?? detail.competitorSentiment ?? []} />
        </div>
      )
    case "table":
      return (
        <div className="w-full overflow-x-auto rounded-xl border border-black/10 bg-white p-4 shadow-2xs">
          <table className="w-full text-left text-[13px] text-slate-700">
            <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-900">
              <tr>
                <th className="p-2.5">Metric / Row</th>
                <th className="p-2.5">Value</th>
                <th className="p-2.5">Status</th>
                <th className="p-2.5">Category</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="p-2.5 font-medium text-slate-900">Total Mention Volume</td>
                <td className="p-2.5">18,450</td>
                <td className="p-2.5"><span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">Active</span></td>
                <td className="p-2.5">Volume</td>
              </tr>
              <tr>
                <td className="p-2.5 font-medium text-slate-900">Estimated Reach</td>
                <td className="p-2.5">14.2M</td>
                <td className="p-2.5"><span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">High</span></td>
                <td className="p-2.5">Audience</td>
              </tr>
              <tr>
                <td className="p-2.5 font-medium text-slate-900">Net Sentiment Score</td>
                <td className="p-2.5">89.2%</td>
                <td className="p-2.5"><span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">Positive</span></td>
                <td className="p-2.5">Perception</td>
              </tr>
              <tr>
                <td className="p-2.5 font-medium text-slate-900">PR Impact Score</td>
                <td className="p-2.5">88.5 / 100</td>
                <td className="p-2.5"><span className="rounded bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-700">Optimal</span></td>
                <td className="p-2.5">Impact</td>
              </tr>
            </tbody>
          </table>
        </div>
      )
    case "image":
      return (
        <div className="flex flex-col items-center justify-center p-4">
          <img
            src="/gallery-bg.jpg"
            alt="AI Generated Asset"
            className="h-64 w-full rounded-xl object-cover shadow-xs"
          />
          <p className="mt-2 text-xs font-medium text-slate-500">AI Generated Media & Visual Asset</p>
        </div>
      )
    case "dynamic":
      return opts.chart ? (
        <div className="flex min-h-[280px] w-full items-center justify-center">
          <DynamicChartRenderer chart={opts.chart} />
        </div>
      ) : null
    default:
      return null
  }
}
