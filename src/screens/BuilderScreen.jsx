import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BuilderNav } from "../components/builder/builder-nav";
import { ChatPanel } from "../components/builder/chat-panel";
import { DashboardCanvas } from "../components/builder/dashboard-canvas";
import { toast } from "react-hot-toast";
import {
  generateHtmlDashboardCode,
  resolveDashboardMedia,
} from "../agents/builderAgent/htmlDashboardGenerator";
import {
  matchWidget,
  matchDashboard,
  WIDGETS,
  widgetDef,
  detectViz,
  wantsInsight,
  wantsAllInsights,
  generateInsight,
  generateExecSummary,
  isCategoryKind,
  isInsightable,
} from "../components/builder/widget-registry";
import { OrbSettingsProvider } from "../components/builder/orb-settings";
import { PageTransition } from "../components/motion/motion-primitives";
import { Icon } from "../components/ui/icon";
import { cn } from "../lib/utils";
import { Skeleton } from "../components/ui/skeleton";
import { getDashboardDetail, getDashboards, getProject } from "../data/mock";
import { useAsync } from "../lib/use-async";
import { getTaggedArticles } from "../api/tagging";
import { getSession } from "../api/sessions";
import { hasSavedGraph, restoreNodes, seedNodes } from "../workflow/workflowUtils";
import {
  computeAnalytics,
  validateAndTransformChart,
} from "../agents/builderAgent/dataAnalytics";
import {
  callBuilderAgent,
  buildChartPayloads,
  buildSovData,
  buildCompetitorSentimentData,
  classifyIntent,
} from "../agents/builderAgent/openaiBuilderAgent";
import { runPrIntentQuery } from "../agents/prIntent/orchestrator.js";
import {
  ArticlePopupProvider,
  useArticlePopup,
  filterBySentiment,
  filterByTheme,
  filterBySource,
  filterByDate,
} from "../components/builder/article-popup-modal";

/**
 * Apply targeted updates from the agent to specific existing widgets.
 * Matches by widget id, kind, or title — without replacing the rest.
 */
function applyUpdatesToWidgets(widgetList, updates, targetWidgetId) {
  if (!updates || !widgetList?.length) return widgetList;
  const target = String(targetWidgetId || "all").toLowerCase().trim();

  return widgetList.map((w) => {
    const isTarget =
      target === "all" ||
      w.id === targetWidgetId ||
      w.kind?.toLowerCase() === target ||
      (w.title || "").toLowerCase().includes(target) ||
      target.includes(w.kind?.toLowerCase() || "");

    if (!isTarget) return w;

    return {
      ...w,
      ...(updates.title !== undefined ? { title: updates.title } : {}),
      ...(updates.subtitle !== undefined ? { subtitle: updates.subtitle } : {}),
      ...(updates.viz !== undefined ? { viz: updates.viz } : {}),
      ...(updates.insight !== undefined ? { insight: updates.insight } : {}),
      cardStyle: { ...(w.cardStyle || {}), ...(updates.cardStyle || {}) },
    };
  });
}

/**
 * HtmlArticleMessageBridge — lives inside ArticlePopupProvider.
 * Listens for postMessage events from the HTML dashboard iframe and
 * calls openPopup() with the correct article filter.
 */
