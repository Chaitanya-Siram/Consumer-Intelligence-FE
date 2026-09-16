// Turns a natural-language pipeline description into the raw {type, data}
// node list the workflow copilot's canvas builder (copilotLayout.js)
// consumes. Same Azure OpenAI deployment/env-vars as api/azureOpenai.js.
import { LENSES, LLM_MODELS, LAYOUTS, OUTPUT_FORMATS } from "../workflow/constants.js";

const LENS_KEYS = LENSES.map((l) => l.key).join('", "');
const LLM_KEYS = LLM_MODELS.map((m) => m.key).join('", "');
const LAYOUT_VALUES = LAYOUTS.join('", "');
const FORMAT_VALUES = OUTPUT_FORMATS.join('", "');

const SYSTEM_PROMPT = `You are an AI Workflow Architect for AlphaMetricx Media Intelligence.
Turn the user's natural-language request into a JSON payload describing a media/PR
intelligence pipeline as a list of pipeline stage nodes.

Pipeline stage order MUST BE: data -> analysis -> review -> assembly -> output.
Emit exactly one "data" node, one or two "review" nodes (if Media Monitoring lens is requested alongside other lenses, emit two review nodes: one dedicated for Media Monitoring and one for the other lenses), one "assembly" node, one "output"
node, and one or more "analysis" nodes (one per distinct intelligence lens the user
asked for).

Allowed values (use ONLY these — never invent new ones):
- analysis.data.lens: one of "${LENS_KEYS}"
- analysis.data.llm: one of "${LLM_KEYS}"
- assembly.data.layout: one of "${LAYOUT_VALUES}"
- output.data.format: one of "${FORMAT_VALUES}"

Field guidance:
- data.data: { brandKeywords: string[], messageKeywords: string[], sourceType: "api",
  googleRssFeed: true, query: string, api: { sources: ["google_news"], queries: string[] } }.
  Never set a file upload — always the RSS/API path. brandKeywords MUST contain exactly ONE target brand/company string (e.g. ["Tesla"]). messageKeywords are messaging pillars/themes to track (infer 2-4 from
  context if not stated). query is a short search string for the RSS feed. Include the api field
  with sources ["google_news"] and queries containing double-quoted search strings, e.g. ["\"Tesla\""].
- analysis.data: { lens, llm, competitorKeywords: string[] }. competitorKeywords are the
  named competitor brands to benchmark against.
- review.data: {} (leave empty — defaults are applied downstream).
- assembly.data: { clientName: string, layout, charts: string[] subset of
  ["volume","sentiment","share_of_voice","themes","sources","geography"] }.
- output.data: { projectName: string, projectDescription: string, format }.

Only one workflow can exist on the canvas at a time — any "nodes" payload you return
FULLY REPLACES whatever is there now, it never merges or appends.

Ask before guessing. If the request is missing enough detail to build a real pipeline
(no brand/company named, no competitors, no clear intelligence lens, no messaging
theme) — or it reads like the user wants a brand-new/separate/additional workflow
without saying what should actually change (e.g. "add a new workflow", "create
another one", "make a second workflow") while a workflow already exists on the
canvas — do NOT invent details and do NOT silently replace the graph. Instead
respond with EXACTLY:
{ "clarify": "<one short, specific question for the user>" }
Only emit the "nodes" payload once you have enough concrete detail to build a real
pipeline, or the user has confirmed a replace/new-workflow request.

Respond ONLY with a single JSON object, no prose, no markdown fences, in ONE of these
two exact shapes:
{ "nodes": [ { "type": "data"|"analysis"|"review"|"assembly"|"output", "data": { ... } } ] }
{ "clarify": "<question text>" }`;

export async function generateWorkflowFromPrompt(prompt, { thread = [], currentSummary } = {}) {
  const useProxy = import.meta.env.DEV && import.meta.env.VITE_USE_AZURE_PROXY !== "false";
  const rawEndpoint = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT || "";
  const endpoint = useProxy
    ? "/api-azure-openai"
    : (rawEndpoint || "/api-azure-openai").replace(/\/$/, "");
  const apiKey = import.meta.env.VITE_AZURE_OPENAI_API_KEY;
  const apiVersion = import.meta.env.VITE_AZURE_OPENAI_API_VERSION || "2025-03-01-preview";
  const model = import.meta.env.VITE_AZURE_OPENAI_MODEL || "gpt-4.1";

  const cleanEndpoint = endpoint.replace(/\/$/, "");
  const url = `${cleanEndpoint}/openai/deployments/${model}/chat/completions?api-version=${apiVersion}`;

  const messages = [{ role: "system", content: SYSTEM_PROMPT }];
  if (currentSummary) {
    messages.push({
      role: "system",
      content: `Current workflow already on the canvas: ${currentSummary}`,
    });
  }
  for (const m of thread) {
    if (m.role === "user" || m.role === "assistant") {
      messages.push({ role: m.role, content: String(m.content || "") });
    }
  }
  messages.push({ role: "user", content: prompt });

  const reqHeaders = {
    "Content-Type": "application/json",
  };
  if (apiKey) {
    reqHeaders["api-key"] = apiKey;
  }

  const res = await fetch(url, {
    method: "POST",
    headers: reqHeaders,
    body: JSON.stringify({
      messages,
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
    throw new Error("The workflow copilot returned an unreadable response. Try rephrasing your request.");
  }
  const hasNodes = Array.isArray(parsed?.nodes);
  const hasClarify = typeof parsed?.clarify === "string" && parsed.clarify.trim();
  if (!hasNodes && !hasClarify) {
    throw new Error("The workflow copilot response was missing a node list. Try rephrasing your request.");
  }
  return parsed;
}
