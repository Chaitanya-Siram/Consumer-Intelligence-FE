// Turns an intent's `answerTemplate` / `expectedAnswer` string — a
// fill-in-the-blank pattern straight out of the source spreadsheets, e.g.
//   "Your brand received X mentions, up/down Y% vs previous period."
//   "The leading journalists were..."
//   "Top themes"                         (a bare label, not a sentence)
// — into an actual sentence, using the mock numbers a domain agent already
// generated for its chart. This is intentionally simple string substitution,
// not NLG: the spreadsheet authors used X/Y/Z/N as literal blanks (confirmed
// by scanning ~50 templates — they're consistently bare capital letters
// standing in for "insert a number here")... with one recurring exception:
// a handful of templates ("Competitor X owns...", "Narrative X is
// accelerating...") use the letter as a NAME blank instead, immediately
// after a noun like "Competitor" or "Narrative". Filling those with a
// number reads as nonsense ("Competitor 89 owns..."), so `topName` lets a
// caller supply the actual top-ranked category name for that one case.

import { pick } from "./mockData.js";

const PLACEHOLDER_LETTERS = ["X", "Y", "Z", "N"];

// Nouns after which a placeholder letter names a category/entity rather
// than a number (see the module comment above). Kept short and specific —
// broadening this list to guess at intent is riskier than leaving an
// unrecognized case to the (safe, if blander) numeric default.
const NAME_BLANK_NOUNS = new Set(["Competitor", "Narrative", "Brand", "Story", "Message", "Outlet", "Journalist"]);

/**
 * @param {string|null} template   raw answerTemplate/expectedAnswer text
 * @param {object} opts
 * @param {number[]} opts.numbers  values to drop into numeric X, Y, Z, N
 *                                 blanks, in order of first appearance
 * @param {number}  opts.deltaSign positive/negative — resolves "up/down"
 * @param {function} opts.rng      seeded RNG, used to pick a continuation
 * @param {string[]} opts.continuations  candidate clauses for a trailing "..."
 * @param {string|null} opts.topName  top-ranked category/entity name, used
 *                                 only for the "Competitor X"-style name
 *                                 blanks described above
 * @returns {{ text: string|null, isLabel: boolean }}
 *   `isLabel` is true when the template is a bare noun-phrase label (e.g.
 *   "Top themes") rather than a fillable sentence — callers should build
 *   their own data-driven summary in that case instead of trusting `text`.
 */
export function fillTemplate(template, { numbers = [], deltaSign = 1, rng, continuations = [], topName = null } = {}) {
  if (!template) return { text: null, isLabel: false };

  let text = String(template).trim();
  // Strip a single pair of wrapping quotes — the spreadsheets used them to
  // mark "this is literal text to say", not punctuation we want to keep.
  if (/^["“].*["”]$/.test(text)) text = text.slice(1, -1);

  const hasPlaceholder = /\b[XYZN]\b/.test(text) || /up\/down/i.test(text);
  const endsOpenEnded = /\.\.\.\s*$/.test(text);
  const isLabel = !hasPlaceholder && !endsOpenEnded && text.split(/\s+/).length <= 4;
  if (isLabel) return { text: null, isLabel: true };

  text = text.replace(/up\/down/gi, deltaSign >= 0 ? "up" : "down");

  // Assign each distinct placeholder letter the next unused number, in the
  // order the letters first appear — so "X mentions... ranking #Y" gets
  // numbers[0] for every X and numbers[1] for every Y. A letter immediately
  // preceded by one of NAME_BLANK_NOUNS gets `topName` instead and doesn't
  // consume a numbers[] slot.
  const seen = new Map();
  let cursor = 0;
  text = text.replace(/\b([XYZN])\b/g, (match, letter, offset, full) => {
    if (!seen.has(letter)) {
      const precedingWord = full.slice(0, offset).match(/([A-Za-z]+)\s*$/)?.[1];
      const isNameBlank = topName && NAME_BLANK_NOUNS.has(precedingWord);
      if (isNameBlank) {
        seen.set(letter, topName);
      } else {
        seen.set(letter, numbers[cursor] ?? 0);
        cursor += 1;
      }
    }
    return String(seen.get(letter));
  });

  if (endsOpenEnded && continuations.length) {
    const clause = pick(rng || Math.random, continuations);
    text = text.replace(/\.\.\.\s*$/, ` ${clause}.`);
  } else if (endsOpenEnded) {
    text = text.replace(/\.\.\.\s*$/, ".");
  }

  return { text, isLabel: false };
}

/** Build a plain-language summary of a "top N" data-driven answer when the template was just a bare label. */
export function summarizeTopRows(label, rows, { nameKey = "name", valueKey = "value", unit = "" } = {}) {
  if (!rows || !rows.length) return `${label}: no data available for the selected period.`;
  const top = rows.slice(0, 3).map((r) => {
    const name = r[nameKey] ?? r.name ?? r.date ?? "item";
    let value = r[valueKey];
    // Heatmap rows have no single `value` column — they carry one number per
    // column instead (e.g. { name: "Governance", "2026-08-10": 41, ... }).
    // Average the numeric columns rather than printing "undefined".
    if (value === undefined) {
      const numericEntries = Object.entries(r).filter(([k, v]) => k !== nameKey && typeof v === "number");
      value = numericEntries.length
        ? Math.round(numericEntries.reduce((sum, [, v]) => sum + v, 0) / numericEntries.length)
        : "n/a";
    }
    return `${name} (${value}${unit})`;
  });
  return `${label} for the selected period: ${top.join(", ")}.`;
}

export default { fillTemplate, summarizeTopRows };
