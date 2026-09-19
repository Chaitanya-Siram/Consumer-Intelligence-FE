# Congruence & Content Intelligence lens: backend contract

Self-contained spec for the `congruence_content` Consumer Intelligence (CI) lens, the first
Tier-2 lens under the new **AI/LLM Audit and Analysis** Tier-1 pillar (`llm_audit`).

**This lens is different from every other CI lens.** Its primary input is not the session's
tagged articles. It is the set of answers that several LLM assistants give to a fixed prompt
set about the brand and category, plus the sources those answers cite. Tagged articles are
the "social validation" cross-check, and the project's positioning statement is the brand
intent. The backend therefore needs a new job (an LLM audit run) in addition to the CI charts
aggregation. The frontend screen is built and renders a sample until the key arrives.

---

## 1. Where it plugs in

Dashboard generation starts from the Review screen ("Create Dashboard"). The frontend opens
WebSocket `/ws/consumer-intelligence/charts` and expects `charts_data`, keyed by lens. On
reload it fetches `GET /consumer-intelligence/charts?session_id=<id>`.

**New Tier-1 key.** The workflow's analysis node now offers "AI/LLM Audit and Analysis" with
`data.lens === "llm_audit"`, `data.lensType === "tier1"`. Accept this key wherever Tier-1 keys
are validated.

**When to build.** Only when the workflow has an analysis node with `data.lens === "llm_audit"`
and `data.tier2[]` includes `"Congruence & Content Intelligence"`.

| Tier-1 key | Tier-2 label | `charts_data` key | Frontend |
|---|---|---|---|
| `llm_audit` | `"Congruence & Content Intelligence"` | `congruence_content` | `src/screens/CongruenceContentScreen.jsx` |

Sample with the exact shape: `src/dashboards/storyboard/cc-sample.js`.

---

## 2. Inputs

1. **LLM audit run** (new). A fixed prompt set (≈ 8–12 prompt templates × brand/category
   variants, ≈ 40–60 prompts) executed against each configured assistant (ChatGPT, Gemini,
   Copilot, Claude, Perplexity, Meta AI, or whichever the project configures). Store per
   response: `llm`, `prompt_id`, `text`, `citations[]` (URL, title, outlet, author when
   present), `run_at`.
2. **Brand intent**: the project's positioning statement and narrative pillars (a short list
   of 3–6 claims the brand wants repeated). If the project has none, the LLM proposes pillars
   from the brand's own site and the user confirms them in the workflow node.
3. **Tagged articles** (existing): used to validate that themes LLMs surface also appear in
   real conversation, and to enrich source/journalist records (outlet, reach).
4. Project brand, competitors, category.

---

## 3. Rules

- **Numbers from data, prose from the LLM.** Every count, share, score and heat-map cell is
  computed from the audit responses. Headlines, notes, pillar narratives, flags and actions
  are LLM-written from those responses and citations, never invented.
- **`meta.logos` is required** for `meta.brand` and every source outlet in
  `analysis.sources[]` where a logo can be resolved (`logos.py` by domain). Missing entries
  fall back to initials.
- **`meta.llms`** is the ordered list of assistants; every `matrix.llms` and `heatmap.llms`
  must equal it. Use these display names: ChatGPT, Gemini, Copilot, Claude, Perplexity,
  Meta AI.
- **Sentiment** pos+neg+neu = 100. **Alignment / heat-map values** 0–100. **Matrix values**
  net sentiment −100..+100.
- **Empty is fine, fabricated is not.** Omit a block when not computable.
- **`<mark>` highlights** allowed in *rich* prose; no other markup. `tabs` verbatim.
- **`meta.is_sample`** absent or `false`.

---

## 4. Payload

