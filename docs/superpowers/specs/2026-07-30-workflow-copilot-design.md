# Workflow Copilot (AI Chatbot for WorkflowScreen)

## Purpose

Let a user type a natural-language description of a media/PR intelligence
pipeline (e.g. "Build a media monitoring workflow for Tesla comparing against
Rivian and Lucid using Claude, name the project 'Q3 EV Perception'") into the
existing "Workflow Assistant" panel on `WorkflowScreen.jsx`, and have it
generate a fully wired, fully populated 5-stage node graph (Data → Analysis →
Review → Assembly → Output) on the canvas — replacing whatever is there.

## Non-goals

- No new backend service. Reuses the Azure OpenAI deployment already wired in
  `src/api/azureOpenai.js` / `src/api/sandboxOpenAi.js`.
- No file-upload automation — the copilot can only configure the Data node's
  Google RSS / API path (`sourceType: 'api'`, `googleRssFeed: true`, `query`),
  never a file upload, since no file exists to attach from a text prompt.
- No incremental/append editing of an existing graph — every copilot prompt
  describes a complete pipeline and replaces the current one.
- No automated test suite (none exists in this project — `vite`/`build`/
  `preview` only). Verification is manual via the dev server.

## Architecture

```
User prompt (Workflow Assistant drawer)
        |
        v
generateWorkflowFromPrompt()      [src/api/workflowCopilot.js]
        |  Azure OpenAI GPT-4.1, JSON-mode, single call
        v
{ nodes: [{ type, data }, ...] }  (raw, unvalidated)
        |
        v
buildGraphFromCopilot()           [src/workflow/copilotLayout.js]
  - defaultNodeData(type, data) merge (fills gaps, drops unknown types)
  - assigns ids via existing nextId(type)
  - column layout (same math as WorkflowScreen's autoLayout)
  - serial edges: Data -> each Analysis -> Review -> Assembly -> Output
        |
        v
{ nodes, edges }
        |
        v
WorkflowScreen: setNodes/setEdges (replaces graph), re-attach runtime
callbacks (onDelete/onTagged), autoLayout()+fitView, assistant confirmation
message in the drawer.
```

### 1. `src/api/workflowCopilot.js` (new)

`generateWorkflowFromPrompt(prompt: string): Promise<{ nodes: Array<{type, data}> }>`

- Same Azure OpenAI endpoint/key/model/env-var pattern as `askAzureOpenAI` in
  `src/api/azureOpenai.js` (reuse the same defaults, no new config needed).
- System prompt enumerates the exact vocab pulled from
  `src/workflow/constants.js` so the model never invents values:
  - `LENSES` keys (`media_measurement`, `media_monitoring`,
    `narrative_intelligence`, `pr_impact`, `reputation_index`)
  - `LLM_MODELS` keys (`openai`, `claude`, `gemini`)
  - `LAYOUTS` (`Classic`, `Editorial`, `Merger`, `PR Impact`, `Glass`, `Bento`)
  - `OUTPUT_FORMATS` (`Dashboard`, `Intelligence Brief`, `PDF Report`,
    `API Webhook`)
- Request uses `response_format: { type: "json_object" }` (Azure OpenAI
  supports this on gpt-4.1) so the reply is guaranteed parseable JSON — no
  markdown fences to strip, unlike `sandboxOpenAi.js`'s regex approach.
- Schema the model must emit:
  ```json
  {
    "nodes": [
      {
        "type": "data",
        "data": {
          "brandKeywords": ["Tesla"],
          "messageKeywords": ["EV", "Autopilot"],
          "sourceType": "api",
          "googleRssFeed": true,
          "query": "Tesla EV news",
          "api": {
            "sources": ["google_news"],
            "queries": ["\"Tesla EV news\""]
          }
        }
      },
      {
        "type": "analysis",
        "data": {
          "lens": "media_monitoring",
          "llm": "claude",
          "competitorKeywords": ["Rivian", "Lucid"]
        }
      },
      { "type": "review", "data": {} },
      {
        "type": "assembly",
        "data": { "clientName": "Tesla", "layout": "Classic", "charts": ["volume", "sentiment"] }
      },
      {
        "type": "output",
        "data": { "projectName": "Q3 EV Perception", "projectDescription": "...", "format": "Dashboard" }
      }
    ]
  }
  ```
  Exactly one `data`, one `review`, one `assembly`, one `output`; one or more
  `analysis` nodes (multi-lens prompts produce multiple).
- On HTTP error or JSON parse failure: throw with a message the drawer can
  display (mirrors `askAzureOpenAI`'s error handling).

### 2. `src/workflow/copilotLayout.js` (new)

Pure, synchronous, no API calls — easy to reason about/extend independently.

`buildGraphFromCopilot(rawNodes): { nodes, edges }`

- Filters to known types (`NODE_ORDER` from `constants.js`); logs+drops
  anything else instead of crashing.
- Enforces the "exactly one of data/review/assembly/output, 1+ analysis"
  shape — if a required singleton stage is missing, throws a descriptive
  error (drawer shows "Couldn't build a full pipeline: missing an Output
  stage." rather than silently rendering a broken graph).
- For each raw node: `id = nextId(type)`, `data = defaultNodeData(type, {...raw.data, label: <existing default label>})`.
- Positions: reuses the exact column/row math already in `WorkflowScreen.jsx`'s
  `autoLayout` (`COL_W = 320`, `ROW_H = 210`, centered per column) — extracted
  as a shared constant/helper so the two call sites can't drift, OR
  `WorkflowScreen` simply calls its own `autoLayout()` right after `setNodes`
  (simpler — no duplicated math). **Decision: call `autoLayout()` after
  `setNodes`/`setEdges`, so `copilotLayout.js` doesn't need to know about
  positioning at all** — it returns nodes at `{x:0,y:0}` and the screen's
  existing auto-format immediately repositions + fits the view.
- Edges: `data -> each analysis`, `each analysis -> review`, `review ->
  assembly`, `assembly -> output` — plain objects `{id, source, target}`; the
  screen's existing `markEdges(nodes, edges)` effect (already wired to run
  whenever `nodes` changes) colors them valid/invalid the same way manually-
  drawn edges are, so Media-Monitoring-exclusivity is enforced by the code
  that already exists, not duplicated here.

### 3. `WorkflowScreen.jsx` changes

- Un-comment the `wfassist` launcher button (~line 1896) that toggles
  `assistantOpen`.
- Replace the disabled `wfchat` drawer content with:
  - `thread` state: array of `{ id, role: 'user'|'assistant'|'error', text }`.
  - `copilotBusy` state for the in-flight request.
  - A real `<input>` + send button (mirrors the disabled markup already
    there, just wired up) calling `handleCopilotPrompt(text)`.
- `handleCopilotPrompt`:
  1. Push user message, clear input, set busy.
  2. `await generateWorkflowFromPrompt(prompt)`.
  3. `buildGraphFromCopilot(raw.nodes)` → `{ nodes, edges }`.
  4. Attach the same runtime callbacks `onDrop` already attaches per type
     (`onDelete`, `onTagged` for review) via the existing `withCallbacks`
     helper, so copilot-built nodes are as interactive as manually-dropped
     ones.
  5. `setNodes(nodes)`, `setEdges(edges)`, then `autoLayout()`.
  6. Push an assistant confirmation summarizing what was built (stage counts,
     lens/llm/layout/format picked) — plain string, no markdown rendering
     needed since the drawer is simple text.
  7. `flash("Workflow generated from your prompt.")` (existing toast helper).
  - On failure at any step: push an error-role message + `toast.error`, leave
    the current graph untouched (only `setNodes`/`setEdges` after a fully
    successful build+validate).

## Error handling

- Network/API failure → caught in `handleCopilotPrompt`, surfaced as a chat
  error bubble + toast, graph untouched.
- Malformed JSON from the model → same path (parse happens inside
  `generateWorkflowFromPrompt`, which throws).
- Missing required singleton stage(s) → `buildGraphFromCopilot` throws before
  any state mutation, so a partial/broken graph is never rendered.
- Unknown node types in the model's output → dropped with a `console.warn`,
  not fatal (doesn't block a valid pipeline the model also returned).

## Testing / verification

No test runner exists in this project. Verification: run `npm run dev`, open
a workflow, use the Workflow Assistant with the three example prompts from
the original guide (Tesla/Rivian/Lucid single-lens, Nike two-lens, OpenAI RSS
feed), and confirm:
- Correct node count/types, fields populated per prompt.
- Edges wired serially and colored valid (not red).
- Auto-layout fits the view.
- A malformed/empty prompt and a simulated API failure both leave the
  existing graph intact and show an error bubble.
