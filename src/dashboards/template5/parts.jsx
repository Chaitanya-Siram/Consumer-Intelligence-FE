import { useEffect } from "react";
import { Rich } from "../../utils/text.jsx";
import {
  DynamicChartRenderer,
  Empty,
} from "../../components/CustomChartWidgets.jsx";
import { useDynamicCharts } from "../../utils/dynamicChartManager.js";
import "./Template5.css";
import { cn } from "../../lib/utils";

// Helper to format values
export function nf(n) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return new Intl.NumberFormat("en-US").format(n);
}

export function compact(n) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}

// Icon mapping based on tab names
const TAB_ICONS = {
  overview: "fa-solid fa-house-chimney-window",
  "sentiment analysis": "fa-solid fa-chart-line",
  sentiment: "fa-solid fa-chart-line",
  "themes & topics": "fa-solid fa-hashtag",
  themes: "fa-solid fa-hashtag",
  "media coverage": "fa-solid fa-newspaper",
  coverage: "fa-solid fa-newspaper",
  "key stories": "fa-solid fa-star",
  stories: "fa-solid fa-star",
  "message consistency": "fa-solid fa-circle-check",
  "media types": "fa-solid fa-photo-film",
  "competitor breakdown": "fa-solid fa-users-line",
  "reputation scorecard": "fa-solid fa-gauge-high",
  "trust pillars": "fa-solid fa-landmark",
  "weight sensitivity": "fa-solid fa-sliders",
  "competitor benchmarks": "fa-solid fa-users",
  "impact breakdown": "fa-solid fa-chart-simple",
};

export function T5KpiCard({ label, value, icon, sparkPath, iconBg, iconFg }) {
  return (
    <div className="t5-kpi-card">
      <div className="t5-kpi-header">
        <span className="t5-kpi-label">{label}</span>
        <div
          className="t5-kpi-icon"
          style={{
            background: iconBg || "rgba(30,95,232,0.14)",
            color: iconFg || "#1E5FE8",
          }}
        >
          <i
            className={icon || "fa-solid fa-chart-simple"}
            style={{ fontSize: "12px" }}
          ></i>
        </div>
      </div>
      {sparkPath && (
        <svg
          viewBox="0 0 140 34"
          style={{ width: "100%", height: "34px", marginTop: "8px" }}
        >
          <path
            d={sparkPath}
            fill="none"
            stroke={iconFg || "#1E5FE8"}
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          ></path>
        </svg>
      )}
      <div className="t5-kpi-value">{value}</div>
    </div>
  );
}

export function T5NextChapter({ num, title, hook, onClick }) {
  return (
    <div
      className="t5-card"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "rgba(255, 255, 255, 0.42)",
        border: "1px solid rgba(255, 255, 255, 0.5)",
        cursor: "pointer",
        padding: "20px 22px",
        marginTop: "16px",
        transition: "all 0.2s ease",
      }}
      onClick={onClick}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "12px",
            background: "var(--iv-navy)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "700",
            fontSize: "16px",
          }}
        >
          {num}
        </div>
        <div>
          <div
            style={{
              fontSize: "11px",
              fontWeight: "700",
              textTransform: "uppercase",
              color: "var(--iv-ink-600)",
              letterSpacing: "0.05em",
            }}
          >
            Up Next · Chapter {num}
          </div>
          <div
            style={{
              fontSize: "15px",
              fontWeight: "700",
              color: "var(--iv-navy)",
              marginTop: "2px",
            }}
          >
            {title}
          </div>
        </div>
      </div>
      <button
        style={{
          background: "var(--iv-gradient-cta)",
          border: "none",
          color: "#fff",
          padding: "8px 16px",
          borderRadius: "99px",
          fontSize: "12.5px",
          fontWeight: "600",
          cursor: "pointer",
          boxShadow: "0 4px 12px rgba(30,95,232,0.2)",
        }}
      >
        Continue reading{" "}
        <i
          className={cn("fa-solid", "fa-arrow-right")}
          style={{ marginLeft: "4px" }}
        ></i>
      </button>
    </div>
  );
}

