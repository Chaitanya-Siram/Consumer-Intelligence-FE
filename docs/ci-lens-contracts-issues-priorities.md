# Consumer Intelligence lens contracts: Track Emerging Issues, Shifting Audience Priorities, Perception Analysis

Backend contract for three new Consumer Intelligence (CI) Tier-2 lenses. The frontend
screens are already built and read these keys from the CI charts payload. Until the
backend returns them, the screens render a built-in sample and show a "Sample data" pill.

## 1. Where this plugs in

The frontend triggers dashboard generation from the Review screen ("Create Dashboard").
It opens the WebSocket `/ws/consumer-intelligence/charts` and expects the final message to
carry `charts_data`, an object keyed by lens. It also fetches the cached payload via
`GET /consumer-intelligence/charts?session_id=<id>`.

All new lenses must appear in that same `charts_data` object, alongside the existing
Brand Intelligence keys (`brand_health_storyboard`, `brand_competitive_intel`, ...).

| Workflow analysis node (`data.lens`, `lensType: "tier1"`) | Tier-2 label (`data.tier2[]`) | `charts_data` key to return |
|---|---|---|
| `issues_intelligence` | "Track Emerging Issues" | `track_emerging_issues` |
| `advanced_metrics` | "Shifting Audience Priorities" | `shifting_audience_priorities` |
| `landscape_analysis` | "Perception Analysis" | `perception_analysis` |

Frontend mapping lives in `src/api/consumerIntelligence.js` (`TIER1_TO_CI_KEYS`).
Only build a lens when the session's workflow selected it, the same way the Brand
Intelligence lenses behave.

## 2. Inputs available

The session's tagged articles. Fields the frontend knows about (from the Review table):

```
id, title, content, url, date, relevancy_confidence, relevancy_reason,
section, section_confidence, brand, sentiment, sentiment_confidence,
theme, theme_confidence, competitors, author, priority, people, countries,
organizations, syndication, similar, added_type
```

Plus the project's brand name and competitor list, as already used for
`brand_competitive_intel` (`meta.brand`, `meta.competitors`).

## 3. Rules shared by all lenses

- **Numbers come from tags, prose comes from the LLM.** Every count, percentage, series
  and score below is computed from the tagged articles. Every headline, sub-line,
  stage description, callout text and quote is LLM-written from the same articles,
  never invented. Mark each field's source in the tables: `agg` or `llm`.
- **`meta.logos` is required.** A map of brand name to logo URL, resolved by the existing
  `logos.py` path, for every brand named anywhere in the payload (the project brand and
  all competitors at minimum). The frontend renders logos from this map and falls back to
  initials if a URL is missing or 404s.
- **Percentages** are integers 0-100. Groups that should sum to 100 (theme shares, donut
  splits) must sum to 100 after rounding.
- **Empty is fine, fabricated is not.** If a section cannot be computed for this session
  (too few articles, no dates), return an empty array or omit the key. The frontend hides
  what is missing. Do not pad with made-up values.
- **Tone values** are `"pos" | "neg" | "neu"`, plus `"warn"` where a payload field says so
  (the emotion mix in `perception_analysis`).
- **`tabs`** is fixed per lens and can be returned verbatim as shown.
- **`meta.is_sample`** must be absent or `false` in real payloads.

## 4. `track_emerging_issues`

Screen: three tabs. Reference layout: `src/screens/TrackEmergingIssuesScreen.jsx`.
Full sample: `src/dashboards/storyboard/tei-sample.js`.

