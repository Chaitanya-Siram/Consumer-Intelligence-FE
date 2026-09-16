import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useChartAi } from "../context/ChartAiContext.jsx";
import { agentWsUrl } from "../api/agent.js";
import { Rich } from "../utils/text.jsx";

function SparklesIcon({ width = 16, height = 16, color = "currentColor" }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3c.167 2.333 1.167 3.333 3.5 3.5C13.167 6.667 12.167 7.667 12 10c-.167-2.333-1.167-3.333-3.5-3.5C10.833 6.333 11.833 5.333 12 3z" />
      <path d="M5 14c.1 1.4.7 2 2.1 2.1-1.4.1-2 .7-2.1 2.1-.1-1.4-.7-2-2.1-2.1 1.4-.1 2-.7 2.1-2.1z" />
      <path d="M19 13c.1 1.4.7 2 2.1 2.1-1.4.1-2 .7-2.1 2.1-.1-1.4-.7-2-2.1-2.1 1.4-.1 2-.7 2.1-2.1z" />
    </svg>
  );
}

function CloseIcon({ width = 16, height = 16 }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function SendIcon({ width = 16, height = 16 }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

const PRECHAT_RECOMMENDATIONS = [
  {
    tag: "Chart Format",
    tagBg: "#f3e8ff",
    tagColor: "#8b5cf6",
    desc: "Switch to Bar Chart",
    query: "Switch to Bar Chart",
  },
  {
    tag: "Visualization",
    tagBg: "#e0e7ff",
    tagColor: "#4f46e5",
    desc: "Switch to Donut / Pie Chart",
    query: "Switch to Pie Chart",
  },
  {
    tag: "Analysis",
    tagBg: "#fef3c7",
    tagColor: "#d97706",
    desc: "Summarize key media insights and trends",
    query: "Summarize key trends and data insights",
  },
];

export default function ChartAiDrawer({ sessionId }) {
  const { activeChart, isDrawerOpen, closeChartAi, updateSingleChart } = useChartAi();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const wsRef = useRef(null);
  const scrollRef = useRef(null);

  const chartId = activeChart?.chart_id || activeChart?.id || activeChart?.title;

  // Lock dashboard scrolling when drawer is active
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.classList.add("chart-ai-active");
      document.documentElement.classList.add("chart-ai-active");
    } else {
      document.body.classList.remove("chart-ai-active");
      document.documentElement.classList.remove("chart-ai-active");
    }
    return () => {
      document.body.classList.remove("chart-ai-active");
      document.documentElement.classList.remove("chart-ai-active");
    };
  }, [isDrawerOpen]);

  useEffect(() => {
    if (activeChart) {
      setMessages([]);
    }
  }, [chartId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, status, busy]);

  const detectChartType = (text) => {
    const q = text.toLowerCase();
    if (q.includes("pie") || q.includes("donut")) return "donut";
    if (q.includes("bar")) return "bar";
    if (q.includes("line")) return "line";
    if (q.includes("stacked area") || q.includes("area")) return "stacked_area";
    if (q.includes("scatter")) return "scatter";
    if (q.includes("radar")) return "radar";
    if (q.includes("heatmap")) return "heatmap";
    return null;
  };

  const handleSend = (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query || busy || !activeChart) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: query }]);

    // Detect chart format intent
    const detectedType = detectChartType(query);
    if (detectedType) {
      updateSingleChart(chartId, { chart_type: detectedType, title: activeChart.title });
    }

    // Always connect to real-time WebSocket agent
    setBusy(true);
    setStatus("Connecting to InfoVision Agent…");

    const effectiveSessionId = sessionId || 1;
    const ws = new WebSocket(agentWsUrl());
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          session_id: effectiveSessionId,
          query: `[Target Chart: ID="${chartId}", Title="${activeChart.title}", Format="${detectedType || activeChart.chart_type}"] ${query}`,
          chart_context: {
            chart_id: chartId,
            title: activeChart.title,
            chart_type: detectedType || activeChart.chart_type,
            description: activeChart.description,
            data: activeChart.data,
          },
        })
      );
    };

    let responseReceived = false;

    ws.onmessage = (ev) => {
      let msg;
      try {
        msg = JSON.parse(ev.data);
      } catch {
        return;
      }

      switch (msg.type) {
        case "intent":
          setStatus(msg.intent === "chart" ? "Updating chart visualization…" : "Analyzing dataset…");
          break;
        case "status":
          setStatus(msg.message || "Processing request…");
          break;
        case "chart":
          if (msg.chart) {
            updateSingleChart(chartId, msg.chart);
            setMessages((prev) => [
              ...prev,
              { role: "agent", text: `Updated **${activeChart.title}** configuration.` },
            ]);
            responseReceived = true;
          }
          break;
        case "answer":
          if (msg.answer) {
            setMessages((prev) => [...prev, { role: "agent", text: msg.answer }]);
            responseReceived = true;
          }
          break;
        case "complete":
          if (!responseReceived) {
            if (msg.charts?.length > 0) {
              updateSingleChart(chartId, msg.charts[0]);
              setMessages((prev) => [
                ...prev,
                { role: "agent", text: `Updated **${activeChart.title}** visualization.` },
              ]);
            } else if (detectedType) {
              const formatLabel = detectedType === "donut" ? "Donut / Pie Chart" : detectedType.toUpperCase();
              setMessages((prev) => [
                ...prev,
                { role: "agent", text: `Updated **${activeChart.title}** to **${formatLabel}** format.` },
              ]);
            }
          }
          setBusy(false);
          setStatus("");
          try {
            ws.close();
          } catch {
            /* noop */
          }
          break;
        case "error":
          if (detectedType) {
            const formatLabel = detectedType === "donut" ? "Donut / Pie Chart" : detectedType.toUpperCase();
            setMessages((prev) => [
              ...prev,
              { role: "agent", text: `Updated **${activeChart.title}** to **${formatLabel}** format.` },
            ]);
          } else {
            setMessages((prev) => [
              ...prev,
              { role: "agent", text: msg.detail || "Unable to complete request." },
            ]);
          }
          setBusy(false);
          setStatus("");
          try {
            ws.close();
          } catch {
            /* noop */
          }
          break;
        default:
          break;
      }
    };

    ws.onerror = () => {
      if (detectedType) {
        const formatLabel = detectedType === "donut" ? "Donut / Pie Chart" : detectedType.toUpperCase();
        setMessages((prev) => [
          ...prev,
          { role: "agent", text: `Updated **${activeChart.title}** to **${formatLabel}** format.` },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "agent", text: "Connection issue — updated chart state locally." },
        ]);
      }
      setBusy(false);
      setStatus("");
    };

    ws.onclose = () => {
      setBusy(false);
      setStatus("");
    };
  };

  return (
    <AnimatePresence>
      {isDrawerOpen && activeChart && (
        <motion.aside
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            bottom: 0,
            width: "420px",
            maxWidth: "92vw",
            background: "#F8FAFC",
            boxShadow: "-16px 0 48px rgba(15, 23, 42, 0.16)",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            borderLeft: "1px solid rgba(0, 0, 0, 0.08)",
            fontFamily: "Inter, system-ui, sans-serif",
          }}
        >
          {/* Header Bar matching ChatDock */}
          <header
            style={{
              padding: "16px 20px",
              background: "#ffffff",
              borderBottom: "1px solid #E2E8F0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #b301ff 0%, #d500e1 35%, #f323a3 70%, #ff5363 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 14px rgba(179, 1, 255, 0.3)",
                  flexShrink: 0,
                }}
              >
                <SparklesIcon width={18} height={18} color="#ffffff" />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "14px", fontWeight: "700", color: "#0F172A" }}>
                    AlphaMetricx Agent
                  </span>
                  <span
                    style={{
                      background: "#F3E8FF",
                      color: "#8B5CF6",
                      padding: "2px 8px",
                      borderRadius: "9999px",
                      fontSize: "10.5px",
                      fontWeight: "600",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: "140px",
                    }}
                    title={activeChart.title}
                  >
                    Editing {activeChart.title}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: "#10B981",
                      display: "inline-block",
                    }}
                  />
                  <span style={{ fontSize: "11px", color: "#64748B", fontWeight: "500" }}>
                    Online
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={closeChartAi}
              style={{
                background: "#F1F5F9",
                border: "1px solid #E2E8F0",
                borderRadius: "9999px",
                padding: "5px 12px",
                fontSize: "12px",
                fontWeight: "600",
                color: "#475569",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#E2E8F0";
                e.currentTarget.style.color = "#0F172A";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#F1F5F9";
                e.currentTarget.style.color = "#475569";
              }}
            >
              <CloseIcon width={14} height={14} />
              <span>Close</span>
            </button>
          </header>

          {/* Chat Body & Messages */}
          <div
            ref={scrollRef}
            style={{
              flex: 1,
              padding: "20px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              background: "#F8FAFC",
            }}
          >
            {messages.length === 0 ? (
              /* Pre-Chat Header & Suggestion Cards */
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlignment: "center", paddingTop: "10px" }}>
                {/* 3D Fluid Morphing Orb Animation */}
                <div className="iv-orb-container" style={{ width: "130px", height: "130px", margin: "0 auto 16px" }}>
                  <div className="iv-orb-aura" />
                  <div className="iv-fluid-orb" style={{ width: "110px", height: "110px" }} />
                  <div className="iv-orb-grid" />
                </div>

                <div className="iv-prechat__greeting" style={{ textAlign: "center" }}>
                  <h1 style={{ fontSize: "20px", fontWeight: "700", color: "#0F172A" }}>
                    Edit {activeChart.title}
                  </h1>
                  <h2 style={{ fontSize: "14px", fontWeight: "500", color: "#64748B", marginTop: "4px", marginBottom: "20px" }}>
                    What would you like to update?
                  </h2>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
                  {PRECHAT_RECOMMENDATIONS.map((card, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSend(card.query)}
                      className="iv-prechat__card"
                      style={{ width: "100%", padding: "12px 14px", background: "#ffffff" }}
                    >
                      <span
                        className="iv-prechat__tag"
                        style={{ backgroundColor: card.tagBg, color: card.tagColor }}
                      >
                        {card.tag}
                      </span>
                      <p className="iv-prechat__desc" style={{ fontSize: "12px", marginTop: "2px" }}>
                        {card.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Message Thread */
              messages.map((m, idx) => {
                const isUser = m.role === "user";

                return (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      justifyContent: isUser ? "flex-end" : "flex-start",
                    }}
                  >
                    <div
                      style={{
                        maxWidth: "88%",
                        padding: "12px 16px",
                        borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                        background: isUser
                          ? "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)"
                          : "#ffffff",
                        color: isUser ? "#ffffff" : "#0F172A",
                        fontSize: "13px",
                        lineHeight: 1.5,
                        boxShadow: isUser
                          ? "0 4px 14px rgba(79, 70, 229, 0.25)"
                          : "0 2px 8px rgba(15, 23, 42, 0.05)",
                        border: isUser ? "none" : "1px solid #E2E8F0",
                      }}
                    >
                      <Rich text={m.text} />
                    </div>
                  </div>
                );
              })
            )}

            {busy && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  color: "#64748B",
                  fontSize: "12.5px",
                  padding: "8px 12px",
                  background: "#ffffff",
                  borderRadius: "12px",
                  width: "fit-content",
                  border: "1px solid #E2E8F0",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                }}
              >
                <span className="cdots">
                  <i />
                  <i />
                  <i />
                </span>
                <span>{status || "Agent analyzing chart…"}</span>
              </div>
            )}
          </div>

          {/* Floating Footer Input Bar */}
          <div
            style={{
              padding: "14px 18px",
              background: "#ffffff",
              borderTop: "1px solid #E2E8F0",
            }}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                background: "#F8FAFC",
                border: "1px solid #CBD5E1",
                borderRadius: "16px",
                padding: "6px 8px 6px 14px",
                transition: "border-color 0.2s, box-shadow 0.2s",
              }}
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Ask or edit ${activeChart.title || "chart"}…`}
                disabled={busy}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  fontSize: "13px",
                  color: "#0F172A",
                }}
              />

              <button
                type="submit"
                disabled={busy || !input.trim()}
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "10px",
                  background:
                    busy || !input.trim()
                      ? "#CBD5E1"
                      : "linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #3b82f6 100%)",
                  border: "none",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: busy || !input.trim() ? "not-allowed" : "pointer",
                  boxShadow:
                    busy || !input.trim()
                      ? "none"
                      : "0 4px 12px rgba(139, 92, 246, 0.35)",
                  transition: "all 0.2s ease",
                  flexShrink: 0,
                }}
              >
                <SendIcon width={15} height={15} />
              </button>
            </form>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
