import { useEffect, useMemo, useRef, useState } from "react";
import { Rich, getInsightObj } from "../utils/text.jsx";
import ChatDock from "../components/ChatDock.jsx";
import AnalysisModal from "../components/AnalysisModal.jsx";
import {
  DynamicChartRenderer,
  GlobalChartDefs,
} from "../components/CustomChartWidgets.jsx";
import { StoryboardPanel, WhatsNext } from "../components/StoryboardPanel.jsx";
import Template1 from "../dashboards/pr_impact/Template1.jsx";
import Template2 from "../dashboards/pr_impact/Template2.jsx";
import Template3 from "../dashboards/pr_impact/Template3.jsx";
import Template4 from "../dashboards/pr_impact/Template4.jsx";
import Template5 from "../dashboards/pr_impact/Template5.jsx";
import Template6 from "../dashboards/pr_impact/Template6.jsx";
import Template7 from "../dashboards/pr_impact/Template7.jsx";

const DASHBOARD_KEY = "pr_impact";

// Fallback tab details if storyboard is missing
const TAB_HERO = {
  Overview: {
    label: "PR Overview",
    lead: "PR Impact,",
    em: "measured at scale.",
    sub: "Audience reach, net sentiment, and brand share of voice.",
  },
  "Coverage & Sentiment": {
    label: "Coverage & Sentiment",
    lead: "Article volume and tone,",
    em: "side by side.",
    sub: "Track positive vs negative mentions over the period.",
  },
  "Share of Voice": {
    label: "Share of Voice",
    lead: "Tesla versus the sector,",
    em: "in visibility.",
    sub: "Understand what percentage of the total conversation you own.",
  },
  "PR Impact": {
    label: "PR Impact",
    lead: "PR Score performance,",
    em: "day by day.",
    sub: "Daily impact weights and volume trends.",
  },
  Competitive: {
    label: "Competitive Analysis",
    lead: "How you stack up,",
    em: "against key players.",
    sub: "Multi-brand sentiment, reach, and score comparisons.",
  },
};

function splitHeadline(title) {
  if (!title) return { lead: "", em: "" };
  const m = String(title).match(/^(.*?[.!?])\s+(.+)$/);
  return m ? { lead: m[1], em: m[2] } : { lead: title, em: "" };
}

function nf(n) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return new Intl.NumberFormat("en-US").format(n);
}

function compact(n) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}

import {
  getCardStyleOverride,
  useDesignAgentUpdate,
} from "../utils/designAgent.js";

// ── Shared Card Shell ──
function ChartCard({
  title,
  subtitle,
  insight,
  analysis,
  onOpenAnalysis,
  wide,
  children,
}) {
  useDesignAgentUpdate();
  const cardOverride = getCardStyleOverride(title);
  const cardCustomStyle = cardOverride
    ? {
        background: cardOverride.background_color,
        borderColor: cardOverride.border_color || "rgba(255, 255, 255, 0.25)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15)",
        color: "#ffffff",
      }
    : undefined;

  return (
    <div
      className={`chartcard${wide ? " chartcard--wide" : ""}`}
      style={cardCustomStyle}
    >
      <div
        className="chartcard__head"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <h3
            className="chartcard__title"
            style={cardOverride ? { color: "#ffffff" } : undefined}
          >
            {title}
          </h3>
          {subtitle && (
            <p
              className="chartcard__sub"
              style={
                cardOverride
                  ? { color: "rgba(255, 255, 255, 0.75)" }
                  : undefined
              }
            >
              {subtitle}
            </p>
          )}
        </div>
        {analysis && (
          <button
            className="tabbtn"
            onClick={onOpenAnalysis}
            style={{
              padding: "6px 12px",
              fontSize: "11.5px",
              fontWeight: 600,
              borderRadius: "8px",
              background: cardOverride
                ? "rgba(255, 255, 255, 0.2)"
                : "rgba(99, 91, 255, 0.12)",
              border: cardOverride
                ? "1px solid rgba(255, 255, 255, 0.3)"
                : "1px solid rgba(99, 91, 255, 0.3)",
              color: cardOverride ? "#ffffff" : "var(--accent-a)",
              cursor: "pointer",
              transition: "background 0.15s, transform 0.1s",
            }}
          >
            ✦ Analysis
          </button>
        )}
      </div>
      <div className="chartcard__body">{children}</div>
      {insight && (
        <p
          className="chartcard__insight"
          style={
            cardOverride
              ? {
                  color: "rgba(255, 255, 255, 0.85)",
                  borderTopColor: "rgba(255, 255, 255, 0.15)",
                }
              : undefined
          }
        >
          <Rich text={insight} />
        </p>
      )}
    </div>
  );
}

