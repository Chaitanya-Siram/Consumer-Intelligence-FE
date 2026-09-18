# Whitespace & Gap Analysis lenses: backend contract

Self-contained spec for the three Consumer Intelligence (CI) Tier-2 lenses under the
Whitespace & Gap Analysis pillar: `audience_expectation`, `brand_messaging`,
`brand_performance`. Same conventions as the Perception Analysis, Dominant Narratives
and Brand Perception contracts; shared rules repeated so this file works alone.

The frontend screens are built. Each reads its key from `chartsData` and renders a
built-in sample with a "Sample data" pill until the backend returns it.

---

## 1. Where they plug in

Dashboard generation starts from the Review screen ("Create Dashboard"). The frontend
opens WebSocket `/ws/consumer-intelligence/charts` and expects the final message to carry
`charts_data`, keyed by lens. On reload it fetches
`GET /consumer-intelligence/charts?session_id=<id>`.

**When to build.** Only when the session's workflow has an analysis node with
`data.lensType === "tier1"`, `data.lens === "whitespace_gap_analysis"`, and `data.tier2[]`
includes the matching label. Build only the selected Tier-2 lenses.

| Tier-2 label (`data.tier2[]`) | `charts_data` key | Frontend screen |
|---|---|---|
| `"Audience Expectation"` | `audience_expectation` | `src/screens/AudienceExpectationScreen.jsx` |
| `"Brand Messaging"` | `brand_messaging` | `src/screens/BrandMessagingScreen.jsx` |
| `"Brand Performance"` | `brand_performance` | `src/screens/BrandPerformanceScreen.jsx` |

Samples with the exact shapes: `src/dashboards/storyboard/ae-sample.js`, `bm-sample.js`,
`bpf-sample.js`. Frontend mapping: `src/api/consumerIntelligence.js`
(`TIER1_TO_CI_KEYS.whitespace_gap_analysis`).

---

## 2. Inputs

Tagged articles (`id, title, content, url, date, section, brand, sentiment, theme,
competitors, author, priority, people, organizations, …`), project brand and competitor
list (already used by `brand_competitive_intel`), and optionally:

- **Secondary-research input** (per project, list of `{ text, source, value? }`). Several
  deck slides behind these lenses quote surveys (Morgan Stanley, Cornerstone, GoCardless).
  Those facts cannot come from posts. Either omit them, or accept this input and emit them
  with `"ext": true` (the frontend shows an "external" tag). Never invent statistics.
- **Brand-owned / earned content flag** per article, if the tagger distinguishes a brand's
  own posts and press from consumer posts. `brand_messaging` benefits from it (§5.3).

---

## 3. Rules

- **Numbers from tags, prose from the LLM.** Every `pct` is computed. Headlines, bullets,
  card text are LLM-written from the articles behind that section; quotes are verbatim.
- **`meta.logos` is required** for `meta.brand` and every brand named in the payload
  (`share[]`, `sentiment[]`, `brands[]`). Resolve via `logos.py`. The frontend merges logos
  across lenses as a fallback, but ship them here too.
- **Percentages** are integers 0–100. Groups marked "sums to 100" must after rounding.
- **Empty is fine, fabricated is not.** Omit or `[]` for anything not computable.
- **`<mark>` highlights** allowed in *rich* prose fields; no other markup.
- **`ext: true`** only on secondary-research items. Never on post-derived text.
- **Tone / colour keys** are fixed where listed. `tabs` verbatim. `meta.is_sample` absent.

---

## 4. Payloads

### 4.1 `audience_expectation`

