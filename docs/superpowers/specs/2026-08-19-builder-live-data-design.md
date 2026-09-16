# BuilderScreen: live data + AI dashboard generation (sub-project 1 of 3)

## Context

`BuilderScreen` is meant to be a chat-driven dashboard builder: the user describes what they want in the chat panel, `askAzureOpenAIBuilder` (src/api/azureOpenai.js) interprets it, and the right-hand `DashboardCanvas` renders the resulting sections. Today it's a disconnected mock playground:

- `BuilderScreen` never fetches a session's real `chartsData` — it only loads `getProject`/`getDashboards`/`getDashboardDetail`, all static mock data from `src/data/mock.ts`.
- `askAzureOpenAIBuilder`'s fallback heuristic (used whenever the real Azure OpenAI call isn't configured or fails) returns widget-kind strings (`"bars"`, `"pr-impact-score"`, `"competitor-bars"`, `"share-of-voice"`) that don't exist in the real `WidgetKind` enum (`src/components/builder/widget-registry.tsx`). `widgetDef()` silently falls back to `WIDGETS[0]` ("Cover KPIs") for any unmatched kind, so unmatched sections render as blank placeholder cards with the wrong title/snippet and no chart — this is the "dummy data" bug seen in testing.
- Even when a real Azure OpenAI call succeeds, there is no session-grounded data for it to draw numbers from — the model can only invent plausible-sounding figures.

This is the first of three planned sub-projects (agreed via brainstorming): (1) live data wiring + generation contract fix, (2) multi-format file generation/downloads, (3) further polish. Out of scope here: image/video/docs/Excel generation logic (sub-project 2).

## Goals

1. Builder is entered from a real session (confirmed: user always has a session before reaching Builder, via the "Build" action on `DashboardsScreen`), so `sessionId` in the URL is always a real backend session id.
2. The right-hand canvas renders real numbers from that session's `chartsData`, not static mock data.
3. The AI's widget-kind output always matches the real `WidgetKind` enum — no more silent fallback-to-wrong-card.
4. Conversational prompts (anything not a build/edit request) get a direct textual answer, unaffected by the above.
5. Visual refresh of the canvas grid ("masonry v2" — approved direction, see below).

## Design

### 1. Real data wiring

