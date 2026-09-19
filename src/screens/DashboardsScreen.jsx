import { useCallback, useEffect, useMemo, useState } from "react";
import HeroCanvas from "../components/HeroCanvas.jsx";
import { TILES, ArrowRightIcon, ArrowLeftIcon } from "../components/Icons.jsx";
import { SparklesIcon } from "../workflow/wfIcons.jsx";
import CanvasTabBar from "../components/canvas/CanvasTabBar.jsx";
import ChatDock from "../components/ChatDock.jsx";
import { useNavigate } from "react-router-dom";
import { paths } from "../router/nav.js";
import { TIER1_LENSES, TIER2_LENSES } from "../workflow/tierLensData.js";
import {
  CI_LENS_KEYS,
  MI_LENS_KEYS,
  COMING_SOON_TIER1,
} from "../api/consumerIntelligence.js";
import logoImg from "../assets/images/image.png";
import monitoringImg from "../assets/images/monitoringImage.png";
import mediaMeasurementImg from "../assets/images/mediaMeasurement.png";
import narrativeImage from "../assets/images/narrativeImage.png";

// Card artwork for dashboards without a bundled photo. Same Unsplash crop the
// Tier-1 lens gallery (tierLensData.js) already uses, so these IDs are known to
// resolve; CardArt falls back to the drawn placeholder if one ever fails.
const IMG = (id) => `https://images.unsplash.com/photo-${id}?w=480&h=220&fit=crop&auto=format`;
const CARD_IMAGES = {
  pr_impact: IMG("1504711434969-e33886168f5c"),          // newspapers / press
  reputation_index: IMG("1521791136064-7986c2920216"),   // handshake / trust
  trend_intelligence: IMG("1551288049-bebda4e38f71"),    // analytics dashboard
};
import { OrbSettingsProvider } from "../components/builder/orb-settings";
import { SenseOrb } from "../components/builder/sense-orb";
import { useOnBackHandler } from "../utils/useOnBackHandler.js";

import { cn } from "../lib/utils";
import {
  bumpIdSeq,
  hasSavedGraph,
  restoreNodes,
  seedNodes,
} from "../workflow/workflowUtils.js";

// Tier 1 CI pillars by key, for the session-derived CI cards below.
const TIER1_BY_KEY = Object.fromEntries(TIER1_LENSES.map((l) => [l.key, l]));

const LockIcon = ({ width = 16, height = 16, ...p }) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...p}
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const DASHBOARDS = [
  {
    key: "media_monitoring",
    title: "Daily Monitoring",
    image: monitoringImg,
    tile: 0,
    badge: "Live · Day by day",
    live: true,
    viz: "line",
    desc: "Pick any day or range on the calendar and generate an on-demand report — every article, sectioned and sentiment-scored.",
    cta: "monitoring",
    statV: "92.7",
    statL: "Impact index",
  },
  {
    key: "media_measurement",
    title: "Media Measurement",
    image: mediaMeasurementImg,
    tile: 1,
    badge: "5-chapter story",
    viz: "bars",
    desc: "An executive walk-through of the period — its overall shape, themes, voices, risks and the board narrative.",
    cta: "measurement",
    statV: "35",
    statL: "Total Articles",
  },
  {
    key: "narrative_intelligence",
    title: "Narrative Intelligence",
    image: narrativeImage,
    tile: 2,
    badge: "Signals",
    viz: "bars",
    desc: "Track the active narratives shaping perception and how they gain or lose momentum across the window.",
    cta: "narratives",
    statV: "17",
    statL: "Active narratives",
  },
  {
    key: "pr_impact",
    title: "PR Impact",
    image: CARD_IMAGES.pr_impact,
    tile: 3,
    badge: "Impact",
    viz: "line",
    desc: "Quantify the impact of your PR efforts — reach, resonance and share of the conversation.",
    cta: "PR impact",
    statV: "$4.2M",
    statL: "EMV this month",
  },
  {
    key: "reputation_index",
    title: "Reputation Index",
    image: CARD_IMAGES.reputation_index,
    tile: 4,
    badge: "Score",
    viz: "line",
    desc: "A single composite score for reputation, tracked over time and broken down by its drivers.",
    cta: "reputation",
    statV: "78.4",
    statL: "Reputation score",
  },
];

