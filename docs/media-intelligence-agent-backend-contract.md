# Media Intelligence Agent — Backend Proxy Contract

## Why this exists

The "Media Intelligence Agent" screen (`src/screens/MediaIntelligenceAgentScreen.jsx`) reimplements
the AlphaMetricx n8n workflow ("Azure GPT-4.1 Media Intelligence V3 - SerpAPI + HTML Report") as an
in-app agent. Every LLM step (planning, per-article analysis, executive synthesis) is called directly
from the frontend via Azure OpenAI, the same way `src/api/azureOpenai.js` already does.

Two steps in the original n8n flow **cannot** be done safely from a browser:

1. **Google News search via SerpAPI** — requires a secret API key server-side.
2. **Fetching raw article HTML** from arbitrary news domains — blocked by CORS in almost every case.

Both need a thin backend proxy. This doc is the exact contract the frontend expects. Until these
routes exist, the screen runs in **Demo mode** (seeded sample articles, see `demoData.js`) so the rest
of the pipeline (real Azure OpenAI calls) can be exercised end-to-end today.

No new credentials are needed: the app already has a data-provider-key system
(`src/api/dataProviders.js`, `getActiveProviderKeys()`) that stores a SerpAPI / Google News key per
organization. The backend should read the key from there — the frontend never sends or sees it.

---

## 1. `POST /media-intelligence/search`

Proxies **one** SerpAPI Google News query. The frontend calls this once per generated query (up to
12 queries per run) and merges the results client-side — mirrors the n8n `SerpAPI — Google News` node,
which also runs once per input query item.

**Request body:**
```json
{
  "query": "\"Tesla\" \"innovation\" when:30d",
  "gl": "us",
  "hl": "en"
}
```

**Behavior:** look up the org's active SerpAPI credential (`getActiveProviderKeys`), call
`https://serpapi.com/search.json?engine=google_news&q=<query>&gl=<gl>&hl=<hl>&api_key=<stored key>`,
and pass the response through.

**Response body (passthrough of SerpAPI's `news_results`):**
```json
{
  "news_results": [
    {
      "title": "Article Title",
      "link": "https://example.com/article",
      "source": { "name": "Example News", "icon": "https://example.com/favicon.ico" },
      "date": "2 hours ago",
      "iso_date": "2026-09-01T10:30:00Z",
      "snippet": "Article snippet text...",
      "position": 1
    }
  ]
}
```

If the org has no SerpAPI credential configured, return `503` with
`{ "detail": "No SerpAPI credential configured for this organization." }` — the frontend surfaces this
as a clear "connect a data provider" message rather than a generic error.

---

## 2. `POST /media-intelligence/fetch-article`

Fetches the raw HTML of one article URL server-side (bypasses browser CORS). The frontend does the
same text-extraction the n8n `Extract Article Text` code node did (look for `<article>`, Yahoo Finance
fallback, strip boilerplate, cap at 12,000 chars) — so the backend does **not** need to parse anything,
just return the HTML.

**Request body:**
```json
{ "url": "https://example.com/article" }
```

**Response body:**
```json
{ "html": "<html>...raw article HTML...</html>", "status": 200 }
```

On fetch failure (timeout, 404, blocked, etc.) return `200` with `{ "html": "", "status": <code or 0> }`
rather than erroring the whole request — the frontend already treats empty content as
"analyze from title/snippet only", exactly like the n8n flow's evidence-insufficiency branch.

---

## Frontend fallback behavior

`src/api/mediaIntelligenceAgent.js` calls both routes. If either 404s (route not deployed yet) or the
network call fails, the pipeline surfaces a banner: *"Live search isn't connected yet — showing a demo
run. Ask your backend team to add the two routes in `docs/media-intelligence-agent-backend-contract.md`."*
and continues using `demoData.js` so the screen is still fully usable for review and QA.