```jsonc
{
  "meta": { "brand": "Discover", "category": "…", "window": "…", "total_mentions": 3860, "logos": { "Discover": "https://…" } },
  "tabs": [ { "id": "t1", "label": "Needs & Preferences" }, { "id": "t2", "label": "Unmet Needs" }, { "id": "t3", "label": "Digital Finance Gaps" } ],
  "footer": ["Audience Expectation · Whitespace & Gap Analysis", "Computed from 3,860 tagged posts"],

  // ---- tab 1 (deck PDF2 p24 + p25) ----------------------------------------
  "needs": {
    "banner": { "eyebrow": "Needs, Expectations & Preferences", "headline": "…", "sub": "…", "stats": [ /* 4, agg */ ] },
    "note": "…",                                   // llm
    "attributes": [                                // 4–6, desc by pct, pct sums to 100; points llm (rich), 1–3 each
      { "key": "service",  "name": "Service offerings", "pct": 33, "points": ["…", "…"] },
      { "key": "security", "name": "Safety & Security", "pct": 28, "points": ["…"] },
      { "key": "trust",    "name": "Trust and loyalty",  "pct": 24, "points": ["…"] },
      { "key": "cs",       "name": "Customer service",   "pct": 9,  "points": ["…"] },
      { "key": "limit",    "name": "Credit Limit",       "pct": 6,  "points": ["…"] }
    ],
    "drivers_title": "Key drivers to use credit cards",   // llm, optional section
    "drivers_lead": "…",                           // llm
    "drivers": [ "… (rich)", { "text": "…", "ext": true } ]   // 4–6 bullets
  },

  // ---- tab 2 (deck PDF2 p26) ----------------------------------------------
  "unmet": {
    "banner": { "eyebrow": "Unmet Needs", "headline": "…", "sub": "…", "stats": [ /* 4 */ ] },
    "note": "…",
    "needs": [                                     // 4–5 cards; pct agg (share of unmet-need posts), may be absent if too few; text llm (rich)
      { "key": "rewards",   "title": "Innovative and Personalized Rewards", "pct": 12, "text": "…" },
      { "key": "history",   "title": "Lack of credit history and limited credit access", "pct": 19, "text": "…" },
      { "key": "intl",      "title": "Barriers for international students…", "pct": 11, "text": "…" },
      { "key": "education", "title": "Financial Education and Guidance", "text": "…", "ext": true },
      { "key": "access",    "title": "Instant Access and Ease of Use", "pct": 33, "text": "…" }
    ]
  },

  // ---- tab 3 (deck PDF3 p18 + p20) ----------------------------------------
  "digital": {
    "banner": { "eyebrow": "Digital Finance Gaps", "headline": "…", "sub": "…", "stats": [ /* 4 = the pillar shares */ ] },
    "note": "…",
    "pillars": [                                   // exactly 4, desc, pct sums to 100; text llm (rich); quote verbatim
      { "key": "wallet",   "title": "Wallet Security",       "pct": 50, "text": "…", "quote": { "text": "…", "source": "X" } },
      { "key": "down",     "title": "App Down",              "pct": 25, "text": "…", "quote": { … } },
      { "key": "declined", "title": "Declined Transactions", "pct": 17, "text": "…", "quote": { … } },
      { "key": "env",      "title": "Environment",           "pct": 8,  "text": "…", "quote": { … } }
    ],
    "survey_title": "…", "survey_note": "…",       // optional; only with a secondary-research input
    "survey": [ { "value": "4 in 10", "label": "…", "ext": true } ]   // 0–4 stats, all ext
  }
}
```

Pillar keys and titles are category-specific in the deck (crypto wallets). For another
category the LLM names the four biggest digital-complaint clusters; keep `key` a slug.

### 4.2 `brand_messaging`

```jsonc
{
  "meta": { "brand": "Capital One", "category": "…", "window": "…", "total_mentions": 2750, "logos": { "Capital One": "…", "Citibank": "…", "Bank of America": "…" } },
  "footer": ["Brand Messaging · Whitespace & Gap Analysis", "Computed from 2,750 brand-initiative posts"],
  "note": "…",                                     // llm, one sentence
  "brands": [                                      // project brand + 2–4 competitors; frontend makes one tab per brand, project brand first
    {
      "name": "Capital One", "is_brand": true, "mentions": 1200,   // agg
      "headline": "…",                             // llm ≤ 12 words
      "sub": "…",                                  // llm, 1–2 sentences
      "initiatives": [                             // 3–6, desc by pct, pct sums to 100; points llm (rich), 1–3 each
        { "title": "Entertainment & Sports", "pct": 37, "points": ["…", "…"] },
        { "title": "Exclusive Card Holders Offer", "pct": 24, "points": ["…"] }
      ]
    }
  ]
}
```

No `tabs` field: tabs are derived from `brands[]`.

### 4.3 `brand_performance`

