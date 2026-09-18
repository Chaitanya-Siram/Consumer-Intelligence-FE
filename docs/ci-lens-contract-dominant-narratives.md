# Dominant Narratives lens: backend contract

Self-contained spec for the `dominant_narratives` Consumer Intelligence (CI) lens under
the Landscape Analysis pillar. Same conventions as `ci-lens-contract-perception-analysis.md`;
the shared rules are repeated here so this file works alone.

The frontend screen is built. It reads `chartsData.dominant_narratives` and, until that key
exists, renders a built-in sample with a "Sample data" pill.

---

## 1. Where it plugs in

Dashboard generation starts from the Review screen ("Create Dashboard"). The frontend
opens WebSocket `/ws/consumer-intelligence/charts` and expects the final message to carry
`charts_data`, an object keyed by lens. On reload it fetches
`GET /consumer-intelligence/charts?session_id=<id>`.

`dominant_narratives` is one more key in `charts_data`.

**When to build it.** Only when the session's workflow has an analysis node with
`data.lensType === "tier1"`, `data.lens === "landscape_analysis"`, and `data.tier2[]`
includes `"Dominant Narratives"`.

| Tier-1 key | Tier-2 label | `charts_data` key |
|---|---|---|
| `landscape_analysis` | `"Dominant Narratives"` | `dominant_narratives` |

Frontend files, reference only: `src/screens/DominantNarrativesScreen.jsx`,
`src/dashboards/storyboard/dn-sample.js` (same shape as section 4),
`src/api/consumerIntelligence.js` (`TIER1_TO_CI_KEYS.landscape_analysis`).

---

## 2. Inputs

Tagged articles (`id, title, content, url, date, section, brand, sentiment, theme,
competitors, author, priority, people, countries, organizations, syndication, …`), plus the
project brand and competitor list already used by `brand_competitive_intel`.

**Optional secondary-research input.** Deck page 19 quotes external surveys (US News,
"42.1% have debt"). Those facts do not exist in tagged posts. Two options:

- Omit them. Every bullet then comes from posts.
- Accept a per-project list of research facts (text + source URL) as an extra input and
  emit them with `"ext": true`. The frontend shows an "external" tag on those bullets.

Pick one; do not invent statistics.

---

## 3. Rules

- **Numbers from tags, prose from the LLM.** Every `pct` is computed. Every headline,
  summary, bullet and card text is LLM-written from the articles behind that section.
- **`meta.logos` is required.** Brand name to logo URL via `logos.py`, for the project
  brand and every brand named in `issuers[]` or anywhere else in the payload. The
  frontend also merges logos from other lenses in the same session, so a brand resolved
  for `brand_competitive_intel` shows here too, but each lens should still ship its own.
- **Percentages** are integers 0–100. `platforms[].pct` and `issuers[].pct` each sum to
  100 (issuers may include `"Others"` to absorb the tail).
- **Empty is fine, fabricated is not.** Omit or return `[]` for anything not computable.
- **`<mark>` highlights** allowed in prose fields marked *rich*, nothing else.
- **`ext: true`** on a bullet marks secondary research. Never set it on post-derived text.
- **Fixed keys**: `callouts[].key` in {`volume`, `award`}; `goods[].key` in
  {`rewards`, `fee`, `benefit`, `award`}. They drive icons. Titles are free text.
- **`tabs`** verbatim; `meta.is_sample` absent or `false`.

---

## 4. Payload

