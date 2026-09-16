import React, { useState, useEffect, useMemo } from "react";
import "./Template7.css";
import { Icon } from "../../components/ui/icon.tsx";
import { cn } from "../../lib/utils.js";
import {
  CoverProvider,
  useCover,
} from "../../components/cover/cover-provider.tsx";
import { CoverPanel } from "../../components/sense/cover-panel.tsx";
import { NavSlot } from "../../components/sense/nav-slot.tsx";
import { SenseCard } from "../../components/sense/sense-card.tsx";
import { ExecSummaryCard } from "../../components/sense/exec-summary-card.tsx";
import { Rich } from "../../utils/text.jsx";
import { DynamicChartRenderer } from "../../components/CustomChartWidgets.jsx";
import { TabDynamicCharts } from "../../utils/dynamicChartManager.js";
import { TopNarrativesList } from "../../components/TopNarrativesList.jsx";

// Visx Dashboard Widgets from Sense Design System
import { CoverageLineChart } from "../../components/sense-dashboard/coverage-line-chart.tsx";
import { ReachGauge } from "../../components/sense-dashboard/reach-gauge.tsx";
import { SentimentDonut } from "../../components/sense-dashboard/sentiment-donut.tsx";
import { BrandImpactHeatmap } from "../../components/sense-dashboard/brand-impact-heatmap.tsx";
import { PrImpactHeatmap } from "../../components/sense-dashboard/pr-impact-heatmap.tsx";
import { ThemeDistributionChart } from "../../components/sense-dashboard/theme-distribution-chart.tsx";
import { OriginalSyndicatedDonut } from "../../components/sense-dashboard/original-syndicated-donut.tsx";
import { RankedBarChart } from "../../components/sense-dashboard/ranked-bar-chart.tsx";
import { ThemeExplorer } from "../../components/sense-dashboard/theme-explorer.tsx";
import { TopArticles } from "../../components/sense-dashboard/top-articles.tsx";
import { StaggerGroup } from "../../components/motion/motion-primitives.tsx";

import ShadcnAnimatedLineChart from "../../components/ShadcnAnimatedLineChart.jsx";
import ShadcnAnimatedAreaChart from "../../components/ShadcnAnimatedAreaChart.jsx";

import { getDashboardDetail } from "../../data/mock.ts";
import { resolvePexelsImageUrls } from "../../api/pexels.js";

const DEFAULT_TABS = [
  "Overview",
  "Sentiment",
  "Themes & Topics",
  "Coverage",
  "Key Stories",
];

function usePexelsImageUrls(session) {
  const [pexelsImages, setPexelsImages] = useState([]);

  useEffect(() => {
    const brand =
      session?.workflow?.nodes?.find((n) => n.type === "data")?.data
        ?.brandKeywords?.[0] || "business technology news";
    resolvePexelsImageUrls(brand, 10).then((urls) => {
      if (urls && urls.length > 0) {
        setPexelsImages(urls);
      }
    });
  }, [session]);

  return pexelsImages;
}

