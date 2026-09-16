/**
 * AlphaMetricx — Data contract
 * ---------------------------------------
 * These types are the single source of truth for the shape of data the UI
 * consumes. During dev handover, replace the mock loaders in `mock.ts` with
 * real API calls that resolve to these exact shapes. The UI never needs to
 * change as long as the API conforms to these interfaces.
 */

export type ProjectStatus = "active" | "onboarding" | "archived"

export interface Project {
  id: string
  name: string
  client: string
  industry: string
  description: string
  status: ProjectStatus
  /** Number of dashboards configured for this project. */
  dashboardCount: number
  /** ISO date string of last data refresh. */
  updatedAt: string
  /** Two-letter monogram for the project avatar. */
  monogram: string
}

export type DashboardCategory =
  | "Coverage"
  | "Sentiment"
  | "Audience"
  | "Competitive"
  | "Campaign"

export interface DashboardSummary {
  id: string
  projectId: string
  name: string
  description: string
  category: DashboardCategory
  /** Material Symbols icon name, resolved in the UI. */
  icon: string
  /** How many widgets/metrics this dashboard surfaces. */
  metricCount: number
  /** Whether preview data is wired up (vs. coming soon). */
  ready: boolean
  /** Default cover image URL for the hero panel (per dashboard). */
  cover?: string
}

export type TrendDirection = "up" | "down" | "flat"

export interface Kpi {
  id: string
  label: string
  value: number
  /** Optional value formatting hint for the UI. */
  format?: "number" | "compact" | "percent" | "currency"
  prefix?: string
  suffix?: string
  /** Percentage change vs. previous period. */
  delta: number
  direction: TrendDirection
  /** Whether an increase is good (affects delta color). */
  positiveIsGood?: boolean
}

/** One row of a time series. `date` drives the x-axis. */
export interface TimeSeriesPoint {
  date: Date
  [seriesKey: string]: Date | number
}

export interface AreaSeriesConfig {
  key: string
  label: string
  color: string
  fillOpacity?: number
}

export interface AreaChartData {
  title: string
  description: string
  /** Optional caption shown under the chart. */
  caption?: string
  series: AreaSeriesConfig[]
  points: TimeSeriesPoint[]
}

export interface CategoryDatum {
  label: string
  value: number
  color?: string
}

export interface PieChartData {
  title: string
  description: string
  /** Value shown in the donut center. */
  centerLabel: string
  /** Optional caption shown under the chart. */
  caption?: string
  data: CategoryDatum[]
}

export interface MonthlyPoint {
  month: string
  value: number
}

/** One week of PR-impact scores, one score per brand (index-aligned to BRANDS). */
export interface HeatmapWeek {
  weekStart: string
  scores: number[]
}

/**
 * Competitor PR-impact heatmap — rows are companies, columns are weeks.
 * Each week's `scores` are index-aligned to `companies`, bucketed 0–4
 * (0 = lowest impact / red, 4 = highest impact / green).
 */
export interface CompetitorHeatmap {
  companies: string[]
  weeks: HeatmapWeek[]
}

/** One theme's article volume (theme distribution bar chart). */
export interface ThemeVolume {
  theme: string
  articles: number
}

/** A generic ranked {label, value} item (e.g. top publications). */
export interface RankedItem {
  label: string
  value: number
}

/** A top article (positive or negative). */
export interface Article {
  title: string
  source: string
  date: string
  category: string
  body: string
  sentiment: "positive" | "negative"
  /** Optional article URL for clickable headline. */
  url?: string
  /** Optional thumbnail; a placeholder is shown when absent. */
  image?: string
}

/** A theme for the insights explainer (pill ↔ detail + image). */
export interface ThemeInsight {
  label: string
  /** Teal headline sentence. */
  summary: string
  /** Supporting body copy. */
  insight: string
  /** Optional illustration URL; a gradient placeholder is used when absent. */
  image?: string
}

export interface DashboardDetail {
  summary: DashboardSummary
  kpis: Kpi[]
  area: AreaChartData
  pie: PieChartData
  /** Short narrative shown in the Executive Summary panel. */
  executiveSummary: string
  /** PR Impact Score, 0.0–100.0, shown in the gauge. */
  prImpactScore: number
  /** Monthly results series for the "Results over time" bar chart. */
  results: MonthlyPoint[]
  /** Sentiment breakdown for the donut (positive/negative/neutral/unassigned). */
  sentiment: PieChartData
  /** Original vs syndicated split (donut). */
  originalSyndicated: PieChartData
  /** Top publications by article count (horizontal bars). */
  topPublications: RankedItem[]
  /** Caption under the top-publications chart. */
  publicationsCaption?: string
  /** Weekly PR-impact scores for Tesla + competitors (heatmap). */
  heatmap: HeatmapWeek[]
  /** Competitor PR-impact heatmap (companies × weeks, red→green). */
  competitorHeatmap: CompetitorHeatmap
  /** Top themes by article volume (horizontal bar chart). */
  themeDistribution: ThemeVolume[]
  /** Caption shown under the theme-distribution chart. */
  themeCaption?: string
  /** Top positive themes for the insights explainer. */
  themes: ThemeInsight[]
  /** Top negative themes for the insights explainer. */
  negativeThemes: ThemeInsight[]
  /** Top articles (positive + negative). */
  topArticles: Article[]
}
