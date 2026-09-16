import { useEffect, useMemo, useRef, useState } from "react";
import { Rich, getInsightObj } from "../utils/text.jsx";
import ChatDock from "../components/ChatDock.jsx";
import AnalysisModal from "../components/AnalysisModal.jsx";
import {
  DynamicChartRenderer,
  Empty,
  GlobalChartDefs,
} from "../components/CustomChartWidgets.jsx";
import { StoryboardPanel, WhatsNext } from "../components/StoryboardPanel.jsx";
import Template1 from "../dashboards/reputation_index/Template1.jsx";
import Template2 from "../dashboards/reputation_index/Template2.jsx";
import Template3 from "../dashboards/reputation_index/Template3.jsx";
import Template4 from "../dashboards/reputation_index/Template4.jsx";
import Template5 from "../dashboards/reputation_index/Template5.jsx";
import Template6 from "../dashboards/reputation_index/Template6.jsx";
import Template7 from "../dashboards/reputation_index/Template7.jsx";

const DASHBOARD_KEY = "reputation_index";

const TAB_HERO = {
  Overview: {
    label: "Reputation Overview",
    lead: "Corporate Reputation,",
    em: "quantified.",
    sub: "Aggregate index, weekly trend overlays, and active pillar scores.",
  },
  "Pillar Analysis": {
    label: "Pillar Analysis",
    lead: "The six drivers of reputation,",
    em: "ranked.",
    sub: "Examine scores for Trust, Value, Advocacy, Social, Brand, and Risk.",
  },
  "Trust & Sentiment": {
    label: "Trust & Sentiment",
    lead: "Deep-dive into Trust,",
    em: "and sentiment coverage.",
    sub: "Waterfall driver breakdown and historical sentiment counts.",
  },
  "Media Coverage": {
    label: "Media Coverage",
    lead: "How media reach and volume,",
    em: "affect score.",
    sub: "Share of voice, Tier 1 share, narrative theme counts, and heatmap mappings.",
  },
  "Risk & Sensitivity": {
    label: "Risk & Sensitivity",
    lead: "Predictive shifts and negative,",
    em: "risk alerts.",
    sub: "Sensitivity tornado charts, negative coverage rates, and pillar area weights.",
  },
};

function splitHeadline(title) {
  if (!title) return { lead: "", em: "" };
  const m = String(title).match(/^(.*?[.!?])\s+(.+)$/);
  return m ? { lead: m[1], em: m[2] } : { lead: title, em: "" };
}

const PILLARS_LIST = ["Trust", "Value", "Advocacy", "Social", "Brand", "Risk"];

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

