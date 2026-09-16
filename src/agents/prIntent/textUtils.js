// Small, dependency-free text helpers shared by classifier.js and
// entityExtractor.js. Deliberately simple (no NLP library) — the intent
// library's trigger phrases are short, templated questions, so plain
// tokenization + set overlap is enough to separate them reliably.

const STOPWORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
  "do", "does", "did", "have", "has", "had", "of", "in", "on", "at", "to",
  "for", "with", "about", "our", "we", "us", "i", "my", "me", "you", "your",
  "it", "its", "this", "that", "these", "those", "and", "or", "but", "so",
  "what", "how", "did", "can", "could", "would", "should", "vs", "compared",
]);

/** Lowercase, strip punctuation, collapse whitespace. */
export function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9\s%]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Normalize + split into words, keeping stopwords (used for phrase compare). */
export function words(text) {
  const n = normalize(text);
  return n ? n.split(" ") : [];
}

/** Words with stopwords removed — the "meaningful" token set for a phrase. */
export function significantTokens(text) {
  return words(text).filter((w) => w.length > 1 && !STOPWORDS.has(w));
}

/** Set of adjacent-word bigrams, e.g. "media coverage" from "our media coverage". */
export function bigrams(text) {
  const w = words(text);
  const out = [];
  for (let i = 0; i < w.length - 1; i++) out.push(`${w[i]} ${w[i + 1]}`);
  return out;
}

export function jaccard(setA, setB) {
  if (!setA.size && !setB.size) return 0;
  let intersection = 0;
  for (const item of setA) if (setB.has(item)) intersection++;
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Similarity between a free-text question and a single known phrase, in
 * [0, 1]. Combines three cheap signals so near-paraphrases still score well
 * even when word order or a stopword differs:
 *   - substring containment (handles "how many mentions did we get?" vs the
 *     shorter trigger "how many mentions")
 *   - significant-token Jaccard overlap (handles reordering/synonymish drops)
 *   - bigram overlap (rewards matching multi-word phrasing over stray
 *     single-word coincidences)
 */
export function phraseSimilarity(question, phrase) {
  const qNorm = normalize(question);
  const pNorm = normalize(phrase);
  if (!qNorm || !pNorm) return 0;

  if (qNorm === pNorm) return 1;
  if (qNorm.includes(pNorm) || pNorm.includes(qNorm)) {
    // Containment is a strong signal, but don't let a trivially short
    // phrase (e.g. a single common word) dominate a long question.
    const lengthRatio = Math.min(pNorm.length, qNorm.length) / Math.max(pNorm.length, qNorm.length);
    return 0.85 + 0.15 * lengthRatio;
  }

  const qTokens = new Set(significantTokens(question));
  const pTokens = new Set(significantTokens(phrase));
  const tokenScore = jaccard(qTokens, pTokens);

  const qBigrams = new Set(bigrams(question));
  const pBigrams = new Set(bigrams(phrase));
  const bigramScore = jaccard(qBigrams, pBigrams);

  return tokenScore * 0.65 + bigramScore * 0.35;
}

/** Best (question, phrase) similarity across a list of candidate phrases. */
export function bestPhraseSimilarity(question, phrases) {
  let best = 0;
  let bestPhrase = null;
  for (const phrase of phrases) {
    const score = phraseSimilarity(question, phrase);
    if (score > best) {
      best = score;
      bestPhrase = phrase;
    }
  }
  return { score: best, phrase: bestPhrase };
}