// ── Background video hook ──
function pickBestFile(videoFiles = []) {
  const mp4 = videoFiles
    .filter((f) => f.file_type === "video/mp4" && f.width <= 1920)
    .sort((a, b) => b.width - a.width);
  return mp4[0]?.link ?? null;
}

function usePexelsVideo(session) {
  const [bgVideoSrc, setBgVideoSrc] = useState();
  const [pexelsVideos, setPexelsVideos] = useState([]);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const fetchPexelsVideos = async (brandKeyword) => {
      const apiKey = import.meta.env.VITE_PEXELS_API_KEY;
      if (!apiKey) {
        console.warn("[usePexelsVideo] VITE_PEXELS_API_KEY not set in .env");
        return;
      }

      const cleanQuery = (brandKeyword || "business technology")
        .replace(/['"’]/g, "")
        .trim();
      const pexelsBase = import.meta.env.DEV
        ? "/api-pexels"
        : "https://api.pexels.com";
      try {
        const res = await fetch(
          `${pexelsBase}/videos/search?query=${encodeURIComponent(cleanQuery)}&per_page=6&orientation=landscape&locale=en-US`,
          {
            headers: { Authorization: apiKey },
          },
        );
        if (!res.ok) throw new Error("Pexels API request failed");
        const data = await res.json();
        const urls = (data.videos || [])
          .map((v) => pickBestFile(v.video_files))
          .filter(Boolean);
        setPexelsVideos(urls);
        if (urls[0]) setBgVideoSrc(urls[0]);
      } catch (err) {
        console.error("[usePexelsVideo] failed:", err);
      }
    };

    const brand = session?.workflow?.nodes?.find((n) => n.type === "data")?.data
      ?.brandKeywords?.[0];
    fetchPexelsVideos(brand);
  }, [session]);

  return { bgVideoSrc, pexelsVideos };
}

import { useOnBackHandler } from "../utils/useOnBackHandler.js";

