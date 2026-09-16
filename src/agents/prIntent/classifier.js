// Classifies a free-text PR-analytics question into one of the 97 merged
// intents (and, in turn, one of the 7 agent domains) from the intent
// library. Pure client-side scoring — no LLM call — so BuilderScreen /
// ChartAiDrawer can classify instantly and only fall back to a live model
// call when nothing in the library is a confident match.
import { getAllIntents, getRawCorpus, DOMAINS } from "./data/intentLibrary.js";
import { bestPhraseSimilarity } from "./textUtils.js";

// Below this, we don't trust an intent-level match at all.
const INTENT_MATCH_THRESHOLD = 0.42;
// Below this, we don't even trust a domain-only fallback match.
const DOMAIN_MATCH_THRESHOLD = 0.3;

let _domainPhrases = null;

/**
 * domain -> flat list of every phrase that's a good example of "someone
 * asking about this domain": every intent's trigger patterns plus the raw
 * example-question corpus for that domain. Used as a fallback signal when
 * no single intent's trigger phrases score well enough to trust a specific
 * intent match, so an unseen paraphrase can still be routed to the right
 * domain agent by similarity to *some* known phrasing in that domain,
 * rather than by diluted bag-of-words overlap against the whole domain's
 * vocabulary (which washes out short questions against a large vocab).
 */
function domainPhrases() {
  if (_domainPhrases) return _domainPhrases;
  _domainPhrases = new Map();
  for (const domain of DOMAINS) {
    const phrases = [];
    for (const intent of getAllIntents().filter((i) => i.domain === domain)) {
      phrases.push(...(intent.triggerPatterns || []));
    }
    for (const { question } of getRawCorpus(domain)) {
      phrases.push(question);
    }
    _domainPhrases.set(domain, phrases);
  }
  return _domainPhrases;
}

/**
 * Score every intent against the question and return the ranked list
 * (highest score first). Each entry: { intent, score, matchedPhrase }.
 */
function scoreIntents(question) {
  const scored = [];
  for (const intent of getAllIntents()) {
    const { score, phrase } = bestPhraseSimilarity(question, intent.triggerPatterns || []);
    if (score > 0) scored.push({ intent, score, matchedPhrase: phrase });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored;
}

function scoreDomains(question) {
  const scored = [];
  for (const [domain, phrases] of domainPhrases()) {
    const { score } = bestPhraseSimilarity(question, phrases);
    scored.push({ domain, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored;
}

/**
 * Classify a user question.
 *
 * Returns:
 *   {
 *     matched: boolean,            // true if we trust this enough to skip an LLM call
 *     domain: string|null,         // agent domain key, e.g. "mediaMeasurement"
 *     intent: object|null,         // full merged intent record, or null if only domain matched
 *     confidence: number,          // 0..1
 *     matchedPhrase: string|null,  // which trigger phrase drove the intent match
 *     alternates: Array<{intent, score}>,  // next-best intent matches, for follow-up suggestions
 *   }
 */
export function classify(question, { topN = 5 } = {}) {
  const intentScores = scoreIntents(question);
  const top = intentScores[0];

  if (top && top.score >= INTENT_MATCH_THRESHOLD) {
    return {
      matched: true,
      domain: top.intent.domain,
      intent: top.intent,
      confidence: top.score,
      matchedPhrase: top.matchedPhrase,
      alternates: intentScores.slice(1, topN).map(({ intent, score }) => ({ intent, score })),
    };
  }

  // No confident single-intent match — fall back to domain-level routing so
  // callers can still hand off to the right domain agent (which will answer
  // more generically, without a specific answer template/calc to follow).
  // `intent` stays null here on purpose: baseAgent.generateResponse()'s
  // `usedFallback` flag means "only the domain matched", and a below-
  // threshold intent would smuggle a specific (and untrustworthy) chart
  // hint/answer template into what's supposed to be a generic domain view.
  // The best-but-unconfident intent is still surfaced via `alternates` (and
  // `matchedPhrase`, kept for debugging/telemetry) rather than driving the
  // actual response.
  const domainScores = scoreDomains(question);
  const topDomain = domainScores[0];
  if (topDomain && topDomain.score >= DOMAIN_MATCH_THRESHOLD) {
    return {
      matched: false,
      domain: topDomain.domain,
      intent: null,
      confidence: topDomain.score,
      matchedPhrase: top ? top.matchedPhrase : null,
      alternates: intentScores.slice(0, topN).map(({ intent, score }) => ({ intent, score })),
    };
  }

  return {
    matched: false,
    domain: null,
    intent: null,
    confidence: 0,
    matchedPhrase: null,
    alternates: intentScores.slice(0, topN).map(({ intent, score }) => ({ intent, score })),
  };
}

export const THRESHOLDS = {
  INTENT_MATCH_THRESHOLD,
  DOMAIN_MATCH_THRESHOLD,
};

export default { classify, THRESHOLDS };