function HtmlArticleMessageBridge({ articles }) {
  const { openPopup } = useArticlePopup();

  useEffect(() => {
    function handleMessage(event) {
      const d = event.data;
      if (!d || d.source !== "alphametricx-dashboard" || d.type !== "ARTICLE_FILTER") return;

      const { filterType, filterValue, filterLabel } = d;
      let filtered = articles;
      let title = filterLabel || filterValue || "Articles";

      if (filterType === "sentiment") {
        filtered = filterBySentiment(articles, filterValue);
        title = `${filterValue} Sentiment · Articles`;
      } else if (filterType === "theme") {
        filtered = filterByTheme(articles, filterValue);
        title = filterValue;
      } else if (filterType === "source") {
        filtered = filterBySource(articles, filterValue);
        title = filterValue;
      } else if (filterType === "date") {
        filtered = filterByDate(articles, filterValue);
        title = `${filterValue} · Coverage`;
      } else {
        filtered = articles;
        title = filterLabel || "All Articles";
      }

      openPopup({
        title,
        subtitle: `${filtered.length} of ${articles.length} articles`,
        articles: filtered,
      });
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [articles, openPopup]);

  return null;
}

export default function BuilderScreen() {
  const { projectId = "tesla", sessionId } = useParams();
  const navigate = useNavigate();

  const { data: project } = useAsync(() => getProject(projectId), [projectId]);

  const { data: dashboards } = useAsync(
    () => getDashboards(projectId),
    [projectId],
  );
  const sampleId = dashboards?.find((d) => d.ready)?.id ?? "";
  const { data: detail } = useAsync(
    () =>
      sampleId
        ? getDashboardDetail(projectId, sampleId)
        : Promise.resolve(null),
    [projectId, sampleId],
  );

  const [widgets, setWidgets] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeTurnIndex, setActiveTurnIndex] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [attachedId, setAttachedId] = useState(null);
  const [chatWidth, setChatWidth] = useState(400);
  const [resizing, setResizing] = useState(false);
  const [dashboardTitle, setDashboardTitle] = useState("Untitled dashboard");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [liveDetail, setLiveDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // HTML Dashboard View Mode State
  const [htmlCode, setHtmlCode] = useState(null);
  const [viewMode, setViewMode] = useState("canvas"); // "canvas" | "html"
  const [htmlSubTab, setHtmlSubTab] = useState("preview"); // "preview" | "code"

  const dragRef = useRef(null);
  const turnCounterRef = useRef(0);
  const widgetSeqRef = useRef(0);

  // Cached articles for current session (ref for sync access + state for reactive provider)
  const articlesRef = useRef(null);
  const [sessionArticles, setSessionArticles] = useState([]);

  // Brand + competitor keywords extracted from the workflow node graph
  const [workflowBrandKeywords,    setWorkflowBrandKeywords]    = useState([]);
  const [workflowCompetitorKeywords, setWorkflowCompetitorKeywords] = useState([]);

  // Fetch session on mount → parse workflow nodes → extract brand/competitor keywords
  useEffect(() => {
    if (!sessionId) return;
    getSession(sessionId)
      .then((session) => {
        const wf = session?.workflow;
        const nodes = hasSavedGraph(wf) ? restoreNodes(wf) : seedNodes(session);

        // brandKeywords live on the "data" node
        const dataNode = nodes.find((n) => n.type === "data");
        const brandKws = dataNode?.data?.brandKeywords ?? [];
        if (brandKws.length) setWorkflowBrandKeywords(brandKws);

        // competitorKeywords live on the "analysis" node (primary) or "data" node (mirror)
        const analysisNode = nodes.find((n) => n.type === "analysis");
        const compKws =
          analysisNode?.data?.competitorKeywords ??
          dataNode?.data?.competitorKeywords ??
          [];
        if (compKws.length) setWorkflowCompetitorKeywords(compKws);
      })
      .catch((err) => {
        console.warn("BuilderScreen: could not load session workflow:", err);
      });
  }, [sessionId]);

  useEffect(() => {
    if (sessionId) {
      getTaggedArticles(sessionId)
        .then((data) => {
          if (Array.isArray(data)) {
            articlesRef.current = data;
            setSessionArticles(data);
          }
        })
        .catch((err) => {
          console.warn("Failed to pre-fetch session articles:", err);
        });
    }
  }, [sessionId]);

  const activeDetail = liveDetail || detail;

  const attached = widgets.find((w) => w.id === attachedId) ?? null;
  const attachment = attached
    ? { label: widgetDef(attached.kind).title }
    : null;

  // Active assistant message turn based on thread selection
  const activeAssistantMsg = useMemo(() => {
    if (activeTurnIndex !== null && messages[activeTurnIndex] && messages[activeTurnIndex].role === "assistant") {
      return messages[activeTurnIndex];
    }
    // Default to the latest assistant message with turn artifacts
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "assistant" && (messages[i].widgets || messages[i].htmlCode)) {
        return messages[i];
      }
    }
    return null;
  }, [activeTurnIndex, messages]);

  const activeWidgets = useMemo(() => {
    if (activeAssistantMsg && activeAssistantMsg.widgets && activeAssistantMsg.widgets.length > 0) {
      return activeAssistantMsg.widgets;
    }
    return widgets;
  }, [activeAssistantMsg, widgets]);

  const activeHtmlCode = useMemo(() => {
    if (activeAssistantMsg && activeAssistantMsg.htmlCode) {
      return activeAssistantMsg.htmlCode;
    }
    return htmlCode;
  }, [activeAssistantMsg, htmlCode]);

  const activeDashboardTitle = useMemo(() => {
    if (activeAssistantMsg && activeAssistantMsg.dashboardTitle) {
      return activeAssistantMsg.dashboardTitle;
    }
    return dashboardTitle;
  }, [activeAssistantMsg, dashboardTitle]);

  const say = (role, text, fileDownload, turnArtifacts = null) => {
    const turnNum = role === "assistant" ? ++turnCounterRef.current : undefined;
    const msgObj = {
      role,
      text,
      fileDownload,
      turnIndex: turnNum,
      widgets: turnArtifacts?.widgets || null,
      htmlCode: turnArtifacts?.htmlCode || null,
      dashboardTitle: turnArtifacts?.dashboardTitle || null,
      insightCard: turnArtifacts?.insightCard || null,
    };
    setMessages((m) => {
      const next = [...m, msgObj];
      if (role === "assistant" && turnArtifacts) {
        setActiveTurnIndex(next.length - 1);
      }
      return next;
    });
  };

  function handleDownloadHtml() {
    const codeToDownload = activeHtmlCode || htmlCode;
    if (!codeToDownload) return;
    const blob = new Blob([codeToDownload], { type: "text/html;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeDashboardTitle.replace(/\s+/g, "_")}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("HTML Dashboard downloaded!");
  }

  function handleCopyHtml() {
    const codeToCopy = activeHtmlCode || htmlCode;
    if (!codeToCopy) return;
    navigator.clipboard.writeText(codeToCopy);
    toast.success("HTML code copied to clipboard!");
  }

  function handleOpenHtmlNewTab() {
    const codeToOpen = activeHtmlCode || htmlCode;
    if (!codeToOpen) return;
    const blob = new Blob([codeToOpen], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  }

  async function handleGenerateHtmlDashboard(customPrompt = "") {
    setIsLoading(true);
    try {
      let articles = articlesRef.current;
      if (!articles && sessionId) {
        try {
          const fetched = await getTaggedArticles(sessionId);
          if (Array.isArray(fetched)) {
            articles = fetched;
            articlesRef.current = fetched;
            setSessionArticles(fetched);
          }
        } catch (e) {
          console.warn("Could not fetch tagged articles:", e);
        }
      }

      const analytics = computeAnalytics(articles || []);
      const promptText =
        customPrompt ||
        "Generate bright HTML dashboard with live SVG charts and Pexels video";
      const brandName = project?.name || analytics?.topSource || "Tesla";
      const media = await resolveDashboardMedia(promptText, brandName);
      const isDark = /\b(dark|night|black|slate)\b/i.test(promptText);
      const title = `${brandName} HTML Perception Dashboard`;

      const generatedHtml = generateHtmlDashboardCode({
        dashboardTitle: title,
        analytics,
        isDark,
        videoUrl: media.videoUrl,
        imageUrl: media.imageUrl,
        extraImages: media.extraImages,
        userPrompt: promptText,
      });

      setHtmlCode(generatedHtml);
      setViewMode("html");
      setDashboardTitle(title);

      const fileDownload = {
        name: `${title.toLowerCase().replace(/\s+/g, "_")}.html`,
        content: generatedHtml,
        type: "text/html",
      };

      const coverBg = media.videoUrl
        ? { kind: "video", src: media.videoUrl }
        : media.imageUrl
          ? { kind: "image", src: media.imageUrl }
          : { kind: "default", src: null };

      const heroWidget = {
        id: `w_hero_${++widgetSeqRef.current}`,
        kind: "cover-kpi",
        span: 1,
        title: title,
        subtitle: analytics.narrativeSummary || "Comprehensive brand perception and article analytics overview.",
        cover: coverBg,
        liveData: {
          kpis: analytics.kpis || [],
          summary: {
            name: analytics.topSource || brandName,
            description: analytics.narrativeSummary || "",
          },
        },
      };

      const defaultTurnWidgets = [
        heroWidget,
        { id: `w${++widgetSeqRef.current}`, kind: "line", span: 0.5, liveData: analytics.coverageOverTime },
        { id: `w${++widgetSeqRef.current}`, kind: "sentiment", span: 0.5, liveData: analytics.sentimentData },
        { id: `w${++widgetSeqRef.current}`, kind: "themes", span: 0.5, liveData: analytics.themeDistribution },
        { id: `w${++widgetSeqRef.current}`, kind: "publications", span: 0.5, liveData: analytics.topPublications },
      ];

      setWidgets(defaultTurnWidgets);

      say(
        "assistant",
        `Created an HTML dashboard for ${brandName} with ${isDark ? "dark theme" : "bright, vibrant color combinations"}, SVG data charts, and ${media.videoUrl ? "embedded Pexels background video loop" : "embedded Pexels background image"}.`,
        fileDownload,
        {
          widgets: defaultTurnWidgets,
          htmlCode: generatedHtml,
          dashboardTitle: title,
        }
      );
    } catch (err) {
      toast.error(`Failed to generate HTML dashboard: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSend(text, files) {
    const promptText = text.trim();
    const hasFiles = files && files.length > 0;
    const fileNames = hasFiles ? files.map((f) => f.name).join(", ") : "";

    let userLabel = promptText;
    if (hasFiles && !promptText) {
      userLabel = `Uploaded: ${fileNames}`;
    } else if (hasFiles) {
      userLabel = `${promptText} (Attached: ${fileNames})`;
    }
    say("user", userLabel);
    setIsLoading(true);

    try {
      // 1. Fetch real session articles if not already cached
      let articles = articlesRef.current;
      if (!articles && sessionId) {
        try {
          const fetched = await getTaggedArticles(sessionId);
          if (Array.isArray(fetched)) {
            articles = fetched;
            articlesRef.current = fetched;
            setSessionArticles(fetched);
          }
        } catch (e) {
          console.warn("Could not fetch tagged articles:", e);
        }
      }

      // 2. Compute real analytics over session articles
      const analytics = computeAnalytics(articles || []);
      // Prefer workflow node brand keyword (most authoritative) → project name → analytics top source
      const brandName = (workflowBrandKeywords[0]) || project?.name || analytics.topSource || "Your Brand";

      // 3. Pre-classify intent to skip expensive media fetch for QA / pure text queries
      const preIntent = classifyIntent(promptText, Boolean(attached));
      const isQAIntent = (preIntent === "qa" || preIntent === "general") &&
        !/\b(html|video|image|photo|background)\b/i.test(promptText);

      // 4. Resolve Pexels media only for visual / build intents
      const media = isQAIntent
        ? { videoUrl: null, imageUrl: null, extraImages: [] }
        : await resolveDashboardMedia(promptText, brandName);

      // 5. Skip local mock intent check for build/edit actions
      const isActionOrBuildQuery =
        /\b(build|create|make|generate|add|edit|change|update|convert|transform|html|dashboard|widget|section|chart|video|image|color|style|donut|pie|bar|line|trend)\b/i.test(
          promptText,
        );

      if (promptText && !hasFiles && !isActionOrBuildQuery) {
        const prIntentResult = runPrIntentQuery(promptText);
        if (
          prIntentResult.handled &&
          prIntentResult.matched &&
          prIntentResult.confidence >= 0.85
        ) {
          const singleWidget = {
            id: `w${++widgetSeqRef.current}`,
            kind: "dynamic",
            span: 1,
            chart: prIntentResult.chart,
            title: prIntentResult.title,
            insight: prIntentResult.narrative,
          };
          const singleTurnWidgets = [singleWidget];
          setWidgets(singleTurnWidgets);
          say("assistant", prIntentResult.narrative, null, {
            widgets: singleTurnWidgets,
            htmlCode: htmlCode,
            dashboardTitle: prIntentResult.title || dashboardTitle,
          });
          setIsLoading(false);
          return;
        }
      }

      // 6. Call Azure OpenAI builder agent grounded in real analytics
      const res = await callBuilderAgent({
        question: promptText,
        analytics,
        conversationHistory: messages,
        context: {
          projectId,
          projectName: project?.name,
          sessionId,
          // Workflow node keywords surfaced to agent so it can confirm with user
          workflowBrandKeywords,
          workflowCompetitorKeywords,
        },
        attachedWidget: attached,
      });

      // Confirmed brand: agent response → workflow node brand keywords → fallback
      const confirmedBrand = res.brandName || workflowBrandKeywords[0] || brandName;
      // Confirmed competitors: agent response → workflow node competitor keywords → analytics
      const confirmedCompetitors = Array.isArray(res.competitorNames) && res.competitorNames.length > 0
        ? res.competitorNames
        : workflowCompetitorKeywords.length > 0
          ? workflowCompetitorKeywords
          : (analytics.competitorMentions || []).slice(0, 6).map((c) => c.competitor);
      const payloads = buildChartPayloads(analytics, confirmedBrand, confirmedCompetitors);

      // ── INTENT-BASED ROUTING ──────────────────────────────────────────────

      // A. CLARIFY — agent needs confirmation before building charts (e.g. SOV competitors)
      if (res.intent === "clarify") {
        say("assistant", res.replyText, null, {
          widgets: null,
          htmlCode: null,
          dashboardTitle: null,
        });
        return;
      }

      // B. EDIT SECTION — apply targeted updates to existing widgets (no full replace)
      if (res.intent === "edit_section") {
        if (res.updates) {
          setWidgets((prev) => applyUpdatesToWidgets(prev, res.updates, res.targetWidgetId));
        }
        if (res.htmlCode) setHtmlCode(res.htmlCode);
        say("assistant", res.replyText, null, {
          widgets: null, // live edit — no snapshot needed
          htmlCode: res.htmlCode || null,
          dashboardTitle: null,
        });
        return;
      }

      // C. ADD WIDGET — append new widget(s) to canvas AND sync HTML
      if (res.intent === "add_widget" && res.widgetKinds?.length > 0) {
        const FULL_SPAN_KINDS = new Set(["executive-summary", "table", "sov", "competitor-sentiment", "competitor-heatmap", "heatmap"]);
        const newWidgets = res.widgetKinds.map((newKind) => ({
          id: `w${++widgetSeqRef.current}`,
          kind: newKind,
          span: FULL_SPAN_KINDS.has(newKind) ? 1 : 0.5,
          liveData: payloads[newKind] || null,
          insight: res.insight || undefined,
        }));

        let updatedWidgets;
        setWidgets((prev) => {
          updatedWidgets = [...prev, ...newWidgets];
          return updatedWidgets;
        });

        // Sync to HTML: rebuild with all current kinds + newly added kinds
        // Use a short timeout so state has settled before reading current widgets
        const currentKinds = widgets
          .map((w) => w.kind)
          .filter((k) => k && k !== "dynamic" && k !== "image");
        const allKinds = [...new Set([...currentKinds, ...res.widgetKinds])];
        const syncedHtml = generateHtmlDashboardCode({
          dashboardTitle: activeDashboardTitle || dashboardTitle || `${confirmedBrand} Dashboard`,
          analytics,
          isDark: false,
          widgetKinds: allKinds,
          userPrompt: promptText,
          insight: res.insight || analytics.narrativeSummary || "",
        });
        setHtmlCode(syncedHtml);

        const downloadName = (activeDashboardTitle || dashboardTitle || confirmedBrand)
          .toLowerCase().replace(/\s+/g, "_");
        say("assistant", res.replyText, { name: `${downloadName}.html`, content: syncedHtml, type: "text/html" }, {
          widgets: null,
          htmlCode: syncedHtml,
          dashboardTitle: null,
        });
        return;
      }

      // D. Q&A / GENERAL — keep canvas unchanged, show insight card in chat
      if (res.intent === "qa" || res.intent === "general") {
        say("assistant", res.replyText, null, {
          widgets: null,
          htmlCode: null,
          dashboardTitle: null,
          insightCard: {
            text: res.insight || res.replyText,
            imageUrl: media.imageUrl || null,
          },
        });
        return;
      }

      // D. BUILD DASHBOARD / HTML — full replace (original behavior)
      const title = res.dashboardTitle || `${brandName} Perception Dashboard`;
      if (res.dashboardTitle) setDashboardTitle(res.dashboardTitle);
      if (res.htmlCode) setHtmlCode(res.htmlCode);

      const fileDownload = res.htmlCode
        ? {
            name: `${title.toLowerCase().replace(/\s+/g, "_")}.html`,
            content: res.htmlCode,
            type: "text/html",
          }
        : null;

      const coverBg = media.videoUrl
        ? { kind: "video", src: media.videoUrl }
        : media.imageUrl
          ? { kind: "image", src: media.imageUrl }
          : { kind: "default", src: null };

      const heroWidget = {
        id: `w_hero_${++widgetSeqRef.current}`,
        kind: "cover-kpi",
        span: 1,
        title: title,
        subtitle: analytics.narrativeSummary || "Comprehensive brand perception and article analytics overview.",
        cover: coverBg,
        liveData: payloads["cover-kpi"],
      };

      let turnKinds = res.widgetKinds && res.widgetKinds.length > 0
        ? res.widgetKinds
        : ["line", "sentiment", "themes", "publications", "articles"];

      turnKinds = turnKinds.filter((k) => k !== "cover-kpi");

      const turnWidgets = [
        heroWidget,
        ...turnKinds.map((kind) => ({
          id: `w${++widgetSeqRef.current}`,
          kind,
          span: kind === "executive-summary" || kind === "table" ? 1 : 0.5,
          liveData: payloads[kind] || null,
          insight: res.insight || undefined,
        })),
      ];

      setWidgets(turnWidgets);

      if (
        res.intent === "build_html_dashboard" ||
        /\b(html|webpage|code view)\b/i.test(promptText)
      ) {
        setViewMode("html");
      }

      say("assistant", res.replyText, fileDownload, {
        widgets: turnWidgets,
        htmlCode: res.htmlCode || htmlCode,
        dashboardTitle: title,
      });
    } catch (err) {
      toast.error(`AI builder error: ${err.message}`);
      say("assistant", `Something went wrong: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }

  function handleExportExcel() {
    const rows = [
      ["Dashboard Title", dashboardTitle],
      ["Project", project?.name || "Northwind Energy"],
      ["Date", new Date().toLocaleDateString()],
      [],
      ["Section ID", "Widget Kind", "Section Title"],
      ...widgets.map((w, idx) => [idx + 1, w.kind, widgetDef(w.kind).title]),
    ];
    const csvContent = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${dashboardTitle.replace(/\s+/g, "_")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handleReorder(dragId, overId) {
    setWidgets((w) => {
      const from = w.findIndex((x) => x.id === dragId);
      const to = w.findIndex((x) => x.id === overId);
      if (from === -1 || to === -1 || from === to) return w;
      const next = [...w];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  function handleRemove(id) {
    setWidgets((w) => w.filter((x) => x.id !== id));
  }

  function handleSetSpan(id, span) {
    setWidgets((w) => w.map((x) => (x.id === id ? { ...x, span } : x)));
  }

  function handleSetCover(id, cover) {
    setWidgets((w) => w.map((x) => (x.id === id ? { ...x, cover } : x)));
  }

  function onResizeDown(e) {
    dragRef.current = { x: e.clientX, w: chatWidth };
    setResizing(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function onResizeMove(e) {
    if (!dragRef.current) return;
    const next = dragRef.current.w + (e.clientX - dragRef.current.x);
    setChatWidth(Math.max(320, Math.min(620, next)));
  }
  function onResizeUp(e) {
    dragRef.current = null;
    setResizing(false);
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  }

  // Ensure hero banner (cover-kpi) is ALWAYS at index 0 (top of Canvas View)
  const canvasWidgets = useMemo(() => {
    const sourceWidgets = activeWidgets;
    if (!sourceWidgets || sourceWidgets.length === 0) return [];

    const coverIdx = sourceWidgets.findIndex((w) => w.kind === "cover-kpi");
    if (coverIdx > 0) {
      const copy = [...sourceWidgets];
      const [cover] = copy.splice(coverIdx, 1);
      return [cover, ...copy];
    }

    if (coverIdx === -1) {
      const analytics = computeAnalytics(articlesRef.current || []);
      const heroBanner = {
        id: "w_hero_banner_top",
        kind: "cover-kpi",
        span: 1,
        title: activeDashboardTitle || (project?.name
          ? `${project.name} Perception Dashboard`
          : "PR Perception & Intelligence Dashboard"),
        subtitle:
          analytics?.narrativeSummary ||
          "Comprehensive brand perception and article analytics overview.",
        liveData: {
          kpis: analytics?.kpis || [],
          summary: {
            name: analytics?.topSource || project?.name || "Media Outlets",
            description: analytics?.narrativeSummary || "",
          },
        },
      };
      return [heroBanner, ...sourceWidgets];
    }

    return sourceWidgets;
  }, [activeWidgets, activeDashboardTitle, project]);

  return (
    <OrbSettingsProvider>
      <div className={cn("h-screen", "bg-white")}>
        <div
          className={cn(
            "relative",
            "h-full",
            "overflow-hidden",
            "rounded-[20px]",
          )}
        >
          <div
            className={cn(
              "relative",
              "z-10",
              "flex",
              "h-full",
              "overflow-hidden",
              "p-[8px]",
            )}
          >
            <PageTransition
              className={cn(
                "flex",
                "h-full",
                "w-full",
                "gap-[8px]",
                "overflow-hidden",
              )}
            >
              <BuilderNav
                onExit={() => navigate(`/projects/${projectId}`)}
                onExport={handleExportExcel}
                logo={project?.logo}
                monogram={project?.monogram}
              />

              <div
                className={cn("h-full", "shrink-0")}
                style={{ width: chatWidth }}
              >
                <ChatPanel
                  messages={messages}
                  activeTurnIndex={activeTurnIndex}
                  onSelectTurn={(idx) => setActiveTurnIndex(idx)}
                  onSend={handleSend}
                  attachment={attachment}
                  onDropWidget={(id) => setAttachedId(id)}
                  onClearAttachment={() => setAttachedId(null)}
                />
              </div>

              <div
                role="separator"
                aria-orientation="vertical"
                aria-label="Resize panels"
                onPointerDown={onResizeDown}
                onPointerMove={onResizeMove}
                onPointerUp={onResizeUp}
                className={cn(
                  "group",
                  "relative",
                  "z-20",
                  "-mx-[8px]",
                  "w-[8px]",
                  "shrink-0",
                  "cursor-col-resize",
                )}
              >
                <div
                  className={cn(
                    "pointer-events-none absolute inset-y-0 left-1/2 w-[3px] -translate-x-1/2 rounded-full transition-colors",
                    resizing
                      ? "bg-[var(--sense-violet,#6952c1)]"
                      : "bg-transparent group-hover:bg-[color:var(--sense-hairline)]",
                  )}
                />
              </div>

              <main
                className={cn(
                  "flex",
                  "min-w-0",
                  "flex-1",
                  "flex-col",
                  "overflow-hidden",
                  "rounded-[var(--sense-radius)]",
                  "bg-[#F4F4F5]",
                )}
              >
                <div
                  className={cn(
                    "flex",
                    "h-[55px]",
                    "shrink-0",
                    "items-center",
                    "justify-between",
                    "border-b",
                    "px-[20px]",
                  )}
                  style={{ borderColor: "var(--sense-hairline)" }}
                >
                  <div
                    className={cn(
                      "flex",
                      "items-center",
                      "gap-2.5",
                      "min-w-0",
                      "flex-1",
                      "mr-3",
                      "overflow-hidden",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/${projectId}/sessions/${sessionId}/dashboards`,
                        )
                      }
                      className={cn(
                        "flex",
                        "items-center",
                        "gap-1.5",
                        "shrink-0",
                        "text-[13px]",
                        "font-semibold",
                        "text-black/70",
                        "transition-opacity",
                        "hover:opacity-100",
                      )}
                    >
                      <Icon name="arrow_back" size={18} />
                      <span
                        className={cn(
                          "truncate",
                          "max-w-[140px]",
                          "md:max-w-[200px]",
                        )}
                      >
                        {project?.name ?? "Back to Dashboards"}
                      </span>
                    </button>
                    <span className={cn("text-black/30", "shrink-0")}>/</span>
                    {isEditingTitle ? (
                      <input
                        type="text"
                        value={dashboardTitle}
                        onChange={(e) => setDashboardTitle(e.target.value)}
                        onBlur={() => setIsEditingTitle(false)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && setIsEditingTitle(false)
                        }
                        autoFocus
                        className={cn(
                          "type-title",
                          "rounded",
                          "border",
                          "border-black/20",
                          "bg-white",
                          "px-2",
                          "py-0.5",
                          "text-black",
                          "outline-none",
                          "max-w-[280px]",
                          "shrink",
                        )}
                      />
                    ) : (
                      <h1
                        onClick={() => setIsEditingTitle(true)}
                        className={cn(
                          "type-title",
                          "cursor-pointer",
                          "text-black",
                          "hover:opacity-80",
                          "truncate",
                          "min-w-0",
                        )}
                        title="Click to rename dashboard"
                      >
                        {dashboardTitle}
                      </h1>
                    )}
                  </div>

                  <div className={cn("flex", "items-center", "gap-3")}>
                    {/* View Mode Switcher */}
                    <div
                      className={cn(
                        "flex",
                        "items-center",
                        "gap-1",
                        "bg-black/5",
                        "p-1",
                        "rounded-lg",
                        "border",
                        "border-black/5",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => setViewMode("canvas")}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all",
                          viewMode === "canvas"
                            ? "bg-white text-black shadow-xs"
                            : "text-black/60 hover:text-black hover:bg-black/5",
                        )}
                      >
                        <Icon name="dashboard" size={15} />
                        <span>Canvas View</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setViewMode("html");
                          if (!activeHtmlCode) {
                            handleGenerateHtmlDashboard();
                          }
                        }}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all",
                          viewMode === "html"
                            ? "bg-indigo-600 text-white shadow-xs"
                            : "text-black/60 hover:text-black hover:bg-black/5",
                        )}
                      >
                        <Icon name="code" size={15} />
                        <span>HTML Dashboard View</span>
                        {activeHtmlCode && (
                          <span
                            className={cn(
                              "w-2",
                              "h-2",
                              "rounded-full",
                              "bg-emerald-400",
                              "animate-pulse",
                              "ml-0.5",
                            )}
                          />
                        )}
                      </button>
                    </div>

                    {/* HTML View specific controls */}
                    {viewMode === "html" && (
                      <div
                        className={cn(
                          "flex",
                          "items-center",
                          "gap-2",
                          "border-l",
                          "border-black/10",
                          "pl-3",
                        )}
                      >
                        <div
                          className={cn(
                            "flex",
                            "items-center",
                            "gap-1",
                            "bg-slate-200/70",
                            "p-0.5",
                            "rounded-md",
                            "border",
                            "border-slate-300/50",
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => setHtmlSubTab("preview")}
                            className={cn(
                              "px-2.5 py-1 text-[11px] font-semibold rounded transition-all",
                              htmlSubTab === "preview"
                                ? "bg-white text-slate-900 shadow-xs"
                                : "text-slate-600 hover:text-slate-900",
                            )}
                          >
                            Preview
                          </button>
                          <button
                            type="button"
                            onClick={() => setHtmlSubTab("code")}
                            className={cn(
                              "px-2.5 py-1 text-[11px] font-semibold rounded transition-all",
                              htmlSubTab === "code"
                                ? "bg-white text-slate-900 shadow-xs"
                                : "text-slate-600 hover:text-slate-900",
                            )}
                          >
                            HTML Code
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={handleCopyHtml}
                          title="Copy HTML code"
                          disabled={!activeHtmlCode}
                          className={cn(
                            "flex",
                            "items-center",
                            "gap-1",
                            "rounded-md",
                            "bg-white",
                            "border",
                            "border-slate-200",
                            "px-2.5",
                            "py-1",
                            "text-xs",
                            "font-medium",
                            "text-slate-700",
                            "hover:bg-slate-50",
                            "transition-colors",
                            "disabled:opacity-50",
                          )}
                        >
                          <Icon name="content_copy" size={14} />
                          <span>Copy</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleDownloadHtml}
                          title="Download HTML file"
                          disabled={!activeHtmlCode}
                          className={cn(
                            "flex",
                            "items-center",
                            "gap-1",
                            "rounded-md",
                            "bg-white",
                            "border",
                            "border-slate-200",
                            "px-2.5",
                            "py-1",
                            "text-xs",
                            "font-medium",
                            "text-slate-700",
                            "hover:bg-slate-50",
                            "transition-colors",
                            "disabled:opacity-50",
                          )}
                        >
                          <Icon name="download" size={14} />
                          <span>Download</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleOpenHtmlNewTab}
                          title="Open in new window tab"
                          disabled={!activeHtmlCode}
                          className={cn(
                            "flex",
                            "items-center",
                            "size-7",
                            "justify-center",
                            "rounded-md",
                            "bg-white",
                            "border",
                            "border-slate-200",
                            "text-slate-700",
                            "hover:bg-slate-50",
                            "transition-colors",
                            "disabled:opacity-50",
                          )}
                        >
                          <Icon name="open_in_new" size={14} />
                        </button>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleExportExcel}
                      className={cn(
                        "flex",
                        "items-center",
                        "gap-1.5",
                        "rounded-[8px]",
                        "bg-black/5",
                        "px-3",
                        "py-1.5",
                        "text-[13px]",
                        "font-medium",
                        "text-black",
                        "transition-colors",
                        "hover:bg-black/10",
                      )}
                    >
                      <Icon name="download" size={16} />
                      <span>Export Excel</span>
                    </button>

                    <div className="relative">
                      <button
                        type="button"
                        aria-label="Dashboard options"
                        aria-haspopup="menu"
                        aria-expanded={menuOpen}
                        onClick={() => setMenuOpen((o) => !o)}
                        className={cn(
                          "flex",
                          "size-8",
                          "items-center",
                          "justify-center",
                          "rounded-md",
                          "text-muted-foreground",
                          "transition-colors",
                          "hover:bg-black/5",
                          "hover:text-foreground",
                        )}
                      >
                        <Icon name="more_vert" size={20} />
                      </button>
                      {menuOpen && (
                        <>
                          <button
                            aria-label="Close menu"
                            className={cn(
                              "fixed",
                              "inset-0",
                              "z-10",
                              "cursor-default",
                            )}
                            onClick={() => setMenuOpen(false)}
                          />
                          <div
                            role="menu"
                            className={cn(
                              "absolute",
                              "right-0",
                              "top-full",
                              "z-20",
                              "mt-1",
                              "w-48",
                              "overflow-hidden",
                              "rounded-[12px]",
                              "bg-white",
                              "p-1",
                              "shadow-lg",
                            )}
                          >
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                setIsEditingTitle(true);
                                setMenuOpen(false);
                              }}
                              className={cn(
                                "flex",
                                "w-full",
                                "items-center",
                                "gap-2",
                                "rounded-[8px]",
                                "px-2.5",
                                "py-2",
                                "type-caption",
                                "text-foreground",
                                "transition-colors",
                                "hover:bg-muted",
                              )}
                            >
                              <Icon name="edit" size={16} />
                              Rename dashboard
                            </button>
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                handleExportExcel();
                                setMenuOpen(false);
                              }}
                              className={cn(
                                "flex",
                                "w-full",
                                "items-center",
                                "gap-2",
                                "rounded-[8px]",
                                "px-2.5",
                                "py-2",
                                "type-caption",
                                "text-foreground",
                                "transition-colors",
                                "hover:bg-muted",
                              )}
                            >
                              <Icon name="download" size={16} />
                              Export as CSV / Excel
                            </button>
                            <button
                              type="button"
                              role="menuitem"
                              disabled={widgets.length === 0}
                              onClick={() => {
                                setWidgets([]);
                                setMenuOpen(false);
                              }}
                              className={cn(
                                "flex",
                                "w-full",
                                "items-center",
                                "gap-2",
                                "rounded-[8px]",
                                "px-2.5",
                                "py-2",
                                "type-caption",
                                "text-foreground",
                                "transition-colors",
                                "hover:bg-muted",
                                "disabled:opacity-40",
                              )}
                            >
                              <Icon name="delete_sweep" size={16} />
                              Clear all sections
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* ArticlePopupProvider wraps BOTH canvas and HTML views so
                    the popup works for chart clicks in both modes.
                    HtmlArticleMessageBridge registers the iframe postMessage listener. */}
                <ArticlePopupProvider articles={sessionArticles}>
                  <HtmlArticleMessageBridge articles={sessionArticles} />

                <div
                  className={cn(
                    "flex-1",
                    "overflow-y-auto",
                    "px-[16px]",
                    "pb-[16px]",
                    "pt-[8px]",
                    "h-full",
                  )}
                >
                  {viewMode === "canvas" ? (
                    activeDetail ? (
                      <DashboardCanvas
                        widgets={canvasWidgets}
                        detail={activeDetail}
                        isLoading={isLoading}
                        onReorder={handleReorder}
                        onRemove={handleRemove}
                        onSetSpan={handleSetSpan}
                        onSetCover={handleSetCover}
                        onAddWidget={(kind) =>
                          setWidgets((w) => [
                            ...w,
                            {
                              id: `w${++widgetSeqRef.current}`,
                              kind,
                              span:
                                kind === "cover-kpi" ||
                                kind === "executive-summary" ||
                                kind === "table"
                                  ? 1
                                  : 0.5,
                            },
                          ])
                        }
                        onAttachWidget={(id) => setAttachedId(id)}
                      />
                    ) : (
                      <div className={cn("space-y-4", "p-4")}>
                        <Skeleton className={cn("h-40", "w-full")} />
                        <Skeleton className={cn("h-60", "w-full")} />
                      </div>
                    )
                  ) : (
                    /* HTML Dashboard View */
                    <div
                      className={cn(
                        "w-full",
                        "h-full",
                        "flex",
                        "flex-col",
                        "min-h-[500px]",
                      )}
                    >
                      {!activeHtmlCode ? (
                        <div
                          className={cn(
                            "flex-1",
                            "flex",
                            "flex-col",
                            "items-center",
                            "justify-center",
                            "bg-white",
                            "rounded-xl",
                            "border",
                            "border-dashed",
                            "border-slate-300",
                            "p-8",
                            "text-center",
                          )}
                        >
                          <div
                            className={cn(
                              "w-12",
                              "h-12",
                              "rounded-full",
                              "bg-indigo-50",
                              "text-indigo-600",
                              "flex",
                              "items-center",
                              "justify-center",
                              "mb-4",
                            )}
                          >
                            <Icon name="code" size={24} />
                          </div>
                          <h3
                            className={cn(
                              "text-lg",
                              "font-bold",
                              "text-slate-900",
                              "mb-1",
                            )}
                          >
                            No HTML Dashboard Generated Yet
                          </h3>
                          <p
                            className={cn(
                              "text-sm",
                              "text-slate-500",
                              "max-w-md",
                              "mb-6",
                            )}
                          >
                            Ask the AI builder chat to generate an HTML
                            dashboard, or click below to build one automatically
                            with live charts & media.
                          </p>
                          <button
                            type="button"
                            onClick={() => handleGenerateHtmlDashboard()}
                            disabled={isLoading}
                            className={cn(
                              "flex",
                              "items-center",
                              "gap-2",
                              "px-4",
                              "py-2",
                              "bg-indigo-600",
                              "hover:bg-indigo-700",
                              "text-white",
                              "text-sm",
                              "font-semibold",
                              "rounded-lg",
                              "shadow-sm",
                              "transition-colors",
                            )}
                          >
                            <Icon name="auto_awesome" size={18} />
                            <span>Generate HTML Dashboard Now</span>
                          </button>
                        </div>
                      ) : htmlSubTab === "preview" ? (
                        <div
                          className={cn(
                            "flex-1",
                            "w-full",
                            "h-full",
                            "rounded-xl",
                            "overflow-hidden",
                            "shadow-sm",
                            "border",
                            "border-slate-200",
                            "bg-white",
                            "min-h-[600px]",
                          )}
                        >
                          <iframe
                            srcDoc={activeHtmlCode}
                            title="Standalone HTML Dashboard Preview"
                            className={cn(
                              "w-full",
                              "h-full",
                              "border-0",
                              "min-h-[600px]",
                            )}
                            sandbox="allow-scripts allow-same-origin"
                          />
                        </div>
                      ) : (
                        <div
                          className={cn(
                            "flex-1",
                            "w-full",
                            "h-full",
                            "flex",
                            "flex-col",
                            "rounded-xl",
                            "overflow-hidden",
                            "border",
                            "border-slate-800",
                            "bg-slate-950",
                            "shadow-md",
                          )}
                        >
                          <div
                            className={cn(
                              "px-4",
                              "py-2.5",
                              "bg-slate-900",
                              "border-b",
                              "border-slate-800",
                              "flex",
                              "items-center",
                              "justify-between",
                            )}
                          >
                            <span
                              className={cn(
                                "text-xs",
                                "font-mono",
                                "font-semibold",
                                "text-slate-300",
                                "flex",
                                "items-center",
                                "gap-2",
                              )}
                            >
                              <Icon
                                name="code"
                                size={16}
                                className="text-indigo-400"
                              />
                              standalone_dashboard.html
                            </span>
                            <button
                              type="button"
                              onClick={handleCopyHtml}
                              className={cn(
                                "text-xs",
                                "font-medium",
                                "text-indigo-400",
                                "hover:text-indigo-300",
                                "flex",
                                "items-center",
                                "gap-1",
                                "transition-colors",
                              )}
                            >
                              <Icon name="content_copy" size={14} />
                              Copy Raw HTML
                            </button>
                          </div>
                          <pre
                            className={cn(
                              "p-4",
                              "text-xs",
                              "font-mono",
                              "text-slate-100",
                              "overflow-auto",
                              "flex-1",
                              "leading-relaxed",
                              "selection:bg-indigo-500",
                              "selection:text-white",
                            )}
                          >
                            <code>{activeHtmlCode}</code>
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                </ArticlePopupProvider>
              </main>
            </PageTransition>
          </div>
        </div>
      </div>
    </OrbSettingsProvider>
  );
}