```jsonc
{
  "meta": {
    "brand": "Armor All",                 // agg: project brand
    "window": "Jan – Jun 2024",           // agg: min–max article date
    "platforms": ["X", "Forums", "Blogs", "News"],   // agg: distinct sources
    "total_mentions": 6120,               // agg: article count
    "logos": { "Armor All": "https://..." }          // required
  },
  "tabs": [
    { "id": "t1", "label": "Issue Journey" },
    { "id": "t2", "label": "Behaviour & Usage" },
    { "id": "t3", "label": "Themes & Drivers" }
  ],
  "footer": ["Track Emerging Issues · Issues Intelligence", "Computed from 6,120 tagged posts"],

  // ---- tab 1 --------------------------------------------------------------
  "journey": {
    "banner": {
      "eyebrow": "Issue Journey",
      "headline": "...",                  // llm
      "sub": "...",                       // llm
      "stats": [                          // agg, exactly 4
        { "value": "4", "label": "Lifecycle stages" },
        { "value": "1,940", "label": "Peak monthly mentions" },
        { "value": "Mar '24", "label": "Peak month" },
        { "value": "4", "label": "Platforms" }
      ]
    },
    "stages": [                           // llm, 3–5 stages, ordered
      {
        "label": "Discovery Phase",
        "steps": [ { "title": "...", "detail": "..." } ]   // 2–4 steps, detail optional
      },
      {
        "label": "Verification Process",
        "gate": true,                     // a decision gate renders as a dashed pill
        "outcomes": [ { "label": "Accept", "tone": "pos" }, { "label": "Reject", "tone": "neg" } ],
        "note": "..."
      }
    ]
  },
  "trend": {
    "title": "Social media mention trendline · <issue>",   // llm
    "headline": "...",                    // llm: one-sentence read of the curve
    "unit": "No. of mentions",
    "points": [ { "x": "Jan '24", "y": 1100 } ],           // agg: monthly counts, chronological
    "annotations": [                      // llm text on agg-detected peaks/troughs, ≤3
      { "at": 2, "label": "Mar · peak", "text": "..." }    // `at` = index into points
    ],
    "footnote": "Mentions are from: X, Forums, Blogs, News."   // agg
  },

  // ---- tab 2 --------------------------------------------------------------
  "behaviour": {
    "banner": { "eyebrow": "Behaviour & Usage", "headline": "...", "sub": "...", "stats": [ /* 3 */ ] },
    "profile": [                          // llm, exactly 3: Behaviour / Interests / Attitude
      { "title": "Behaviour", "sub": "...", "points": ["...", "..."] }
    ],
    "usage_note": "...",                  // llm
    "usage": [                            // llm, 4 cards
      { "title": "Building credit history", "segments": ["College-aged · 18–24"], "points": ["..."] }
    ]
  },

  // ---- tab 3 --------------------------------------------------------------
  "themes": {
    "banner": { "eyebrow": "Themes & Drivers", "headline": "...", "sub": "...", "stats": [ /* 3 */ ] },
    "funnel": [                           // agg, exactly 2 stages, wide → narrow
      { "value": "~38%", "label": "of all posts are about <category>" },
      { "value": "~15%", "label": "of those relate to <issue>" }
    ],
    "rows": [                             // agg from `theme`, pct sums to 100, ≤8 rows, desc
      { "name": "Rewards / Benefits", "pct": 41, "text": "..." }   // text: llm, one sentence
    ]
  },
  "motivation": {
    "note": "...",                        // llm
    "split": [ { "name": "Rewards / Benefits", "pct": 40 } ],     // agg, sums to 100, ≤6
    "drivers": [ { "title": "Rewards / Benefits", "text": "..." } ] // llm, same names as split
  },
  "multi": {
    "note": "...",                        // llm
    "holders": [ { "name": "Single product", "pct": 71 }, { "name": "Multiple products", "pct": 29 } ], // agg, 2 rows
    "sentiment": [                        // agg from `sentiment`, sums to 100
      { "name": "Positive", "pct": 52, "tone": "pos" },
      { "name": "Negative", "pct": 10, "tone": "neg" },
      { "name": "Neutral",  "pct": 38, "tone": "neu" }
    ],
    "single":   { "rows": [ { "name": "...", "pct": 36 } ], "points": ["..."], "quote": { "text": "...", "source": "Reddit · r/..." } },
    "multiple": { "rows": [ { "name": "...", "pct": 33 } ], "points": ["..."], "quote": { "text": "...", "source": "..." } }
    // rows: agg theme share within each cohort. points: llm. quote: a real article excerpt + source.
  }
}
```

