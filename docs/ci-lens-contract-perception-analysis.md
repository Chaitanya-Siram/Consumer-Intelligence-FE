# Perception Analysis lens: backend contract

Self-contained spec for the `perception_analysis` Consumer Intelligence (CI) lens. It
duplicates the shared rules from `ci-lens-contracts-issues-priorities.md` so it can be
handed to the backend on its own.

The frontend screen is built and committed. It reads `chartsData.perception_analysis`
and, until that key exists, renders a built-in sample with a "Sample data" pill. The
backend's job is to compute and return that key from the session's tagged articles.

---

## 1. Where it plugs in

Dashboard generation starts from the Review screen ("Create Dashboard"). The frontend:

1. Opens WebSocket `/ws/consumer-intelligence/charts` and expects the final message to
   carry `charts_data`, an object keyed by lens.
2. On reload, fetches the cached payload from `GET /consumer-intelligence/charts?session_id=<id>`.

`perception_analysis` must be one more key in that `charts_data` object, next to
`brand_health_storyboard`, `brand_competitive_intel`, and the rest.

**When to build it.** Only when the session's workflow has an analysis node with
`data.lensType === "tier1"` and `data.lens === "landscape_analysis"`, and its
`data.tier2[]` includes `"Perception Analysis"`. Same gating the Brand Intelligence
lenses use.

| Tier-1 key (`data.lens`) | Tier-2 label (`data.tier2[]`) | `charts_data` key |
|---|---|---|
| `landscape_analysis` | `"Perception Analysis"` | `perception_analysis` |

Frontend files, for reference only (do not need changing):

- `src/screens/PerceptionAnalysisScreen.jsx` — the screen
- `src/dashboards/storyboard/pa-sample.js` — the sample payload, same shape as below
- `src/api/consumerIntelligence.js` — `TIER1_TO_CI_KEYS.landscape_analysis = ['perception_analysis']`

---

## 2. Inputs

The session's tagged articles. Fields the frontend knows about:

```
id, title, content, url, date, relevancy_confidence, relevancy_reason,
section, section_confidence, brand, sentiment, sentiment_confidence,
theme, theme_confidence, competitors, author, priority, people, countries,
organizations, syndication, similar, added_type
```

Plus the project's brand name and competitor list, as already used for
`brand_competitive_intel` (`meta.brand`, `meta.competitors`).

---

## 3. Rules

- **Numbers come from tags, prose comes from the LLM.** Every count and percentage is
  computed from the articles. Every headline, summary, card text and quote is LLM-written
  from the same articles, never invented. Each field below is marked `agg` or `llm`.
- **`meta.logos` is required.** Map of brand name to logo URL, resolved by the existing
  `logos.py` path, for the project brand and every brand named anywhere in the payload.
  The frontend renders logos from this map and falls back to initials if a URL is missing
  or 404s.
- **Percentages** are integers 0–100. Groups that should sum to 100 (`split`, `mix`,
  `themes[].pct`) must sum to 100 after rounding.
- **Empty is fine, fabricated is not.** If a section cannot be computed (too few
  articles, no emotion tags), return an empty array or omit the key. The frontend hides
  what is missing. Never pad with made-up values.
- **Tone values**: `"pos" | "neg" | "neu"`, plus `"warn"` in `emotion.mix` only.
- **`<mark>` highlights.** Prose fields marked *rich* may wrap 1–4 key phrases in
  `<mark>…</mark>`. No other markup is rendered. Plain text is fine too.
- **Fixed keys.** `themes[].key` and `aspects[].key` drive the card icons. Use the values
  listed. Titles may be re-worded per category if the LLM finds better labels, keys must
  not change.
- **`tabs`** and **`meta.is_sample`**: return `tabs` verbatim as shown; `is_sample` must be
  absent or `false`.
- **Quotes** are verbatim excerpts from `content`, with `url` host or platform as `source`.

---

## 4. Payload

