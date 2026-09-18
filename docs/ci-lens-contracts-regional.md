# Regional Intelligence lenses: backend contract

Self-contained spec for the three Consumer Intelligence (CI) Tier-2 lenses under the
Regional Intelligence pillar: `regional_sentiment`, `regional_engagement`,
`regional_brand_perception`. Same conventions as the other CI lens contracts; shared rules
repeated so this file works alone.

The frontend screens are built. Each reads its key from `chartsData` and renders a
built-in sample with a "Sample data" pill until the backend returns it. Every screen is
"Overview + one tab per market", so all three payloads share one `regions[]` shape with
lens-specific fields.

---

## 1. Where they plug in

Dashboard generation starts from the Review screen ("Create Dashboard"). The frontend
opens WebSocket `/ws/consumer-intelligence/charts` and expects the final message to carry
`charts_data`, keyed by lens. On reload it fetches
`GET /consumer-intelligence/charts?session_id=<id>`.

**When to build.** Only when the workflow has an analysis node with
`data.lensType === "tier1"`, `data.lens === "regional_intelligence"`, and `data.tier2[]`
includes the matching label. Build only the selected Tier-2 lenses.

| Tier-2 label | `charts_data` key | Frontend screen |
|---|---|---|
| `"State-Level Sentiment"` | `regional_sentiment` | `src/screens/RegionalSentimentScreen.jsx` |
| `"Engagement"` | `regional_engagement` | `src/screens/RegionalEngagementScreen.jsx` |
| `"Brand Perception"` | `regional_brand_perception` | `src/screens/RegionalBrandPerceptionScreen.jsx` |

Samples: `src/dashboards/storyboard/ri-sample.js` (one base record per market, sliced three
ways). Mapping: `src/api/consumerIntelligence.js` (`TIER1_TO_CI_KEYS.regional_intelligence`).

---

## 2. Inputs

Tagged articles (`id, title, content, url, date, section, brand, sentiment, theme,
competitors, author, priority, people, countries, organizations, …`), project brand and
competitor list.

**This pillar depends on a market per article.** Use, in order: the `countries` tag; a
region field if the tagger emits one; the source URL's ccTLD or known regional domains
(e.g. `.co.uk`, `.de`, `.com.au`, `naver.com`); author location if available. Articles with
no market are excluded from every region but still count in `meta.total_mentions`. Markets
with fewer than ~30 articles are dropped.

**Half-year periods** for Engagement come from `date`. If the session window is shorter than
a year, use two equal halves of the window and label them accordingly (`periods`).

---

## 3. Rules

- **Numbers from tags, prose from the LLM.** Every `pct` is computed. `headline`, `summary`,
  `insights`, `topics[].text` are LLM-written from that market's articles.
- **`meta.logos` is required** for `meta.brand` and every brand in any `brands[]`,
  `others[]` or `topics[].brand`. Resolve via `logos.py`.
- **Percentages** integers 0–100. `sentiment` pos+neu+neg = 100. `brands[].pct` sums to 100
  including `Others`. `themes[].pct` and `types_*[].pct` may exceed 100 in total (a post
  can carry several tags); each is share of that market's posts.
- **`regions[]` ordering**: by `mentions` desc. `key` is a stable slug; `flag` an emoji (may
  be omitted). Same `regions[]` set across all three lenses for one session.
- **Empty is fine, fabricated is not.** Omit `sentiment`, `themes`, `types_h1` etc. when not
  computable for a market; the frontend hides the block.
- **`<mark>` highlights** allowed in *rich* prose; no other markup.
- **`meta.is_sample`** absent or `false`.

---

## 4. Payloads

Common region record fields (all three lenses):

```jsonc
{ "key": "usa", "name": "USA", "flag": "🇺🇸", "mentions": 6840,   // agg
  "headline": "…",                                               // llm ≤ 12 words
  "summary": "…" }                                               // llm, 2–4 sentences (the slide's top paragraph)
```

### 4.1 `regional_sentiment`

```jsonc
{
  "meta": { "brand": "Armor All", "category": "Car Auto Appearance", "window": "Jan – Dec 2025", "total_mentions": 21560, "logos": { … } },
  "footer": ["State-Level Sentiment · Regional Intelligence", "Computed from 21,560 tagged posts"],
  "note": "…",                                   // llm, one sentence
  "regions": [
    { …common,
      "insights": ["… (rich)", "…", "…"],        // llm, 2–4 bullets (the slide's KEY INSIGHTS)
      "sentiment": { "pos": 58, "neu": 31, "neg": 11 },   // agg, sums to 100
      "themes": [                                // agg, top 3 discussion themes, desc; sub = top sub-topic inside the theme (llm)
        { "name": "Product Efficacy", "sub": "Functionality", "pct": 74 },
        { "name": "Final Finish",     "sub": "Premium",       "pct": 37 },
        { "name": "Convenience",      "sub": "Effortlessness","pct": 22 }
      ]
    }
  ]
}
```

### 4.2 `regional_engagement`

```jsonc
{
  "meta": { … }, "footer": [ … ], "note": "…",
  "periods": ["Jan – Jun 2025", "Jul – Dec 2025"],   // agg, labels for types_h1 / types_h2
  "regions": [
    { …common,
      "insights": ["…"],                         // llm, 2–4 bullets, at least one about the H1→H2 shift
      "types_h1": [ { "name": "Multi Purpose Products", "pct": 42 }, … ],   // agg, top 5–6 product types in period 1, desc, optional "Others"
      "types_h2": [ { "name": "Interior and Upholstery", "pct": 44 }, … ],  // agg, same for period 2
      "topics": [                                // llm, 2–4: what the conversation says about each leading brand
        { "brand": "Turtle Wax", "text": "… (rich)" }
      ]
    }
  ]
}
```

