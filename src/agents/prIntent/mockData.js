// Deterministic, seeded mock-data generation for the PR Intent agents.
//
// There is no live analytics backend wired to this feature yet (the
// intent library's `apiQuery` field, e.g. "GET /coverage/summary", records
// what a real backend call *would* be, for whoever wires that up later).
// Until then, each domain agent needs *some* grounded, plausible chart +
// number to show — the same "fabricate a grounded fallback" approach
// `src/utils/dynamicChartManager.js` already uses elsewhere in this app
// when its live OpenAI call fails.
//
// Seeding by (intent id + question) means the same question asked twice
// renders the same numbers instead of visibly re-rolling on every
// keystroke/re-render, which matters for a chart the user might screenshot
// or come back to.

/** Mulberry32 — small, fast, seeded PRNG. Returns a function producing floats in [0, 1). */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** A stable RNG for a given (intentId, question) pair. */
export function seededRng(seedKey) {
  return mulberry32(hashString(String(seedKey)));
}

export function randInt(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function randFloat(rng, min, max, decimals = 1) {
  const v = rng() * (max - min) + min;
  return Number(v.toFixed(decimals));
}

export function pick(rng, list) {
  return list[Math.floor(rng() * list.length)];
}

/** Signed percent delta, e.g. +12.4 or -6.8, biased slightly positive (most PR narratives skew "up"). */
export function randDelta(rng, magnitude = 25) {
  const sign = rng() < 0.6 ? 1 : -1;
  return sign * randFloat(rng, 1, magnitude, 1);
}

/** N percentages that sum to (approximately) 100, e.g. sentiment splits. */
export function percentSplit(rng, n) {
  const raw = Array.from({ length: n }, () => rng() + 0.15);
  const sum = raw.reduce((a, b) => a + b, 0);
  const pct = raw.map((v) => Math.round((v / sum) * 100));
  // Nudge the last value so they sum to exactly 100 (rounding can drift by 1-2).
  const drift = 100 - pct.reduce((a, b) => a + b, 0);
  pct[pct.length - 1] += drift;
  return pct;
}

const RELATIVE_LABEL_STEPS = {
  day: (i) => `Day ${i + 1}`,
};

/** A short time-series label sequence: last N weeks/months/days, oldest first. */
function timeLabels(rng, points, unit = "week") {
  const now = new Date(2026, 8, 1); // pinned "today" (Sep 1 2026) so labels are stable across runs
  const out = [];
  for (let i = points - 1; i >= 0; i--) {
    const d = new Date(now);
    if (unit === "day") d.setDate(d.getDate() - i);
    else if (unit === "week") d.setDate(d.getDate() - i * 7);
    else if (unit === "month") d.setMonth(d.getMonth() - i);
    else if (unit === "quarter") d.setMonth(d.getMonth() - i * 3);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

/**
 * A time series with a gentle random walk plus an overall trend, so lines
 * look like real coverage/sentiment/impact data rather than pure noise.
 * Returns [{ date, value }, ...].
 */
export function mockTimeSeries(rng, { points = 6, unit = "week", min = 20, max = 100, trendPct = 0 } = {}) {
  const labels = timeLabels(rng, points, unit);
  const start = randFloat(rng, min, max, 0);
  const totalDrift = ((trendPct || randDelta(rng, 30)) / 100) * start;
  const stepDrift = totalDrift / Math.max(points - 1, 1);
  let value = start;
  return labels.map((date, i) => {
    if (i > 0) value = Math.max(0, value + stepDrift + randFloat(rng, -start * 0.08, start * 0.08, 0));
    return { date, value: Math.round(value) };
  });
}

/** Category bars, e.g. top outlets/journalists/themes/competitors. */
export function mockCategoryBars(rng, categories, { min = 10, max = 100, sortDesc = true } = {}) {
  const rows = categories.map((name) => ({ name, value: randInt(rng, min, max) }));
  if (sortDesc) rows.sort((a, b) => b.value - a.value);
  return rows;
}

/** Pie/donut slices that sum to 100. */
export function mockShareSlices(rng, categories) {
  const pcts = percentSplit(rng, categories.length);
  return categories.map((name, i) => ({ name, value: pcts[i] }));
}

/** Scatter points, e.g. reach (x) vs sentiment/impact (y) per story/outlet. */
export function mockScatter(rng, categories, { xMin = 1, xMax = 100, yMin = -50, yMax = 50 } = {}) {
  return categories.map((name) => ({
    name,
    x: randInt(rng, xMin, xMax),
    y: randFloat(rng, yMin, yMax, 1),
  }));
}

/** Radar axes, e.g. message pillars or reputation dimensions, each 0-100. */
export function mockRadar(rng, axes, { min = 30, max = 95 } = {}) {
  return axes.map((axis) => ({ name: axis, value: randInt(rng, min, max) }));
}

/** A small row x column heatmap grid, e.g. pillar x week. */
export function mockHeatmap(rng, rows, cols, { min = 0, max = 100 } = {}) {
  return rows.map((row) => {
    const entry = { name: row };
    for (const col of cols) entry[col] = randInt(rng, min, max);
    return entry;
  });
}

/** A generic table of ranked rows for "top N" style intents. */
export function mockTable(rng, categories, columns) {
  return categories.map((name) => {
    const row = { name };
    for (const col of columns) row[col.key] = col.gen(rng);
    return row;
  });
}

/** A single KPI value + delta + qualitative band (green/amber/red), e.g. Reputation Index score. */
export function mockKpi(rng, { min = 40, max = 95, deltaMagnitude = 15, bands = null } = {}) {
  const value = randInt(rng, min, max);
  const delta = randDelta(rng, deltaMagnitude);
  let band = null;
  if (bands) {
    if (value >= bands.green) band = "green";
    else if (value >= bands.amber) band = "amber";
    else band = "red";
  }
  return { value, delta, band };
}

export default {
  seededRng,
  randInt,
  randFloat,
  pick,
  randDelta,
  percentSplit,
  mockTimeSeries,
  mockCategoryBars,
  mockShareSlices,
  mockScatter,
  mockRadar,
  mockHeatmap,
  mockTable,
  mockKpi,
};
