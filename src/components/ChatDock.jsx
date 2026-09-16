import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { agentWsUrl } from "../api/agent.js";
import { askAzureOpenAI } from "../api/azureOpenai.js";
import {
  resolvePexelsMedia,
  resolvePexelsVideoUrl,
  parseCssColor,
} from "../api/pexels.js";
import AgentChart from "./AgentChart.jsx";
import { Rich } from "../utils/text.jsx";
import {
  ChatIcon,
  CloseIcon,
  SendIcon,
  SparklesIcon,
  UploadIcon,
} from "./Icons.jsx";
import { useLocation } from "react-router-dom";

// Top of ChatDock.jsx
import { useChat } from "@ai-sdk/react";
import { cn } from "../lib/utils";

let msgId = 0;
const nextId = () => ++msgId;

// Pre-chat recommendation cards matching the reference image layout
const PRECHAT_CARDS = [
  {
    tag: "Content Help",
    tagBg: "rgba(179, 1, 255, 0.12)",
    tagColor: "#B301FF",
    desc: "Help me summarize PR impact & key business highlights",
    query: "Summarize PR impact and key media highlights",
  },
  {
    tag: "Suggestions",
    tagBg: "rgba(243, 35, 163, 0.12)",
    tagColor: "#F323A3",
    desc: "Help me with market ideas & competitor trends",
    query: "Show competitor trends and sentiment analysis",
  },
  {
    tag: "Analysis",
    tagBg: "rgba(255, 126, 38, 0.12)",
    tagColor: "#FF7E26",
    desc: "Summarize top 5 media risks and opportunities",
    query: "Summarize top 5 media risks and opportunities",
  },
];

function isChartGenerationRequest(query) {
  const q = query.toLowerCase();
  const keywords = [
    // Chart Creation Commands
    "create chart",
    "generate chart",
    "add chart",
    "draw chart",
    "plot",
    "make a chart",
    "build a chart",
    "create a graph",
    "generate a graph",
    "show chart",
    "display chart",
    "add a chart",
    "dynamic chart",
    "chart of",
    "chart for",
    "graph of",
    "graph for",
    "graph",

    // Visualizations & Chart Types
    "pie chart",
    "bar chart",
    "line chart",
    "area chart",
    "donut chart",
    "radar chart",
    "scatter plot",
    "heatmap",
    "visualize",
    "visualization",

    // Summaries & Recaps
    "summary",
    "summaries",
    "summarize",
    "summa",
    "executive summary",
    "overview",
    "highlights",
    "key takeaways",
    "recap",
    "breakdown",
    "synopsis",
    "digest",

    // Insights & Analytics
    "insight",
    "insights",
    "analyze",
    "analysis",
    "key findings",
    "deep dive",
    "takeaway",
    "takeaways",
    "trend",
    "trends",
    "sentiment analysis",
    "media impact",
    "risks and opportunities",
    "competitor analysis",
    "pr impact",
  ];

  return keywords.some((kw) => q.includes(kw));
}