The frontend computes the shift chips (▲ ▼ new) from `types_h1` vs `types_h2` by name;
keep product-type names consistent between the two lists.

### 4.3 `regional_brand_perception`

```jsonc
{
  "meta": { … }, "footer": [ … ], "note": "…",
  "regions": [
    { …common,
      "brands": [                                // agg, share of brand-tagged posts, desc, sums to 100 incl. Others; project brand flagged
        { "name": "Turtle Wax", "pct": 27 }, { "name": "Meguiar's", "pct": 15 }, { "name": "Armor All", "pct": 9, "is_brand": true }, { "name": "Others", "pct": 32 }
      ],
      "others": ["Carex", "Car Guys", "MTX Lexol", "NuFinish"],   // agg, brands folded into Others, ≤ 8
      "topics": [ { "brand": "Turtle Wax", "text": "… (rich)" } ]  // llm, 2–4 leading brands; include the project brand if it has ≥ 3% share
    }
  ]
}
```

---

## 5. Computation recipe

### 5.1 Market assignment
Per §2. Build the market list once per session and reuse it for all three lenses.

### 5.2 Per market, shared
- `mentions` = article count in the market.
- `summary`, `headline`: LLM from a 30–40 article sample plus that market's computed
  numbers (sentiment, top themes, top brands, H1→H2 shift).

### 5.3 `regional_sentiment`
1. `sentiment`: normalised `sentiment` over rated articles in the market.
2. `themes`: count discussion themes (from `theme`, mapped to the category's theme set,
   e.g. Product Efficacy / Final Finish / Convenience / Price / Fragrance / Product Enquiry /
   Recommendations). Top 3, `pct` = share of market posts carrying the theme. `sub` = LLM
   names the most common sub-topic inside each theme from its posts.
3. `insights`: LLM, 2–4 bullets grounded in the numbers above.

### 5.4 `regional_engagement`
1. Split the market's articles by `date` into the two periods.
2. Product type per article: tagger entity if present, else LLM classification into the
   category's product-type list (Interior & Upholstery Cleaner, Multi Purpose, Ceramic/SiO2,
   Detailing Accessories, Quick Detailers, Wheel/Tire Cleaner, Waterless Wash, Car Polish,
   Car Wax, Foam Cleaners, Bundles & Kits, …). Cache per article.
3. `types_h1`, `types_h2`: top 5–6 by share in each period, tail into `Others` if ≥ 3%.
4. `topics`: for the 2–4 most-mentioned brands, LLM summarises what posts say about each.
5. `insights`: LLM, must include one bullet describing the largest H1→H2 movement.

### 5.5 `regional_brand_perception`
1. `brands`: count brand-tagged articles per tracked brand in the market (reuse
   `brand_competitive_intel` logic). Top 5–8 plus `Others`; list folded names in `others`.
2. `topics`: same as 5.4 step 4 (can be shared).
3. Flag the project brand `is_brand: true` wherever it appears.

### 5.6 Logos
Every brand string in `meta.brand`, `brands[].name`, `others[]`, `topics[].brand` →
`logos.py` → `meta.logos`.

---

## 6. LLM prompt guidance

```
You write short, factual dashboard copy for a consumer-intelligence report about
<category> and the brand <brand>, for the market <market>. You are given aggregated
numbers and a sample of the underlying social posts from that market only. Rules:
- Never state a number that is not in the numbers you were given.
- Describe only what the sample posts support. If the sample is thin, say less.
- British spelling, present tense, no marketing tone, no exclamation marks.
- Where asked for "rich" text, wrap 2–4 key phrases in <mark>…</mark>. No other HTML.
- Headlines ≤ 12 words. Bullets 1–2 sentences. Summaries 2–4 sentences.
- Output strict JSON matching the schema you are given, nothing else.
```

---

## 7. Done when

- `GET /consumer-intelligence/charts?session_id=<id>` includes each selected key for a
  session whose workflow selected Regional Intelligence with that Tier-2.
- All three payloads carry the same `regions[]` set (same keys, same order).
- Every `sentiment` sums to 100; every `brands[]` sums to 100 including Others.
- Every brand named anywhere has a `meta.logos` entry.
- No text copied from `ri-sample.js` or this document.
- Frontend: "Sample data" pills disappear; brand donuts and topics show logos.

---

## 8. Paste-ready brief for the backend Claude Code session

```
Read docs/ci-lens-contracts-regional.md fully before doing anything.

Goal: add three Consumer Intelligence lenses under Tier-1 regional_intelligence to the
CI charts job beside the existing lenses:
  - regional_sentiment          (Tier-2 "State-Level Sentiment")
  - regional_engagement         (Tier-2 "Engagement")
  - regional_brand_perception   (Tier-2 "Brand Perception")
Return each inside the same charts_data object from /ws/consumer-intelligence/charts
and GET /consumer-intelligence/charts, only when the session's workflow selected that
Tier-2 label.

Follow the doc exactly:
  - Section 2: everything hinges on assigning a market per article. Tell me what the
    tagger gives us today (countries tag? region? URL ccTLD?) and how you will fill gaps.
  - Section 4 gives the JSON shapes; the three payloads must share one regions[] set.
  - Section 5 is the recipe; numbers from articles, LLM prose only. Product-type
    classification per article is needed for regional_engagement.
  - Reuse brand-mention and sentiment logic from brand_competitive_intel.
  - Every brand in any payload needs a meta.logos entry via logos.py.

Before writing code, tell me:
  1. how market per article will be derived and the expected coverage,
  2. whether a product-type entity exists per article or needs LLM classification,
  3. which module builds brand_competitive_intel and how these three sit beside it.
Then implement, add the same tests the existing lenses have, and show me one real
payload per lens from a session with all three selected.
```