```jsonc
{
  "meta": {
    "brand": "Discover",                        // agg: project brand
    "category": "Gen-Z Student Credit Cards",   // llm (or project name)
    "window": "Jan – Jun 2024",                 // agg: min–max article date
    "total_mentions": 4870,                     // agg: article count
    "rated_mentions": 4212,                     // agg: articles with a sentiment tag
    "logos": {                                  // required
      "Discover": "https://…",
      "Capital One": "https://…",
      "Bank of America": "https://…"
    }
  },

  "tabs": [
    { "id": "t1", "label": "General Perception" },
    { "id": "t2", "label": "Sentiment Drivers" },
    { "id": "t3", "label": "Emotional Outlook" }
  ],

  "footer": [                                   // agg
    "Perception Analysis · Landscape Analysis",
    "Computed from 4,870 tagged posts"
  ],

  // ===== TAB 1 · General Perception (deck p29) =====================================
  "perception": {
    "banner": {
      "eyebrow": "Perception Analysis",
      "headline": "A tool for building credit, held with caution",   // llm, ≤ 10 words
      "sub": "…",                                                    // llm, 1–2 sentences
      "stats": [                                                     // agg, exactly 4
        { "value": "6",        "label": "Perception themes" },
        { "value": "4,870",    "label": "Posts analysed" },
        { "value": "Discover", "label": "Most-recommended brand" },
        { "value": "37%",      "label": "Positive sentiment" }
      ]
    },
    "note": "…",                     // llm, one sentence describing the section
    "summary": "…",                  // llm, one paragraph: the overall read
    "keywords": ["building credit history", "…"],   // llm, 4–6 short phrases from summary
    "themes": [                      // exactly 6, this order; pct agg, text llm (rich)
      { "key": "benefits", "title": "Perceived Benefits",          "pct": 27, "text": "… <mark>…</mark> …" },
      { "key": "caution",  "title": "Cautionary Use",              "pct": 19, "text": "…" },
      { "key": "literacy", "title": "Building Financial Literacy", "pct": 16, "text": "…" },
      { "key": "brands",   "title": "Brand Preferences",           "pct": 15, "text": "…", "brands": ["Discover", "Capital One"] },
      { "key": "parents",  "title": "Parental Influence",          "pct": 13, "text": "…" },
      { "key": "concerns", "title": "Concerns and Advice",         "pct": 10, "text": "…" }
    ]                                // pct = share of perception-tagged posts, sums to 100
  },

  // ===== TAB 2 · Sentiment Drivers (deck p30) ======================================
  "sentiment": {
    "banner": {
      "eyebrow": "Sentiment Drivers",
      "headline": "…",               // llm
      "sub": "…",                    // llm
      "stats": [                     // agg, exactly 4
        { "value": "37%", "label": "Positive" },
        { "value": "12%", "label": "Negative" },
        { "value": "51%", "label": "Neutral" },
        { "value": "+25", "label": "Net sentiment" }    // positive% − negative%
      ]
    },
    "note": "…",                     // llm
    "split": [                       // agg, sums to 100, names/tones fixed
      { "name": "Positive", "pct": 37, "tone": "pos" },
      { "name": "Negative", "pct": 12, "tone": "neg" },
      { "name": "Neutral",  "pct": 51, "tone": "neu" }
    ],
    "groups": [                      // one per pole, pct = same as split; drivers llm, 2–3 each
      { "tone": "pos", "label": "Positive", "pct": 37,
        "drivers": [ { "title": "Perks and Rewards", "text": "… (rich)", "brands": [] } ] },
      { "tone": "neu", "label": "Neutral",  "pct": 51,
        "drivers": [ { "title": "…", "text": "…" } ] },
      { "tone": "neg", "label": "Negative", "pct": 12,
        "drivers": [ { "title": "Customer Service Issues", "text": "…", "brands": ["Discover"] } ] }
    ],
    "quotes": [                      // ≤ 3, verbatim from `content`
      { "text": "…", "source": "Reddit · r/CreditCards", "tone": "pos" }
    ]
  },

  // ===== TAB 3 · Emotional Outlook (deck p31) ======================================
  "emotion": {
    "banner": {
      "eyebrow": "Emotional Outlook",
      "headline": "…",               // llm
      "sub": "…",                    // llm
      "stats": [                     // agg, exactly 4
        { "value": "3",     "label": "Negative aspects" },
        { "value": "22%",   "label": "Posts with negative emotion" },
        { "value": "Debt",  "label": "Top concern" },
        { "value": "Trust", "label": "Top positive emotion" }
      ]
    },
    "note": "…",                     // llm
    "summary": "…",                  // llm, one paragraph
    "mix": [                         // agg, sums to 100, names/tones fixed
      { "name": "Trust / Appreciation",    "pct": 41, "tone": "pos" },
      { "name": "Neutral / Informational", "pct": 37, "tone": "neu" },
      { "name": "Anxiety / Fear",          "pct": 13, "tone": "warn" },
      { "name": "Frustration / Anger",     "pct": 9,  "tone": "neg" }
    ],
    "lead": "… <mark>…</mark> …",    // llm, one sentence (rich)
    "aspect_label": "Negative aspects",
    "aspect_tags": ["Unhappy", "Fearful", "Stressed", "Anxious"],
    "aspects": [                     // exactly 3, this order; pct agg, text llm
      { "key": "debt",     "title": "Debt Concerns",      "pct": 11, "text": "…" },
      { "key": "literacy", "title": "Financial Literacy", "pct": 6,  "text": "…" },
      { "key": "stress",   "title": "Stress and Anxiety", "pct": 5,  "text": "…" }
    ]                                // pct = share of rated posts, need not sum to 100
  }
}
```

