// Turns the raw {type, data} nodes returned by the workflow copilot's LLM
// call into a real React Flow graph: real ids, defaulted data, serial edges.
// Positions are left at {0,0} — WorkflowScreen's own autoLayout() places
// everything right after this runs, so there's no duplicated layout math.
import { NODE_ORDER, defaultNodeData } from "./constants.js";
import { nextId, updateApiPayload } from "./workflowUtils.js";

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

  const nodes = known.map((raw) => {
    let rawData = raw.data || {};
    if (raw.type === "data") {
      if (Array.isArray(rawData.brandKeywords) && rawData.brandKeywords.length > 1) {
        rawData.brandKeywords = [rawData.brandKeywords[0]];
      }
      const isGoogleRss =
        rawData.googleRssFeed !== false &&
        (rawData.sourceType === "api" || rawData.googleRssFeed);
      if (isGoogleRss || rawData.sourceType === "api") {
        const queryText =
          rawData.query || (rawData.brandKeywords || []).join(", ");
        const { sources, queries } = updateApiPayload(
          queryText,
          true,
          rawData.brandKeywords,
        );
        rawData = {
          ...rawData,
          sourceType: "api",
          googleRssFeed: true,
          data_sources: sources,
          queries,
        };
      }
    }
    return {
      id: nextId(raw.type),
      type: raw.type,
      position: { x: 0, y: 0 },
      data: defaultNodeData(raw.type, rawData),
    };
  });

  const byType = (type) => nodes.filter((n) => n.type === type);
  const dataNode = byType("data")[0];
  const analysisNodes = byType("analysis");
  let reviewNodes = byType("review");
  const assemblyNode = byType("assembly")[0];
  const outputNode = byType("output")[0];

  const isMMLens = (lens) => {
    const norm = String(lens || "").toLowerCase().replace(/_/g, " ").trim();
    return norm === "media monitoring" || norm === "media_monitoring";
  };

  const mmAnalysisNodes = analysisNodes.filter((a) => isMMLens(a.data?.lens));
  const otherAnalysisNodes = analysisNodes.filter((a) => !isMMLens(a.data?.lens));

  if (mmAnalysisNodes.length > 0 && otherAnalysisNodes.length > 0) {
    if (reviewNodes.length < 2) {
      const secondReview = {
        id: nextId("review"),
        type: "review",
        position: { x: 0, y: 0 },
        data: defaultNodeData("review", {}),
      };
      nodes.push(secondReview);
      reviewNodes.push(secondReview);
    }
  }

  const mmReviewNode = reviewNodes[0];
  const otherReviewNode = reviewNodes.length > 1 ? reviewNodes[1] : reviewNodes[0];

  const edges = [];
  analysisNodes.forEach((a) => {
    edges.push({ id: `e_${dataNode.id}_${a.id}`, source: dataNode.id, target: a.id });
    if (isMMLens(a.data?.lens) && mmAnalysisNodes.length > 0 && otherAnalysisNodes.length > 0) {
      edges.push({ id: `e_${a.id}_${mmReviewNode.id}`, source: a.id, target: mmReviewNode.id });
    } else if (!isMMLens(a.data?.lens) && mmAnalysisNodes.length > 0 && otherAnalysisNodes.length > 0) {
      edges.push({ id: `e_${a.id}_${otherReviewNode.id}`, source: a.id, target: otherReviewNode.id });
    } else {
      edges.push({ id: `e_${a.id}_${reviewNodes[0].id}`, source: a.id, target: reviewNodes[0].id });
    }
  });

  const uniqueReviewTargets = Array.from(
    new Set(
      mmAnalysisNodes.length > 0 && otherAnalysisNodes.length > 0
        ? [mmReviewNode.id, otherReviewNode.id]
        : [reviewNodes[0].id]
    )
  );

  uniqueReviewTargets.forEach((rId) => {
    edges.push({
      id: `e_${rId}_${assemblyNode.id}`,
      source: rId,
      target: assemblyNode.id,
    });
  });

  edges.push({
    id: `e_${assemblyNode.id}_${outputNode.id}`,
    source: assemblyNode.id,
    target: outputNode.id,
  });

  return { nodes, edges };
}

// Short, human-readable description of whatever graph is currently on the
// canvas, fed back to the copilot LLM as context so it can ask an informed
// clarifying question ("you're currently tracking X vs Y...") instead of a
// generic one, and so it knows a replace would discard real work.
export function summarizeGraphForCopilot(nodes) {
  if (!nodes || nodes.length === 0) return null;
  const parts = [];
  const dataNode = nodes.find((n) => n.type === "data");
  const analysisNodes = nodes.filter((n) => n.type === "analysis");
  const assemblyNode = nodes.find((n) => n.type === "assembly");
  const outputNode = nodes.find((n) => n.type === "output");

  if (dataNode?.data?.brandKeywords?.length) {
    parts.push(`Brand: ${dataNode.data.brandKeywords[0]}`);
  }
  if (analysisNodes.length) {
    parts.push(
      `Analysis: ${analysisNodes.map((n) => `${n.data?.lens || "?"} (${n.data?.llm || "?"})`).join("; ")}`,
    );
    const competitors = Array.from(
      new Set(analysisNodes.flatMap((n) => n.data?.competitorKeywords || [])),
    );
    if (competitors.length) parts.push(`Competitors: ${competitors.join(", ")}`);
  }
  if (assemblyNode?.data?.clientName) {
    parts.push(`Client: ${assemblyNode.data.clientName}, Layout: ${assemblyNode.data.layout || "Classic"}`);
  }
  if (outputNode?.data?.projectName) {
    parts.push(`Project: ${outputNode.data.projectName}`);
  }
  return parts.length ? parts.join(" | ") : null;
}
