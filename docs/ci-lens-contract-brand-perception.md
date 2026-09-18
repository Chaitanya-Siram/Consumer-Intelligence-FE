# Brand Perception lens: backend contract

Self-contained spec for the `brand_perception` Consumer Intelligence (CI) lens under the
Brand Intelligence pillar. Same conventions as the Perception Analysis and Dominant
Narratives contracts; shared rules repeated so this file works alone.

The frontend screen is built. It reads `chartsData.brand_perception` and, until that key
exists, renders a built-in sample with a "Sample data" pill.

---

## 1. Where it plugs in

Dashboard generation starts from the Review screen ("Create Dashboard"). The frontend
opens WebSocket `/ws/consumer-intelligence/charts` and expects the final message to carry
`charts_data`, keyed by lens. On reload it fetches
`GET /consumer-intelligence/charts?session_id=<id>`.

`brand_perception` is one more key in `charts_data`, beside `brand_health_storyboard` and
`brand_competitive_intel`, which already belong to the same Tier-1 pillar.

**When to build it.** Only when the session's workflow has an analysis node with
`data.lensType === "tier1"`, `data.lens === "brand_intelligence"`, and `data.tier2[]`
includes `"Brand Perception"`.

| Tier-1 key | Tier-2 label | `charts_data` key |
|---|---|---|
| `brand_intelligence` | `"Brand Perception"` | `brand_perception` |

Frontend files, reference only: `src/screens/BrandPerceptionScreen.jsx`,
`src/dashboards/storyboard/bp-sample.js` (same shape as section 4),
`src/api/consumerIntelligence.js` (`TIER1_TO_CI_KEYS.brand_intelligence`).

---

## 2. Inputs

Tagged articles (`id, title, content, url, date, section, brand, sentiment, theme,
competitors, author, priority, people, organizations, …`), the project brand and
competitor list already used by `brand_competitive_intel`, and, if the tagger emits it,
a product / card-name entity per article.

---

## 3. Rules

- **Numbers from tags, prose from the LLM.** Every `pct` is computed. Every headline,
  summary, card text, bullet and quote is LLM-written or verbatim from the articles.
- **`meta.logos` is required.** Brand name to logo URL via `logos.py`, for the project
  brand and every brand in `popularity[]`, `brands[]` and `products[].brand`. The frontend
  merges logos from other lenses in the session as a fallback, but ship them here too.
- **Popularity shares** are share of brand-tagged posts naming each issuer. A post can
  name several issuers, so they need not sum to 100. Descending. Project brand flagged
  `is_brand: true`.
- **Empty is fine, fabricated is not.** Omit or return `[]` for anything not computable.
- **`<mark>` highlights** allowed in prose fields marked *rich*, nothing else.
- **Quotes and posts** are verbatim excerpts from `content`; `source` = platform or URL
  host, plus subreddit / handle if present. A post `reply` is a verbatim comment on it.
- **`tabs`** verbatim; `meta.is_sample` absent or `false`.

---

## 4. Payload

```jsonc
{
  "meta": {
    "brand": "Discover",                        // agg
    "category": "Gen-Z Student Credit Cards",   // llm or project name
    "window": "Jan – Jun 2024",                 // agg
    "total_mentions": 4130,                     // agg
    "logos": { "Discover": "https://…", "Capital One": "https://…", "Chase": "https://…", "Bank of America": "https://…" }
  },
  "tabs": [
    { "id": "t1", "label": "Brand Perception" },
    { "id": "t2", "label": "Popularity" },
    { "id": "t3", "label": "Switchover Intent" }
  ],
  "footer": ["Brand Perception · Brand Intelligence", "Computed from 4,130 tagged posts"],

  // ===== TAB 1 · Brand Perception (deck p15) ========================================
  "perception": {
    "banner": { "eyebrow": "Brand Perception", "headline": "…", "sub": "…",   // llm
                "stats": [ { "value": "65%", "label": "Discover share of voice" }, { "value": "4", "label": "Brands tracked" },
                           { "value": "6", "label": "Products discussed" }, { "value": "#1", "label": "Best student card · US News" } ] },  // agg (last one only if an award appears in posts)
    "note": "…",                               // llm
    "summary": "…",                            // llm, one sentence: what students appreciate
    "keywords": ["cash back", "…"],            // llm, 4–6 phrases
    "popularity": [                            // agg, desc; same numbers as tab 2 brands[].pct
      { "name": "Discover", "pct": 65, "is_brand": true }, { "name": "Capital One", "pct": 24 },
      { "name": "Chase", "pct": 16 }, { "name": "Bank of America", "pct": 13 }
    ],
    "products": [                              // 4–6 cards, desc by mention count; text llm (rich)
      {
        "brand": "Discover",                   // must be a key in meta.logos
        "name": "Discover it® Student Cash Back",   // product / card name as it appears in posts
        "tags": ["Cash back", "Good grades", "Credit building"],   // llm, 2–4 short attributes
        "award": "Best Credit Cards for Students · US News, July 2024",   // optional, only if posts mention it
        "text": "…",                           // llm, 1–2 sentences
        "quote": { "text": "…", "source": "Reddit" }   // verbatim, optional
      }
    ]
  },

  // ===== TAB 2 · Popularity (deck p16) =============================================
  "popularity": {
    "banner": { "eyebrow": "Popularity", "headline": "…", "sub": "…",
                "stats": [ /* one per brand: { value: "65%", label: "Discover" } */ ] },
    "note": "…",                               // llm
    "lead": "… <mark>…</mark> …",              // llm, one sentence (rich)
    "brands": [                                // agg pct, desc; points llm (rich), 1–3 each
      { "name": "Discover", "pct": 65, "is_brand": true, "points": ["…", "…"] },
      { "name": "Capital One", "pct": 24, "points": ["…"] },
      { "name": "Chase", "pct": 16, "points": ["…"] },
      { "name": "Bank of America", "pct": 13, "points": ["…"] }
    ]
  },

  // ===== TAB 3 · Switchover Intent (deck p17) ======================================
  "switching": {
    "banner": { "eyebrow": "Switchover Intent", "headline": "…", "sub": "…",
                "stats": [ { "value": "42%", "label": "Switch for rewards" }, { "value": "21%", "label": "Student → regular" },
                           { "value": "5", "label": "Switch drivers" }, { "value": "16%", "label": "Carry multiple cards" } ] },
    "note": "…",                               // llm
    "reasons": [                               // 4–6, desc by pct; keys fixed where they apply; title/text llm
      { "key": "rewards",    "short": "Rewards and Benefits",     "title": "High Value on Rewards and Benefits",        "pct": 42, "text": "…" },
      { "key": "transition", "short": "Student to Regular Cards", "title": "Transitioning from Student to Regular Cards", "pct": 21, "text": "…" },
      { "key": "multiple",   "short": "Multiple Cards",           "title": "Multiple Cards for Security and Flexibility", "pct": 16, "text": "…" },
      { "key": "network",    "short": "Major Networks and Banks", "title": "Preference for Major Networks and Banks",     "pct": 16, "text": "…" },
      { "key": "history",    "short": "Long-Term Credit History", "title": "Building Long-Term Credit History",          "pct": 16, "text": "…" }
    ],                                         // pct = share of switching-intent posts citing the driver; may exceed 100 in total
    "posts": [                                 // ≤3 verbatim posts about switching; reply optional
      { "source": "Reddit · r/personalfinance", "title": "…", "text": "…", "reply": "…" }
    ]
  }
}
```