Computation hints:

- `trend.points`: bucket `date` by month; label `"Mon 'YY"`.
- `themes.rows` / `motivation.split`: count `theme` values; take the top N, fold the tail
  into `"Others"`.
- `multi.holders`: the "single vs multiple" split is domain-specific. If the category has
  no such concept, return `holders: []` and `single`/`multiple` omitted; the frontend hides
  that section.
- `multi.sentiment`: count normalised `sentiment` (pos/neg/neu) over rated articles only.
- Quotes must be verbatim excerpts from `content`, with `url` host or platform as `source`.

## 5. `shifting_audience_priorities`

Screen: two tabs. Reference layout: sample artifact shared in chat; the frontend screen
will mirror it exactly. No "Measurement parameters" section (removed by request).

```jsonc
{
  "meta": {
    "brand": "Discover",                  // agg
    "category": "Gen-Z Student Credit Cards",   // llm or project name
    "window": "Oct 2015 – Mar 2016",      // agg
    "logos": { "Discover": "https://...", "Capital One": "https://..." }   // required
  },
  "footer": ["Shifting Audience Priorities · Advanced Metrics", "Computed from N tagged posts"],

  // ---- tab 1 : Loyalty Index ------------------------------------------------
  "loyalty": {
    "banner": {
      "headline": "...",                  // llm
      "sub": "...",                       // llm
      "stats": [                          // agg, exactly 4
        { "value": "44", "label": "Loyalty index · current" },
        { "value": "+4", "label": "vs industry" },
        { "value": "+19", "label": "vs competitor" },
        { "value": "Monthly", "label": "Tracking cadence" }
      ]
    },
    "index": {                            // agg
      "value": 44, "prior": 40, "min": 10, "max": 100,
      "label": "Brand Loyalty Index", "sub": "Driven by switching behaviour",
      "note": "..."                       // llm, one sentence
    },
    "lead": "Likability quotient is derived from ... <b>loyalty</b> ...",   // llm; <b> allowed
    "params": [                           // fixed 4, descriptions llm-tailored to category
      { "name": "Net Promoter Score (NPS)", "text": "..." },
      { "name": "Net Sentiment Score", "text": "..." },
      { "name": "Usage Frequency", "text": "..." },
      { "name": "Switching Intent", "text": "..." }
    ],
    "cadence_title": "Monthly | Quarterly Tracking",
    "tracking": [                         // agg, exactly 4, keys fixed (drive the icons)
      { "key": "nps",       "name": "Net Promoter Score", "value": "+32",  "trend": "+5 vs last month",   "dir": "up" },
      { "key": "sentiment", "name": "Net Sentiment",      "value": "+17.5","trend": "+2.1 vs last month", "dir": "up" },
      { "key": "switch",    "name": "Switching Intent",   "value": "21", "unit": "%",   "trend": "-3 pts vs last month", "dir": "up" },
      { "key": "usage",     "name": "Usage Frequency",    "value": "4.2","unit": "/ wk","trend": "flat vs last month",  "dir": "flat" }
    ]                                     // dir: "up" | "down" | "flat" = good/bad/neutral, not arithmetic sign
  },

  // ---- tab 2 : Index Trend & Benchmarks -----------------------------------
  "trend": {
    "banner": { "headline": "...", "sub": "...", "stats": [ /* 3 */ ] },   // llm + agg
    "title": "Monthly / quarterly brand loyalty index",
    "note": "...",                        // llm
    "unit": "Loyalty index",
    "points": [ ["10/1", 720], ["10/8", 610] ],          // agg: [label, value] weekly, chronological
    "spikes": [                           // agg-detected (e.g. > 60% over trailing mean), text llm, ≤6
      { "at": 5, "label": "Good-grades cashback announced", "text": "..." }
    ],
    "footnote": "..."                     // agg description of method
  },
  "monthly": {                            // agg
    "score": 30, "min": 0, "max": 100,
    "bands": [ { "to": 33, "tone": "neg" }, { "to": 66, "tone": "neu" }, { "to": 100, "tone": "pos" } ],
    "text": "..."                         // llm, 1–2 sentences
  },
  "benchmark": {                          // agg
    "rows": [
      { "name": "Industry score",   "value": 40 },
      { "name": "Competitor score", "value": 25 },
      { "name": "Discover score",   "value": 44, "is_brand": true }
    ],
    "verdict": { "label": "Over indexed", "tone": "pos" }   // pos if brand > industry, else neg
  }
}
```

