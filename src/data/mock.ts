/**
 * AlphaMetricx — Mock data layer
 * -----------------------------------------
 * Every export here mimics an API response conforming to `types.ts`.
 * The functions are async on purpose: at handover, swap the bodies for
 * `fetch(...)` calls and the components consuming them will not change.
 */
import type {
  AreaChartData,
  CompetitorHeatmap,
  DashboardDetail,
  DashboardSummary,
  HeatmapWeek,
  PieChartData,
  Project,
  TimeSeriesPoint,
} from "./types"

/* ----------------------------- seeded RNG ----------------------------- */
function seeded(seed: number) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}

function hash(str: string) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0
  return Math.abs(h)
}

/* ------------------------------ projects ------------------------------ */
export const projects: Project[] = [
  {
    id: "meridian-telecom",
    name: "Meridian Telecom",
    client: "Meridian Group",
    industry: "Telecommunications",
    description:
      "Corporate reputation and 5G launch coverage across earned and social media.",
    status: "active",
    dashboardCount: 6,
    updatedAt: "2026-07-27",
    monogram: "MT",
  },
  {
    id: "northwind-energy",
    name: "Northwind Energy",
    client: "Northwind Holdings",
    industry: "Energy & Utilities",
    description:
      "ESG narrative tracking and crisis monitoring for the renewables transition.",
    status: "active",
    dashboardCount: 5,
    updatedAt: "2026-07-26",
    monogram: "NE",
  },
  {
    id: "aria-health",
    name: "Aria Health",
    client: "Aria Health Systems",
    industry: "Healthcare",
    description:
      "Brand health and physician sentiment ahead of the national expansion.",
    status: "active",
    dashboardCount: 4,
    updatedAt: "2026-07-25",
    monogram: "AH",
  },
  {
    id: "vantage-retail",
    name: "Vantage Retail",
    client: "Vantage Brands",
    industry: "Retail & Consumer",
    description:
      "Campaign performance and share-of-voice benchmarking vs. category rivals.",
    status: "onboarding",
    dashboardCount: 3,
    updatedAt: "2026-07-22",
    monogram: "VR",
  },
  {
    id: "oshkosh-corp",
    name: "Oshkosh Corporation",
    client: "Oshkosh Corporation",
    industry: "Industrial & Defense",
    description:
      "Media measurement across defense, vocational and access-equipment coverage.",
    status: "active",
    dashboardCount: 4,
    updatedAt: "2026-07-28",
    monogram: "OC",
  },
]

/* ------------------------- dashboard catalogue ------------------------ */
interface DashboardTemplate {
  slug: string
  name: string
  description: string
  category: DashboardSummary["category"]
  icon: string
  metricCount: number
  ready: boolean
  /** Default hero cover image for this dashboard. */
  cover?: string
}

const DASHBOARD_TEMPLATES: DashboardTemplate[] = [
  {
    slug: "coverage-overview",
    name: "Media Coverage Overview",
    description:
      "Volume, reach and share of voice across earned media over time.",
    category: "Coverage",
    icon: "Newspaper",
    metricCount: 6,
    ready: true,
  },
  {
    slug: "sentiment-pulse",
    name: "Sentiment Pulse",
    description:
      "How tone is trending and where positive and negative coverage concentrates.",
    category: "Sentiment",
    icon: "Activity",
    metricCount: 5,
    ready: true,
  },
  {
    slug: "audience-reach",
    name: "Audience & Reach",
    description: "Estimated reach, impressions and audience overlap by channel.",
    category: "Audience",
    icon: "Users",
    metricCount: 4,
    ready: false,
  },
  {
    slug: "competitive-sov",
    name: "Competitive Share of Voice",
    description: "Benchmark your presence against category competitors.",
    category: "Competitive",
    icon: "Swords",
    metricCount: 5,
    ready: false,
  },
  {
    slug: "campaign-tracker",
    name: "Campaign Tracker",
    description: "Coverage and engagement mapped to active campaign windows.",
    category: "Campaign",
    icon: "Megaphone",
    metricCount: 4,
    ready: false,
  },
  {
    slug: "spokesperson-index",
    name: "Spokesperson Index",
    description: "Message pull-through and quote share by named spokesperson.",
    category: "Coverage",
    icon: "Quote",
    metricCount: 3,
    ready: false,
  },
]