// ── SENSE CHAPTER OPENER (Story Starting / Previously / Next) ──
function SenseChapterOpener({ chapters, currentTab, onSwitchTab, bgImage }) {
  if (!chapters || chapters.length === 0) return null;
  const currentIndex = chapters.findIndex(
    (c) => c.tab_name?.toLowerCase() === currentTab?.toLowerCase(),
  );
  const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const currentChapter =
    currentIndex !== -1 ? chapters[currentIndex] : chapters[0];
  const nextChapter =
    currentIndex !== -1 && currentIndex < chapters.length - 1
      ? chapters[currentIndex + 1]
      : null;

  const bg =
    bgImage ||
    currentChapter?.cover ||
    "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1200&q=80";

  return (
    <div
      className={cn(
        "relative",
        "overflow-hidden",
        "rounded-xl",
        "border",
        "border-slate-200/80",
        "bg-white",
        "p-5",
        "shadow-sm",
        "mb-4",
        "transition-all",
      )}
    >
      {/* Reference Image Cutout Shape for Background Photo (Curved Chevron Ribbon Cutout) */}
      <div
        className={cn(
          "absolute",
          "top-0",
          "right-0",
          "bottom-0",
          "w-[70%]",
          "pointer-events-none",
          "z-0",
          "overflow-hidden",
        )}
      >
        {/* Accent Color Bands behind photo matching Reference Image */}
        {/* <div
          className={cn(
            "absolute",
            "inset-0",
            "bg-gradient-to-br",
            "from-teal-400",
            "to-cyan-500",
            "shadow-md",
          )}
          style={{
            clipPath: "polygon(18% 0%, 100% 0%, 100% 100%, 55% 100%, 18% 42%)",
          }}
        /> */}
        {/* <div
          className={cn(
            "absolute",
            "inset-0",
            "bg-gradient-to-br",
            "from-red-500",
            "to-rose-600",
            "shadow-md",
          )}
          style={{
            clipPath: "polygon(28% 0%, 100% 0%, 100% 100%, 65% 100%, 28% 48%)",
          }}
        /> */}
        {/* Pexels HD Photo clipped into the Reference Chevron Ribbon shape */}
        {bg && (
          <div
            key={bg}
            className={cn(
              "absolute",
              "inset-0",
              "bg-cover",
              "bg-center",
              "transition-all",
              "duration-700",
              "shadow-2xl",
              // "scale-105",
            )}
            style={{
              backgroundImage: `url("${bg}")`,
              clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 10% 100%, 30% 52%)",
              filter: "brightness(0.95) contrast(1.1)",
            }}
          />
        )}
      </div>

      <div
        className={cn(
          "relative",
          "z-10",
          "grid",
          "grid-cols-1",
          "md:grid-cols-3",
          "gap-4",
        )}
      >
        {/* Previously */}
        <div
          className={cn(
            "flex",
            "flex-col",
            "justify-between",
            "border-b",
            "md:border-b-0",
            "md:border-r",
            "border-slate-200/80",
            "pb-3",
            "md:pb-0",
            "md:pr-4",
          )}
        >
          <div>
            <div
              className={cn(
                "text-[11px]",
                "font-bold",
                "tracking-wider",
                "text-slate-500",
                "uppercase",
                "flex",
                "items-center",
                "gap-1.5",
              )}
            >
              <span className="text-slate-400">◀</span> Previously ·{" "}
              {prevChapter ? prevChapter.section_label || "Brief" : "Start"}
            </div>
            {prevChapter ? (
              <>
                <div
                  className={cn(
                    "text-sm",
                    "font-bold",
                    "text-slate-900",
                    "mt-1",
                  )}
                >
                  {prevChapter.title || prevChapter.tab_name}
                </div>
                <div
                  className={cn(
                    "text-xs",
                    "text-slate-600",
                    "line-clamp-2",
                    "mt-1",
                    "leading-relaxed",
                  )}
                >
                  {prevChapter.description}
                </div>
              </>
            ) : (
              <div
                className={cn("text-xs", "italic", "text-slate-400", "mt-2")}
              >
                First chapter in the sequence.
              </div>
            )}
          </div>
          {prevChapter && (
            <button
              type="button"
              className={cn(
                "mt-3",
                "text-xs",
                "font-bold",
                "text-red-600",
                "hover:text-red-700",
                "flex",
                "items-center",
                "gap-1",
                "self-start",
                "transition-colors",
              )}
              onClick={() => onSwitchTab(prevChapter.tab_name)}
            >
              ← Go back
            </button>
          )}
        </div>

        {/* This Chapter (Center Focus Glass Card) */}
        <div
          className={cn(
            "flex",
            "flex-col",
            "justify-between",
            "border-b",
            "md:border-b-0",
            "md:border-r",
            "border-slate-200/80",
            "pb-3",
            "md:pb-0",
            "md:pr-4",
            "p-3.5",
            "rounded-xl",
            "border",
            "shadow-sm",
          )}
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.90)",
            borderColor: "rgba(203, 213, 225, 0.8)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div>
            <div
              className={cn(
                "text-[11px]",
                "font-bold",
                "tracking-wider",
                "text-red-600",
                "uppercase",
                "flex",
                "items-center",
                "gap-1.5",
              )}
            >
              <span className="animate-pulse">●</span> This Chapter ·{" "}
              {currentChapter?.section_label || currentChapter?.tab_name}
            </div>
            <div
              className={cn(
                "text-base",
                "font-extrabold",
                "text-slate-900",
                "mt-1",
              )}
            >
              {currentChapter?.title || currentChapter?.tab_name}
            </div>
            <div
              className={cn(
                "text-xs",
                "text-slate-700",
                "mt-1.5",
                "leading-relaxed",
                "font-medium",
              )}
            >
              <Rich text={currentChapter?.description || ""} />
            </div>
          </div>
        </div>

        {/* Coming Next */}
        <div
          className={cn(
            "flex",
            "flex-col",
            "justify-between",
            "pt-1",
            "md:pt-0",
            "pl-0",
            "md:pl-1",
          )}
        >
          <div
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.90)",
              borderColor: "rgba(203, 213, 225, 0.8)",
              backdropFilter: "blur(12px)",
              padding: "12px",
              borderRadius: "12px",
            }}
          >
            <div
              className={cn(
                "text-[11px]",
                "font-bold",
                "tracking-wider",
                "text-slate-500",
                "uppercase",
                "flex",
                "items-center",
                "gap-1.5",
              )}
            >
              Coming Next ·{" "}
              {nextChapter ? nextChapter.section_label || "Next" : "End"}{" "}
              <span className="text-slate-400">▶</span>
            </div>
            {nextChapter ? (
              <>
                <div
                  className={cn(
                    "text-sm",
                    "font-bold",
                    "text-slate-900",
                    "mt-1",
                  )}
                >
                  {nextChapter.title || nextChapter.tab_name}
                </div>
                <div
                  className={cn(
                    "text-xs",
                    "text-slate-600",
                    "line-clamp-2",
                    "mt-1",
                    "leading-relaxed",
                  )}
                >
                  {nextChapter.description}
                </div>
              </>
            ) : (
              <div
                className={cn("text-xs", "italic", "text-slate-400", "mt-2")}
              >
                Final chapter in the sequence.
              </div>
            )}
          </div>
          {nextChapter && (
            <button
              type="button"
              className={cn(
                "mt-3",
                "text-xs",
                "font-bold",
                "text-red-600",
                "hover:text-red-700",
                "flex",
                "items-center",
                "gap-1",
                "self-start",
                "transition-colors",
                "bg-slate-50",
                "p-2",
                "rounded-e-sm",
              )}
              onClick={() => onSwitchTab(nextChapter.tab_name)}
            >
              Skip ahead →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── SENSE STORY BRIDGE (Next Story / Read Next Chapter) ──
function SenseStoryBridge({ chapters, currentTab, onSwitchTab, bgImage }) {
  if (!chapters || chapters.length === 0) return null;
  const currentIndex = chapters.findIndex(
    (c) => c.tab_name?.toLowerCase() === currentTab?.toLowerCase(),
  );
  const nextChapter =
    currentIndex !== -1 && currentIndex < chapters.length - 1
      ? chapters[currentIndex + 1]
      : null;

  const bg =
    bgImage ||
    nextChapter?.cover ||
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80";

  if (!nextChapter) {
    return (
      <div
        className={cn(
          "relative",
          "overflow-hidden",
          "rounded-xl",
          "text-white",
          "shadow-md",
          "my-4",
          "p-6",
          "border",
          // "border-slate-700/50",
          // "bg-slate-900",
        )}
      >
        {bg && (
          <div
            key={bg}
            className={cn(
              "absolute",
              "inset-0",
              "bg-cover",
              "bg-center",
              "transition-all",
              "duration-700",
              "scale-105",
            )}
            style={{
              backgroundImage: `url("${bg}")`,
              filter: "brightness(0.7) contrast(1.1)",
              opacity: 0.45,
            }}
          />
        )}
        <div
          className={cn(
            "absolute",
            "inset-0",
            "bg-gradient-to-r",
            "from-slate-950/90",
            // "via-slate-900/85",
            // "to-slate-950/90",
            "backdrop-blur-[4px]",
          )}
        />

        <div
          className={cn(
            "relative",
            "z-10",
            "flex",
            "flex-col",
            "md:flex-row",
            "items-center",
            "justify-between",
            "gap-4",
          )}
        >
          <div>
            <div
              className={cn(
                "text-xs",
                "font-bold",
                "uppercase",
                "tracking-wider",
                "text-red-400",
                "flex",
                "items-center",
                "gap-1.5",
              )}
            >
              <span>✦</span> Storyboard Complete
            </div>
            <div
              className={cn("text-lg", "font-extrabold", "text-white", "mt-1")}
            >
              You have reviewed all narrative chapters
            </div>
            <div
              className={cn("text-xs", "text-slate-300", "mt-1", "max-w-xl")}
            >
              All strategic measurement layers have been analyzed for this
              briefing.
            </div>
          </div>
          <button
            type="button"
            className={cn(
              "px-5",
              "py-2.5",
              "text-xs",
              "font-bold",
              "rounded-lg",
              "bg-red-600",
              "hover:bg-red-700",
              "text-white",
              "transition-all",
              "shadow-md",
              "shrink-0",
              "cursor-pointer",
            )}
            onClick={() => onSwitchTab(chapters[0]?.tab_name)}
          >
            Restart Storyboard
          </button>
        </div>
      </div>
    );
  }

  const stepNum = String(currentIndex + 2).padStart(2, "0");

  return (
    <div
      className={cn(
        "relative",
        "overflow-hidden",
        "rounded-xl",
        "border",
        "border-slate-200/80",
        "bg-white",
        "p-5",
        "shadow-sm",
        "my-4",
        "transition-all",
        "hover:border-red-200",
        "group",
      )}
    >
      {/* Custom Cutout Shape for Pexels Photo in SenseStoryBridge */}
      <div
        className={cn(
          "absolute",
          "top-0",
          "right-0",
          "bottom-0",
          "w-[50%]",
          "md:w-[45%]",
          "pointer-events-none",
          "z-0",
          "overflow-hidden",
        )}
      >
        {/* Accent Color Band behind photo */}
        <div
          className={cn(
            "absolute",
            "inset-0",
            "bg-gradient-to-br",
            "from-red-500",
            "to-rose-600",
            "shadow-md",
          )}
          style={{
            clipPath: "polygon(20% 0%, 100% 0%, 100% 100%, 0% 100%)",
          }}
        />
        <div
          className={cn(
            "absolute",
            "inset-0",
            "bg-gradient-to-br",
            "from-amber-400",
            "to-orange-500",
            "shadow-md",
          )}
          style={{
            clipPath: "polygon(26% 0%, 100% 0%, 100% 100%, 6% 100%)",
          }}
        />
        {/* Pexels Photo clipped inside custom shape */}
        {bg && (
          <div
            key={bg}
            className={cn(
              "absolute",
              "inset-0",
              "bg-cover",
              "bg-center",
              "transition-all",
              "duration-700",
              "shadow-xl",
              "group-hover:scale-105",
            )}
            style={{
              backgroundImage: `url("${bg}")`,
              clipPath: "polygon(32% 0%, 100% 0%, 100% 100%, 12% 100%)",
              filter: "brightness(0.95) contrast(1.1)",
            }}
          />
        )}
      </div>

      <div
        className={cn(
          "relative",
          "z-10",
          "flex",
          "flex-col",
          "md:flex-row",
          "items-center",
          "justify-between",
          "gap-4",
        )}
      >
        <div className={cn("flex", "items-center", "gap-4")}>
          <div
            className={cn(
              "w-11",
              "h-11",
              "rounded-full",
              "bg-red-50",
              "text-red-600",
              "font-extrabold",
              "text-sm",
              "flex",
              "items-center",
              "justify-center",
              "border",
              "border-red-200/80",
              "shadow-sm",
              "shrink-0",
            )}
          >
            {stepNum}
          </div>
          <div>
            <div
              className={cn(
                "text-[11px]",
                "font-bold",
                "uppercase",
                "tracking-wider",
                "text-slate-500",
              )}
            >
              The Next Chapter
            </div>
            <div
              className={cn(
                "text-base",
                "font-extrabold",
                "text-slate-900",
                "mt-0.5",
              )}
            >
              Continue to{" "}
              <span className="text-red-600">{nextChapter.tab_name}</span>
            </div>
            <div
              className={cn(
                "text-xs",
                "text-slate-600",
                "mt-1",
                "line-clamp-1",
                "max-w-xl",
              )}
            >
              {nextChapter.description}
            </div>
          </div>
        </div>
        <button
          type="button"
          className={cn(
            "px-5",
            "py-2.5",
            "text-xs",
            "font-bold",
            "rounded-lg",
            "bg-red-600",
            "hover:bg-red-700",
            "text-white",
            "transition-all",
            "shadow-md",
            "flex",
            "items-center",
            "gap-2",
            "shrink-0",
            "cursor-pointer",
            "hover:gap-3",
          )}
          onClick={() => onSwitchTab(nextChapter.tab_name)}
        >
          Read Next Chapter: {nextChapter.tab_name} →
        </button>
      </div>
    </div>
  );
}

function SenseTemplateView({
  dashboardId = "media-measurement",
  projectId = "meridian-telecom",
  project,
  session,
  activeVideoSrc,
  chartsData,
  tab,
  setTab,
  openAnalysis,
  chapterFor,
  chapters = [],
  DASHBOARD_KEY,
  DYNAMIC_TAB,
  dynamicCharts,
  byId = {},
  totalCount,
  totalReach,
  sentiment,
  coverage,
  theme,
  syndication,
  overall,
  ins,
  dateIns,
  analysisOf,
  onBack,
  templateMode,
  onChangeTemplate,
  customTabsData,
  ...restProps
}) {
  const effectiveChapters = useMemo(() => {
    if (Array.isArray(chapters) && chapters.length > 0) return chapters;
    const tabList = Array.isArray(restProps.TABS)
      ? restProps.TABS
      : DEFAULT_TABS;
    return tabList.map((t) => ({
      tab_name: t,
      title: t,
      description: `${t} analysis and insights.`,
      section_label: t,
    }));
  }, [chapters, restProps.TABS]);

  const [localTab, setLocalTab] = useState(
    effectiveChapters[0]?.tab_name || "Overview",
  );

  const activeTab = tab || localTab;
  // window.alert(activeTab);
  const handleSwitchTab = (newTab) => {
    if (setTab) setTab(newTab);
    else setLocalTab(newTab);
  };

  const handleOpenAnalysis = (chartId, title) => {
    if (typeof openAnalysis === "function") {
      openAnalysis(chartId, title);
    }
  };

  // Scope cover overrides to this dashboard
  const { setScope } = useCover();
  useEffect(() => {
    setScope(`${projectId}:${dashboardId}`);
  }, [projectId, dashboardId, setScope]);

  // Fallback mock detail for complete Visx shapes if needed
  const mockDetail = useMemo(() => {
    return (
      getDashboardDetail(projectId, dashboardId) ||
      getDashboardDetail("meridian-telecom", "coverage-overview")
    );
  }, [projectId, dashboardId]);

  // Transform / bridge chartsData to Sense detail shape
  const detail = useMemo(() => {
    const brandName =
      project?.name || session?.brand_keywords?.[0] || "AlphaMetricx";
    const dashName = dashboardId
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

    const countVal = totalCount || chartsData?.total_count || 225;
    const reachVal = totalReach
      ? (totalReach / 1e6).toFixed(1)
      : chartsData?.total_reach
        ? (chartsData.total_reach / 1e6).toFixed(1)
        : "807.0";

    const posVal = sentiment?.data?.POS?.count || sentiment?.data?.POS || 44;
    const negVal = sentiment?.data?.NEG?.count || sentiment?.data?.NEG || 12;
    const neuVal = sentiment?.data?.NEU?.count || sentiment?.data?.NEU || 99;

    // Line chart points mapping
    let areaPoints = mockDetail?.area?.points || [];
    if (coverage?.data && typeof coverage.data === "object") {
      const dates = Object.keys(coverage.data);
      if (dates.length > 0) {
        areaPoints = dates.map((d) => ({
          date: new Date(d),
          brand: Number(coverage.data[d]?.count || coverage.data[d] || 0),
          competitor: Math.round(
            Number(coverage.data[d]?.count || coverage.data[d] || 0) * 0.7,
          ),
        }));
      }
    }

    return {
      summary: {
        name: dashName,
        description:
          overall ||
          mockDetail?.summary?.description ||
          "Coverage volume, reach and sentiment across every tracked source.",
        cover: mockDetail?.summary?.cover,
      },
      kpis: [
        {
          id: "volume",
          label: "Total mentions",
          value: countVal,
          format: "compact",
          delta: 7.2,
          direction: "up",
          positiveIsGood: true,
        },
        {
          id: "reach",
          label: "Estimated reach",
          value:
            typeof reachVal === "number"
              ? reachVal
              : parseFloat(reachVal) || 7.6,
          suffix: "M",
          delta: 3.5,
          direction: "up",
          positiveIsGood: true,
        },
        {
          id: "sov",
          label: "Share of voice",
          value: 29,
          format: "percent",
          delta: 1.8,
          direction: "up",
          positiveIsGood: true,
        },
        {
          id: "sentiment",
          label: "Net sentiment",
          value: 38,
          format: "percent",
          delta: 4.6,
          direction: "up",
          positiveIsGood: true,
        },
      ],
      area: {
        title:
          coverage?.title || mockDetail?.area?.title || "Coverage Over Time",
        description:
          coverage?.description ||
          mockDetail?.area?.description ||
          "Article volume per day, with missing days zero-filled for a continuous series.",
        caption:
          ins?.("datewise_coverage") ||
          mockDetail?.area?.caption ||
          "Coverage peaked around the mid-window campaign and settled after.",
        series: mockDetail?.area?.series || [
          {
            key: "brand",
            label: "Your brand",
            color: "var(--chart-line-primary)",
            fillOpacity: 0.28,
          },
          {
            key: "competitor",
            label: "Competitor",
            color: "var(--chart-line-secondary)",
            fillOpacity: 0.18,
          },
        ],
        points: areaPoints,
      },
      executiveSummary:
        overall ||
        mockDetail?.executiveSummary ||
        "Sentiment Pulse shows media reach up 7.0% this period, with 100 mentions across channels. Sentiment holds net-positive at 38% and share of voice sits at 29%, led by online and print coverage.",
      prImpactScore:
        restProps.mergedPRImpactChart?.data?.gauge ||
        byId?.["pr_impact"]?.data?.gauge ||
        78.4,
      competitorHeatmap: mockDetail?.competitorHeatmap,
      themeDistribution: (
        theme?.data ||
        byId?.["theme_distribution"]?.data ||
        mockDetail?.themeDistribution ||
        []
      ).map((t) => ({
        theme: t.theme || t.label || "General",
        articles:
          t.articles ||
          t.count ||
          (t.sentiments
            ? t.sentiments.POS + t.sentiments.NEG + t.sentiments.NEU
            : 34),
      })),
      themeCaption:
        ins?.("theme_distribution") ||
        mockDetail?.themeCaption ||
        "Top themes led coverage volume across channels.",
      sentiment: (() => {
        let slices = [];
        const rawSentiment =
          sentiment?.data || byId?.["sentiment_distribution"]?.data;
        if (rawSentiment && typeof rawSentiment === "object") {
          if (Array.isArray(rawSentiment)) {
            slices = rawSentiment
              .map((s) => ({
                label: s.label || s.sentiment || "Neutral",
                value: Number(s.value ?? s.count ?? 0) || 0,
                color:
                  s.color ||
                  (String(s.label || s.sentiment)
                    .toLowerCase()
                    .includes("pos")
                    ? "#17b26a"
                    : String(s.label || s.sentiment)
                          .toLowerCase()
                          .includes("neg")
                      ? "#d31717"
                      : "#64748b"),
              }))
              .filter((s) => s.value > 0);
          } else {
            const parseVal = (v) => {
              if (typeof v === "number") return v;
              if (v && typeof v === "object")
                return Number(v.count ?? v.value ?? 0) || 0;
              return Number(v) || 0;
            };

            const p = parseVal(
              rawSentiment.POS ??
                rawSentiment.positive ??
                rawSentiment.Positive,
            );
            const n = parseVal(
              rawSentiment.NEG ??
                rawSentiment.negative ??
                rawSentiment.Negative,
            );
            const nu = parseVal(
              rawSentiment.NEU ?? rawSentiment.neutral ?? rawSentiment.Neutral,
            );
            const un = parseVal(
              rawSentiment.UNASSIGNED ??
                rawSentiment.unassigned ??
                rawSentiment.Unassigned,
            );

            if (p > 0)
              slices.push({ label: "Positive", value: p, color: "#17b26a" });
            if (n > 0)
              slices.push({ label: "Negative", value: n, color: "#d31717" });
            if (nu > 0)
              slices.push({ label: "Neutral", value: nu, color: "#64748b" });
            if (un > 0)
              slices.push({ label: "Unassigned", value: un, color: "#cbd5e1" });
          }
        }

        if (slices.length === 0) {
          const p = Number(posVal) || 0;
          const n = Number(negVal) || 0;
          const nu = Number(neuVal) || 0;
          if (p > 0)
            slices.push({ label: "Positive", value: p, color: "#17b26a" });
          if (n > 0)
            slices.push({ label: "Negative", value: n, color: "#d31717" });
          if (nu > 0)
            slices.push({ label: "Neutral", value: nu, color: "#64748b" });
        }

        if (slices.length === 0) {
          slices = [
            { label: "Positive", value: 44, color: "#17b26a" },
            { label: "Negative", value: 12, color: "#d31717" },
            { label: "Neutral", value: 99, color: "#64748b" },
          ];
        }

        return {
          title: "Sentiment Breakdown",
          description: "Positive, negative and neutral share of coverage.",
          centerLabel: "Total",
          caption:
            ins?.("sentiment_distribution") ||
            mockDetail?.sentiment?.caption ||
            "Coverage skews net positive with steady neutral share.",
          data: slices,
        };
      })(),
      heatmap: mockDetail?.heatmap || [],
      originalSyndicated: {
        title: "Original vs Syndicated",
        description:
          "Share of original articles versus syndicated copies, grouped by shared (normalized) title.",
        centerLabel: "Total",
        caption:
          ins?.("original_vs_syndicated") ||
          mockDetail?.originalSyndicated?.caption ||
          "Most coverage is original reporting, with a smaller share of syndicated pickups.",
        data: [
          {
            label: "Original",
            value: syndication?.data?.original?.count || 61,
            color: "#2f4bd8",
          },
          {
            label: "Syndicated",
            value: syndication?.data?.syndicated?.count || 164,
            color: "#5fd0a9",
          },
        ],
      },
      topPublications: mockDetail?.topPublications || [
        { label: "Reuters", value: 45 },
        { label: "Bloomberg", value: 32 },
        { label: "Yahoo", value: 28 },
        { label: "MSN", value: 21 },
        { label: "Morningstar", value: 16 },
      ],
      publicationsCaption:
        mockDetail?.publicationsCaption ||
        "Coverage clustered in a handful of top business & news outlets.",
      themes: mockDetail?.themes || [],
      negativeThemes: mockDetail?.negativeThemes || [],
      topArticles:
        byId?.top_articles_by_sentiment?.data ||
        byId?.top_articles?.data ||
        chartsData?.top_articles ||
        mockDetail?.topArticles ||
        [],
      topNarratives:
        byId?.top_narratives?.data ||
        chartsData?.top_narratives ||
        restProps.topNarratives ||
        mockDetail?.topNarratives ||
        [],
    };
  }, [
    project,
    session,
    chartsData,
    byId,
    totalCount,
    totalReach,
    sentiment,
    coverage,
    theme,
    syndication,
    overall,
    ins,
    mockDetail,
    dashboardId,
    restProps.mergedPRImpactChart,
    restProps.topNarratives,
  ]);

  const isNarrative = dashboardId?.includes("narrative");
  const isPRImpact =
    dashboardId?.includes("pr-impact") || dashboardId?.includes("pr_impact");
  const isReputation = dashboardId?.includes("reputation");

  const [selectedBrandState, setSelectedBrandState] = useState("");
  const brandsList = useMemo(() => {
    if (Array.isArray(restProps.brandsList) && restProps.brandsList.length > 0)
      return restProps.brandsList;
    const data = byId?.publication_by_brands_and_competitors?.data || {};
    return Object.keys(data);
  }, [restProps.brandsList, byId]);

  const activeBrand =
    selectedBrandState || restProps.selectedBrand || brandsList[0] || "";

  const selectedBrandChart = useMemo(() => {
    const chart =
      byId?.publication_by_brands_and_competitors ||
      restProps.selectedBrandChart;
    if (!chart) return null;
    const dataObj = chart.data || {};
    if (activeBrand && dataObj[activeBrand]) {
      const brandData = dataObj[activeBrand] || {};
      return {
        ...chart,
        data: Object.entries(brandData).map(([name, value]) => ({
          name,
          value,
        })),
      };
    }
    if (restProps.selectedBrandChart && !selectedBrandState) {
      return restProps.selectedBrandChart;
    }
    return chart;
  }, [restProps.selectedBrandChart, byId, activeBrand, selectedBrandState]);

  const formattedCoverageChart = useMemo(() => {
    if (restProps.formattedCoverageChart)
      return restProps.formattedCoverageChart;
    const chart = byId?.coverage_overtime_by_competitors;
    if (!chart) return null;
    const brandsObj = chart.data || {};
    const out = {};
    Object.entries(brandsObj).forEach(([b, dateObj]) => {
      Object.entries(dateObj || {}).forEach(([d, count]) => {
        if (!out[d]) out[d] = { date: d };
        out[d][b] = count;
      });
    });
    const rows = Object.values(out).sort((a, b) =>
      a.date.localeCompare(b.date),
    );
    return {
      ...chart,
      data: rows,
      series: Object.keys(brandsObj),
    };
  }, [restProps.formattedCoverageChart, byId]);

  const formattedSentimentChart = useMemo(() => {
    if (restProps.formattedSentimentChart)
      return restProps.formattedSentimentChart;
    const chart = byId?.sentiment_breakdown_by_competitors;
    if (!chart) return null;
    const data = chart.data || {};
    const rows = Object.entries(data).map(([brand, item]) => ({
      brand,
      POS: item.sentiments?.POS || 0,
      NEG: item.sentiments?.NEG || 0,
      NEU: item.sentiments?.NEU || 0,
    }));
    return {
      ...chart,
      chart_type: "stacked_bar",
      data: rows,
      series: ["POS", "NEU", "NEG"],
    };
  }, [restProps.formattedSentimentChart, byId]);

  const formattedConsistencyTimeChart = useMemo(() => {
    if (restProps.formattedConsistencyTimeChart)
      return restProps.formattedConsistencyTimeChart;
    const chart = byId?.coverage_message_consistency;
    if (!chart) return null;
    const arr = chart.data || [];
    const out = {};
    arr.forEach((bItem) => {
      const brand = bItem.brand;
      (bItem.data || []).forEach((d) => {
        if (!out[d.date]) out[d.date] = { date: d.date };
        out[d.date][brand] = d.consistency_percent;
      });
    });
    const rows = Object.values(out).sort((a, b) =>
      a.date.localeCompare(b.date),
    );
    return {
      ...chart,
      data: rows,
      series: arr.map((d) => d.brand),
    };
  }, [restProps.formattedConsistencyTimeChart, byId]);

  const riGaugeChart =
    restProps.riGauge || byId?.reputation_index || byId?.ri_gauge;
  const repTimeseriesChart =
    restProps.formattedTimeseriesChart || byId?.reputation_over_time;
  const repDecompChart =
    restProps.formattedDecompositionChart || byId?.reputation_decomposition;
  const prImpactScoreChart = byId?.pr_impact || byId?.pr_impact_scale;
  const prComparisonChart =
    restProps.mergedPRImpactChart || byId?.pr_comparison;
  const repPillarsChart =
    restProps.formattedSmallMultiplesChart ||
    restProps.formattedPillarsChart ||
    byId?.pillar_small_multiples;

  const coverageChart = coverage || byId?.datewise_coverage;
  const coverageDateInsights = dateIns ? dateIns("datewise_coverage") : [];

  const sentimentOverTimeChart = useMemo(() => {
    if (restProps.formattedSentimentOverTimeChart) {
      return restProps.formattedSentimentOverTimeChart;
    }
    const chart = sentiment || byId?.sentiment_distribution;
    if (!chart) return null;
    const datewise = chart.data?.datewise_distribution || {};
    const rows = Object.entries(datewise)
      .map(([date, v]) => ({
        date,
        POS: v.POS || 0,
        NEG: v.NEG || 0,
        NEU: v.NEU || 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
    if (!rows.length) return null;
    return {
      chart_id: "sentiment_over_time",
      chart_type: "stacked_area",
      title: "Sentiment Over Time",
      description: "Daily positive / neutral / negative coverage split.",
      data: rows,
      series: ["POS", "NEU", "NEG"],
    };
  }, [restProps.formattedSentimentOverTimeChart, sentiment, byId]);

  const sentimentDateInsights = dateIns
    ? dateIns("sentiment_distribution")
    : [];

  const navDashboards = useMemo(() => {
    const isLensAvailable = (key) => {
      if (chartsData && chartsData[key]) {
        const d = chartsData[key];
        if (Array.isArray(d) && d.length > 0) return true;
        if (typeof d === "object" && Object.keys(d).length > 0) return true;
      }
      if (
        key === "narrative_intelligence" &&
        (chartsData?.top_narratives?.length > 0 ||
          chartsData?.narrative_intelligence?.length > 0)
      )
        return true;
      if (
        key === "reputation_index" &&
        chartsData?.reputation_index?.length > 0
      )
        return true;
      if (key === "pr_impact" && chartsData?.pr_impact?.length > 0) return true;
      if (
        key === "media_measurement" &&
        (chartsData?.media_measurement?.length > 0 || totalCount)
      )
        return true;
      if (
        key === "media_monitoring" &&
        (chartsData?.media_monitoring?.length > 0 || chartsData?.monitoring)
      )
        return true;

      if (Array.isArray(session?.workflow?.nodes)) {
        return session.workflow.nodes.some(
          (n) => n.type === "analysis" && n.data?.lens === key,
        );
      }
      return true;
    };

    return [
      {
        id: "media_measurement",
        name: "Media Measurement",
        path: "measurement",
        icon: "newspaper",
        accessible: isLensAvailable("media_measurement"),
      },
      {
        id: "media_monitoring",
        name: "Daily Monitoring",
        path: "monitoring",
        icon: "insights",
        accessible: isLensAvailable("media_monitoring"),
      },
      {
        id: "narrative_intelligence",
        name: "Narrative Intelligence",
        path: "narrative",
        icon: "auto_stories",
        accessible: isLensAvailable("narrative_intelligence"),
      },
      {
        id: "pr_impact",
        name: "PR Impact",
        path: "primpact",
        icon: "avg_pace",
        accessible: isLensAvailable("pr_impact"),
      },
      {
        id: "reputation_index",
        name: "Reputation Index",
        path: "reputation",
        icon: "shield",
        accessible: isLensAvailable("reputation_index"),
      },
    ];
  }, [chartsData, session, totalCount]);

  const normalizedTab = activeTab?.toLowerCase() || "";
  const pexelsImages = usePexelsImageUrls(session);

  const activeTabName = tab || localTab;

  const openerBgImage = useMemo(() => {
    if (pexelsImages.length > 0) {
      const tabIndex = effectiveChapters.findIndex(
        (c) => c.tab_name?.toLowerCase() === activeTabName?.toLowerCase(),
      );
      const idx = tabIndex >= 0 ? tabIndex % pexelsImages.length : 0;
      return pexelsImages[idx];
    }
    return detail?.summary?.cover || null;
  }, [pexelsImages, effectiveChapters, activeTabName, detail]);

  const bridgeBgImage = useMemo(() => {
    if (pexelsImages.length > 0) {
      const tabIndex = effectiveChapters.findIndex(
        (c) => c.tab_name?.toLowerCase() === activeTabName?.toLowerCase(),
      );
      const nextIdx = tabIndex >= 0 ? (tabIndex + 1) % pexelsImages.length : 1;
      return pexelsImages[nextIdx];
    }
    return detail?.summary?.cover || null;
  }, [pexelsImages, effectiveChapters, activeTabName, detail]);

  const isOverviewTab =
    normalizedTab === "overview" ||
    effectiveChapters.findIndex(
      (c) => c.tab_name?.toLowerCase() === normalizedTab,
    ) === 0;
  const isSentimentTab = normalizedTab.includes("sentiment");
  const isThemeTab =
    normalizedTab.includes("theme") || normalizedTab.includes("topic");
  const isCoverageTab = normalizedTab.includes("coverage");
  const isStoriesTab =
    normalizedTab.includes("story") || normalizedTab.includes("stories");
  const isConsistencyTab = normalizedTab.includes("consistency");
  const isChannelsTab =
    normalizedTab.includes("channel") || normalizedTab.includes("publication");
  const isNarrativesTab = normalizedTab.includes("narrative");
  const isReputationTab =
    normalizedTab.includes("reputation") ||
    normalizedTab.includes("pillar") ||
    normalizedTab.includes("decomposition");
  const isImpactTab =
    normalizedTab.includes("impact") || normalizedTab.includes("competitor");

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
  }, [tab, activeTab]);

  return (
    <div className="t7-container" data-dashboard-template="sense">
      <div className="t7-inner" style={{ height: "100%" }}>
        {/* Cover Panel (Left column) */}
        <CoverPanel
          eyebrow={project?.name || "Meridian Telecom"}
          title={detail.summary.name}
          subtitle={detail.summary.description}
          kpis={detail.kpis}
          defaultCover={detail.summary.cover}
          videoSrc={activeVideoSrc}
        />

        {/* Nav Rail */}
        <NavSlot
          projectId={projectId}
          dashboards={navDashboards}
          activeId={dashboardId}
          onBack={onBack}
          onSelectTab={handleSwitchTab}
        />

        {/* Main Content Area */}
        <main className="t7-main">
          {/* Header tabs */}
          <div className="t7-header">
            <div
              className={cn(
                "flex",
                "min-w-0",
                "flex-1",
                "items-center",
                "gap-[20px]",
              )}
            >
              {effectiveChapters.map((ch) => (
                <button
                  key={ch.tab_name}
                  type="button"
                  onClick={() => handleSwitchTab(ch.tab_name)}
                  className={cn(
                    "shrink-0 whitespace-nowrap text-[13px] font-semibold leading-[1.4] tracking-[-0.03em] text-black transition-opacity",
                    activeTab?.toLowerCase() === ch.tab_name?.toLowerCase()
                      ? "opacity-100 border-b-2 border-red-600 pb-1"
                      : "opacity-40 hover:opacity-70",
                  )}
                >
                  {ch.tab_name}
                </button>
              ))}
            </div>
            <span
              className={cn(
                "shrink-0",
                "whitespace-nowrap",
                "text-[13px]",
                "font-semibold",
                "tracking-[-0.03em]",
                "text-black",
              )}
            >
              20 Jun – 12 Jul
            </span>
          </div>

          <div className="t7-content">
            <StaggerGroup
              className={cn("flex", "flex-col", "gap-[12px]", "py-[12px]")}
            >
              {/* Story Starting (Chapter Opener) */}
              {activeTab !== "Overview" && (
                <SenseChapterOpener
                  chapters={effectiveChapters}
                  currentTab={activeTab}
                  onSwitchTab={handleSwitchTab}
                  bgImage={openerBgImage}
                />
              )}
              {/* Tab AI Generated Charts */}
              <TabDynamicCharts
                activeTab={activeTab}
                chartsData={chartsData}
                ChartCardComp={({ title, subtitle, children, wide }) => (
                  <SenseCard
                    title={title}
                    snippet={subtitle}
                    className={wide ? "col-span-full" : ""}
                  >
                    {children}
                  </SenseCard>
                )}
                DynamicRendererComp={DynamicChartRenderer}
              />
              {/* Chatbot Custom Dynamic Charts */}
              {customTabsData?.[activeTab] && (
                <div
                  className={cn(
                    "grid",
                    "grid-cols-1",
                    "md:grid-cols-2",
                    "gap-[10px]",
                    "my-2",
                  )}
                >
                  {customTabsData[activeTab].map((c, i) => (
                    <SenseCard
                      key={c.chart_id || i}
                      title={c.title}
                      snippet={c.description}
                      analysis={
                        c.analysis || (analysisOf ? analysisOf(c.chart_id) : "")
                      }
                      onOpenAnalysis={() =>
                        handleOpenAnalysis(c.chart_id || i, c.title)
                      }
                      className={cn("min-w-0", "flex-1")}
                    >
                      <DynamicChartRenderer chart={c} />
                    </SenseCard>
                  ))}
                </div>
              )}

              {/* Tab View Content: Overview */}
              {(isOverviewTab ||
                (!isSentimentTab &&
                  !isThemeTab &&
                  !isCoverageTab &&
                  !isStoriesTab &&
                  !isConsistencyTab &&
                  !isChannelsTab &&
                  !isNarrativesTab &&
                  !isReputationTab &&
                  !isImpactTab)) && (
                <>
                  {isNarrative ? (
                    <>
                      {/* Narrative Intelligence Overview */}
                      <div
                        className={cn("flex", "items-stretch", "gap-[10px]")}
                      >
                        {byId.message_consistency ? (
                          <SenseCard
                            title={
                              byId.message_consistency.title ||
                              "Message Consistency"
                            }
                            snippet={
                              byId.message_consistency.description ||
                              "Alignment across core narratives."
                            }
                            analysis={
                              analysisOf
                                ? analysisOf("message_consistency")
                                : ""
                            }
                            onOpenAnalysis={() =>
                              handleOpenAnalysis(
                                "message_consistency",
                                byId.message_consistency.title ||
                                  "Message Consistency",
                              )
                            }
                            className={cn("min-w-0", "flex-1")}
                          >
                            <DynamicChartRenderer
                              chart={byId.message_consistency}
                            />
                          </SenseCard>
                        ) : null}
                        <div className={cn("w-[320px]", "shrink-0")}>
                          <ExecSummaryCard
                            summary={detail.executiveSummary}
                            bgImage={openerBgImage || detail?.summary?.cover}
                          />
                        </div>
                      </div>
                      <TopNarrativesList narratives={detail.topNarratives} />

                      {byId.publication_by_brands_and_competitors && (
                        <>
                          <div
                            className={cn("h-px", "w-full")}
                            style={{ backgroundColor: "var(--sense-hairline)" }}
                          />
                          <SenseCard
                            title={
                              byId.publication_by_brands_and_competitors
                                .title || "Publication Reach by Brand"
                            }
                            snippet={
                              byId.publication_by_brands_and_competitors
                                .description ||
                              "Article volume by publication across key brands."
                            }
                            analysis={
                              analysisOf
                                ? analysisOf(
                                    "publication_by_brands_and_competitors",
                                  )
                                : ""
                            }
                            onOpenAnalysis={() =>
                              handleOpenAnalysis(
                                "publication_by_brands_and_competitors",
                                "Publication Reach by Brand",
                              )
                            }
                          >
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 12,
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  gap: 8,
                                  flexWrap: "wrap",
                                }}
                              >
                                {brandsList.map((b) => (
                                  <button
                                    key={b}
                                    type="button"
                                    className={`px-3 py-1 text-xs rounded-full border transition-colors cursor-pointer ${activeBrand === b ? "bg-slate-900 text-white border-slate-900 font-semibold" : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"}`}
                                    onClick={() => {
                                      setSelectedBrandState(b);
                                      if (
                                        typeof restProps.setSelectedBrand ===
                                        "function"
                                      ) {
                                        restProps.setSelectedBrand(b);
                                      }
                                    }}
                                  >
                                    {b}
                                  </button>
                                ))}
                              </div>
                              <DynamicChartRenderer
                                chart={selectedBrandChart}
                              />
                            </div>
                          </SenseCard>
                        </>
                      )}

                      {formattedCoverageChart && (
                        <>
                          <div
                            className={cn("h-px", "w-full")}
                            style={{ backgroundColor: "var(--sense-hairline)" }}
                          />
                          <SenseCard
                            title={
                              formattedCoverageChart.title ||
                              "Coverage Over Time by Competitors"
                            }
                            snippet={
                              formattedCoverageChart.description ||
                              "Volume across competitors."
                            }
                            analysis={
                              analysisOf
                                ? analysisOf("coverage_overtime_by_competitors")
                                : ""
                            }
                            onOpenAnalysis={() =>
                              handleOpenAnalysis(
                                "coverage_overtime_by_competitors",
                                formattedCoverageChart.title ||
                                  "Coverage Over Time",
                              )
                            }
                          >
                            <div className="w-full">
                              <ShadcnAnimatedLineChart
                                chart={formattedCoverageChart}
                                dateInsights={
                                  dateIns
                                    ? dateIns(
                                        "coverage_overtime_by_competitors",
                                      )
                                    : []
                                }
                              />
                            </div>
                          </SenseCard>
                        </>
                      )}

                      {formattedSentimentChart && (
                        <>
                          <div
                            className={cn("h-px", "w-full")}
                            style={{ backgroundColor: "var(--sense-hairline)" }}
                          />
                          <SenseCard
                            title={
                              formattedSentimentChart.title ||
                              "Sentiment Breakdown by Competitors"
                            }
                            snippet={
                              formattedSentimentChart.description ||
                              "Tone breakdown across brands."
                            }
                            analysis={
                              analysisOf
                                ? analysisOf(
                                    "sentiment_breakdown_by_competitors",
                                  )
                                : ""
                            }
                            onOpenAnalysis={() =>
                              handleOpenAnalysis(
                                "sentiment_breakdown_by_competitors",
                                formattedSentimentChart.title ||
                                  "Sentiment Breakdown",
                              )
                            }
                          >
                            <DynamicChartRenderer
                              chart={formattedSentimentChart}
                            />
                          </SenseCard>
                        </>
                      )}
                    </>
                  ) : isReputation ? (
                    <>
                      {/* Reputation Index Overview */}
                      <div
                        className={cn("flex", "items-stretch", "gap-[10px]")}
                      >
                        <SenseCard
                          title="Reputation Score"
                          snippet="Composite index across trust, quality and leadership pillars."
                          footer="Reputation score remains stable in the upper performance band."
                          analysis={
                            analysisOf ? analysisOf("reputation_index") : ""
                          }
                          onOpenAnalysis={() =>
                            handleOpenAnalysis(
                              "reputation_index",
                              "Reputation Score",
                            )
                          }
                          className={cn("min-w-0", "flex-1")}
                        >
                          {riGaugeChart ? (
                            <DynamicChartRenderer chart={riGaugeChart} />
                          ) : (
                            <ReachGauge
                              value={78}
                              centerValue={78}
                              label="Reputation Index"
                            />
                          )}
                        </SenseCard>
                        <div className={cn("w-[320px]", "shrink-0")}>
                          <ExecSummaryCard
                            summary={detail.executiveSummary}
                            bgImage={openerBgImage || detail?.summary?.cover}
                          />
                        </div>
                      </div>

                      <div
                        className={cn("h-px", "w-full")}
                        style={{ backgroundColor: "var(--sense-hairline)" }}
                      />

                      <div
                        className={cn("flex", "items-stretch", "gap-[10px]")}
                      >
                        {repTimeseriesChart && (
                          <SenseCard
                            title={
                              repTimeseriesChart.title || "Reputation Over Time"
                            }
                            snippet={
                              repTimeseriesChart.description ||
                              "Daily reputation index trajectory."
                            }
                            analysis={
                              analysisOf
                                ? analysisOf("reputation_over_time")
                                : ""
                            }
                            onOpenAnalysis={() =>
                              handleOpenAnalysis(
                                "reputation_over_time",
                                repTimeseriesChart.title ||
                                  "Reputation Over Time",
                              )
                            }
                            className={cn("min-w-0", "flex-1")}
                          >
                            <div className="w-full">
                              <ShadcnAnimatedLineChart
                                chart={repTimeseriesChart}
                                dateInsights={
                                  dateIns ? dateIns("reputation_over_time") : []
                                }
                              />
                            </div>
                          </SenseCard>
                        )}
                        {byId.pillar_radar && (
                          <SenseCard
                            title={byId.pillar_radar.title || "Pillar Radar"}
                            snippet={
                              byId.pillar_radar.description ||
                              "Reputation strength across key pillars."
                            }
                            analysis={
                              analysisOf ? analysisOf("pillar_radar") : ""
                            }
                            onOpenAnalysis={() =>
                              handleOpenAnalysis(
                                "pillar_radar",
                                byId.pillar_radar.title || "Pillar Radar",
                              )
                            }
                            className={cn("min-w-0", "flex-1")}
                          >
                            <DynamicChartRenderer chart={byId.pillar_radar} />
                          </SenseCard>
                        )}
                      </div>

                      {byId.trust_waterfall && (
                        <>
                          <div
                            className={cn("h-px", "w-full")}
                            style={{ backgroundColor: "var(--sense-hairline)" }}
                          />
                          <SenseCard
                            title={
                              byId.trust_waterfall.title ||
                              "Trust Drivers Waterfall"
                            }
                            snippet={
                              byId.trust_waterfall.description ||
                              "Waterfall breakdown of trust score building blocks."
                            }
                            analysis={
                              analysisOf ? analysisOf("trust_waterfall") : ""
                            }
                            onOpenAnalysis={() =>
                              handleOpenAnalysis(
                                "trust_waterfall",
                                byId.trust_waterfall.title || "Trust Waterfall",
                              )
                            }
                          >
                            <DynamicChartRenderer
                              chart={byId.trust_waterfall}
                            />
                          </SenseCard>
                        </>
                      )}

                      {(formattedSentimentChart || byId.theme_volume) && (
                        <>
                          <div
                            className={cn("h-px", "w-full")}
                            style={{ backgroundColor: "var(--sense-hairline)" }}
                          />
                          <div
                            className={cn(
                              "flex",
                              "items-stretch",
                              "gap-[10px]",
                            )}
                          >
                            {formattedSentimentChart && (
                              <SenseCard
                                title={
                                  formattedSentimentChart.title ||
                                  "Net Sentiment Trajectory"
                                }
                                snippet={
                                  formattedSentimentChart.description ||
                                  "Sentiment-weighted coverage."
                                }
                                analysis={
                                  analysisOf
                                    ? analysisOf("net_sentiment_coverage")
                                    : ""
                                }
                                onOpenAnalysis={() =>
                                  handleOpenAnalysis(
                                    "net_sentiment_coverage",
                                    "Net Sentiment",
                                  )
                                }
                                className={cn("min-w-0", "flex-1")}
                              >
                                <DynamicChartRenderer
                                  chart={formattedSentimentChart}
                                />
                              </SenseCard>
                            )}
                            {byId.theme_volume && (
                              <SenseCard
                                title={
                                  byId.theme_volume.title || "Theme Volume"
                                }
                                snippet={
                                  byId.theme_volume.description ||
                                  "Volume breakdown by topic."
                                }
                                analysis={
                                  analysisOf ? analysisOf("theme_volume") : ""
                                }
                                onOpenAnalysis={() =>
                                  handleOpenAnalysis(
                                    "theme_volume",
                                    "Theme Volume",
                                  )
                                }
                                className={cn("min-w-0", "flex-1")}
                              >
                                <DynamicChartRenderer
                                  chart={byId.theme_volume}
                                />
                              </SenseCard>
                            )}
                          </div>
                        </>
                      )}
                    </>
                  ) : isPRImpact ? (
                    <>
                      {/* PR Impact Overview */}
                      <div
                        className={cn("flex", "items-stretch", "gap-[10px]")}
                      >
                        <SenseCard
                          title={coverageChart?.title || detail.area.title}
                          snippet={
                            coverageChart?.description ||
                            detail.area.description
                          }
                          footer={
                            ins ? ins("datewise_coverage") : detail.area.caption
                          }
                          analysis={
                            analysisOf ? analysisOf("datewise_coverage") : ""
                          }
                          onOpenAnalysis={() =>
                            handleOpenAnalysis(
                              "datewise_coverage",
                              coverageChart?.title || "Coverage Over Time",
                            )
                          }
                          className={cn("min-w-0", "flex-1")}
                        >
                          {coverageChart?.data ? (
                            <div className="w-full">
                              <ShadcnAnimatedLineChart
                                chart={coverageChart}
                                dateInsights={coverageDateInsights}
                              />
                            </div>
                          ) : (
                            <CoverageLineChart data={detail.area} />
                          )}
                        </SenseCard>
                        <div className={cn("w-[320px]", "shrink-0")}>
                          <ExecSummaryCard
                            summary={detail.executiveSummary}
                            bgImage={openerBgImage || detail?.summary?.cover}
                          />
                        </div>
                      </div>

                      <div
                        className={cn("h-px", "w-full")}
                        style={{ backgroundColor: "var(--sense-hairline)" }}
                      />

                      <div
                        className={cn("flex", "items-stretch", "gap-[10px]")}
                      >
                        <SenseCard
                          title="Sentiment Breakdown"
                          snippet="Positive, negative, neutral share of coverage."
                          footer={detail.sentiment.caption}
                          analysis={
                            analysisOf
                              ? analysisOf("sentiment_distribution")
                              : ""
                          }
                          onOpenAnalysis={() =>
                            handleOpenAnalysis(
                              "sentiment_distribution",
                              sentiment?.title || "Sentiment Breakdown",
                            )
                          }
                          className={cn("min-w-0", "flex-1")}
                        >
                          <div
                            className={cn(
                              "flex",
                              "min-h-[360px]",
                              "w-full",
                              "items-center",
                              "justify-center",
                            )}
                          >
                            <SentimentDonut data={detail.sentiment} />
                          </div>
                        </SenseCard>

                        {byId.share_of_voice && (
                          <SenseCard
                            title={
                              byId.share_of_voice.title || "Share of Voice"
                            }
                            snippet={
                              byId.share_of_voice.description ||
                              "Volume breakdown vs key industry competitors."
                            }
                            analysis={
                              analysisOf ? analysisOf("share_of_voice") : ""
                            }
                            onOpenAnalysis={() =>
                              handleOpenAnalysis(
                                "share_of_voice",
                                byId.share_of_voice.title || "Share of Voice",
                              )
                            }
                            className={cn("min-w-0", "flex-1")}
                          >
                            <DynamicChartRenderer chart={byId.share_of_voice} />
                          </SenseCard>
                        )}
                      </div>

                      {byId.pr_impact && (
                        <>
                          <div
                            className={cn("h-px", "w-full")}
                            style={{ backgroundColor: "var(--sense-hairline)" }}
                          />
                          <SenseCard
                            title={byId.pr_impact.title || "PR Impact Scale"}
                            snippet={
                              byId.pr_impact.description ||
                              "PR Impact score performance."
                            }
                            analysis={analysisOf ? analysisOf("pr_impact") : ""}
                            onOpenAnalysis={() =>
                              handleOpenAnalysis(
                                "pr_impact",
                                byId.pr_impact.title || "PR Impact Scale",
                              )
                            }
                          >
                            <DynamicChartRenderer chart={byId.pr_impact} />
                          </SenseCard>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      {/* Media Measurement Overview */}
                      <div
                        className={cn("flex", "items-stretch", "gap-[10px]")}
                      >
                        <SenseCard
                          title={coverageChart?.title || detail.area.title}
                          snippet={
                            coverageChart?.description ||
                            detail.area.description
                          }
                          footer={
                            ins ? ins("datewise_coverage") : detail.area.caption
                          }
                          analysis={
                            analysisOf ? analysisOf("datewise_coverage") : ""
                          }
                          onOpenAnalysis={() =>
                            handleOpenAnalysis(
                              "datewise_coverage",
                              coverageChart?.title || "Coverage Over Time",
                            )
                          }
                          className={cn("min-w-0", "flex-1")}
                        >
                          {coverageChart?.data ? (
                            <div className="w-full">
                              <ShadcnAnimatedLineChart
                                chart={coverageChart}
                                dateInsights={coverageDateInsights}
                              />
                            </div>
                          ) : (
                            <CoverageLineChart data={detail.area} />
                          )}
                        </SenseCard>
                        <div className={cn("w-[320px]", "shrink-0")}>
                          <ExecSummaryCard
                            summary={detail.executiveSummary}
                            bgImage={openerBgImage || detail?.summary?.cover}
                          />
                        </div>
                      </div>

                      <div
                        className={cn("h-px", "w-full")}
                        style={{ backgroundColor: "var(--sense-hairline)" }}
                      />

                      <div
                        className={cn("flex", "items-stretch", "gap-[10px]")}
                      >
                        <SenseCard
                          title="Theme Distribution"
                          snippet="Top themes by volume of articles."
                          footer={detail.themeCaption}
                          analysis={
                            analysisOf ? analysisOf("theme_distribution") : ""
                          }
                          onOpenAnalysis={() =>
                            handleOpenAnalysis(
                              "theme_distribution",
                              theme?.title || "Theme Distribution",
                            )
                          }
                          className={cn("min-w-0", "flex-1")}
                        >
                          <div
                            className={cn(
                              "flex",
                              "min-h-[360px]",
                              "w-full",
                              "items-center",
                              "justify-center",
                            )}
                          >
                            <ThemeDistributionChart
                              data={detail.themeDistribution}
                            />
                          </div>
                        </SenseCard>

                        <SenseCard
                          title="Sentiment Breakdown"
                          snippet="Positive, negative, neutral share of coverage."
                          footer={detail.sentiment.caption}
                          analysis={
                            analysisOf
                              ? analysisOf("sentiment_distribution")
                              : ""
                          }
                          onOpenAnalysis={() =>
                            handleOpenAnalysis(
                              "sentiment_distribution",
                              sentiment?.title || "Sentiment Breakdown",
                            )
                          }
                          className={cn("min-w-0", "flex-1")}
                        >
                          <div
                            className={cn(
                              "flex",
                              "min-h-[360px]",
                              "w-full",
                              "items-center",
                              "justify-center",
                            )}
                          >
                            <SentimentDonut data={detail.sentiment} />
                          </div>
                        </SenseCard>
                      </div>

                      <div
                        className={cn("h-px", "w-full")}
                        style={{ backgroundColor: "var(--sense-hairline)" }}
                      />

                      <SenseCard
                        title="Original vs Syndicated"
                        snippet="Share of original articles versus syndicated copies."
                        footer={detail.originalSyndicated.caption}
                        analysis={
                          analysisOf ? analysisOf("original_vs_syndicated") : ""
                        }
                        onOpenAnalysis={() =>
                          handleOpenAnalysis(
                            "original_vs_syndicated",
                            syndication?.title || "Original vs Syndicated",
                          )
                        }
                      >
                        <OriginalSyndicatedDonut
                          data={detail.originalSyndicated}
                        />
                      </SenseCard>
                    </>
                  )}
                </>
              )}

              {/* ── NARRATIVE INTELLIGENCE TABS ── */}
              {isNarrative && !isOverviewTab && (
                <>
                  {/* Coverage Tab */}
                  {isCoverageTab && formattedCoverageChart && (
                    <SenseCard
                      title={
                        formattedCoverageChart.title ||
                        "Coverage Over Time by Competitors"
                      }
                      snippet={
                        formattedCoverageChart.description ||
                        "Comparative daily volume trends across brands."
                      }
                      analysis={
                        analysisOf
                          ? analysisOf("coverage_overtime_by_competitors")
                          : ""
                      }
                      onOpenAnalysis={() =>
                        handleOpenAnalysis(
                          "coverage_overtime_by_competitors",
                          formattedCoverageChart.title || "Coverage Over Time",
                        )
                      }
                    >
                      <div className="w-full">
                        <ShadcnAnimatedLineChart
                          chart={formattedCoverageChart}
                          dateInsights={
                            dateIns
                              ? dateIns("coverage_overtime_by_competitors")
                              : []
                          }
                        />
                      </div>
                    </SenseCard>
                  )}

                  {/* Sentiment Tab */}
                  {isSentimentTab && formattedSentimentChart && (
                    <SenseCard
                      title={
                        formattedSentimentChart.title ||
                        "Sentiment Breakdown by Competitors"
                      }
                      snippet={
                        formattedSentimentChart.description ||
                        "Comparison of sentiment splits across brands."
                      }
                      analysis={
                        analysisOf
                          ? analysisOf("sentiment_breakdown_by_competitors")
                          : ""
                      }
                      onOpenAnalysis={() =>
                        handleOpenAnalysis(
                          "sentiment_breakdown_by_competitors",
                          formattedSentimentChart.title ||
                            "Sentiment Breakdown",
                        )
                      }
                    >
                      <DynamicChartRenderer chart={formattedSentimentChart} />
                    </SenseCard>
                  )}

                  {/* Message Consistency Tab */}
                  {isConsistencyTab && (
                    <>
                      {byId.message_consistency && (
                        <SenseCard
                          title={
                            byId.message_consistency.title ||
                            "Message Consistency"
                          }
                          snippet={
                            byId.message_consistency.description ||
                            "Current message pull-through across key messaging pillars."
                          }
                          analysis={
                            analysisOf ? analysisOf("message_consistency") : ""
                          }
                          onOpenAnalysis={() =>
                            handleOpenAnalysis(
                              "message_consistency",
                              byId.message_consistency.title ||
                                "Message Consistency",
                            )
                          }
                        >
                          <DynamicChartRenderer
                            chart={byId.message_consistency}
                          />
                        </SenseCard>
                      )}
                      {formattedConsistencyTimeChart && (
                        <>
                          <div
                            className={cn("h-px", "w-full")}
                            style={{ backgroundColor: "var(--sense-hairline)" }}
                          />
                          <SenseCard
                            title={
                              formattedConsistencyTimeChart.title ||
                              "Message Consistency Over Time"
                            }
                            snippet={
                              formattedConsistencyTimeChart.description ||
                              "Daily narrative consistency percentage by brand."
                            }
                            analysis={
                              analysisOf
                                ? analysisOf("coverage_message_consistency")
                                : ""
                            }
                            onOpenAnalysis={() =>
                              handleOpenAnalysis(
                                "coverage_message_consistency",
                                formattedConsistencyTimeChart.title ||
                                  "Message Consistency Over Time",
                              )
                            }
                          >
                            <div className="w-full">
                              <ShadcnAnimatedLineChart
                                chart={formattedConsistencyTimeChart}
                                dateInsights={
                                  dateIns
                                    ? dateIns("coverage_message_consistency")
                                    : []
                                }
                              />
                            </div>
                          </SenseCard>
                        </>
                      )}
                    </>
                  )}

                  {/* Channels & Publications Tab */}
                  {isChannelsTab && (
                    <>
                      {byId.publication_by_brands_and_competitors && (
                        <SenseCard
                          title={
                            byId.publication_by_brands_and_competitors.title ||
                            "Publication Reach by Brand"
                          }
                          snippet={
                            byId.publication_by_brands_and_competitors
                              .description ||
                            "Article distribution by top publications for each brand."
                          }
                          analysis={
                            analysisOf
                              ? analysisOf(
                                  "publication_by_brands_and_competitors",
                                )
                              : ""
                          }
                          onOpenAnalysis={() =>
                            handleOpenAnalysis(
                              "publication_by_brands_and_competitors",
                              "Publication Reach by Brand",
                            )
                          }
                        >
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 12,
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                gap: 8,
                                flexWrap: "wrap",
                              }}
                            >
                              {brandsList.map((b) => (
                                <button
                                  key={b}
                                  type="button"
                                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${activeBrand === b ? "bg-slate-900 text-white border-slate-900" : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"}`}
                                  onClick={() => setSelectedBrandState(b)}
                                >
                                  {b}
                                </button>
                              ))}
                            </div>
                            <DynamicChartRenderer chart={selectedBrandChart} />
                          </div>
                        </SenseCard>
                      )}
                      {byId.media_types_by_competitors && (
                        <>
                          <div
                            className={cn("h-px", "w-full")}
                            style={{ backgroundColor: "var(--sense-hairline)" }}
                          />
                          <SenseCard
                            title={
                              byId.media_types_by_competitors.title ||
                              "Media Types by Competitors"
                            }
                            snippet={
                              byId.media_types_by_competitors.description ||
                              "Distribution across print, online, broadcast and social media."
                            }
                            analysis={
                              analysisOf
                                ? analysisOf("media_types_by_competitors")
                                : ""
                            }
                            onOpenAnalysis={() =>
                              handleOpenAnalysis(
                                "media_types_by_competitors",
                                byId.media_types_by_competitors.title ||
                                  "Media Types",
                              )
                            }
                          >
                            <DynamicChartRenderer
                              chart={byId.media_types_by_competitors}
                            />
                          </SenseCard>
                        </>
                      )}
                    </>
                  )}

                  {/* Fallback Key Narratives Tab */}
                  {(isNarrativesTab ||
                    (!isCoverageTab &&
                      !isSentimentTab &&
                      !isConsistencyTab &&
                      !isChannelsTab)) && (
                    <>
                      <TopNarrativesList narratives={detail.topNarratives} />
                      {byId.message_consistency && (
                        <>
                          <div
                            className={cn("h-px", "w-full")}
                            style={{ backgroundColor: "var(--sense-hairline)" }}
                          />
                          <SenseCard
                            title={
                              byId.message_consistency.title ||
                              "Message Consistency"
                            }
                            snippet={
                              byId.message_consistency.description ||
                              "Alignment across key strategic narratives."
                            }
                            analysis={
                              analysisOf
                                ? analysisOf("message_consistency")
                                : ""
                            }
                            onOpenAnalysis={() =>
                              handleOpenAnalysis(
                                "message_consistency",
                                byId.message_consistency.title ||
                                  "Message Consistency",
                              )
                            }
                          >
                            <DynamicChartRenderer
                              chart={byId.message_consistency}
                            />
                          </SenseCard>
                        </>
                      )}
                    </>
                  )}
                </>
              )}

              {/* ── PR IMPACT TABS ── */}
              {isPRImpact && !isOverviewTab && (
                <>
                  {/* Coverage & Sentiment Tab */}
                  {(isCoverageTab ||
                    (isSentimentTab &&
                      !normalizedTab.includes("voice") &&
                      !normalizedTab.includes("sov"))) && (
                    <>
                      {coverageChart && (
                        <SenseCard
                          title={coverageChart.title || "Coverage Over Time"}
                          snippet={
                            coverageChart.description || "Daily article volume."
                          }
                          analysis={
                            analysisOf ? analysisOf("datewise_coverage") : ""
                          }
                          onOpenAnalysis={() =>
                            handleOpenAnalysis(
                              "datewise_coverage",
                              coverageChart.title || "Coverage Over Time",
                            )
                          }
                        >
                          <div className="w-full">
                            <ShadcnAnimatedLineChart
                              chart={coverageChart}
                              dateInsights={coverageDateInsights}
                            />
                          </div>
                        </SenseCard>
                      )}
                      <div
                        className={cn("h-px", "w-full")}
                        style={{ backgroundColor: "var(--sense-hairline)" }}
                      />
                      <SenseCard
                        title="Sentiment Breakdown"
                        snippet="Positive, negative, neutral share of coverage."
                        footer={detail.sentiment.caption}
                        analysis={
                          analysisOf ? analysisOf("sentiment_distribution") : ""
                        }
                        onOpenAnalysis={() =>
                          handleOpenAnalysis(
                            "sentiment_distribution",
                            "Sentiment Breakdown",
                          )
                        }
                      >
                        <div
                          className={cn(
                            "flex",
                            "min-h-[360px]",
                            "w-full",
                            "items-center",
                            "justify-center",
                          )}
                        >
                          <SentimentDonut data={detail.sentiment} />
                        </div>
                      </SenseCard>
                    </>
                  )}

                  {/* Share of Voice Tab */}
                  {(normalizedTab.includes("voice") ||
                    normalizedTab.includes("sov")) && (
                    <>
                      {byId.share_of_voice && (
                        <SenseCard
                          title={byId.share_of_voice.title || "Share of Voice"}
                          snippet={
                            byId.share_of_voice.description ||
                            "Volume breakdown vs key industry competitors."
                          }
                          analysis={
                            analysisOf ? analysisOf("share_of_voice") : ""
                          }
                          onOpenAnalysis={() =>
                            handleOpenAnalysis(
                              "share_of_voice",
                              byId.share_of_voice.title || "Share of Voice",
                            )
                          }
                        >
                          <DynamicChartRenderer chart={byId.share_of_voice} />
                        </SenseCard>
                      )}
                      {byId.publication_tier && (
                        <>
                          <div
                            className={cn("h-px", "w-full")}
                            style={{ backgroundColor: "var(--sense-hairline)" }}
                          />
                          <SenseCard
                            title={
                              byId.publication_tier.title ||
                              "Publication Tier Distribution"
                            }
                            snippet={
                              byId.publication_tier.description ||
                              "Breakdown across Tier 1, Tier 2, and Tier 3 media outlets."
                            }
                            analysis={
                              analysisOf ? analysisOf("publication_tier") : ""
                            }
                            onOpenAnalysis={() =>
                              handleOpenAnalysis(
                                "publication_tier",
                                byId.publication_tier.title ||
                                  "Publication Tier",
                              )
                            }
                          >
                            <DynamicChartRenderer
                              chart={byId.publication_tier}
                            />
                          </SenseCard>
                        </>
                      )}
                    </>
                  )}

                  {/* PR Impact Score Tab */}
                  {normalizedTab.includes("impact") &&
                    !normalizedTab.includes("competitor") && (
                      <>
                        {prImpactScoreChart ? (
                          <SenseCard
                            title={
                              prImpactScoreChart.title || "PR Score Over Time"
                            }
                            snippet={
                              prImpactScoreChart.description ||
                              "Daily PR impact and article volume, with overall gauge and rating scale."
                            }
                            footer={ins ? ins("pr_impact") : undefined}
                            analysis={analysisOf ? analysisOf("pr_impact") : ""}
                            onOpenAnalysis={() =>
                              handleOpenAnalysis(
                                "pr_impact",
                                prImpactScoreChart.title ||
                                  "PR Score Over Time",
                              )
                            }
                          >
                            <DynamicChartRenderer chart={prImpactScoreChart} />
                          </SenseCard>
                        ) : (
                          <div
                            className={cn(
                              "flex",
                              "items-stretch",
                              "gap-[10px]",
                            )}
                          >
                            <SenseCard
                              title="PR Impact Score"
                              snippet="Composite prominence, reach and message pull-through."
                              analysis={
                                analysisOf ? analysisOf("pr_impact") : ""
                              }
                              onOpenAnalysis={() =>
                                handleOpenAnalysis(
                                  "pr_impact",
                                  "PR Impact Score",
                                )
                              }
                              className={cn("min-w-0", "flex-1")}
                            >
                              <ReachGauge
                                value={detail.prImpactScore}
                                centerValue={detail.prImpactScore}
                                label="PR Impact"
                              />
                            </SenseCard>
                          </div>
                        )}

                        {prComparisonChart && (
                          <>
                            <div
                              className={cn("h-px", "w-full")}
                              style={{
                                backgroundColor: "var(--sense-hairline)",
                              }}
                            />
                            <SenseCard
                              title={prComparisonChart.title || "PR Comparison"}
                              snippet={
                                prComparisonChart.description ||
                                "Brand performance vs competitors"
                              }
                              analysis={
                                analysisOf ? analysisOf("merged_pr_impact") : ""
                              }
                              onOpenAnalysis={() =>
                                handleOpenAnalysis(
                                  "merged_pr_impact",
                                  prComparisonChart.title || "PR Comparison",
                                )
                              }
                            >
                              <DynamicChartRenderer chart={prComparisonChart} />
                            </SenseCard>
                          </>
                        )}
                      </>
                    )}

                  {/* Competitive / Competitor Tab */}
                  {(normalizedTab.includes("competitor") ||
                    normalizedTab.includes("competitive")) && (
                    <>
                      {/* {byId.pr_impact_competitors && (
                        <SenseCard
                          title={
                            byId.pr_impact_competitors.title ||
                            "PR Impact Trend vs Competitors"
                          }
                          snippet={
                            byId.pr_impact_competitors.description ||
                            "Weekly impact score comparison."
                          }
                          analysis={
                            analysisOf
                              ? analysisOf("pr_impact_competitors")
                              : ""
                          }
                          onOpenAnalysis={() =>
                            handleOpenAnalysis(
                              "pr_impact_competitors",
                              "PR Impact vs Competitors",
                            )
                          }
                        >
                          <DynamicChartRenderer
                            chart={byId.pr_impact_competitors}
                          />
                        </SenseCard>
                      )} */}
                      {byId.competitive_matrix && (
                        <>
                          <div
                            className={cn("h-px", "w-full")}
                            style={{ backgroundColor: "var(--sense-hairline)" }}
                          />
                          <SenseCard
                            title={
                              byId.competitive_matrix.title ||
                              "Competitive Positioning Matrix"
                            }
                            snippet={
                              byId.competitive_matrix.description ||
                              "Reach vs Sentiment positioning against competitors."
                            }
                            analysis={
                              analysisOf ? analysisOf("competitive_matrix") : ""
                            }
                            onOpenAnalysis={() =>
                              handleOpenAnalysis(
                                "competitive_matrix",
                                "Competitive Matrix",
                              )
                            }
                          >
                            <DynamicChartRenderer
                              chart={byId.competitive_matrix}
                            />
                          </SenseCard>
                        </>
                      )}
                      {byId.publication_tier && (
                        <>
                          <div
                            className={cn("h-px", "w-full")}
                            style={{ backgroundColor: "var(--sense-hairline)" }}
                          />
                          <SenseCard
                            title={
                              byId.publication_tier.title ||
                              "Publication Tier Distribution"
                            }
                            snippet={
                              byId.publication_tier.description ||
                              "Breakdown across Tier 1, Tier 2, and Tier 3 media outlets."
                            }
                            analysis={
                              analysisOf ? analysisOf("publication_tier") : ""
                            }
                            onOpenAnalysis={() =>
                              handleOpenAnalysis(
                                "publication_tier",
                                "Publication Tier",
                              )
                            }
                          >
                            <DynamicChartRenderer
                              chart={byId.publication_tier}
                            />
                          </SenseCard>
                        </>
                      )}
                    </>
                  )}
                </>
              )}

              {/* ── REPUTATION INDEX TABS ── */}
              {isReputation && !isOverviewTab && (
                <>
                  {/* Pillar Analysis Tab */}
                  {normalizedTab.includes("pillar") && (
                    <>
                      <div
                        className={cn("flex", "items-stretch", "gap-[10px]")}
                      >
                        {byId.pillar_radar && (
                          <SenseCard
                            title={byId.pillar_radar.title || "Pillar Radar"}
                            snippet={
                              byId.pillar_radar.description ||
                              "Reputation strength across key pillars."
                            }
                            analysis={
                              analysisOf ? analysisOf("pillar_radar") : ""
                            }
                            onOpenAnalysis={() =>
                              handleOpenAnalysis(
                                "pillar_radar",
                                byId.pillar_radar.title || "Pillar Radar",
                              )
                            }
                            className={cn("min-w-0", "flex-1")}
                          >
                            <DynamicChartRenderer chart={byId.pillar_radar} />
                          </SenseCard>
                        )}
                        {byId.pillar_bar && (
                          <SenseCard
                            title={
                              byId.pillar_bar.title || "Pillar Performance Bar"
                            }
                            snippet={
                              byId.pillar_bar.description ||
                              "Individual pillar scores."
                            }
                            analysis={
                              analysisOf ? analysisOf("pillar_bar") : ""
                            }
                            onOpenAnalysis={() =>
                              handleOpenAnalysis(
                                "pillar_bar",
                                byId.pillar_bar.title || "Pillar Performance",
                              )
                            }
                            className={cn("min-w-0", "flex-1")}
                          >
                            <DynamicChartRenderer chart={byId.pillar_bar} />
                          </SenseCard>
                        )}
                      </div>
                      {repPillarsChart && (
                        <>
                          <div
                            className={cn("h-px", "w-full")}
                            style={{ backgroundColor: "var(--sense-hairline)" }}
                          />
                          <SenseCard
                            title={
                              repPillarsChart.title || "Pillar Small Multiples"
                            }
                            snippet={
                              repPillarsChart.description ||
                              "Pillar trends over time."
                            }
                            analysis={
                              analysisOf
                                ? analysisOf("pillar_small_multiples")
                                : ""
                            }
                            onOpenAnalysis={() =>
                              handleOpenAnalysis(
                                "pillar_small_multiples",
                                "Pillar Small Multiples",
                              )
                            }
                          >
                            <DynamicChartRenderer chart={repPillarsChart} />
                          </SenseCard>
                        </>
                      )}
                    </>
                  )}

                  {/* Trust & Sentiment Tab */}
                  {(normalizedTab.includes("trust") ||
                    (isSentimentTab &&
                      !normalizedTab.includes("pillar") &&
                      !normalizedTab.includes("risk"))) && (
                    <>
                      <div
                        className={cn("flex", "items-stretch", "gap-[10px]")}
                      >
                        {byId.trust_kpi_breakdown && (
                          <SenseCard
                            title={
                              byId.trust_kpi_breakdown.title ||
                              "Trust KPI Breakdown"
                            }
                            snippet={
                              byId.trust_kpi_breakdown.description ||
                              "Individual trust component metrics."
                            }
                            analysis={
                              analysisOf
                                ? analysisOf("trust_kpi_breakdown")
                                : ""
                            }
                            onOpenAnalysis={() =>
                              handleOpenAnalysis(
                                "trust_kpi_breakdown",
                                "Trust KPI Breakdown",
                              )
                            }
                            className={cn("min-w-0", "flex-1")}
                          >
                            <DynamicChartRenderer
                              chart={byId.trust_kpi_breakdown}
                            />
                          </SenseCard>
                        )}
                        {byId.trust_waterfall && (
                          <SenseCard
                            title={
                              byId.trust_waterfall.title || "Trust Waterfall"
                            }
                            snippet={
                              byId.trust_waterfall.description ||
                              "Waterfall breakdown of trust score."
                            }
                            analysis={
                              analysisOf ? analysisOf("trust_waterfall") : ""
                            }
                            onOpenAnalysis={() =>
                              handleOpenAnalysis(
                                "trust_waterfall",
                                "Trust Waterfall",
                              )
                            }
                            className={cn("min-w-0", "flex-1")}
                          >
                            <DynamicChartRenderer
                              chart={byId.trust_waterfall}
                            />
                          </SenseCard>
                        )}
                      </div>
                      {(byId.sentiment_coverage ||
                        byId.net_sentiment_coverage) && (
                        <>
                          <div
                            className={cn("h-px", "w-full")}
                            style={{ backgroundColor: "var(--sense-hairline)" }}
                          />
                          <div
                            className={cn(
                              "flex",
                              "items-stretch",
                              "gap-[10px]",
                            )}
                          >
                            {byId.sentiment_coverage && (
                              <SenseCard
                                title={
                                  byId.sentiment_coverage.title ||
                                  "Sentiment Coverage"
                                }
                                snippet={
                                  byId.sentiment_coverage.description ||
                                  "Volume of positive vs negative coverage."
                                }
                                analysis={
                                  analysisOf
                                    ? analysisOf("sentiment_coverage")
                                    : ""
                                }
                                onOpenAnalysis={() =>
                                  handleOpenAnalysis(
                                    "sentiment_coverage",
                                    "Sentiment Coverage",
                                  )
                                }
                                className={cn("min-w-0", "flex-1")}
                              >
                                <DynamicChartRenderer
                                  chart={byId.sentiment_coverage}
                                />
                              </SenseCard>
                            )}
                            {byId.net_sentiment_coverage && (
                              <SenseCard
                                title={
                                  byId.net_sentiment_coverage.title ||
                                  "Net Sentiment Trajectory"
                                }
                                snippet={
                                  byId.net_sentiment_coverage.description ||
                                  "Net sentiment score trend."
                                }
                                analysis={
                                  analysisOf
                                    ? analysisOf("net_sentiment_coverage")
                                    : ""
                                }
                                onOpenAnalysis={() =>
                                  handleOpenAnalysis(
                                    "net_sentiment_coverage",
                                    "Net Sentiment",
                                  )
                                }
                                className={cn("min-w-0", "flex-1")}
                              >
                                <DynamicChartRenderer
                                  chart={byId.net_sentiment_coverage}
                                />
                              </SenseCard>
                            )}
                          </div>
                        </>
                      )}
                    </>
                  )}

                  {/* Media Coverage Tab */}
                  {isCoverageTab && (
                    <>
                      <div
                        className={cn("flex", "items-stretch", "gap-[10px]")}
                      >
                        {byId.coverage_volume && (
                          <SenseCard
                            title={
                              byId.coverage_volume.title || "Coverage Volume"
                            }
                            snippet={
                              byId.coverage_volume.description ||
                              "Total reputation-linked coverage."
                            }
                            analysis={
                              analysisOf ? analysisOf("coverage_volume") : ""
                            }
                            onOpenAnalysis={() =>
                              handleOpenAnalysis(
                                "coverage_volume",
                                "Coverage Volume",
                              )
                            }
                            className={cn("min-w-0", "flex-1")}
                          >
                            <DynamicChartRenderer
                              chart={byId.coverage_volume}
                            />
                          </SenseCard>
                        )}
                        {byId.tier1_share && (
                          <SenseCard
                            title={
                              byId.tier1_share.title || "Tier 1 Media Share"
                            }
                            snippet={
                              byId.tier1_share.description ||
                              "Proportion of coverage in top-tier publications."
                            }
                            analysis={
                              analysisOf ? analysisOf("tier1_share") : ""
                            }
                            onOpenAnalysis={() =>
                              handleOpenAnalysis("tier1_share", "Tier 1 Share")
                            }
                            className={cn("min-w-0", "flex-1")}
                          >
                            <DynamicChartRenderer chart={byId.tier1_share} />
                          </SenseCard>
                        )}
                      </div>
                      {(byId.source_treemap || byId.theme_volume) && (
                        <>
                          <div
                            className={cn("h-px", "w-full")}
                            style={{ backgroundColor: "var(--sense-hairline)" }}
                          />
                          <div
                            className={cn(
                              "flex",
                              "items-stretch",
                              "gap-[10px]",
                            )}
                          >
                            {byId.source_treemap && (
                              <SenseCard
                                title={
                                  byId.source_treemap.title ||
                                  "Media Source Treemap"
                                }
                                snippet={
                                  byId.source_treemap.description ||
                                  "Source composition of coverage."
                                }
                                analysis={
                                  analysisOf ? analysisOf("source_treemap") : ""
                                }
                                onOpenAnalysis={() =>
                                  handleOpenAnalysis(
                                    "source_treemap",
                                    "Source Treemap",
                                  )
                                }
                                className={cn("min-w-0", "flex-1")}
                              >
                                <DynamicChartRenderer
                                  chart={byId.source_treemap}
                                />
                              </SenseCard>
                            )}
                            {byId.theme_volume && (
                              <SenseCard
                                title={
                                  byId.theme_volume.title || "Theme Volume"
                                }
                                snippet={
                                  byId.theme_volume.description ||
                                  "Volume breakdown by topic."
                                }
                                analysis={
                                  analysisOf ? analysisOf("theme_volume") : ""
                                }
                                onOpenAnalysis={() =>
                                  handleOpenAnalysis(
                                    "theme_volume",
                                    "Theme Volume",
                                  )
                                }
                                className={cn("min-w-0", "flex-1")}
                              >
                                <DynamicChartRenderer
                                  chart={byId.theme_volume}
                                />
                              </SenseCard>
                            )}
                          </div>
                        </>
                      )}
                      {byId.theme_pillar_heatmap && (
                        <>
                          <div
                            className={cn("h-px", "w-full")}
                            style={{ backgroundColor: "var(--sense-hairline)" }}
                          />
                          <SenseCard
                            title={
                              byId.theme_pillar_heatmap.title ||
                              "Theme vs Pillar Heatmap"
                            }
                            snippet={
                              byId.theme_pillar_heatmap.description ||
                              "Alignment between coverage themes and reputation pillars."
                            }
                            analysis={
                              analysisOf
                                ? analysisOf("theme_pillar_heatmap")
                                : ""
                            }
                            onOpenAnalysis={() =>
                              handleOpenAnalysis(
                                "theme_pillar_heatmap",
                                "Theme-Pillar Heatmap",
                              )
                            }
                          >
                            <DynamicChartRenderer
                              chart={byId.theme_pillar_heatmap}
                            />
                          </SenseCard>
                        </>
                      )}
                    </>
                  )}

                  {/* Risk & Sensitivity Tab */}
                  {(normalizedTab.includes("risk") ||
                    normalizedTab.includes("sensitivity") ||
                    normalizedTab.includes("decomposition")) && (
                    <>
                      <div
                        className={cn("flex", "items-stretch", "gap-[10px]")}
                      >
                        {byId.risk_negative_coverage && (
                          <SenseCard
                            title={
                              byId.risk_negative_coverage.title ||
                              "Risk & Negative Coverage"
                            }
                            snippet={
                              byId.risk_negative_coverage.description ||
                              "Tracking critical and risk-prone reporting."
                            }
                            analysis={
                              analysisOf
                                ? analysisOf("risk_negative_coverage")
                                : ""
                            }
                            onOpenAnalysis={() =>
                              handleOpenAnalysis(
                                "risk_negative_coverage",
                                "Risk Coverage",
                              )
                            }
                            className={cn("min-w-0", "flex-1")}
                          >
                            <DynamicChartRenderer
                              chart={byId.risk_negative_coverage}
                            />
                          </SenseCard>
                        )}
                        {byId.weight_sensitivity && (
                          <SenseCard
                            title={
                              byId.weight_sensitivity.title ||
                              "Weight Sensitivity Analysis"
                            }
                            snippet={
                              byId.weight_sensitivity.description ||
                              "Sensitivity of overall score to individual pillar weightings."
                            }
                            analysis={
                              analysisOf ? analysisOf("weight_sensitivity") : ""
                            }
                            onOpenAnalysis={() =>
                              handleOpenAnalysis(
                                "weight_sensitivity",
                                "Weight Sensitivity",
                              )
                            }
                            className={cn("min-w-0", "flex-1")}
                          >
                            <DynamicChartRenderer
                              chart={byId.weight_sensitivity}
                            />
                          </SenseCard>
                        )}
                      </div>
                      {repDecompChart && (
                        <>
                          <div
                            className={cn("h-px", "w-full")}
                            style={{ backgroundColor: "var(--sense-hairline)" }}
                          />
                          <SenseCard
                            title={
                              repDecompChart.title ||
                              "Reputation Score Decomposition"
                            }
                            snippet={
                              repDecompChart.description ||
                              "Contribution of individual drivers to overall score."
                            }
                            analysis={
                              analysisOf
                                ? analysisOf("reputation_decomposition")
                                : ""
                            }
                            onOpenAnalysis={() =>
                              handleOpenAnalysis(
                                "reputation_decomposition",
                                "Score Decomposition",
                              )
                            }
                          >
                            <DynamicChartRenderer chart={repDecompChart} />
                          </SenseCard>
                        </>
                      )}
                    </>
                  )}
                </>
              )}

              {/* ── MEDIA MEASUREMENT TABS (DEFAULT) ── */}
              {!isNarrative &&
                !isPRImpact &&
                !isReputation &&
                !isOverviewTab && (
                  <>
                    {/* Sentiment Analysis Tab */}
                    {isSentimentTab && (
                      <>
                        <div
                          className={cn("flex", "items-stretch", "gap-[10px]")}
                        >
                          <SenseCard
                            title="Sentiment Breakdown"
                            snippet="Positive, negative, neutral share of coverage."
                            footer={detail.sentiment.caption}
                            analysis={
                              analysisOf
                                ? analysisOf("sentiment_distribution")
                                : ""
                            }
                            onOpenAnalysis={() =>
                              handleOpenAnalysis(
                                "sentiment_distribution",
                                "Sentiment Breakdown",
                              )
                            }
                            className={cn("min-w-0", "w-full")}
                          >
                            <div
                              className={cn(
                                "flex",
                                "min-h-[360px]",
                                "w-full",
                                "items-center",
                                "justify-center",
                              )}
                            >
                              <SentimentDonut data={detail.sentiment} />
                            </div>
                          </SenseCard>
                        </div>

                        {sentimentOverTimeChart && (
                          <>
                            <div
                              className={cn("h-px", "w-full")}
                              style={{
                                backgroundColor: "var(--sense-hairline)",
                              }}
                            />
                            <SenseCard
                              title={
                                sentimentOverTimeChart.title ||
                                "Sentiment Over Time"
                              }
                              snippet={
                                sentimentOverTimeChart.description ||
                                "Daily positive / neutral / negative coverage split."
                              }
                              footer={
                                ins
                                  ? ins("sentiment_distribution")
                                  : detail.sentiment.caption
                              }
                              analysis={
                                analysisOf
                                  ? analysisOf("sentiment_distribution")
                                  : ""
                              }
                              onOpenAnalysis={() =>
                                handleOpenAnalysis(
                                  "sentiment_distribution",
                                  sentimentOverTimeChart.title ||
                                    "Sentiment Over Time",
                                )
                              }
                              className={cn("min-w-0", "flex-1")}
                            >
                              <div className="w-full">
                                <ShadcnAnimatedAreaChart
                                  chart={sentimentOverTimeChart}
                                  dateInsights={sentimentDateInsights}
                                />
                              </div>
                            </SenseCard>
                          </>
                        )}
                      </>
                    )}

                    {/* Themes & Topics Tab */}
                    {isThemeTab && (
                      <>
                        <SenseCard
                          title="Theme Distribution"
                          snippet="Top themes by volume of articles."
                          footer={detail.themeCaption}
                          analysis={
                            analysisOf ? analysisOf("theme_distribution") : ""
                          }
                          onOpenAnalysis={() =>
                            handleOpenAnalysis(
                              "theme_distribution",
                              theme?.title || "Theme Distribution",
                            )
                          }
                        >
                          <div
                            className={cn(
                              "flex",
                              "min-h-[360px]",
                              "w-full",
                              "items-center",
                              "justify-center",
                            )}
                          >
                            <ThemeDistributionChart
                              data={detail.themeDistribution}
                            />
                          </div>
                        </SenseCard>

                        <div
                          className={cn("h-px", "w-full")}
                          style={{ backgroundColor: "var(--sense-hairline)" }}
                        />

                        <ThemeExplorer
                          variant="positive"
                          subtitle="What drove favourable coverage this period."
                          themes={detail.themes}
                        />

                        <div
                          className={cn("h-px", "w-full")}
                          style={{ backgroundColor: "var(--sense-hairline)" }}
                        />

                        <ThemeExplorer
                          variant="negative"
                          subtitle="Where coverage turned critical this period."
                          themes={detail.negativeThemes}
                        />
                      </>
                    )}

                    {/* Media Coverage Tab */}
                    {isCoverageTab && (
                      <>
                        {byId.top_publications && (
                          <SenseCard
                            title={
                              byId.top_publications.title || "Top Publications"
                            }
                            snippet={
                              byId.top_publications.description ||
                              "Publications ranked by volume."
                            }
                            analysis={
                              analysisOf ? analysisOf("top_publications") : ""
                            }
                            onOpenAnalysis={() =>
                              handleOpenAnalysis(
                                "top_publications",
                                "Top Publications",
                              )
                            }
                            className="w-full"
                          >
                            <ThemeDistributionChart
                              data={
                                byId.top_publications?.data ||
                                byId.top_publications
                              }
                            />
                          </SenseCard>
                        )}
                        {byId.publication_reach_sentiment && (
                          <>
                            {byId.top_publications && (
                              <div
                                className={cn("h-px", "w-full")}
                                style={{
                                  backgroundColor: "var(--sense-hairline)",
                                }}
                              />
                            )}
                            <SenseCard
                              title={
                                byId.publication_reach_sentiment.title ||
                                "Publication Reach vs Sentiment"
                              }
                              snippet={
                                byId.publication_reach_sentiment.description ||
                                "Outlet authority and sentiment positioning."
                              }
                              analysis={
                                analysisOf
                                  ? analysisOf("publication_reach_sentiment")
                                  : ""
                              }
                              onOpenAnalysis={() =>
                                handleOpenAnalysis(
                                  "publication_reach_sentiment",
                                  "Publication Reach vs Sentiment",
                                )
                              }
                              className="w-full"
                            >
                              <DynamicChartRenderer
                                chart={byId.publication_reach_sentiment}
                              />
                            </SenseCard>
                          </>
                        )}
                        {byId.publish_time_heatmap && (
                          <>
                            {(byId.top_publications ||
                              byId.publication_reach_sentiment) && (
                              <div
                                className={cn("h-px", "w-full")}
                                style={{
                                  backgroundColor: "var(--sense-hairline)",
                                }}
                              />
                            )}
                            <SenseCard
                              title={
                                byId.publish_time_heatmap.title ||
                                "Publishing Time Heatmap"
                              }
                              snippet={
                                byId.publish_time_heatmap.description ||
                                "Coverage distribution by hour and day."
                              }
                              analysis={
                                analysisOf
                                  ? analysisOf("publish_time_heatmap")
                                  : ""
                              }
                              onOpenAnalysis={() =>
                                handleOpenAnalysis(
                                  "publish_time_heatmap",
                                  "Publishing Time Heatmap",
                                )
                              }
                              className="w-full"
                            >
                              <DynamicChartRenderer
                                chart={byId.publish_time_heatmap}
                              />
                            </SenseCard>
                          </>
                        )}
                        {byId.top_authors_by_publications && (
                          <>
                            {(byId.top_publications ||
                              byId.publication_reach_sentiment ||
                              byId.publish_time_heatmap) && (
                              <div
                                className={cn("h-px", "w-full")}
                                style={{
                                  backgroundColor: "var(--sense-hairline)",
                                }}
                              />
                            )}
                            <SenseCard
                              title={
                                byId.top_authors_by_publications.title ||
                                "Top Authors by Publications"
                              }
                              snippet={
                                byId.top_authors_by_publications.description ||
                                "Leading journalists covering brand stories."
                              }
                              analysis={
                                analysisOf
                                  ? analysisOf("top_authors_by_publications")
                                  : ""
                              }
                              onOpenAnalysis={() =>
                                handleOpenAnalysis(
                                  "top_authors_by_publications",
                                  "Top Authors",
                                )
                              }
                              className="w-full"
                            >
                              <DynamicChartRenderer
                                chart={byId.top_authors_by_publications}
                              />
                            </SenseCard>
                          </>
                        )}
                      </>
                    )}

                    {/* Key Stories Tab */}
                    {isStoriesTab && (
                      <>
                        <TopArticles articles={detail.topArticles} />

                        {Array.isArray(detail.heatmap) &&
                          detail.heatmap.length > 0 && (
                            <>
                              <div
                                className={cn("h-px", "w-full")}
                                style={{
                                  backgroundColor: "var(--sense-hairline)",
                                }}
                              />
                              <SenseCard
                                title="Publishing Time Heatmap"
                                snippet="Article counts by day of week and hour of day (UTC), as a 7×24 grid."
                                footer="Coverage volume is concentrated at hour 0 (midnight UTC) across all days."
                                analysis={
                                  analysisOf
                                    ? analysisOf("publish_time_heatmap")
                                    : ""
                                }
                                onOpenAnalysis={() =>
                                  handleOpenAnalysis(
                                    "publish_time_heatmap",
                                    "Publishing Time Heatmap",
                                  )
                                }
                              >
                                <BrandImpactHeatmap data={detail.heatmap} />
                              </SenseCard>
                            </>
                          )}
                      </>
                    )}
                  </>
                )}

              {/* Next Story (Story Bridge) */}
              <SenseStoryBridge
                chapters={effectiveChapters}
                currentTab={activeTab}
                onSwitchTab={handleSwitchTab}
                bgImage={bridgeBgImage}
              />
            </StaggerGroup>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function Template7Core(props) {
  return (
    <CoverProvider>
      <SenseTemplateView {...props} />
    </CoverProvider>
  );
}
