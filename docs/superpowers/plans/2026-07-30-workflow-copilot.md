# Workflow Copilot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the existing "Workflow Assistant" panel in `WorkflowScreen.jsx` to Azure OpenAI so a natural-language prompt generates a full Data → Analysis → Review → Assembly → Output node graph on the canvas, replacing whatever graph is currently there.

**Architecture:** `src/api/workflowCopilot.js` calls Azure OpenAI (same deployment as `src/api/azureOpenai.js`) with a JSON-mode system prompt and returns raw `{ nodes: [{type, data}] }`. `src/workflow/copilotLayout.js` is a pure function that turns that raw array into real `{ nodes, edges }` (ids via the existing `nextId`, data merged through the existing `defaultNodeData`, edges wired serially). `WorkflowScreen.jsx` calls both, replaces `nodes`/`edges` state, re-attaches the runtime callbacks it already attaches to manually-dropped nodes, and reuses its own existing `autoLayout()` to position everything.

**Tech Stack:** React (Vite, ESM — `"type": "module"` in package.json), React Flow, Azure OpenAI GPT-4.1 chat completions (`fetch`, JSON mode), `react-hot-toast`.

## Global Constraints

- No test runner exists in this project (`vite`/`build`/`preview` only) — verify `copilotLayout.js` with plain `node` scripts (pure ESM, no `import.meta.env` dependency) and verify the Azure OpenAI call + UI wiring manually via `npm run dev`.
- Copilot only ever sets the Data node's RSS/API path (`sourceType: 'api'`, `googleRssFeed: true`, `query`) plus keyword arrays — never a file upload.
- Every copilot prompt **replaces** the whole graph — no incremental/append editing.
- Reuse existing vocab from `src/workflow/constants.js` verbatim: `LENSES` keys (`media_measurement`, `media_monitoring`, `narrative_intelligence`, `pr_impact`, `reputation_index`), `LLM_MODELS` keys (`openai`, `claude`, `gemini`), `LAYOUTS` (`Classic`, `Editorial`, `Merger`, `PR Impact`, `Glass`, `Bento`), `OUTPUT_FORMATS` (`Dashboard`, `Intelligence Brief`, `PDF Report`, `API Webhook`).
- Reuse existing id/data helpers verbatim: `nextId(type)` and `defaultNodeData(type, extra)` — do not reimplement id generation or default-field logic.

---

### Task 1: `copilotLayout.js` — pure graph builder

**Files:**

- Create: `src/workflow/copilotLayout.js`
- Create (temporary, deleted at end of task): `src/workflow/copilotLayout.manualtest.mjs`

**Interfaces:**

- Consumes: `NODE_ORDER` (array of 5 strings, from `src/workflow/constants.js`), `defaultNodeData(type, extra)` (from same file), `nextId(type)` (from `src/workflow/workflowUtils.js`).
- Produces: `buildGraphFromCopilot(rawNodes: Array<{type: string, data?: object}>): { nodes: Array<{id, type, position: {x,y}, data}>, edges: Array<{id, source, target}> }` — thrown `Error` with a human-readable message if `rawNodes` is missing any of the four singleton stages (`data`, `review`, `assembly`, `output`) or has zero `analysis` nodes. Exported from `src/workflow/copilotLayout.js`.

- [ ] **Step 1: Write `copilotLayout.js`**