/** Oshkosh Corporation — four dashboards, each with its own hero cover. */
const OSHKOSH_DASHBOARDS: DashboardTemplate[] = [
  {
    slug: "media-measurement",
    name: "Media Measurement",
    description:
      "Coverage, reach, sentiment and share of voice across earned and owned media.",
    category: "Coverage",
    icon: "Newspaper",
    metricCount: 6,
    ready: true,
    cover:
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=900&h=1400&fit=crop&auto=format&q=70",
  },
  {
    slug: "pr-impact",
    name: "PR Impact",
    description:
      "Message pull-through, prominence and the PR impact score by outlet and story.",
    category: "Coverage",
    icon: "Megaphone",
    metricCount: 5,
    ready: true,
    cover:
      "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=900&h=1400&fit=crop&auto=format&q=70",
  },
  {
    slug: "narrative-intelligence",
    name: "Narrative Intelligence",
    description:
      "Themes, framing and emerging narratives shaping the conversation this period.",
    category: "Sentiment",
    icon: "Activity",
    metricCount: 5,
    ready: true,
    cover:
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=900&h=1400&fit=crop&auto=format&q=70",
  },
  {
    slug: "daily-monitoring",
    name: "Daily Monitoring",
    description:
      "Real-time coverage, alerts and spikes across the last 24 hours.",
    category: "Coverage",
    icon: "Radar",
    metricCount: 4,
    ready: true,
    cover:
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=900&h=1400&fit=crop&auto=format&q=70",
  },
]

function buildDashboards(projectId: string): DashboardSummary[] {
  const project = projects.find((p) => p.id === projectId)
  const templates =
    projectId === "oshkosh-corp" ? OSHKOSH_DASHBOARDS : DASHBOARD_TEMPLATES
  const count = project?.dashboardCount ?? templates.length
  return templates.slice(0, count).map((t) => ({
    id: t.slug,
    projectId,
    name: t.name,
    description: t.description,
    category: t.category,
    icon: t.icon,
    metricCount: t.metricCount,
    ready: t.ready,
    cover: t.cover,
  }))
}

/* --------------------------- detail generator ------------------------- */
function buildAreaData(seed: number, emphasis: "coverage" | "sentiment"): AreaChartData {
  const rnd = seeded(seed)
  const days = 30
  const points: TimeSeriesPoint[] = []
  const start = new Date("2026-06-28")

  // Deterministic-but-varied shape params per dashboard.
  const phase = rnd() * Math.PI * 2
  const brandBase = 150 + Math.floor(rnd() * 40)
  const compBase = 105 + Math.floor(rnd() * 30)
  const peakDay = 19 + Math.floor(rnd() * 5) // campaign lift location

  for (let i = 0; i < days; i++) {
    const date = new Date(start)
    date.setDate(start.getDate() + i)
    const x = i / (days - 1)

    // Smooth upward trend + gentle seasonal waves + a gaussian campaign lift.
    const brandTrend = brandBase + 72 * x
    const brandSeason = 13 * Math.sin(x * Math.PI * 3 + phase)
    const campaign = 62 * Math.exp(-((i - peakDay) ** 2) / 20)
    const brandNoise = (rnd() - 0.5) * 7
    const brand = Math.round(brandTrend + brandSeason + campaign + brandNoise)

    const compTrend = compBase + 30 * x
    const compSeason = 9 * Math.sin(x * Math.PI * 2.2 + phase + 1)
    const compNoise = (rnd() - 0.5) * 6
    const competitor = Math.round(compTrend + compSeason + compNoise)

    points.push({ date, brand, competitor })
  }

  return {
    title: emphasis === "coverage" ? "Coverage Volume" : "Tone Over Time",
    description:
      emphasis === "coverage"
        ? "Daily earned-media mentions — your brand vs. nearest competitor."
        : "Daily positive vs. negative mention volume across all channels.",
    caption: "Coverage peaked around the mid-window campaign and settled after.",
    series: [
      {
        key: "brand",
        label: emphasis === "coverage" ? "Your brand" : "Positive",
        color: "var(--chart-line-primary)",
        fillOpacity: 0.28,
      },
      {
        key: "competitor",
        label: emphasis === "coverage" ? "Competitor" : "Negative",
        color: "var(--chart-line-secondary)",
        fillOpacity: 0.18,
      },
    ],
    points,
  }
}