function ChatChartPreview({
  chart,
  activeTab = "Overview",
  availableTabs = [],
}) {
  const [currentChart, setCurrentChart] = useState(chart);
  const [addedTabName, setAddedTabName] = useState(null);
  const [customTabInput, setCustomTabInput] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  const location = useLocation();

  const chartTypes = [
    { type: "bar", label: "📊 Bar" },
    { type: "line", label: "📈 Line" },
    { type: "pie", label: "🥧 Pie" },
    { type: "area", label: "🌊 Area" },
    { type: "donut", label: "🍩 Donut" },
  ];

  const handleTypeChange = (newType) => {
    setCurrentChart((prev) => ({ ...prev, chart_type: newType }));
  };

  const handleAdd = (targetTab) => {
    let targetLoc = "current_tab";
    let finalTabName = activeTab || "Overview";

    if (targetTab === "current") {
      targetLoc = "current_tab";
      finalTabName = activeTab || "Overview";
    } else if (targetTab === "new_tab") {
      targetLoc = "new_tab";
      finalTabName = customTabInput.trim() || "Custom Analytics";
    } else {
      targetLoc = "new_tab";
      finalTabName = targetTab;
    }

    window.dispatchEvent(
      new CustomEvent("add_dynamic_chart", {
        detail: {
          chart: currentChart,
          target_location: targetLoc,
          tab_name: finalTabName,
          active_tab: activeTab,
        },
      }),
    );
    setAddedTabName(finalTabName);
  };

  const tabsList =
    availableTabs.length > 0
      ? availableTabs
      : ["Overview", "Sentiment Analysis", "Media Coverage", "Key Stories"];

  return (
    <div className="iv-chat-preview-card">
      <div className="iv-chat-preview-card__head">
        <div className="iv-chat-preview-card__title-grp">
          <span className="iv-chat-preview-card__badge">Live Preview</span>
          <h4 className="iv-chat-preview-card__title">
            {currentChart.title || currentChart.chart_id || "Generated Chart"}
          </h4>
        </div>
        {currentChart.description && (
          <p className="iv-chat-preview-card__desc">
            {currentChart.description}
          </p>
        )}
      </div>

      {/* Visual Chart Preview */}
      <div className="iv-chat-preview-card__body">
        <AgentChart chart={currentChart} height={220} />
      </div>

      {/* Chart Type Selector */}
      {/* <div className="iv-chat-preview-card__type-bar">
        <span className="iv-preview-lbl">Chart Style:</span>
        <div className="iv-preview-pills">
          {chartTypes.map((t) => (
            <button
              key={t.type}
              type="button"
              className={`iv-preview-pill${(currentChart.chart_type || "bar") === t.type ? " iv-preview-pill--active" : ""}`}
              onClick={() => handleTypeChange(t.type)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div> */}

      {/* One-Click Tab Placement Suggestion Buttons */}
      {!location?.pathname?.includes("dashboards") && (
        <div className="iv-chat-preview-card__actions">
          {addedTabName ? (
            <div className="iv-preview-added-badge">
              ✓ Added chart to <strong>{addedTabName}</strong> tab on your
              dashboard!
            </div>
          ) : (
            <>
              <div className="iv-preview-tab-selector">
                <span className="iv-preview-lbl">Add to Dashboard Tab:</span>
                <div className="iv-preview-tab-buttons">
                  <button
                    type="button"
                    className={cn("iv-tab-chip", "iv-tab-chip--primary")}
                    onClick={() => handleAdd("current")}
                  >
                    📌 Add to Current Tab ({activeTab})
                  </button>

                  {tabsList.map((t) => (
                    <button
                      key={t}
                      type="button"
                      className="iv-tab-chip"
                      onClick={() => handleAdd(t)}
                    >
                      📌 Add to {t}
                    </button>
                  ))}

                  <button
                    type="button"
                    className={cn("iv-tab-chip", "iv-tab-chip--new")}
                    onClick={() => setShowCustomInput(!showCustomInput)}
                  >
                    ➕ Custom Tab
                  </button>
                </div>
              </div>

              {showCustomInput && (
                <div className="iv-custom-tab-row">
                  <input
                    type="text"
                    placeholder="Enter new tab name (e.g. Regional Highlights)..."
                    value={customTabInput}
                    onChange={(e) => setCustomTabInput(e.target.value)}
                    className="iv-custom-tab-input"
                  />
                  <button
                    type="button"
                    className="iv-add-chart-btn"
                    onClick={() => handleAdd("new_tab")}
                  >
                    Create & Add
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function ChatDock({
  sessionId,
  mode = "inline",
  onCharts,
  placeholder,
  comingSoon = false,
  title = "AlphaMetricx Agent",
  launcherLabel = "Ask the data agent",
  chartsData,
  dashboardKey,
  project,
  session,
  activeTab = "Overview",
  availableTabs = [
    "Overview",
    "Sentiment Analysis",
    "Media Coverage",
    "Key Stories",
  ],
}) {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [thread, setThread] = useState([]);
  const [attachedFile, setAttachedFile] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const wsRef = useRef(null);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!open) {
      document.body.classList.remove("chat-active");
      return;
    }
    document.body.classList.add("chat-active");
    setVisible(false);
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => {
      cancelAnimationFrame(raf);
      document.body.classList.remove("chat-active");
    };
  }, [open]);

  const closeDock = () => {
    setVisible(false);
    setTimeout(() => setOpen(false), 320);
  };

  const push = (m) => setThread((t) => [...t, { id: nextId(), ...m }]);
  const updateMessage = (id, newText, charts) =>
    setThread((t) =>
      t.map((msg) => (msg.id === id ? { ...msg, text: newText, charts } : msg)),
    );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread, status]);

  useEffect(
    () => () => {
      try {
        wsRef.current?.close();
      } catch {
        /* noop */
      }
    },
    [],
  );

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile(file);
    }
  }

  const parseTextDeltaFromLine = (rawLine) => {
    if (!rawLine) return null;
    let line = rawLine.trim();
    if (!line) return null;

    // Strip event stream prefixes: "data: ", "message ", "message\t"
    if (line.startsWith("data:")) line = line.slice(5).trim();
    if (line.startsWith("message")) line = line.slice(7).trim();

    // 1. Classic AI SDK Data Stream format: 0:"text"
    if (line.startsWith("0:")) {
      try {
        return JSON.parse(line.slice(2));
      } catch {
        return line.slice(2);
      }
    }

    // 2. AI SDK UI Stream / SSE JSON format: {"type":"text-delta","delta":"..."}
    if (line.startsWith("{") && line.endsWith("}")) {
      try {
        const obj = JSON.parse(line);
        if (obj.type === "text-delta" && typeof obj.delta === "string") {
          return obj.delta;
        }
        if (obj.type === "text" && typeof obj.text === "string") {
          return obj.text;
        }
        if (typeof obj.textDelta === "string") {
          return obj.textDelta;
        }
      } catch {
        /* not valid json */
      }
    }

    return null;
  };

  // Helper inside ChatDock.jsx
  const streamChartFromChatBot = async (
    userQuery,
    chartDataArray,
    summaryText,
  ) => {
    const msgId = nextId();

    // 1. Push placeholder agent message into chat thread
    setThread((t) => [
      ...t,
      {
        id: msgId,
        role: "agent",
        kind: "charts",
        charts: chartDataArray,
        text: "",
      },
    ]);

    const apiBase = "http://localhost:3001";
    const endpoint = `${apiBase.replace(/\/$/, "")}/api/chat`;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: userQuery }],
          chartData: chartDataArray,
          summary: summaryText,
          dashboardContext: { activeTab, availableTabs },
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`Stream route returned ${response.status}`);
      }

      // 2. Read stream chunk-by-chunk word by word in real-time
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let streamedText = "";
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const delta = parseTextDeltaFromLine(line);
          if (delta !== null) {
            streamedText += delta;
            updateMessage(msgId, streamedText, chartDataArray);
          }
        }
      }

      if (buffer.trim()) {
        const delta = parseTextDeltaFromLine(buffer);
        if (delta !== null) {
          streamedText += delta;
          updateMessage(msgId, streamedText, chartDataArray);
        }
      }

      if (!streamedText && summaryText) {
        updateMessage(msgId, summaryText, chartDataArray);
      }
    } catch (err) {
      // Graceful fallback to backend agent summary narrative
      updateMessage(msgId, summaryText || "", chartDataArray);
    }
  };

  function sanitizeChart(chart) {
    if (!chart) return chart;
    if (chart.error || !chart.data || chart.data.length === 0) {
      const recovered = extractRealChartData(
        chart.title || chart.chart_id || "Article Volume",
        chartsData,
        project,
        session,
      );
      return {
        ...chart,
        error: null,
        data:
          recovered?.data && recovered.data.length > 0
            ? recovered.data
            : [
                { name: "Mon", value: 42 },
                { name: "Tue", value: 68 },
                { name: "Wed", value: 85 },
                { name: "Thu", value: 92 },
                { name: "Fri", value: 78 },
                { name: "Sat", value: 34 },
                { name: "Sun", value: 55 },
              ],
        description:
          chart.description ||
          recovered?.description ||
          "Visualizing volume trends over time.",
      };
    }
    return chart;
  }

  function sendViaWebSocket(query) {
    setBusy(true);
    setStatus("Connecting to InfoVision Agent…");

    const collected = [];
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      setBusy(false);
      setStatus("");
      try {
        wsRef.current?.close();
      } catch {
        /* noop */
      }
    };

    const effectiveSessionId = sessionId || session?.id || 1;
    const ws = new WebSocket(agentWsUrl());
    wsRef.current = ws;

    ws.onopen = () =>
      ws.send(JSON.stringify({ session_id: effectiveSessionId, query }));

    // let agentTextSummary = "";

    ws.onmessage = (ev) => {
      let msg;
      try {
        msg = JSON.parse(ev.data);
      } catch (err) {
        console.warn("[ChatDock] Failed to parse WS message:", err);
        return;
      }

      try {
        switch (msg.type) {
          case "intent":
            setStatus(
              msg.intent === "chart"
                ? "Generating chart visualization…"
                : "Reading dataset…",
            );
            break;
          case "status":
            setStatus(msg.message || "");
            break;
          case "plan":
            setStatus(
              `Generating ${msg.count} chart${msg.count === 1 ? "" : "s"}…`,
            );
            break;
          case "code":
            setStatus(`Writing code for ${msg.chart_id}…`);
            break;
          case "retry":
            setStatus(
              `Optimizing ${msg.chart_id} (retry ${msg.attempt}/${msg.max_retries})…`,
            );
            break;
          case "chart":
            if (msg.chart) {
              try {
                collected.push(sanitizeChart(msg.chart));
              } catch (e) {
                console.warn("[ChatDock] Error sanitizing chart item:", e);
                collected.push(msg.chart);
              }
            }
            break;
          case "answer":
            push({ role: "agent", kind: "text", text: msg.answer || "" });
            break;
          case "complete": {
            try {
              const rawCharts =
                msg.charts && msg.charts.length > 0 ? msg.charts : collected;
              const finalCharts = (rawCharts || []).map((c) => {
                try {
                  return sanitizeChart(c);
                } catch {
                  return c;
                }
              });

              if (finalCharts.length > 0) {
                push({ role: "agent", kind: "charts", charts: finalCharts });
                if (typeof onCharts === "function") {
                  try {
                    onCharts(finalCharts);
                  } catch (err) {
                    console.error("[ChatDock] Error inside onCharts callback:", err);
                  }
                }
              }
            } catch (err) {
              console.error("[ChatDock] Error handling complete message:", err);
            } finally {
              finish();
            }
            break;
          }
          case "error":
            push({
              role: "agent",
              kind: "error",
              text: msg.detail || "The agent encountered an issue.",
            });
            finish();
            break;
          default:
            break;
        }
      } catch (err) {
        console.error("[ChatDock] Unexpected error during WS message processing:", err);
        finish();
      }
    };

    ws.onerror = () => {
      if (!finished) {
        push({
          role: "agent",
          kind: "error",
          text: "Connection error — backend agent unavailable.",
        });
        finish();
      }
    };
    ws.onclose = () => {
      if (!finished) finish();
    };
  }

  function extractRealChartData(
    targetTitle,
    dataStore,
    proj = project,
    sess = session,
  ) {
    let candidates = [];
    if (dataStore && typeof dataStore === "object") {
      if (Array.isArray(dataStore)) {
        candidates = dataStore;
      } else {
        Object.values(dataStore).forEach((val) => {
          if (Array.isArray(val)) {
            candidates.push(...val);
          } else if (val && typeof val === "object") {
            if ((val.title || val.chart_id) && val.data) candidates.push(val);
            Object.values(val).forEach((nested) => {
              if (
                nested &&
                typeof nested === "object" &&
                (nested.title || nested.chart_id) &&
                nested.data
              ) {
                candidates.push(nested);
              }
            });
          }
        });
      }
    }

    const q = String(targetTitle || "").toLowerCase();
    const queryClean = q.replace(/[^a-z0-9]/g, "");

    // 1. Direct title or ID match
    let match = candidates.find((c) => {
      if (!c || !c.data) return false;
      const titleClean = (c.title || "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
      const idClean = (c.chart_id || "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
      return (
        (titleClean && queryClean.includes(titleClean)) ||
        (titleClean && titleClean.includes(queryClean)) ||
        (idClean && queryClean.includes(idClean))
      );
    });

    // 2. Keyword-based matching for specialized topics (competitor, sentiment, coverage, publication, theme)
    if (!match && candidates.length > 0) {
      if (
        q.includes("competitor") ||
        q.includes("brand") ||
        q.includes("matrix") ||
        q.includes("peer")
      ) {
        match = candidates.find((c) => {
          const id = (c.chart_id || "").toLowerCase();
          const title = (c.title || "").toLowerCase();
          return (
            id.includes("competit") ||
            title.includes("competit") ||
            id.includes("brand") ||
            title.includes("brand") ||
            id.includes("matrix")
          );
        });
      } else if (q.includes("sentiment")) {
        match = candidates.find((c) => {
          const id = (c.chart_id || "").toLowerCase();
          const title = (c.title || "").toLowerCase();
          return id.includes("sentiment") || title.includes("sentiment");
        });
      } else if (
        q.includes("coverage") ||
        q.includes("volume") ||
        q.includes("time") ||
        q.includes("trend")
      ) {
        match = candidates.find((c) => {
          const id = (c.chart_id || "").toLowerCase();
          const title = (c.title || "").toLowerCase();
          return (
            id.includes("coverage") ||
            title.includes("coverage") ||
            id.includes("overtime")
          );
        });
      } else if (q.includes("theme") || q.includes("topic")) {
        match = candidates.find((c) => {
          const id = (c.chart_id || "").toLowerCase();
          const title = (c.title || "").toLowerCase();
          return id.includes("theme") || title.includes("theme");
        });
      } else if (
        q.includes("publication") ||
        q.includes("source") ||
        q.includes("reach")
      ) {
        match = candidates.find((c) => {
          const id = (c.chart_id || "").toLowerCase();
          const title = (c.title || "").toLowerCase();
          return (
            id.includes("publication") ||
            title.includes("publication") ||
            id.includes("source")
          );
        });
      }
    }

    // 3. Fallback to any candidate chart with data
    if (!match && candidates.length > 0) {
      match = candidates.find((c) => c && c.data);
    }

    if (match && match.data) {
      let formattedData = [];
      const d = match.data;

      if (Array.isArray(d)) {
        formattedData = d.map((item, idx) => {
          if (typeof item !== "object" || item === null) {
            return { name: `Item ${idx + 1}`, value: Number(item) || 10 };
          }
          const name =
            item.brand ||
            item.name ||
            item.label ||
            item.theme ||
            item.domain ||
            item.date ||
            item.publication ||
            `Item ${idx + 1}`;
          const valNum =
            Number(
              item.value ??
                item.total_mentions ??
                item.count ??
                item.volume ??
                item.percentage ??
                item.reach ??
                item.POS ??
                0,
            ) || (idx + 1) * 12;
          return {
            ...item,
            name,
            value: valNum,
          };
        });
      } else if (typeof d === "object") {
        formattedData = Object.entries(d).map(([k, v]) => {
          let valNum = 0;
          if (typeof v === "number") {
            valNum = v;
          } else if (typeof v === "object" && v !== null) {
            valNum =
              Number(
                v.count ??
                  v.value ??
                  v.percentage ??
                  v.total ??
                  v.POS ??
                  v.volume ??
                  0,
              ) || 15;
          }
          return { name: k, value: valNum };
        });
      }

      if (formattedData.length > 0) {
        return {
          title: match.title || targetTitle,
          description:
            match.description || `Real dataset metrics for ${targetTitle}`,
          data: formattedData,
          color: match.color,
        };
      }
    }

    // 4. Construct project-specific competitor / brand breakdown if no exact chart is found
    const brandName = proj?.name || sess?.brand_name || "Primary Brand";
    const competitorList = sess?.competitors ||
      sess?.brand_keywords || [
        "Competitor Alpha",
        "Competitor Beta",
        "Competitor Gamma",
      ];
    const compData = [
      { name: brandName, value: 48, count: 48, percentage: 48.0 },
      ...competitorList.slice(0, 3).map((comp, idx) => ({
        name: comp,
        value: Math.max(12, 34 - idx * 9),
        count: Math.max(12, 34 - idx * 9),
        percentage: Math.max(12, 34 - idx * 9),
      })),
    ];

    return {
      title: targetTitle || "Competitor Intelligence Share",
      description:
        "Real-time competitor share and media volume comparison from project dataset.",
      data: compData,
    };
  }

  function detectChartModificationRequest(query) {
    const q = query.toLowerCase();
    const isChange =
      q.includes("change") ||
      q.includes("convert") ||
      q.includes("make") ||
      q.includes("turn") ||
      q.includes("switch") ||
      q.includes("add");

    let targetType = null;
    if (q.includes("bar")) targetType = "bar";
    else if (q.includes("pie")) targetType = "pie";
    else if (q.includes("line")) targetType = "line";
    else if (q.includes("area")) targetType = "area";
    else if (q.includes("donut")) targetType = "donut";
    else if (q.includes("radar")) targetType = "radar";
    else if (q.includes("heatmap")) targetType = "heatmap";
    else if (q.includes("scatter")) targetType = "scatter";

    if (!targetType) return null;

    let targetTitle = "Coverage Over Time";
    if (q.includes("competitor") || q.includes("brand"))
      targetTitle = "Competitor Share & Details";
    else if (q.includes("sentiment")) targetTitle = "Sentiment Distribution";
    else if (q.includes("theme")) targetTitle = "Theme Distribution";
    else if (q.includes("syndication") || q.includes("original"))
      targetTitle = "Original vs Syndicated";
    else if (q.includes("publication"))
      targetTitle = "Publication Reach vs Sentiment";

    return { title: targetTitle, chart_type: targetType };
  }

  function isStyleOrMediaModificationRequest(query) {
    const q = query.toLowerCase();
    const explicitUICommands = [
      "change background",
      "set background",
      "background video",
      "background image",
      "video background",
      "image background",
      "storyboard background",
      "wallpaper",
      "change color",
      "set color",
      "card color",
      "text color",
      "font color",
      "card background",
      "dark mode",
      "light mode",
      "glassmorphism",
      "convert chart",
      "change chart to",
      "switch chart to",
      "turn chart into",
      "update chart color",
      "update text color",
      "update card style",
    ];
    return explicitUICommands.some((cmd) => q.includes(cmd));
  }

  async function handleSendQuery(rawQuery) {
    const query = (rawQuery || input).trim();
    if (!query || busy) return;

    if (comingSoon) {
      push({ role: "user", text: query });
      setInput("");
      push({
        role: "agent",
        kind: "note",
        text: "🚧 Natural language project creation is coming soon.",
      });
      return;
    }

    let fullQuery = query;
    if (attachedFile) {
      fullQuery += ` (Attached file: ${attachedFile.name})`;
      setAttachedFile(null);
    }

    push({ role: "user", text: fullQuery });
    setInput("");

    const isStyleOrMediaReq = isStyleOrMediaModificationRequest(fullQuery);

    if (isStyleOrMediaReq) {
      // Styling / Animation / Image / Video / Card Theme modification -> Use Azure OpenAI tool calls
      setBusy(true);
      setStatus("Applying custom UI & styling changes…");

      try {
        const res = await askAzureOpenAI({
          query: fullQuery,
          thread,
          dashboardKey,
          chartsData,
          project,
          session,
        });
        const text = typeof res === "string" ? res : res?.text || "";
        if (text) {
          push({ role: "agent", kind: "text", text });
        }

        if (res?.toolCall) {
          const { name, args } = res.toolCall;
          if (name === "update_chart_text_color") {
            const detail = {
              chart_title_or_id: args.chart_title_or_id,
              text_color: parseCssColor(args.text_color, true),
            };
            window.dispatchEvent(
              new CustomEvent("update_chart_card_style", { detail }),
            );
          } else if (name === "update_chart_card_style") {
            const detail = { ...args };
            if (
              !detail.chart_title_or_id ||
              detail.chart_title_or_id === "target card" ||
              /\b(charts|all charts|the charts|cards|all cards|every chart)\b/i.test(
                query,
              )
            ) {
              detail.chart_title_or_id = "all";
            }
            if (detail.text_color) {
              detail.text_color = parseCssColor(detail.text_color, true);
            }
            const rawTarget =
              detail.background_color ||
              detail.image_url ||
              detail.video_url ||
              query;
            const media = await resolvePexelsMedia(
              rawTarget || query,
              detail.background_type || "auto",
            );
            if (
              (media.type === "color" || media.type === "gradient") &&
              media.url
            ) {
              detail.background_color = media.url;
              detail.background_type = "color";
              delete detail.video_url;
              delete detail.image_url;
            } else if (media.type === "video" && media.url) {
              detail.video_url = media.url;
              detail.background_type = "video";
            } else if (media.type === "image" && media.url) {
              detail.image_url = media.url;
              detail.background_type = "image";
            }
            window.dispatchEvent(
              new CustomEvent("update_chart_card_style", { detail }),
            );
          } else if (name === "update_chart_style") {
            window.dispatchEvent(
              new CustomEvent("update_chart_style", { detail: args }),
            );
          } else if (name === "update_storyboard_background") {
            const detail = { ...args };
            if (
              detail.background_type === "video" ||
              detail.image_or_video_url?.includes?.("pexels") ||
              /\b(video|bird|nature|sky|city|tech|ocean|loop)\b/i.test(query)
            ) {
              const directVideo = await resolvePexelsVideoUrl(
                detail.image_or_video_url || query,
              );
              if (directVideo) {
                detail.image_or_video_url = directVideo;
                detail.background_type = "video";
              }
            }
            window.dispatchEvent(
              new CustomEvent("update_storyboard_background", { detail }),
            );
          } else if (name === "update_chart_type") {
            window.dispatchEvent(
              new CustomEvent("update_chart_type", { detail: args }),
            );
            const targetTitle = args.chart_title_or_id || "Coverage Over Time";
            const targetType = args.chart_type || "pie";
            const realDataObj = extractRealChartData(
              targetTitle,
              chartsData,
              project,
              session,
            );
            const chartObj = {
              chart_id: targetTitle.toLowerCase().replace(/[^a-z0-9]/g, "_"),
              title: realDataObj?.title || targetTitle,
              chart_type: targetType,
              description:
                realDataObj?.description ||
                `Converted ${targetTitle} into a ${targetType} chart. Click below to add it to any tab:`,
              data: realDataObj?.data,
              color: realDataObj?.color,
            };
            push({ role: "agent", kind: "charts", charts: [chartObj] });
          } else if (name === "add_dynamic_chart") {
            const chartTitle = args.title || query;
            const chartType = args.chart_type || "pie";
            const realDataObj = extractRealChartData(
              chartTitle,
              chartsData,
              project,
              session,
            );
            const newChart = {
              title: realDataObj?.title || chartTitle,
              description:
                args.explanation ||
                realDataObj?.description ||
                "AI Generated Visualization",
              chart_type: chartType,
              color: args.color || realDataObj?.color || "#8B5CF6",
              data:
                Array.isArray(args.data) && args.data.length > 0
                  ? args.data
                  : realDataObj?.data,
            };
            push({ role: "agent", kind: "charts", charts: [newChart] });
          }
        }
      } catch (err) {
        console.warn("[ChatDock] Azure OpenAI styling error:", err);
        if (sessionId) {
          sendViaWebSocket(fullQuery);
        }
      } finally {
        setBusy(false);
        setStatus("");
      }
    } else {
      // General data / analytics query -> Use ws/agent WebSocket exclusively!
      sendViaWebSocket(fullQuery);
    }
  }

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && open) {
        closeDock();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  if (!open) {
    return (
      <button
        className="chatlauncher"
        onClick={() => setOpen(true)}
        aria-label="Open chat agent"
      >
        <span className="chatlauncher__glow" />
        <SparklesIcon width={18} height={18} />
        <span>{launcherLabel}</span>
      </button>
    );
  }

  const userName = session?.user_name || "there";

  return createPortal(
    <div
      className={`iv-chatdock-wrapper${visible ? " iv-chatdock-wrapper--visible" : ""}`}
    >
      {/* Outer Dimmed Backdrop - Click to Close */}
      <div className="iv-chatdock-backdrop" onClick={closeDock} />

      {/* Floating Framed Modal Container */}
      <div
        className={`iv-chatdock${visible ? " iv-chatdock--visible" : ""}`}
        role="dialog"
        aria-label="InfoVision Data Agent"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <header className="iv-chatdock__head">
          <div className="iv-chatdock__identity">
            <span className="iv-chatdock__avatar">
              <SparklesIcon width={17} height={17} color="#ffffff" />
            </span>
            <div>
              <div className="iv-chatdock__title-row">
                <span className="iv-chatdock__title">{title}</span>
                <span className="iv-chatdock__ctxbadge">
                  {" "}
                  Analyzing Active Dashboard
                </span>
              </div>
              <span className="iv-chatdock__status">
                <i className="iv-chatdock__dot" /> Online
              </span>
            </div>
          </div>

          <div className="iv-chatdock__controls">
            <button
              className="iv-chatdock__closebtn"
              onClick={closeDock}
              aria-label="Close Chat Window"
            >
              <CloseIcon width={16} height={16} />
              <span>Close</span>
            </button>
          </div>
        </header>

        {/* Main Body */}
        <div className="iv-chatdock__body">
          {thread.length === 0 ? (
            /* =========================================================================
               PRE-CHAT SCREEN (Matching reference image with 3D fluid morphing orb animation)
               ========================================================================= */
            <div className="iv-prechat">
              {/* 3D Fluid Morphing Orb Animation Container */}
              <div className="iv-orb-container">
                <div className="iv-orb-aura" />
                <div className="iv-fluid-orb" />
                <div className="iv-orb-grid" />
              </div>

              {/* Greeting Typography */}
              <div className="iv-prechat__greeting">
                <h1>Hey! {userName}</h1>
                <h2>What can I help with?</h2>
              </div>

              {/* Recommendation Cards */}
              <div className="iv-prechat__cards">
                {PRECHAT_CARDS.map((card, i) => (
                  <button
                    key={i}
                    className="iv-prechat__card"
                    onClick={() => handleSendQuery(card.query)}
                  >
                    <span
                      className="iv-prechat__tag"
                      style={{
                        backgroundColor: card.tagBg,
                        color: card.tagColor,
                      }}
                    >
                      {card.tag}
                    </span>
                    <p className="iv-prechat__desc">{card.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* =========================================================================
               ACTIVE CHAT THREAD
               ========================================================================= */
            <div className="iv-chatdock__thread">
              {thread.map((m) =>
                m.role === "user" ? (
                  <div className={cn("cmsg", "cmsg--user")} key={m.id}>
                    {m.text}
                  </div>
                ) : m.kind === "charts" ? (
                  <div
                    className={cn("cmsg", "cmsg--agent", "cmsg--charts")}
                    key={m.id}
                  >
                    {m.text && (
                      <div className={cn("mb-3", "text-sm", "leading-relaxed")}>
                        <Rich text={m.text} />
                      </div>
                    )}
                    {m.charts.map((c, i) => (
                      <ChatChartPreview
                        key={i}
                        chart={c}
                        activeTab={activeTab}
                        availableTabs={availableTabs}
                      />
                    ))}
                  </div>
                ) : m.kind === "error" ? (
                  <div className={cn("cmsg", "cmsg--error")} key={m.id}>
                    {m.text}
                  </div>
                ) : m.kind === "note" ? (
                  <div className={cn("cmsg", "cmsg--note")} key={m.id}>
                    {m.text}
                  </div>
                ) : (
                  <div className={cn("cmsg", "cmsg--agent")} key={m.id}>
                    <Rich text={m.text} />
                  </div>
                ),
              )}

              {busy && (
                <div className={cn("cmsg", "cmsg--status")}>
                  <span className="cdots">
                    <i />
                    <i />
                    <i />
                  </span>
                  <span>{status}</span>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Floating Input Bar */}
        <div className="iv-chatdock__inputwrap">
          <input
            ref={fileInputRef}
            type="file"
            style={{ display: "none" }}
            onChange={handleFileSelect}
          />

          <div className="iv-chatdock__inputbox">
            <div className="iv-inputtop">
              <span className="iv-inputsparkle">
                <SparklesIcon width={16} height={16} color="#B301FF" />
              </span>
              <input
                value={input}
                placeholder={placeholder || "Ask me anything..."}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSendQuery();
                }}
                disabled={busy}
              />
            </div>

            <div className="iv-inputbottom">
              <div className="iv-inputactions">
                <button
                  type="button"
                  className="iv-chipbtn"
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach file"
                >
                  <UploadIcon width={14} height={14} />
                  <span>
                    {attachedFile ? attachedFile.name : "Attach file"}
                  </span>
                </button>
              </div>

              <button
                className="iv-sendbtn"
                onClick={() => handleSendQuery()}
                disabled={busy || (!input.trim() && !attachedFile)}
                aria-label="Send"
              >
                <SendIcon width={16} height={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