```javascript
// src/workflow/copilotLayout.js
// Turns the raw {type, data} nodes returned by the workflow copilot's LLM
// call into a real React Flow graph: real ids, defaulted data, serial edges.
// Positions are left at {0,0} — WorkflowScreen's own autoLayout() places
// everything right after this runs, so there's no duplicated layout math.
import { NODE_ORDER, defaultNodeData } from "./constants.js";
import { nextId } from "./workflowUtils.js";

const SINGLETON_TYPES = ["data", "review", "assembly", "output"];

export function buildGraphFromCopilot(rawNodes) {
  const known = (rawNodes || []).filter((n) => NODE_ORDER.includes(n?.type));
  const dropped = (rawNodes || []).length - known.length;
  if (dropped > 0) {
    console.warn(
      `[copilotLayout] Dropped ${dropped} node(s) with unrecognized type.`,
    );
  }

  for (const type of SINGLETON_TYPES) {
    if (!known.some((n) => n.type === type)) {
      throw new Error(
        `Couldn't build a full pipeline: missing a ${type} stage.`,
      );
    }
  }
  const analysisRaw = known.filter((n) => n.type === "analysis");
  if (analysisRaw.length === 0) {
    throw new Error(
      "Couldn't build a full pipeline: missing an analysis stage.",
    );
  }

  const nodes = known.map((raw) => ({
    id: nextId(raw.type),
    type: raw.type,
    position: { x: 0, y: 0 },
    data: defaultNodeData(raw.type, raw.data || {}),
  }));

  const byType = (type) => nodes.filter((n) => n.type === type);
  const dataNode = byType("data")[0];
  const analysisNodes = byType("analysis");
  const reviewNode = byType("review")[0];
  const assemblyNode = byType("assembly")[0];
  const outputNode = byType("output")[0];

  const edges = [];
  analysisNodes.forEach((a) => {
    edges.push({
      id: `e_${dataNode.id}_${a.id}`,
      source: dataNode.id,
      target: a.id,
    });
    edges.push({
      id: `e_${a.id}_${reviewNode.id}`,
      source: a.id,
      target: reviewNode.id,
    });
  });
  edges.push({
    id: `e_${reviewNode.id}_${assemblyNode.id}`,
    source: reviewNode.id,
    target: assemblyNode.id,
  });
  edges.push({
    id: `e_${assemblyNode.id}_${outputNode.id}`,
    source: assemblyNode.id,
    target: outputNode.id,
  });

  return { nodes, edges };
}
```

- [ ] **Step 2: Write a temporary manual-test script**

```javascript
// src/workflow/copilotLayout.manualtest.mjs
// Temporary — run with `node src/workflow/copilotLayout.manualtest.mjs`,
// then delete this file. Not part of the shipped codebase.
import { buildGraphFromCopilot } from "./copilotLayout.js";

function assert(cond, msg) {
  if (!cond) throw new Error("FAIL: " + msg);
  console.log("PASS:", msg);
}

// Happy path: two analysis nodes (multi-lens prompt).
const { nodes, edges } = buildGraphFromCopilot([
  { type: "data", data: { brandKeywords: ["Tesla"] } },
  { type: "analysis", data: { lens: "pr_impact", llm: "claude" } },
  { type: "analysis", data: { lens: "narrative_intelligence", llm: "claude" } },
  { type: "review" },
  { type: "assembly", data: { clientName: "Tesla" } },
  { type: "output", data: { projectName: "Q3" } },
]);

assert(nodes.length === 6, "6 nodes returned");
assert(
  nodes.filter((n) => n.type === "analysis").length === 2,
  "2 analysis nodes",
);
assert(
  edges.length === 6,
  "6 edges (2x data->analysis + 2x analysis->review + review->assembly + assembly->output)",
);
const outputNode = nodes.find((n) => n.type === "output");
assert(
  outputNode.data.projectName === "Q3",
  "output data merged via defaultNodeData",
);
assert(
  outputNode.data.format === "Dashboard",
  "output data defaulted format via defaultNodeData",
);

// Missing singleton stage throws.
let threw = false;
try {
  buildGraphFromCopilot([
    { type: "data" },
    { type: "analysis", data: { lens: "pr_impact" } },
    { type: "review" },
    { type: "assembly" },
    // no output
  ]);
} catch (err) {
  threw = true;
  assert(/output/.test(err.message), "error message names the missing stage");
}
assert(threw, "missing output stage throws");

console.log("All copilotLayout manual checks passed.");
```

- [ ] **Step 3: Run the manual test script**

Run: `node src/workflow/copilotLayout.manualtest.mjs`
Expected: every line prints `PASS:` or the happy-path assertions, ending with `All copilotLayout manual checks passed.` No `FAIL:` lines, no uncaught exception.

- [ ] **Step 4: Delete the temporary test script**

```bash
rm src/workflow/copilotLayout.manualtest.mjs
```

- [ ] **Step 5: Commit**

```bash
git add src/workflow/copilotLayout.js
git commit -m "feat: add pure graph builder for workflow copilot"
```

---

### Task 2: `workflowCopilot.js` — Azure OpenAI call

**Files:**

- Create: `src/api/workflowCopilot.js`

**Interfaces:**

- Consumes: nothing from Task 1. Reads `LENSES`, `LLM_MODELS`, `LAYOUTS`, `OUTPUT_FORMATS` from `src/workflow/constants.js` (already exported, read-only).
- Produces: `generateWorkflowFromPrompt(prompt: string): Promise<{ nodes: Array<{type: string, data: object}> }>` — throws `Error` on HTTP failure or unparseable JSON. Exported from `src/api/workflowCopilot.js`. Task 3 calls this directly.

- [ ] **Step 1: Write `workflowCopilot.js`**

```javascript
// src/api/workflowCopilot.js
// Turns a natural-language pipeline description into the raw {type, data}
// node list the workflow copilot's canvas builder (copilotLayout.js)
// consumes. Same Azure OpenAI deployment/env-vars as api/azureOpenai.js.
import {
  LENSES,
  LLM_MODELS,
  LAYOUTS,
  OUTPUT_FORMATS,
} from "../workflow/constants.js";

