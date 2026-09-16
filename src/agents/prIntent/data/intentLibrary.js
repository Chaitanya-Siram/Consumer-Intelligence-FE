// PR Intent knowledge base loader.
//
// Wraps the two JSON files produced by `build_intent_library.py`
// (intentLibrary.json, rawQuestionCorpus.json) with a small, stable API so
// the rest of the prIntent agent (classifier, entity extractor, domain
// agents, orchestrator) never has to touch the raw JSON shape directly.
//
// Re-run `python3 data/build_intent_library.py` whenever the source
// spreadsheets change, then nothing else in this module needs to change.

import intentLibraryJson from "./intentLibrary.json";
import rawQuestionCorpusJson from "./rawQuestionCorpus.json";

/** Ordered list of the 7 PR-analytics agent domains. */
export const DOMAINS = Object.keys(intentLibraryJson);

/** domain key -> human-readable label (e.g. "mediaMeasurement" -> "Media Measurement"). */
export const DOMAIN_LABELS = Object.fromEntries(
  DOMAINS.map((d) => [d, intentLibraryJson[d].label]),
);

// Flat, memoized list of every intent record across all domains, each
// carrying its own `domain` field (already set by the build script).
const ALL_INTENTS = DOMAINS.flatMap((d) => intentLibraryJson[d].intents);

const INTENTS_BY_ID = new Map(ALL_INTENTS.map((intent) => [intent.id, intent]));

const INTENTS_BY_DOMAIN = new Map(
  DOMAINS.map((d) => [d, intentLibraryJson[d].intents]),
);

/** Every merged intent record, across all 7 domains. */
export function getAllIntents() {
  return ALL_INTENTS;
}

/** Intent records for a single domain key (e.g. "mediaMeasurement"). */
export function getIntentsByDomain(domain) {
  return INTENTS_BY_DOMAIN.get(domain) || [];
}

/** Look up a single intent by its ID (e.g. "MM-001"). */
export function getIntentById(id) {
  return INTENTS_BY_ID.get(id) || null;
}

/**
 * Extra natural-language example questions (no IDs), grouped by domain —
 * used only to widen the classifier's trigger-phrase corpus, never surfaced
 * to the user directly.
 */
export function getRawCorpus(domain) {
  if (domain) return rawQuestionCorpusJson[domain] || [];
  return rawQuestionCorpusJson;
}

/**
 * Every phrase the classifier should treat as "known to mean this intent":
 * the intent's own trigger patterns / question variations, deduped and
 * lower-cased. Does NOT include the raw corpus (that's domain-only signal,
 * added separately in the classifier).
 */
export function getTriggerPhrasesById(id) {
  const intent = getIntentById(id);
  return intent ? intent.triggerPatterns || [] : [];
}

export default {
  DOMAINS,
  DOMAIN_LABELS,
  getAllIntents,
  getIntentsByDomain,
  getIntentById,
  getRawCorpus,
  getTriggerPhrasesById,
};
