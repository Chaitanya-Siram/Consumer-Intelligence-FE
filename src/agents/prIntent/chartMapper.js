// Maps the free-text "chart hint" / "visualization" cell from the PR Intent
// spreadsheets (e.g. "KPI + line", "Bar/heatmap", "Risk gauge/timeline") to
// the `chart_type` vocabulary that CustomChartWidgets.jsx's
// `DynamicChartRenderer` actually knows how to render (bar, line, area,
// pie, donut, heatmap, radar, scatter, kpi/gauge, table, treemap, us_map, …).
//
// The spreadsheet authors were describing a *shape of insight*, not a
// literal component name, so hints are often compound ("Bar/KPI",
// "Trend/bar", "Donut + comparison"). DynamicChartRenderer only renders one
// chart per widget, so where a hint names more than one visual, this picks
// a single primary chart_type using a fixed priority order: more specific /
// information-dense chart types (heatmap, radar, scatter, treemap, donut,
// pie, table) outrank generic ones (bar), and an explicit trend/time-series
// word (trend, timeline, line) outranks a bare "KPI" — a single number is
// the least informative thing we could show when a trend was also on offer.
//
// Rules are checked top-to-bottom; the first keyword found in the
// (lowercased) hint wins. Anything that matches nothing falls back to "bar",
// which mirrors DynamicChartRenderer's own default.
const RULES = [
  [/heatmap/, "heatmap"],
  [/radar/, "radar"],
  [/scatter/, "scatter"],
  [/treemap/, "treemap"],
  [/donut/, "donut"],
  [/pie/, "pie"],
  [/table/, "table"],
  [/matrix/, "heatmap"], // e.g. "Risk matrix" — a grid of risk x likelihood
  [/gauge/, "gauge"], // e.g. "Risk gauge/timeline" — single dial + band/delta
  [/\barea\b/, "area"],
  [/timeline/, "line"],
  [/trend/, "line"],
  [/\bline\b/, "line"],
  [/\bmap\b/, "us_map"],
  [/\bbar\b/, "bar"],
  [/\bkpi\b/, "kpi"],
  [/scorecard/, "kpi"],
  [/\bbrief\b/, "kpi"],
  [/\blist\b/, "table"],
  [/\bcard/, "table"], // "cards" — no dedicated card widget yet, closest is a table of items
];

const DEFAULT_CHART_TYPE = "bar";

/**
 * Map a chartHint/visualization string to a DynamicChartRenderer-compatible
 * chart_type, plus a couple of layout hints (orientation/stacked) the hint
 * text sometimes calls out explicitly.
 *
 * Returns:
 *   {
 *     chartType: string,          // e.g. "line", "bar", "kpi"
 *     orientation: "horizontal"|"vertical"|null,
 *     stacked: boolean,
 *     hasKpiCompanion: boolean,   // hint also mentioned "KPI" alongside the chosen chart type
 *     rawHint: string|null,       // original spreadsheet text, kept for debugging/evidence
 *     isFallback: boolean,        // true if nothing in the hint matched and we used the default
 *   }
 */
export function mapChartHint(hint) {
  const raw = hint ? String(hint).trim() : null;
  const lower = raw ? raw.toLowerCase() : "";

  let chartType = null;
  for (const [pattern, type] of RULES) {
    if (pattern.test(lower)) {
      chartType = type;
      break;
    }
  }

  const isFallback = chartType === null;
  if (isFallback) chartType = DEFAULT_CHART_TYPE;

  return {
    chartType,
    orientation: /horizontal/.test(lower) ? "horizontal" : null,
    stacked: /stacked/.test(lower),
    hasKpiCompanion: chartType !== "kpi" && /\bkpi\b/.test(lower),
    rawHint: raw,
    isFallback,
  };
}

/** The full set of chart_type values this mapper can ever produce. */
export const SUPPORTED_CHART_TYPES = Array.from(new Set(RULES.map(([, t]) => t).concat(DEFAULT_CHART_TYPE)));

export default { mapChartHint, SUPPORTED_CHART_TYPES };