```jsonc
{
  "meta": {
    "brand": "Glow Labs", "category": "Beauty & Skincare", "window": "Jul – Sep 2026",   // agg
    "llms": ["ChatGPT", "Gemini", "Copilot", "Claude", "Perplexity", "Meta AI"],           // config
    "prompts_run": 48, "responses": 288, "sources_cited": 412,                             // agg
    "logos": { "Glow Labs": "https://…", "Allure": "https://…", "Byrdie": "https://…" }
  },
  "tabs": [ { "id": "t1", "label": "Overview" }, { "id": "t2", "label": "LLM Analysis" },
            { "id": "t3", "label": "LLM Interpretation" }, { "id": "t4", "label": "Narrative Scan" } ],
  "footer": ["Congruence & Content Intelligence · AI/LLM Audit and Analysis", "48 prompts × 6 LLMs, run 12 Sep 2026"],

  // ===== TAB 1 · Overview (deck p2–p6) — mostly static framework copy =================
  "overview": {
    "banner": { "eyebrow": "Congruence & Content Intelligence", "headline": "…", "sub": "…",   // llm (headline may be the deck's line)
                "stats": [ { "value": "6", "label": "LLMs analysed" }, { "value": "48", "label": "Prompts run" },
                           { "value": "288", "label": "Responses" }, { "value": "412", "label": "Sources cited" } ] },  // agg
    "note": "…",
    "stages": [ /* return verbatim from cc-sample.js: the three framework stages with questions / method / deliverables */ ],
    "inputs": ["Sources & Reports", "Category & Cultural Context", "Brand KPIs", "LLM Prompts"],
    "datasets": ["LLM sources (…)", "Social validation (tagged posts)", "Secondary research"],
    "outcomes": [ /* verbatim from sample: LLM Signals / LLM Interpretation / Narrative Intelligence / Strategic Outcomes */ ]
  },

  // ===== TAB 2 · LLM Analysis (deck p5 col 1, p8 list chart) ==========================
  "analysis": {
    "banner": { "eyebrow": "LLM Analysis · who shapes the narrative", "headline": "…", "sub": "…",
                "stats": [ { "value": "412", "label": "Sources cited" }, { "value": "37%", "label": "Top 5 sources' share" },
                           { "value": "Allure", "label": "Most-cited outlet" }, { "value": "9", "label": "Named journalists" } ] },
    "note": "…",
    "source_types": [ { "name": "Trade & beauty press", "pct": 38 }, … ],       // agg, share of citations by source class, sums to 100
    "sources": [                                                                // agg, top 8–12 by citations, desc
      { "name": "Allure", "type": "Trade press", "mentions": 61, "reach": "9.2M", "llms": ["ChatGPT", "Gemini"] }   // llms = which assistants cited it
    ],
    "journalists": [                                                            // agg, top 6–10 named authors in citations
      { "name": "Jessica Cruel", "outlet": "Allure", "mentions": 23, "beat": "…" }   // beat: llm, 3–6 words
    ],
    "concentration": "…"                                                        // llm, 1–2 sentences on where influence concentrates and per-LLM source preferences
  },

  // ===== TAB 3 · LLM Interpretation (deck p5 col 2, p8 pie + bubbles) =================
  "interpretation": {
    "banner": { … "stats": [ pos%, neg%, neu%, narrative strength ] },
    "note": "…",
    "sentiment": { "pos": 56, "neg": 27, "neu": 17 },                            // agg, per response, sums to 100
    "sentiment_note": "…",                                                      // llm, what drives pos and neg
    "themes": [ { "name": "Ingredient efficacy", "count": 186, "sub": ["Niacinamide", "Barrier repair"] } ],   // agg count of responses; sub llm, ≤ 3
    "matrix": { "llms": [ …meta.llms ], "rows": [ { "theme": "Ingredient efficacy", "values": [72, 68, 61, 75, 70, 58] } ], "legend": "…" },  // agg, net sentiment per LLM within theme
    "language": ["science-backed", "gentle", "premium", …],                    // agg, top 6–10 descriptors by frequency
    "scores": [                                                                 // agg, 0–100, definitions fixed
      { "name": "Narrative strength", "value": 72, "text": "…" },                 // share of responses reproducing the single most common brand story
      { "name": "Consistency across LLMs", "value": 64, "text": "…" },            // 100 − mean pairwise theme-distribution distance between LLMs
      { "name": "Positioning alignment", "value": 58, "text": "…" }               // mean of scan.pillars[].align
    ]
  },

  // ===== TAB 4 · Narrative Scan (deck p5 col 3) ========================================
  "scan": {
    "banner": { … "stats": [ pillars, aligned, diluted, contradicted ] },
    "note": "…",
    "pillars": [                                                                // one per brand-intent pillar (3–6)
      { "name": "Science-led efficacy", "intent": "…", "llm": "…", "align": 82, "status": "aligned" }
      // intent: from brand positioning; llm: LLM-written summary of how responses describe it; align: agg share of responses reproducing the pillar
      // status: aligned ≥ 60, diluted 30–59, contradicted < 30 or when responses assert the opposite
    ],
    "heatmap": { "llms": [ …meta.llms ], "rows": [ { "pillar": "Science-led efficacy", "values": [88, 80, 74, 90, 84, 76] } ], "legend": "…" },  // agg, per LLM
    "flags": [ { "tone": "risk", "title": "…", "text": "…" }, { "tone": "opportunity", "title": "…", "text": "…" } ],   // llm, 2–4, grounded in pillars/sources
    "actions": ["…", "…", "…"]                                                  // llm, 3 recommendations naming the outlets/journalists from tab 2
  }
}
```

---

## 5. Computation recipe