```jsonc
{
  "meta": {
    "brand": "Discover",                         // agg
    "category": "Gen-Z Student Credit Cards",    // llm or project name
    "window": "Jan – Jun 2024",                  // agg
    "total_mentions": 5240,                      // agg
    "logos": { "Discover": "https://…", "Chase": "https://…", "Capital One": "https://…", "Bank of America": "https://…" }
  },
  "tabs": [
    { "id": "t1", "label": "Usage & Engagement" },
    { "id": "t2", "label": "Landscape Observations" },
    { "id": "t3", "label": "Current Landscape" },
    { "id": "t4", "label": "Audience Outlook" }
  ],
  "footer": ["Dominant Narratives · Landscape Analysis", "Computed from 5,240 tagged posts"],

  // ===== TAB 1 · Usage & Engagement (deck p19) ======================================
  "usage": {
    "banner": { "eyebrow": "Category Landscape", "headline": "…", "sub": "…",    // llm
                "stats": [ { "value": "3", "label": "Narrative groups" }, { "value": "5,240", "label": "Posts analysed" },
                           { "value": "Essentials", "label": "Top use case" }, { "value": "42%", "label": "Mention credit history" } ] },  // agg
    "note": "…",                                 // llm
    "summary": "…",                              // llm, one paragraph
    "keywords": ["college essentials", "…"],     // llm, 4–6 phrases
    "groups": [                                  // exactly 3, fixed titles; bullets llm (rich)
      { "title": "Usage patterns",   "points": [ { "text": "… <mark>…</mark> …" }, { "text": "…", "ext": true } ] },
      { "title": "Usage engagement", "points": [ { "text": "…" } ] },
      { "title": "Card perception",  "points": [ { "text": "…" } ] }
    ]
  },

  // ===== TAB 2 · Landscape Observations (deck p20) ==================================
  "observations": {
    "banner": { "eyebrow": "Landscape Observations", "headline": "…", "sub": "…",
                "stats": [ { "value": "5", "label": "Questions" }, { "value": "4", "label": "Insight columns" }, { "value": "1", "label": "Recommendation set" } ] },
    "note": "…",                                 // llm
    "columns": [                                 // exactly 5, this order; the 5th has reco: true
      { "q": "Why do students need credit cards?",                                     "points": ["… (rich)", "…"] },
      { "q": "What is their general perception and emotion around student credit cards?", "points": ["…"] },
      { "q": "What motivates students to choose more than one credit card?",           "points": ["…"] },
      { "q": "How do students decide which card to use, from the basket they possess?", "points": ["…"] },
      { "q": "Recommendations on how to engage with students to use credit cards", "reco": true, "points": ["…", "…"] }
    ]                                            // q: llm may re-word for the category; keep the five intents
  },

  // ===== TAB 3 · Current Landscape (deck p21) =======================================
  "landscape": {
    "banner": { "eyebrow": "Current Landscape", "headline": "…", "sub": "…",
                "stats": [ { "value": "58%", "label": "Share on X" }, { "value": "38%", "label": "Top issuer share" },
                           { "value": "5", "label": "Issuers tracked" }, { "value": "#1", "label": "Rank among issuers" } ] },  // agg
    "sec_title": "Where the conversation lives, and who leads it",   // llm, optional
    "note": "…",                                 // llm
    "platforms": [ { "name": "X", "pct": 58 }, { "name": "Tumblr", "pct": 20 }, { "name": "Forums", "pct": 17 }, { "name": "Blogs", "pct": 4 }, { "name": "Review", "pct": 1 } ],  // agg, desc, sums to 100
    "issuers": [                                 // agg, desc, sums to 100; project brand flagged
      { "name": "Discover", "pct": 38, "is_brand": true }, { "name": "Chase", "pct": 24 }, { "name": "Capital One", "pct": 14 },
      { "name": "Bank of America", "pct": 10 }, { "name": "Others", "pct": 14 }
    ],
    "callouts": [                                // 2 cards; text llm
      { "key": "volume", "title": "Discover it® Student Cash Back", "text": "Highest social media volume among tracked cards." },
      { "key": "award",  "title": "Ranked among the best",          "text": "…" }     // omit if no award/recognition found in posts
    ],
    "goods_title": "Discover credit cards · what is going good?",   // llm
    "goods_lead": "…",                           // llm, one sentence
    "goods": [                                   // 3–5 cards; text llm from positive posts about the brand
      { "key": "rewards", "title": "…", "text": "…" },
      { "key": "fee",     "title": "…", "text": "…" },
      { "key": "benefit", "title": "…", "text": "…" },
      { "key": "award",   "title": "…", "text": "…" }
    ]
  },

  // ===== TAB 4 · Audience Outlook (deck p22) ========================================
  "outlook": {
    "banner": { "eyebrow": "Audience Outlook", "headline": "…", "sub": "…",
                "stats": [ { "value": "9", "label": "Outlook themes" }, { "value": "Digital", "label": "Default behaviour" },
                           { "value": "Price", "label": "Beats brand" }, { "value": "30%", "label": "Feel financially insecure" } ] },
    "sec_title": "Gen Z financial outlook",      // llm
    "note": "…",                                 // llm
    "themes": [                                  // 6–9 cards, desc by pct; pct agg, title/text llm; key = slug
      { "key": "digital", "title": "Digital-as-default behavior", "pct": 16, "text": "…" }
    ]
  }
}
```

---

## 5. Computation recipe

### 5.1 Filter
Relevant articles only (same relevancy threshold as other lenses). "Rated" = has a sentiment.

### 5.2 Tab 1: usage narratives
1. Bucket articles into the three fixed groups by intent: how the product is used
   (`Usage patterns`), how often / for what spend (`Usage engagement`), how it is regarded
   (`Card perception`). LLM batch classification, cached per article, or keyword rules on
   `theme`.