function CardArt({ image, type, accent }) {
  const [failed, setFailed] = useState(false);
  if (image && !failed) {
    // Bundled PNGs are cut-outs and sit on the gradient (contain); remote
    // photos fill the frame (cover).
    const cover = /^https?:/.test(image);
    return (
      <img
        src={image}
        alt=""
        className={`lc-top-photo${cover ? " lc-top-photo--cover" : ""}`}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    );
  }
  return <EcardArt type={type} accent={accent} />;
}

function EcardArt({ type, accent }) {
  if (type === "bars") {
    return (
      <svg
        className="ecard__art"
        viewBox="0 0 400 280"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        aria-hidden="true"
      >
        <g opacity=".5">
          <rect x="58" y="150" width="36" height="92" rx="5" fill={accent} />
          <rect
            x="110"
            y="112"
            width="36"
            height="130"
            rx="5"
            fill={accent}
            opacity=".7"
          />
          <rect
            x="162"
            y="70"
            width="36"
            height="172"
            rx="5"
            fill="#ffffff"
            opacity=".85"
          />
          <rect x="214" y="128" width="36" height="114" rx="5" fill={accent} />
          <rect
            x="266"
            y="96"
            width="36"
            height="146"
            rx="5"
            fill={accent}
            opacity=".7"
          />
        </g>
        <polyline
          points="76,150 128,112 180,70 232,128 284,96"
          stroke="#fff"
          strokeWidth="1.6"
          fill="none"
          opacity=".7"
        />
        {[
          [76, 150],
          [128, 112],
          [180, 70],
          [232, 128],
          [284, 96],
        ].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="3.5" fill="#fff" />
        ))}
      </svg>
    );
  }
  return (
    <svg
      className="ecard__art"
      viewBox="0 0 400 280"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      aria-hidden="true"
    >
      <g stroke="#ffffff" strokeWidth="1.4" opacity=".22">
        <line x1="40" y1="58" x2="360" y2="58" />
        <line x1="40" y1="96" x2="300" y2="96" />
        <line x1="40" y1="134" x2="344" y2="134" />
        <line x1="40" y1="172" x2="276" y2="172" />
      </g>
      <polyline
        points="14,232 70,232 96,198 122,252 152,176 182,238 212,230 400,230"
        stroke={accent}
        strokeWidth="2.6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="152" cy="176" r="4.5" fill="#ffffff" />
    </svg>
  );
}

function pickNumber(data) {
  if (typeof data === "number") return data;
  if (data && typeof data === "object") {
    for (const k of [
      "value",
      "score",
      "count",
      "total",
      "total_count",
      "index",
      "current",
    ]) {
      if (typeof data[k] === "number") return data[k];
    }
  }
  return null;
}

function findChart(arr, ...idParts) {
  if (!Array.isArray(arr)) return null;
  return (
    arr.find(
      (c) => c?.chart_id && idParts.some((p) => c.chart_id.includes(p)),
    ) || null
  );
}

function nf(n) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}