export default function PRImpactScreen({
  project,
  session,
  chartsData,
  chartsLoading = false,
  chartsError = "",
  onBack,
}) {
  useOnBackHandler(onBack);
  console.log({ chartsData });

  const [tab, setTab] = useState("Overview");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMarkdown, setModalMarkdown] = useState("");
  const LAYOUT_TO_TEMPLATE_MODE = useMemo(
    () => ({
      Classic: "classic",
      Editorial: "editorial",
      Merger: "merger",
      "PR Impact": "impact",
      Glass: "glass",
      Bento: "bento",
      Sense: "sense",
    }),
    [],
  );

  const [templateMode, setTemplateMode] = useState(() => {
    const stored = localStorage.getItem("dashboard_template_mode");
    if (stored && stored !== "gallery") return stored;
    const wf = session?.workflow;
    if (wf && Array.isArray(wf.nodes)) {
      const assemblyNode = wf.nodes.find((n) => n.type === "assembly");
      const layout = assemblyNode?.data?.layout;
      if (layout && LAYOUT_TO_TEMPLATE_MODE[layout]) {
        return LAYOUT_TO_TEMPLATE_MODE[layout];
      }
    }
    return "sense";
  });

  useEffect(() => {
    const syncTemplateMode = () => {
      const stored = localStorage.getItem("dashboard_template_mode");
      if (stored && stored !== "gallery") {
        setTemplateMode(stored);
      } else {
        const wf = session?.workflow;
        if (wf && Array.isArray(wf.nodes)) {
          const assemblyNode = wf.nodes.find((n) => n.type === "assembly");
          const layout = assemblyNode?.data?.layout;
          if (layout && LAYOUT_TO_TEMPLATE_MODE[layout]) {
            const mapped = LAYOUT_TO_TEMPLATE_MODE[layout];
            setTemplateMode(mapped);
            localStorage.setItem("dashboard_template_mode", mapped);
          }
        }
      }
    };

    syncTemplateMode();
    window.addEventListener("storage", syncTemplateMode);
    return () => {
      window.removeEventListener("storage", syncTemplateMode);
    };
  }, [session, LAYOUT_TO_TEMPLATE_MODE]);

  const toggleTemplateMode = (mode) => {
    setTemplateMode(mode);
    localStorage.setItem("dashboard_template_mode", mode);
    window.dispatchEvent(new Event("storage"));
  };

  const [agentDynamicCharts, setAgentDynamicCharts] = useState([]);

  const dynamicCharts = useMemo(() => {
    const fromBackend =
      chartsData?.dynamic_charts ||
      chartsData?.pr_impact_dynamic_charts ||
      chartsData?.custom_charts ||
      [];
    const list = [
      ...agentDynamicCharts,
      ...(Array.isArray(fromBackend) ? fromBackend : []),
    ];
    const seen = new Set();
    return list.filter((c) => {
      const key = c?.chart_id || c?.title;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [chartsData, agentDynamicCharts]);

  function handleAgentCharts(charts) {
    setAgentDynamicCharts((prev) => [...charts, ...prev]);
    setTab("Dynamic Charts");
  }

  const byId = useMemo(() => {
    const arr = chartsData?.[DASHBOARD_KEY];
    const out = {};
    if (Array.isArray(arr))
      arr.forEach((c) => {
        if (c?.chart_id) out[c.chart_id] = c;
      });
    return out;
  }, [chartsData]);

  const insights = chartsData?.chart_insights || {};
  const overall = chartsData?.[`${DASHBOARD_KEY}_overall_summary`] || "";
  const chapters = chartsData?.storyboards?.[DASHBOARD_KEY] || [];
  const chapterFor = (name) =>
    chapters.find((c) => c.tab_name?.toLowerCase() === name.toLowerCase());

  const TABS = useMemo(() => {
    let base = [];
    if (chapters.length > 0) {
      base = chapters.map((c) => c.tab_name || `Chapter ${c.chapter}`);
    } else {
      base = Object.keys(TAB_HERO);
    }
    if (dynamicCharts.length > 0 && !base.includes("Dynamic Charts")) {
      return [...base, "Dynamic Charts"];
    }
    return base;
  }, [chapters, dynamicCharts]);

  useEffect(() => {
    if (TABS.length > 0 && !TABS.includes(tab)) {
      setTab(TABS[0]);
    }
  }, [TABS, tab]);

  useEffect(() => {
    const selectors = [
      ".t7-content",
      '[data-dashboard-template="sense"] .t7-content',
      '[data-dashboard-template="merger"] .content-area',
      ".content-area",
    ];
    selectors.forEach((sel) => {
      const area = document.querySelector(sel);
      if (area && typeof area.scrollTo === "function") {
        area.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [tab]);

  const ins = (id) => getInsightObj(insights, id)?.insight || "";
  const dateIns = (id) => getInsightObj(insights, id)?.date_insights || [];
  const analysisOf = (id) => getInsightObj(insights, id)?.analysis || "";

  const totalCount = byId.total_count?.data?.total_count ?? 0;
  const totalReach = byId.total_reach?.data?.total_reach ?? 0;
  const sentiment = byId.sentiment_distribution;
  const coverage = byId.datewise_coverage;
  const shareOfVoice = byId.share_of_voice;

  const posPct = useMemo(() => {
    const s = sentiment?.data;
    const pos = s?.POS?.count || 0;
    const denom =
      totalCount ||
      (s?.POS?.count || 0) + (s?.NEG?.count || 0) + (s?.NEU?.count || 0);
    return denom ? Math.round((pos / denom) * 100) : 0;
  }, [sentiment, totalCount]);

  const heroFor = (name) => {
    if (name === "Overview") {
      const ch = chapterFor("Overview");
      return {
        kicker: `PR Impact · ${ch?.section_label || TAB_HERO.Overview.label}`,
        lead: `${nf(totalCount)} articles.`,
        em: `${posPct}% ran positive.`,
        sub: ch?.description || TAB_HERO.Overview.sub,
      };
    }
    const ch = chapterFor(name);
    if (ch && (ch.title || ch.description)) {
      const { lead, em } = splitHeadline(ch.title);
      return {
        kicker: `PR Impact · ${ch.section_label || TAB_HERO[name]?.label || name}`,
        lead: lead || TAB_HERO[name]?.lead || name,
        em: em || TAB_HERO[name]?.em || "",
        sub: ch.description || TAB_HERO[name]?.sub || "",
      };
    }
    const f = TAB_HERO[name] || { label: name, lead: name, em: "", sub: "" };
    return {
      kicker: `PR Impact · ${f.label}`,
      lead: f.lead,
      em: f.em,
      sub: f.sub,
    };
  };

  const hero = heroFor(tab);
  const { bgVideoSrc, pexelsVideos } = usePexelsVideo(session);

  const activeVideoSrc = useMemo(() => {
    if (!pexelsVideos || pexelsVideos.length === 0) return bgVideoSrc || null;
    const tabIndex = TABS.indexOf(tab);
    if (tabIndex === -1) return pexelsVideos[0];
    return pexelsVideos[tabIndex % pexelsVideos.length];
  }, [pexelsVideos, TABS, tab, bgVideoSrc]);

  const stats = useMemo(
    () => [
      { n: nf(totalCount), l: "Total articles" },
      { n: compact(totalReach), l: "Total reach" },
      { n: sentiment?.data?.net_sentiment_score ?? "—", l: "Net sentiment" },
    ],
    [totalCount, totalReach, sentiment],
  );

  const openAnalysis = (chartId, title) => {
    setModalTitle(title);
    setModalMarkdown(analysisOf(chartId));
    setModalOpen(true);
  };

  // Merge PR Impact and Competitor data into a single Line chart structure
  const mergedPRImpactChart = useMemo(() => {
    // Main brand + N competitors, each rendered as an activity tick strip.
    const main = byId.pr_impact?.data;
    const competitors = Array.isArray(byId.pr_impact_competitors?.data)
      ? byId.pr_impact_competitors.data
      : [];

    const brands = [];
    if (main) {
      brands.push({
        brand_name: main.brand_name || project?.name || "Brand",
        score: main.gauge,
        rating_scale: main.rating_scale,
        data: main.data || [],
      });
    }
    competitors.forEach((c) => {
      if (!c) return;
      brands.push({
        brand_name: c.brand_name,
        score: c.gauge,
        rating_scale: c.rating_scale,
        data: c.data || [],
      });
    });

    return {
      chart_id: "pr_comparison",
      chart_type: "pr_comparison",
      brands,
      title: "PR Comparison",
      description: "Brand performance vs competitor",
    };
  }, [byId, project]);

  if (chartsLoading)
    return (
      <div className="state">
        <p>Loading briefing charts…</p>
      </div>
    );
  if (chartsError)
    return (
      <div className="state">
        <p>{chartsError}</p>
      </div>
    );

  return (
    <>
      <GlobalChartDefs />
      {onBack && templateMode === "classic" && (
        <div
          style={{
            position: "relative",
            zIndex: 1000,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding:
              templateMode === "merger" ? "14px 28px 14px 296px" : "14px 28px",
            background:
              templateMode === "editorial" || templateMode === "merger"
                ? "var(--wine-page-bg)"
                : "none",
            borderBottom:
              templateMode === "editorial" || templateMode === "merger"
                ? "1px solid var(--wine-border-light)"
                : "none",
            marginBottom:
              templateMode === "editorial" || templateMode === "merger"
                ? 0
                : -50,
          }}
        >
          <button
            onClick={onBack}
            style={{
              background:
                templateMode === "editorial" || templateMode === "merger"
                  ? "#fff"
                  : "rgba(0, 0, 0, 1)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border:
                templateMode === "editorial" || templateMode === "merger"
                  ? "1px solid var(--wine-border)"
                  : "1px solid rgba(255,255,255,0.15)",
              color:
                templateMode === "editorial" || templateMode === "merger"
                  ? "var(--wine-primary)"
                  : "rgba(255, 255, 255, 0.8)",
              borderRadius: 20,
              padding: "6px 14px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontFamily: "Inter, SF Pro Display, sans-serif",
              transition: "background 0.2s, color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background =
                templateMode === "editorial" || templateMode === "merger"
                  ? "var(--wine-border-light)"
                  : "rgba(255,255,255,0.16)";
              e.currentTarget.style.color =
                templateMode === "editorial" || templateMode === "merger"
                  ? "var(--wine-primary)"
                  : "#fff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background =
                templateMode === "editorial" || templateMode === "merger"
                  ? "#fff"
                  : "rgba(0, 0, 0, 1)";
              e.currentTarget.style.color =
                templateMode === "editorial" || templateMode === "merger"
                  ? "var(--wine-primary)"
                  : "rgba(255,255,255,0.8)";
            }}
          >
            ← Back to dashboards
          </button>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              className={`template-mode-btn ${templateMode === "classic" ? "active" : ""}`}
              onClick={() => toggleTemplateMode("classic")}
              style={{
                background:
                  templateMode === "editorial" || templateMode === "merger"
                    ? templateMode === "classic"
                      ? "var(--wine-primary)"
                      : "#fff"
                    : undefined,
                color:
                  templateMode === "editorial" || templateMode === "merger"
                    ? templateMode === "classic"
                      ? "#fff"
                      : "#1C2B3A"
                    : undefined,
                borderColor:
                  templateMode === "editorial" || templateMode === "merger"
                    ? "var(--wine-border)"
                    : undefined,
              }}
            >
              <span className="tmb-dot" /> Classic
            </button>
            <button
              className={`template-mode-btn ${templateMode === "editorial" ? "active" : ""}`}
              onClick={() => toggleTemplateMode("editorial")}
              style={{
                background:
                  templateMode === "editorial" || templateMode === "merger"
                    ? templateMode === "editorial"
                      ? "var(--wine-primary)"
                      : "#fff"
                    : undefined,
                color:
                  templateMode === "editorial" || templateMode === "merger"
                    ? templateMode === "editorial"
                      ? "#fff"
                      : "#1C2B3A"
                    : undefined,
                borderColor:
                  templateMode === "editorial" || templateMode === "merger"
                    ? "var(--wine-border)"
                    : undefined,
              }}
            >
              <span className="tmb-dot" /> Editorial
            </button>
            <button
              className={`template-mode-btn ${templateMode === "merger" ? "active" : ""}`}
              onClick={() => toggleTemplateMode("merger")}
              style={{
                background:
                  templateMode === "editorial" || templateMode === "merger"
                    ? templateMode === "merger"
                      ? "var(--wine-primary)"
                      : "#fff"
                    : undefined,
                color:
                  templateMode === "editorial" || templateMode === "merger"
                    ? templateMode === "merger"
                      ? "#fff"
                      : "#1C2B3A"
                    : undefined,
                borderColor:
                  templateMode === "editorial" || templateMode === "merger"
                    ? "var(--wine-border)"
                    : undefined,
              }}
            >
              <span className="tmb-dot" /> Merger
            </button>
            <button
              className={`template-mode-btn ${templateMode === "impact" ? "active" : ""}`}
              onClick={() => toggleTemplateMode("impact")}
            >
              <span className="tmb-dot" /> PR Impact
            </button>
            <button
              className={`template-mode-btn ${templateMode === "glass" ? "active" : ""}`}
              onClick={() => toggleTemplateMode("glass")}
            >
              <span className="tmb-dot" /> Glass
            </button>
            <button
              className={`template-mode-btn ${templateMode === "bento" ? "active" : ""}`}
              onClick={() => toggleTemplateMode("bento")}
            >
              <span className="tmb-dot" /> Bento
            </button>
            <button
              className={`template-mode-btn ${templateMode === "sense" ? "active" : ""}`}
              onClick={() => toggleTemplateMode("sense")}
            >
              <span className="tmb-dot" /> Sense
            </button>
          </div>
        </div>
      )}

      {templateMode === "sense" ? (
        <Template7
          templateMode={templateMode}
          onChangeTemplate={toggleTemplateMode}
          onBack={onBack}
          project={project}
          session={session}
          chartsData={chartsData}
          tab={tab}
          setTab={setTab}
          openAnalysis={openAnalysis}
          chapterFor={chapterFor}
          chapters={chapters}
          DASHBOARD_KEY={DASHBOARD_KEY}
          byId={byId}
          insights={insights}
          overall={overall}
          ins={ins}
          dateIns={dateIns}
          analysisOf={analysisOf}
          totalCount={totalCount}
          totalReach={totalReach}
          sentiment={sentiment}
          coverage={coverage}
          shareOfVoice={shareOfVoice}
          activeVideoSrc={activeVideoSrc}
          hero={hero}
          TABS={TABS}
          stats={stats}
          mergedPRImpactChart={mergedPRImpactChart}
        />
      ) : templateMode === "bento" ? (
        <Template6
          templateMode={templateMode}
          onChangeTemplate={toggleTemplateMode}
          onBack={onBack}
          project={project}
          session={session}
          tab={tab}
          setTab={setTab}
          openAnalysis={openAnalysis}
          chapterFor={chapterFor}
          chapters={chapters}
          DASHBOARD_KEY={DASHBOARD_KEY}
          byId={byId}
          insights={insights}
          overall={overall}
          ins={ins}
          dateIns={dateIns}
          analysisOf={analysisOf}
          totalCount={totalCount}
          totalReach={totalReach}
          sentiment={sentiment}
          coverage={coverage}
          shareOfVoice={shareOfVoice}
          activeVideoSrc={activeVideoSrc}
          hero={hero}
          TABS={TABS}
          stats={stats}
          mergedPRImpactChart={mergedPRImpactChart}
        />
      ) : templateMode === "glass" ? (
        <Template5
          templateMode={templateMode}
          onChangeTemplate={toggleTemplateMode}
          onBack={onBack}
          project={project}
          session={session}
          tab={tab}
          setTab={setTab}
          openAnalysis={openAnalysis}
          chapterFor={chapterFor}
          chapters={chapters}
          DASHBOARD_KEY={DASHBOARD_KEY}
          byId={byId}
          insights={insights}
          overall={overall}
          ins={ins}
          dateIns={dateIns}
          analysisOf={analysisOf}
          totalCount={totalCount}
          totalReach={totalReach}
          sentiment={sentiment}
          coverage={coverage}
          shareOfVoice={shareOfVoice}
          activeVideoSrc={activeVideoSrc}
          hero={hero}
          TABS={TABS}
          stats={stats}
          mergedPRImpactChart={mergedPRImpactChart}
        />
      ) : templateMode === "impact" ? (
        <Template4
          templateMode={templateMode}
          onChangeTemplate={toggleTemplateMode}
          onBack={onBack}
          project={project}
          session={session}
          tab={tab}
          setTab={setTab}
          openAnalysis={openAnalysis}
          chapterFor={chapterFor}
          chapters={chapters}
          DASHBOARD_KEY={DASHBOARD_KEY}
          byId={byId}
          insights={insights}
          overall={overall}
          ins={ins}
          dateIns={dateIns}
          analysisOf={analysisOf}
          totalCount={totalCount}
          totalReach={totalReach}
          sentiment={sentiment}
          coverage={coverage}
          shareOfVoice={shareOfVoice}
          activeVideoSrc={activeVideoSrc}
          hero={hero}
          TABS={TABS}
          stats={stats}
          mergedPRImpactChart={mergedPRImpactChart}
        />
      ) : templateMode === "editorial" ? (
        <Template2
          templateMode={templateMode}
          onChangeTemplate={toggleTemplateMode}
          onBack={onBack}
          project={project}
          session={session}
          tab={tab}
          setTab={setTab}
          openAnalysis={openAnalysis}
          chapterFor={chapterFor}
          chapters={chapters}
          DASHBOARD_KEY={DASHBOARD_KEY}
          byId={byId}
          insights={insights}
          overall={overall}
          ins={ins}
          dateIns={dateIns}
          analysisOf={analysisOf}
          totalCount={totalCount}
          totalReach={totalReach}
          sentiment={sentiment}
          coverage={coverage}
          shareOfVoice={shareOfVoice}
          activeVideoSrc={activeVideoSrc}
          hero={hero}
          TABS={TABS}
          stats={stats}
          mergedPRImpactChart={mergedPRImpactChart}
        />
      ) : templateMode === "merger" ? (
        <Template3
          templateMode={templateMode}
          onChangeTemplate={toggleTemplateMode}
          onBack={onBack}
          project={project}
          session={session}
          tab={tab}
          setTab={setTab}
          openAnalysis={openAnalysis}
          chapterFor={chapterFor}
          chapters={chapters}
          DASHBOARD_KEY={DASHBOARD_KEY}
          byId={byId}
          insights={insights}
          overall={overall}
          ins={ins}
          dateIns={dateIns}
          analysisOf={analysisOf}
          totalCount={totalCount}
          totalReach={totalReach}
          sentiment={sentiment}
          coverage={coverage}
          shareOfVoice={shareOfVoice}
          activeVideoSrc={activeVideoSrc}
          hero={hero}
          TABS={TABS}
          stats={stats}
          mergedPRImpactChart={mergedPRImpactChart}
        />
      ) : (
        <Template1
          project={project}
          session={session}
          tab={tab}
          setTab={setTab}
          openAnalysis={openAnalysis}
          chapterFor={chapterFor}
          chapters={chapters}
          DASHBOARD_KEY={DASHBOARD_KEY}
          byId={byId}
          insights={insights}
          overall={overall}
          ins={ins}
          dateIns={dateIns}
          analysisOf={analysisOf}
          totalCount={totalCount}
          totalReach={totalReach}
          sentiment={sentiment}
          coverage={coverage}
          shareOfVoice={shareOfVoice}
          activeVideoSrc={activeVideoSrc}
          hero={hero}
          TABS={TABS}
          stats={stats}
          mergedPRImpactChart={mergedPRImpactChart}
        />
      )}

      <AnalysisModal
        open={modalOpen}
        title={modalTitle}
        markdown={modalMarkdown}
        onClose={() => setModalOpen(false)}
      />

      <ChatDock
        sessionId={session?.id}
        mode="route"
        onCharts={handleAgentCharts}
        chartsData={chartsData}
        dashboardKey="pr_impact"
        project={project}
        session={session}
      />
    </>
  );
}
