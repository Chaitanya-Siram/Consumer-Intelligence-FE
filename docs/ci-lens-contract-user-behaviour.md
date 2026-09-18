# User Behaviour Analysis lens: backend contract

Self-contained spec for the `user_behaviour` Consumer Intelligence (CI) lens, the first
Tier-2 lens under the new **Consumer Segmentation Analysis** Tier-1 pillar. Same
conventions as the other CI lens contracts; shared rules repeated so this file works alone.

The frontend screen is built. It reads `chartsData.user_behaviour` and renders a built-in
sample with a "Sample data" pill until the backend returns it.

---

## 1. Where it plugs in

Dashboard generation starts from the Review screen ("Create Dashboard"). The frontend
opens WebSocket `/ws/consumer-intelligence/charts` and expects the final message to carry
`charts_data`, keyed by lens. On reload it fetches
`GET /consumer-intelligence/charts?session_id=<id>`.

**New Tier-1 key.** The workflow's analysis node now offers "Consumer Segmentation
Analysis" with `data.lens === "consumer_segmentation"` and `data.lensType === "tier1"`. The
backend must accept this key wherever it validates or switches on Tier-1 lens keys.

**When to build.** Only when the workflow has an analysis node with
`data.lens === "consumer_segmentation"` and `data.tier2[]` includes
`"User Behaviour Analysis"`.

| Tier-1 key | Tier-2 label | `charts_data` key | Frontend |
|---|---|---|---|
| `consumer_segmentation` | `"User Behaviour Analysis"` | `user_behaviour` | `src/screens/UserBehaviourScreen.jsx` |

Sample with the exact shape: `src/dashboards/storyboard/ub-sample.js`. Mapping:
`src/api/consumerIntelligence.js` (`TIER1_TO_CI_KEYS.consumer_segmentation`).

---

## 2. Inputs

Tagged articles (`id, title, content, url, date, section, brand, sentiment, theme,
competitors, author, priority, people, organizations, …`), project brand and competitor
list. This lens additionally wants, per article, an **audience age band** or life-stage if
the tagger can infer it from content (see §5.2). If it cannot, segment shares are omitted
and the segment cards render without a share bar.

---

## 3. Rules

- **Numbers from tags, prose from the LLM.** Every `pct` is computed. Headlines, segment
  bullets and answers are LLM-written from the articles behind that section.
- **`meta.logos` is required** for `meta.brand` and every brand in `brand_choice[]`
  (except `Others`). Resolve via `logos.py`.
- **Percentages** are integers 0–100. `segments.groups[].pct` sums to 100 when present.
  `brand_choice[].pct` need not sum to 100 (a post can name several issuers) but should be
  normalised so the top row is the largest.
- **Empty is fine, fabricated is not.** Omit `pct` or a whole array when not computable.
- **`<mark>` highlights** allowed in *rich* prose; no other markup.
- **`tabs`** verbatim. `meta.is_sample` absent or `false`.

---

## 4. Payload

```jsonc
{
  "meta": {
    "brand": "Discover",                          // agg
    "category": "Gen-Z Student Credit Cards",     // llm or project name
    "window": "Jan – Jun 2024",                   // agg
    "total_mentions": 4410,                       // agg
    "logos": { "Discover": "https://…", "Chase": "https://…", "Capital One": "https://…", "Bank of America": "https://…" }
  },
  "tabs": [ { "id": "t1", "label": "Audience Segments" }, { "id": "t2", "label": "Multiple-Card Behaviour" } ],
  "footer": ["User Behaviour Analysis · Consumer Segmentation Analysis", "Computed from 4,410 tagged posts"],

  // ===== TAB 1 · Audience Segments (deck p33) =========================================
  "segments": {
    "banner": { "eyebrow": "Decision making process & selection cycle", "headline": "…", "sub": "…",   // llm
                "stats": [ { "value": "3", "label": "Sub-segments" }, { "value": "18–21", "label": "Largest segment" },
                           { "value": "46%", "label": "Share of posts · 18–21" }, { "value": "4,410", "label": "Posts analysed" } ] },  // agg
    "note": "…",                                  // llm
    "lead": "… (rich)",                           // llm, one sentence
    "groups": [                                   // 3–4 segments, ordered by age; pct agg (omit if not inferable); points llm (rich), 2–3
      { "key": "teens",         "range": "13–17", "title": "Teens · College Students and Recent Graduates", "pct": 21, "points": ["…", "…"] },
      { "key": "young_adults",  "range": "18–21", "title": "Young Adults",        "pct": 46, "points": ["…", "…", "…"] },
      { "key": "professionals", "range": "22–24", "title": "Young Professionals", "pct": 33, "points": ["…", "…"] }
    ]
  },

  // ===== TAB 2 · Multiple-Card Behaviour (deck p34) ===================================
  "multi": {
    "banner": { "eyebrow": "Multiple-card behaviour", "headline": "…", "sub": "…",
                "stats": [ { "value": "38%", "label": "Discover · brand choice" }, { "value": "5", "label": "Issuers tracked" },
                           { "value": "3", "label": "Reasons to carry more" }, { "value": "4", "label": "Ways they choose" } ] },
    "note": "…",
    "brand_choice": [                             // agg, desc, project brand flagged; Others absorbs the tail
      { "name": "Discover", "pct": 38, "is_brand": true }, { "name": "Chase", "pct": 24 }, { "name": "Capital One", "pct": 14 },
      { "name": "Bank of America", "pct": 10 }, { "name": "Others", "pct": 14 }
    ],
    "questions": [                                // exactly 2, fixed intents; q may be reworded for the category; points llm (rich), 2–4 each
      { "q": "Why do Gen-Zs carry multiple credit cards?",         "points": ["…", "…", "…"] },
      { "q": "How do they choose between the cards they have?",    "points": ["…", "…", "…", "…"] }
    ]
  }
}
```