---

## 5. Computation recipe

### 5.1 Filter
Relevant articles only. "Brand-tagged" = `brand` or `competitors` names at least one
tracked issuer.

### 5.2 Popularity (tabs 1 and 2 share it)
1. For each tracked brand (project brand + competitors), count brand-tagged articles
   naming it. `pct` = count ÷ brand-tagged total × 100. Descending. Reuse the brand-mention
   counts already computed for `brand_competitive_intel`.
2. `brands[].points`: LLM writes 1–3 bullets per brand from that brand's articles, marking
   2–3 key phrases with `<mark>`.
3. `lead`, `summary`, `keywords`, banners: LLM from the brand bullets and counts.

### 5.3 Products (tab 1)
1. Extract product / card names from articles. If the tagger emits a product entity, use
   it. Otherwise LLM extraction per article, batch, cached, restricted to products of the
   tracked brands.
2. Take the top 4–6 by mention count. For each, LLM writes `tags`, `text`; pick one clean
   verbatim `quote`. Set `award` only if an award / ranking is mentioned in the product's
   articles (keywords: "best", "ranked", "award", "voted").

### 5.4 Switching (tab 3)
1. Select switching-intent articles: theme or content indicates switching, upgrading,
   product change, cancelling, or holding multiple cards.
2. Classify each into one of the five driver keys (LLM batch, cached). Allow "other" and
   drop it from the list. `pct` = count ÷ switching-intent total × 100.
3. LLM writes `title`, `short`, `text` per driver from its articles.
4. `posts`: pick up to 3 verbatim switching posts with a clear question or statement; if a
   top comment exists in the data, include it as `reply`.
5. `stats`: top driver share, transition share, driver count, multiple-card share.

### 5.5 Logos
Every brand string in `meta.brand`, `popularity[].name`, `brands[].name`,
`products[].brand` through `logos.py` into `meta.logos`.

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
- Headlines ≤ 10 words. Bullets and card texts 1–2 sentences. Summaries one sentence.
- Output strict JSON matching the schema you are given, nothing else.
```

Per section, pass the field schema, computed numbers, and 20–40 representative articles.
Validate JSON; retry once; then omit the prose field.

---

## 7. Done when

- `GET /consumer-intelligence/charts?session_id=<id>` includes `brand_perception` for a
  session whose workflow selected Brand Intelligence → Brand Perception.
- `tabs` has three entries; `popularity` and `brands` carry the same shares; `products` has
  4–6 cards each with a `brand` present in `meta.logos`; `reasons` has 4–6 drivers.
- Every brand in the payload has a `meta.logos` entry.
- No text copied from `bp-sample.js` or this document.
- Frontend: "Sample data" pill disappears; every brand shows its logo.

---

## 8. Paste-ready brief for the backend Claude Code session

```
Read docs/ci-lens-contract-brand-perception.md fully before doing anything.

Goal: add the `brand_perception` Consumer Intelligence lens to the CI charts job
that already builds brand_health_storyboard and brand_competitive_intel under the
Brand Intelligence pillar. Return it inside the same charts_data object from
/ws/consumer-intelligence/charts and GET /consumer-intelligence/charts, only when
the session's workflow selected Tier-1 brand_intelligence with Tier-2
"Brand Perception".

Follow the doc exactly:
  - Section 4 is the JSON shape; tab ids, fixed reason keys and field names must match.
  - Section 5 is the computation recipe; numbers from articles, LLM prose only.
  - Reuse the brand-mention counts already computed for brand_competitive_intel for
    popularity shares; do not recompute differently.
  - Every brand in popularity[], brands[], products[].brand and meta.brand needs a
    meta.logos entry via logos.py.

Before writing code, tell me:
  1. which module builds brand_competitive_intel and how this lens will sit beside it,
  2. whether the tagger already emits a product / card-name entity per article
     (section 5.3 depends on it),
  3. where the LLM prompts live and what you will add.
Then implement, add the same tests the existing lenses have, and show me one real
payload from a session with this lens selected.
```