function buildPieData(seed: number, emphasis: "coverage" | "sentiment"): PieChartData {
  const rnd = seeded(seed + 7)
  if (emphasis === "sentiment") {
    const pos = 44 + Math.floor(rnd() * 14)
    const neg = 12 + Math.floor(rnd() * 10)
    const mixed = 8 + Math.floor(rnd() * 6)
    const neu = 100 - pos - neg - mixed
    return {
      title: "Sentiment Split",
      description: "Share of coverage by tone across the current period.",
      centerLabel: "Mentions",
      data: [
        { label: "Positive", value: pos, color: "var(--chart-1)" },
        { label: "Neutral", value: neu, color: "var(--chart-3)" },
        { label: "Mixed", value: mixed, color: "var(--chart-4)" },
        { label: "Negative", value: neg, color: "var(--chart-2)" },
      ],
    }
  }
  const news = 1600 + Math.floor(rnd() * 900)
  const online = 1200 + Math.floor(rnd() * 700)
  const social = 900 + Math.floor(rnd() * 600)
  const broadcast = 380 + Math.floor(rnd() * 260)
  const podcast = 160 + Math.floor(rnd() * 140)
  return {
    title: "Channel Mix",
    description: "Where coverage is landing, by media channel.",
    centerLabel: "Mentions",
    data: [
      { label: "Print & News", value: news, color: "var(--chart-1)" },
      { label: "Online", value: online, color: "var(--chart-3)" },
      { label: "Social", value: social, color: "var(--chart-4)" },
      { label: "Broadcast", value: broadcast, color: "var(--chart-2)" },
      { label: "Podcasts", value: podcast, color: "var(--chart-5)" },
    ],
  }
}

/** Competitor PR-impact heatmap: N companies × ~26 weeks, scores bucketed 0–4. */
function buildCompetitorHeatmap(
  seed: number,
  companies: string[],
  /** Per-company mean impact (0–4) so rows read greener/redder. */
  baselines: number[]
): CompetitorHeatmap {
  const rnd = seeded(seed + 91)
  const weeks: HeatmapWeek[] = Array.from({ length: 53 }, (_, w) => {
    const d = new Date("2025-08-03") // a Sunday (aligns quarter separators)
    d.setDate(d.getDate() + w * 7)
    return {
      weekStart: d.toISOString().slice(0, 10),
      scores: companies.map((_, ci) => {
        const base = baselines[ci] ?? 2
        const v = Math.round(base + (rnd() - 0.5) * 2.4)
        return Math.max(0, Math.min(4, v))
      }),
    }
  })
  return { companies, weeks }
}

