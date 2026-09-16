import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactFlow, {
  ReactFlowProvider,
  Background,
  Controls,
  ControlButton,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";
import { nodeTypes } from "../workflow/nodes.jsx";
import ConfigPanel from "../workflow/panels.jsx";
import ReviewScreen from "./ReviewScreen.jsx";
import CanvasTabBar from "../components/canvas/CanvasTabBar.jsx";
import bgHero from "../assets/background.jpg";
import { toast } from "react-hot-toast";
import {
  MODULES,
  defaultNodeData,
  isSerialConnection,
  NODE_ORDER,
  lensLabel,
  LENSES,
  LLM_MODELS,
  LAYOUTS,
} from "../workflow/constants.js";
import { tier1Label } from "../workflow/tierLensData.js";
import {
  MODULE_ICON,
  BriefIcon,
  PlayIcon,
  SparklesIcon,
  CopyIcon,
} from "../workflow/wfIcons.jsx";
import {
  ArrowLeftIcon,
  MoonIcon,
  SunIcon,
  CloseIcon,
  SendIcon,
  RefreshIcon,
  EyeIcon,
  BoltIcon,
  LayersIcon,
  UploadIcon,
  SpreadsheetIcon,
  ChevronDownIcon,
  CheckIcon,
} from "../components/Icons.jsx";
import {
  saveWorkflow,
  getSession,
  createSession,
  listSessions,
  uploadFile,
} from "../api/sessions.js";
import {
  createProject,
  getProject,
  updateProject,
  addSectionsPrompt,
} from "../api/projects.js";
import ProjectInstructionsPanel from "../components/ProjectInstructionsPanel.jsx";
import {
  TutorialMenu,
  TutorialVideoModal,
  WorkflowTour,
} from "../components/workflow/WorkflowTutorial.jsx";
import { buildWorkflowTourSteps } from "../components/workflow/workflowTourSteps.js";
import { useNavigate } from "react-router-dom";
import { paths, invalidateSessionCache, seedSession } from "../router/nav.js";
import { taggingWsUrl } from "../api/tagging.js";
import { chartsWsUrl } from "../api/charts.js";
import { prettyFileName } from "../utils/files.js";
import logoImg from "../assets/images/image.png";
import {
  INVALID_EDGE,
  VALID_EDGE,
  MM_LENS,
  MM_REVIEW_COLUMNS,
  OTHER_REVIEW_COLUMNS,
  nextId,
  restoreNodes,
  restoreEdges,
  bumpIdSeq,
  hasSavedGraph,
  seedNodes,
  updateApiPayload,
} from "../workflow/workflowUtils.js";
import { generateWorkflowFromPrompt } from "../api/workflowCopilot.js";
import {
  buildGraphFromCopilot,
  summarizeGraphForCopilot,
} from "../workflow/copilotLayout.js";

const DND_MIME = "application/x-iv-module";

// Example prompts shown in the Workflow Assistant's empty state — clicking one
// fills the input (doesn't send) so it can still be edited/combined first.
const COPILOT_SAMPLE_PROMPTS = [
  "Build a media monitoring workflow for Tesla comparing against Rivian and Lucid using Claude. Name the project 'Q3 Electric Vehicle Perception'.",
  "Create a workflow for Nike with two analysis nodes: PR Impact and Narrative Intelligence, benchmarking against Adidas and Puma using Gemini. Set client name to 'Nike Global' and layout to Editorial.",
  "Set up a Google RSS feed monitoring 'Generative AI Startups' for OpenAI, comparing with Anthropic and Cohere, using Reputation Index analysis with GPT. Output as a Bento dashboard.",
];

// Quick-select dropdowns above the input — picking a value appends a
// "Field: Value" fragment to the input for the closed-choice fields the
// copilot understands, so the user can build a request without typing lens/
// llm/layout names from memory. One compact row instead of expanded chip
// lists so it doesn't crowd out the conversation.
const COPILOT_QUICK_FIELDS = [
  { label: "Lens", icon: EyeIcon, options: LENSES.map((l) => l.label) },
  { label: "LLM", icon: BoltIcon, options: LLM_MODELS.map((m) => m.label) },
  { label: "Layout", icon: LayersIcon, options: LAYOUTS },
];

const COPILOT_BOT_NAME = "Alpha";
const COPILOT_BOT_TITLE = "Workflow Copilot";

// Only a single CSV/Excel file may be attached — anything else is rejected
// client-side before it ever reaches the Data node.
const COPILOT_FILE_EXT_RE = /\.(csv|xlsx|xls)$/i;

// Idle state for the WebSocket "job" — tagging or charts (mirrors the Review page).
const IDLE_JOB = {
  kind: null, // 'tagging' | 'charts'
  active: false,
  phase: "idle", // idle | connecting | running | complete | error
  messages: [],
  progress: { done: 0, total: 0 },
  totalArticles: 0,
  errorMsg: "",
};

// The api data sources picked on a data node. `selectedSources` is the list the
// panel writes; older graphs only carry the googleRssFeed boolean.
function selectedApiSources(data) {
  if (Array.isArray(data?.selectedSources) && data.selectedSources.length > 0) {
    return data.selectedSources.filter(Boolean);
  }
  if (Array.isArray(data?.data_sources) && data.data_sources.length > 0) {
    return data.data_sources.filter(Boolean);
  }
  if (Array.isArray(data?.api?.sources) && data.api.sources.length > 0) {
    return data.api.sources.filter(Boolean);
  }
  if (data?.googleRssFeed !== false) {
    return ["google_news"];
  }
  return [];
}

// Strip the runtime-only callbacks/flags from node data so the graph is plain
// JSON, and keep only the structural fields of each edge.
function serializeWorkflow(nodes, edges) {
  const analysisNodes = (nodes || []).filter((n) => n.type === "analysis");
  const competitorKeywordsFromAnalysis = Array.from(
    new Set(analysisNodes.flatMap((an) => an.data?.competitorKeywords || [])),
  );

  return {
    nodes: nodes.map(({ id, type, position, data }) => {
      // Drop runtime-only callbacks and derived flags (recomputed from live state on load).
      const {
        onDelete,
        onTagged,
        taggedReady,
        onViewDashboard,
        dashboardReady,
        fileObject,
        errors,
        ...rest
      } = data || {};

      // The backend expects a data node to carry either file_upload_id (file) or
      // data_sources + queries (api) — never both.
      if (type === "data") {
        if (competitorKeywordsFromAnalysis.length > 0) {
          rest.competitorKeywords = competitorKeywordsFromAnalysis;
        }
        if (rest.sourceType === "api") {
          const queryText = rest.query || (rest.brandKeywords || []).join(", ");
          const { sources, queries } = updateApiPayload(
            queryText,
            selectedApiSources(rest),
            rest.brandKeywords,
          );
          rest.data_sources = sources;
          rest.queries = queries;
          delete rest.file_upload_id;
        } else {
          delete rest.data_sources;
          delete rest.queries;
        }
        delete rest.api;
      }

      return { id, type, position, data: rest };
    }),
    edges: edges.map(
      ({ id, source, target, sourceHandle, targetHandle, className }) => ({
        id,
        source,
        target,
        sourceHandle,
        targetHandle,
        invalid: className === "wfedge--invalid",
      }),
    ),
  };
}

// Per-node required-field and connection check. Returns { [nodeId]: string[] }
// listing fields and missing/invalid connections per node (empty when valid).
// Used to highlight nodes in red and show inline messages.
function computeFieldErrors(nodes, edges = [], session) {
  const errs = {};
  const add = (id, msg) => {
    (errs[id] = errs[id] || []).push(msg);
  };
  const byId = new Map(nodes.map((n) => [n.id, n]));

  // 1. Connection / edge checks per node (Data → Analysis → Review → Assembly → Output)
  for (const node of nodes) {
    const incoming = edges.filter((e) => e.target === node.id);
    const outgoing = edges.filter((e) => e.source === node.id);

    if (node.type === "data") {
      if (outgoing.length === 0) {
        add(node.id, "Data node must connect to an Analysis node");
      } else {
        const targets = outgoing.map((e) => byId.get(e.target));
        if (!targets.some((t) => t?.type === "analysis")) {
          add(node.id, "Data node must connect to an Analysis node");
        }
      }
    } else if (node.type === "analysis") {
      if (incoming.length === 0) {
        add(
          node.id,
          "Analysis node must have an incoming connection from Data node",
        );
      } else {
        const sources = incoming.map((e) => byId.get(e.source));
        if (!sources.some((s) => s?.type === "data")) {
          add(
            node.id,
            "Analysis node must have an incoming connection from Data node",
          );
        }
      }
      if (outgoing.length === 0) {
        add(node.id, "Analysis node must connect to a Review node");
      } else {
        const targets = outgoing.map((e) => byId.get(e.target));
        if (!targets.some((t) => t?.type === "review")) {
          add(node.id, "Analysis node must connect to a Review node");
        }
      }
    } else if (node.type === "review") {
      if (incoming.length === 0) {
        add(
          node.id,
          "Review node must have an incoming connection from an Analysis node",
        );
      } else {
        const sources = incoming.map((e) => byId.get(e.source));
        if (!sources.some((s) => s?.type === "analysis")) {
          add(
            node.id,
            "Review node must have an incoming connection from an Analysis node",
          );
        }
      }
      if (outgoing.length === 0) {
        add(node.id, "Review node must connect to an Assembly node");
      } else {
        const targets = outgoing.map((e) => byId.get(e.target));
        if (!targets.some((t) => t?.type === "assembly")) {
          add(node.id, "Review node must connect to an Assembly node");
        }
      }
    } else if (node.type === "assembly") {
      if (incoming.length === 0) {
        add(
          node.id,
          "Assembly node must have an incoming connection from a Review node",
        );
      } else {
        const sources = incoming.map((e) => byId.get(e.source));
        if (!sources.some((s) => s?.type === "review")) {
          add(
            node.id,
            "Assembly node must have an incoming connection from a Review node",
          );
        }
      }
      if (outgoing.length === 0) {
        add(node.id, "Assembly node must connect to an Output node");
      } else {
        const targets = outgoing.map((e) => byId.get(e.target));
        if (!targets.some((t) => t?.type === "output")) {
          add(node.id, "Assembly node must connect to an Output node");
        }
      }
    } else if (node.type === "output") {
      if (incoming.length === 0) {
        add(
          node.id,
          "Output node must have an incoming connection from an Assembly node",
        );
      } else {
        const sources = incoming.map((e) => byId.get(e.source));
        if (!sources.some((s) => s?.type === "assembly")) {
          add(
            node.id,
            "Output node must have an incoming connection from an Assembly node",
          );
        }
      }
    }
  }

  // 2. Check for invalid edges
  for (const edge of edges) {
    const src = byId.get(edge.source);
    const tgt = byId.get(edge.target);
    if (!src || !tgt || !isEdgeValid(edge, byId)) {
      if (src) add(src.id, "Invalid connection");
      if (tgt) add(tgt.id, "Invalid connection");
    }
  }

  // 3. Per-node field checks
  const dataNode = nodes.find((n) => n.type === "data");
  if (dataNode) {
    const isApiSource = dataNode.data?.sourceType === "api";
    const selectedSources = selectedApiSources(dataNode.data);
    const hasActiveSources = selectedSources.length > 0;
    const hasFile = !!(
      dataNode.data?.fileObject ||
      dataNode.data?.file ||
      dataNode.data?.file_upload_id
    );

    if (!hasFile && !hasActiveSources) {
      add(
        dataNode.id,
        "Either File Upload or at least one Data Provider is required",
      );
    }
    if (
      (isApiSource || hasActiveSources) &&
      !dataNode.data?.query?.trim() &&
      !(dataNode.data?.queries || []).length &&
      !(dataNode.data?.brandKeywords || []).length
    )
      add(dataNode.id, "Query is required when a Data Provider is selected");
    if (!dataNode.data?.brandKeywords?.length)
      add(dataNode.id, "Brand keyword is required");
    else if (dataNode.data?.brandKeywords?.length > 1)
      add(dataNode.id, "Only one Brand keyword is allowed");
    if (!dataNode.data?.messageKeywords?.length)
      add(dataNode.id, "Message keyword is required");
  }

  const analysisNodes = nodes.filter((n) => n.type === "analysis");
  analysisNodes.forEach((analysisNode) => {
    if (!analysisNode.data?.lens)
      add(analysisNode.id, "Intelligence Lens is required");
    if (!analysisNode.data?.llm) add(analysisNode.id, "LLM Model is required");
    if (!analysisNode.data?.competitorKeywords?.length)
      add(analysisNode.id, "Competitor keyword is required");
  });
  const assemblyNode = nodes.find((n) => n.type === "assembly");
  if (assemblyNode) {
    if (!assemblyNode.data?.clientName?.trim())
      add(assemblyNode.id, "Client Name is required");
  }
  const outputNode = nodes.find((n) => n.type === "output");
  if (outputNode) {
    if (!outputNode.data?.projectName?.trim())
      add(outputNode.id, "Project Name is required");
    if (!outputNode.data?.projectDescription?.trim())
      add(outputNode.id, "Project Description is required");
  }
  return errs;
}

// Decide whether an edge is valid given the current nodes/edges. Any number of
// analysis nodes, of any lens, may share one review node.
function isEdgeValid(edge, byId) {
  const src = byId.get(edge.source);
  const tgt = byId.get(edge.target);
  return !!(src && tgt && isSerialConnection(src.type, tgt.type));
}

// Restyle every edge to reflect its current validity (red when invalid).
function markEdges(nodes, edges) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  return edges.map((e) => ({
    ...e,
    ...(isEdgeValid(e, byId) ? VALID_EDGE : INVALID_EDGE),
  }));
}