Computation hints (define the weights once, keep them stable across sessions):

- **Loyalty index** = Σ Wᵢ·Xᵢ ÷ net-sentiment score, scaled to 10–100. Xᵢ = share of
  conversations tagged with convenience/loyalty theme i; Wᵢ = fixed weights. Net
  sentiment = (positive − negative) ÷ total rated.
- **Weekly `trend.points`**: same index computed per ISO week over the window.
- **Spikes**: weeks where the index exceeds 1.6 × trailing 4-week mean. LLM labels each
  spike from that week's articles.
- **Benchmark**: industry = index over all articles; competitor = index over articles
  tagging the top competitor; brand = index over articles tagging the project brand.
- **Tracking tiles**: NPS proxy = % positive − % negative among rated articles about the
  brand; switching intent = share of articles whose `theme` or `content` indicates
  switching / multiple products; usage frequency = mean brand mentions per week.
  If a tile cannot be computed, set `value: "—"` and `trend: "no data"`, `dir: "flat"`.

## 6. `perception_analysis`

Screen: three tabs. Reference layout: `src/screens/PerceptionAnalysisScreen.jsx`.
Full sample: `src/dashboards/storyboard/pa-sample.js`. Deck pages 28–31.

Prose fields in this lens may contain `<mark>…</mark>` around key phrases (the deck's
underlined links). No other markup is rendered.