function buildDetail(projectId: string, dashboardId: string): DashboardDetail | null {
  const summary = buildDashboards(projectId).find((d) => d.id === dashboardId)
  if (!summary || !summary.ready) return null

  const emphasis: "coverage" | "sentiment" =
    summary.category === "Sentiment" ? "sentiment" : "coverage"
  const seed = hash(projectId + dashboardId)
  const rnd = seeded(seed)

  const isOshkoshMedia =
    projectId === "oshkosh-corp" && dashboardId === "media-measurement"
  const isOshkosh = projectId === "oshkosh-corp"
  const baseArea = buildAreaData(seed, emphasis)
  const area: AreaChartData = isOshkoshMedia
    ? {
        ...baseArea,
        title: "Coverage Over Time",
        description:
          "Article volume per day, with missing days zero-filled for a continuous series.",
        caption:
          "Coverage peaked sharply on July 2 with 150 articles, dwarfing averages, due to syndication of competitor programs and industry market analyses. Oshkosh's own activity clustered on July 1 but was outpaced by broader sector and competitor attention.",
      }
    : baseArea
  const pie = buildPieData(seed, emphasis)

  const totalMentions = pie.data.reduce((s, d) => s + d.value, 0)
  const reach = 4.2 + rnd() * 3.5
  const sov = 28 + Math.floor(rnd() * 22)
  const netSentiment = emphasis === "sentiment" ? 32 + Math.floor(rnd() * 20) : 41 + Math.floor(rnd() * 14)

  const kpis: DashboardDetail["kpis"] = isOshkoshMedia
    ? [
        { id: "volume", label: "Total volume", value: 225, format: "number", delta: 0, direction: "flat", positiveIsGood: true },
        { id: "sentiment", label: "Net sentiment", value: 1, format: "percent", delta: 0, direction: "flat", positiveIsGood: true },
        { id: "reach", label: "Aggregate reach", value: 807, suffix: "M", delta: 0, direction: "flat", positiveIsGood: true },
        { id: "neutral", label: "Neutral share", value: 99, format: "percent", delta: 0, direction: "flat", positiveIsGood: true },
      ]
    : [
        {
          id: "mentions",
          label: "Total mentions",
          value: totalMentions,
          format: "compact",
          delta: +(6 + rnd() * 10).toFixed(1),
          direction: "up",
          positiveIsGood: true,
        },
        {
          id: "reach",
          label: "Estimated reach",
          value: +reach.toFixed(1),
          suffix: "M",
          delta: +(3 + rnd() * 8).toFixed(1),
          direction: "up",
          positiveIsGood: true,
        },
        {
          id: "sov",
          label: "Share of voice",
          value: sov,
          format: "percent",
          delta: +(rnd() * 6 - 2).toFixed(1),
          direction: rnd() > 0.4 ? "up" : "down",
          positiveIsGood: true,
        },
        {
          id: "sentiment",
          label: "Net sentiment",
          value: netSentiment,
          format: "percent",
          delta: +(rnd() * 9 - 3).toFixed(1),
          direction: rnd() > 0.5 ? "up" : "down",
          positiveIsGood: true,
        },
      ]

  return {
    summary,
    kpis,
    area,
    pie,
    prImpactScore: +(58 + rnd() * 38).toFixed(1),
    results: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((month, i) => ({
      month,
      value: Math.round(40 + i * 8 + rnd() * 22 + (i === 5 ? 14 : 0)),
    })),
    sentiment: {
      title: "Sentiment",
      description: "Share of coverage by tone.",
      centerLabel: "Total",
      caption: isOshkoshMedia
        ? "Sentiment for Oshkosh coverage is overwhelmingly neutral (98.67%), with only 3 positive posts (1.33%) and zero negative coverage—demonstrating reputational safety but also low differentiation. The net sentiment score sits at 1.33, highlighting a lack of emotional engagement or controversy in the news flow."
        : "Coverage skews positive this period, with a small neutral core and limited negativity.",
      data: [
        { label: "Positive", value: 40 + Math.floor(rnd() * 20), color: "#17b26a" },
        { label: "Negative", value: 10 + Math.floor(rnd() * 10), color: "#d31717" },
        { label: "Neutral", value: 18 + Math.floor(rnd() * 10), color: "#64748b" },
        { label: "Unassigned", value: 6 + Math.floor(rnd() * 8), color: "#cbd5e1" },
      ],
    },
    originalSyndicated: {
      title: "Original vs Syndicated",
      description:
        "Share of original articles versus syndicated copies, grouped by shared (normalized) title.",
      centerLabel: "Total",
      caption: isOshkoshMedia
        ? "Syndicated content makes up 72.89% of Oshkosh-related and industry coverage, with only 27.11% originating as exclusive reporting. High syndication of industry news means fewer chances for Oshkosh to tell unique, differentiated stories."
        : "Most coverage is original reporting, with a smaller share of syndicated pickups.",
      data: isOshkoshMedia
        ? [
            { label: "Original", value: 61, color: "#2f4bd8" },
            { label: "Syndicated", value: 164, color: "#5fd0a9" },
          ]
        : [
            { label: "Original", value: Math.round(totalMentions * 0.62), color: "#2f4bd8" },
            { label: "Syndicated", value: Math.round(totalMentions * 0.38), color: "#5fd0a9" },
          ],
    },
    topPublications: isOshkoshMedia
      ? [
          { label: "ainvest.com", value: 12 },
          { label: "themarketperiodical.com", value: 4 },
          { label: "Military Leak", value: 3 },
          { label: "Defence Blog", value: 3 },
          { label: "byteseu.com", value: 2 },
          { label: "Yahoo", value: 2 },
          { label: "Archyde", value: 2 },
          { label: "Morningstar", value: 2 },
          { label: "MarketScreener", value: 2 },
          { label: "MSN", value: 2 },
        ]
      : [
          { label: "Reuters", value: Math.round(totalMentions * 0.08) },
          { label: "Bloomberg", value: Math.round(totalMentions * 0.06) },
          { label: "Yahoo", value: Math.round(totalMentions * 0.05) },
          { label: "MSN", value: Math.round(totalMentions * 0.04) },
          { label: "Morningstar", value: Math.round(totalMentions * 0.03) },
        ],
    publicationsCaption: isOshkoshMedia
      ? "Oshkosh stories were picked up by trade and regional media, but ainvest.com (12 stories) and industry blogs overwhelmingly led distribution. Generalist business press rarely covered Oshkosh, while top competitor news was widely syndicated."
      : "Coverage clustered in a handful of wire and business outlets this period.",
    heatmap: Array.from({ length: 53 }, (_, w) => {
      const d = new Date("2025-08-03") // a Sunday
      d.setDate(d.getDate() + w * 7)
      return {
        weekStart: d.toISOString().slice(0, 10),
        // 7 daily contribution counts, skewed low like an activity grid
        scores: Array.from({ length: 7 }, () =>
          Math.round(rnd() * rnd() * 6)
        ),
      }
    }),
    competitorHeatmap: isOshkosh
      ? buildCompetitorHeatmap(
          seed,
          [
            "Oshkosh",
            "Navistar",
            "PACCAR",
            "REV Group",
            "Terex",
            "Caterpillar",
            "John Deere",
          ],
          [3.3, 1.2, 2.5, 1.0, 2.1, 3.6, 1.7]
        )
      : buildCompetitorHeatmap(
          seed,
          [
            projects.find((p) => p.id === projectId)?.name ?? "Your brand",
            "Competitor A",
            "Competitor B",
            "Competitor C",
            "Competitor D",
            "Competitor E",
            "Competitor F",
          ],
          [3.1, 1.4, 2.6, 1.1, 2.2, 3.4, 1.8]
        ),
    themeDistribution: isOshkoshMedia
      ? [
          { theme: "Military Vehicle Delivery", articles: 139 },
          { theme: "Defense Economy Development", articles: 88 },
          { theme: "Market Forecasts", articles: 64 },
          { theme: "Facility Development", articles: 47 },
          { theme: "Defense Innovation", articles: 33 },
        ]
      : [
          { theme: "Product & launches", articles: Math.round(totalMentions * 0.34) },
          { theme: "Financial & earnings", articles: Math.round(totalMentions * 0.24) },
          { theme: "Sustainability", articles: Math.round(totalMentions * 0.18) },
          { theme: "Leadership", articles: Math.round(totalMentions * 0.13) },
          { theme: "Partnerships", articles: Math.round(totalMentions * 0.09) },
        ],
    themeCaption: isOshkoshMedia
      ? "Military vehicle delivery was the dominant theme (139 mentions), followed by defense economy development (16), market forecasts (8), and innovation or competitiveness storylines. Oshkosh's own themes (parts and contract wins) were clear but overshadowed."
      : "Product and financial themes led coverage, with sustainability and leadership close behind.",
    themes: [
      {
        label: "Cybertruck ramp coverage",
        summary: "Production milestones drove the largest share of positive pickup.",
        insight:
          "Cybertruck ramp coverage was the single biggest driver of positive sentiment this period, accounting for roughly a third of all favourable mentions. Reporting centred on faster-than-expected line rates and improving build quality, with trade press framing it as a turning point after a slow start. Coverage skewed heavily toward business and automotive outlets, and social amplification was strongest on X where owner delivery posts outperformed brand posts by a wide margin.",
      },
      {
        label: "Energy storage momentum",
        summary: "Megapack demand and grid wins earned a well-received update.",
        insight:
          "The energy-storage update was received positively across financial and cleantech press, with Megapack deployment figures and new grid-scale contracts cited most often. Analysts highlighted margin expansion in the energy segment as an underappreciated story, and several outlets reframed the company as an energy business as much as an automaker. Sentiment here was calmer but durable — fewer viral spikes, more sustained favourable coverage.",
      },
      {
        label: "Financial press momentum",
        summary: "Earnings beat reset the analyst narrative for the quarter.",
        insight:
          "Financial press momentum built after the quarterly beat, with 56% of mentions originating from business and markets desks. Commentary moved from cost concerns toward free-cash-flow strength and demand resilience. Notably, several previously bearish analysts softened their stance, and that shift was itself covered as a story — compounding the positive tone.",
      },
      {
        label: "Owner & community advocacy",
        summary: "Organic owner content outperformed paid and brand channels.",
        insight:
          "Owner and community advocacy remained a quiet but powerful positive force. User-generated delivery and road-trip content drove the majority of positive social engagement, and community responses to service improvements were markedly warmer than in prior periods. This grassroots layer gives the brand a sentiment floor that competitors largely lack.",
      },
      {
        label: "Sentiment recovery",
        summary: "Net sentiment strengthened +4.6 pts to 67% positive.",
        insight:
          "Overall sentiment recovery was the connective theme: net positive sentiment strengthened 4.6 points to 67%, its highest in three quarters. The recovery was broad-based rather than driven by a single event, spanning product, financial, and energy narratives. The main risk to watch is concentration on X / Twitter, where tone can reverse quickly if the news cycle turns.",
      },
    ],
    negativeThemes: [
      {
        label: "Autopilot scrutiny",
        summary:
          "Renewed regulatory attention on driver-assist safety drove the largest negative share.",
        insight:
          "Autopilot and Full Self-Driving scrutiny was the biggest single source of negative coverage, concentrated in mainstream and regulatory press. A fresh investigation reference reignited older safety narratives, and coverage leaned on incident recaps rather than new facts. Sentiment was sharpest on general-news desks; specialist automotive outlets were more measured.",
      },
      {
        label: "Pricing & margin pressure",
        summary: "Discounting reignited questions about demand and margin durability.",
        insight:
          "Price cuts drove a wave of bearish commentary framing discounts as demand weakness rather than share capture. Financial press was split, but headlines skewed negative, and the phrase 'margin compression' recurred across coverage. This theme is volatile and tends to spike around any pricing action.",
      },
      {
        label: "Executive distraction",
        summary: "Leadership's outside activities pulled focus from product wins.",
        insight:
          "A meaningful slice of negative mentions tied to the CEO's non-Tesla activities and public commentary, which several outlets framed as a governance and focus risk. This coverage is largely detached from fundamentals but reliably dampens otherwise positive news cycles.",
      },
      {
        label: "Service & delivery gripes",
        summary: "Owner complaints about wait times surfaced in regional coverage.",
        insight:
          "Service wait times and delivery logistics generated persistent low-level negative sentiment, mostly in regional and community channels. Volume is modest but steady, and it erodes the otherwise strong owner-advocacy signal. Improvements were noted, but not yet enough to flip the narrative.",
      },
      {
        label: "Competitive pressure",
        summary: "Rivals' launches were positioned against Tesla in comparison coverage.",
        insight:
          "Competitor launches drove comparison pieces that cast Tesla on the defensive, particularly around software and charging access deals. The tone was analytical rather than hostile, but the framing repeatedly used Tesla as the benchmark to beat — a double-edged signal.",
      },
    ],
    topArticles: isOshkoshMedia
      ? [
          {
            sentiment: "positive",
            title: "Oshkosh's biggest June stories include City Center, Oshkosh Defense",
            source: "The Northwestern",
            date: "Jul 1",
            category: "Defense Contract Opportunity",
            body: "Oshkosh Defense may regain work on Joint Light Tactical Vehicles due to delivery delays from the current contractor.",
            image:
              "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=200&h=200&fit=crop&auto=format&q=70",
          },
          {
            sentiment: "positive",
            title: "Mcneilus Truck And Manufacturing Expands Parts Distribution Within Murfreesboro, Tennessee Facility",
            source: "Waste360",
            date: "Jul 1",
            category: "Parts Distribution Expansion",
            body: "McNeilus Truck and Manufacturing, Inc., an Oshkosh Corporation (NYSE: OSK) business, today announced it has expanded parts distribution …",
            image:
              "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=200&h=200&fit=crop&auto=format&q=70",
          },
          {
            sentiment: "positive",
            title: "McNeilus Truck and Manufacturing Expands Parts Distribution within Murfreesboro, TN Facility",
            source: "Waste Advantage Magazine",
            date: "Jul 1",
            category: "Parts Distribution Expansion",
            body: "The Murfreesboro facility will serve as a centralized hub to support aftermarket parts distribution and improve service responsiveness for …",
            image:
              "https://images.unsplash.com/photo-1553413077-190dd305871c?w=200&h=200&fit=crop&auto=format&q=70",
          },
          {
            sentiment: "negative",
            title: "Oshkosh Defense faces JLTV schedule risk amid contractor dispute",
            source: "Defense Daily",
            date: "Jul 3",
            category: "Contract Risk",
            body: "Analysts flagged schedule risk on the Joint Light Tactical Vehicle program as delivery timelines slipped, raising questions about near-term revenue.",
            image:
              "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&h=200&fit=crop&auto=format&q=70",
          },
          {
            sentiment: "negative",
            title: "Cost pressures weigh on Oshkosh's vocational truck margins",
            source: "IndustryWeek",
            date: "Jul 5",
            category: "Margin Pressure",
            body: "Rising input costs and pricing competition pressured segment margins, with some analysts trimming estimates for the back half of the year.",
            image:
              "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=200&h=200&fit=crop&auto=format&q=70",
          },
        ]
      : [
          {
            sentiment: "positive",
            title: `${summary.name} coverage strengthens on product momentum`,
            source: "Reuters",
            date: "Jul 2",
            category: "Product",
            body: "Favourable coverage centered on product milestones and improving execution across core segments.",
            image:
              "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=200&h=200&fit=crop&auto=format&q=70",
          },
          {
            sentiment: "negative",
            title: `Analysts flag near-term risks for ${summary.name}`,
            source: "Bloomberg",
            date: "Jul 4",
            category: "Risk",
            body: "A handful of outlets cited cost and demand headwinds, tempering an otherwise constructive narrative.",
            image:
              "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=200&h=200&fit=crop&auto=format&q=70",
          },
        ],
    executiveSummary: isOshkoshMedia
      ? "Coverage was overwhelmingly neutral (98.67%) — just 1.33% positive and no negative mentions. Volume peaked at 150 articles on July 2, driven by syndicated competitor and market coverage. The takeaway: attention skews heavily toward peers, so Oshkosh needs more visible, high-impact narratives to cut through the neutral, competitor-focused noise."
      : `${summary.name} shows media reach up ${(6 + rnd() * 8).toFixed(
          1
        )}% this period, with ${new Intl.NumberFormat().format(
          totalMentions
        )} mentions across channels. Sentiment holds net-positive at ${netSentiment}% and share of voice sits at ${sov}%, led by online and print coverage.`,
  }
}

/* ------------------------------ API shims ----------------------------- */
const delay = (ms = 120) => new Promise((r) => setTimeout(r, ms))

export async function getProjects(): Promise<Project[]> {
  await delay()
  return projects
}

export async function getProject(projectId: string): Promise<Project | null> {
  await delay()
  return projects.find((p) => p.id === projectId) ?? null
}

export async function getDashboards(projectId: string): Promise<DashboardSummary[]> {
  await delay()
  return buildDashboards(projectId)
}

export async function getDashboardDetail(
  projectId: string,
  dashboardId: string
): Promise<DashboardDetail | null> {
  await delay()
  return buildDetail(projectId, dashboardId)
}