import { useOnBackHandler } from "../utils/useOnBackHandler.js";
import { cn } from "../lib/utils";

function WorkflowCanvas({
  project,
  session,
  draftData,
  theme,
  onToggleTheme,
  onBack,
  onOpenReview,
}) {
  useOnBackHandler(onBack);
  const navigate = useNavigate();
  const wrapperRef = useRef(null);
  const { screenToFlowPosition, fitView } = useReactFlow();
  console.log({ session });

  // Seed from the saved workflow if the session already has one, else the default
  // single Data node. (A fresh fetch on mount refreshes a possibly-stale prop.)
  const [nodes, setNodes, onNodesChange] = useNodesState(() => {
    if (hasSavedGraph(session?.workflow)) {
      const restored = restoreNodes(session.workflow);
      bumpIdSeq(restored);
      return restored;
    }
    return seedNodes(session);
  });
  const [edges, setEdges, onEdgesChange] = useEdgesState(() =>
    hasSavedGraph(session?.workflow) ? restoreEdges(session.workflow) : [],
  );
  const [selectedId, setSelectedId] = useState(null);
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [sectionsPrompt, setSectionsPrompt] = useState("");
  // Tutorial: guided step-by-step tour and the narrated video popup.
  const [tourOpen, setTourOpen] = useState(false);
  const [tutorialVideoOpen, setTutorialVideoOpen] = useState(false);
  const lastSavedSectionsPromptRef = useRef("");

  const saveSectionsPromptIfChanged = useCallback(
    async (targetProjectId) => {
      if (!targetProjectId) return;
      const current = (sectionsPrompt || "").trim();
      const lastSaved = (lastSavedSectionsPromptRef.current || "").trim();
      if (current && current !== lastSaved) {
        await addSectionsPrompt(targetProjectId, current);
        lastSavedSectionsPromptRef.current = current;
      }
    },
    [sectionsPrompt],
  );
  const [reviewNodeId, setReviewNodeId] = useState(null); // Review node whose popup is open
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [copilotInput, setCopilotInput] = useState("");
  const [copilotBusy, setCopilotBusy] = useState(false);
  const [copilotThread, setCopilotThread] = useState([]); // { id, role: 'user'|'assistant'|'error', text }

  const [copilotFile, setCopilotFile] = useState(null); // single CSV/Excel File attached via the paperclip button
  const [copilotPopover, setCopilotPopover] = useState(null); // which quick-select field's popover is open, or null
  const copilotMsgIdRef = useRef(0);
  const nextCopilotMsgId = () => ++copilotMsgIdRef.current;
  const copilotInputRef = useRef(null);
  const copilotFileInputRef = useRef(null);

  // Appends a "Field: Value" fragment (from a quick-select chip) or a full
  // sample prompt to whatever's already typed, instead of overwriting it, so
  // chips can be combined into one request before sending.
  const appendToCopilotInput = useCallback((fragment) => {
    setCopilotInput((prev) => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed}, ${fragment}` : fragment;
    });
    copilotInputRef.current?.focus();
  }, []);

  const handleCopilotFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;
    if (!COPILOT_FILE_EXT_RE.test(file.name)) {
      toast.error(
        "Only a single CSV or Excel (.csv, .xlsx, .xls) file is supported.",
      );
      return;
    }
    setCopilotFile(file);
  }, []);

  // Auto-grow the copilot textarea so long input stays fully visible instead
  // of scrolling out of view in a fixed-height single-line field.
  useEffect(() => {
    const el = copilotInputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [copilotInput]);
  const [job, setJob] = useState(IDLE_JOB); // tagging WebSocket progress
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false); // flip to true on first save attempt to reveal validation errors
  const [fieldErrors, setFieldErrors] = useState({}); // { [nodeId]: string[] } — missing required fields per node
  // Live session status (the prop can be stale); refreshed on mount and updated
  // when tagging/charts complete. Drives the Review node's "Tagged Data" button.
  const [liveStatus, setLiveStatus] = useState(session?.status || "");
  const [loadingDraft, setLoadingDraft] = useState(
    () => !session && !!draftData,
  );
  const wsRef = useRef(null);
  const updateProjectTimeoutRef = useRef(null);

  const [dataSourceConfirmOpen, setDataSourceConfirmOpen] = useState(false);
  const pendingSaveActionRef = useRef(null);

  const getAmbiguousDataNode = useCallback(
    (nodesToTest = nodes) => {
      const dataNode = (nodesToTest || nodes).find((n) => n.type === "data");
      if (!dataNode) return null;
      const isApiSource = dataNode.data?.sourceType === "api";
      const fileObject = dataNode.data?.fileObject;
      const hasFile = !!(
        fileObject ||
        dataNode.data?.file ||
        dataNode.data?.file_upload_id
      );

      if (!isApiSource && !hasFile) {
        return dataNode;
      }
      return null;
    },
    [nodes],
  );

  const lastSavedWfRef = useRef("");
  if (!lastSavedWfRef.current) {
    if (hasSavedGraph(session?.workflow)) {
      const restored = restoreNodes(session.workflow);
      const restoredEdges = restoreEdges(session.workflow);
      lastSavedWfRef.current = JSON.stringify(
        serializeWorkflow(restored, restoredEdges),
      );
    } else {
      lastSavedWfRef.current = JSON.stringify(
        serializeWorkflow(seedNodes(session), []),
      );
    }
  }

  // Guided-tour steps. The Data step selects the node so its panel is on screen.
  const tourSteps = useMemo(
    () =>
      buildWorkflowTourSteps({
        hasProject: !!project?.id,
        focusDataNode: () => {
          const d = nodes.find((n) => n.type === "data");
          if (!d) return;
          setSelectedId(d.id);
          try {
            fitView({ nodes: [{ id: d.id }], duration: 400, padding: 0.9 });
          } catch {
            /* canvas not ready */
          }
        },
        closePanel: () => setSelectedId(null),
      }),
    [project?.id, nodes, fitView],
  );

  const isDirty = useMemo(() => {
    const currentWf = JSON.stringify(serializeWorkflow(nodes, edges));
    const wfChanged = currentWf !== lastSavedWfRef.current;
    const promptChanged =
      (sectionsPrompt || "").trim() !==
      (lastSavedSectionsPromptRef.current || "").trim();
    const dataNode = nodes.find((n) => n.type === "data");
    const hasNewFile = !!dataNode?.data?.fileObject;
    return wfChanged || promptChanged || hasNewFile;
  }, [nodes, edges, sectionsPrompt]);

  useEffect(() => {
    if (!session && draftData && project?.id) {
      const initDraftWorkflow = async () => {
        try {
          const sessions = await listSessions(project.id);
          let baseNodes = [];
          let baseEdges = [];

          if (sessions && sessions.length > 0) {
            const latestSession = sessions[sessions.length - 1];
            if (hasSavedGraph(latestSession.workflow)) {
              baseNodes = restoreNodes(latestSession.workflow);
              baseEdges = restoreEdges(latestSession.workflow);
              bumpIdSeq(baseNodes);
            }
          }

          if (baseNodes.length === 0) {
            baseNodes = seedNodes(null);
          }

          const updatedNodes = baseNodes.map((n) => {
            if (n.type === "data") {
              return {
                ...n,
                data: {
                  ...n.data,
                  fileObject: draftData.fileObject,
                  file: draftData.fileObject ? draftData.fileObject.name : "",
                  brandKeywords: draftData.brandKeywords || [],
                  messageKeywords: draftData.messageKeywords || [],
                },
              };
            }
            if (n.type === "analysis") {
              return {
                ...n,
                data: {
                  ...n.data,
                  competitorKeywords: draftData.competitorKeywords || [],
                },
              };
            }
            return n;
          });

          setNodes(updatedNodes);
          setEdges(baseEdges);
          lastSavedWfRef.current = "";
        } catch (err) {
          console.error("Failed to initialize draft workflow:", err);
        } finally {
          setLoadingDraft(false);
        }
      };
      initDraftWorkflow();
    }
  }, [session, draftData, project?.id, setNodes, setEdges]);

  const flash = useCallback((msg) => {
    if (
      msg.toLowerCase().includes("failed") ||
      msg.toLowerCase().includes("error")
    ) {
      toast.error(msg);
    } else if (msg.endsWith("...")) {
      toast(msg, { icon: "⏳" });
    } else {
      toast.success(msg);
    }
  }, []);

  // Open a WebSocket (tagging or charts) and stream progress into `job` — same
  // protocol the Review page uses: start / batch / progress / complete / error.
  const runJob = useCallback(
    (kind, url, onDone, targetSessionId) => {
      const activeSessionId = targetSessionId || session?.id;
      if (!activeSessionId) return;
      try {
        wsRef.current?.close();
      } catch {
        /* already closed */
      }
      setJob({ ...IDLE_JOB, kind, active: true, phase: "connecting" });
      const push = (text) =>
        setJob((j) => ({ ...j, messages: [...j.messages, text] }));
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setJob((j) => ({ ...j, phase: "running" }));
        push(
          kind === "charts"
            ? "Connected — Building Dashboards"
            : "Connected — Starting Tagging Agent",
        );
        ws.send(JSON.stringify({ session_id: activeSessionId }));
      };
      ws.onmessage = (ev) => {
        let msg;
        try {
          msg = JSON.parse(ev.data);
        } catch {
          return;
        }
        switch (msg.type) {
          case "start":
            setJob((j) => ({ ...j, totalArticles: msg.total_articles || 0 }));
            push(
              kind === "charts"
                ? `Crunching ${msg.total_articles} articles across ${(msg.dashboards || []).length} dashboards…`
                : `Tagging ${msg.total_articles} articles…`,
            );
            break;
          case "batch":
            setJob((j) => ({
              ...j,
              progress: {
                done: msg.completed_batches || 0,
                total: msg.total_batches || 0,
              },
            }));
            push(
              `Batch ${(msg.batch_index ?? 0) + 1} done — ${msg.completed_batches}/${msg.total_batches} batches (${msg.tagged_count} tagged)`,
            );
            break;
          case "progress":
            push(msg.message || "Working…");
            break;
          case "complete":
            setJob((j) => ({
              ...j,
              phase: "complete",
              progress: {
                done: j.progress.total || j.progress.done,
                total: j.progress.total || j.progress.done,
              },
            }));
            push(
              kind === "charts"
                ? `Dashboards ready${msg.elapsed_seconds ? ` in ${msg.elapsed_seconds}s` : ""}.`
                : `Completed ${msg.total_tagged} articles in ${msg.elapsed_seconds}s.`,
            );
            onDone?.(msg);
            break;
          case "error":
            setJob((j) => ({
              ...j,
              phase: "error",
              errorMsg: msg.detail || "Something went wrong.",
            }));
            push(`Error: ${msg.detail}`);
            break;
          default:
            break;
        }
      };
      ws.onerror = () => {
        setJob((j) =>
          j.phase === "complete"
            ? j
            : {
                ...j,
                phase: "error",
                errorMsg:
                  j.errorMsg || "Connection error — is the backend running?",
              },
        );
      };
    },
    [session],
  );

  const startTagging = useCallback(
    (targetSessionId) =>
      runJob(
        "tagging",
        taggingWsUrl(),
        () => setLiveStatus("Tagged"),
        targetSessionId,
      ),
    [runJob],
  );
  const startCharts = useCallback(
    (targetSessionId) =>
      runJob(
        "charts",
        chartsWsUrl(),
        () => {
          setLiveStatus("Completed");
          flash("Dashboards generated.");
        },
        targetSessionId,
      ),
    [runJob, flash],
  );

  // Open the dashboards page in a new tab via its real URL — the new tab loads
  // the project/session/charts by the ids in the path.
  const openDashboards = useCallback(() => {
    if (!project?.id || !session?.id) return;
    window.open(
      `${window.location.origin}/${project.id}/sessions/${session.id}/dashboards`,
      "_blank",
      "noopener",
    );
  }, [project, session]);

  // Dashboards are ready once the charts job completes (this run) or the session
  // is already Completed. Reflect that as a "View Dashboard" button on Output nodes.
  const dashboardsReady =
    (job.kind === "charts" && job.phase === "complete") ||
    (liveStatus || "").toLowerCase() === "completed";

  // Helper to validate and save/create project/session if in draft mode
  // Centered validator to enforce required nodes/fields and connection validity.
  const validateWorkflow = useCallback(
    (nodesToValidate = nodes) => {
      setSubmitted(true);

      // 1. All 5 node types are required in the pipeline sequence: Data → Analysis → Review → Assembly → Output
      const activeNodes = nodesToValidate;
      const dataNode = activeNodes.find((n) => n.type === "data");
      const analysisNode = activeNodes.find((n) => n.type === "analysis");
      const reviewNode = activeNodes.find((n) => n.type === "review");
      const assemblyNode = activeNodes.find((n) => n.type === "assembly");
      const outputNode = activeNodes.find((n) => n.type === "output");

      if (!dataNode) {
        throw new Error("Please add a Data node to the workflow.");
      }
      if (!analysisNode) {
        throw new Error("Please add an Analysis node to the workflow.");
      }
      if (!reviewNode) {
        throw new Error("Please add a Review node to the workflow.");
      }
      if (!assemblyNode) {
        throw new Error("Please add an Assembly node to the workflow.");
      }
      if (!outputNode) {
        throw new Error("Please add an Output node to the workflow.");
      }

      // 2. Per-node field and connection errors check
      const errs = computeFieldErrors(activeNodes, edges, session);
      setFieldErrors(errs);
      if (Object.keys(errs).length > 0) {
        throw new Error(
          "Please fix the highlighted issues and connect all nodes before proceeding.",
        );
      }

      // 3. Connection check (edges)
      const byId = new Map(activeNodes.map((n) => [n.id, n]));
      for (const edge of edges) {
        if (!isEdgeValid(edge, byId)) {
          throw new Error(
            "Connection error: Nodes must connect in order: Data → Analysis → Review → Assembly → Output.",
          );
        }
      }

      // 4. End-to-end path reachability check from Data to Output
      const dataNodeIds = new Set(
        activeNodes.filter((n) => n.type === "data").map((n) => n.id),
      );
      const outputNodeIds = new Set(
        activeNodes.filter((n) => n.type === "output").map((n) => n.id),
      );
      const adj = new Map();
      for (const edge of edges) {
        if (!adj.has(edge.source)) adj.set(edge.source, []);
        adj.get(edge.source).push(edge.target);
      }
      let pathFound = false;
      const queue = Array.from(dataNodeIds);
      const visited = new Set();
      while (queue.length > 0) {
        const curr = queue.shift();
        if (outputNodeIds.has(curr)) {
          pathFound = true;
          break;
        }
        if (!visited.has(curr)) {
          visited.add(curr);
          const neighbors = adj.get(curr) || [];
          for (const neighbor of neighbors) {
            if (!visited.has(neighbor)) queue.push(neighbor);
          }
        }
      }
      if (!pathFound) {
        throw new Error(
          "Connection error: The workflow must have a complete connected path from Data node to Output node.",
        );
      }

      // 3. Fields check
      const isApiSource = dataNode.data?.sourceType === "api";
      const selectedSources = selectedApiSources(dataNode.data);
      const hasApiSources = selectedSources.length > 0;
      const fileObject = dataNode.data?.fileObject;
      const hasFile = !!(
        fileObject ||
        dataNode.data?.file ||
        dataNode.data?.file_upload_id
      );

      if (!hasFile && !hasApiSources) {
        throw new Error(
          "Either File Upload or at least one Data Provider is required in the Data node settings.",
        );
      }

      if (
        (isApiSource || hasApiSources) &&
        !dataNode.data?.query?.trim() &&
        !(dataNode.data?.queries || []).length &&
        !(dataNode.data?.brandKeywords || []).length
      ) {
        throw new Error(
          "Please enter a Query in the Data node settings when a Data Provider is selected.",
        );
      }
      const errors = dataNode.data?.errors || [];
      if (errors.includes("Unbalanced parentheses in Query")) {
        throw new Error(
          "Query has unbalanced parentheses in the Data node settings.",
        );
      }

      const brandKeywords = dataNode.data?.brandKeywords || [];
      if (brandKeywords.length === 0) {
        throw new Error(
          "Please enter at least one brand keyword in the Data node settings.",
        );
      }

      const analysisNodes = nodes.filter((n) => n.type === "analysis");
      for (const an of analysisNodes) {
        if (!an.data?.lens) {
          throw new Error(
            "Please select an Intelligence Lens for all Analysis nodes in the workflow.",
          );
        }
        const compKw = an.data?.competitorKeywords || [];
        if (compKw.length === 0) {
          throw new Error(
            "Please enter at least one competitor keyword in the Analysis node settings.",
          );
        }
      }

      const competitorKeywords = Array.from(
        new Set(
          analysisNodes.flatMap((an) => an.data?.competitorKeywords || []),
        ),
      );

      const selectedLenses = analysisNodes
        .map((n) => n.data?.lens)
        .filter(Boolean);
      const uniqueLenses = new Set(selectedLenses);
      if (uniqueLenses.size < selectedLenses.length) {
        throw new Error(
          "Each Analysis node must have a unique Intelligence Lens selected.",
        );
      }

      const messageKeywords = dataNode.data?.messageKeywords || [];
      if (messageKeywords.length === 0) {
        throw new Error(
          "Please enter at least one message keyword in the Data node settings.",
        );
      }

      const projectName = outputNode.data?.projectName?.trim();
      if (!projectName) {
        throw new Error(
          "Please enter a Project Name in the Output node settings.",
        );
      }

      const projectDescription = outputNode.data?.projectDescription?.trim();
      if (!projectDescription) {
        throw new Error(
          "Please enter a Project Description in the Output node settings.",
        );
      }

      return {
        fileObject,
        brandKeywords,
        competitorKeywords,
        messageKeywords,
        projectName,
        projectDescription,
      };
    },
    [nodes, edges, session],
  );

  // Helper to validate and save/create project/session if in draft mode
  const ensureProjectAndSession = useCallback(
    async (validated, nodesToUse = nodes) => {
      const {
        fileObject,
        brandKeywords,
        competitorKeywords,
        messageKeywords,
        projectName,
        projectDescription,
      } = validated;

      // Already have a session and no new file — return immediately
      if (session?.id && !fileObject)
        return {
          projectId: project.id,
          sessionId: session.id,
          freshProject: project,
          freshSession: session,
        };

      let targetProjectId = project?.id;
      let freshProj = project;

      // ── Project: create or update ────────────────────────────────────────
      if (!targetProjectId) {
        flash("Creating project...");
        freshProj = await createProject({
          name: projectName,
          description: projectDescription,
        });
        targetProjectId = freshProj.id;
        await saveSectionsPromptIfChanged(targetProjectId).catch(console.error);
      } else {
        if (
          projectName !== project.name ||
          projectDescription !== project.description
        ) {
          flash("Updating project details...");
          await updateProject(targetProjectId, {
            name: projectName,
            description: projectDescription,
          });
          project.name = projectName;
          project.description = projectDescription;
        }
        await saveSectionsPromptIfChanged(targetProjectId).catch(console.error);
      }

      // ── Determine the data-source type from the data node ────────────────
      const dataNode = nodesToUse.find((n) => n.type === "data");
      const isApiSource = dataNode?.data?.sourceType === "api";

      let latestSession = null;

      if (fileObject) {
        // ── PATH A: File upload ─────────────────────────────────────────────
        // Upload file to get file_upload_id, attach to nodes, then create session.
        flash("Uploading file...");
        const uploadRes = await uploadFile({
          projectId: targetProjectId,
          file: fileObject,
          brandKeywords,
          competitorKeywords,
          messageKeywords,
        });

        const fileUploadId = uploadRes?.file_upload_id;
        const updatedNodes = nodesToUse.map((n) =>
          n.type === "data"
            ? {
                ...n,
                data: {
                  ...n.data,
                  file_upload_id: fileUploadId || n.data?.file_upload_id,
                },
              }
            : n,
        );
        setNodes(updatedNodes);

        flash("Creating session...");
        const res = await createSession({
          projectId: targetProjectId,
          workflow: serializeWorkflow(updatedNodes, edges),
        });
        const createdSessionId = res?.session_id || res?.id;
        if (createdSessionId)
          latestSession = await getSession(createdSessionId).catch(() => null);
        if (!latestSession && (res?.id || res?.session_id)) {
          latestSession = res.id ? res : { id: res.session_id, ...res };
        }
        if (!latestSession) {
          const sessions = await listSessions(targetProjectId);
          if (sessions?.length)
            latestSession =
              sessions.find((s) => s.id === createdSessionId) || sessions[0];
        }

        return {
          projectId: targetProjectId,
          sessionId: latestSession.id,
          freshProject: freshProj,
          freshSession: latestSession,
          freshNodes: updatedNodes,
        };
      } else if (isApiSource) {
        // ── PATH B: Google / API source ─────────────────────────────────────
        // Backend reads brand/competitor keywords off the serialised workflow graph.
        flash("Creating session...");
        const res = await createSession({
          projectId: targetProjectId,
          workflow: serializeWorkflow(nodesToUse, edges),
        });
        const createdSessionId = res?.session_id || res?.id;
        if (createdSessionId)
          latestSession = await getSession(createdSessionId).catch(() => null);
        if (!latestSession && (res?.id || res?.session_id)) {
          latestSession = res.id ? res : { id: res.session_id, ...res };
        }
        if (!latestSession) {
          const sessions = await listSessions(targetProjectId);
          if (sessions?.length)
            latestSession =
              sessions.find((s) => s.id === createdSessionId) || sessions[0];
        }
      } else {
        // ── PATH C: No-file session (fallback) ──────────────────────────────
        // Workflow-based — same as Google/API path.
        flash("Creating session...");
        const res = await createSession({
          projectId: targetProjectId,
          workflow: serializeWorkflow(nodesToUse, edges),
        });
        const createdSessionId = res?.session_id || res?.id;
        if (createdSessionId)
          latestSession = await getSession(createdSessionId).catch(() => null);
        if (!latestSession && (res?.id || res?.session_id)) {
          latestSession = res.id ? res : { id: res.session_id, ...res };
        }
        if (!latestSession) {
          const sessions = await listSessions(targetProjectId);
          if (sessions?.length)
            latestSession =
              sessions.find((s) => s.id === createdSessionId) || sessions[0];
        }
      }

      if (!latestSession)
        throw new Error("Could not create or locate session for the project.");

      return {
        projectId: targetProjectId,
        sessionId: latestSession.id,
        freshProject: freshProj,
        freshSession: latestSession,
        freshNodes: nodesToUse,
      };
    },
    [session, project, flash, sectionsPrompt, nodes, edges],
  );

  // Save Workflow: persist the graph only — no tagging/charts WebSocket.
  const handleSaveWorkflow = useCallback(
    async (skipAmbigCheck = false, overrideNodes = null) => {
      if (saving) return;

      const activeNodes = overrideNodes || nodes;

      if (!skipAmbigCheck) {
        const ambigNode = getAmbiguousDataNode(activeNodes);
        if (ambigNode) {
          pendingSaveActionRef.current = "save";
          setDataSourceConfirmOpen(true);
          return;
        }
      }

      setSubmitted(true);
      const errs = computeFieldErrors(activeNodes, edges, session);
      setFieldErrors(errs);
      if (Object.keys(errs).length > 0) {
        toast.error(
          "Please fix the highlighted issues and connect all nodes before saving.",
        );
        return;
      }

      try {
        const validated = validateWorkflow(activeNodes);
        setSaving(true);
        const {
          projectId: pid,
          sessionId: sid,
          freshProject,
          freshSession,
          freshNodes,
        } = await ensureProjectAndSession(validated, activeNodes);
        const finalNodes = freshNodes || activeNodes;
        const serialized = serializeWorkflow(finalNodes, edges);
        await saveWorkflow(sid, serialized);
        lastSavedWfRef.current = JSON.stringify(serialized);
        invalidateSessionCache(sid);
        const latestSess = await getSession(sid).catch(() => null);
        if (latestSess) {
          seedSession(sid, latestSess);
        }
        setNodes((prevNodes) =>
          prevNodes.map((n) =>
            n.type === "data" && n.data?.fileObject
              ? { ...n, data: { ...n.data, fileObject: undefined } }
              : n,
          ),
        );

        // If project metadata changed, update the project details
        const outputNode = finalNodes.find((n) => n.type === "output");
        const newName = outputNode?.data?.projectName?.trim();
        const newDesc = outputNode?.data?.projectDescription?.trim();
        if (
          pid &&
          (newName !== project?.name || newDesc !== project?.description)
        ) {
          await updateProject(pid, { name: newName, description: newDesc });
          if (project) {
            project.name = newName;
            project.description = newDesc;
          }
        }

        // Save sections prompt if changed
        await saveSectionsPromptIfChanged(pid).catch(console.error);

        flash("Workflow saved.");
        if (!session?.id) {
          navigate(paths.workflow(pid, sid), {
            replace: true,
            state: {
              project: freshProject,
              session: latestSess || freshSession,
            },
          });
        }
      } catch (err) {
        toast.error(err.message);
      } finally {
        setSaving(false);
      }
    },
    [
      saving,
      getAmbiguousDataNode,
      validateWorkflow,
      ensureProjectAndSession,
      saveSectionsPromptIfChanged,
      nodes,
      edges,
      project,
      session,
      flash,
      navigate,
      session?.id,
    ],
  );

  // Save & Tag: persist the workflow graph, then kick off tagging.
  const handleSaveAndTag = useCallback(
    async (skipAmbigCheck = false, overrideNodes = null) => {
      if (saving || job.active) return;

      const activeNodes = overrideNodes || nodes;

      if (!skipAmbigCheck) {
        const ambigNode = getAmbiguousDataNode(activeNodes);
        if (ambigNode) {
          pendingSaveActionRef.current = "saveAndTag";
          setDataSourceConfirmOpen(true);
          return;
        }
      }

      // Per-node required-field and connection check first — highlight nodes + inline messages
      // instead of stopping at the first missing field.
      setSubmitted(true);
      const errs = computeFieldErrors(activeNodes, edges, session);
      setFieldErrors(errs);
      if (Object.keys(errs).length > 0) {
        toast.error(
          "Please fix the highlighted issues and connect all nodes before proceeding.",
        );
        return;
      }

      try {
        const validated = validateWorkflow(activeNodes);

        const currentWfSerialized = JSON.stringify(
          serializeWorkflow(activeNodes, edges),
        );
        const isDirty = lastSavedWfRef.current !== currentWfSerialized;

        const dataNode = activeNodes.find((n) => n.type === "data");
        const hasNewFile = !!dataNode?.data?.fileObject;

        const outputNode = activeNodes.find((n) => n.type === "output");
        const newName = outputNode?.data?.projectName?.trim();
        const newDesc = outputNode?.data?.projectDescription?.trim();
        const projectMetadataChanged =
          project?.id &&
          (newName !== project.name || newDesc !== project.description);

        const hasAnyChanges = isDirty || hasNewFile || projectMetadataChanged;

        if (!hasAnyChanges && session?.id) {
          flash("Workflow already saved — starting tagging...");
          navigate(paths.review(project.id, session.id), {
            state: {
              project,
              session,
              runTagging: true,
            },
          });
          return;
        }

        setSaving(true);
        const {
          projectId: pid,
          sessionId: sid,
          freshProject,
          freshSession,
          freshNodes,
        } = await ensureProjectAndSession(validated, activeNodes);
        const finalNodes = freshNodes || activeNodes;
        const serialized = serializeWorkflow(finalNodes, edges);
        await saveWorkflow(sid, serialized);
        lastSavedWfRef.current = JSON.stringify(serialized);
        invalidateSessionCache(sid);
        const latestSess = await getSession(sid).catch(() => null);
        if (latestSess) {
          seedSession(sid, latestSess);
        }
        setNodes((prevNodes) =>
          prevNodes.map((n) =>
            n.type === "data" && n.data?.fileObject
              ? { ...n, data: { ...n.data, fileObject: undefined } }
              : n,
          ),
        );

        if (projectMetadataChanged || (!session?.id && pid)) {
          await updateProject(pid, {
            name: newName,
            description: newDesc,
          });
          if (project) {
            project.name = newName;
            project.description = newDesc;
          }
        }

        // Save sections prompt if changed
        await saveSectionsPromptIfChanged(pid).catch(console.error);

        flash("Workflow saved — starting tagging...");
        navigate(paths.review(pid, sid), {
          state: {
            project: freshProject || project,
            session: latestSess || freshSession || session,
            runTagging: true,
          },
        });
      } catch (err) {
        toast.error(err.message);
      } finally {
        setSaving(false);
      }
    },
    [
      saving,
      job.active,
      getAmbiguousDataNode,
      validateWorkflow,
      ensureProjectAndSession,
      saveSectionsPromptIfChanged,
      nodes,
      edges,
      project,
      session,
      flash,
      navigate,
    ],
  );

  const handleConfirmUploadFile = useCallback(() => {
    const dataNode = nodes.find((n) => n.type === "data");
    setDataSourceConfirmOpen(false);
    pendingSaveActionRef.current = null;
    if (dataNode) {
      setSelectedId(dataNode.id);
    }
    setTimeout(() => {
      const fileInput = document.getElementById("wf-file-upload");
      if (fileInput) {
        fileInput.click();
      }
    }, 150);
  }, [nodes]);

  const handleConfirmProceedApi = useCallback(() => {
    const action = pendingSaveActionRef.current;
    setDataSourceConfirmOpen(false);
    pendingSaveActionRef.current = null;

    const updatedNodes = nodes.map((n) => {
      if (n.type !== "data") return n;
      const sources =
        selectedApiSources(n.data).length > 0
          ? selectedApiSources(n.data)
          : ["google_news"];
      const apiPayload = updateApiPayload(
        n.data?.query || "",
        sources,
        n.data?.brandKeywords || [],
      );
      return {
        ...n,
        data: {
          ...n.data,
          sourceType: "api",
          googleRssFeed: sources.includes("google_news"),
          selectedSources: sources,
          api: apiPayload,
        },
      };
    });
    setNodes(updatedNodes);

    if (action === "save") {
      handleSaveWorkflow(true, updatedNodes);
    } else if (action === "saveAndTag") {
      handleSaveAndTag(true, updatedNodes);
    }
  }, [handleSaveWorkflow, handleSaveAndTag, nodes, setNodes]);

  const handleStartCharts = useCallback(async () => {
    const currentWfSerialized = JSON.stringify(serializeWorkflow(nodes, edges));
    const isDirty = lastSavedWfRef.current !== currentWfSerialized;

    const dataNode = nodes.find((n) => n.type === "data");
    const hasNewFile = !!dataNode?.data?.fileObject;

    const outputNode = nodes.find((n) => n.type === "output");
    const newName = outputNode?.data?.projectName?.trim();
    const newDesc = outputNode?.data?.projectDescription?.trim();
    const projectMetadataChanged =
      project?.id &&
      (newName !== project.name || newDesc !== project.description);

    const hasAnyChanges = isDirty || hasNewFile || projectMetadataChanged;

    if (!hasAnyChanges && session?.id) {
      flash("Navigating to dashboards...");
      navigate(paths.dashboards(project.id, session.id), {
        state: { project, session },
      });
      return;
    }

    await handleSaveAndTag();
  }, [nodes, edges, session, project, navigate, flash, handleSaveAndTag]);

  // Close the socket if the screen unmounts mid-run.
  useEffect(
    () => () => {
      try {
        wsRef.current?.close();
      } catch {
        /* already closed */
      }
      if (updateProjectTimeoutRef.current) {
        clearTimeout(updateProjectTimeoutRef.current);
      }
    },
    [],
  );

  // Edges are allowed regardless of order, but an out-of-sequence link (e.g.
  // Data → Review) is flagged red so the problem is visible.
  const onConnect = useCallback(
    (params) => {
      const src = nodes.find((n) => n.id === params.source);
      const tgt = nodes.find((n) => n.id === params.target);
      const reason =
        src && tgt && isSerialConnection(src.type, tgt.type)
          ? null
          : "Nodes must connect in order: Data → Analysis → Review → Assembly → Output.";
      setEdges((eds) => markEdges(nodes, addEdge({ ...params }, eds)));
      if (reason) flash(reason);
    },
    [nodes, setEdges, flash],
  );

  // Re-validate edges whenever nodes change, recoloring any that become
  // valid/invalid.
  useEffect(() => {
    setEdges((eds) => {
      const marked = markEdges(nodes, eds);
      const changed = marked.some((m, i) => m.className !== eds[i].className);
      return changed ? marked : eds;
    });
  }, [nodes, setEdges]);

  // Auto-format: arrange nodes into pipeline columns (Data → Analysis → Review →
  // Assembly → Output), stacking same-type nodes vertically and centering columns.
  const autoLayout = useCallback(() => {
    const COL_W = 320;
    const ROW_H = 210;
    const X0 = 60;
    const Y0 = 40;
    setNodes((nds) => {
      const byType = new Map(NODE_ORDER.map((t) => [t, []]));
      nds.forEach((n) => {
        if (byType.has(n.type)) byType.get(n.type).push(n);
      });
      const maxCount = Math.max(
        1,
        ...[...byType.values()].map((a) => a.length),
      );
      return nds.map((n) => {
        const col = NODE_ORDER.indexOf(n.type);
        if (col < 0) return n;
        const arr = byType.get(n.type);
        const idx = arr.indexOf(n);
        const startY = Y0 + ((maxCount - arr.length) * ROW_H) / 2;
        return {
          ...n,
          position: { x: X0 + col * COL_W, y: startY + idx * ROW_H },
        };
      });
    });
    // Refit once the new positions have applied.
    window.setTimeout(() => {
      try {
        fitView({ padding: 0.2, duration: 400 });
      } catch {
        /* view not ready */
      }
    }, 60);
  }, [setNodes, fitView]);

  const deleteNode = useCallback(
    (id) => {
      setNodes((nds) => nds.filter((n) => n.id !== id));
      setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
      setSelectedId((cur) => (cur === id ? null : cur));
    },
    [setNodes, setEdges],
  );

  // Re-attach the runtime callbacks/flags that aren't persisted (so restored
  // nodes are interactive), keep the Review node's taggedReady in sync with
  // the live session status, and reflect dashboard readiness on Output nodes.
  // Consolidated into one pass (was three separate effects, each independently
  // watching `nodes` and calling `setNodes` — that chain of effect-triggers-
  // effect caused a burst of redundant re-renders on every mount/restore).
  const handleOpenReviewNode = useCallback(
    (id) => {
      if (
        saving ||
        (job.active && (job.phase === "connecting" || job.phase === "running"))
      ) {
        toast.error(
          "Process is currently running. Please wait for it to complete before navigating.",
        );
        return;
      }
      setSubmitted(true);
      const errs = computeFieldErrors(nodes, edges, session);
      setFieldErrors(errs);
      if (Object.keys(errs).length > 0) {
        toast.error(
          "Please fix the highlighted issues and connect all nodes before proceeding.",
        );
        return;
      }
      try {
        validateWorkflow();
      } catch (err) {
        toast.error(err.message);
        return;
      }
      if (isDirty) {
        toast.error(
          "Please save the agent for the new changes that are applied before proceeding.",
        );
        return;
      }
      setReviewNodeId(id);
    },
    [
      isDirty,
      saving,
      job.active,
      job.phase,
      nodes,
      edges,
      session,
      validateWorkflow,
    ],
  );

  // Idempotent — only patches what changed.
  useEffect(() => {
    const taggedReady = ["tagged", "completed"].includes(
      (liveStatus || "").toLowerCase(),
    );
    setNodes((nds) => {
      let changed = false;
      const next = nds.map((n) => {
        const patch = {};
        // if (n.type !== "data" && !n.data.onDelete)
        if (!n.data.onDelete) patch.onDelete = () => deleteNode(n.id);
        if (n.type === "review") {
          if (!n.data.onTagged)
            patch.onTagged = () => handleOpenReviewNode(n.id);
          if (n.data.taggedReady !== taggedReady)
            patch.taggedReady = taggedReady;
        }
        if (n.type === "output") {
          const hasCb = !!n.data.onViewDashboard;
          const readyMatches =
            !!n.data.dashboardReady === dashboardsReady &&
            (!dashboardsReady || hasCb);
          if (!readyMatches) {
            patch.dashboardReady = dashboardsReady;
            patch.onViewDashboard = dashboardsReady
              ? openDashboards
              : undefined;
          }
        }
        if (Object.keys(patch).length === 0) return n;
        changed = true;
        return { ...n, data: { ...n.data, ...patch } };
      });
      return changed ? next : nds;
    });
  }, [
    nodes,
    deleteNode,
    liveStatus,
    dashboardsReady,
    openDashboards,
    setNodes,
    handleOpenReviewNode,
  ]);

  // Once the user has attempted a save, keep the per-node field errors in sync
  // as they fill things in — so borders/messages clear the moment a field is valid.
  useEffect(() => {
    if (!submitted) return;
    setFieldErrors(computeFieldErrors(nodes, edges, session));
  }, [nodes, edges, submitted, session]);

  // On mount, refresh the live status + latest saved workflow (the session prop
  // in sessionStorage can predate the last save/tagging run).
  useEffect(() => {
    if (!session?.id) return;
    let cancelled = false;

    const sessionPromise = getSession(session.id);
    const projectPromise = project?.id
      ? getProject(project.id)
      : Promise.resolve(null);

    Promise.all([sessionPromise, projectPromise])
      .then(([fresh, projDetail]) => {
        if (cancelled) return;
        if (fresh) {
          if (fresh.status) setLiveStatus(fresh.status);

          let restored = [];
          let restoredEdges = [];
          if (hasSavedGraph(fresh.workflow)) {
            restored = restoreNodes(fresh.workflow);
            bumpIdSeq(restored);
            restoredEdges = restoreEdges(fresh.workflow);
          } else {
            restored = seedNodes(session);
          }

          // If project detail was fetched, merge it into the output node
          if (projDetail) {
            restored = restored.map((n) => {
              if (n.type === "output") {
                return {
                  ...n,
                  data: {
                    ...n.data,
                    projectName: projDetail.name || "",
                    projectDescription: projDetail.description || "",
                  },
                };
              }
              return n;
            });
            // Pre-populate the sections prompt from saved project data
            if (projDetail.monitoring_sections_prompt) {
              const savedVal = projDetail.monitoring_sections_prompt;
              setSectionsPrompt(savedVal);
              lastSavedSectionsPromptRef.current = (savedVal || "").trim();
            }
          }

          setNodes(restored);
          setEdges(restoredEdges);
          lastSavedWfRef.current = JSON.stringify(
            serializeWorkflow(restored, restoredEdges),
          );
        }
      })
      .catch((err) => {
        console.error("Mount initialization failed:", err);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Attach the static per-node flags that depend on the session.
  const withCallbacks = useCallback(
    (type, data) => {
      if (type === "review") {
        const status = (liveStatus || "").toLowerCase();
        const taggedReady = status === "tagged" || status === "completed";
        return { ...data, taggedReady };
      }
      return data;
    },
    [liveStatus],
  );

  const handleCopilotPrompt = useCallback(
    async (rawPrompt) => {
      const prompt = (rawPrompt || "").trim();
      if (!prompt || copilotBusy) return;

      const threadHistory = copilotThread
        .filter((m) => m.role === "user" || m.role === "assistant")
        .slice(-6)
        .map((m) => ({ role: m.role, content: m.text }));
      const currentSummary = summarizeGraphForCopilot(nodes);

      setCopilotThread((t) => [
        ...t,
        { id: nextCopilotMsgId(), role: "user", text: prompt },
      ]);
      setCopilotInput("");
      setCopilotBusy(true);

      try {
        const raw = await generateWorkflowFromPrompt(prompt, {
          thread: threadHistory,
          currentSummary,
        });

        if (raw.clarify) {
          setCopilotThread((t) => [
            ...t,
            { id: nextCopilotMsgId(), role: "assistant", text: raw.clarify },
          ]);
          return;
        }

        const { nodes: builtNodes, edges: builtEdges } = buildGraphFromCopilot(
          raw.nodes,
        );

        const withRuntime = builtNodes.map((n) => {
          let data = withCallbacks(n.type, n.data);
          if (n.type === "data" && copilotFile) {
            data = {
              ...data,
              sourceType: "file",
              file: copilotFile.name,
              fileObject: copilotFile,
              googleRssFeed: false,
              query: "",
            };
          }
          data.onDelete = () => deleteNode(n.id);
          if (n.type === "review")
            data.onTagged = () => handleOpenReviewNode(n.id);
          return { ...n, data };
        });

        setSubmitted(false);
        setFieldErrors({});
        setNodes(withRuntime);
        setEdges(builtEdges);
        setSelectedId(null);
        window.setTimeout(autoLayout, 0);

        const analysisNodes = withRuntime.filter((n) => n.type === "analysis");
        const reviewNodes = withRuntime.filter((n) => n.type === "review");
        const assemblyNode = withRuntime.find((n) => n.type === "assembly");
        const lensSummary = analysisNodes
          .map((n) => lensLabel(n.data.lens) || tier1Label(n.data.lens) || n.data.lens)
          .filter(Boolean)
          .join(", ");
        const fileNote = copilotFile
          ? ` Data source: uploaded file "${copilotFile.name}".`
          : "";
        const summary = `Built a workflow: Data → ${analysisNodes.length} Analysis node${analysisNodes.length === 1 ? "" : "s"}${lensSummary ? ` (${lensSummary})` : ""} → ${reviewNodes.length} Review node${reviewNodes.length === 1 ? "" : "s"} → Assembly (${assemblyNode?.data?.layout || "Classic"}) → Output.${fileNote}`;
        setCopilotThread((t) => [
          ...t,
          { id: nextCopilotMsgId(), role: "assistant", text: summary },
        ]);
        setCopilotFile(null);
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
      copilotThread,
      copilotFile,
      nodes,
      withCallbacks,
      deleteNode,
      handleOpenReviewNode,
      setNodes,
      setEdges,
      autoLayout,
      flash,
    ],
  );

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const type = event.dataTransfer.getData(DND_MIME);
      if (!type) return;
      // Exactly one Data node per workflow — the one seeded from the file.
      // if (type === "data") {
      //   flash("A workflow can only have one Data node.");
      //   return;
      // }
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      const id = nextId(type);
      let extra = {};
      if (type === "output") {
        extra = {
          label: project?.name || "Output",
          projectName: project?.name || "",
          projectDescription: project?.description || "",
        };
      } else if (type === "analysis") {
        const existingAnalysis = nodes.find((n) => n.type === "analysis");
        const dataNode = nodes.find((n) => n.type === "data");

        const compKw =
          existingAnalysis?.data?.competitorKeywords ||
          dataNode?.data?.competitorKeywords ||
          session?.competitor_keywords ||
          draftData?.competitorKeywords ||
          [];
        const llmVal = existingAnalysis?.data?.llm || "";
        const applyAll =
          existingAnalysis?.data?.applyCompetitorsToAll !== false;

        extra = {
          competitorKeywords: compKw,
          llm: llmVal,
          applyCompetitorsToAll: applyAll,
        };
      }
      const data = withCallbacks(type, defaultNodeData(type, extra));
      data.onDelete = () => deleteNode(id); // every dropped node is removable
      if (type === "review") data.onTagged = () => handleOpenReviewNode(id); // open the Review popup
      setSubmitted(false);
      setFieldErrors({});
      setNodes((nds) => {
        if (nds.length > 0) {
          const lastNode = nds[nds.length - 1];
          if (isSerialConnection(lastNode.type, type)) {
            setEdges((eds) => [
              ...eds,
              {
                id: `e_${lastNode.id}_${id}`,
                source: lastNode.id,
                target: id,
              },
            ]);
          }
        }
        return nds.concat({ id, type, position, data });
      });
      setSelectedId(id);

      // Auto zoom / center the newly added node into viewport
      setTimeout(() => {
        try {
          fitView({ nodes: [{ id }], duration: 600, padding: 0.8 });
        } catch {
          fitView({ duration: 600, padding: 0.3 });
        }
      }, 50);
    },
    [
      screenToFlowPosition,
      setNodes,
      setEdges,
      withCallbacks,
      project,
      session,
      draftData,
      flash,
      deleteNode,
      nodes,
      fitView,
    ],
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedId) || null,
    [nodes, selectedId],
  );

  // Inject per-node validation errors into node data for rendering only (kept
  // out of `nodes` state so they're never serialized/saved).
  const nodesWithErrors = useMemo(
    () =>
      nodes.map((n) =>
        fieldErrors[n.id]?.length
          ? { ...n, data: { ...n.data, errors: fieldErrors[n.id] } }
          : n,
      ),
    [nodes, fieldErrors],
  );

  const updateNodeData = useCallback(
    (patch) => {
      if (!selectedId) return;

      setNodes((nds) => {
        const targetNode = nds.find((n) => n.id === selectedId);
        if (!targetNode) return nds;

        const nextTargetData = { ...targetNode.data, ...patch };

        if (targetNode.type === "analysis") {
          const isTargetSynced = nextTargetData.applyCompetitorsToAll !== false;
          const updatedKeywords = nextTargetData.competitorKeywords || [];
          const updatedLlm = nextTargetData.llm || "";

          return nds.map((n) => {
            if (n.id === selectedId) {
              return { ...n, data: nextTargetData };
            }
            if (n.type === "data") {
              return {
                ...n,
                data: {
                  ...n.data,
                  competitorKeywords: updatedKeywords,
                },
              };
            }
            if (
              n.type === "analysis" &&
              isTargetSynced &&
              n.data?.applyCompetitorsToAll !== false
            ) {
              return {
                ...n,
                data: {
                  ...n.data,
                  competitorKeywords: updatedKeywords,
                  llm: updatedLlm,
                  applyCompetitorsToAll: true,
                },
              };
            }
            return n;
          });
        }

        return nds.map((n) =>
          n.id === selectedId ? { ...n, data: { ...n.data, ...patch } } : n,
        );
      });

      // If it's a saved project and the user is editing the output node, update the project details via API
      if (project?.id && selectedNode?.type === "output") {
        const nextProjectName =
          patch.projectName !== undefined
            ? patch.projectName
            : selectedNode.data.projectName;
        const nextProjectDesc =
          patch.projectDescription !== undefined
            ? patch.projectDescription
            : selectedNode.data.projectDescription;

        // Update the project object reference immediately for UI responsiveness
        if (patch.projectName !== undefined && project) {
          project.name = patch.projectName;
        }
        if (patch.projectDescription !== undefined && project) {
          project.description = patch.projectDescription;
        }

        if (updateProjectTimeoutRef.current) {
          clearTimeout(updateProjectTimeoutRef.current);
        }

        updateProjectTimeoutRef.current = setTimeout(() => {
          updateProject(project.id, {
            name: nextProjectName,
            description: nextProjectDesc,
          }).catch((err) => {
            console.error("Failed to update project details:", err);
          });
        }, 500); // 500ms debounce
      }
    },
    [selectedId, selectedNode, project, setNodes],
  );
  console.log({ nodes });

  // Columns for the open Review popup: a Review fed by a Media Monitoring
  // analysis shows the trimmed column set; otherwise the full table.
  const reviewFedByMM = useMemo(() => {
    // if (!reviewNodeId) return false;
    // const feeders = new Set(
    //   edges.filter((e) => e.target === reviewNodeId).map((e) => e.source),
    // );

    return nodes.some((n) => n.type === "analysis" && n.data?.lens === MM_LENS);
  }, [reviewNodeId, edges, nodes]);
  const reviewColumns = reviewFedByMM
    ? MM_REVIEW_COLUMNS
    : OTHER_REVIEW_COLUMNS;
  console.log({ reviewFedByMM });

  // Tagging progress bar: percent from batch counts, indeterminate until known.
  const jobPct =
    job.phase === "complete"
      ? 100
      : job.progress.total
        ? Math.round((job.progress.done / job.progress.total) * 100)
        : 0;
  const jobIndeterminate = job.phase === "running" && job.progress.total === 0;

  // Show "Generate Dashboards" once tagging finishes (this run) or when the
  // session is already tagged/completed; otherwise show "Save and Run Tagging Agent".
  const sessionTagged = ["tagged", "completed"].includes(
    (liveStatus || "").toLowerCase(),
  );
  const tagJustCompleted = job.kind === "tagging" && job.phase === "complete";
  const showDashboards = sessionTagged || tagJustCompleted;
  const chartsRunning =
    job.kind === "charts" &&
    job.active &&
    job.phase !== "complete" &&
    job.phase !== "error";

  function onSidebarDragStart(event, type) {
    event.dataTransfer.setData(DND_MIME, type);
    event.dataTransfer.effectAllowed = "move";
  }

  const minimapColor = (n) => MINIMAP_COLORS[n.type] || "#94a3b8";

  if (loadingDraft) {
    return (
      <div
        className="state"
        style={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <div className="loader" />
        <p style={{ color: "var(--text-soft)" }}>
          Initializing draft workflow from latest session...
        </p>
      </div>
    );
  }

  const handleBack = useCallback(() => {
    if (
      saving ||
      (job.active && (job.phase === "connecting" || job.phase === "running"))
    ) {
      toast.error(
        "Process is currently running. Please wait for it to complete before navigating.",
      );
      return;
    }
    onBack?.();
  }, [saving, job.active, job.phase, onBack]);

  return (
    <div
      className="wf"
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        zIndex: 50,
      }}
    >
      {/* ── Background aura ── */}
      <div
        className="wfroot"
        style={{
          backgroundImage: `url(${bgHero})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          position: "fixed",
          inset: 0,
          zIndex: -1,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.08)",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* ---- canvas ---- */}
      {/* <div
        className="wfcanvas"
        ref={wrapperRef}
        onDrop={onDrop}
        onDragOver={onDragOver}
        style={{ position: "absolute", inset: 0, zIndex: 0 }}
      >
        <div className="wfcanvas-bg-glows">
          <div className={cn('wfcanvas-glow', 'wfcanvas-glow--1')}></div>
          <div className={cn('wfcanvas-glow', 'wfcanvas-glow--2')}></div>
          <div className={cn('wfcanvas-glow', 'wfcanvas-glow--3')}></div>
        </div>
        <ReactFlow
          nodes={nodesWithErrors}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          onNodeClick={(_, n) => setSelectedId(n.id)}
          onPaneClick={() => setSelectedId(null)}
          deleteKeyCode={["Delete", "Backspace"]}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          defaultEdgeOptions={{ animated: true }}
          proOptions={{ hideAttribution: false }}
        >
          <Background gap={18} size={1.4} color="var(--wf-dot)" />
          <Controls showInteractive position="bottom-left">
            <ControlButton
              onClick={autoLayout}
              title="Auto format layout"
              aria-label="Auto format layout"
            >
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="4" width="6" height="16" rx="1" />
                <rect x="10.5" y="8" width="6" height="8" rx="1" />
                <rect x="18" y="6" width="3" height="12" rx="1" />
              </svg>
            </ControlButton>
          </Controls>
          <MiniMap
            pannable
            zoomable
            nodeColor={minimapColor}
            nodeStrokeWidth={2}
            position="bottom-left"
          />
        </ReactFlow>
      </div> */}

      {/* ---- top bar ---- */}
      <header
        className="wftop"
        style={{
          position: "relative",
          zIndex: 10,
          background: "transparent",
          border: "none",
          backdropFilter: "none",
          WebkitBackdropFilter: "none",
        }}
      >
        <div className="wftop__left">
          <button className="wfic" onClick={handleBack} aria-label="Back">
            <ArrowLeftIcon width={18} height={18} />
          </button>
          <SparklesIcon width={18} height={18} />
          <span className="wftop__name">{project?.name || "Workflow"}</span>
        </div>

        {project?.id && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 10,
            }}
          >
            <CanvasTabBar
              activeTab="configure"
              onTabChange={(tab) => {
                if (tab === "review" || tab === "output") {
                  if (
                    saving ||
                    (job.active &&
                      (job.phase === "connecting" || job.phase === "running"))
                  ) {
                    toast.error(
                      "Process is currently running. Please wait for it to complete before navigating.",
                    );
                    return;
                  }
                  setSubmitted(true);
                  const errs = computeFieldErrors(nodes, edges, session);
                  setFieldErrors(errs);
                  if (Object.keys(errs).length > 0) {
                    toast.error(
                      "Please fix the highlighted issues and connect all nodes before proceeding.",
                    );
                    return;
                  }
                  try {
                    validateWorkflow();
                  } catch (err) {
                    toast.error(err.message);
                    return;
                  }
                  if (isDirty || !session?.id) {
                    toast.error(
                      "Please save the agent for the new changes that are applied before proceeding.",
                    );
                    return;
                  }
                  if (tab === "review") {
                    navigate(paths.review(project.id, session.id), {
                      state: { project, session },
                    });
                  } else if (tab === "output") {
                    navigate(paths.dashboards(project.id, session.id), {
                      state: { project, session },
                    });
                  }
                }
              }}
            />
          </div>
        )}

        <div className="wftop__right">
          <div className="wftop__center">
            <div className="wf-flowing-actions">
              <button
                className={cn("wfbtn", "wfbtn--flowing", "wfbtn--flowing-save")}
                onClick={() => handleSaveWorkflow()}
                disabled={saving || job.active}
                title="Save workflow without running the tagging agent"
              >
                <CheckIcon width={15} height={15} />{" "}
                {saving ? "Saving…" : "Save Workflow"}
              </button>
              <button
                className={cn("wfbtn", "wfbtn--flowing", "wfbtn--flowing-run")}
                onClick={() => {
                  setSubmitted(true);
                  handleSaveAndTag();
                }}
                disabled={saving || job.active}
                title="Save workflow and start the tagging agent"
              >
                <PlayIcon width={15} height={15} />{" "}
                {saving ? "Saving…" : "Save & Run Tagging Agent"}
              </button>
            </div>
          </div>
          <TutorialMenu
            onStartTour={() => {
              setTutorialVideoOpen(false);
              setTourOpen(true);
            }}
            onWatchVideo={() => {
              setTourOpen(false);
              setTutorialVideoOpen(true);
            }}
          />
          <button
            className="wfic"
            onClick={onToggleTheme}
            aria-label="Toggle theme"
          >
            {theme === "light" ? (
              <MoonIcon width={18} height={18} />
            ) : (
              <SunIcon width={18} height={18} />
            )}
          </button>
        </div>
      </header>

      {/* ---- modules sidebar ---- */}
      <aside
        className="wfside"
        style={{
          position: "absolute",
          top: "80px",
          left: "16px",
          zIndex: 10,
          width: "208px",
          background: "color-mix(in srgb, var(--panel) 75%, transparent)",
          backdropFilter: "blur(20px) saturate(160%)",
          border: "1px solid rgba(91, 108, 249, 0.12)",
          borderRadius: "12px",
          boxShadow: "0 12px 36px rgba(0, 0, 0, 0.2)",
          padding: 0,
          overflow: "hidden",
        }}
      >
        <div
          className="wfside__header"
          style={{
            padding: "12px",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          <span
            className="wfside__title"
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--text)",
              margin: 0,
            }}
          >
            {project?.name || "Untitled Project"}
          </span>
        </div>

        <div style={{ padding: "12px" }}>
          <p
            className="wfside__kicker"
            style={{
              fontSize: "10px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--text-muted)",
              margin: "0 0 8px 0",
            }}
          >
            MODULES
          </p>
          <div className="wfside__list" style={{ marginTop: "12px" }}>
            {MODULES.map((m) => {
              const Icon = MODULE_ICON[m.type];
              // const locked = m.type === "data";
              const locked = false;
              let iconColor = "var(--text)";
              if (m.type === "data") iconColor = "var(--info)";
              if (m.type === "analysis") iconColor = "var(--accent)";
              if (m.type === "review") iconColor = "var(--chart-2)";
              if (m.type === "assembly") iconColor = "var(--chart-6)";
              if (m.type === "output") iconColor = "var(--positive)";

              return (
                <div
                  key={m.type}
                  className={`wfmod wfmod--${m.type}${locked ? " wfmod--locked" : ""}`}
                  draggable={!locked}
                  onDragStart={
                    locked ? undefined : (e) => onSidebarDragStart(e, m.type)
                  }
                  title={
                    locked
                      ? "Added by default — one Data node per workflow"
                      : m.hint
                  }
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    height: "36px",
                    padding: "0 12px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-subtle)",
                    cursor: locked ? "default" : "grab",
                    background: "transparent",
                    transition: "background 0.2s, border-color 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (!locked) {
                      e.currentTarget.style.background = "var(--surface-2)";
                      e.currentTarget.style.borderColor =
                        "var(--border-default)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!locked) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.borderColor =
                        "var(--border-subtle)";
                    }
                  }}
                >
                  <span
                    className="wfmod__icon"
                    style={{
                      color: iconColor,
                      background: "transparent",
                      width: "auto",
                      height: "auto",
                    }}
                  >
                    <Icon width={14} height={14} />
                  </span>
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "var(--text)",
                      flex: 1,
                    }}
                  >
                    {m.label}
                  </span>
                  {locked && (
                    <span
                      className="wfmod__tag"
                      style={{
                        background: "transparent",
                        border: "none",
                        fontSize: "10.5px",
                      }}
                    >
                      Added
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <p
            className="wfside__hint"
            style={{ marginTop: "12px", marginBottom: 0 }}
          >
            Drag onto the canvas, then connect with edges.
          </p>

          {/* Project Instructions button — styled to match image */}
          <button
            id="project-instructions-btn"
            onClick={() => setInstructionsOpen(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              width: "100%",
              marginTop: "10px",
              height: "36px",
              padding: "0 12px",
              borderRadius: "8px",
              border: "1px solid var(--border-subtle, rgba(0,0,0,0.1))",
              cursor: "pointer",
              background: "transparent",
              transition: "background 0.15s, border-color 0.15s",
              color: "var(--text, #374151)",
              textAlign: "left",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background =
                "var(--surface-2, rgba(0,0,0,0.04))";
              e.currentTarget.style.borderColor =
                "var(--border-default, rgba(0,0,0,0.18))";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.borderColor =
                "var(--border-subtle, rgba(0,0,0,0.1))";
            }}
          >
            {/* Open-book icon matching image */}
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flexShrink: 0, opacity: 0.7 }}
            >
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
            <span style={{ fontSize: "11px", fontWeight: 500 }}>
              Monitoring Instructions
            </span>
          </button>
        </div>
      </aside>

      {/* ---- canvas ---- */}
      <div
        className="wfcanvas"
        ref={wrapperRef}
        onDrop={onDrop}
        onDragOver={onDragOver}
      >
        <div className="wfcanvas-bg-glows">
          <div className={cn("wfcanvas-glow", "wfcanvas-glow--1")}></div>
          <div className={cn("wfcanvas-glow", "wfcanvas-glow--2")}></div>
          <div className={cn("wfcanvas-glow", "wfcanvas-glow--3")}></div>
        </div>
        <ReactFlow
          nodes={nodesWithErrors}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          onNodeClick={(_, n) => setSelectedId(n.id)}
          onPaneClick={() => setSelectedId(null)}
          deleteKeyCode={["Delete", "Backspace"]}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          defaultEdgeOptions={{ animated: true }}
          proOptions={{ hideAttribution: false }}
        >
          <Background gap={18} size={1.4} color="var(--wf-dot)" />
          <Controls showInteractive position="bottom-left">
            <ControlButton
              onClick={autoLayout}
              title="Auto format layout"
              aria-label="Auto format layout"
            >
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="4" width="6" height="16" rx="1" />
                <rect x="10.5" y="8" width="6" height="8" rx="1" />
                <rect x="18" y="6" width="3" height="12" rx="1" />
              </svg>
            </ControlButton>
          </Controls>
          <MiniMap
            pannable
            zoomable
            nodeColor={minimapColor}
            nodeStrokeWidth={2}
            position="bottom-left"
          />
        </ReactFlow>

        <button
          className="wfassist"
          onClick={() => setAssistantOpen((o) => !o)}
        >
          <SparklesIcon width={16} height={16} /> Workflow Assistant
        </button>

        {job.active && (
          <div className="wflog">
            <section
              className={`tagpanel${job.phase === "error" ? " tagpanel--error" : ""}`}
            >
              <div className="tagpanel__head">
                <h2 className="tagpanel__title">
                  {job.kind === "charts"
                    ? job.phase === "error"
                      ? "Dashboards Generation Agent Failed"
                      : job.phase === "complete"
                        ? "Dashboards Generation Agent Complete"
                        : "Dashboards Generation Agent Start"
                    : job.phase === "error"
                      ? "Tagging Agent Failed"
                      : job.phase === "complete"
                        ? `Tagging Agent Complete${job.totalArticles ? ` · ${job.totalArticles} articles` : ""}`
                        : `Tagging Agent Start${job.totalArticles ? ` · ${job.totalArticles} articles` : ""}`}
                </h2>
                <div className="wflog__head-right">
                  {job.progress.total > 0 && job.phase !== "error" && (
                    <span className="tagpanel__count">
                      {job.progress.done}/{job.progress.total} · {jobPct}%
                    </span>
                  )}
                  <button
                    className={cn("wfic", "wfic--sm")}
                    onClick={() => {
                      try {
                        wsRef.current?.close();
                      } catch {
                        /* already closed */
                      }
                      setJob(IDLE_JOB);
                    }}
                    aria-label="Dismiss logs"
                  >
                    <CloseIcon width={16} height={16} />
                  </button>
                </div>
              </div>
              {job.phase !== "error" && (
                <div
                  className={`progress${jobIndeterminate ? " progress--indeterminate" : ""}`}
                >
                  <div
                    className="progress__bar"
                    style={{ width: jobIndeterminate ? "40%" : `${jobPct}%` }}
                  />
                </div>
              )}
              <div className="log">
                {job.messages.map((m, i) => (
                  <div className="log__line" key={i}>
                    {m}
                  </div>
                ))}
              </div>
              {job.phase === "error" && (
                <div className="tagpanel__actions">
                  <button
                    className={cn("btn", "btn--primary")}
                    onClick={job.kind === "charts" ? startCharts : startTagging}
                  >
                    <RefreshIcon width={16} height={16} /> Retry
                  </button>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
      {/* ---- inspector ---- */}
      <ConfigPanel
        node={selectedNode}
        nodes={nodes}
        onChange={updateNodeData}
        showErrors={submitted}
        project={project}
        session={session}
      />
      {assistantOpen && (
        <div className="wfchat">
          <div className="wfchat__head">
            <div className="wfchat__identity">
              <span className="wfchat__avatar">
                <SparklesIcon width={16} height={16} />
              </span>
              <div className="wfchat__identitytext">
                <span className="wfchat__name">{COPILOT_BOT_NAME}</span>
                <span className="wfchat__status">
                  <i className="wfchat__dot" /> {COPILOT_BOT_TITLE}
                </span>
              </div>
            </div>
            <button
              className={cn("wfic", "wfic--sm")}
              onClick={() => setAssistantOpen(false)}
              aria-label="Minimize"
            >
              <ChevronDownIcon width={16} height={16} />
            </button>
          </div>
          <div className="wfchat__body">
            {copilotThread.length === 0 && (
              <>
                <p className={cn("wfchat__msg", "wfchat__msg--assistant")}>
                  👋 Hi, I'm {COPILOT_BOT_NAME}! Tell me the brand, competitors,
                  lens, LLM, layout, and project name, and I'll build the whole
                  node graph for you — replacing whatever is on the canvas now.
                </p>
                <div className="wfchat__samples">
                  <p className="wfchat__quicklabel">Try one of these</p>
                  {COPILOT_SAMPLE_PROMPTS.map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      className="wfchat__sample"
                      onClick={() => appendToCopilotInput(p)}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </>
            )}
            {copilotThread.map((m) => (
              <p key={m.id} className={`wfchat__msg wfchat__msg--${m.role}`}>
                {m.text}
              </p>
            ))}
            {copilotBusy && (
              <p
                className={cn(
                  "wfchat__msg",
                  "wfchat__msg--assistant",
                  "wfchat__msg--typing",
                )}
              >
                <span className="wfchat__typing">
                  <i />
                  <i />
                  <i />
                </span>
              </p>
            )}
          </div>

          <div className="wfchat__quick">
            {COPILOT_QUICK_FIELDS.map((group) => {
              const Icon = group.icon;
              const open = copilotPopover === group.label;
              return (
                <div className="wfchat__iconwrap" key={group.label}>
                  <button
                    type="button"
                    className={`wfchat__iconbtn${open ? " wfchat__iconbtn--active" : ""}`}
                    onClick={() =>
                      setCopilotPopover((p) =>
                        p === group.label ? null : group.label,
                      )
                    }
                    disabled={copilotBusy}
                    title={`Select ${group.label}`}
                    aria-label={`Select ${group.label}`}
                  >
                    <Icon width={14} height={14} />
                    <span>{group.label}</span>
                  </button>
                  {open && (
                    <div className="wfchat__popover">
                      {group.options.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          className="wfchat__popoveropt"
                          onClick={() => {
                            appendToCopilotInput(`${group.label}: ${opt}`);
                            setCopilotPopover(null);
                          }}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {copilotFile && (
            <div className="wfchat__filechip">
              <SpreadsheetIcon width={14} height={14} />
              <span>{copilotFile.name}</span>
              <button
                type="button"
                onClick={() => setCopilotFile(null)}
                aria-label="Remove attached file"
              >
                <CloseIcon width={12} height={12} />
              </button>
            </div>
          )}

          <div className="wfchat__input">
            <input
              ref={copilotFileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              style={{ display: "none" }}
              onChange={handleCopilotFileChange}
            />
            <button
              type="button"
              className={cn("wfic", "wfic--sm")}
              onClick={() => copilotFileInputRef.current?.click()}
              disabled={copilotBusy}
              aria-label="Attach a CSV or Excel file"
              title="Attach a CSV or Excel file"
            >
              <UploadIcon width={15} height={15} />
            </button>
            <textarea
              ref={copilotInputRef}
              className={cn("wfinput", "wfinput--textarea")}
              rows={1}
              placeholder="Ask the assistant…"
              value={copilotInput}
              onChange={(e) => setCopilotInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleCopilotPrompt(copilotInput);
                }
              }}
              disabled={copilotBusy}
            />
            <button
              className="wfchat__send"
              onClick={() => handleCopilotPrompt(copilotInput)}
              disabled={copilotBusy || !copilotInput.trim()}
              aria-label="Send"
            >
              <SendIcon width={16} height={16} />
            </button>
          </div>
        </div>
      )}

      {reviewNodeId && (
        <ReviewScreen
          asModal
          project={project}
          session={session}
          runTagging={false}
          columns={reviewColumns}
          relationEditable={reviewFedByMM}
          approvalField={
            reviewFedByMM
              ? "is_approved_for_monitoring"
              : "is_approved_for_dashboards"
          }
          onClose={() => setReviewNodeId(null)}
          onBack={() => setReviewNodeId(null)}
          onCreated={() => setReviewNodeId(null)}
        />
      )}

      {dataSourceConfirmOpen && (
        <DataSourceConfirmationModal
          onUploadFile={handleConfirmUploadFile}
          onProceedWithApi={handleConfirmProceedApi}
          onClose={() => setDataSourceConfirmOpen(false)}
        />
      )}

      {tourOpen && (
        <WorkflowTour
          steps={tourSteps}
          onClose={() => setTourOpen(false)}
        />
      )}

      {tutorialVideoOpen && (
        <TutorialVideoModal
          onClose={() => setTutorialVideoOpen(false)}
          onStartTour={() => setTourOpen(true)}
        />
      )}

      {instructionsOpen && (
        <ProjectInstructionsPanel
          projectId={project?.id || null}
          projectName={
            project?.name ||
            nodes.find((n) => n.type === "output")?.data?.projectName ||
            "Untitled Project"
          }
          initialValue={sectionsPrompt}
          onClose={() => setInstructionsOpen(false)}
          onSave={(val) => {
            setSectionsPrompt(val);
            lastSavedSectionsPromptRef.current = (val || "").trim();
            setInstructionsOpen(false);
          }}
        />
      )}
    </div>
  );
}

function DataSourceConfirmationModal({
  onUploadFile,
  onProceedWithApi,
  onClose,
}) {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <>
      <div
        onMouseDown={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 99998,
          background: "rgba(0, 0, 0, 0.45)",
          backdropFilter: "blur(4px)",
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Data Source Confirmation"
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 99999,
          width: "460px",
          maxWidth: "92vw",
          background: "#ffffff",
          borderRadius: "18px",
          boxShadow:
            "0 20px 50px -10px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.08)",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "12px",
              background: "rgba(124, 58, 237, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#7c3aed"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <h3
              style={{
                margin: "0 0 6px 0",
                fontSize: "16px",
                fontWeight: 700,
                color: "#111827",
              }}
            >
              Data Source Confirmation
            </h3>
            <p
              style={{
                margin: 0,
                fontSize: "13.5px",
                color: "#4b5563",
                lineHeight: "1.5",
              }}
            >
              You are currently in the <strong>File Upload</strong> section, but
              haven't uploaded a file. You have configured REST API Data
              Providers.
            </p>
            <p
              style={{
                margin: "8px 0 0 0",
                fontSize: "13.5px",
                color: "#4b5563",
                lineHeight: "1.5",
              }}
            >
              Would you like to upload a file now, or proceed with the REST API
              flow?
            </p>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "10px",
            marginTop: "8px",
            paddingTop: "16px",
            borderTop: "1px solid #f3f4f6",
          }}
        >
          <button
            type="button"
            onClick={onUploadFile}
            style={{
              padding: "9px 16px",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              background: "#ffffff",
              color: "#374151",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
          >
            Upload a File
          </button>
          <button
            type="button"
            onClick={onProceedWithApi}
            style={{
              padding: "9px 18px",
              borderRadius: "8px",
              border: "none",
              background: "#7c3aed",
              color: "#ffffff",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(124, 58, 237, 0.3)",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#6d28d9")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#7c3aed")}
          >
            Proceed with REST API
          </button>
        </div>
      </div>
    </>
  );
}

const MINIMAP_COLORS = {
  data: "#7c3aed",
  analysis: "#2563eb",
  review: "#db2777",
  assembly: "#d97706",
  output: "#059669",
};

export default function WorkflowScreen(props) {
  return (
    <ReactFlowProvider>
      <WorkflowCanvas {...props} />
    </ReactFlowProvider>
  );
}