2. LLM writes 2–3 bullets per group from that group's articles, marking key phrases with
   `<mark>`. Append secondary-research bullets with `ext: true` only if that input exists.
3. LLM writes `summary`, `keywords`, `headline`, `sub`, `note` from the three groups.
4. `stats[3]` = share of relevant articles mentioning credit history / score (keyword).

### 5.3 Tab 2: five questions
1. For each of the five intents, select articles by LLM classification (which question
   does this post answer, if any). Cache per article.
2. LLM writes 1–2 bullets per question from its articles. The recommendations column is
   LLM synthesis over the other four; mark `reco: true`.

### 5.4 Tab 3: current landscape
1. `platforms`: count articles by normalised source / platform (from `url` host or a
   source field). Top 5, tail folded into the smallest, desc, sums to 100.
2. `issuers`: count articles naming each brand (project brand + competitors, from `brand`
   and `competitors`). Top 4 plus `"Others"`, desc, sums to 100. `is_brand: true` on the
   project brand.
3. `callouts`: `volume` = the top issuer's flagship product named most in posts; `award` =
   only if posts mention an award / ranking (keyword: "best", "ranked", "award").
4. `goods`: LLM extracts 3–5 positive attributes of the project brand from its positive
   articles, mapped to the fixed keys.
5. `stats`: top platform share, top issuer share, issuer count, brand's rank.

### 5.5 Tab 4: audience outlook
1. LLM clusters relevant articles into 6–9 recurring money-attitude themes (open coding,
   then merge to ≤ 9). Cache theme per article.
2. `pct` = share of outlook-tagged articles per theme, desc.
3. LLM writes `title`, `text` per theme; `key` = slug of the title.
4. `stats`: theme count, plus three LLM-picked headline facts that appear in the numbers.

### 5.6 Logos
Every brand string in `meta.brand` and `issuers[].name` (except `Others`) through
`logos.py` into `meta.logos`.

---

## 6. LLM prompt guidance

Same system prompt as the Perception Analysis lens:

```
You write short, factual dashboard copy for a consumer-intelligence report about
<category> and the brand <brand>. You are given aggregated numbers and a sample of
the underlying social posts. Rules:
- Never state a number that is not in the numbers you were given.
- Describe only what the sample posts support. If the sample is thin, say less.
- British spelling, present tense, no marketing tone, no exclamation marks.
- Where asked for "rich" text, wrap 2–4 key phrases in <mark>…</mark>. No other HTML.
- Headlines ≤ 10 words. Bullets 1–2 sentences. Summaries one paragraph.
- Output strict JSON matching the schema you are given, nothing else.
```

Per section, pass the field schema, the computed numbers, and 20–40 representative
articles. Validate JSON; retry once; then omit the prose field.

---

## 7. Done when

- `GET /consumer-intelligence/charts?session_id=<id>` includes `dominant_narratives` for a
  session whose workflow selected Landscape Analysis → Dominant Narratives.
- `tabs` has four entries; `usage.groups` has three; `observations.columns` has five with
  the fifth `reco: true`; `platforms` and `issuers` sum to 100.
- Every brand in `issuers[]` (except Others) and `meta.brand` has a `meta.logos` entry.
- No bullet carries `ext: true` unless a secondary-research input exists.
- No text copied from `dn-sample.js` or this document.
- Frontend: "Sample data" pill disappears; issuer bars show logos.

---

## 8. Paste-ready brief for the backend Claude Code session

```
Read docs/ci-lens-contract-dominant-narratives.md fully before doing anything.

Goal: add the `dominant_narratives` Consumer Intelligence lens to the CI charts job
that already builds brand_health_storyboard, brand_competitive_intel and
perception_analysis. Return it inside the same charts_data object from
/ws/consumer-intelligence/charts and GET /consumer-intelligence/charts, only when
the session's workflow selected Tier-1 landscape_analysis with Tier-2
"Dominant Narratives".

Follow the doc exactly:
  - Section 4 is the JSON shape; fixed keys, tab ids and group/column counts must match.
  - Section 5 is the computation recipe; numbers from articles, LLM prose only.
  - Section 2: decide whether a secondary-research input exists. If not, never emit
    ext: true and never invent survey statistics.
  - Every brand in issuers[] and meta.brand needs a meta.logos entry via logos.py.
  - Reuse the platform and brand-mention counts already computed for
    brand_competitive_intel rather than recomputing.

Before writing code, tell me:
  1. which module builds brand_competitive_intel and perception_analysis, and how this
     lens will sit beside them,
  2. how platform/source is derived per article today,
  3. whether you will add a secondary-research input or omit ext bullets.
Then implement, add the same tests the existing lenses have, and show me one real
payload from a session with this lens selected.
```
