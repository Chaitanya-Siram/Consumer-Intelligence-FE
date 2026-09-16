# Builder Live Data + Widget-Kind Contract Fix — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire real session `chartsData` into `BuilderScreen`, fix the AI widget-kind contract so generated sections always render as real charts (not blank fallback cards), and refresh the canvas grid to "masonry v2" (staggered entrance, responsive stacking).

**Architecture:** `BuilderScreen` gains an optional `project`/`session`/`chartsData` prop path (fed by a new `BuilderRoute` in `App.jsx` that reuses the existing `useDashData()` hook other dashboard routes already use). `askAzureOpenAIBuilder` gets a corrected JSON contract (`dashboardKey` + a `WidgetKind`-restricted `widgetKinds` list) and a new `buildDetailFromCharts()` helper that maps real `chartsData` into a partial `DashboardDetail`, returned as `liveDetail` — a field `BuilderScreen` already has dead merge code waiting for. `DashboardCanvas` gets a visual pass: responsive single-column stacking on a narrow panel, and a staggered fade/slide-in per new section.

**Tech Stack:** React 18 (JSX/TSX mixed), Vite, Tailwind 3.4, `motion` (Framer Motion successor) for animation, no test framework configured.

## Global Constraints

- No `vitest`/`jest`/testing-library is configured in this repo (checked `package.json` — only `dev`/`build`/`preview` scripts exist). Do **not** add one as part of this plan (out of scope, YAGNI) — every task's verification step is manual: run `npm run dev` and check specific behavior in the browser, matching this project's existing convention (all current dashboard screens are manually verified).
- Widget kinds returned from the AI (real call or fallback) must only ever be values from the real `WidgetKind` enum in `src/components/builder/widget-registry.tsx`. Any other value must be dropped, never silently mapped to a different card.
- Don't touch the two session-less Builder entry routes' existing bare-mock behavior (`/build`, `/projects/:projectId/build`) — they must keep working exactly as today for users who reach Builder without a session.
- Don't introduce new npm dependencies (no container-query plugin, no chart libs) — implement responsive stacking with a `ResizeObserver`, already a browser-native API used nowhere else in this file but requiring no install.

---

### Task 1: Fix `widgetDef()` fallback + export the known-kinds allowlist

**Files:**
- Modify: `src/components/builder/widget-registry.tsx:41-108` (the `WIDGETS` array)

**Interfaces:**
- Produces: `export const KNOWN_WIDGET_KINDS: WidgetKind[]` — the full list of real, renderable widget kinds. Task 4 (fallback heuristic) and Task 5 (`BuilderScreen`) import this to validate/filter AI output.

Today `WIDGETS` (used by `widgetDef()` for card title/snippet lookup) is missing entries for `"table"` and `"image"`, even though `renderWidget()` (further down the same file) knows how to render both. Because `widgetDef()` falls back to `WIDGETS[0]` ("Cover KPIs") for any kind it can't find, a `"table"` or `"image"` widget currently shows the wrong title/snippet. Fix that and export the allowlist other tasks need.

- [ ] **Step 1: Add the two missing widget definitions**

In `src/components/builder/widget-registry.tsx`, add two entries to the `WIDGETS` array (after the `"articles"` entry, i.e. right before the closing `]` at line 108):

```ts
  {
    kind: "table",
    title: "Data Table",
    snippet: "Tabular breakdown of key metrics and status.",
    keywords: ["table", "data table", "spreadsheet", "grid view"],
  },
  {
    kind: "image",
    title: "Media Asset",
    snippet: "AI-generated or uploaded image/visual asset.",
    keywords: ["image", "photo", "picture", "visual", "graphic"],
  },
```

- [ ] **Step 2: Export the known-kinds allowlist**

Directly below the `WIDGETS` array's closing `]`, add:

```ts
/** Every real, renderable widget kind — used to validate AI-generated output. */
export const KNOWN_WIDGET_KINDS: WidgetKind[] = WIDGETS.map((w) => w.kind)
```

- [ ] **Step 3: Manual verification**

Run `npm run dev`, open the Builder screen (`/build`), and in the browser console run:

