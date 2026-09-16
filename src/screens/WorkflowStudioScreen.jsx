import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import ReactFlow, {
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  ReactFlowProvider,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";

import logoImg from "../assets/images/image.png";
import { nodeTypes, getNodeStatus } from "../workflow/nodes.jsx";
import ConfigPanel from "../workflow/panels.jsx";
import { workflowAgentWsUrl } from "../api/workflowAgent.js";
import {
  seedNodes,
  restoreNodes,
  restoreEdges,
  hasSavedGraph,
  nextId,
  bumpIdSeq,
  updateApiPayload,
} from "../workflow/workflowUtils.js";
import {
  MODULES,
  defaultNodeData,
  isSerialConnection,
} from "../workflow/constants.js";
import { GlassModuleIcon } from "../workflow/wfIcons.jsx";
import {
  saveWorkflow,
  getSession,
  uploadFile,
  createSession,
  listSessions,
} from "../api/sessions.js";
import { createProject, updateProject } from "../api/projects.js";
import { paths, invalidateSessionCache, seedSession } from "../router/nav.js";

// The api data sources picked on a data node. The panel's dropdown writes
// `selectedSources`; a saved or agent-built node carries `data_sources`.
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
  return [];
}

// Per-node required-field and connection check for WorkflowStudioScreen.
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
      dataNode.data?.file_upload_id ||
      session?.source_file
    );

    if (!hasFile && !hasActiveSources) {
      add(
        dataNode.id,
        "Either File Upload or an Active Data Provider is required",
      );
    }
    // `queries` is what the backend fetches with; `query` is the editor's text.
    if (
      (isApiSource || hasActiveSources) &&
      !dataNode.data?.queries?.length &&
      !dataNode.data?.query?.trim() &&
      !(dataNode.data?.brandKeywords || []).length
    ) {
      add(dataNode.id, "Query is required when a Data Provider is selected");
    }
    if (!dataNode.data?.brandKeywords?.length) {
      add(dataNode.id, "Brand keyword is required");
    } else if (dataNode.data?.brandKeywords?.length > 1) {
      add(dataNode.id, "Only one Brand keyword is allowed");
    }
    if (!dataNode.data?.messageKeywords?.length) {
      add(dataNode.id, "Message keyword is required");
    }
  }

  const analysisNodes = nodes.filter((n) => n.type === "analysis");
  analysisNodes.forEach((analysisNode) => {
    if (!analysisNode.data?.lens)
      add(analysisNode.id, "Intelligence Lens is required");
    if (!analysisNode.data?.competitorKeywords?.length)
      add(analysisNode.id, "Competitor keyword is required");
  });

  return errs;
}

// ============================================================================
// SVG ICONS
// ============================================================================