const LENS_KEYS = LENSES.map((l) => l.key).join('", "');
const LLM_KEYS = LLM_MODELS.map((m) => m.key).join('", "');
const LAYOUT_VALUES = LAYOUTS.join('", "');
const FORMAT_VALUES = OUTPUT_FORMATS.join('", "');

const SYSTEM_PROMPT = `You are an AI Workflow Architect for AlphaMetricx Media Intelligence.
Turn the user's natural-language request into a JSON payload describing a media/PR
intelligence pipeline as a list of pipeline stage nodes.

Pipeline stage order MUST BE: data -> analysis -> review -> assembly -> output.
Emit exactly one "data" node, one "review" node, one "assembly" node, one "output"
node, and one or more "analysis" nodes (one per distinct intelligence lens the user
asked for).

Allowed values (use ONLY these — never invent new ones):
- analysis.data.lens: one of "${LENS_KEYS}"
- analysis.data.llm: one of "${LLM_KEYS}"
- assembly.data.layout: one of "${LAYOUT_VALUES}"
- output.data.format: one of "${FORMAT_VALUES}"

Field guidance:
- data.data: { brandKeywords: string[], messageKeywords: string[], sourceType: "api",
  googleRssFeed: true, query: string }. Never set a file upload — always the RSS/API
  path. brandKeywords are the core brand(s)/company the user is monitoring.
  messageKeywords are messaging pillars/themes to track (infer 2-4 from context if not
  stated). query is a short search string for the RSS feed.
- analysis.data: { lens, llm, competitorKeywords: string[] }. competitorKeywords are the
  named competitor brands to benchmark against.
- review.data: {} (leave empty — defaults are applied downstream).
- assembly.data: { clientName: string, layout, charts: string[] subset of
  ["volume","sentiment","share_of_voice","themes","sources","geography"] }.
- output.data: { projectName: string, projectDescription: string, format }.

Respond ONLY with a single JSON object of this exact shape, no prose, no markdown fences:
{ "nodes": [ { "type": "data"|"analysis"|"review"|"assembly"|"output", "data": { ... } } ] }`;