```jsonc
{
  "meta": { "brand": "Capital One", "category": "…", "window": "…", "total_mentions": 11500, "logos": { … } },
  "tabs": [ { "id": "t1", "label": "Share of Voice & Sentiment" }, { "id": "t2", "label": "Digital Experience" }, { "id": "t3", "label": "Mobile Banking" } ],
  "footer": [ … ],

  // ---- tab 1 (deck PDF3 p23) ----------------------------------------------
  "voice": {
    "banner": { "eyebrow": "Share of Voice & Sentiment", "headline": "…", "sub": "…", "stats": [ /* 4, agg */ ] },
    "note": "…",
    "share": [ { "name": "Citibank", "pct": 39 }, { "name": "Bank of America", "pct": 35 }, { "name": "Capital One", "pct": 26, "is_brand": true } ],   // agg, desc, sums to 100
    "sentiment": [                                 // agg, one row per brand in `share`, pos+neu+neg = 100
      { "name": "Capital One", "pos": 17, "neu": 76, "neg": 5, "is_brand": true },
      { "name": "Citibank", "pos": 27, "neu": 67, "neg": 5 },
      { "name": "Bank of America", "pos": 24, "neu": 68, "neg": 5 }
    ],
    "callout": "…"                                 // llm, one sentence on the gap
  },

  // ---- tab 2 (deck PDF3 p21) ----------------------------------------------
  "digital": {
    "banner": { "eyebrow": "Digital Experience", "headline": "…", "sub": "…", "stats": [ /* 4 */ ] },
    "note": "…",
    "brands": [                                    // same brands as tab 1, project brand first
      {
        "name": "Capital One", "is_brand": true,
        "themes": [ { "name": "Convenience", "pct": 22 }, { "name": "App crash related", "pct": 20 } ],   // agg, top 4–8 digital-experience themes within the brand's posts
        "working": ["…", "…"],                     // llm (rich), 2–5 bullets from positive posts
        "not_working": ["…"]                       // llm (rich), 1–4 bullets from negative posts
      }
    ]
  },

  // ---- tab 3 (deck PDF3 p19) — secondary research; omit `mobile` entirely if no research input
  "mobile": {
    "banner": { "eyebrow": "Mobile Banking Experience", "headline": "…", "sub": "…", "stats": [ /* 4, ext */ ] },
    "note": "…",
    "surge": [ { "text": "…", "ext": true } ],     // 2–4 bullets
    "activity": { "series": ["Gen Z", "Gen Y"], "rows": [ { "name": "Check balance / activity", "values": [51, 64] } ], "ext": true },
    "channel":  { "series": ["Desktop", "Mobile app", "Branch", "Other"], "groups": [ { "name": "Gen Z", "values": [21, 37, 18, 24] } ], "ext": true }   // each group's values sum to 100
  }
}
```

If `mobile` is omitted the frontend still renders the tab list from `tabs`; drop the third
entry from `tabs` too.

---

## 5. Computation recipe

### 5.1 Filter
Relevant articles only. "Rated" = has a normalised sentiment. "Brand-tagged" = names a
tracked issuer in `brand` or `competitors`.

### 5.2 `audience_expectation`
1. **Attributes (tab 1):** classify expectation / complaint posts about the project brand
   into 4–6 attribute buckets (LLM batch or `theme` rules). Deck buckets: service offerings,
   safety & security, trust & loyalty, customer service, credit limit. Count → `pct`, sum to
   100. LLM writes 1–3 bullets per attribute from that bucket's posts.
2. **Drivers (tab 1):** LLM writes 4–6 "why they use it" bullets from usage posts. Optional.
3. **Unmet needs (tab 2):** cluster posts expressing a want, gap or frustration into 4–5
   needs (LLM open coding, merge to ≤ 5). `pct` = share of unmet-need posts; omit `pct`
   when a cluster is < 3% or purely from research. LLM writes `text`.
4. **Digital pillars (tab 3):** among digital / app / payment complaint posts, cluster into
   exactly 4 pillars, `pct` sums to 100, one verbatim quote each.
5. **Survey (tab 3):** only from the secondary-research input, all `ext: true`.

### 5.3 `brand_messaging`
1. Select brand-initiative posts per tracked brand: posts about campaigns, partnerships,
   programs, offers, features the brand announced (brand-owned / earned content flag if
   available, otherwise LLM classification "is this about something the brand did?").
2. Cluster each brand's initiative posts into 3–6 message themes (LLM open coding). `pct`
   = share of that brand's initiative posts, sums to 100. `mentions` = count.
