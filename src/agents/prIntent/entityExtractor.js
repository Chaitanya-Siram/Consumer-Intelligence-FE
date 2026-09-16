// Pulls the filter values a matched intent actually needs (brand, date
// range, person, campaign, competitor, numeric threshold) out of the raw
// question text. This is deliberately a light heuristic layer, not a full
// NER model — the intent library's `requiredFilters` tells us which of
// these actually matter for a given intent, so we only need to be "good
// enough" on each, not perfect on all of them at once.

import { normalize } from "./textUtils.js";

const RELATIVE_RANGE_PATTERNS = [
  [/\btoday\b/, () => ({ label: "today", kind: "relative" })],
  [/\byesterday\b/, () => ({ label: "yesterday", kind: "relative" })],
  [/\bthis week\b/, () => ({ label: "this week", kind: "relative" })],
  [/\blast week\b/, () => ({ label: "last week", kind: "relative" })],
  [/\bthis month\b/, () => ({ label: "this month", kind: "relative" })],
  [/\blast month\b/, () => ({ label: "last month", kind: "relative" })],
  [/\bthis quarter\b/, () => ({ label: "this quarter", kind: "relative" })],
  [/\blast quarter\b/, () => ({ label: "last quarter", kind: "relative" })],
  [/\byear to date|\bytd\b/, () => ({ label: "year to date", kind: "relative" })],
  [/\bthis year\b/, () => ({ label: "this year", kind: "relative" })],
  [/\blast year\b/, () => ({ label: "last year", kind: "relative" })],
  [
    /\blast (\d+)\s*(day|week|month)s?\b/,
    (m) => ({ label: `last ${m[1]} ${m[2]}${m[1] === "1" ? "" : "s"}`, kind: "relative" }),
  ],
  [
    /\bq([1-4])\s*(20\d{2})?\b/,
    (m) => ({ label: `Q${m[1]}${m[2] ? " " + m[2] : ""}`, kind: "quarter" }),
  ],
];

const MONTH_NAMES =
  "jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?";
const MONTH_PATTERN = new RegExp(`\\b(${MONTH_NAMES})\\s*(20\\d{2})?\\b`, "i");

/** Best-effort date-range extraction (relative phrase, quarter, or month). */
export function extractDateRange(question) {
  const q = normalize(question);
  for (const [pattern, build] of RELATIVE_RANGE_PATTERNS) {
    const m = q.match(pattern);
    if (m) return build(m);
  }
  const monthMatch = question.match(MONTH_PATTERN);
  if (monthMatch) {
    return { label: monthMatch[2] ? `${monthMatch[1]} ${monthMatch[2]}` : monthMatch[1], kind: "month" };
  }
  return null;
}

/** Quoted strings are the highest-confidence signal for a proper noun (brand/campaign/person). */
function quotedStrings(question) {
  const out = [];
  const re = /["“]([^"”]+)["”]/g;
  let m;
  while ((m = re.exec(question))) out.push(m[1].trim());
  return out;
}

/** Sequences of capitalized words, e.g. "Acme Corp" or "Jane Smith" — a weak but useful proper-noun heuristic. */
function capitalizedPhrases(question) {
  const re = /\b([A-Z][a-zA-Z0-9&.'-]*(?:\s+[A-Z][a-zA-Z0-9&.'-]*)*)\b/g;
  const out = [];
  let m;
  while ((m = re.exec(question))) {
    const phrase = m[1].trim();
    // Skip a lone capitalized word at the very start of the sentence (usually
    // just normal sentence-initial capitalization, e.g. "What...", "How...").
    if (m.index === 0 && !phrase.includes(" ")) continue;
    out.push(phrase);
  }
  return out;
}

const COMPETITOR_CUE = /\b(?:vs\.?|versus|against|compared? (?:to|with)|comparing (?:to|with))\s+(.+)$/i;
const CAMPAIGN_CUE = /\bcampaign(?:\s+called|\s+named)?\s+(.+)$/i;

/**
 * Given the text right after a cue phrase (e.g. "vs Acme Corp last month?"),
 * pull out just the proper-noun candidate: a quoted string if present,
 * otherwise the leading run of capitalized words, capped at 4 words so a
 * trailing date phrase ("...Acme Corp last month") doesn't get swept in.
 */
function properNounFromTail(tail) {
  if (!tail) return null;
  const quoted = quotedStrings(tail)[0];
  if (quoted) return quoted;
  const m = tail
    .trim()
    .match(/^([A-Z][a-zA-Z0-9&.'-]*(?:\s+[A-Z][a-zA-Z0-9&.'-]*){0,3})/);
  return m ? m[1].trim() : null;
}
const PERSON_ROLE_CUE = /\b(?:our|the)\s+(ceo|cfo|coo|spokesperson|founder|president|chairman|chairwoman)\b/i;

/** Extract the entities a given intent's requiredFilters call for. */
export function extractEntities(question, intent) {
  const filters = (intent && intent.requiredFilters) || [];
  const filterText = filters.join(" ").toLowerCase();
  const entities = {};

  const wantsDate = /date|period|range|quarter/.test(filterText) || !filters.length;
  if (wantsDate) {
    const dateRange = extractDateRange(question);
    if (dateRange) entities.dateRange = dateRange;
  }

  const competitorMatch = question.match(COMPETITOR_CUE);
  if (competitorMatch) {
    const competitor = properNounFromTail(competitorMatch[1]);
    if (competitor) entities.competitor = competitor;
  }

  const wantsCampaign = /campaign/.test(filterText);
  const campaignMatch = question.match(CAMPAIGN_CUE);
  if (wantsCampaign || campaignMatch) {
    const fromCue = campaignMatch && properNounFromTail(campaignMatch[1]);
    const quoted = quotedStrings(question)[0];
    entities.campaign = fromCue || quoted || null;
    if (!entities.campaign) delete entities.campaign;
  }

  const wantsPerson = /person/.test(filterText);
  const roleMatch = question.match(PERSON_ROLE_CUE);
  if (wantsPerson || roleMatch) {
    if (roleMatch) entities.person = { role: roleMatch[1].toUpperCase() };
    else {
      const proper = capitalizedPhrases(question).filter((p) => p.split(" ").length <= 3);
      if (proper.length) entities.person = { name: proper[0] };
    }
  }

  const wantsBrand = /brand/.test(filterText);
  if (wantsBrand) {
    // "our brand" always refers to the tenant's own brand; otherwise fall
    // back to the first quoted/capitalized proper noun that isn't already
    // claimed as the competitor.
    if (/\bour brand\b|\bwe\b|\bus\b/i.test(question)) {
      entities.brand = "self";
    } else {
      const candidate = quotedStrings(question)[0] || capitalizedPhrases(question)[0];
      if (candidate && candidate !== entities.competitor) entities.brand = candidate;
    }
  }

  return entities;
}

export default { extractDateRange, extractEntities };
