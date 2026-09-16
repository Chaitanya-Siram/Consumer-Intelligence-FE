// Shared logic behind all 7 domain agents (mediaMeasurementAgent,
// prImpactAgent, narrativeIntelligenceAgent, reputationIndexAgent,
// competitiveIntelligenceAgent, campaignAgent, executiveCrossKpiAgent).
//
// Each domain agent is a thin config object (category pool, KPI range,
// continuation phrases — the things that make a Media Measurement answer
// sound different from a Reputation Index answer) handed to
// `generateResponse()` here, which does the actual work: build a chart
// object DynamicChartRenderer can render, fill the intent's answer
// template with grounded mock numbers, and package everything the caller
// needs (narrative, chart, evidence, follow-ups, recommended actions).
//
// No live backend is wired up yet — see mockData.js for why the numbers
// are seeded-random rather than real.
import { mapChartHint } from "../chartMapper.js";
import { fillTemplate, summarizeTopRows } from "../narrativeBuilder.js";
import {
  seededRng,
  randInt,
  randFloat,
  pick,
  mockTimeSeries,
  mockCategoryBars,
  mockShareSlices,
  mockScatter,
  mockRadar,
  mockHeatmap,
  mockKpi,
} from "../mockData.js";
import { DOMAIN_LABELS } from "../data/intentLibrary.js";
import narrativeIntelligenceAgent from "./narrativeIntelligenceAgent.js";

// A "Narrative X"-style name blank (see NAME_BLANK_NOUNS in
// narrativeBuilder.js) is asking for an actual narrative-theme name (e.g.
// "Customer Trust"), regardless of which domain agent happens to be
// answering. Most domains' categoryPools have no reason to contain
// theme-like names (executiveCrossKpi's pool is the other 6 domain labels;
// competitiveIntelligence's is competitor names), so borrowing
// narrativeIntelligence's own pool for this one blank keeps the substitution
// sensible everywhere a template uses it, instead of only where the
// answering domain's chart coincidentally ranked a theme-shaped category on
// top.
const NARRATIVE_THEME_POOL = narrativeIntelligenceAgent.categoryPool;

/** Pick `n` distinct category labels from a pool, entities' brand/competitor names first if relevant. */
function pickCategories(rng, pool, n, entities) {
  const forced = [];
  if (entities?.competitor) forced.push(entities.competitor);
  if (entities?.brand && entities.brand !== "self") forced.push(entities.brand);

  const remainingPool = pool.filter((c) => !forced.includes(c));
  const shuffled = [...remainingPool].sort(() => rng() - 0.5);
  return [...forced, ...shuffled].slice(0, Math.max(n, forced.length));
}

// A handful of answerTemplates hardcode a direction word ("Coverage
// declined X%...", "Reputation has recovered X%...") instead of using the
// generic "up/down" token narrativeBuilder knows how to resolve. Left alone,
// the mock KPI/trend value is generated independently and can contradict
// that wording half the time (e.g. "declined 12%" next to a chart that rose
// 12%). When a template's direction is unambiguous, force the generated
// delta/trend to match it instead of leaving it to chance — that's the same
// "grounded, not just random" bar the rest of mockData.js holds itself to.
const POSITIVE_DIRECTION_WORDS = /\b(increased|grew|rose|improved|recovered|accelerating|strengthened|climbed|jumped|surged)\b/i;
const NEGATIVE_DIRECTION_WORDS = /\b(declined|decreased|dropped|fell|weakened|deteriorated|slipped|slowed)\b/i;

/** +1 / -1 if a template's wording implies a single unambiguous direction, else null. */
function impliedDirection(template) {
  if (!template) return null;
  const hasPositive = POSITIVE_DIRECTION_WORDS.test(template);
  const hasNegative = NEGATIVE_DIRECTION_WORDS.test(template);
  if (hasPositive && !hasNegative) return 1;
  if (hasNegative && !hasPositive) return -1;
  return null; // no direction word, or both appear (e.g. contrasting two metrics) — leave to chance
}

/**
 * Build a { chart_id, title, chart_type, data, ... } object matching what
 * CustomChartWidgets.jsx's DynamicChartRenderer expects, plus a small
 * `numbers`/`deltaSign` bundle for narrative filling.
 */