3. LLM writes `headline`, `sub`, and 1–3 bullets per theme from that theme's posts.
4. Order `brands[]` project brand first, then competitors by `mentions` desc.

### 5.4 `brand_performance`
1. **Share (tab 1):** count brand-tagged posts per tracked brand (reuse
   `brand_competitive_intel` counts). Normalise to 100, desc.
2. **Sentiment (tab 1):** within each brand's rated posts, pos / neu / neg shares, sum 100.
   LLM writes a one-sentence `callout` on the gap between the project brand and the best
   competitor.
3. **Digital (tab 2):** filter each brand's posts to digital-experience topics (app, website,
   login, crash, notifications, UI, security, outage). Count `theme` within that subset →
   top 4–8, `pct` within the subset. LLM writes `working` from positive and `not_working`
   from negative posts in the subset.
4. **Mobile (tab 3):** secondary research only. Omit if no research input.

### 5.5 Logos
Every brand string in `meta.brand`, `share[].name`, `sentiment[].name`,
`digital.brands[].name`, `brand_messaging.brands[].name` → `logos.py` → `meta.logos`.

---

## 6. LLM prompt guidance

Same system prompt as the other lenses:

```
You write short, factual dashboard copy for a consumer-intelligence report about
<category> and the brand <brand>. You are given aggregated numbers and a sample of
the underlying social posts. Rules:
- Never state a number that is not in the numbers you were given.
- Describe only what the sample posts support. If the sample is thin, say less.
- British spelling, present tense, no marketing tone, no exclamation marks.
- Where asked for "rich" text, wrap 2–4 key phrases in <mark>…</mark>. No other HTML.
- Headlines ≤ 12 words. Bullets 1–2 sentences.
- Output strict JSON matching the schema you are given, nothing else.
```

Per section, pass the field schema, the computed numbers, and 20–40 representative
articles. Validate JSON; retry once; then omit the prose field.

---

## 7. Done when

- `GET /consumer-intelligence/charts?session_id=<id>` includes each selected key for a
  session whose workflow selected Whitespace & Gap Analysis with that Tier-2.
- `audience_expectation.needs.attributes` and `digital.pillars` sum to 100;
  `brand_performance.voice.share` sums to 100 and every `sentiment` row sums to 100;
  every `brand_messaging.brands[].initiatives` sums to 100.
- Every brand in any payload has a `meta.logos` entry.
- `ext: true` appears only when a secondary-research input exists.
- No text copied from the sample files or this document.
- Frontend: "Sample data" pills disappear; brand chips show logos.

---

## 8. Paste-ready brief for the backend Claude Code session

```
Read docs/ci-lens-contracts-whitespace-gap.md fully before doing anything.

Goal: add three Consumer Intelligence lenses to the CI charts job that already
builds brand_health_storyboard, brand_competitive_intel and the other CI lenses:
  - audience_expectation   (Tier-2 "Audience Expectation")
  - brand_messaging        (Tier-2 "Brand Messaging")
  - brand_performance      (Tier-2 "Brand Performance")
all under Tier-1 whitespace_gap_analysis. Return each inside the same charts_data
object from /ws/consumer-intelligence/charts and GET /consumer-intelligence/charts,
only when the session's workflow selected that Tier-2 label.

Follow the doc exactly:
  - Section 4 gives the JSON shapes; tab ids, fixed keys and sum-to-100 groups must match.
  - Section 5 is the computation recipe; numbers from articles, LLM prose only.
  - Section 2: decide whether a secondary-research input exists. If not, omit
    brand_performance.mobile and audience_expectation.digital.survey, and never emit
    ext: true or invented survey numbers.
  - Reuse brand-mention and sentiment counts from brand_competitive_intel for
    brand_performance.voice; do not recompute differently.
  - Every brand in any payload needs a meta.logos entry via logos.py.

Before writing code, tell me:
  1. which module builds brand_competitive_intel and how these three will sit beside it,
  2. whether the tagger flags brand-owned / earned content (section 5.3 depends on it),
  3. whether you will add a secondary-research input or omit the ext sections,
  4. where the LLM prompts live and what you will add.
Then implement, add the same tests the existing lenses have, and show me one real
payload per lens from a session with all three selected.
```