```js
import("/src/components/builder/widget-registry.tsx").then(m => console.log(m.KNOWN_WIDGET_KINDS))
```

Expected: an array containing `cover-kpi, executive-summary, gauge, competitor-heatmap, heatmap, line, themes, sentiment, original-syndicated, publications, articles, table, image` (12 entries, no duplicates).

- [ ] **Step 4: Commit**

```bash
git add src/components/builder/widget-registry.tsx
git commit -m "fix: add missing table/image widget defs, export known-kinds allowlist"
```

---

### Task 2: Wire real session data into BuilderScreen via a new route

**Files:**
- Modify: `src/App.jsx` (add a `BuilderRoute` function near `MeasurementRoute`/`PRImpactRoute`; change the `/:projectId/sessions/:sessionId/build` `<Route>` element)
- Modify: `src/screens/BuilderScreen.jsx:30-47` (accept optional data props)

**Interfaces:**
- Consumes: `useDashData()` (already defined in `App.jsx:764`) — returns `{ projectId, sessionId, project, session, chartsData, chartsLoading, chartsError }`.
- Produces: `BuilderScreen` now accepts props `{ project, session, chartsData, chartsLoading, chartsError }` (all optional — falls back to today's mock-only behavior when `project` prop is absent). Task 5 relies on `session`/`chartsData` being available inside `BuilderScreen`.

- [ ] **Step 1: Add `BuilderRoute` in `App.jsx`**

Find `function MeasurementRoute() {` in `src/App.jsx` and add a new function directly above it:

```jsx
function BuilderRoute() {
  const navigate = useNavigate();
  const { projectId, sessionId } = useParams();
  const { project, session, chartsData, chartsLoading, chartsError } =
    useDashData();
  return (
    <BuilderScreen
      project={project}
      session={session}
      chartsData={chartsData}
      chartsLoading={chartsLoading}
      chartsError={chartsError}
      onExit={() => navigate(`/${projectId}/sessions/${sessionId}/dashboards`)}
    />
  );
}
```

- [ ] **Step 2: Point the session-scoped Builder route at it**

Find this block in `src/App.jsx` (around line 1278):

```jsx
          <Route
            path="/:projectId/sessions/:sessionId/build"
            element={
              <ProtectedRoute>
                <BuilderScreen />
              </ProtectedRoute>
            }
          />
```

Change `<BuilderScreen />` to `<BuilderRoute />`. Leave the other two `/build` routes (`/build` and `/projects/:projectId/build`, a few lines above) untouched — they keep rendering bare `<BuilderScreen />`.

- [ ] **Step 3: Make `BuilderScreen` accept the new props with backward-compatible fallback**

In `src/screens/BuilderScreen.jsx`, replace the function signature and the `project`/`dashboards`/`detail` loading block (lines 30-47):

```jsx
export default function BuilderScreen({
  project: projectProp,
  session: sessionProp,
  chartsData: chartsDataProp,
  chartsLoading = false,
  chartsError = "",
  onExit,
} = {}) {
  const { projectId = "tesla", sessionId } = useParams();
  const navigate = useNavigate();

  const { data: mockProject } = useAsync(
    () => (projectProp ? Promise.resolve(null) : getProject(projectId)),
    [projectId, !!projectProp],
  );
  const project = projectProp || mockProject;
  const session = sessionProp || null;
  const chartsData = chartsDataProp || null;

  const { data: dashboards } = useAsync(
    () => getDashboards(projectId),
    [projectId],
  );
  const sampleId = dashboards?.find((d) => d.ready)?.id ?? "";
  const { data: detail } = useAsync(
    () =>
      sampleId
        ? getDashboardDetail(projectId, sampleId)
        : Promise.resolve(null),
    [projectId, sampleId],
  );
```

Then find the existing `onExit={() => navigate(`/projects/${projectId}`)}` prop passed to `<BuilderNav>` further down and change it to use the new `onExit` prop when provided:

```jsx
              <BuilderNav
                onExit={onExit || (() => navigate(`/projects/${projectId}`))}
                onExport={handleExportExcel}
                logo={project?.logo}
                monogram={project?.monogram}
              />
```

- [ ] **Step 4: Manual verification**

Run `npm run dev`. From an existing project's Dashboards screen, click "Build dashboards, charts and ask questions" (navigates to `/:projectId/sessions/:sessionId/build`). Open the browser console and confirm no errors. Add a temporary `console.log({ session, chartsData })` at the top of the `BuilderScreen` body, confirm `session` is a real object (has `id`, `brand_keywords`, etc.) and `chartsData` is either `null` (still loading) or a real object with keys like `pr_impact`/`media_measurement`. Remove the `console.log` before committing. Separately, visit `/build` directly (no session) and confirm it still loads with mock data as before (no crash, no blank screen).

- [ ] **Step 5: Commit**

```bash
git add src/App.jsx src/screens/BuilderScreen.jsx
git commit -m "feat: wire real session/chartsData into BuilderScreen via BuilderRoute"
```

---

### Task 3: `buildDetailFromCharts` — map real chartsData into a DashboardDetail

**Files:**
- Modify: `src/api/azureOpenai.js` (add new functions after `buildDashboardContext`, i.e. after line 463)

**Interfaces:**
- Consumes: `chartsData` shape as already used by `src/screens/PRImpactScreen.jsx:326-462` — `chartsData[dashboardKey]` is an array of `{ chart_id, title, description, data }` objects; confirmed `chart_id`s include `total_count` (`data.total_count: number`), `total_reach` (`data.total_reach: number`), `sentiment_distribution` (`data: { POS: {count}, NEG: {count}, NEU: {count}, net_sentiment_score }`), `pr_impact` (`data: { brand_name, gauge, rating_scale, data: [] }`). Other chart ids (themes, publications) vary by dashboard and are read defensively (see below).
- Produces: `export function buildDetailFromCharts(dashboardKey, chartsData, project, session, fallbackDetail)` → returns a partial `DashboardDetail`-shaped object (or `null` if there's no real data for that key at all). Task 4 calls this and attaches the result as `liveDetail` on the response; `BuilderScreen`'s existing merge (`res.liveDetail && activeDetail` → `setLiveDetail`) already consumes exactly this shape, unchanged.

- [ ] **Step 1: Add generic extraction helpers + `buildDetailFromCharts`**

In `src/api/azureOpenai.js`, add this block immediately after the `buildDashboardContext` function (after line 463):

```js
function num(v, fallback = 0) {
  return typeof v === "number" && !Number.isNaN(v) ? v : fallback;
}

/** Reads real chartsData's sentiment_distribution chart into a PieChartData-shaped object, or null. */
function extractSentimentDatum(byId) {
  const s = byId.sentiment_distribution?.data;
  if (!s) return null;
  const pos = num(s.POS?.count);
  const neg = num(s.NEG?.count);
  const neu = num(s.NEU?.count);
  const total = pos + neg + neu;
  if (!total) return null;
  return {
    centerLabel:
      s.net_sentiment_score != null
        ? `${s.net_sentiment_score}%`
        : `${Math.round((pos / total) * 100)}%`,
    data: [
      { label: "Positive", value: pos, color: "#22c55e" },
      { label: "Negative", value: neg, color: "#ef4444" },
      { label: "Neutral", value: neu, color: "#94a3b8" },
    ],
  };
}

/** Generic {label, value} extractor for ranked-list charts whose exact field names vary by dashboard. */
function extractRankedList(arr, labelKeys, valueKeys) {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((row) => {
      const label = labelKeys.map((k) => row?.[k]).find((v) => typeof v === "string");
      const value = valueKeys.map((k) => row?.[k]).find((v) => typeof v === "number");
      return label && typeof value === "number" ? { label, value } : null;
    })
    .filter(Boolean);
}

/**
 * Maps real session chartsData for one of the 5 known dashboards into a
 * partial DashboardDetail. Falls back to `fallbackDetail`'s fields for
 * anything the real data doesn't cover — never returns undefined fields.
 */
export function buildDetailFromCharts(dashboardKey, chartsData, project, session, fallbackDetail) {
  if (!dashboardKey || !chartsData || !Array.isArray(chartsData[dashboardKey])) {
    return null;
  }

  const byId = {};
  chartsData[dashboardKey].forEach((c) => {
    if (c?.chart_id) byId[c.chart_id] = c;
  });

  const totalCount = num(byId.total_count?.data?.total_count);
  const totalReach = num(byId.total_reach?.data?.total_reach);
  const sentimentDatum = extractSentimentDatum(byId);
  const prImpactData = byId.pr_impact?.data;
  const prImpactScore = num(prImpactData?.gauge, fallbackDetail?.prImpactScore ?? 0);

  const kpis = [];
  if (totalCount) {
    kpis.push({ id: "total-mentions", label: "Total Mentions", value: totalCount, format: "compact", delta: 0, direction: "flat" });
  }
  if (totalReach) {
    kpis.push({ id: "total-reach", label: "Estimated Reach", value: totalReach, format: "compact", delta: 0, direction: "flat" });
  }
  if (sentimentDatum) {
    const positive = sentimentDatum.data.find((d) => d.label === "Positive")?.value ?? 0;
    const total = sentimentDatum.data.reduce((s, d) => s + d.value, 0) || 1;
    kpis.push({
      id: "net-sentiment",
      label: "Net Sentiment",
      value: Math.round((positive / total) * 100),
      format: "percent",
      delta: 0,
      direction: "flat",
    });
  }

  const themeDistribution = extractRankedList(
    byId.theme_distribution?.data || byId.top_themes?.data,
    ["theme", "label", "name"],
    ["articles", "value", "count"],
  ).map((r) => ({ theme: r.label, articles: r.value }));

  const topPublications = extractRankedList(
    byId.top_publications?.data || byId.publications?.data,
    ["label", "publication", "source", "name"],
    ["value", "count", "articles"],
  );

  const brandKeywords = session?.brand_keywords || [];
  const executiveSummary =
    chartsData?.[`${dashboardKey}_overall_summary`] ||
    chartsData?.chart_insights?.[dashboardKey]?.insight ||
    fallbackDetail?.executiveSummary;

  return {
    ...(fallbackDetail || {}),
    summary: {
      ...(fallbackDetail?.summary || {}),
      name: brandKeywords[0] || project?.name || fallbackDetail?.summary?.name || "Brand",
    },
    kpis: kpis.length ? kpis : fallbackDetail?.kpis || [],
    sentiment: sentimentDatum || fallbackDetail?.sentiment,
    prImpactScore: prImpactScore || fallbackDetail?.prImpactScore || 0,
    themeDistribution: themeDistribution.length ? themeDistribution : fallbackDetail?.themeDistribution || [],
    topPublications: topPublications.length ? topPublications : fallbackDetail?.topPublications || [],
    executiveSummary,
  };
}
```

- [ ] **Step 2: Manual verification**

In the browser console on the Builder screen (`npm run dev`, real session), run:

```js
import("/src/api/azureOpenai.js").then(m => {
  // paste a real chartsData object from the earlier console.log, or window.__lastChartsData if you stash one
  console.log(m.buildDetailFromCharts("pr_impact", window.__chartsData, { name: "Test Co" }, { brand_keywords: ["Test Co"] }, { summary: { name: "Mock" }, kpis: [] }))
})
```

Expected: an object with a `kpis` array containing real `Total Mentions`/`Estimated Reach`/`Net Sentiment` entries when the session has `total_count`/`total_reach`/`sentiment_distribution` charts, and `summary.name` set to the brand keyword. If the session has no `pr_impact` data at all, calling with `dashboardKey="pr_impact"` on a session that only has `media_monitoring` data returns `null` (verify this branch by passing a `dashboardKey` not present in `chartsData`).

- [ ] **Step 3: Commit**

```bash
git add src/api/azureOpenai.js
git commit -m "feat: add buildDetailFromCharts to ground Builder widgets in real session data"
```

---

### Task 4: Rewrite `askAzureOpenAIBuilder`'s contract, system prompt, and fallback

**Files:**
- Modify: `src/api/azureOpenai.js:465-635` (`askAzureOpenAIBuilder`, `formatBuilderResponse`, `fallbackBuilderAI`)

**Interfaces:**
- Consumes: `KNOWN_WIDGET_KINDS` from Task 1 (`src/components/builder/widget-registry.tsx`); `buildDetailFromCharts` from Task 3 (same file, no import needed).
- Produces: `askAzureOpenAIBuilder({ promptText, files, currentWidgets, context, chartsData, session, project })` now returns `{ dashboardTitle, replyText, dashboardKey, widgetKinds, liveDetail, fileDownload }` where `widgetKinds` only ever contains values from `KNOWN_WIDGET_KINDS` and `dashboardKey` is one of `"media_monitoring" | "media_measurement" | "narrative_intelligence" | "pr_impact" | "reputation_index" | "custom" | null`. Task 5 (`BuilderScreen`) consumes this exact shape.

- [ ] **Step 1: Import the allowlist and add a validator**

At the top of `src/api/azureOpenai.js`, add:

```js
import { KNOWN_WIDGET_KINDS } from "../components/builder/widget-registry";

const DASHBOARD_KEYS = [
  "media_monitoring",
  "media_measurement",
  "narrative_intelligence",
  "pr_impact",
  "reputation_index",
];

/** Drops any widget kind the renderer doesn't actually know how to draw. */
function sanitizeWidgetKinds(kinds) {
  if (!Array.isArray(kinds)) return [];
  return kinds.filter((k) => KNOWN_WIDGET_KINDS.includes(k));
}

function sanitizeDashboardKey(key) {
  return DASHBOARD_KEYS.includes(key) ? key : key === "custom" ? "custom" : null;
}
```

- [ ] **Step 2: Rewrite the system prompt and request body in `askAzureOpenAIBuilder`**

Replace the `systemPrompt` template literal (lines 488-512) and the fetch call's `messages` (around line 529-533) with:

```js
  const groundingContext = buildDashboardContext({
    dashboardKey: null,
    chartsData,
    project,
    session,
  });

  const systemPrompt = `You are AlphaMetricx AI Dashboard Architect & Data Copilot — a conversational assistant embedded in a live dashboard-building chat.

FIRST PRIORITY — ALWAYS ANSWER THE USER:
Whatever the user asks — a question, a request to build something, a follow-up edit — "replyText" must be a direct, conversational answer to it. Never skip straight to widget-building without addressing what was actually asked.

SESSION CONTEXT (ground your answer and any dashboard you build in this real data — do not invent numbers that contradict it):
${groundingContext}

WHEN THE USER ASKS TO BUILD OR UPDATE A FULL DASHBOARD:
1. Pick the ONE dashboardKey that best matches the request from this exact list: "media_monitoring", "media_measurement", "narrative_intelligence", "pr_impact", "reputation_index". If the request doesn't fit any of the five (e.g. a bespoke one-off chart set), use "custom". Otherwise leave dashboardKey null (plain conversation, no dashboard change).
2. Choose widgetKinds ONLY from this exact list — never invent a kind that isn't here: "cover-kpi", "executive-summary", "gauge", "competitor-heatmap", "heatmap", "line", "themes", "sentiment", "original-syndicated", "publications", "articles", "table", "image".
3. Generate a clean, professional dashboardTitle (use the user's explicit title if they gave one).

FILE ANALYSIS & DOWNLOADS:
If files are attached or the user requests Excel/CSV export, create a fileDownload object with filename and CSV content.

OUTPUT FORMAT — return ONLY a JSON object matching this structure:
{
  "dashboardTitle": "Generated or Specified Dashboard Title",
  "replyText": "Conversational assistant reply — always present.",
  "dashboardKey": "media_monitoring" | "media_measurement" | "narrative_intelligence" | "pr_impact" | "reputation_index" | "custom" | null,
  "widgetKinds": ["cover-kpi", "line", "sentiment"],
  "fileDownload": { "name": "Report.csv", "content": "Metric,Value\\nTotal Mentions,12500\\n", "type": "text/csv" }
}`;
```

The request body's `messages` (the block that currently reads `{ role: "user", content: userContent }`) needs no change — `userContent` construction stays the same; only the `systemPrompt` variable above it changes. The call to `formatBuilderResponse(...)` inside the `if (endpoint && apiKey && !useProxy)` block is updated in Step 3 below, alongside the function signature change.

- [ ] **Step 3: Update `askAzureOpenAIBuilder`'s signature and both call sites**

Replace the function signature (line 471-476) with:

```js
export async function askAzureOpenAIBuilder({
  promptText = "",
  files = [],
  currentWidgets = [],
  context = {},
  chartsData = null,
  session = null,
  project = null,
  fallbackDetail = null,
}) {
```

And replace the two places that call `formatBuilderResponse` / `fallbackBuilderAI` at the end of the function:

```js
      if (res.ok) {
        const data = await res.json();
        const jsonText = data.choices?.[0]?.message?.content;
        if (jsonText) {
          const parsed = JSON.parse(jsonText);
          return formatBuilderResponse(parsed, chartsData, session, project, fallbackDetail);
        }
      }
    } catch (e) {
      console.warn("Azure OpenAI API call fallback triggered:", e);
    }
  }

  return fallbackBuilderAI(promptText, files, currentWidgets, chartsData, session, project, fallbackDetail);
}
```

- [ ] **Step 4: Rewrite `formatBuilderResponse`**

Replace the whole function (lines 554-566):

```js
function formatBuilderResponse(parsed, chartsData, session, project, fallbackDetail) {
  const dashboardKey = sanitizeDashboardKey(parsed.dashboardKey);
  const widgetKinds = sanitizeWidgetKinds(parsed.widgetKinds);
  return {
    dashboardTitle: parsed.dashboardTitle || "",
    replyText: parsed.replyText || "Dashboard updated.",
    dashboardKey,
    widgetKinds,
    liveDetail: buildDetailFromCharts(dashboardKey, chartsData, project, session, fallbackDetail),
    fileDownload: parsed.fileDownload || null,
  };
}
```

- [ ] **Step 5: Rewrite `fallbackBuilderAI`'s widget-kind lists and return value**

In `fallbackBuilderAI` (lines 568-635), the `widgetKinds` assignments currently use invented strings. Replace the whole `widgetKinds` block (the `if (hasFiles) { ... } else if ... }` chain, lines 593-608) with real kinds only, and add `dashboardKey` detection:

```js
  let dashboardKey = null;
  if (p.includes("pr impact") || p.includes("impact")) dashboardKey = "pr_impact";
  else if (p.includes("media") || p.includes("monitoring")) dashboardKey = "media_monitoring";
  else if (p.includes("measurement")) dashboardKey = "media_measurement";
  else if (p.includes("narrative") || p.includes("signal")) dashboardKey = "narrative_intelligence";
  else if (p.includes("reputation")) dashboardKey = "reputation_index";

  let widgetKinds = [];
  if (hasFiles) {
    widgetKinds = ["cover-kpi", "line", "sentiment", "themes", "gauge", "executive-summary"];
  } else if (dashboardKey === "pr_impact") {
    widgetKinds = ["cover-kpi", "gauge", "sentiment", "competitor-heatmap", "themes", "publications", "articles"];
  } else if (dashboardKey) {
    widgetKinds = ["cover-kpi", "line", "sentiment", "themes", "publications", "articles"];
  } else if (p.includes("line")) {
    widgetKinds = sanitizeWidgetKinds([...currentWidgets.map((w) => w.kind), "line"]);
  } else if (p.includes("sentiment") || p.includes("donut") || p.includes("pie")) {
    widgetKinds = sanitizeWidgetKinds([...currentWidgets.map((w) => w.kind), "sentiment"]);
  } else if (p.includes("bar") || p.includes("theme")) {
    widgetKinds = sanitizeWidgetKinds([...currentWidgets.map((w) => w.kind), "themes"]);
  } else if (currentWidgets.length === 0) {
    widgetKinds = ["cover-kpi", "line", "sentiment", "executive-summary"];
  } else {
    widgetKinds = sanitizeWidgetKinds(currentWidgets.map((w) => w.kind));
  }
```

Then update the function's signature (line 568) to `function fallbackBuilderAI(promptText, files, currentWidgets, chartsData, session, project, fallbackDetail)`, and its final `return` (lines 629-635) to:

```js
  return {
    dashboardTitle,
    replyText,
    dashboardKey,
    widgetKinds,
    liveDetail: buildDetailFromCharts(dashboardKey, chartsData, project, session, fallbackDetail),
    fileDownload,
  };
```

- [ ] **Step 6: Manual verification**

Run `npm run dev`, open Builder from a real session. In the chat, send a plain question with no build intent (e.g. "what does share of voice mean?") — confirm `replyText` answers it and no `dashboardKey`/new widgets appear (this exercises the fallback path if no Azure OpenAI key is configured, or the real path if one is). Then send "build a PR impact dashboard for the current brand" — confirm the response's widget kinds are all from the known list (check Network tab or a temporary `console.log(res)` in `BuilderScreen.handleSend` — remove before committing) and none render as a mislabeled "Cover KPIs" placeholder.

- [ ] **Step 7: Commit**

```bash
git add src/api/azureOpenai.js
git commit -m "fix: restrict askAzureOpenAIBuilder to real widget kinds, ground replies in real chartsData"
```

---

### Task 5: BuilderScreen — pass real data into the AI call and validate its output

**Files:**
- Modify: `src/screens/BuilderScreen.jsx` (imports, `handleSend`)

**Interfaces:**
- Consumes: `KNOWN_WIDGET_KINDS` (Task 1), `askAzureOpenAIBuilder`'s new signature (Task 4).
- Produces: nothing new consumed by later tasks — this is the wiring endpoint.

- [ ] **Step 1: Import the allowlist**

In `src/screens/BuilderScreen.jsx`, add `KNOWN_WIDGET_KINDS` to the existing `widget-registry` import (the multi-line `import { matchWidget, matchDashboard, WIDGETS, ... } from "../components/builder/widget-registry";` block):

```jsx
  KNOWN_WIDGET_KINDS,
```

(add it as one more named import alongside `WIDGETS`, `widgetDef`, etc.)

- [ ] **Step 2: Pass real data into the API call and filter its output**

In `handleSend`, replace the `askAzureOpenAIBuilder` call and the `widgetKinds` handling:

```jsx
      const res = await askAzureOpenAIBuilder({
        promptText,
        files,
        currentWidgets: widgets,
        context: { projectId, projectName: project?.name, sessionId },
        chartsData,
        session,
        project,
        fallbackDetail: activeDetail,
      });

      if (res.dashboardTitle) {
        setDashboardTitle(res.dashboardTitle);
      }

      if (res.liveDetail && activeDetail) {
        setLiveDetail({
          ...activeDetail,
          ...res.liveDetail,
          summary: {
            ...activeDetail?.summary,
            ...res.liveDetail?.summary,
          },
        });
      }

      const safeWidgetKinds = (res.widgetKinds || []).filter((k) =>
        KNOWN_WIDGET_KINDS.includes(k),
      );
      if (safeWidgetKinds.length > 0) {
        setWidgets(
          safeWidgetKinds.map((kind) => ({
            id: `w${++widgetSeq}`,
            kind,
            span: kind === "cover-kpi" || kind === "executive-summary" || kind === "table" ? 1 : 0.5,
          })),
        );
      }
```

(This keeps the existing `res.liveDetail`/`setLiveDetail` block exactly as it already was — it was previously dead code because nothing ever set `res.liveDetail`; Task 4 is what makes it live. The only functional change here is passing `chartsData`/`session`/`project`/`fallbackDetail` into the call, and filtering `widgetKinds` through `KNOWN_WIDGET_KINDS` as a defense-in-depth check in addition to the server-side sanitizing from Task 4.)

- [ ] **Step 3: Manual verification**

Run `npm run dev`, open Builder from a real session with actual `pr_impact` chart data. Ask "build a PR impact dashboard for the current brand". Confirm: the hero KPI card shows numbers matching what's on the real PR Impact dashboard screen for that same session (not the `$4.2M`/`34%`/`53%` mock figures from the original bug report), and every rendered card shows an actual chart (not a blank "Cover KPIs" placeholder with plain text).

- [ ] **Step 4: Commit**

```bash
git add src/screens/BuilderScreen.jsx
git commit -m "feat: pass real session data into askAzureOpenAIBuilder and validate its widget kinds"
```

---

### Task 6: DashboardCanvas — masonry v2 visual refresh

**Files:**
- Modify: `src/components/builder/dashboard-canvas.tsx`

**Interfaces:**
- Consumes: nothing new from earlier tasks.
- Produces: nothing consumed by later tasks — this is the final, purely visual task.

- [ ] **Step 1: Add a `ResizeObserver`-driven narrow-panel state**

In `src/components/builder/dashboard-canvas.tsx`, add `useEffect` to the existing `useRef, useState` import line, and add this inside `DashboardCanvas`, right after the existing `const [dragId, setDragId] = useState<string | null>(null);` line:

```tsx
  const [narrow, setNarrow] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      setNarrow(width < 640);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
```

- [ ] **Step 2: Attach the ref and force full width when narrow**

Find the main grid container (`<div className="t7-content flex flex-wrap items-stretch gap-[12px]" data-dashboard-template="sense">` at line 121) and add `ref={containerRef}`:

```tsx
    <div ref={containerRef} className="t7-content flex flex-wrap items-stretch gap-[12px]" data-dashboard-template="sense">
```

Find the `half` calculation inside the `.map((w) => {` block (line 124: `const half = w.span === 0.5;`) and change it to respect `narrow`:

```tsx
        const half = w.span === 0.5 && !narrow;
```

(The `style={{ width: half ? "calc(50% - 6px)" : "100%" }}` a few lines below already reads `half`, so this alone makes every card stack to full width once the panel drops under 640px — no further change needed there.)

- [ ] **Step 3: Stagger the entrance animation**

Find the `motion.section` block (starting `<motion.section key={w.id} layout ...>` around line 154) and add an index-based stagger. First, change `{widgets.map((w) => {` to `{widgets.map((w, index) => {` (line 122), then add `initial`/`animate`/`transition` delay to the `motion.section`:

```tsx
          <motion.section
            key={w.id}
            layout
            data-card
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0, scale: dragging ? 0.97 : 1 }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 40,
              delay: Math.min(index * 0.05, 0.3),
            }}
```

(This replaces the existing `transition={{ type: "spring", stiffness: 500, damping: 40 }}` and `animate={{ scale: dragging ? 0.97 : 1, opacity: dragging ? 0.5 : 1 }}` props on the same element — merge the `opacity`/`scale` logic so dragging still fades the card: use `animate={{ opacity: dragging ? 0.5 : 1, y: 0, scale: dragging ? 0.97 : 1 }}` instead of the two-key version above.)

- [ ] **Step 4: Manual verification**

Run `npm run dev`, open Builder, ask the chat to add several sections. Confirm each new card fades/slides in with a slight stagger rather than popping in instantly. Then drag the chat/canvas resize handle so the canvas panel narrows below ~640px — confirm half-width cards stack to a single column instead of squeezing side by side, and widen it back out — confirm they return to two-up.

- [ ] **Step 5: Commit**

```bash
git add src/components/builder/dashboard-canvas.tsx
git commit -m "style: masonry v2 — staggered entrance and responsive single-column stacking"
```

---

## Self-Review Notes (for the implementer)

- Every task's manual-verification step names the exact prompt/action to try and the exact expected result — none are "test the above" placeholders.
- `dashboardKey`/`widgetKinds` naming is identical across Tasks 3, 4, and 5 (`buildDetailFromCharts(dashboardKey, chartsData, project, session, fallbackDetail)` signature is defined once in Task 3 and called with the same argument order in Task 4's two call sites).
- Task 2's `BuilderScreen` prop names (`project`, `session`, `chartsData`, `chartsLoading`, `chartsError`) match exactly what `BuilderRoute` passes and what Task 5 reads (`chartsData`, `session`, `project` used directly in `handleSend`).
- Out of scope, confirmed deferred to sub-project 2 per the design spec: image/video/docs/Excel generation logic, and the `fileDownload` field beyond its already-existing CSV shape.