export function T5StoryComplete({ tabs = [], onGoTab, onRestart }) {
  return (
    <div
      className="t5-card"
      style={{
        textAlign: "center",
        padding: "32px 24px",
        background: "rgba(255, 255, 255, 0.45)",
        border: "1px solid rgba(255,255,255,0.5)",
        marginTop: "16px",
      }}
    >
      <div
        style={{
          width: "54px",
          height: "54px",
          borderRadius: "50%",
          background: "var(--iv-green-bright)",
          color: "#fff",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "24px",
          marginBottom: "16px",
          boxShadow: "0 6px 20px rgba(63,212,122,0.3)",
        }}
      >
        ✓
      </div>
      <h3
        style={{ fontSize: "18px", fontWeight: "700", color: "var(--iv-navy)" }}
      >
        You've reviewed every chapter
      </h3>
      <p
        style={{
          fontSize: "13px",
          color: "var(--iv-ink-600)",
          maxWidth: "500px",
          margin: "8px auto 20px",
        }}
      >
        Every section has been analysed — from the headline metrics through each
        deep dive. Jump back to any chapter below, or restart the story.
      </p>

      <div
        style={{
          display: "flex",
          gap: "10px",
          justifyContent: "center",
          flexWrap: "wrap",
          marginBottom: "20px",
        }}
      >
        {tabs.map((t, i) => (
          <button
            key={t}
            onClick={() => onGoTab?.(t)}
            style={{
              padding: "6px 14px",
              borderRadius: "99px",
              border: "1px solid rgba(10,31,68,0.1)",
              background: "rgba(255,255,255,0.6)",
              fontSize: "12px",
              fontWeight: "600",
              color: "var(--iv-navy)",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            <span style={{ marginRight: "4px", opacity: 0.7 }}>{i + 1}</span>{" "}
            {t}
          </button>
        ))}
      </div>

      <button
        onClick={onRestart}
        style={{
          background: "var(--iv-gradient-cta)",
          border: "none",
          color: "#fff",
          padding: "10px 22px",
          borderRadius: "99px",
          fontSize: "13.5px",
          fontWeight: "600",
          cursor: "pointer",
          boxShadow: "0 6px 18px rgba(30,95,232,0.25)",
        }}
      >
        Start over{" "}
        <i
          className={cn("fa-solid", "fa-rotate-right")}
          style={{ marginLeft: "4px" }}
        ></i>
      </button>
    </div>
  );
}

export function T5Card({
  title,
  sub,
  chart,
  children,
  analysis,
  onOpenAnalysis,
  insight,
  dateInsights,
}) {
  return (
    <div className="t5-card">
      <div className="t5-card-head">
        <div>
          {title && <h3 className="t5-card-title">{title}</h3>}
          {sub && <p className="t5-card-sub">{sub}</p>}
        </div>
      </div>
      <div style={{ marginTop: "12px" }}>
        {children ??
          (chart ? (
            <DynamicChartRenderer chart={chart} dateInsights={dateInsights} />
          ) : (
            <Empty />
          ))}
      </div>
      {(insight || analysis || onOpenAnalysis) && (
        <div
          style={{
            marginTop: "12px",
            padding: "10px",
            background: "rgba(255,255,255,0.06)",
            borderRadius: "8px",
            fontSize: "12.5px",
            color: "var(--iv-ink-750)",
          }}
        >
          {insight ? (
            <Rich
              text={insight}
              style={{ color: "oklch(0.53 0.015 265)", lineHeight: 1.4 }}
              suffix={
                onOpenAnalysis || analysis ? (
                  <button
                    type="button"
                    onClick={onOpenAnalysis}
                    className={cn(
                      "inline-flex",
                      "items-center",
                      "ml-1",
                      "text-xs",
                      "font-semibold",
                      "text-indigo-600",
                      "hover:text-indigo-800",
                      "underline",
                      "cursor-pointer",
                      "transition-colors",
                    )}
                    style={{ color: "var(--accent-a, #6366f1)" }}
                  >
                    Read More
                  </button>
                ) : null
              }
            />
          ) : onOpenAnalysis || analysis ? (
            <Rich
              text={
                typeof analysis === "string" && analysis.trim()
                  ? analysis.trim().length > 160
                    ? analysis.trim().slice(0, 160) + "…"
                    : analysis.trim()
                  : ""
              }
              style={{ color: "oklch(0.53 0.015 265)", lineHeight: 1.4 }}
              inline={true}
              suffix={
                <button
                  type="button"
                  onClick={onOpenAnalysis}
                  className={cn(
                    "inline-flex",
                    "items-center",
                    "ml-1",
                    "text-xs",
                    "font-semibold",
                    "text-indigo-600",
                    "hover:text-indigo-800",
                    "underline",
                    "cursor-pointer",
                    "transition-colors",
                  )}
                  style={{ color: "var(--accent-a, #6366f1)" }}
                >
                  Read More
                </button>
              }
            />
          ) : null}
        </div>
      )}
    </div>
  );
}

export function T5StoryboardPanel({ chapter }) {
  if (
    !chapter ||
    (!chapter.title &&
      !chapter.description &&
      !chapter.what_to_watch_for?.length)
  ) {
    return null;
  }

  const watches = chapter.what_to_watch_for || [];
  const CARD_GRADIENTS = [
    ["rgba(99, 102, 241, 0.15)", "rgba(139, 92, 246, 0.15)"],
    ["rgba(139, 92, 246, 0.15)", "rgba(236, 72, 153, 0.15)"],
    ["rgba(236, 72, 153, 0.15)", "rgba(245, 158, 11, 0.15)"],
    ["rgba(245, 158, 11, 0.15)", "rgba(16, 185, 129, 0.15)"],
    ["rgba(16, 185, 129, 0.15)", "rgba(6, 182, 212, 0.15)"],
  ];

  const CARD_TEXT_COLORS = [
    "#4f46e5",
    "#7c3aed",
    "#db2777",
    "#d97706",
    "#059669",
  ];

  const CARD_LABELS = [
    "KEY SIGNAL",
    "DATA POINT",
    "INSIGHT",
    "TREND",
    "WATCHLIST",
  ];

  return (
    <div
      className="t5-card"
      style={{ background: "rgba(255, 255, 255, 0.65)", padding: "20px 24px" }}
    >
      <div style={{ marginBottom: "16px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <div>
            {chapter.section_label && (
              <span
                style={{
                  fontSize: "11.5px",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "var(--iv-royal)",
                }}
              >
                {chapter.section_label}
              </span>
            )}
            <h3
              className="t5-card-title"
              style={{ fontSize: "17px", marginTop: "4px" }}
            >
              {chapter.title || "Your storyline for this tab"}
            </h3>
            {chapter.description && (
              <p
                style={{
                  fontSize: "13.5px",
                  color: "var(--iv-ink-600)",
                  marginTop: "6px",
                  lineHeight: "1.5",
                }}
              >
                {chapter.description}
              </p>
            )}
          </div>
          {watches.length > 0 && (
            <p
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12.5px",
                fontWeight: "600",
                color: "var(--iv-navy)",
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
              Watch for these signals
            </p>
          )}
        </div>
      </div>

      {watches.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "14px",
            marginTop: "16px",
          }}
        >
          {watches.map((w, i) => {
            const [bg1, bg2] = CARD_GRADIENTS[i % CARD_GRADIENTS.length];
            const textColor = CARD_TEXT_COLORS[i % CARD_TEXT_COLORS.length];
            return (
              <div
                key={i}
                style={{
                  padding: "16px",
                  borderRadius: "14px",
                  background: `linear-gradient(135deg, ${bg1}, ${bg2})`,
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255,255,255,0.4)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  minHeight: "100px",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: "700",
                      color: textColor,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                    }}
                  >
                    {String(i + 1).padStart(2, "0")} ·{" "}
                    {CARD_LABELS[i % CARD_LABELS.length]}
                  </div>
                  <p
                    style={{
                      fontSize: "13.5px",
                      color: "#111827",
                      fontWeight: "600",
                      marginTop: "8px",
                      lineHeight: "1.4",
                    }}
                  >
                    {w}
                  </p>
                </div>
                <div
                  style={{
                    alignSelf: "flex-end",
                    color: textColor,
                    fontSize: "14px",
                    marginTop: "8px",
                  }}
                >
                  →
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Template5Core({
  brandLabel,
  onBack,
  templateMode,
  onChangeTemplate,
  hero = {},
  activeVideoSrc,
  tabs = [],
  tab,
  setTab,
  kpis = [],
  findings = [],
  centerByTab = {},
  chapters = [],
  overall,
}) {
  const activeTab = tab && tabs.includes(tab) ? tab : tabs[0];
  const { customTabsData } = useDynamicCharts(activeTab);
  const activeIdx = Math.max(0, tabs.indexOf(activeTab));
  const activeTabKey = activeTab.toLowerCase();

  const cards = centerByTab[activeTab] || [];

  const isLast = activeIdx === tabs.length - 1;
  const nextName = !isLast ? tabs[activeIdx + 1] : null;
  const chapterMeta = (name, idx) => {
    if (Array.isArray(chapters) && chapters.length) {
      return (
        chapters.find(
          (c) => c.tab_name?.toLowerCase() === String(name).toLowerCase(),
        ) ||
        chapters[idx] ||
        null
      );
    }
    return null;
  };
  const nextMeta = nextName ? chapterMeta(nextName, activeIdx + 1) : null;
  const cur = chapterMeta(activeTab, activeIdx);

  const getTabIcon = (tabName) => {
    const norm = String(tabName).toLowerCase();
    return TAB_ICONS[norm] || "fa-solid fa-circle";
  };

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  const greetingMessage = `${greeting} — ${brandLabel} is trending calm`;

  return (
    <div className="t5-root">
      {/* Background looping video */}
      {activeVideoSrc && (
        <video
          className="t5-video-bg"
          src={activeVideoSrc}
          autoPlay
          muted
          loop
          playsInline
        />
      )}

      {/* Tinted glass overlay */}
      <div className="t5-overlay" />

      {/* Main layout */}
      <div className="t5-layout">
        <div className="t5-container">
          {/* Glass Rail Left Navigation */}
          <aside className="t5-rail">
            {onBack && (
              <button
                title="Back to home"
                onClick={onBack}
                className="t5-rail-btn"
                style={{ marginBottom: "4px" }}
              >
                <i
                  className={cn("fa-solid", "fa-arrow-left")}
                  style={{ fontSize: "16px" }}
                ></i>
              </button>
            )}
            <div className="t5-rail-logo">
              <i className={cn("fa-solid", "fa-bolt")}></i>
            </div>

            {tabs.map((t) => (
              <button
                key={t}
                title={t}
                onClick={() => setTab(t)}
                className={`t5-rail-btn ${activeTab === t ? "active" : ""}`}
              >
                <i className={getTabIcon(t)} style={{ fontSize: "16px" }}></i>
              </button>
            ))}

            <div style={{ flex: 1 }}></div>
            {/* <div className="t5-rail-avatar">PR</div> */}
          </aside>

          {/* Main workspace */}
          <main className="t5-main">
            {/* Header bar */}
            <div className="t5-header-bar">
              <div>
                <h2 className="t5-header-title">{greetingMessage}</h2>
                <p className="t5-header-sub">
                  {hero.sub ||
                    "Coverage volume, reach and sentiment across every tracked source."}
                </p>
              </div>
              <div
                style={{ display: "flex", gap: "10px", alignItems: "center" }}
              >
                {onBack && (
                  <button className="t5-back-btn" onClick={onBack}>
                    <i className={cn("fa-solid", "fa-arrow-left")}></i> Back to
                    dashboards
                  </button>
                )}
                {onChangeTemplate && (
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      className={`template-mode-btn ${templateMode === "classic" ? "active" : ""}`}
                      onClick={() => onChangeTemplate("classic")}
                    >
                      Standard
                    </button>
                    <button
                      className={`template-mode-btn ${templateMode === "editorial" ? "active" : ""}`}
                      onClick={() => onChangeTemplate("editorial")}
                    >
                      Compact
                    </button>
                    <button
                      className={`template-mode-btn ${templateMode === "merger" ? "active" : ""}`}
                      onClick={() => onChangeTemplate("merger")}
                    >
                      Executive
                    </button>
                    <button
                      className={`template-mode-btn ${templateMode === "impact" ? "active" : ""}`}
                      onClick={() => onChangeTemplate("impact")}
                    >
                      Detailed
                    </button>
                    <button
                      className={`template-mode-btn ${templateMode === "glass" ? "active" : ""}`}
                      onClick={() => onChangeTemplate("glass")}
                    >
                      <span className="tmb-dot" /> Glass
                    </button>
                  </div>
                )}
                <div className="t5-header-live">
                  <span className="t5-header-live-dot"></span> LIVE
                </div>
              </div>
            </div>

            {/* Tab pills */}
            <div className="t5-tab-pills">
              {tabs.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`t5-tab-pill ${activeTab === t ? "active" : ""}`}
                >
                  <i
                    className={getTabIcon(t)}
                    style={{ marginRight: "6px" }}
                  ></i>
                  {t}
                </button>
              ))}
            </div>

            {/* KPI metrics row */}
            {kpis.length > 0 && (
              <div className="t5-kpi-row">
                {kpis.map((k, i) => (
                  <T5KpiCard
                    key={i}
                    label={k.label}
                    value={k.value}
                    icon={k.icon}
                    sparkPath={k.sparkPath}
                    iconBg={k.iconBg}
                    iconFg={k.iconFg}
                  />
                ))}
              </div>
            )}

            {/* Main panels: full width stacked flow */}
            <div className="t5-grid">
              {activeTab === tabs[0] && overall && (
                <div
                  className="t5-card"
                  style={{ borderLeft: "4px solid var(--iv-royal)" }}
                >
                  <h3
                    className="t5-card-title"
                    style={{ marginBottom: "8px", fontSize: "16px" }}
                  >
                    <i
                      className={cn("fa-solid", "fa-ranking-star")}
                      style={{ marginRight: "6px" }}
                    ></i>
                    Executive Summary
                  </h3>
                  <div
                    style={{
                      fontSize: "14.5px",
                      lineHeight: "1.6",
                      color: "var(--iv-ink-700)",
                    }}
                  >
                    <Rich text={overall} lineHeight="1.4" />
                  </div>
                </div>
              )}

              {/* Key Findings (out of split grid, full width) */}
              {findings && findings.length > 0 && activeTab === tabs[0] && (
                <div className="t5-card">
                  <div
                    className="t5-card-head"
                    style={{
                      marginBottom: "12px",
                      borderBottom: "1px solid rgba(10,31,68,0.08)",
                      paddingBottom: "8px",
                    }}
                  >
                    <h3 className="t5-card-title">
                      <i
                        className={cn(
                          "fa-solid",
                          "fa-magnifying-glass-chart",
                          "mr-2",
                        )}
                      ></i>
                      Key Findings
                    </h3>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(280px, 1fr))",
                      gap: "14px",
                    }}
                  >
                    {findings.map((f, i) => (
                      <div
                        key={i}
                        style={{
                          background: "rgba(255, 255, 255, 0.45)",
                          borderRadius: "12px",
                          padding: "12px 14px",
                          border: "1px solid rgba(10,31,68,0.06)",
                        }}
                      >
                        {f.tag && (
                          <span
                            style={{
                              display: "inline-block",
                              fontSize: "10px",
                              fontWeight: 700,
                              padding: "2px 6px",
                              borderRadius: "4px",
                              background:
                                f.tone === "neg"
                                  ? "rgba(196,34,41,0.12)"
                                  : f.tone === "pos"
                                    ? "rgba(63,212,122,0.16)"
                                    : "rgba(10,31,68,0.06)",
                              color:
                                f.tone === "neg"
                                  ? "var(--iv-vision-red)"
                                  : f.tone === "pos"
                                    ? "var(--iv-green-bright)"
                                    : "var(--iv-navy)",
                              marginBottom: "6px",
                            }}
                          >
                            {f.tag}
                          </span>
                        )}
                        <div
                          style={{
                            fontSize: "13px",
                            color: "var(--iv-ink-700)",
                            lineHeight: 1.5,
                          }}
                        >
                          <Rich text={f.body} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {cur &&
                (cur.title ||
                  cur.description ||
                  cur.what_to_watch_for?.length) && (
                  <T5StoryboardPanel chapter={cur} />
                )}
              <>
                {cards.map((c, i) => (
                  <T5Card
                    key={i}
                    title={c.title}
                    sub={c.sub}
                    chart={c.chart}
                    analysis={c.analysis}
                    onOpenAnalysis={c.onOpenAnalysis}
                    insight={c.insight}
                    dateInsights={c.dateInsights}
                  >
                    {c.children}
                  </T5Card>
                ))}
                {/* ── Custom Dynamic Tabs Created by Chatbot ── */}
                {customTabsData?.[activeTab] && (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(320px, 1fr))",
                      gap: 16,
                      marginTop: 16,
                    }}
                  >
                    {customTabsData[activeTab].map((c, i) => (
                      <T5Card
                        key={c.chart_id || i}
                        title={c.title}
                        sub={c.description}
                        chart={c}
                      />
                    ))}
                  </div>
                )}
              </>

              {chapters.length > 0 &&
                (isLast ? (
                  <T5StoryComplete
                    tabs={tabs}
                    onGoTab={setTab}
                    onRestart={() => setTab(tabs[0])}
                  />
                ) : (
                  <T5NextChapter
                    num={String(activeIdx + 2).padStart(2, "0")}
                    title={nextName}
                    hook={nextMeta?.description}
                    onClick={() => setTab(nextName)}
                  />
                ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export { deriveSentiment, deriveThemeRows } from "../template4/parts.jsx";