---

## 5. Computation recipe

Do the aggregation first, then hand the LLM the numbers plus the relevant articles per
section. The LLM writes prose only; it never changes a number.

### 5.1 Filter

- Use articles the tagger marked relevant (`relevancy_confidence` above the threshold the
  other lenses already use).
- "Rated" = has a normalised `sentiment` in {positive, negative, neutral}.

### 5.2 Tab 1: perception themes

1. Classify each relevant article into **one** of the six perception themes. Two options:
   - LLM classification in batches: give the model the six theme definitions below and the
     article title + content, ask for one key per article. Cache the result on the article.
   - Or keyword rules mapped from your existing `theme` field, if it already has similar
     categories.
2. Count per theme → `pct` = count ÷ classified total × 100, rounded to sum to 100.
3. `brands` on a theme card = brands (project brand + competitors) named in ≥ 10% of that
   theme's articles.
4. LLM writes `text` per theme from up to ~30 sample articles of that theme. Ask it to
   wrap 2–4 key phrases in `<mark>`.
5. LLM writes `summary`, `keywords`, `headline`, `sub`, `note` from the six theme texts
   and the counts.

Theme definitions (feed to the classifier as-is):

| key | what it covers |
|---|---|
| `benefits` | The product seen as a tool for future benefit (credit history, approvals, future opportunities) |
| `caution` | How to use it responsibly, warnings about overspending or debt, mixed views on discipline |
| `literacy` | Learning budgeting / money management through the product; rewards as incentive for good habits |
| `brands` | Recommendations of specific brands or products, approval ease, comparisons |
| `parents` | Family involvement: authorized users, cosigners, parental guidance |
| `concerns` | Interest rates, fees, debt risk, advice on limits and paying in full |

### 5.3 Tab 2: sentiment split and drivers

1. `split`: count normalised `sentiment` over rated articles → three percentages.
2. `groups[].pct` = same numbers as `split`.
3. Drivers per pole: within each sentiment bucket, take the top 2–3 `theme` values by
   frequency. LLM writes a `title` and one-sentence `text` for each from that bucket's
   articles. `brands` = brands named in ≥ 10% of the driver's articles.
4. `quotes`: pick up to 3 short, clean, high-confidence excerpts (one positive, one
   negative if available). Verbatim. `source` = platform or URL host plus subreddit /
   handle if present.