export async function generateWorkflowFromPrompt(prompt) {
  const endpoint =
    import.meta.env.VITE_AZURE_OPENAI_ENDPOINT ||
    "https://amx-gpt-india.openai.azure.com/";
  const apiKey = import.meta.env.VITE_AZURE_OPENAI_API_KEY;
  const apiVersion =
    import.meta.env.VITE_AZURE_OPENAI_API_VERSION || "2025-03-01-preview";
  const model = import.meta.env.VITE_AZURE_OPENAI_MODEL || "gpt-4.1";

  const url = `${endpoint}openai/deployments/${model}/chat/completions?api-version=${apiVersion}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 1200,
    }),
  });

  if (!res.ok) {
    let detail = `Workflow copilot error (${res.status})`;
    try {
      const errJson = await res.json();
      if (errJson?.error?.message) detail = errJson.error.message;
    } catch {
      /* non-json error body */
    }
    throw new Error(detail);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || "";
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error(
      "The workflow copilot returned an unreadable response. Try rephrasing your request.",
    );
  }
  if (!parsed || !Array.isArray(parsed.nodes)) {
    throw new Error(
      "The workflow copilot response was missing a node list. Try rephrasing your request.",
    );
  }
  return parsed;
}
```

- [ ] **Step 2: Verify the module has no syntax errors and the prompt strings build correctly**

Run: `node -e "import('./src/api/workflowCopilot.js').then(m => console.log(typeof m.generateWorkflowFromPrompt))"`
Expected: prints `function` (the import succeeds — `import.meta.env` is only _read_ inside the async function body, so importing the module doesn't touch it and won't throw outside Vite).

- [ ] **Step 3: Commit**

```bash
git add src/api/workflowCopilot.js
git commit -m "feat: add Azure OpenAI call for workflow copilot"
```

---

### Task 3: Wire the Workflow Assistant panel in `WorkflowScreen.jsx`

**Files:**

- Modify: `src/screens/WorkflowScreen.jsx`

**Interfaces:**

- Consumes: `generateWorkflowFromPrompt(prompt)` from Task 2 (`src/api/workflowCopilot.js`), `buildGraphFromCopilot(rawNodes)` from Task 1 (`src/workflow/copilotLayout.js`). Also consumes existing in-file helpers: `withCallbacks(type, data)`, `deleteNode(id)`, `handleOpenReviewNode(id)`, `autoLayout()`, `flash(msg)`, `lensLabel` (import from `../workflow/constants.js` for the confirmation summary).
- Produces: nothing new consumed elsewhere — this is the top-level wiring, terminal to the feature.

- [ ] **Step 1: Add the imports**

In `src/screens/WorkflowScreen.jsx`, add near the existing imports from `../workflow/constants.js` (around line 20-25):

```javascript
import {
  MODULES,
  defaultNodeData,
  isSerialConnection,
  NODE_ORDER,
  lensLabel,
} from "../workflow/constants.js";
```

(This replaces the existing 5-item import list with a 7-item one — same file, two new named imports.)

Then add two new import lines right after the `workflowUtils.js` import block (around line 73):

```javascript
import { generateWorkflowFromPrompt } from "../api/workflowCopilot.js";
import { buildGraphFromCopilot } from "../workflow/copilotLayout.js";
import { cn } from "../../../src/lib/utils";
```

- [ ] **Step 2: Add copilot state**

In `WorkflowCanvas`, right after the existing `const [assistantOpen, setAssistantOpen] = useState(false);` line (~249), add:

```javascript
const [copilotInput, setCopilotInput] = useState("");
const [copilotBusy, setCopilotBusy] = useState(false);
const [copilotThread, setCopilotThread] = useState([]); // { id, role: 'user'|'assistant'|'error', text }
const copilotMsgIdRef = useRef(0);
const nextCopilotMsgId = () => ++copilotMsgIdRef.current;
```

- [ ] **Step 3: Add the `handleCopilotPrompt` handler**

Add this right after `autoLayout` is defined (~line 1044, after the `autoLayout` `useCallback` closes), so it can call `autoLayout` from its closure:

```javascript
const handleCopilotPrompt = useCallback(
  async (rawPrompt) => {
    const prompt = (rawPrompt || "").trim();
    if (!prompt || copilotBusy) return;

    setCopilotThread((t) => [
      ...t,
      { id: nextCopilotMsgId(), role: "user", text: prompt },
    ]);
    setCopilotInput("");
    setCopilotBusy(true);

    try {
      const raw = await generateWorkflowFromPrompt(prompt);
      const { nodes: builtNodes, edges: builtEdges } = buildGraphFromCopilot(
        raw.nodes,
      );

      const withRuntime = builtNodes.map((n) => {
        const data = withCallbacks(n.type, n.data);
        data.onDelete = () => deleteNode(n.id);
        if (n.type === "review")
          data.onTagged = () => handleOpenReviewNode(n.id);
        return { ...n, data };
      });

      setNodes(withRuntime);
      setEdges(builtEdges);
      setSelectedId(null);
      window.setTimeout(autoLayout, 0);

      const analysisNodes = withRuntime.filter((n) => n.type === "analysis");
      const assemblyNode = withRuntime.find((n) => n.type === "assembly");
      const lensSummary = analysisNodes
        .map((n) => lensLabel(n.data.lens) || n.data.lens)
        .filter(Boolean)
        .join(", ");
      const summary = `Built a workflow: Data → ${analysisNodes.length} Analysis node${analysisNodes.length === 1 ? "" : "s"}${lensSummary ? ` (${lensSummary})` : ""} → Review → Assembly (${assemblyNode?.data?.layout || "Classic"}) → Output.`;
      setCopilotThread((t) => [
        ...t,
        { id: nextCopilotMsgId(), role: "assistant", text: summary },
      ]);
      flash("Workflow generated from your prompt.");
    } catch (err) {
      setCopilotThread((t) => [
        ...t,
        {
          id: nextCopilotMsgId(),
          role: "error",
          text: err.message || "Failed to generate the workflow.",
        },
      ]);
      toast.error(err.message || "Failed to generate the workflow.");
    } finally {
      setCopilotBusy(false);
    }
  },
  [
    copilotBusy,
    withCallbacks,
    deleteNode,
    handleOpenReviewNode,
    setNodes,
    setEdges,
    autoLayout,
    flash,
  ],
);
```

- [ ] **Step 4: Un-comment the launcher button and wire the drawer**

Replace the commented-out launcher (~line 1896-1901):

```javascript
{
  /* <button
            className="wfassist"
            onClick={() => setAssistantOpen((o) => !o)}
          >
            <SparklesIcon width={16} height={16} /> Workflow Assistant
          </button> */
}
```

with:

```javascript
<button className="wfassist" onClick={() => setAssistantOpen((o) => !o)}>
  <SparklesIcon width={16} height={16} /> Workflow Assistant
</button>
```

Then replace the whole disabled `wfchat` block (~line 1984-2015):

```javascript
{
  assistantOpen && (
    <div className="wfchat">
      <div className="wfchat__head">
        <span>
          <SparklesIcon width={16} height={16} /> Workflow Assistant
        </span>
        <button
          className={cn("wfic", "wfic--sm")}
          onClick={() => setAssistantOpen(false)}
          aria-label="Close"
        >
          <CloseIcon width={16} height={16} />
        </button>
      </div>
      <div className="wfchat__body">
        <p className="wfchat__msg">
          Hi! Describe what you want this workflow to do and I can suggest
          modules to add. (Assistant responses are a preview in this build.)
        </p>
      </div>
      <div className="wfchat__input">
        <input className="wfinput" placeholder="Ask the assistant…" disabled />
        <button className={cn("wfic", "wfic--sm")} disabled aria-label="Send">
          <SendIcon width={16} height={16} />
        </button>
      </div>
    </div>
  );
}
```

with:

```javascript
{
  assistantOpen && (
    <div className="wfchat">
      <div className="wfchat__head">
        <span>
          <SparklesIcon width={16} height={16} /> Workflow Assistant
        </span>
        <button
          className={cn("wfic", "wfic--sm")}
          onClick={() => setAssistantOpen(false)}
          aria-label="Close"
        >
          <CloseIcon width={16} height={16} />
        </button>
      </div>
      <div className="wfchat__body">
        {copilotThread.length === 0 && (
          <p className="wfchat__msg">
            Describe the pipeline you want (brand, competitors, lens, LLM,
            layout, project name) and I'll build the whole node graph for you —
            replacing whatever is on the canvas now.
          </p>
        )}
        {copilotThread.map((m) => (
          <p key={m.id} className={`wfchat__msg wfchat__msg--${m.role}`}>
            {m.text}
          </p>
        ))}
        {copilotBusy && (
          <p className={cn("wfchat__msg", "wfchat__msg--assistant")}>
            Building your workflow…
          </p>
        )}
      </div>
      <div className="wfchat__input">
        <input
          className="wfinput"
          placeholder="Ask the assistant…"
          value={copilotInput}
          onChange={(e) => setCopilotInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleCopilotPrompt(copilotInput);
          }}
          disabled={copilotBusy}
        />
        <button
          className={cn("wfic", "wfic--sm")}
          onClick={() => handleCopilotPrompt(copilotInput)}
          disabled={copilotBusy || !copilotInput.trim()}
          aria-label="Send"
        >
          <SendIcon width={16} height={16} />
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Manual verification**

Run: `npm run dev`, open a project's workflow screen, click "Workflow Assistant", and send each of these three prompts one at a time (each should fully replace the canvas):

1. `Build a media monitoring workflow for Tesla comparing against Rivian and Lucid using Claude. Name the project 'Q3 Electric Vehicle Perception'.`
   - Expect: 1 Data, 1 Analysis (`media_monitoring`, `claude`), 1 Review, 1 Assembly, 1 Output (`projectName: "Q3 Electric Vehicle Perception"`) — 4 edges, all colored valid (not red), auto-fit into view.
2. `Create a workflow for Nike with two analysis nodes: one for PR Impact and one for Narrative Intelligence. Benchmark against Adidas and Puma using Gemini 2.5 Pro. Set client name to 'Nike Global' and output as an Editorial Dashboard.`
   - Expect: 2 Analysis nodes (`pr_impact`, `narrative_intelligence`, both `gemini`), Assembly `clientName: "Nike Global"`, `layout: "Editorial"` — 6 edges.
3. An empty/gibberish prompt or a temporarily-broken network (e.g. disable network in devtools) — expect an error bubble in the drawer, a `toast.error`, and the previous graph left untouched (not cleared).

Confirm the assistant confirmation message text appears after each successful build, and the `ConfigPanel` on the right updates correctly when a copilot-built node is clicked (proves `onDelete`/`onTagged` and all data fields were attached correctly).

- [ ] **Step 6: Commit**

```bash
git add src/screens/WorkflowScreen.jsx
git commit -m "feat: wire Workflow Assistant panel to the AI copilot"
```