const DatabaseIcon = ({ size = 18, color = "#4B5563" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
  </svg>
);

const CalendarIcon = ({ size = 18, color = "#4B5563" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const GlobeIcon = ({ size = 18, color = "#4B5563" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const ShareIcon = ({ size = 18, color = "#4B5563" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <polyline points="16 6 12 2 8 6" />
    <line x1="12" y1="2" x2="12" y2="15" />
  </svg>
);

const DownloadIcon = ({ size = 18, color = "#4B5563" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const FolderIcon = ({ size = 18, color = "#4B5563" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

const PlusIcon = ({ size = 18, color = "#4B5563" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const MicIcon = ({ size = 18, color = "#4B5563" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

const SendIcon = ({ size = 16, color = "#FFFFFF" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="19" x2="12" y2="5" />
    <polyline points="5 12 12 5 19 12" />
  </svg>
);

const SparklesIcon = ({ size = 18, color = "#8B5CF6" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
  </svg>
);

const BackArrowIcon = ({ size = 16, color = "#6B7280" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const ForwardArrowIcon = ({ size = 16, color = "#FFFFFF" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const MoreVerticalIcon = ({ size = 18, color = "#6B7280" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="1" />
    <circle cx="12" cy="5" r="1" />
    <circle cx="12" cy="19" r="1" />
  </svg>
);

const CloseIcon = ({ size = 16, color = "#9CA3AF" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const CheckIcon = ({ size = 14, color = "#4F46E5" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const COPILOT_FILE_EXT_RE = /\.(csv|xlsx|xls)$/i;

// Serialize workflow nodes & edges for graph saving
function serializeWorkflow(nodes, edges) {
  const analysisNodes = (nodes || []).filter((n) => n.type === "analysis");
  const competitorKeywordsFromAnalysis = Array.from(
    new Set(analysisNodes.flatMap((an) => an.data?.competitorKeywords || [])),
  );

  return {
    nodes: nodes.map(({ id, type, position, data }) => {
      const { onDelete, onTagged, taggedReady, onViewDashboard, ...rest } =
        data || {};
      if (type === "data") {
        if (competitorKeywordsFromAnalysis.length > 0) {
          rest.competitorKeywords = competitorKeywordsFromAnalysis;
        }
      }
      return { id, type, position, data: rest };
    }),
    edges: edges.map(({ id, source, target, sourceHandle, targetHandle }) => ({
      id,
      source,
      target,
      sourceHandle,
      targetHandle,
    })),
  };
}

// Check connection edge validity. Any number of analysis nodes, of any lens,
// may share one review node.
function isEdgeValid(edge, byId) {
  const src = byId.get(edge.source);
  const tgt = byId.get(edge.target);
  if (!src || !tgt || !isSerialConnection(src.type, tgt.type)) return false;
  return true;
}

// Data Popover Constants
const COPILOT_SAMPLE_PROMPTS = [
  "Build a media monitoring workflow for Tesla comparing against Rivian and Lucid using Claude. Name the project 'Q3 Electric Vehicle Perception'.",
  "Create a workflow for Nike with two analysis nodes: PR Impact and Narrative Intelligence, benchmarking against Adidas and Puma using Gemini. Set client name to 'Nike Global' and layout to Editorial.",
  "Set up a Google RSS feed monitoring 'Generative AI Startups' for OpenAI, comparing with Anthropic and Cohere, using Reputation Index analysis with GPT. Output as a Bento dashboard.",
];

// The pipeline values the agent has gathered so far, shown above the thread so
// the user can see what will be built before confirming.
function AgentStatePanel({ state, providers }) {
  if (!state) return null;

  const rows = [
    ["Brand", state.brand ? [state.brand] : []],
    ["Competitors", state.competitors || []],
    ["Data providers", state.providers || []],
    ["Analysis", state.lenses || []],
    ["Themes", state.message_themes || []],
  ].filter(([, values]) => values.length);

  const queries = state.queries || [];
  if (!rows.length && !state.title && !queries.length) return null;

  const chip = {
    padding: "3px 9px",
    borderRadius: 999,
    backgroundColor: "#EEF2FF",
    color: "#4338CA",
    fontSize: 11.5,
    fontWeight: 600,
  };
  const label = {
    fontSize: 10.5,
    fontWeight: 700,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    color: "#9CA3AF",
  };

  return (
    <div
      style={{
        margin: "0 16px 4px",
        padding: 12,
        borderRadius: 12,
        border: "1px solid #E5E7EB",
        backgroundColor: "#FAFAFC",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        maxHeight: 260,
        overflowY: "auto",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <SparklesIcon size={13} color="#4F46E5" />
        <span style={{ ...label, color: "#6B7280" }}>Pipeline so far</span>
      </div>

      {state.title && (
        <div>
          <p style={{ ...label, margin: "0 0 4px" }}>Title</p>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#1F2937" }}>
            {state.title}
          </span>
        </div>
      )}

      {rows.map(([name, values]) => (
        <div key={name}>
          <p style={{ ...label, margin: "0 0 5px" }}>{name}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {values.map((v, i) => (
              <span key={`${v}-${i}`} style={chip}>
                {v}
              </span>
            ))}
          </div>
        </div>
      ))}

      {queries.length > 0 && (
        <div>
          <p style={{ ...label, margin: "0 0 5px" }}>
            Query{" "}
            <span
              style={{ color: state.confirmed_queries ? "#059669" : "#D97706" }}
            >
              ·{" "}
              {state.confirmed_queries ? "confirmed" : "awaiting confirmation"}
            </span>
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {queries.map((q, i) => (
              <code
                key={i}
                style={{
                  padding: "6px 9px",
                  borderRadius: 7,
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E5E7EB",
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                  fontSize: 11.5,
                  color: "#1F2937",
                  whiteSpace: "pre-wrap",
                }}
              >
                {q}
              </code>
            ))}
          </div>
        </div>
      )}

      {providers && Object.keys(providers).length > 0 && (
        <div style={{ borderTop: "1px dashed #E5E7EB", paddingTop: 9 }}>
          <p style={{ ...label, margin: "0 0 5px" }}>Available sources</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {Object.keys(providers).map((name) => (
              <span
                key={name}
                style={{
                  ...chip,
                  backgroundColor: "#F3F4F6",
                  color: "#6B7280",
                }}
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const DATA_TYPES = [
  "Traditional",
  "Social",
  "Reviews",
  "Blogs",
  "Forums",
  "News",
  "Podcasts",
  "Video",
];
const TIMELINES = [
  "Past 1 week",
  "Past 1 month",
  "Past 3 months",
  "Past 6 months",
  "Past 1 year",
];
const LOCATIONS = [
  "Global",
  "North America",
  "Europe",
  "APAC",
  "LATAM",
  "Middle East & Africa",
];

// Module Card Accent Styles for Add Module Stage Modal
const MODULE_CARD_ACCENTS = {
  data: {
    border: "rgba(59, 130, 246, 0.3)",
    btnBg: "#EFF6FF",
    btnColor: "#1D4ED8",
    btnBorder: "#BFDBFE",
  },
  analysis: {
    border: "rgba(168, 85, 247, 0.3)",
    btnBg: "#F5F3FF",
    btnColor: "#6D28D9",
    btnBorder: "#DDD6FE",
  },
  review: {
    border: "rgba(245, 158, 11, 0.3)",
    btnBg: "#FFFBEB",
    btnColor: "#B45309",
    btnBorder: "#FDE68A",
  },
  assembly: {
    border: "rgba(16, 185, 129, 0.3)",
    btnBg: "#ECFDF5",
    btnColor: "#047857",
    btnBorder: "#A7F3D0",
  },
  output: {
    border: "rgba(244, 63, 94, 0.3)",
    btnBg: "#FDF2F8",
    btnColor: "#BE185D",
    btnBorder: "#FBCFE8",
  },
};

// ============================================================================
// MAIN WORKFLOW STUDIO SCREEN COMPONENT
// ============================================================================

function WorkflowStudioContent({ onBack, session: sessionProp, project: projectProp }) {
  const navigate = useNavigate();
  const { fitView } = useReactFlow();

  // The props are fixed for the life of the route, so a save has to record what
  // it created — otherwise the next save builds another project and session.
  const [savedSession, setSavedSession] = useState(null);
  const [savedProject, setSavedProject] = useState(null);
  const session = savedSession || sessionProp;
  const project = savedProject || projectProp;
  const isSaved = !!session?.id;

  // Canvas Node & Edge state
  const [nodes, setNodes, onNodesChange] = useNodesState(() => {
    if (hasSavedGraph(session?.workflow)) {
      const restored = restoreNodes(session.workflow);
      bumpIdSeq(restored);
      return restored;
    }
    return [];
  });

  const [edges, setEdges, onEdgesChange] = useEdgesState(() => {
    return hasSavedGraph(session?.workflow)
      ? restoreEdges(session.workflow)
      : [];
  });

  const [selectedId, setSelectedId] = useState(null);
  const [workflowTitle, setWorkflowTitle] = useState(
    session?.name || "Untitled Workflow",
  );

  // Popover & Modal States
  const [activePopover, setActivePopover] = useState(null); // 'data' | 'timeline' | 'location' | 'folder' | 'moreMenu' | null
  const [showAddModuleModal, setShowAddModuleModal] = useState(false); // Pop-up Modal for Add Module Stage
  const [selectedDataTypes, setSelectedDataTypes] = useState([
    "Traditional",
    "Social",
    "News",
  ]);
  const [selectedTimeline, setSelectedTimeline] = useState("Past 1 month");
  const [selectedLocations, setSelectedLocations] = useState(["Global"]);

  // Choice Cards & Chat Panel Visibility State
  const [choiceSelected, setChoiceSelected] = useState(() => {
    return hasSavedGraph(session?.workflow) || nodes.length > 0
      ? "manual"
      : null;
  });

  const [showChatPanel, setShowChatPanel] = useState(false);
  const [saving, setSaving] = useState(false);
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

  // Chat Assistant State
  const [copilotInput, setCopilotInput] = useState("");
  const [copilotBusy, setCopilotBusy] = useState(false);
  const [copilotThread, setCopilotThread] = useState([]);
  const [copilotFile, setCopilotFile] = useState(null);
  const [showInputSuggestions, setShowInputSuggestions] = useState(false);

  // Workflow agent (backend WebSocket): the gathered pipeline, the org's data
  // providers, and any options the agent offered this turn.
  // Latches on the first time the chat opens and stays on, so hiding the panel
  // doesn't drop the conversation.
  const [agentSessionOn, setAgentSessionOn] = useState(false);
  const [agentState, setAgentState] = useState(null);
  const [agentProviders, setAgentProviders] = useState(null);
  const [agentOptions, setAgentOptions] = useState(null); // { options, selected:Set, custom }
  const [agentConnected, setAgentConnected] = useState(false);
  const agentWsRef = useRef(null);
  // The socket effect's closure can't see agentProviders/copilotFile state updates.
  const agentProvidersRef = useRef(null);
  const copilotFileRef = useRef(null);
  const copilotUploadIdRef = useRef(null);

  const copilotInputRef = useRef(null);
  const copilotFileInputRef = useRef(null);
  const chatThreadEndRef = useRef(null);
  // Date.now() collides when several frames arrive in the same millisecond.
  const copilotMsgIdRef = useRef(0);
  const nextMsgId = () => ++copilotMsgIdRef.current;

  // NODE DELETION HANDLER (REMOVES NODE & ALL CONNECTED EDGES)
  const handleDeleteNode = useCallback(
    (idToDelete) => {
      setNodes((nds) => nds.filter((n) => n.id !== idToDelete));
      setEdges((eds) =>
        eds.filter((e) => e.source !== idToDelete && e.target !== idToDelete),
      );
      setSelectedId((curr) => (curr === idToDelete ? null : curr));
      toast.success("Module node removed from workflow.");
    },
    [setNodes, setEdges],
  );

  // Ensure all existing and newly created nodes have onDelete handler attached
  useEffect(() => {
    setNodes((prevNodes) =>
      prevNodes.map((n) => {
        if (!n.data?.onDelete) {
          return {
            ...n,
            data: {
              ...n.data,
              onDelete: () => handleDeleteNode(n.id),
            },
          };
        }
        return n;
      }),
    );
  }, [handleDeleteNode, setNodes]);

  const pushAgentMsg = useCallback((msg) => {
    setCopilotThread((prev) => [...prev, { id: nextMsgId(), ...msg }]);
  }, []);

  // The agent's graph already carries ids, positions and edges, so it only needs
  // the canvas's runtime handlers attaching.
  const applyAgentWorkflow = useCallback(
    (workflow) => {
      const restored = restoreNodes(workflow);
      bumpIdSeq(restored);
      const prepared = restored.map((n) => {
        const data = { ...n.data, onDelete: () => handleDeleteNode(n.id) };
        // The file is already uploaded and the node carries its file_upload_id, so
        // only the display name is filled in — no fileObject, which would make the
        // save path upload it a second time.
        if (n.type === "data" && data.sourceType === "file") {
          data.file = data.file || copilotFileRef.current?.name || "";
        }
        return { ...n, data };
      });
      setNodes(prepared);
      setEdges(restoreEdges(workflow));
      setChoiceSelected("ai");
      if (prepared.length > 0) setSelectedId(prepared[0].id);
      toast.success("Workflow generated successfully!");
    },
    [handleDeleteNode, setNodes, setEdges],
  );

  // One socket for the whole conversation. Keyed on agentSessionOn, not on panel
  // visibility, so hiding and reshowing the chat keeps the same session.
  useEffect(() => {
    if (!agentSessionOn) return undefined;

    const ws = new WebSocket(workflowAgentWsUrl());
    agentWsRef.current = ws;
    setCopilotBusy(true);

    ws.onopen = () => setAgentConnected(true);

    ws.onmessage = (ev) => {
      let msg;
      try {
        msg = JSON.parse(ev.data);
      } catch {
        return;
      }
      switch (msg.type) {
        case "ready":
          setAgentProviders(msg.providers || {});
          agentProvidersRef.current = msg.providers || {};
          break;
        case "agent":
          pushAgentMsg({ role: "assistant", text: msg.message || "" });
          if (Array.isArray(msg.options) && msg.options.length) {
            // Providers are a fixed list from the org's config, so a typed-in
            // value could never resolve; competitors and the rest allow one.
            const names = Object.keys(agentProvidersRef.current || {});
            const isProviders =
              names.length > 0 && msg.options.every((o) => names.includes(o));
            setAgentOptions({
              options: msg.options,
              selected: new Set(),
              custom: "",
              allowCustom: !isProviders,
            });
          }
          break;
        case "query":
          pushAgentMsg({
            role: "assistant",
            kind: "query",
            text: msg.message || "",
            queries: msg.queries || [],
            rationale: msg.rationale || "",
          });
          break;
        case "workflow":
          applyAgentWorkflow(msg.workflow);
          pushAgentMsg({
            role: "assistant",
            kind: "built",
            text: msg.summary || "Workflow created.",
          });
          break;
        case "state":
          setAgentState(msg.state || null);
          setCopilotBusy(false); // last frame of a turn
          break;
        case "error":
          pushAgentMsg({
            role: "error",
            text: msg.detail || "The agent failed.",
          });
          setCopilotBusy(false);
          break;
        default:
          break;
      }
    };

    ws.onerror = () => {
      pushAgentMsg({
        role: "error",
        text: "Couldn't reach the workflow agent — is the backend running?",
      });
      setCopilotBusy(false);
    };
    ws.onclose = () => {
      setAgentConnected(false);
      setCopilotBusy(false);
    };

    return () => {
      try {
        ws.close();
      } catch {
        /* already closed */
      }
      agentWsRef.current = null;
      setAgentConnected(false);
    };
  }, [agentSessionOn, pushAgentMsg, applyAgentWorkflow]);

  // Opening the panel starts the session; hiding it leaves the socket alone.
  useEffect(() => {
    if (showChatPanel) setAgentSessionOn(true);
  }, [showChatPanel]);

  // Auto-scroll chat thread
  useEffect(() => {
    chatThreadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [copilotThread, copilotBusy]);

  // Auto-grow textarea
  useEffect(() => {
    const el = copilotInputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [copilotInput]);

  const handleConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  // Choice Card Action: Add first step (Manual Mode)
  const handleSelectManual = useCallback(() => {
    setChoiceSelected("manual");
    setShowChatPanel(false);
    if (nodes.length === 0) {
      const seeded = seedNodes(session);
      const seededWithDelete = seeded.map((n) => ({
        ...n,
        data: {
          ...n.data,
          onDelete: () => handleDeleteNode(n.id),
        },
      }));
      setNodes(seededWithDelete);
      setEdges([]);
      setSelectedId(seededWithDelete[0]?.id || null);
    }
  }, [nodes.length, session, setNodes, setEdges, handleDeleteNode]);

  // Choice Card Action: Build with AI (AI Mode)
  const handleSelectAi = useCallback(() => {
    setChoiceSelected("ai");
    setShowChatPanel(true);
    setTimeout(() => {
      copilotInputRef.current?.focus();
    }, 200);
  }, []);

  // ADD NEW MODULE STAGE TO CANVAS FROM POP-UP MODAL
  const handleAddModule = useCallback(
    (type) => {
      setShowAddModuleModal(false);
      setChoiceSelected("manual");

      const newId = nextId(type);
      const extraData = type === "analysis" ? { lens: "media_monitoring" } : {};
      const dataPayload = defaultNodeData(type, extraData);

      let lastX = 60;
      let lastY = 180;
      if (nodes.length > 0) {
        const rightmost = nodes.reduce(
          (max, n) => (n.position.x > max.position.x ? n : max),
          nodes[0],
        );
        lastX = rightmost.position.x + 320;
        lastY = rightmost.position.y;
      }

      const newNode = {
        id: newId,
        type,
        position: { x: lastX, y: lastY },
        data: {
          ...dataPayload,
          onDelete: () => handleDeleteNode(newId),
        },
      };

      setSubmitted(false);
      setFieldErrors({});
      setNodes((prev) => [...prev, newNode]);
      setSelectedId(newId);

      // Auto connect to last node if serial connection is valid
      if (nodes.length > 0) {
        const lastNode = nodes[nodes.length - 1];
        if (isSerialConnection(lastNode.type, type)) {
          setEdges((eds) => [
            ...eds,
            {
              id: `e_${lastNode.id}_${newId}`,
              source: lastNode.id,
              target: newId,
            },
          ]);
        }
      }

      // Auto zoom / center the newly added node into viewport
      setTimeout(() => {
        try {
          fitView({ nodes: [{ id: newId }], duration: 600, padding: 0.8 });
        } catch {
          fitView({ duration: 600, padding: 0.3 });
        }
      }, 50);

      toast.success(
        `Added ${MODULES.find((m) => m.type === type)?.label || type} module`,
      );
    },
    [nodes, setNodes, setEdges, handleDeleteNode, fitView],
  );

  // AUTO LAYOUT GRAPH
  const handleAutoLayout = useCallback(() => {
    setActivePopover(null);
    if (nodes.length === 0) return;

    const dataN = nodes.find((n) => n.type === "data");
    const analysisNs = nodes.filter((n) => n.type === "analysis");
    const reviewNs = nodes.filter((n) => n.type === "review");
    const assemblyN = nodes.find((n) => n.type === "assembly");
    const outputN = nodes.find((n) => n.type === "output");

    const updated = nodes.map((node) => {
      let x = node.position.x;
      let y = node.position.y;

      if (node.type === "data") {
        x = 60;
        y = 180;
      } else if (node.type === "analysis") {
        const idx = analysisNs.findIndex((n) => n.id === node.id);
        x = 360;
        y = 100 + idx * 160;
      } else if (node.type === "review") {
        const idx = reviewNs.findIndex((n) => n.id === node.id);
        x = 680;
        y = 140 + idx * 140;
      } else if (node.type === "assembly") {
        x = 980;
        y = 180;
      } else if (node.type === "output") {
        x = 1280;
        y = 180;
      }
      return { ...node, position: { x, y } };
    });

    setNodes(updated);
    toast.success("Graph laid out automatically!");
  }, [nodes, setNodes]);

  // CLEAR CANVAS
  const handleClearCanvas = useCallback(() => {
    setActivePopover(null);
    setNodes([]);
    setEdges([]);
    setSelectedId(null);
    setChoiceSelected(null);
    toast.success("Canvas reset.");
  }, [setNodes, setEdges]);

  // EXPORT JSON
  const handleExportJson = useCallback(() => {
    setActivePopover(null);
    const serialized = serializeWorkflow(nodes, edges);
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(serialized, null, 2));
    const a = document.createElement("a");
    a.href = dataStr;
    a.download = `${workflowTitle.toLowerCase().replace(/\s+/g, "_")}_workflow.json`;
    a.click();
    toast.success("Exported Workflow JSON!");
  }, [nodes, edges, workflowTitle]);

  // Handle Chat Submission
  // Send one turn to the agent. The reply arrives as WS frames, so this only
  // pushes the user's message and hands the text to the socket.
  const sendToAgent = useCallback(
    (text) => {
      const ws = agentWsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        pushAgentMsg({
          role: "error",
          text: "Not connected — close and reopen the chat to start a new session.",
        });
        return;
      }
      pushAgentMsg({ role: "user", text });
      ws.send(JSON.stringify({ type: "message", text }));
      setAgentOptions(null); // any reply clears a pending picker
      setCopilotBusy(true);
    },
    [pushAgentMsg],
  );

  const handleSendCopilot = useCallback(
    (e) => {
      e?.preventDefault();
      const text = copilotInput.trim();
      if (!text || copilotBusy) return;
      setShowInputSuggestions(false);
      setCopilotInput("");
      sendToAgent(text);
    },
    [copilotInput, copilotBusy, sendToAgent],
  );

  const toggleAgentOption = useCallback((name) => {
    setAgentOptions((o) => {
      if (!o) return o;
      const selected = new Set(o.selected);
      selected.has(name) ? selected.delete(name) : selected.add(name);
      return { ...o, selected };
    });
  }, []);

  // The picked chips plus any typed extras (when the picker allows them).
  const agentSelection = useMemo(() => {
    if (!agentOptions) return [];
    const custom = agentOptions.allowCustom
      ? agentOptions.custom
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
    return [...new Set([...agentOptions.selected, ...custom])];
  }, [agentOptions]);
  const agentSelectionCount = agentSelection.length;

  const confirmAgentOptions = useCallback(() => {
    if (!agentSelection.length) return;
    sendToAgent(agentSelection.join(", "));
  }, [agentSelection, sendToAgent]);

  // Tell the agent which upload the pipeline should analyse. Sending no id
  // switches it back to fetching from the data providers.
  const notifyAgentFile = useCallback((file, fileUploadId) => {
    const ws = agentWsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(
      JSON.stringify({
        type: "attach_file",
        name: file ? file.name : "",
        file_upload_id: fileUploadId || "",
      }),
    );
  }, []);

  // Upload immediately so the agent can put a real file_upload_id on the data
  // node; raw_articles.project_id is nullable, so no project is needed yet.
  const handleFileChange = useCallback(
    async (e) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      if (!COPILOT_FILE_EXT_RE.test(file.name)) {
        toast.error(
          "Only CSV or Excel (.csv, .xlsx, .xls) files are supported.",
        );
        return;
      }
      setCopilotFile(file);
      copilotFileRef.current = file;
      setCopilotBusy(true);
      toast.loading(`Uploading ${file.name}...`, { id: "wf_agent_upload" });
      try {
        const res = await uploadFile({ projectId: project?.id ?? null, file });
        if (!res?.file_upload_id)
          throw new Error("Upload returned no file id.");
        copilotUploadIdRef.current = res.file_upload_id;
        notifyAgentFile(file, res.file_upload_id);
        toast.success(`Attached ${file.name} (${res.record_count} articles)`, {
          id: "wf_agent_upload",
        });
      } catch (err) {
        setCopilotFile(null);
        copilotFileRef.current = null;
        copilotUploadIdRef.current = null;
        toast.error(err.message || "Failed to upload file", {
          id: "wf_agent_upload",
        });
      } finally {
        setCopilotBusy(false);
      }
    },
    [notifyAgentFile, project?.id],
  );

  const clearCopilotFile = useCallback(() => {
    setCopilotFile(null);
    copilotFileRef.current = null;
    copilotUploadIdRef.current = null;
    notifyAgentFile(null, null);
  }, [notifyAgentFile]);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedId),
    [nodes, selectedId],
  );

  const handleNodeDataChange = useCallback(
    (patch) => {
      if (!selectedId) return;
      setNodes((nds) => {
        const targetNode = nds.find((n) => n.id === selectedId);
        if (!targetNode) return nds;

        const nextTargetData = { ...targetNode.data, ...patch };

        if (
          targetNode.type === "analysis" &&
          patch.competitorKeywords !== undefined
        ) {
          const updatedKeywords = nextTargetData.competitorKeywords || [];
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
            return n;
          });
        }

        return nds.map((n) =>
          n.id === selectedId ? { ...n, data: { ...n.data, ...patch } } : n,
        );
      });
    },
    [selectedId],
  );
  const [submitted, setSubmitted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const nodesWithErrors = useMemo(
    () =>
      nodes.map((n) =>
        fieldErrors[n.id]?.length
          ? { ...n, data: { ...n.data, errors: fieldErrors[n.id] } }
          : n,
      ),
    [nodes, fieldErrors],
  );

  useEffect(() => {
    if (!submitted) return;
    setFieldErrors(computeFieldErrors(nodes, edges, session));
  }, [nodes, edges, submitted, session]);

  // WORKFLOW VALIDATION & SAVING LOGIC
  const validateWorkflow = useCallback(() => {
    setSubmitted(true);

    // 1. All 5 node types are required in the pipeline sequence: Data → Analysis → Review → Assembly → Output
    const dataNode = nodes.find((n) => n.type === "data");
    const analysisNode = nodes.find((n) => n.type === "analysis");
    const reviewNode = nodes.find((n) => n.type === "review");
    const assemblyNode = nodes.find((n) => n.type === "assembly");
    const outputNode = nodes.find((n) => n.type === "output");

    if (!dataNode) throw new Error("Please add a Data node to the workflow.");
    if (!analysisNode)
      throw new Error("Please add an Analysis node to the workflow.");
    if (!reviewNode)
      throw new Error("Please add a Review node to the workflow.");
    if (!assemblyNode)
      throw new Error("Please add an Assembly node to the workflow.");
    if (!outputNode)
      throw new Error("Please add an Output node to the workflow.");

    // 2. Per-node field & connection errors check
    const errs = computeFieldErrors(nodes, edges, session);
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      throw new Error(
        "Please fix the highlighted issues and connect all nodes (Data → Analysis → Review → Assembly → Output) before proceeding.",
      );
    }

    // 3. Edge order validity check
    const byId = new Map(nodes.map((n) => [n.id, n]));
    for (const edge of edges) {
      if (!isEdgeValid(edge, byId)) {
        throw new Error(
          "Connection error: Nodes must connect in order: Data → Analysis → Review → Assembly → Output.",
        );
      }
    }

    // 4. End-to-end path reachability check from Data to Output
    const dataNodeIds = new Set(
      nodes.filter((n) => n.type === "data").map((n) => n.id),
    );
    const outputNodeIds = new Set(
      nodes.filter((n) => n.type === "output").map((n) => n.id),
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

    const isApiSource = dataNode.data?.sourceType === "api";
    const selectedSources = selectedApiSources(dataNode.data);
    const hasActiveSources = selectedSources.length > 0;
    const fileObject = dataNode.data?.fileObject;
    const hasFile = !!(
      fileObject ||
      dataNode.data?.file ||
      dataNode.data?.file_upload_id ||
      session?.source_file
    );

    if (!hasFile && !hasActiveSources) {
      throw new Error(
        "Either File Upload or an Active Data Provider is required in the Data node settings.",
      );
    }

    // `queries` is what the backend fetches with; `query` is the editor's text.
    if (
      (isApiSource || hasActiveSources) &&
      !dataNode.data?.queries?.length &&
      !dataNode.data?.query?.trim() &&
      !(dataNode.data?.brandKeywords || []).length
    ) {
      throw new Error(
        "Please enter a Query in the Data node settings when a Data Provider is selected.",
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
      if (!an.data?.lens)
        throw new Error(
          "Please select an Intelligence Lens for all Analysis nodes.",
        );
      if ((an.data?.competitorKeywords || []).length === 0) {
        throw new Error(
          "Please enter at least one competitor keyword in the Analysis node settings.",
        );
      }
    }

    const competitorKeywords = Array.from(
      new Set(analysisNodes.flatMap((an) => an.data?.competitorKeywords || [])),
    );

    const messageKeywords = dataNode.data?.messageKeywords || [];
    if (messageKeywords.length === 0) {
      throw new Error(
        "Please enter at least one message keyword in the Data node settings.",
      );
    }

    const projectName =
      outputNode.data?.projectName?.trim() ||
      workflowTitle ||
      "My Media Analytics Project";
    const projectDescription =
      outputNode.data?.projectDescription?.trim() ||
      "PR and Media Intelligence Analysis Workflow";

    return {
      fileObject,
      brandKeywords,
      competitorKeywords,
      messageKeywords,
      projectName,
      projectDescription,
    };
  }, [nodes, edges, session, workflowTitle]);

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

      if (session?.id && !fileObject) {
        return {
          projectId: project?.id || "default_project",
          sessionId: session.id,
          freshProject: project,
          freshSession: session,
        };
      }

      let targetProjectId = project?.id;
      let freshProj = project;

      if (!targetProjectId) {
        toast.loading("Creating project...", { id: "wf_save" });
        freshProj = await createProject({
          name: projectName,
          description: projectDescription,
        });
        targetProjectId = freshProj.id;
      } else if (
        projectName !== project?.name ||
        projectDescription !== project?.description
      ) {
        toast.loading("Updating project...", { id: "wf_save" });
        await updateProject(targetProjectId, {
          name: projectName,
          description: projectDescription,
        });
      }

      let latestSession = null;

      if (fileObject) {
        toast.loading("Uploading file...", { id: "wf_save" });
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

        toast.loading("Creating session...", { id: "wf_save" });
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
      } else {
        toast.loading("Creating analytics session...", { id: "wf_save" });
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
        throw new Error("Could not create session for project.");

      return {
        projectId: targetProjectId,
        sessionId: latestSession.id,
        freshProject: freshProj,
        freshSession: latestSession,
        freshNodes: nodesToUse,
      };
    },
    [session, project, nodes, edges],
  );

  const handleSaveWorkflow = useCallback(
    async (skipAmbigCheck = false, overrideNodes = null) => {
      if (saving) return null;

      const activeNodes = overrideNodes || nodes;

      if (skipAmbigCheck !== true) {
        const ambigNode = getAmbiguousDataNode(activeNodes);
        if (ambigNode) {
          pendingSaveActionRef.current = "save";
          setDataSourceConfirmOpen(true);
          return null;
        }
      }

      setSubmitted(true);
      const errs = computeFieldErrors(activeNodes, edges, session);
      setFieldErrors(errs);
      if (Object.keys(errs).length > 0) {
        toast.error(
          "Please fix the highlighted issues and connect all nodes (Data → Analysis → Review → Assembly → Output) before saving.",
          { id: "wf_save" },
        );
        return null;
      }
      try {
        setSaving(true);
        const validated = validateWorkflow(activeNodes);
        const {
          projectId: pid,
          sessionId: sid,
          freshSession,
          freshProject,
          freshNodes,
        } = await ensureProjectAndSession(validated, activeNodes);
        const finalNodes = freshNodes || activeNodes;
        const serialized = serializeWorkflow(finalNodes, edges);
        await saveWorkflow(sid, serialized);
        invalidateSessionCache(sid);
        const latestSess = await getSession(sid).catch(() => null);
        if (latestSess) seedSession(sid, latestSess);

        // Adopt what was just created so the next save updates it, and put the
        // ids in the URL so a reload resumes the same workflow.
        const savedSess = latestSess || freshSession;
        if (savedSess) setSavedSession(savedSess);
        if (freshProject) setSavedProject(freshProject);
        if (pid && sid) {
          navigate(paths.workflowStudioSession(pid, sid), {
            replace: true,
            state: { project: freshProject, session: savedSess },
          });
        }

        toast.success(
          isSaved ? "Workflow updated successfully!" : "Workflow saved successfully!",
          { id: "wf_save" },
        );
        return {
          projectId: pid,
          sessionId: sid,
          session: savedSess,
          freshProject,
        };
      } catch (err) {
        toast.error(err.message || "Failed to save workflow.", {
          id: "wf_save",
        });
        return null;
      } finally {
        setSaving(false);
      }
    },
    [
      saving,
      getAmbiguousDataNode,
      validateWorkflow,
      ensureProjectAndSession,
      nodes,
      edges,
      session,
      isSaved,
      navigate,
    ],
  );

  const handleSaveAndNavigateToReview = useCallback(
    async (skipAmbigCheck = false, overrideNodes = null) => {
      const activeNodes = overrideNodes || nodes;

      if (skipAmbigCheck !== true) {
        const ambigNode = getAmbiguousDataNode(activeNodes);
        if (ambigNode) {
          pendingSaveActionRef.current = "review";
          setDataSourceConfirmOpen(true);
          return;
        }
      }

      setSubmitted(true);
      const errs = computeFieldErrors(activeNodes, edges, session);
      setFieldErrors(errs);
      if (Object.keys(errs).length > 0) {
        toast.error(
          "Please fix the highlighted issues and connect all nodes (Data → Analysis → Review → Assembly → Output) before proceeding.",
          { id: "wf_save" },
        );
        return;
      }
      const saved = await handleSaveWorkflow(true, activeNodes);
      if (saved?.projectId && saved?.sessionId) {
        toast.success("Navigating to Review Screen...");
        navigate(paths.review(saved.projectId, saved.sessionId), {
          state: { project: saved.freshProject, session: saved.session },
        });
      }
    },
    [getAmbiguousDataNode, handleSaveWorkflow, navigate, nodes, edges, session],
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
    } else if (action === "review") {
      handleSaveAndNavigateToReview(true, updatedNodes);
    }
  }, [handleSaveWorkflow, handleSaveAndNavigateToReview, nodes, setNodes]);

  return (
    <div
      style={{
        display: "flex",
        width: "100vw",
        height: "100vh",
        /* PURE WHITE BACKGROUND */
        backgroundColor: "#FFFFFF",
        overflow: "hidden",
        fontFamily: "'Inter', system-ui, sans-serif",
        position: "relative",
      }}
    >
      {/* Global backdrop click closer for popovers */}
      {activePopover && (
        <div
          onClick={() => setActivePopover(null)}
          style={{ position: "fixed", inset: 0, zIndex: 99, cursor: "default" }}
        />
      )}

      {/* ==================================================================== */}
      {/* 1. LEFT FLOATING ICON SIDEBAR */}
      {/* ==================================================================== */}
      <aside
        style={{
          width: 58,
          height: "calc(100vh - 24px)",
          margin: "12px 0 12px 12px",
          borderRadius: 20,
          // backgroundColor: "#FFFFFF",
          // border: "1px solid #E5E7EB",
          // boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 0",
          zIndex: 40,
          flexShrink: 0,
        }}
      >
        {/* Top Floating Nav Icons */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
          }}
        >
          <button
            type="button"
            onClick={() => navigate("/")}
            title="Go to Dashboards Home"
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              border: "none",
              background:
                "linear-gradient(135deg, #FF6B9D 0%, #C084FC 50%, #60A5FA 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 14px rgba(192, 132, 252, 0.4)",
              cursor: "pointer",
            }}
          >
            <img
              src={logoImg}
              alt="AlphaMetricx"
              style={{ width: 20, height: 20, objectFit: "contain" }}
            />
          </button>

          {/* Database Data Types Popover */}
          <div style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() =>
                setActivePopover((p) => (p === "data" ? null : "data"))
              }
              style={{
                ...styles.iconNavBtn,
                backgroundColor:
                  activePopover === "data" ? "#EEF2FF" : "transparent",
              }}
              title="Filter Content Types"
            >
              <DatabaseIcon
                size={19}
                color={activePopover === "data" ? "#4F46E5" : "#4B5563"}
              />
            </button>

            {activePopover === "data" && (
              <div style={styles.popoverPanel}>
                <div
                  style={{
                    paddingBottom: 8,
                    borderBottom: "1px solid #F3F4F6",
                    marginBottom: 8,
                  }}
                >
                  <span
                    style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}
                  >
                    Data Types
                  </span>
                  <p style={{ fontSize: 11, color: "#6B7280", margin: 0 }}>
                    Select content sources analyzed
                  </p>
                </div>
                {DATA_TYPES.map((type) => {
                  const active = selectedDataTypes.includes(type);
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setSelectedDataTypes((prev) =>
                          active
                            ? prev.filter((t) => t !== type)
                            : [...prev, type],
                        );
                      }}
                      style={styles.popoverOptionBtn}
                    >
                      <span style={{ fontSize: 13, color: "#374151" }}>
                        {type}
                      </span>
                      {active && <CheckIcon size={14} color="#4F46E5" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Calendar Timeline Popover */}
          <div style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() =>
                setActivePopover((p) => (p === "timeline" ? null : "timeline"))
              }
              style={{
                ...styles.iconNavBtn,
                backgroundColor:
                  activePopover === "timeline" ? "#EEF2FF" : "transparent",
              }}
              title="Master Timeline Window"
            >
              <CalendarIcon
                size={19}
                color={activePopover === "timeline" ? "#4F46E5" : "#4B5563"}
              />
            </button>

            {activePopover === "timeline" && (
              <div style={styles.popoverPanel}>
                <div
                  style={{
                    paddingBottom: 8,
                    borderBottom: "1px solid #F3F4F6",
                    marginBottom: 8,
                  }}
                >
                  <span
                    style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}
                  >
                    Timeline Window
                  </span>
                  <p style={{ fontSize: 11, color: "#6B7280", margin: 0 }}>
                    Select date filter range
                  </p>
                </div>
                {TIMELINES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setSelectedTimeline(t);
                      setActivePopover(null);
                      toast.success(`Timeline scope: ${t}`);
                    }}
                    style={styles.popoverOptionBtn}
                  >
                    <span style={{ fontSize: 13, color: "#374151" }}>{t}</span>
                    {selectedTimeline === t && (
                      <CheckIcon size={14} color="#4F46E5" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Globe Location Popover */}
          <div style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() =>
                setActivePopover((p) => (p === "location" ? null : "location"))
              }
              style={{
                ...styles.iconNavBtn,
                backgroundColor:
                  activePopover === "location" ? "#EEF2FF" : "transparent",
              }}
              title="Filter by Region"
            >
              <GlobeIcon
                size={19}
                color={activePopover === "location" ? "#4F46E5" : "#4B5563"}
              />
            </button>

            {activePopover === "location" && (
              <div style={styles.popoverPanel}>
                <div
                  style={{
                    paddingBottom: 8,
                    borderBottom: "1px solid #F3F4F6",
                    marginBottom: 8,
                  }}
                >
                  <span
                    style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}
                  >
                    Locations
                  </span>
                  <p style={{ fontSize: 11, color: "#6B7280", margin: 0 }}>
                    Filter data by geographical region
                  </p>
                </div>
                {LOCATIONS.map((loc) => {
                  const active = selectedLocations.includes(loc);
                  return (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => {
                        setSelectedLocations((prev) =>
                          active
                            ? prev.filter((l) => l !== loc)
                            : [...prev, loc],
                        );
                      }}
                      style={styles.popoverOptionBtn}
                    >
                      <span style={{ fontSize: 13, color: "#374151" }}>
                        {loc}
                      </span>
                      {active && <CheckIcon size={14} color="#4F46E5" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Floating Nav Icons */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <button
            type="button"
            style={styles.bottomIconBtn}
            title="Share Workflow Link"
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
              toast.success("Workflow URL copied to clipboard!");
            }}
          >
            <ShareIcon size={16} color="#4B5563" />
          </button>

          <button
            type="button"
            style={styles.bottomIconBtn}
            title="Export JSON Schema"
            onClick={handleExportJson}
          >
            <DownloadIcon size={16} color="#4B5563" />
          </button>

          {/* Connected Data & Folder Settings Popover */}
          <div style={{ position: "relative" }}>
            <button
              type="button"
              style={{
                ...styles.bottomIconBtn,
                backgroundColor:
                  activePopover === "folder" ? "#EEF2FF" : "#F3F4F6",
              }}
              title="Connected Data & API Settings"
              onClick={() =>
                setActivePopover((p) => (p === "folder" ? null : "folder"))
              }
            >
              <FolderIcon
                size={16}
                color={activePopover === "folder" ? "#4F46E5" : "#4B5563"}
              />
            </button>

            {activePopover === "folder" && (
              <div style={{ ...styles.popoverPanel, bottom: 0, top: "auto" }}>
                <div
                  style={{
                    paddingBottom: 8,
                    borderBottom: "1px solid #F3F4F6",
                    marginBottom: 8,
                  }}
                >
                  <span
                    style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}
                  >
                    Connected Sources
                  </span>
                  <p style={{ fontSize: 11, color: "#6B7280", margin: 0 }}>
                    API & File Data Integrations
                  </p>
                </div>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 6 }}
                >
                  <div
                    style={{
                      padding: 8,
                      borderRadius: 8,
                      backgroundColor: "#F9FAFB",
                      fontSize: 12,
                      color: "#374151",
                    }}
                  >
                    <strong>AlphaMetricx API</strong> (Connected)
                  </div>
                  <div
                    style={{
                      padding: 8,
                      borderRadius: 8,
                      backgroundColor: "#F9FAFB",
                      fontSize: 12,
                      color: "#374151",
                    }}
                  >
                    <strong>Local CSV / Excel Upload</strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ==================================================================== */}
      {/* MAIN CONTENT WRAPPER */}
      {/* ==================================================================== */}
      <div
        style={{
          flex: 1,
          height: "calc(100vh - 24px)",
          margin: "12px 0px 12px 12px",
          display: "flex",
          gap: 12,
          overflow: "hidden",
          zIndex: 10,
        }}
      >
        {/* ================================================================== */}
        {/* 2. LEFT CHAT PANEL (ANIMATED SLIDE-IN) */}
        {/* ================================================================== */}
        <div
          style={{
            width: showChatPanel ? 380 : 0,
            opacity: showChatPanel ? 1 : 0,
            transform: showChatPanel ? "translateX(0)" : "translateX(-20px)",
            transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
            overflow: "hidden",
            // borderRadius: 20,
            backgroundColor: "#FFFFFF",
            // border: "1px solid #E5E7EB",
            // boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
            display: "flex",
            flexDirection: "column",
            flexShrink: 0,
            position: "relative",
            zIndex: 30,
          }}
        >
          {/* Chat Panel Header */}
          <div
            style={{
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid #F3F4F6",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>
                Chat 01
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: 12,
                  backgroundColor: "#F3F4F6",
                  color: "#6B7280",
                }}
              >
                Workflow AI
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowChatPanel(false)}
              title="Close chat panel"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 4,
                color: "#9CA3AF",
              }}
            >
              <CloseIcon size={18} />
            </button>
          </div>

          {/* What the agent has gathered so far */}
          <AgentStatePanel state={agentState} providers={agentProviders} />

          {/* Chat Messages Thread / Empty Orb Graphic */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: 20,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {copilotThread.length === 0 ? (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    width: 140,
                    height: 140,
                    borderRadius: "50%",
                    background:
                      "radial-gradient(circle at 35% 35%, #F472B6 0%, #C084FC 45%, #818CF8 75%, #60A5FA 100%)",
                    boxShadow:
                      "0 0 50px rgba(192, 132, 252, 0.4), inset 0 0 20px rgba(255, 255, 255, 0.6)",
                    marginBottom: 28,
                    animation: "pulseOrb 4s ease-in-out infinite alternate",
                  }}
                />
                <h3
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: "#374151",
                    maxWidth: 220,
                    lineHeight: 1.45,
                    margin: 0,
                  }}
                >
                  Build workflows, nodes and ask questions
                </h3>
              </div>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                {copilotThread.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems:
                        msg.role === "user" ? "flex-end" : "flex-start",
                    }}
                  >
                    <div
                      style={{
                        maxWidth: "88%",
                        padding: "12px 16px",
                        borderRadius:
                          msg.role === "user"
                            ? "18px 18px 4px 18px"
                            : "18px 18px 18px 4px",
                        backgroundColor:
                          msg.role === "user"
                            ? "#4F46E5"
                            : msg.role === "error"
                              ? "#FEE2E2"
                              : "#F3F4F6",
                        color:
                          msg.role === "user"
                            ? "#FFFFFF"
                            : msg.role === "error"
                              ? "#DC2626"
                              : "#1F2937",
                        fontSize: 13.5,
                        lineHeight: 1.5,
                      }}
                    >
                      {msg.text}
                      {msg.kind === "query" && (
                        <div
                          style={{
                            marginTop: 10,
                            display: "flex",
                            flexDirection: "column",
                            gap: 6,
                          }}
                        >
                          {(msg.queries || []).map((q, i) => (
                            <code
                              key={i}
                              style={{
                                display: "block",
                                padding: "8px 10px",
                                borderRadius: 8,
                                backgroundColor: "#FFFFFF",
                                border: "1px solid #E5E7EB",
                                fontFamily:
                                  "ui-monospace, SFMono-Regular, Menlo, monospace",
                                fontSize: 12,
                                lineHeight: 1.5,
                                color: "#1F2937",
                                whiteSpace: "pre-wrap",
                              }}
                            >
                              {q}
                            </code>
                          ))}
                          {msg.rationale && (
                            <span style={{ fontSize: 12, color: "#6B7280" }}>
                              {msg.rationale}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {agentOptions && !copilotBusy && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                      padding: 12,
                      borderRadius: 12,
                      border: "1px solid #E5E7EB",
                      backgroundColor: "#FFFFFF",
                    }}
                  >
                    <span style={{ fontSize: 12, color: "#6B7280" }}>
                      {agentOptions.allowCustom
                        ? "Pick one or more, then confirm:"
                        : "Select the sources to use, then confirm:"}
                    </span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {agentOptions.options.map((name) => {
                        const on = agentOptions.selected.has(name);
                        return (
                          <button
                            key={name}
                            type="button"
                            onClick={() => toggleAgentOption(name)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              padding: "6px 11px",
                              borderRadius: 999,
                              cursor: "pointer",
                              fontSize: 12.5,
                              border: on
                                ? "1px solid #4F46E5"
                                : "1px solid #E5E7EB",
                              backgroundColor: on ? "#EEF2FF" : "#FFFFFF",
                              color: on ? "#4338CA" : "#374151",
                            }}
                          >
                            {on && <CheckIcon size={13} color="#4F46E5" />}
                            {name}
                          </button>
                        );
                      })}
                    </div>
                    {agentOptions.allowCustom && (
                      <input
                        value={agentOptions.custom}
                        placeholder="Add your own (comma-separated)…"
                        onChange={(e) =>
                          setAgentOptions((o) =>
                            o ? { ...o, custom: e.target.value } : o,
                          )
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") confirmAgentOptions();
                        }}
                        style={{
                          padding: "8px 10px",
                          borderRadius: 8,
                          border: "1px solid #E5E7EB",
                          fontSize: 12.5,
                          outline: "none",
                        }}
                      />
                    )}
                    <button
                      type="button"
                      onClick={confirmAgentOptions}
                      disabled={!agentSelectionCount}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: "none",
                        cursor: "pointer",
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: "#FFFFFF",
                        backgroundColor: agentSelectionCount
                          ? "#4F46E5"
                          : "#C7D2FE",
                      }}
                    >
                      Confirm selection
                    </button>
                  </div>
                )}

                {copilotBusy && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      color: "#6B7280",
                      fontSize: 13,
                    }}
                  >
                    <SparklesIcon size={16} color="#8B5CF6" />
                    <span>Designing your workflow...</span>
                  </div>
                )}
                <div ref={chatThreadEndRef} />
              </div>
            )}
          </div>

          {/* Floating Bottom Input Card */}
          <div style={{ padding: 16, position: "relative" }}>
            {/* Suggested Prompts Popover when Input Focused */}
            {showInputSuggestions && (
              <div
                className="suggestion-box-anim"
                style={{
                  marginBottom: 10,
                  backgroundColor: "#FFFFFF",
                  borderRadius: 16,
                  border: "1px solid #E0E7FF",
                  boxShadow:
                    "0 12px 28px -6px rgba(79, 70, 229, 0.15), 0 4px 12px rgba(0, 0, 0, 0.05)",
                  padding: "12px 14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  zIndex: 30,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <SparklesIcon size={15} color="#4F46E5" />
                    <span
                      style={{
                        fontSize: 12.5,
                        fontWeight: 700,
                        color: "#1F2937",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      Suggested Questions
                    </span>
                  </div>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setShowInputSuggestions(false)}
                    style={{
                      border: "none",
                      background: "none",
                      cursor: "pointer",
                      fontSize: 13,
                      color: "#9CA3AF",
                      padding: "2px 6px",
                      borderRadius: 4,
                    }}
                    title="Dismiss suggestions"
                  >
                    ✕
                  </button>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  {COPILOT_SAMPLE_PROMPTS.map((promptText, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="suggestion-step-anim"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setCopilotInput(promptText);
                        setShowInputSuggestions(false);
                        if (copilotInputRef.current) {
                          copilotInputRef.current.focus();
                        }
                      }}
                      style={{
                        textAlign: "left",
                        fontSize: 12,
                        lineHeight: 1.45,
                        color: "#374151",
                        backgroundColor: "#F8FAFC",
                        border: "1px solid #F1F5F9",
                        borderRadius: 10,
                        padding: "8px 11px",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        animationDelay: `${idx * 0.08 + 0.05}s`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#EEF2FF";
                        e.currentTarget.style.borderColor = "#C7D2FE";
                        e.currentTarget.style.color = "#4338CA";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#F8FAFC";
                        e.currentTarget.style.borderColor = "#F1F5F9";
                        e.currentTarget.style.color = "#374151";
                      }}
                    >
                      {promptText}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form
              onSubmit={handleSendCopilot}
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 18,
                border: "1px solid #E5E7EB",
                boxShadow: "0 8px 30px rgba(0, 0, 0, 0.06)",
                padding: "12px 14px",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {copilotFile && (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 10px",
                    borderRadius: 8,
                    backgroundColor: "#EEF2FF",
                    color: "#4338CA",
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                >
                  📄 {copilotFile.name}
                  <button
                    type="button"
                    onClick={clearCopilotFile}
                    style={{
                      border: "none",
                      background: "none",
                      cursor: "pointer",
                      color: "#4338CA",
                    }}
                  >
                    ✕
                  </button>
                </div>
              )}

              <textarea
                ref={copilotInputRef}
                value={copilotInput}
                onChange={(e) => setCopilotInput(e.target.value)}
                onFocus={() => setShowInputSuggestions(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendCopilot(e);
                  }
                }}
                placeholder="Ask to build a workflow, connect nodes, or upload data..."
                rows={1}
                style={{
                  width: "100%",
                  border: "none",
                  outline: "none",
                  resize: "none",
                  fontSize: 13.5,
                  color: "#1F2937",
                  fontFamily: "inherit",
                  backgroundColor: "transparent",
                }}
              />

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingTop: 4,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => copilotFileInputRef.current?.click()}
                    style={styles.inputToolbarBtn}
                    title="Attach file"
                  >
                    <PlusIcon size={16} color="#6B7280" />
                  </button>
                  <input
                    ref={copilotFileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                  />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button
                    type="button"
                    style={styles.inputToolbarBtn}
                    title="Voice Input"
                  >
                    <MicIcon size={16} color="#6B7280" />
                  </button>
                  <button
                    type="submit"
                    disabled={!copilotInput.trim() || copilotBusy}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: "50%",
                      border: "none",
                      background: copilotInput.trim()
                        ? "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)"
                        : "#E5E7EB",
                      color: "#FFFFFF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: copilotInput.trim() ? "pointer" : "not-allowed",
                    }}
                  >
                    <SendIcon size={14} color="#FFFFFF" />
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* ================================================================== */}
        {/* 3. RIGHT MAIN WORKSPACE SECTION */}
        {/* ================================================================== */}
        <main
          style={{
            flex: 1,
            height: "100%",
            borderRadius: "20px 0 0 20px",
            backgroundColor: "#FFFFFF",
            border: "1px solid #E5E7EB",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            position: "relative",
            transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
            minWidth: 0,
          }}
        >
          {/* Top Bar Navigation (NO TEXT CLAMPING & NO WRAPPING) */}
          <header
            style={{
              height: 58,
              padding: "0 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid #F3F4F6",
              backgroundColor: "#FFFFFF",
              zIndex: 20,
              gap: 12,
              overflowX: "auto",
            }}
          >
            {/* Left: Back Button & Editable Title */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexShrink: 0,
                minWidth: 0,
              }}
            >
              <button
                type="button"
                onClick={() => (onBack ? onBack() : navigate("/"))}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#6B7280",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                <BackArrowIcon size={15} />
                <span>Back to Dashboards</span>
              </button>
              <span style={{ color: "#D1D5DB" }}>/</span>
              <input
                type="text"
                value={workflowTitle}
                onChange={(e) => setWorkflowTitle(e.target.value)}
                style={{
                  border: "none",
                  outline: "none",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#111827",
                  backgroundColor: "transparent",
                  minWidth: 120,
                  whiteSpace: "nowrap",
                }}
                title="Click to rename workflow"
              />
            </div>

            {/* Right Header Actions (WHITE-SPACE NOWRAP - NO CLAMPING) */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexShrink: 0,
                position: "relative",
              }}
            >
              {/* Toggle AI Chat Button */}
              <button
                type="button"
                onClick={() => {
                  setShowChatPanel((prev) => !prev);
                  if (!choiceSelected) setChoiceSelected("ai");
                }}
                style={{
                  ...styles.headerActionBtn,
                  backgroundColor: showChatPanel ? "#EEF2FF" : "#FFFFFF",
                  color: showChatPanel ? "#4338CA" : "#374151",
                }}
              >
                <SparklesIcon
                  size={15}
                  color={showChatPanel ? "#4338CA" : "#8B5CF6"}
                />
                <span>{showChatPanel ? "Hide Chat" : "Build with AI"}</span>
              </button>

              {/* + ADD STEP BUTTON */}
              <button
                type="button"
                onClick={() => setShowAddModuleModal(true)}
                style={styles.headerActionBtn}
              >
                <PlusIcon size={15} color="#374151" />
                <span>Add Step</span>
              </button>

              {/* Save Workflow Button */}
              <button
                type="button"
                onClick={() => handleSaveWorkflow()}
                disabled={saving}
                style={{
                  ...styles.headerActionBtn,
                  opacity: saving ? 0.6 : 1,
                  cursor: saving ? "not-allowed" : "pointer",
                }}
                title="Save workflow graph to current session"
              >
                <DownloadIcon size={14} color="currentColor" />
                <span>
                  {saving
                    ? isSaved
                      ? "Updating..."
                      : "Saving..."
                    : isSaved
                      ? "Update Workflow"
                      : "Save Workflow"}
                </span>
              </button>

              {/* Proceed to Review Screen Primary CTA */}
              <button
                type="button"
                onClick={() => handleSaveAndNavigateToReview()}
                disabled={saving}
                style={{
                  ...styles.headerActionBtn,
                  border: "none",
                  background:
                    "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
                  color: "#FFFFFF",
                  boxShadow: "0 4px 14px rgba(79, 70, 229, 0.4)",
                  opacity: saving ? 0.6 : 1,
                  cursor: saving ? "not-allowed" : "pointer",
                }}
                title="Validate workflow, save graph, and open Review Table"
              >
                <span>Proceed to Review</span>
                <ForwardArrowIcon size={15} color="#FFFFFF" />
              </button>

              {/* FUNCTIONAL VERTICAL DOTS MENU */}
              <div style={{ position: "relative" }}>
                <button
                  type="button"
                  style={{
                    ...styles.headerIconButton,
                    backgroundColor:
                      activePopover === "moreMenu" ? "#EEF2FF" : "#FFFFFF",
                  }}
                  onClick={() =>
                    setActivePopover((p) =>
                      p === "moreMenu" ? null : "moreMenu",
                    )
                  }
                  title="Workflow Actions"
                >
                  <MoreVerticalIcon size={18} color="#6B7280" />
                </button>

                {activePopover === "moreMenu" && (
                  <div
                    style={{
                      position: "fixed",
                      top: 66,
                      right: 24,
                      width: 210,
                      backgroundColor: "#FFFFFF",
                      borderRadius: 16,
                      border: "1px solid #E5E7EB",
                      boxShadow: "0 12px 36px rgba(0, 0, 0, 0.16)",
                      padding: 8,
                      zIndex: 2000,
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                    }}
                  >
                    <button
                      type="button"
                      onClick={handleAutoLayout}
                      style={styles.popoverOptionBtn}
                    >
                      🔄 Auto-Layout Graph
                    </button>
                    <button
                      type="button"
                      onClick={handleExportJson}
                      style={styles.popoverOptionBtn}
                    >
                      📄 Export Schema JSON
                    </button>
                    <div
                      style={{
                        height: 1,
                        backgroundColor: "#F3F4F6",
                        margin: "4px 0",
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleClearCanvas}
                      style={{ ...styles.popoverOptionBtn, color: "#DC2626" }}
                    >
                      🗑️ Reset Canvas
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Main Canvas Container */}
          <div
            style={{
              flex: 1,
              position: "relative",
              width: "100%",
              height: "100%",
            }}
          >
            {/* CHOICE CARDS OVERLAY */}
            {(!choiceSelected || nodes.length === 0) && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  zIndex: 15,
                  backgroundColor: "rgba(255, 255, 255, 0.85)",
                  backdropFilter: "blur(12px)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 30,
                }}
              >
                <div
                  style={{
                    textAlign: "center",
                    maxWidth: 480,
                    marginBottom: 36,
                  }}
                >
                  <h2
                    style={{
                      fontSize: 24,
                      fontWeight: 700,
                      color: "#111827",
                      margin: "0 0 10px",
                    }}
                  >
                    Build Your Analytics Workflow
                  </h2>
                  <p
                    style={{
                      fontSize: 14,
                      color: "#6B7280",
                      margin: 0,
                      lineHeight: 1.5,
                    }}
                  >
                    Choose whether to manually add your first step or let AI
                    build your entire media intelligence pipeline.
                  </p>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 24,
                    maxWidth: 640,
                    width: "100%",
                  }}
                >
                  <div onClick={handleSelectManual} style={styles.choiceCard}>
                    <div style={styles.choiceCardIconBox}>
                      <PlusIcon size={24} color="#4F46E5" />
                    </div>
                    <h3 style={styles.choiceCardTitle}>Add first step</h3>
                    <p style={styles.choiceCardSub}>
                      Manually select your Data Source node and assemble your
                      pipeline step by step.
                    </p>
                    <button type="button" style={styles.choiceCardButton}>
                      Select First Node
                    </button>
                  </div>

                  <div
                    onClick={handleSelectAi}
                    style={{
                      ...styles.choiceCard,
                      border: "2px solid #C084FC",
                      background:
                        "linear-gradient(180deg, #FFFFFF 0%, #FAF5FF 100%)",
                    }}
                  >
                    <div
                      style={{
                        ...styles.choiceCardIconBox,
                        background:
                          "linear-gradient(135deg, #F472B6 0%, #C084FC 100%)",
                        boxShadow: "0 6px 20px rgba(192, 132, 252, 0.35)",
                      }}
                    >
                      <SparklesIcon size={24} color="#FFFFFF" />
                    </div>
                    <h3 style={styles.choiceCardTitle}>Build with AI</h3>
                    <p style={styles.choiceCardSub}>
                      Describe your brand, competitors, and PR goals to
                      automatically generate a connected workflow.
                    </p>
                    <button
                      type="button"
                      style={{
                        ...styles.choiceCardButton,
                        background:
                          "linear-gradient(135deg, #9333EA 0%, #7C3AED 100%)",
                        color: "#FFFFFF",
                        border: "none",
                      }}
                    >
                      Launch AI Assistant
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ReactFlow Canvas */}
            <ReactFlow
              nodes={nodesWithErrors}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={handleConnect}
              nodeTypes={nodeTypes}
              onNodeClick={(_, node) => setSelectedId(node.id)}
              onPaneClick={() => setSelectedId(null)}
              deleteKeyCode={["Delete", "Backspace"]}
              fitView
              fitViewOptions={{ padding: 0.3 }}
              defaultEdgeOptions={{
                animated: true,
                focusable: true,
                deletable: true,
              }}
              proOptions={{ hideAttribution: false }}
            >
              <Background
                variant="lines"
                color="rgba(0, 0, 0, 0.08)"
                gap={24}
                size={1}
              />
              <Controls />
              <MiniMap
                nodeColor={(node) => {
                  switch (node.type) {
                    case "data":
                      return "#3B82F6";
                    case "analysis":
                      return "#8B5CF6";
                    case "review":
                      return "#F59E0B";
                    case "assembly":
                      return "#10B981";
                    case "output":
                      return "#EC4899";
                    default:
                      return "#6B7280";
                  }
                }}
                maskColor="rgba(255, 255, 255, 0.7)"
              />
            </ReactFlow>

            {/* RIGHT SIDE NODE INSPECTOR PANEL */}
            <ConfigPanel
              node={selectedNode}
              nodes={nodes}
              onChange={handleNodeDataChange}
              showErrors={submitted}
              project={project}
              session={session}
            />
          </div>
        </main>
      </div>

      {/* ==================================================================== */}
      {/* 4. ENTERPRISE ADD MODULE STAGE POP-UP MODAL DIALOG */}
      {/* ==================================================================== */}
      {showAddModuleModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.5)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={() => setShowAddModuleModal(false)}
        >
          <div
            style={{
              width: 540,
              backgroundColor: "#FFFFFF",
              borderRadius: 24,
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              border: "1px solid #E5E7EB",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              animation: "modalFadeIn 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "20px 26px 16px",
                borderBottom: "1px solid #F3F4F6",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: "#111827",
                    margin: "0 0 3px",
                    letterSpacing: "-0.01em",
                  }}
                >
                  Add Module Stage
                </h3>
                <p style={{ fontSize: 13, color: "#6B7280", margin: 0 }}>
                  Select a pipeline stage to add to your workflow graph
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddModuleModal(false)}
                style={{
                  border: "none",
                  background: "#F3F4F6",
                  cursor: "pointer",
                  color: "#6B7280",
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CloseIcon size={16} />
              </button>
            </div>

            {/* Modal Body: 5 Enterprise Module Cards with Glassmorphism Badges */}
            <div
              style={{
                padding: "20px 26px 24px",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              {MODULES.map((m) => {
                const acc =
                  MODULE_CARD_ACCENTS[m.type] || MODULE_CARD_ACCENTS.data;
                return (
                  <div
                    key={m.type}
                    onClick={() => handleAddModule(m.type)}
                    style={{
                      padding: "16px 20px",
                      borderRadius: 16,
                      backgroundColor: "#FFFFFF",
                      border: `1.5px solid ${acc.border}`,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.03)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = acc.btnBg;
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow =
                        "0 8px 24px rgba(0, 0, 0, 0.08)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#FFFFFF";
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow =
                        "0 4px 12px rgba(0, 0, 0, 0.03)";
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 16 }}
                    >
                      <GlassModuleIcon type={m.type} size={42} />
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span
                          style={{
                            fontSize: 15,
                            fontWeight: 700,
                            color: "#111827",
                          }}
                        >
                          {m.label}
                        </span>
                        <span style={{ fontSize: 12.5, color: "#6B7280" }}>
                          {m.hint}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      style={{
                        padding: "7px 16px",
                        borderRadius: 10,
                        border: `1.5px solid ${acc.btnBorder}`,
                        backgroundColor: "#FFFFFF",
                        color: acc.btnColor,
                        fontSize: 12.5,
                        fontWeight: 700,
                        cursor: "pointer",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                      }}
                    >
                      + Add Node
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {dataSourceConfirmOpen && (
        <DataSourceConfirmationModal
          onUploadFile={handleConfirmUploadFile}
          onProceedWithApi={handleConfirmProceedApi}
          onClose={() => setDataSourceConfirmOpen(false)}
        />
      )}

      <style>{`
        @keyframes pulseOrb {
          0% { transform: scale(1); filter: brightness(1); }
          100% { transform: scale(1.06); filter: brightness(1.1); }
        }
        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
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

// ============================================================================
// STYLES DICTIONARY
// ============================================================================

const styles = {
  iconNavBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    border: "none",
    backgroundColor: "transparent",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  bottomIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    border: "none",
    backgroundColor: "#F3F4F6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  inputToolbarBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    border: "1px solid #E5E7EB",
    backgroundColor: "#F9FAFB",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  headerActionBtn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "7px 14px",
    borderRadius: 10,
    border: "1px solid #E5E7EB",
    backgroundColor: "#FFFFFF",
    color: "#374151",
    fontSize: 13,
    fontWeight: 600,
    whiteSpace: "nowrap",
    flexShrink: 0,
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    border: "1px solid #E5E7EB",
    backgroundColor: "#FFFFFF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
  },
  popoverPanel: {
    position: "absolute",
    left: "calc(100% + 12px)",
    top: 0,
    width: 220,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    border: "1px solid #E5E7EB",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.12)",
    padding: 10,
    zIndex: 50,
    display: "flex",
    flexDirection: "column",
  },
  popoverOptionBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 10px",
    borderRadius: 8,
    border: "none",
    backgroundColor: "transparent",
    cursor: "pointer",
    fontSize: 13,
    color: "#374151",
    textAlign: "left",
    transition: "background-color 0.15s ease",
  },
  choiceCard: {
    flex: 1,
    padding: 24,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    border: "1px solid #E5E7EB",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.05)",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
  },
  choiceCardIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#EEF2FF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  choiceCardTitle: {
    fontSize: 17,
    fontWeight: 700,
    margin: "0 0 8px",
    color: "#111827",
  },
  choiceCardSub: {
    fontSize: 13,
    margin: "0 0 20px",
    lineHeight: 1.45,
    color: "#6B7280",
  },
  choiceCardButton: {
    marginTop: "auto",
    width: "100%",
    padding: "9px 16px",
    borderRadius: 10,
    border: "1px solid #E5E7EB",
    backgroundColor: "#F9FAFB",
    color: "#374151",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
};

export default function WorkflowStudioScreen(props) {
  return (
    <ReactFlowProvider>
      <WorkflowStudioContent {...props} />
    </ReactFlowProvider>
  );
}