export default function ReputationScreen({
  project,
  session,
  chartsData,
  chartsLoading = false,
  chartsError = "",
  onBack,
}) {
  useOnBackHandler(onBack);
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
      chartsData?.reputation_index_dynamic_charts ||
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

  const riGauge = byId.ri_gauge?.data || {};

  const heroFor = (name) => {
    if (name === "Overview") {
      const ch = chapterFor("Overview");
      return {
        kicker: `Reputation Index · ${ch?.section_label || TAB_HERO.Overview.label}`,
        lead: `Reputation Index at ${riGauge.value ?? "—"}.`,
        em: `Delta: ${riGauge.delta > 0 ? `+${riGauge.delta}` : (riGauge.delta ?? "—")}.`,
        sub: ch?.description || TAB_HERO.Overview.sub,
      };
    }
    const ch = chapterFor(name);
    if (ch && (ch.title || ch.description)) {
      const { lead, em } = splitHeadline(ch.title);
      return {
        kicker: `Reputation Index · ${ch.section_label || TAB_HERO[name]?.label || name}`,
        lead: lead || TAB_HERO[name]?.lead || name,
        em: em || TAB_HERO[name]?.em || "",
        sub: ch.description || TAB_HERO[name]?.sub || "",
      };
    }
    const f = TAB_HERO[name] || { label: name, lead: name, em: "", sub: "" };
    return {
      kicker: `Reputation Index · ${f.label}`,
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
      { n: riGauge.value ? String(riGauge.value) : "—", l: "Reputation Index" },
      {
        n: riGauge.delta
          ? riGauge.delta > 0
            ? `+${riGauge.delta}`
            : String(riGauge.delta)
          : "—",
        l: "Delta vs Prior",
      },
      {
        n: riGauge.band ? String(riGauge.band).toUpperCase() : "—",
        l: "Risk Band",
      },
    ],
    [riGauge],
  );

  const openAnalysis = (chartId, title) => {
    setModalTitle(title);
    setModalMarkdown(analysisOf(chartId));
    setModalOpen(true);
  };

  // ── Format ri_timeseries data ──
  const formattedTimeseriesChart = useMemo(() => {
    const chart = byId.ri_timeseries;
    if (!chart) return null;
    const riItem = (chart.data || []).find((d) => d.name === "RI")?.data || {};
    const maItem =
      (chart.data || []).find((d) => d.name === "3-period MA")?.data || {};
    const dates = Array.from(
      new Set([...Object.keys(riItem), ...Object.keys(maItem)]),
    );
    const rows = dates
      .map((date) => ({
        date,
        RI: riItem[date],
        "3-period MA": maItem[date],
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
    return {
      ...chart,
      data: rows,
      series: ["RI", "3-period MA"],
    };
  }, [byId]);

  // ── Format ri_decomposition_coverage data (stacked area) ──
  const formattedDecompositionChart = useMemo(() => {
    const chart = byId.ri_decomposition_coverage;
    if (!chart) return null;
    const list = chart.data || [];
    const out = {};
    list.forEach((series) => {
      const name = series.name;
      Object.entries(series.data || {}).forEach(([date, val]) => {
        if (!out[date]) out[date] = { date };
        out[date][name] = val;
      });
    });
    const rows = Object.values(out).sort((a, b) =>
      a.date.localeCompare(b.date),
    );
    return {
      ...chart,
      chart_type: "stacked_area",
      data: rows,
      series: PILLARS_LIST,
    };
  }, [byId]);

  // ── Format pillar_small_multiples data ──
  const formattedSmallMultiplesChart = useMemo(() => {
    const chart = byId.pillar_small_multiples;
    if (!chart) return null;
    const list = chart.data || [];
    const out = {};
    list.forEach((series) => {
      const name = series.name;
      Object.entries(series.data || {}).forEach(([date, val]) => {
        if (!out[date]) out[date] = { date };
        out[date][name] = val;
      });
    });
    const rows = Object.values(out).sort((a, b) =>
      a.date.localeCompare(b.date),
    );
    return {
      ...chart,
      data: rows,
      series: PILLARS_LIST,
    };
  }, [byId]);

  // ── Format sentiment_coverage data (stacked bar) ──
  const formattedSentimentCoverageChart = useMemo(() => {
    const chart = byId.sentiment_coverage;
    if (!chart) return null;
    return {
      ...chart,
      chart_type: "stacked_bar",
      series: ["POS", "NEU", "NEG"],
    };
  }, [byId]);

  // ── Format net_sentiment_coverage (object) to line array ──
  const formattedNetSentimentChart = useMemo(() => {
    const chart = byId.net_sentiment_coverage;
    if (!chart) return null;
    const dataObj = chart.data || {};
    const rows = Object.entries(dataObj)
      .map(([date, val]) => ({
        date,
        net_sentiment: val,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
    return {
      ...chart,
      data: rows,
      series: ["net_sentiment"],
    };
  }, [byId]);

  // ── Format tier1_share data ──
  const formattedTier1ShareChart = useMemo(() => {
    const chart = byId.tier1_share;
    if (!chart) return null;
    return {
      ...chart,
      chart_type: "stacked_bar",
      series: ["Tier 1", "Other"],
    };
  }, [byId]);

  // ── Format risk_negative_coverage data ──
  const formattedRiskNegativeChart = useMemo(() => {
    const chart = byId.risk_negative_coverage;
    if (!chart) return null;
    const dataObj = chart.data || {};
    const rows = Object.entries(dataObj)
      .map(([date, val]) => ({
        date,
        negative_rate: val,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
    return {
      ...chart,
      data: rows,
      series: ["negative_rate"],
    };
  }, [byId]);

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
          riGauge={riGauge}
          activeVideoSrc={activeVideoSrc}
          hero={hero}
          TABS={TABS}
          stats={stats}
          formattedTimeseriesChart={formattedTimeseriesChart}
          formattedDecompositionChart={formattedDecompositionChart}
          formattedSmallMultiplesChart={formattedSmallMultiplesChart}
          formattedSentimentCoverageChart={formattedSentimentCoverageChart}
          formattedNetSentimentChart={formattedNetSentimentChart}
          formattedTier1ShareChart={formattedTier1ShareChart}
          formattedRiskNegativeChart={formattedRiskNegativeChart}
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
          riGauge={riGauge}
          activeVideoSrc={activeVideoSrc}
          hero={hero}
          TABS={TABS}
          stats={stats}
          formattedTimeseriesChart={formattedTimeseriesChart}
          formattedDecompositionChart={formattedDecompositionChart}
          formattedSmallMultiplesChart={formattedSmallMultiplesChart}
          formattedSentimentCoverageChart={formattedSentimentCoverageChart}
          formattedNetSentimentChart={formattedNetSentimentChart}
          formattedTier1ShareChart={formattedTier1ShareChart}
          formattedRiskNegativeChart={formattedRiskNegativeChart}
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
          riGauge={riGauge}
          activeVideoSrc={activeVideoSrc}
          hero={hero}
          TABS={TABS}
          stats={stats}
          formattedTimeseriesChart={formattedTimeseriesChart}
          formattedDecompositionChart={formattedDecompositionChart}
          formattedSmallMultiplesChart={formattedSmallMultiplesChart}
          formattedSentimentCoverageChart={formattedSentimentCoverageChart}
          formattedNetSentimentChart={formattedNetSentimentChart}
          formattedTier1ShareChart={formattedTier1ShareChart}
          formattedRiskNegativeChart={formattedRiskNegativeChart}
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
          riGauge={riGauge}
          activeVideoSrc={activeVideoSrc}
          hero={hero}
          TABS={TABS}
          stats={stats}
          formattedTimeseriesChart={formattedTimeseriesChart}
          formattedDecompositionChart={formattedDecompositionChart}
          formattedSmallMultiplesChart={formattedSmallMultiplesChart}
          formattedSentimentCoverageChart={formattedSentimentCoverageChart}
          formattedNetSentimentChart={formattedNetSentimentChart}
          formattedTier1ShareChart={formattedTier1ShareChart}
          formattedRiskNegativeChart={formattedRiskNegativeChart}
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
          riGauge={riGauge}
          activeVideoSrc={activeVideoSrc}
          hero={hero}
          TABS={TABS}
          stats={stats}
          formattedTimeseriesChart={formattedTimeseriesChart}
          formattedDecompositionChart={formattedDecompositionChart}
          formattedSmallMultiplesChart={formattedSmallMultiplesChart}
          formattedSentimentCoverageChart={formattedSentimentCoverageChart}
          formattedNetSentimentChart={formattedNetSentimentChart}
          formattedTier1ShareChart={formattedTier1ShareChart}
          formattedRiskNegativeChart={formattedRiskNegativeChart}
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
          riGauge={riGauge}
          activeVideoSrc={activeVideoSrc}
          hero={hero}
          TABS={TABS}
          stats={stats}
          formattedTimeseriesChart={formattedTimeseriesChart}
          formattedDecompositionChart={formattedDecompositionChart}
          formattedSmallMultiplesChart={formattedSmallMultiplesChart}
          formattedSentimentCoverageChart={formattedSentimentCoverageChart}
          formattedNetSentimentChart={formattedNetSentimentChart}
          formattedTier1ShareChart={formattedTier1ShareChart}
          formattedRiskNegativeChart={formattedRiskNegativeChart}
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
          riGauge={riGauge}
          activeVideoSrc={activeVideoSrc}
          hero={hero}
          TABS={TABS}
          stats={stats}
          formattedTimeseriesChart={formattedTimeseriesChart}
          formattedDecompositionChart={formattedDecompositionChart}
          formattedSmallMultiplesChart={formattedSmallMultiplesChart}
          formattedSentimentCoverageChart={formattedSentimentCoverageChart}
          formattedNetSentimentChart={formattedNetSentimentChart}
          formattedTier1ShareChart={formattedTier1ShareChart}
          formattedRiskNegativeChart={formattedRiskNegativeChart}
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
        dashboardKey="reputation_index"
        project={project}
        session={session}
      />
    </>
  );
}