---

## 5. Computation recipe

### 5.1 Filter
Relevant articles only. "Multiple-card posts" = content indicates holding, adding,
switching between, or choosing among more than one card / product (keywords: "second
card", "multiple cards", "which card", "backup card", "switch", "product change", plus LLM
confirmation on ambiguous posts).

### 5.2 Segments (tab 1)
1. Infer an age band / life stage per article: from explicit self-description ("I'm a
   freshman", "just graduated", "22 and working"), author metadata if present, or LLM
   inference with a confidence gate. Bands are category-specific; the deck uses 13–17,
   18–21, 22–24. For another category the LLM proposes 3–4 bands from the corpus.
2. `pct` = share of articles with an inferred band, sums to 100. If fewer than ~20% of
   articles get a band, omit `pct` on every group and set `note` to say shares are not
   available.
3. LLM writes 2–3 bullets per segment from that segment's articles (behaviour, tech use,
   life stage, financial focus). `title` and `range` from the band definition.
4. LLM writes `lead`, banner, `note`.

### 5.3 Multiple-card behaviour (tab 2)
1. `brand_choice`: within multiple-card posts, count posts naming each tracked issuer;
   normalise; top 4 plus `Others`. Reuse the brand-mention logic from
   `brand_competitive_intel`.
2. `questions[0]` (why): LLM extracts 2–4 distinct reasons from multiple-card posts, each
   one bullet grounded in ≥ 3 posts.
3. `questions[1]` (how they choose): LLM extracts 2–4 decision rules the same way.
4. `stats`: top brand share, issuer count, bullet counts.

### 5.4 Logos
Every brand in `meta.brand` and `brand_choice[].name` (except `Others`) → `logos.py` →
`meta.logos`.

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

---

## 7. Done when

- The backend accepts `consumer_segmentation` as a Tier-1 lens key.
- `GET /consumer-intelligence/charts?session_id=<id>` includes `user_behaviour` for a
  session whose workflow selected Consumer Segmentation Analysis → User Behaviour Analysis.
- `segments.groups` has 3–4 entries (shares sum to 100 or are all absent);
  `multi.brand_choice` is present with the project brand flagged; `multi.questions` has 2.
- Every brand in the payload has a `meta.logos` entry.
- No text copied from `ub-sample.js` or this document.
- Frontend: "Sample data" pill disappears; brand choice bars show logos.

---

## 8. Paste-ready brief for the backend Claude Code session

```
Read docs/ci-lens-contract-user-behaviour.md fully before doing anything.

Goal: (1) accept a new Tier-1 lens key `consumer_segmentation` wherever the backend
validates or switches on Tier-1 keys, and (2) add the `user_behaviour` Consumer
Intelligence lens to the CI charts job beside the existing lenses. Return it inside
the same charts_data object from /ws/consumer-intelligence/charts and
GET /consumer-intelligence/charts, only when the session's workflow selected Tier-1
consumer_segmentation with Tier-2 "User Behaviour Analysis".

Follow the doc exactly:
  - Section 4 is the JSON shape; tab ids and the two fixed question intents must match.
  - Section 5 is the recipe; numbers from articles, LLM prose only. Section 5.2 needs
    an age-band inference per article — tell me whether the tagger can provide one, or
    whether you will infer it with the LLM and a confidence gate, or omit shares.
  - Reuse brand-mention counts from brand_competitive_intel for brand_choice.
  - Every brand in brand_choice[] and meta.brand needs a meta.logos entry via logos.py.

Before writing code, tell me:
  1. where Tier-1 keys are validated today and what adding consumer_segmentation touches,
  2. how you will infer age band / life stage per article,
  3. which module builds brand_competitive_intel and how this lens sits beside it.
Then implement, add the same tests the existing lenses have, and show me one real
payload from a session with this lens selected.
```
