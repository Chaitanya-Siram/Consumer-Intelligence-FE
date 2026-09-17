# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # start dev server on port 3000 (opens browser)
npm run build     # production build → dist/
npm run preview   # preview production build locally
```

No lint, test, or typecheck scripts are configured. `tsconfig.json` has `strict: false` / `noEmit: true`; `.ts`/`.tsx` files are compiled by Vite without type-checking.

Tutorial video/screenshot recorder (Playwright, backend fully stubbed via `page.route()`; needs dev server running, macOS `say`, ffmpeg):

```bash
node scripts/tutorial/record-workflow-tutorial.mjs
```

## Environment Setup

Copy `.env.example` to `.env`. Only `VITE_API_BASE_URL` is in the example; the rest are read by code / set in CI:

```
VITE_API_BASE_URL=http://localhost:8000          # FastAPI backend (separate repo, run on :8000)
VITE_AZURE_OPENAI_ENDPOINT=<azure-url>
VITE_AZURE_OPENAI_API_KEY=<key>
VITE_AZURE_OPENAI_API_VERSION=2025-03-01-preview
VITE_AZURE_OPENAI_MODEL=gpt-4.1                  # deployment name
VITE_AZURE_OPENAI_MODEL2=gpt-4.1                 # second deployment used by askAzureOpenAIBuilder
VITE_PEXELS_API_KEY=<key>                        # background images/videos (design agent)
VITE_USE_AZURE_PROXY=false                       # optional: disable dev proxy
```

## Deployment

`.github/workflows/main.yml` — push to `main` builds and deploys to S3 + CloudFront invalidation, then posts to a Teams webhook. Note: CI runs `yarn build` although the repo commits `package-lock.json`. All `VITE_*` values come from GitHub `vars`.

## Architecture

**Stack:** React 18 + Vite 5, React Router DOM 6, Tailwind CSS 3 + shadcn/ui (`base-nova` style, `@base-ui/react`), Zustand, Recharts / visx / D3 / Chart.js / amCharts 5, ReactFlow 11, Vercel AI SDK (`ai`, `@ai-sdk/openai`), `motion`, `react-hot-toast`.

Mixed JS/TS: most of the app is `.jsx`; newer builder/sense components (`src/components/builder`, `src/components/sense`, `src/lib/*.ts`, `src/data/*.ts`) are TSX/TS. Path alias `@` → `src/` (vite, jsconfig, tsconfig).

`src/index.css` is a single ~11k-line stylesheet holding most app styles (BEM-ish class names: `wfnode`, `modal-panel`, etc.). Dashboards/storyboards ship their own CSS files next to their JSX.

### Routing & data flow (`src/App.jsx`, ~1600 lines)

All routes live in `App.jsx`. Each route is a `*Route()` wrapper component that resolves data and renders a screen inside `Shell` (top nav, `CanvasTabBar`, theme). Auth is `localStorage`-based (`auth_token`); `ProtectedRoute` / `PublicOnlyRoute` guard routes.

URL shape:
```
/login
/                                        projects list
/:projectId/sessions                     sessions for a project
/:projectId/sessions/:sessionId/workflow           ReactFlow pipeline builder
/:projectId/sessions/:sessionId/review             tagged-article review table
/:projectId/sessions/:sessionId/dashboards         dashboard picker
# Media Intelligence (MI) dashboards
/:projectId/sessions/:sessionId/{measurement|monitoring|primpact|narrative|reputation}
# Consumer Intelligence (CI) storyboards
/:projectId/sessions/:sessionId/{trend|competitive|network|health|brand-intel|market-intelligence}
/:projectId/sessions/:sessionId/intel/:tier1Key    Tier-2 gallery for a Tier-1 pillar
/build, /projects/:projectId/build, /:projectId/sessions/:sessionId/build              BuilderScreen
/workflow-studio, /projects/:projectId/workflow-studio, /:projectId/sessions/:sessionId/workflow-studio
/sandbox  /new/workflow  /settings
```

**Data loading pattern** (`src/router/nav.js`): navigation passes full `project` / `session` / `chartsData` objects via react-router `state` (fast path). On deep-link/refresh, `useDashData()` in `App.jsx` fetches by URL id through `loadProject` / `loadSession` / `loadCharts`, which read/write a module-level `Map` cache. Session is always refetched (`force=true`) so workflow edits show immediately. `paths.*` in `nav.js` is the single source of URL builders — use it, don't hand-build URLs. `seedCharts()` is also where brand logos are registered for CI charts.

`ClearTemplateModeOnNavigation` clears `localStorage.dashboard_template_mode` when leaving MI dashboard routes (template switching is persisted there).

Chunk-load failures after a deploy trigger a throttled `window.location.reload()` (see `src/main.jsx` and `SafeImportErrorBoundary` in `App.jsx`).

### MI vs CI charts (`src/api/consumerIntelligence.js`)

Two backend payloads, merged client-side into one `chartsData` object keyed by lens:

- **MI** (`src/api/charts.js`): `GET /charts?session_id=` + `ws /ws/charts`. Lens keys: `media_monitoring`, `media_measurement`, `narrative_intelligence`, `pr_impact`, `reputation_index`.
- **CI**: `GET /consumer-intelligence/charts?session_id=` + `ws /ws/consumer-intelligence/charts`. Lens keys: `trend_intelligence`, `brand_intelligence`, `brand_health_storyboard`, `brand_competitive_intel`, `market_intelligence`, `network_map`.

`fetchAllCharts(sessionId, session)` inspects the session's saved workflow (analysis nodes' `data.lens` / `data.lensType === 'tier1'`) to skip whichever call the session never configured; either call may fail independently. `TIER1_TO_CI_KEYS` maps Tier-1 pillar keys to CI payload keys; `COMING_SOON_TIER1` lists pillars with no backend (dashboards page shows "Coming soon"). Tier-1/Tier-2 lens metadata lives in `src/workflow/tierLensData.js`.

Every dashboard screen reads `chartsData?.[DASHBOARD_KEY]` and receives `chartsLoading` / `chartsError` so it can show a spinner instead of a premature "no data" state.

### API layer (`src/api/`)

Every module: `const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'` + plain `fetch`. Authenticated modules (`projects`, `sessions`, `tagging`, `users`, `dataProviders`, `workflowAgent`) send `Authorization: Bearer <auth_token>`; `charts.js` / `consumerIntelligence.js` do not.

WebSockets derive from `BASE_URL` via `.replace(/^http/, 'ws')`: `/ws/agent` (data agent chat), `/ws/tagging`, `/ws/workflow-agent`, `/ws/query-builder`, `/ws/charts`, `/ws/consumer-intelligence/charts`. JWT is passed as `?token=` on the WS URL because browsers can't set headers on the handshake.

`auth.js`: OAuth2 password flow (`/auth/login`), stores `auth_token` + `refresh_token` + org context in localStorage; `setupAuthRefreshLoop()` refreshes 60s before JWT `exp` and calls `logoutUser()` on failure. `switchOrganization()` re-issues a token scoped to another org.

### Azure OpenAI (frontend-direct)

`azureOpenai.js` calls Azure chat completions directly from the browser (`/openai/deployments/<model>/chat/completions`). In dev it goes through the Vite proxy `/api-azure-openai` (which injects the `api-key` header from `.env`); in prod it hits `VITE_AZURE_OPENAI_ENDPOINT` directly. `askAzureOpenAI` is the dashboard "data agent" and exposes **tool functions** (`update_chart_card_style`, `update_chart_style`, `update_chart_text_color`, `update_storyboard_background`); results are dispatched as `window` CustomEvents consumed by `src/utils/designAgent.js`, which keeps module-level override maps and re-renders subscribers via `useDesignAgentUpdate()`. `askAzureOpenAIBuilder` (uses `VITE_AZURE_OPENAI_MODEL2`) drives BuilderScreen. `sandboxOpenAi.js` is the Sandbox screen's variant.

Dev proxies (`vite.config.js`): `/api-pexels` → `api.pexels.com`, `/api-azure-openai` → Azure endpoint.

### Agents (`src/agents/`)

- `prIntent/` — offline intent library. `orchestrator.js` classifies a free-text PR question, extracts entities, and answers from `mockData.js` **first**; callers fall back to the live LLM only on `handled: false`. Domain configs in `agents/*.js`.
- `builderAgent/` — `openaiBuilderAgent.js` (regex intent classification → Azure call → structured widget action), `dataAnalytics.js` (computes context from tagged articles), `htmlDashboardGenerator.js`. Widget kinds must match `WidgetKind` in `src/components/builder/widget-registry.tsx` — unmatched kinds silently fall back to the first widget.

### Workflow builder (`src/workflow/`, `src/screens/WorkflowScreen.jsx`)

ReactFlow graph with five node types in fixed order (`NODE_ORDER`: data → analysis → review → assembly → output). `data`, `review`, `assembly`, `output` are singletons; multiple `analysis` nodes allowed, each carrying a `lens` (MI key) or `lensType: 'tier1'` + Tier-1 key. Saved graph lives on `session.workflow`; `workflowUtils.js` (`restoreNodes`, `restoreEdges`, `hasSavedGraph`, `nextId`) is the serialization layer. `copilotLayout.js` turns the workflow-copilot LLM output into a graph. Tutorial: `docs/tutorials/workflow-screen-tutorial.md`.

### Dashboards (`src/dashboards/`)

- MI dashboards use switchable **templates** (`Template1..7.jsx` under `media_measurement/`, shared `template4-7/` parts) selected by `dashboard_template_mode`; `LAYOUTS` in `workflow/constants.js` lists the names.
- CI screens are **storyboards**: `StoryboardShell.jsx` (scroll-reveal via `useReveal`, progress bar) + block/chart primitives in `storyboard/blocks.jsx`, `charts.jsx`, `health-charts.jsx`, `bci-blocks.jsx`. They are faithful ports of approved HTML mockups; layout is fixed, all numbers come from `chartsData`.
- `src/screens/market-intelligence/lenses/Lens1..12.jsx` — Market Intelligence sub-lenses.

`src/utils/dynamicChartManager.js` generates extra "Dynamic Charts" tabs via OpenAI with a fabricated-chart fallback. `ChartAiContext` + `ChartAiDrawer` handle per-chart AI edits (`chartOverrides`).

### Theming

Zustand store `src/store/useThemes.js` sets `data-theme="light|dark"` on `<html>` and persists to `localStorage.theme`. Tailwind `darkMode: ["class"]` but the app's own CSS keys off `[data-theme="dark"]` selectors with HSL CSS variables (`--background`, `--primary`, ...). Chart palettes/sentiment/pillar colors live in `src/theme/chartStyles.js`. Charts from the `@bklit` shadcn registry are supported (`components.json`); the `.claude/skills/bklit-ui` skill covers install/composition/theming rules.

## Docs

- `docs/media-intelligence-agent-backend-contract.md` — backend proxy contract (SerpAPI search, article fetch) for a planned Media Intelligence Agent screen. The screen it references (`MediaIntelligenceAgentScreen.jsx`) is not in this snapshot; the doc is the spec if that work resumes.
- `docs/superpowers/specs/` and `plans/` — design specs and implementation plans for the workflow copilot and Builder live-data work.
- `README.md` is stale (describes an early projects-only version on port 5173); trust this file and the code instead.

## Repo hygiene notes

Root-level `t.mjs`, `update_page_body.cjs`, `update_template2*.cjs`, `extract_css.py` are one-off scratch scripts with hard-coded macOS paths. Ignore them; don't extend them.