Add a `BuilderRoute` wrapper in `App.jsx` for the `/:projectId/sessions/:sessionId/build` path, mirroring `MeasurementRoute`/`PRImpactRoute`: call `useDashData()` (existing hook — resolves `project`/`session`/`chartsData` from `useCharts(sessionId, state?.chartsData)`), and pass `project`, `session`, `chartsData`, `chartsLoading`, `chartsError` into `BuilderScreen` as props. The two session-less routes (`/build`, `/projects/:projectId/build`) keep rendering bare `<BuilderScreen/>` for the mock/demo fallback (no session → keep current mock behavior, don't break that entry point).

### 2. Contract fix: real widget kinds + a `dashboardKey`

Rewrite the JSON contract `askAzureOpenAIBuilder` requests from the model (and the fallback's output) to:

```json
{
  "dashboardTitle": "string",
  "replyText": "string, always present — the conversational answer",
  "dashboardKey": "media_monitoring | media_measurement | narrative_intelligence | pr_impact | reputation_index | custom",
  "widgetKinds": ["cover-kpi", "line", "sentiment", "themes", "publications", "articles", "gauge", "competitor-heatmap", "heatmap", "original-syndicated", "executive-summary", "table", "image"],
  "fileDownload": null
}
```

`widgetKinds` is restricted (via enum in the tool/schema, and validated again client-side) to the real `WidgetKind` values. Any value the model still returns outside that set is dropped rather than silently mapped to "Cover KPIs" — a dropped section is less confusing than a wrong one.

### 3. Grounding in real data — `buildDetailFromCharts`

New function in `src/api/azureOpenai.js` (or a small new `src/lib/charts-to-detail.ts` if that reads cleaner — implementation detail, decide while coding): `buildDetailFromCharts(dashboardKey, chartsData, project, session)` → returns a `DashboardDetail`-shaped object by reading `chartsData[dashboardKey]`, `chartsData.chart_insights`, `chartsData[`${dashboardKey}_overall_summary`]`, and `session.brand_keywords/competitor_keywords/message_keywords`, mapping into `kpis`, `sentiment`, `themeDistribution`, `topPublications`, `topArticles`, `executiveSummary`, `prImpactScore`, etc. Any field the real data doesn't cover keeps the existing mock `detail`'s value (merge, not replace — same pattern `BuilderScreen`'s current unused `liveDetail` merge already anticipates).

This same context (available chart titles, key insights, brand/competitor/message keywords) is summarized into the system prompt sent to Azure OpenAI, reusing the existing `buildDashboardContext`-style helper already used by `askAzureOpenAI`, so the model's `replyText` and chosen `widgetKinds`/`dashboardKey` are grounded in what's actually in this session, not generic guesses.

### 4. System prompt rewrite

`askAzureOpenAIBuilder`'s system prompt is rewritten to: always produce a direct `replyText` answering whatever was asked (chat behavior first); when the prompt is a build/edit-dashboard request, pick the matching `dashboardKey` (or `"custom"` if it doesn't fit one of the five) and only real `WidgetKind` values; state the active brand/competitor keywords and available real chart titles/insights as grounding context, mirroring rule 52-71 of the existing `askAzureOpenAI` system prompt style already in this file.

### 5. Visual refresh — Masonry v2 (approved via mockup)

Refine `DashboardCanvas`'s existing half/full-width flex-wrap grid (not a rebuild):
- Tighten card spacing/shadow per the reviewed mockup.
- Responsive breakpoints: 2-column (half-width cards side by side) above a width threshold, single column below it — currently it's width-based via `calc(50% - 6px)` regardless of viewport; add a container-query or Tailwind breakpoint so half-width cards stack on narrow panels (e.g. when the chat panel is widened and canvas space shrinks) instead of squeezing.
- New section arrives with a staggered fade/slide-in (extend the existing `motion.section layout` animation — add an `initial`/`animate` opacity+y transition keyed by index) instead of appearing instantly.
- While the AI is generating a section, show a shimmer skeleton card in its place (extend the existing `isLoading` skeleton block to show one skeleton card per expected incoming section rather than a fixed generic pair) instead of a blank gap.

### Error handling
- No `chartsData` yet for the session (still loading, or genuinely empty) → widgets render with whatever `buildDetailFromCharts` produced merged over mock `detail` fallback fields; never a blank/undefined crash.
- Real Azure OpenAI call fails → existing fallback heuristic runs, but now emits the corrected contract (real `WidgetKind`s + `dashboardKey`) so even the offline/fallback experience shows real cards, just with heuristic (non-AI) copy.

### Testing
Manual, since this is UI-and-integration heavy:
1. Enter Builder from a real session (Dashboards → Build). Ask a plain question ("what's our net sentiment this month?") — verify a direct textual answer, no widgets added.
2. Ask "build a PR impact dashboard for the current brand" — verify real numbers from that session's `chartsData` appear in the hero KPIs and charts, not the `$4.2M` / `34%` mock figures from the screenshot.
3. Ask for a dashboard kind not backed by real data (empty session) — verify graceful fallback, no crash, no orphaned "Cover KPIs" placeholder cards for unmatched kinds.
4. Resize the chat/canvas split narrow — verify half-width cards stack to one column instead of squeezing.
5. Watch a section get added — verify shimmer-then-fade-in instead of an instant pop.

## Open questions / explicitly deferred
- Image/video/docs/Excel download generation — sub-project 2.
- Storyboard-scroll and bento-grid layouts were shown and explicitly not chosen — not being built.