export default function DashboardsScreen({
  project,
  session,
  chartsData,
  onOpenDashboard,
  onBack,
}) {
  useOnBackHandler(onBack);
  const navigate = useNavigate();
  const [modalDashboard, setModalDashboard] = useState(null);

  const activeNodes = useMemo(() => {
    const wf = session?.workflow;
    if (hasSavedGraph(wf)) {
      return restoreNodes(wf);
    }
    return seedNodes(session);
  }, [session?.workflow, session]);

  const isLensAvailable = useCallback(
    (lensKey) => {
      if (Array.isArray(activeNodes)) {
        const hasNode = activeNodes.some(
          (n) => n.type === "analysis" && n.data?.lens === lensKey,
        );
        if (hasNode) return true;
      }
      if (chartsData && chartsData[lensKey]) {
        const d = chartsData[lensKey];
        if (Array.isArray(d) && d.length > 0) return true;
        if (typeof d === "object" && Object.keys(d).length > 0) return true;
      }
      return false;
    },
    [activeNodes, chartsData],
  );

  const handleCardClick = (d) => {
    if (isLensAvailable(d.key)) {
      onOpenDashboard?.(d.key, d.title);
    } else {
      setModalDashboard(d);
    }
  };

  // Consumer Intelligence cards — derived purely from the session's Analysis
  // nodes: one card per Tier 1 pillar (data.lensType === "tier1"), deduped by
  // key, plus one for a flat `trend_intelligence` lens. MI lenses are already
  // covered by the fixed DASHBOARDS list above and are skipped here.
  const ciCards = useMemo(() => {
    const seen = new Set();
    const list = [];
    (Array.isArray(activeNodes) ? activeNodes : [])
      .filter((n) => n.type === "analysis" && n.data?.lens)
      .forEach((n) => {
        const key = n.data.lens;
        if (seen.has(key) || MI_LENS_KEYS.includes(key)) return;
        const isTier1 = n.data?.lensType === "tier1" || !!TIER1_BY_KEY[key];
        if (isTier1) {
          const tier1 = TIER1_BY_KEY[key];
          if (!tier1) return;
          seen.add(key);
          const selectedTier2 = Array.isArray(n.data?.tier2) ? n.data.tier2 : [];
          const comingSoon = COMING_SOON_TIER1.includes(key);
          list.push({
            kind: "tier1",
            key,
            title: tier1.label,
            image: tier1.image,
            tile: 4,
            badge: comingSoon ? "Coming soon" : "Actionable Intelligence",
            viz: "line",
            desc: tier1.description,
            statV: String(selectedTier2.length),
            statL: `of ${(TIER2_LENSES[key] || []).length} sub-lenses selected`,
            selectedTier2,
            comingSoon,
          });
        } else if (CI_LENS_KEYS.includes(key)) {
          seen.add(key);
          list.push({
            kind: "ci",
            key,
            title:
              key === "trend_intelligence"
                ? "Trend Intelligence"
                : key.replace(/_/g, " "),
            image: CARD_IMAGES[key],
            tile: 5,
            badge: "Signals",
            viz: "bars",
            desc: "Emerging trends across the category conversation — what is rising, what is fading and who is driving each shift.",
            statV: chartsData?.[key] ? "Live" : "—",
            statL: "Trend storyboard",
            comingSoon: false,
          });
        }
      });
    return list;
  }, [activeNodes, chartsData]);

  const handleCiCardClick = (d) => {
    if (d.comingSoon) {
      setModalDashboard({ ...d, comingSoon: true });
      return;
    }
    if (d.kind === "tier1") {
      navigate(paths.intel(project?.id, session?.id, d.key), {
        state: {
          project,
          session,
          chartsData,
          selectedTier2: d.selectedTier2,
        },
      });
      return;
    }
    // Flat CI lens (trend_intelligence) — its own storyboard route.
    navigate(paths.trend(project?.id, session?.id), {
      state: { project, session, chartsData },
    });
  };

  const stats = useMemo(() => {
    const mm = chartsData?.media_measurement;
    const total = pickNumber(
      findChart(mm, "total_count", "total_article")?.data,
    );
    const monArr = chartsData?.media_monitoring;
    const sectionChart = Array.isArray(monArr)
      ? monArr.find((c) => c?.chart_id === "section_articles")
      : null;
    const sectionData = sectionChart?.data;
    const sectionCount =
      sectionData && typeof sectionData === "object"
        ? Object.keys(sectionData).length
        : 0;
    let monTotal = 0;
    if (sectionData && typeof sectionData === "object") {
      Object.values(sectionData).forEach((a) => {
        monTotal += Array.isArray(a) ? a.length : 0;
      });
    }
    let numOfNarrative = "";
    let prScore = "";
    let numOfReputation = "";
    if (chartsData?.top_narratives?.length > 0) {
      numOfNarrative = chartsData?.top_narratives?.length;
    }

    if (chartsData?.reputation_index?.length > 0) {
      numOfReputation = chartsData?.reputation_index?.find(
        (item) => item?.chart_id === "ri_gauge",
      )?.data?.value;
    }

    if (chartsData?.pr_impact?.length > 0) {
      prScore = chartsData?.pr_impact?.find(
        (item) => item?.chart_id === "pr_impact",
      )?.data?.gauge;
    }

    return {
      total: nf(total),
      monTotal: nf(monTotal),
      sectionCount: nf(sectionCount),
      numOfNarrative: nf(numOfNarrative),
      prScore: prScore,
      numOfReputation: nf(numOfReputation),
      list: [
        { n: nf(total ?? monTotal), l: "Articles analysed" },
        { n: nf(sectionCount), l: "Sections tracked" },
        { n: "5", l: "Dashboards" },
      ],
    };
  }, [chartsData]);

  const pName = project?.name || "Northwind Energy";
  const pMonogram = pName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <OrbSettingsProvider>
      <div
        className={cn("wf", "relative", "min-h-screen", "bg-transparent")}
        style={{ display: "flex", flexDirection: "column" }}
      >
        {/* Profile Gallery Background Frame */}
        <div
          className={cn(
            "fixed",
            "inset-0",
            "z-0",
            "overflow-hidden",
            "pointer-events-none",
          )}
        >
          <img
            src="/gallery-bg.jpg"
            alt=""
            className={cn(
              "absolute",
              "inset-0",
              "h-full",
              "w-full",
              "object-cover",
            )}
          />
          <img
            src="/gradient-bar.png"
            alt=""
            className={cn("absolute", "bottom-0", "left-0", "w-full", "z-[1]")}
          />
        </div>

        {/* Main Layer */}
        <div
          className={cn(
            "relative",
            "z-10",
            "flex",
            "min-h-screen",
            "flex-col",
            "overflow-y-auto",
            "p-4",
            "sm:p-6",
          )}
        >
          {/* Top Bar matching screenshot */}
          {/* <div
            className={cn(
              "flex",
              "h-12",
              "shrink-0",
              "items-center",
              "justify-between",
              "px-3",
              "pt-2",
            )}
          >
            <div
              className={cn(
                "flex",
                "items-center",
                "gap-2",
                "text-[13px]",
                "font-semibold",
                "text-slate-800",
                "tracking-tight",
              )}
            >
              <span
                className={cn(
                  "cursor-pointer",
                  "transition-opacity",
                  "hover:opacity-75",
                )}
                onClick={() => navigate("/")}
              >
                InfoVision Intelligence
              </span>
              <span className="text-slate-400">›</span>
              <span className={cn('inline-block', 'max-w-[120px]', 'xs:max-w-[180px]', 'sm:max-w-[240px]', 'md:max-w-[320px]', 'lg:max-w-[420px]', 'truncate', 'text-slate-700', 'align-bottom')}>
                {pName}
              </span>
            </div>
          </div> */}

          {/* Animated SenseOrb Hero matching screenshot */}
          <div
            className={cn(
              "flex",
              "flex-col",
              "items-center",
              "justify-center",
              "gap-4",
              "pt-10",
              "pb-6",
              "text-center",
            )}
          >
            <SenseOrb size={139} />
            <p
              className={cn(
                "text-[16px]",
                "font-medium",
                "text-slate-800",
                "tracking-tight",
              )}
            >
              Build dashboards, charts and ask questions
            </p>
            <button
              type="button"
              onClick={() => {
                const pId = project?.id || "tesla";
                const sId = session?.id || "demo";
                navigate(`/${pId}/sessions/${sId}/build`);
              }}
              className={cn(
                "flex",
                "items-center",
                "gap-2.5",
                "rounded-[8px]",
                "border",
                "border-white/[0.21]",
                "px-4",
                "py-2.5",
                "text-[13px]",
                "font-medium",
                "text-white",
                "transition-all",
                "hover:scale-[1.03]",
                "active:scale-[0.98]",
              )}
              style={{
                backgroundImage:
                  "linear-gradient(161.8deg, #B301FF 14.6%, #FF7E26 85.4%)",
                boxShadow: "0px 10px 24px 0px rgba(244,107,71,0.55)",
                cursor: "pointer",
              }}
            >
              <SparklesIcon width={18} height={18} />
              <span>Build with AI</span>
            </button>
          </div>

          {/* Project Title Badge Header */}
          <div
            className={cn(
              "mb-6",
              "flex",
              "items-center",
              "gap-3.5",
              "px-3",
              "pt-6",
            )}
          >
            <span
              className={cn(
                "flex",
                "size-11",
                "items-center",
                "justify-center",
                "rounded-xl",
                "bg-[#00897B]",
                "font-bold",
                "text-white",
                "text-sm",
                "shadow-xs",
              )}
            >
              {pMonogram}
            </span>
            <h2
              className={cn(
                "text-2xl",
                "font-bold",
                "tracking-tight",
                "text-slate-900",
              )}
            >
              {pName}
            </h2>
          </div>

          {/* Dashboards Cards Section (Kept Intact) */}
          <section className="choose">
            <div className="landing-card-grid">
              {DASHBOARDS.map((d) => {
                const { fg, Icon } = TILES[d.tile];
                const available = isLensAvailable(d.key);
                const statValue =
                  d.key === "media_monitoring"
                    ? stats.monTotal
                    : d.key === "media_measurement"
                      ? stats.total
                      : d.key === "narrative_intelligence"
                        ? stats?.numOfNarrative
                        : d.key === "reputation_index"
                          ? stats?.numOfReputation
                          : d.key === "pr_impact"
                            ? stats?.prScore
                            : "";
                return (
                  <button
                    key={d.key}
                    className={`lc ${!available ? "lc--locked" : ""}`}
                    style={{ "--lc-tint": fg }}
                    onClick={() => handleCardClick(d)}
                  >
                    <div className="lc-top">
                      <div className="lc-top-chart">
                        <CardArt image={d.image} type={d.viz} accent={fg} />
                      </div>

                      <div className="lc-top-badge">
                        <div className="lc-icon-wrap">
                          {available ? (
                            <Icon width={15} height={15} />
                          ) : (
                            <LockIcon width={15} height={15} />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="lc-bottom">
                      <h3 className="lc-title">{d.title}</h3>
                      <p className="lc-desc">{d.desc}</p>
                      <div className="lc-footer">
                        <div className="lc-stat-chip">
                          <span className="lc-stat-icon">
                            <Icon width={13} height={13} />
                          </span>
                          <div className="lc-stat-text">
                            <div className="lc-stat-val">{statValue}</div>
                            <div className="lc-stat-label">{d.statL}</div>
                          </div>
                        </div>
                        <div
                          className="lc-cta"
                          aria-label={available ? "Open dashboard" : "Locked"}
                        >
                          {available ? (
                            <ArrowRightIcon width={15} height={15} />
                          ) : (
                            <LockIcon width={14} height={14} />
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
              {ciCards.map((d) => {
                const { fg, Icon } = TILES[d.tile];
                const available = !d.comingSoon;
                return (
                  <button
                    key={`ci-${d.key}`}
                    className={`lc ${!available ? "lc--locked" : ""}`}
                    style={{ "--lc-tint": fg }}
                    onClick={() => handleCiCardClick(d)}
                  >
                    <div className="lc-top">
                      <div className="lc-top-chart">
                        <CardArt image={d.image} type={d.viz} accent={fg} />
                      </div>

                      <div className="lc-top-badge">
                        <div className="lc-icon-wrap">
                          {available ? (
                            <Icon width={15} height={15} />
                          ) : (
                            <LockIcon width={15} height={15} />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="lc-bottom">
                      <h3 className="lc-title">{d.title}</h3>
                      <p className="lc-desc">{d.desc}</p>
                      <div className="lc-footer">
                        <div className="lc-stat-chip">
                          <span className="lc-stat-icon">
                            <Icon width={13} height={13} />
                          </span>
                          <div className="lc-stat-text">
                            <div className="lc-stat-val">{d.statV}</div>
                            <div className="lc-stat-label">{d.statL}</div>
                          </div>
                        </div>
                        <div
                          className="lc-cta"
                          aria-label={available ? "Open dashboard" : "Coming soon"}
                        >
                          {available ? (
                            <ArrowRightIcon width={15} height={15} />
                          ) : (
                            <LockIcon width={14} height={14} />
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <ChatDock sessionId={session?.id} mode="inline" />

          {modalDashboard && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 9999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(15, 23, 42, 0.75)",
                backdropFilter: "blur(12px)",
                padding: "20px",
                animation: "fadeIn 0.2s ease-out",
              }}
              onMouseDown={() => setModalDashboard(null)}
            >
              <div
                style={{
                  width: "100%",
                  maxWidth: "480px",
                  backgroundColor: "#ffffff",
                  borderRadius: "24px",
                  border: "1px solid rgba(226, 232, 240, 0.8)",
                  boxShadow:
                    "0 25px 50px -12px rgba(15, 23, 42, 0.25), 0 0 30px rgba(99, 102, 241, 0.1)",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                  color: "#0f172a",
                }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div
                  style={{
                    padding: "24px 24px 18px 24px",
                    borderBottom: "1px solid #f1f5f9",
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: "16px",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "3px 10px",
                        borderRadius: "20px",
                        fontSize: "11px",
                        fontWeight: "700",
                        letterSpacing: "0.5px",
                        textTransform: "uppercase",
                        backgroundColor: "rgba(99, 102, 241, 0.1)",
                        color: "#4f46e5",
                        border: "1px solid rgba(99, 102, 241, 0.2)",
                        marginBottom: "8px",
                      }}
                    >
                      {modalDashboard.badge}
                    </span>
                    <h3
                      style={{
                        fontSize: "20px",
                        fontWeight: "700",
                        margin: 0,
                        color: "#0f172a",
                        lineHeight: "1.3",
                      }}
                    >
                      {modalDashboard.title}
                    </h3>
                  </div>

                  <button
                    onClick={() => setModalDashboard(null)}
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      backgroundColor: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#64748b",
                      fontSize: "16px",
                      fontWeight: "600",
                      cursor: "pointer",
                      flexShrink: 0,
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#f1f5f9";
                      e.currentTarget.style.color = "#0f172a";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#f8fafc";
                      e.currentTarget.style.color = "#64748b";
                    }}
                    aria-label="Close modal"
                  >
                    ✕
                  </button>
                </div>

                {/* Modal Body */}
                <div
                  style={{
                    padding: "20px 24px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                  }}
                >
                  <p
                    style={{
                      fontSize: "14px",
                      lineHeight: "1.6",
                      color: "#475569",
                      margin: 0,
                    }}
                  >
                    {modalDashboard.desc}
                  </p>

                  {/* Lock Warning Card */}
                  <div
                    style={{
                      padding: "14px 16px",
                      borderRadius: "14px",
                      backgroundColor: "#fffbeb",
                      border: "1px solid #fde68a",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "12px",
                    }}
                  >
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "10px",
                        backgroundColor: "#fef3c7",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#d97706",
                        flexShrink: 0,
                        marginTop: "2px",
                      }}
                    >
                      <LockIcon width={16} height={16} />
                    </div>
                    <div
                      style={{
                        fontSize: "13px",
                        lineHeight: "1.5",
                        color: "#92400e",
                      }}
                    >
                      {modalDashboard.comingSoon ? (
                        <>
                          <strong>Coming soon:</strong> This lens is not
                          available yet. Detailed analytics for it are on the
                          way.
                        </>
                      ) : (
                        <>
                          <strong>Lens Locked:</strong> This lens is locked
                          because its required node isn't in your session
                          workflow. Run the workflow or open an active
                          dashboard to unlock.
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div
                  style={{
                    padding: "16px 24px 24px 24px",
                    borderTop: "1px solid #f1f5f9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    gap: "12px",
                    backgroundColor: "#fafafa",
                  }}
                >
                  <button
                    onClick={() => setModalDashboard(null)}
                    style={{
                      padding: "9px 20px",
                      borderRadius: "10px",
                      border: "1px solid #cbd5e1",
                      backgroundColor: "#ffffff",
                      color: "#334155",
                      fontSize: "13px",
                      fontWeight: "600",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "#f8fafc")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "#ffffff")
                    }
                  >
                    Close
                  </button>

                  <button
                    onClick={() => {
                      setModalDashboard(null);
                      const pId = project?.id || "tesla";
                      const sId = session?.id || "demo";
                      navigate(`/${pId}/sessions/${sId}/build`);
                    }}
                    style={{
                      padding: "9px 20px",
                      borderRadius: "10px",
                      border: "none",
                      background:
                        "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                      color: "#ffffff",
                      fontSize: "13px",
                      fontWeight: "600",
                      cursor: "pointer",
                      boxShadow: "0 4px 14px rgba(79, 70, 229, 0.35)",
                      transition: "all 0.15s",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.transform = "translateY(-1px)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.transform = "translateY(0)")
                    }
                  >
                    <SparklesIcon width={14} height={14} />
                    Configure in Build with AI
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </OrbSettingsProvider>
  );
}