```jsonc
{
  "meta": {
    "brand": "Discover",                  // agg: project brand
    "category": "Gen-Z Student Credit Cards",   // llm or project name
    "window": "Jan – Jun 2024",           // agg
    "total_mentions": 4870,               // agg
    "rated_mentions": 4212,               // agg: articles with a sentiment tag
    "logos": { "Discover": "https://...", "Capital One": "https://...", "Bank of America": "https://..." }  // required
  },
  "tabs": [
    { "id": "t1", "label": "General Perception" },
    { "id": "t2", "label": "Sentiment Drivers" },
    { "id": "t3", "label": "Emotional Outlook" }
  ],
  "footer": ["Perception Analysis · Landscape Analysis", "Computed from 4,870 tagged posts"],

  // ---- tab 1 : General Perception (deck p29) --------------------------------
  "perception": {
    "banner": { "eyebrow": "Perception Analysis", "headline": "...", "sub": "...", "stats": [ /* 4, agg */ ] },  // headline/sub llm
    "note": "...",                        // llm, one sentence describing the section
    "summary": "...",                     // llm: the one-paragraph read
    "keywords": ["building credit history", "..."],   // llm, 4–6 short phrases lifted from summary
    "themes": [                           // 6 cards, order fixed; pct agg, text llm
      { "key": "benefits", "title": "Perceived Benefits",          "pct": 27, "text": "... <mark>...</mark> ..." },
      { "key": "caution",  "title": "Cautionary Use",              "pct": 19, "text": "..." },
      { "key": "literacy", "title": "Building Financial Literacy", "pct": 16, "text": "..." },
      { "key": "brands",   "title": "Brand Preferences",           "pct": 15, "text": "...", "brands": ["Discover", "Capital One"] },
      { "key": "parents",  "title": "Parental Influence",          "pct": 13, "text": "..." },
      { "key": "concerns", "title": "Concerns and Advice",         "pct": 10, "text": "..." }
    ]                                     // keys drive the card icons; keep them. pct = share of perception-tagged posts, sums to 100
  },

  // ---- tab 2 : Sentiment Drivers (deck p30) ---------------------------------
  "sentiment": {
    "banner": { "eyebrow": "Sentiment Drivers", "headline": "...", "sub": "...", "stats": [ /* 4 */ ] },
    "note": "...",                        // llm
    "split": [                            // agg from `sentiment`, sums to 100, tones fixed
      { "name": "Positive", "pct": 37, "tone": "pos" },
      { "name": "Negative", "pct": 12, "tone": "neg" },
      { "name": "Neutral",  "pct": 51, "tone": "neu" }
    ],
    "groups": [                           // one per pole, same pct as split; drivers llm (2–3 each)
      { "tone": "pos", "label": "Positive", "pct": 37, "drivers": [ { "title": "...", "text": "...", "brands": [] } ] },
      { "tone": "neu", "label": "Neutral",  "pct": 51, "drivers": [ ... ] },
      { "tone": "neg", "label": "Negative", "pct": 12, "drivers": [ { "title": "Customer Service Issues", "text": "...", "brands": ["Discover"] } ] }
    ],
    "quotes": [                           // ≤3 verbatim excerpts from `content`, with source
      { "text": "...", "source": "Reddit · r/CreditCards", "tone": "pos" }
    ]
  },

  // ---- tab 3 : Emotional Outlook (deck p31) ---------------------------------
  "emotion": {
    "banner": { "eyebrow": "Emotional Outlook", "headline": "...", "sub": "...", "stats": [ /* 4 */ ] },
    "note": "...",                        // llm
    "summary": "...",                     // llm: the one-paragraph read
    "mix": [                              // agg from emotion tags, sums to 100, tones fixed
      { "name": "Trust / Appreciation",    "pct": 41, "tone": "pos" },
      { "name": "Neutral / Informational", "pct": 37, "tone": "neu" },
      { "name": "Anxiety / Fear",          "pct": 13, "tone": "warn" },
      { "name": "Frustration / Anger",     "pct": 9,  "tone": "neg" }
    ],
    "lead": "... <mark>...</mark> ...",   // llm, one sentence
    "aspect_label": "Negative aspects",
    "aspect_tags": ["Unhappy", "Fearful", "Stressed", "Anxious"],   // the emotion labels that make up the negative set
    "aspects": [                          // 3 cards; pct agg = share of rated posts, text llm
      { "key": "debt",     "title": "Debt Concerns",      "pct": 11, "text": "..." },
      { "key": "literacy", "title": "Financial Literacy", "pct": 6,  "text": "..." },
      { "key": "stress",   "title": "Stress and Anxiety", "pct": 5,  "text": "..." }
    ]
  }
}
```

Computation hints:

- `perception.themes[].pct`: classify each article into one of the six perception themes
  (LLM or keyword rules), count, normalise to 100. Titles and keys are fixed; the LLM writes
  the `text` for each from that theme's articles.
- `sentiment.split` / `groups[].pct`: count normalised `sentiment` over rated articles.
  Drivers are the top themes within each pole, described by the LLM from those articles.
- `emotion.mix`: needs an emotion tag per article (trust / neutral / anxiety / frustration).
  If the tagger does not emit one, derive it from sentiment + theme, or return `mix: []` and
  the frontend hides the strip.
- `emotion.aspects[].pct`: share of rated articles matching each negative aspect.
- `brands[]` on any card: only brands actually named in that card's source articles.

## 7. Done when

- `GET /consumer-intelligence/charts?session_id=<id>` returns each key for a session whose
  workflow selected the corresponding Tier-1 lens.
- Every brand named in either payload has an entry in that payload's `meta.logos`.
- No field contains sample text from this document, `tei-sample.js` or `pa-sample.js`.
- The frontend "Sample data" pill disappears on those screens.
