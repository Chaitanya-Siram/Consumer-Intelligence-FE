# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # start dev server on port 3000
npm run build     # production build
npm run preview   # preview production build locally
```

No lint, test, or typecheck scripts are configured.

## Environment Setup

Copy `.env.example` to `.env` and fill in:

```
VITE_API_BASE_URL=http://localhost:8000          # FastAPI backend
VITE_AZURE_OPENAI_ENDPOINT=<your-azure-url>
VITE_AZURE_OPENAI_API_KEY=<your-key>
VITE_AZURE_OPENAI_API_VERSION=2025-03-01-preview
VITE_AZURE_OPENAI_MODEL=gpt-4.1
```

Backend is a separate FastAPI repo, not included here. Run it separately on port 8000.

## Architecture

**Stack:** React 18 + Vite 5, React Router DOM 6, Tailwind CSS + shadcn/ui (base-nova style), Zustand, Recharts/visx/D3, ReactFlow, Vercel AI SDK.

**Path alias:** `@` → `src/`

### Routing (`src/App.jsx`)

All routes defined in one file. URL shape:
```
/login
/
/:projectId/sessions
/:projectId/sessions/:sessionId/workflow
/:projectId/sessions/:sessionId/review
/:projectId/sessions/:sessionId/dashboards
/:projectId/sessions/:sessionId/measurement
/:projectId/sessions/:sessionId/monitoring
/:projectId/sessions/:sessionId/primpact
/:projectId/sessions/:sessionId/narrative
/:projectId/sessions/:sessionId/reputation
/build  (also /projects/:projectId/build and /:projectId/sessions/:sessionId/build)
/workflow-studio  (similar multi-path pattern)
/sandbox
/new/workflow
/settings
```

Auth is `localStorage`-based (`auth_token`). `ProtectedRoute` / `PublicOnlyRoute` wrappers guard routes.

### API Layer (`src/api/`)

Every file follows the same pattern:
```js
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
// plain fetch with Authorization: Bearer <token>
```

Key modules: `auth.js` (OAuth2 password flow + auto-refresh), `projects.js`, `sessions.js`, `charts.js`, `tagging.js`, `agent.js`, `workflowAgent.js`, `azureOpenai.js`.

Auth stores `access_token` + `refresh_token` in localStorage. Background timer refreshes access token 60s before JWT expiry.

### Dev Proxies (vite.config.js)

- `/api-pexels` → `https://api.pexels.com` (CORS bypass)
- `/api-azure-openai` → Azure OpenAI endpoint (injects `api-key` header server-side)

In production, Azure calls go directly to `VITE_AZURE_OPENAI_ENDPOINT`. Set `VITE_USE_AZURE_PROXY=false` to force-disable the proxy.

### State Management

- **Zustand** (`src/store/useThemes.js`) — dark/light theme, persisted to localStorage. Theme toggled via `data-theme` attribute on root.
- **React Context** (`src/context/ChartAiContext.jsx`) — chart AI state.
- **Module-level Map cache** (`src/router/nav.js`) — in-memory cache for projects/sessions/charts by id.

### Key Domain Areas

| Directory | Purpose |
|---|---|
| `src/screens/` | One `.jsx` per page/route |
| `src/dashboards/` | Per-dashboard folders (media_monitoring, media_measurement, etc.) |
| `src/agents/builderAgent/` | OpenAI-powered dashboard builder agent |
| `src/agents/prIntent/` | PR intent orchestrator, classifier, chart mapper |
| `src/workflow/` | ReactFlow workflow studio (nodes, panels, copilot layout) |
| `src/components/ui/` | shadcn/ui generated components |
| `src/lib/` | Shared utilities (format.ts, icon-map.ts, use-async.ts) |
| `src/router/nav.js` | URL helpers, data-loading hooks, cache |

### Theming

Tailwind darkMode: `["class"]` — dark mode activated by `data-theme` attribute (not `prefers-color-scheme`). Colors defined as CSS HSL variables, extended in `tailwind.config.js`. Chart styles in `src/theme/chartStyles.js`.
