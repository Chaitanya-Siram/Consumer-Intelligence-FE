// Single entry point for the PR Intent agent: classify a free-text question,
// pull out its filters, hand off to the matching domain agent, and package
// a response BuilderScreen/ChartAiDrawer can render immediately — no live
// backend or LLM call needed for anything the intent library covers.
//
// Callers should treat `handled: false` as "nothing in the library was
// even a plausible domain match — fall back to the real LLM/backend call",
// the same way dynamicChartManager.js already falls back to a fabricated
// chart when its live OpenAI call fails. This module is the mirror image:
// a fabricated-but-grounded answer that's tried *first*, with the live call
// as the fallback, since every number here is mock (see mockData.js).
import { classify } from "./classifier.js";
import { extractEntities } from "./entityExtractor.js";
import { generateResponse } from "./agents/baseAgent.js";

import mediaMeasurementAgent from "./agents/mediaMeasurementAgent.js";
import prImpactAgent from "./agents/prImpactAgent.js";
import narrativeIntelligenceAgent from "./agents/narrativeIntelligenceAgent.js";
import reputationIndexAgent from "./agents/reputationIndexAgent.js";
import competitiveIntelligenceAgent from "./agents/competitiveIntelligenceAgent.js";
import campaignAgent from "./agents/campaignAgent.js";
import executiveCrossKpiAgent from "./agents/executiveCrossKpiAgent.js";

/** domain key -> that domain's config object (see agents/*.js). */
const AGENTS_BY_DOMAIN = {
  mediaMeasurement: mediaMeasurementAgent,
  prImpact: prImpactAgent,
  narrativeIntelligence: narrativeIntelligenceAgent,
  reputationIndex: reputationIndexAgent,
  competitiveIntelligence: competitiveIntelligenceAgent,
  campaign: campaignAgent,
  executiveCrossKpi: executiveCrossKpiAgent,
};

/**
 * Run a free-text PR-analytics question through the intent library.
 *
 * @param {string} question
 * @returns {object} either
 *   { handled: false, reason: "no-domain-match" }
 *     — nothing in the library was even a plausible domain match; the
 *       caller should fall back to its live LLM/backend call.
 *   { handled: false, reason: "unknown-domain", domain }
 *     — classifier matched a domain key with no corresponding agent config
 *       (should only happen if a new domain is added to the spreadsheets
 *       without a matching agents/*.js file yet — fail soft, not silent).
 *   { handled: true, ...generateResponse() output, alternates }
 *     — a full answer: narrative, chart, kpi/evidence/follow-up/action,
 *       plus `alternates` (next-best intent guesses) for "did you mean"
 *       affordances in the UI.
 */
export function runPrIntentQuery(question) {
  const classification = classify(question);

  if (!classification.domain) {
    return { handled: false, reason: "no-domain-match" };
  }

  const config = AGENTS_BY_DOMAIN[classification.domain];
  if (!config) {
    return { handled: false, reason: "unknown-domain", domain: classification.domain };
  }

  const entities = extractEntities(question, classification.intent);
  const response = generateResponse({
    intent: classification.intent,
    entities,
    config,
    question,
    matchedPhrase: classification.matchedPhrase,
    confidence: classification.confidence,
    usedFallback: !classification.matched,
  });

  return {
    handled: true,
    ...response,
    entities,
    alternates: classification.alternates,
  };
}

export default { runPrIntentQuery };