function buildChart({ chartType, intent, config, entities, rng, title }) {
  const chartId = intent ? intent.id.toLowerCase() : `${config.domain}-adhoc`;
  const base = { chart_id: chartId, title, chart_type: chartType };

  switch (chartType) {
    case "kpi":
    case "gauge": {
      const { value, delta, band } = mockKpi(rng, {
        min: config.kpiRange?.min ?? 40,
        max: config.kpiRange?.max ?? 95,
        bands: config.kpiBands,
      });
      const forcedDir = impliedDirection(intent?.answerTemplate);
      const finalDelta = forcedDir ? Math.abs(delta) * forcedDir : delta;
      return {
        chart: { ...base, data: { value, delta: finalDelta, band }, y_label: config.unit || "" },
        numbers: [value, Math.round(Math.abs(finalDelta))],
        deltaSign: Math.sign(finalDelta) || 1,
        topRows: [],
      };
    }
    case "line":
    case "area": {
      const forcedDir = impliedDirection(intent?.answerTemplate);
      const trendPct = forcedDir ? forcedDir * randFloat(rng, 8, 35, 0) : 0;
      const points = mockTimeSeries(rng, { points: 7, unit: "week", min: 30, max: 90, trendPct });
      const first = points[0].value;
      let last = points[points.length - 1].value;
      // mockTimeSeries adds independent per-step noise (up to ±8% of the
      // start value) on top of the trend drift, which over just a handful
      // of points can be larger than the drift itself — so even a forced
      // trendPct can still land last on the "wrong" side of first. Rather
      // than rely on statistics to make that rare enough, directly nudge
      // just the final point so first/last actually agree with the
      // template's hardcoded direction word every time.
      if (forcedDir && Math.sign(last - first) !== forcedDir) {
        const magnitude = Math.max(Math.round(Math.abs(last - first)), Math.round(first * 0.1), 5);
        last = Math.max(0, first + forcedDir * magnitude);
        points[points.length - 1] = { ...points[points.length - 1], value: last };
      }
      const pctChange = first ? Math.round(((last - first) / first) * 100) : 0;
      // Two incompatible template shapes share this chart type: "X mentions,
      // up/down Y%" wants (latest value, % change), but "Coverage increased
      // from X to Y..." wants (first value, latest value) — X/Y read left to
      // right as a before/after pair, not a value+percent. Templates with an
      // explicit up/down token get the percent-based pair; everything else
      // (the "from X to Y" phrasing) gets first-then-last so "from X to Y"
      // actually describes the two chronological endpoints instead of
      // silently substituting a percentage for Y.
      const usesUpDown = /up\/down/i.test(intent?.answerTemplate || "");
      return {
        chart: { ...base, data: points, series: ["value"] },
        numbers: usesUpDown ? [last, Math.abs(pctChange)] : [first, last, Math.abs(pctChange)],
        deltaSign: Math.sign(pctChange) || 1,
        topRows: points,
      };
    }
    case "pie":
    case "donut": {
      const cats = pickCategories(rng, config.categoryPool, randInt(rng, 3, 5), entities);
      const rows = mockShareSlices(rng, cats);
      const sorted = [...rows].sort((a, b) => b.value - a.value);
      return {
        chart: { ...base, data: rows },
        numbers: [sorted[0]?.value ?? 0, sorted[1]?.value ?? 0],
        deltaSign: 1,
        topRows: sorted,
      };
    }
    case "radar": {
      const axes = pickCategories(rng, config.categoryPool, 5, entities);
      const rows = mockRadar(rng, axes);
      const sorted = [...rows].sort((a, b) => b.value - a.value);
      return {
        chart: { ...base, data: rows },
        numbers: [sorted[0]?.value ?? 0, sorted[sorted.length - 1]?.value ?? 0],
        deltaSign: 1,
        topRows: sorted,
      };
    }
    case "scatter": {
      const cats = pickCategories(rng, config.categoryPool, randInt(rng, 5, 8), entities);
      const rows = mockScatter(rng, cats);
      return {
        chart: { ...base, data: rows },
        numbers: [rows.length, Math.round(rows.reduce((a, r) => a + r.x, 0) / rows.length)],
        deltaSign: 1,
        topRows: rows,
      };
    }
    case "heatmap": {
      const rows = pickCategories(rng, config.categoryPool, 5, entities);
      const cols = mockTimeSeries(rng, { points: 5, unit: "week" }).map((p) => p.date);
      const data = mockHeatmap(rng, rows, cols);
      // Heatmap rows carry one number per column, not a single sortable
      // `value` — rank a copy by average column value so narrative text
      // ("the highest-risk issue is...") can point at a genuine top row
      // instead of whatever order pickCategories happened to produce. The
      // chart's own `data` stays in that original order for display.
      const rowAverage = (row) => {
        const nums = Object.entries(row).filter(([k, v]) => k !== "name" && typeof v === "number");
        return nums.length ? nums.reduce((sum, [, v]) => sum + v, 0) / nums.length : 0;
      };
      const rankedRows = [...data].sort((a, b) => rowAverage(b) - rowAverage(a));
      return { chart: { ...base, data }, numbers: [randInt(rng, 10, 90)], deltaSign: 1, topRows: rankedRows };
    }
    case "treemap":
    case "table":
    default: {
      // "bar" and every unrecognized chart_type (treemap/table also read
      // fine off simple {name, value} rows via DynamicChartRenderer).
      const cats = pickCategories(rng, config.categoryPool, randInt(rng, 4, 7), entities);
      const rows = mockCategoryBars(rng, cats, { min: config.barMin ?? 15, max: config.barMax ?? 100 });
      return {
        chart: { ...base, data: rows, chart_type: chartType === "table" || chartType === "treemap" ? chartType : "bar" },
        numbers: [rows[0]?.value ?? 0, rows.length],
        deltaSign: 1,
        topRows: rows,
      };
    }
  }
}

