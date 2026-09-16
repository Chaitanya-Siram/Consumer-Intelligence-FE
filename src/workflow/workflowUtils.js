import { defaultNodeData } from "./constants.js";


export const ALL_COL_KEYS = [
  "id",
  "title",
  "content",
  "url",
  "date",
  "relevancy_confidence",
  "relevancy_reason",
  "section",
  "section_confidence",
  "brand",
  "sentiment",
  "sentiment_confidence",
  "theme",
  "theme_confidence",
  "competitors",
  "author",
  "priority",
  "people",
  "countries",
  "organizations",
  "syndication",
  "similar",
  "added_type",
];

export const INVALID_EDGE = {
  animated: false,
  className: "wfedge--invalid",
  style: { stroke: "#e5484d", strokeWidth: 2 },
};

export const VALID_EDGE = {
  animated: true,
  className: undefined,
  style: undefined,
};

export const MM_LENS = "media_monitoring";

export const MM_REVIEW_COLUMNS = [
  "id",
  "title",
  "content",
  "url",
  "date",
  "relevancy_confidence",
  "relevancy_reason",
  "section",
  "section_confidence",
  "author",
  "syndication",
  "similar",
];

export const OTHER_REVIEW_COLUMNS = ALL_COL_KEYS.filter(
  (k) => k !== "section" && k !== "section_confidence",
);

// Irrelevant articles never went through tagging, so only the body and the
// relevancy verdict have values worth showing.
export const IRRELEVANT_REVIEW_COLUMNS = [
  "id",
  "title",
  "content",
  "url",
  "date",
  "relevancy_confidence",
  "relevancy_reason",
  "author",
  "added_type",
];

let idSeq = 1;

export function getIdSeq() {
  return idSeq;
}

export function setIdSeq(val) {
  idSeq = val;
}

export function nextId(type) {
  return `${type}_${idSeq++}`;
}

export function restoreNodes(workflow) {
  let wf = workflow;
  if (typeof wf === "string") {
    try {
      wf = JSON.parse(wf);
    } catch {
      wf = null;
    }
  }
  return (wf?.nodes || []).map((n) => ({
    id: n.id,
    type: n.type,
    position: n.position || { x: 0, y: 0 },
    deletable: n.type !== "data",
    data: { ...(n.data || {}) },
  }));
}

export function restoreEdges(workflow) {
  let wf = workflow;
  if (typeof wf === "string") {
    try {
      wf = JSON.parse(wf);
    } catch {
      wf = null;
    }
  }
  return (wf?.edges || []).map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle,
    targetHandle: e.targetHandle,
    ...(e.invalid ? INVALID_EDGE : VALID_EDGE),
  }));
}

export function bumpIdSeq(nodes) {
  let max = 0;
  nodes.forEach((n) => {
    const m = /_(\d+)$/.exec(n.id || "");
    if (m) max = Math.max(max, parseInt(m[1], 10));
  });
  idSeq = Math.max(idSeq, max + 1);
}

export function hasSavedGraph(workflow) {
  let wf = workflow;
  if (typeof wf === "string") {
    try {
      wf = JSON.parse(wf);
    } catch {
      wf = null;
    }
  }
  return !!(wf && Array.isArray(wf.nodes) && wf.nodes.length);
}

export function seedNodes(session) {
  return [
    {
      id: "data_0",
      type: "data",
      position: { x: 80, y: 220 },
      deletable: false,
      data: defaultNodeData("data", {
        file: session?.source_file || "",
        brandKeywords: session?.brand_keywords || [],
        sourceType: "file",
      }),
    },
  ];
}

export function splitQueries(queryStr) {
  if (!queryStr) return [];
  const result = [];
  let current = "";
  let inSingleQuote = false;
  let inDoubleQuote = false;

  for (let i = 0; i < queryStr.length; i++) {
    const char = queryStr[i];
    if (char === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
      current += char;
    } else if (char === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
      current += char;
    } else if (char === "," && !inSingleQuote && !inDoubleQuote) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  if (current.trim()) {
    result.push(current.trim());
  }
  return result.filter((q) => q.length > 0);
}

export function updateApiPayload(queryText, selectedSources = ["google_news"], brandKeywords = []) {
  let rawText = queryText;
  if (!rawText && Array.isArray(brandKeywords) && brandKeywords.length > 0) {
    rawText = brandKeywords.join(", ");
  }
  const queriesArray = splitQueries(rawText || "");
  const formattedQueries = queriesArray
    .map((q) => {
      let trimmed = (q || "").trim();
      if (!trimmed) return "";
      // A boolean expression is already a query; wrapping it in quotes would turn
      // it into one literal phrase. Only a bare keyword gets quoted.
      if (/\b(AND|OR|NOT)\b/.test(trimmed)) return trimmed;
      if (
        (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))
      ) {
        trimmed = trimmed.slice(1, -1).trim();
      }
      return `"${trimmed}"`;
    })
    .filter(Boolean);

  let sources = [];
  if (Array.isArray(selectedSources)) {
    sources = selectedSources.filter(Boolean);
  } else if (typeof selectedSources === "boolean") {
    sources = selectedSources ? ["google_news"] : [];
  } else if (typeof selectedSources === "string" && selectedSources) {
    sources = [selectedSources];
  }

  return {
    sources,
    queries: formattedQueries,
  };
}