### 5.1 Audit run
1. Prompt templates (brand-only, brand-vs-competitor, category-recommendation, "what is X
   known for", "criticisms of X", "who writes about X", …) × configured assistants.
2. Capture full text and citations. Normalise citation URLs to outlet (domain) and author
   (byline if the page exposes one; else from the response text when it names a journalist).
3. Persist the run; the dashboard is a view over the latest run for the session.

### 5.2 Analysis (tab 2)
- `sources`: count citations per outlet across all responses; a source cited by several LLMs
  for one prompt counts once per LLM. `llms` = distinct assistants that cited it. `reach` from
  a static outlet-reach table or omitted. `type` from a domain classifier (trade press, Reddit,
  retailer, expert blog, video transcript, news wire, brand site).
- `source_types`: citation share by `type`.
- `journalists`: count by normalised author name; `outlet` = most common outlet for that
  author; `beat` LLM from their cited headlines.
- `concentration`: LLM from the top-5 share and per-assistant source-type mix.

### 5.3 Interpretation (tab 3)
- Sentiment per response (LLM classifier or the existing tagger). Themes per response via LLM
  classification into an open-coded list merged to ≤ 8; `sub` = top qualifiers.
- `matrix`: for each theme × LLM, net sentiment over that LLM's responses touching the theme.
- `language`: most frequent descriptive adjectives/phrases applied to the brand.
- `scores` per the definitions in §4.

### 5.4 Scan (tab 4)
- For each pillar, ask the LLM per response: does this response reproduce the pillar, ignore
  it, or contradict it? `align` = reproduce share. `heatmap` = same per assistant. `status` by
  thresholds in §4 (contradicted also when contradict share ≥ 25%).
- `llm` narrative per pillar, `flags`, `actions`: LLM synthesis over the pillar results and the
  ranked sources, so actions can name real outlets and journalists.

### 5.5 Social validation
For each theme in tab 3, compute its share in the session's tagged articles too. If a theme
is prominent in LLMs but absent in real conversation (or vice versa), add a `flag`. Optional
field `themes[].social_pct` may be included; the frontend ignores unknown fields.

### 5.6 Logos
`meta.brand` and every `sources[].name` → `logos.py` (by domain) → `meta.logos`.

---

## 6. LLM prompt guidance (for the prose fields, not the audit prompts)

```
You write short, factual dashboard copy for an AI-visibility audit of the brand <brand>
in <category>. You are given aggregated numbers from <n> responses across <llms> and
samples of those responses with their citations. Rules:
- Never state a number that is not in the numbers you were given.
- Attribute claims to assistants or outlets only when the data shows it.
- British spelling, present tense, no marketing tone, no exclamation marks.
- Where asked for "rich" text, wrap 2–4 key phrases in <mark>…</mark>. No other HTML.
- Headlines ≤ 12 words. Bullets and flag texts 1–2 sentences.
- Output strict JSON matching the schema you are given, nothing else.
```

---

## 7. Done when

- The backend accepts `llm_audit` as a Tier-1 lens key and runs the audit when the Tier-2 is
  selected.
- `GET /consumer-intelligence/charts?session_id=<id>` includes `congruence_content`.
- `matrix.llms` and `heatmap.llms` equal `meta.llms`; `sentiment` sums to 100; every pillar
  has `align` and `status`.
- Every outlet in `sources[]` with a resolvable domain has a `meta.logos` entry.
- No text copied from `cc-sample.js` or this document except the static `overview.stages`
  and `overview.outcomes` framework copy.
- Frontend: "Sample data" pill disappears.

---

## 8. Paste-ready brief for the backend Claude Code session

```
Read docs/ci-lens-contract-congruence-content.md fully before doing anything.

Goal: (1) accept a new Tier-1 lens key `llm_audit` wherever Tier-1 keys are validated,
(2) add an LLM audit run: a fixed prompt set executed across the configured assistants
(ChatGPT, Gemini, Copilot, Claude, Perplexity, Meta AI) with responses and citations
persisted per session, and (3) add the `congruence_content` lens to the CI charts job,
computed from that run plus the project's positioning pillars and, for validation, the
session's tagged articles. Return it inside charts_data from
/ws/consumer-intelligence/charts and GET /consumer-intelligence/charts, only when the
workflow selected llm_audit → "Congruence & Content Intelligence".

Follow the doc exactly:
  - Section 2 lists the three inputs; the audit run is new infrastructure. Tell me which
    assistants we have API access to today and how you will handle ones we do not.
  - Section 4 is the JSON shape; meta.llms must drive matrix.llms and heatmap.llms.
  - Section 5 is the recipe, including the score definitions and pillar status thresholds.
  - Section 5.5 social validation uses the existing tagged articles.
  - Every cited outlet needs a meta.logos entry via logos.py by domain.

Before writing code, tell me:
  1. where Tier-1 keys are validated and what adding llm_audit touches,
  2. which LLM APIs are available and the proposed prompt template set,
  3. where brand positioning pillars will come from (project field? workflow node?),
  4. how the audit run is stored and triggered (on Create Dashboard, or scheduled).
Then implement, add tests, and show me one real payload from a session with this lens
selected.
```