/**
 * Generate a full PR Intent answer for a classified (or domain-only)
 * question.
 *
 * @param {object} params
 * @param {object|null} params.intent      matched intent record, or null if only the domain matched
 * @param {object} params.entities         output of entityExtractor.extractEntities
 * @param {object} params.config           domain agent config (see agents/*.js)
 * @param {string} params.question         original user question (used to seed the RNG)
 * @param {string|null} params.matchedPhrase
 * @param {number} params.confidence
 * @param {boolean} params.usedFallback    true when classify() only matched the domain, not a specific intent
 */
export function generateResponse({
  intent,
  entities,
  config,
  question,
  matchedPhrase = null,
  confidence = 0,
  usedFallback = false,
}) {
  const rng = seededRng(`${intent ? intent.id : config.domain}::${question}`);
  const hint = mapChartHint(intent?.chartHint);
  const title = intent?.name || `${DOMAIN_LABELS[config.domain]} Overview`;

  const { chart, numbers, deltaSign, topRows } = buildChart({
    chartType: hint.chartType,
    intent,
    config,
    entities,
    rng,
    title,
  });

  const template = intent?.answerTemplate;
  // Only categorical topRows (bar/heatmap/etc — anything keyed by `name`)
  // can supply a sensible "Competitor X"-style name blank; time-series rows
  // are keyed by `date` and have no such name, so topName stays null there
  // and fillTemplate falls back to its (safe, if generic) numeric handling.
  //
  // "Narrative X" blanks are the one exception worth special-casing: they
  // specifically want a theme-shaped name, so pull from the shared narrative
  // theme pool instead of this domain's topRows — which also rescues the
  // time-series case (e.g. a "Narrative X is accelerating..." template over
  // a line chart) that would otherwise have no name to offer at all.
  const topName = /\bNarrative\s+[XYZN]\b/.test(template || "")
    ? pick(rng, NARRATIVE_THEME_POOL)
    : topRows?.[0]?.name ?? null;
  const filled = fillTemplate(template, { numbers, deltaSign, rng, continuations: config.continuations || [], topName });

  // summarizeTopRows defaults to {name, value} rows, but time-series rows
  // out of buildChart's "line"/"area" branch are {date, value} — pass the
  // right label key so a bare-label template (e.g. "Campaign volume") over
  // a trend chart reads dates instead of "undefined".
  const topRowsOpts = {
    unit: config.unit || "",
    nameKey: hint.chartType === "line" || hint.chartType === "area" ? "date" : "name",
  };

  let narrative = filled.text;
  if (filled.isLabel) {
    narrative = summarizeTopRows(template, topRows, topRowsOpts);
  } else if (!narrative) {
    narrative = usedFallback
      ? `I couldn't find an exact match for that question, but here's the closest ${DOMAIN_LABELS[config.domain]} view I could put together — ${summarizeTopRows(title, topRows, topRowsOpts)}`
      : summarizeTopRows(title, topRows, topRowsOpts);
  }

  return {
    domain: config.domain,
    domainLabel: DOMAIN_LABELS[config.domain],
    intentId: intent?.id ?? null,
    title,
    narrative,
    chart,
    kpi: intent?.kpi ?? null,
    subKpi: intent?.subKpi ?? null,
    calculation: intent?.calculation ?? null,
    evidence: intent?.evidence ?? null,
    followUp: intent?.followUp?.length ? intent.followUp : config.defaultFollowUp || [],
    action: intent?.action?.length ? intent.action : config.defaultAction || [],
    matchedPhrase,
    confidence,
    usedFallback,
  };
}

export default { generateResponse };