5. `stats[3]` net sentiment = positive% − negative%, signed.

### 5.4 Tab 3: emotion

1. `mix` needs an emotion label per rated article with four buckets:
   trust/appreciation, neutral/informational, anxiety/fear, frustration/anger.
   - If the tagger already emits an emotion field, map it to these four.
   - If not, derive: positive → trust; neutral → neutral; negative → LLM decides fear vs
     anger per article (batch classify, cache).
   - If neither is feasible, return `mix: []`. The frontend hides the strip.
2. `aspects[].pct`: share of rated articles matching each negative aspect. Classify the
   negative + anxious articles into `debt` / `literacy` / `stress` (LLM batch or keywords).
   Articles outside the three aspects are simply not counted.
3. `stats`: negative-emotion share = anxiety + frustration; top concern = highest aspect;
   top positive emotion = "Trust" unless the mix says otherwise.
4. LLM writes `summary`, `lead`, `headline`, `sub`, `note`, and each aspect `text`.

### 5.5 Logos

Run every brand string that appears in `meta.brand`, `themes[].brands`,
`groups[].drivers[].brands` through `logos.py` and put the results in `meta.logos`.

---

## 6. LLM prompt guidance

One system prompt for all prose fields in this lens:

```
You write short, factual dashboard copy for a consumer-intelligence report about
<category> and the brand <brand>. You are given aggregated numbers and a sample of
the underlying social posts. Rules:
- Never state a number that is not in the numbers you were given.
- Describe only what the sample posts support. If the sample is thin, say less.
- British spelling, present tense, no marketing tone, no exclamation marks.
- Where asked for "rich" text, wrap 2–4 key phrases in <mark>…</mark>. No other HTML.
- Headlines ≤ 10 words. Card texts 1–3 sentences. Summaries one paragraph.
- Output strict JSON matching the schema you are given, nothing else.
```

Per-section user prompts pass: the field schema for that section, the computed numbers,
and 20–40 representative articles (title + first ~300 chars of content + sentiment +
theme). Validate the JSON, retry once on schema failure, then fall back to omitting the
prose field (the frontend tolerates missing text).

---

## 7. Done when

- `GET /consumer-intelligence/charts?session_id=<id>` includes `perception_analysis` for a
  session whose workflow selected Landscape Analysis → Perception Analysis.
- `tabs` has the three entries; `themes` has six cards with the fixed keys; `split` and
  `mix` sum to 100; `aspects` has three cards with the fixed keys.
- Every brand named in the payload has an entry in `meta.logos`.
- No text is copied from `pa-sample.js` or from this document.
- In the frontend, the "Sample data" pill disappears on the Perception Analysis screen and
  brand chips show logos instead of initials.

---

## 8. Paste-ready brief for the backend Claude Code session

```
Read docs/ci-lens-contract-perception-analysis.md fully before doing anything.

Goal: add the `perception_analysis` Consumer Intelligence lens to the CI charts job
that already builds brand_health_storyboard and brand_competitive_intel from a
session's tagged articles. Return it inside the same charts_data object from
/ws/consumer-intelligence/charts and GET /consumer-intelligence/charts, only when
the session's workflow selected Tier-1 landscape_analysis with Tier-2
"Perception Analysis".

Follow the doc exactly:
  - Section 4 is the JSON shape. Field names, fixed keys and tab ids must match.
  - Section 5 is the computation recipe. Numbers come from the articles; the LLM
    writes prose only and never invents a number.
  - Section 6 is the LLM prompt guidance.
  - Every brand named anywhere in the payload needs a meta.logos entry via logos.py.

Before writing code, tell me:
  1. which module builds brand_competitive_intel today and how you will add this lens
     beside it,
  2. whether the tagger already emits an emotion field (section 5.4 depends on it),
  3. where the LLM prompts live and what you will add.
Then implement, add the same tests the existing lenses have, and show me one real
payload from a session that has this lens selected.
```
