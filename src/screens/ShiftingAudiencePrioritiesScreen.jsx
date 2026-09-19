/**
 * Shifting Audience Priorities — Tier-2 lens under the Advanced Metrics pillar.
 *
 * Two tabs, per docs/ci-lens-contracts-issues-priorities.md §5: the brand
 * loyalty index (gauge, parameters, tracking tiles) and the index trend with
 * benchmarks. Reads `chartsData.shifting_audience_priorities`. Layout and
 * tokens follow the Track Emerging Issues storyboard (`.sb-tei`); the blocks
 * unique to this screen live in sap-blocks.jsx.
 *
 * Every number on this screen is computed by the backend from the session's
 * tagged articles; every sentence is LLM-written from those numbers. There is
 * no sample payload: until the backend returns the key, the screen says so.
 */
import { useCallback, useMemo, useState } from "react";

import { SecHead, TeiBanner, TrendLine } from "../dashboards/storyboard/tei-blocks.jsx";
import {
  BandMeter,
  BenchmarkBars,
  BoldOnly,
  IndexGauge,
  ParamList,
  SpikeList,
  TrackingTiles,
} from "../dashboards/storyboard/sap-blocks.jsx";
import StoryboardShell from "../dashboards/storyboard/StoryboardShell.jsx";
import "../dashboards/storyboard/tei.css";
import "../dashboards/storyboard/sap.css";

export const DASHBOARD_KEY = "shifting_audience_priorities";

const TABS = [
  { id: "t1", label: "Loyalty Index" },
  { id: "t2", label: "Index Trend & Benchmarks" },
];
const BANNER_VARIANT = { t1: "b-purple", t2: "b-green" };

export default function ShiftingAudiencePrioritiesScreen({
  chartsData,
  chartsLoading,
  chartsError,
  onBack,
}) {
  const [activeTab, setActiveTab] = useState("t1");
  const switchTab = useCallback((id) => {
    setActiveTab(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const story = chartsData?.[DASHBOARD_KEY];
  const live = story?.loyalty && story?.status !== "failed";

  // The contract's `trend.points` are `[label, value]` pairs; TrendLine wants
  // `{x, y}` and the spikes are its annotations.
  const trend = useMemo(() => {
    if (!live) return null;
    const t = story.trend || {};
    return {
      title: t.title,
      unit: t.unit,
      unit_short: "index",
      points: (t.points || []).map(([x, y]) => ({ x, y })),
      annotations: (t.spikes || []).map((s) => ({ at: s.at, label: s.label, text: s.text })),
      footnote: t.footnote,
    };
  }, [live, story]);

  if (chartsLoading) return <div className="sb-state">Loading storyboard…</div>;
  if (!live) {
    const detail =
      story?.status === "failed"
        ? `The backend could not build this lens: ${story?.meta?.error || "unknown error"}.`
        : story?.status === "coming_soon"
          ? "This lens is not available for this session yet."
          : chartsError || "Run Create Dashboard on the Review screen with the Advanced Metrics lens selected.";
    return (
      <div className={`sb-state${chartsError ? " sb-state--error" : ""}`}>
        Shifting Audience Priorities has no data for this session. {detail}
      </div>
    );
  }

  const { meta = {}, loyalty = {}, monthly, benchmark, footer } = story;
  const tab = TABS.find((t) => t.id === activeTab) || TABS[0];
  const isSample = meta.is_sample === true;
  const brandLabel = meta.brand || "Brand";
  const compLabel = meta.top_competitor;

  const panels = {
    t1: (
      <div className="page">
        <TeiBanner banner={{ eyebrow: "Loyalty Index", ...loyalty.banner }} variant={BANNER_VARIANT.t1} />
        <div className="sec">
          <SecHead
            eyebrow="BRAND LOYALTY INDEX"
            title={`How loyal is the ${brandLabel} audience`}
            note={meta.category ? `Read for the ${meta.category} category · ${meta.window || ""}` : meta.window}
          />
          <div className="grid g4-8">
            <div className="card">
              <div className="card-title">{loyalty.index?.label || "Brand Loyalty Index"}</div>
              <IndexGauge index={loyalty.index} />
            </div>
            <div className="card">
              <div className="card-title">What the index is made of</div>
              <BoldOnly text={loyalty.lead} className="lead" />
              <ParamList params={loyalty.params} />
            </div>
          </div>
        </div>
        <div className="sec">
          <SecHead
            eyebrow="TRACKING"
            title={loyalty.cadence_title || "Tracking"}
            note={meta.method?.period_label ? `Each tile compares the current period ${meta.method.period_label.replace(/^vs /, "with the ")}.` : undefined}
          />
          <TrackingTiles tracking={loyalty.tracking} />
        </div>
      </div>
    ),

    t2: (
      <div className="page">
        <TeiBanner banner={{ eyebrow: "Index Trend & Benchmarks", ...(story.trend?.banner || {}) }} variant={BANNER_VARIANT.t2} />
        <div className="sec">
          <SecHead eyebrow="TREND" title={story.trend?.title || "Brand loyalty index over time"} note={story.trend?.note} />
          <div className="card lg">
            <TrendLine trend={trend} />
            <SpikeList spikes={story.trend?.spikes?.filter((s) => s.text)} />
          </div>
        </div>
        <div className="sec">
          <SecHead
            eyebrow="BENCHMARKS"
            title="Where the score sits"
            note={compLabel ? `Industry is every post in the window; competitor is ${compLabel}, the most-mentioned rival.` : "Industry is every post in the window."}
          />
          <div className="grid g2">
            <div className="card">
              <div className="card-title">Current score</div>
              <BandMeter monthly={monthly} />
            </div>
            <div className="card">
              <div className="card-title">Benchmark</div>
              <BenchmarkBars benchmark={benchmark} />
            </div>
          </div>
        </div>
      </div>
    ),
  };

  return (
    <StoryboardShell
      scope="sb-tei sb-sap"
      bannerContext={{ brand: meta.brand, category: meta.category }}
      brandName={brandLabel}
      subtitle={
        <>
          Advanced Metrics · Shifting Audience Priorities
          {isSample ? <span className="sample-pill" style={{ marginLeft: 10 }}>Sample data</span> : null}
        </>
      }
      tabs={TABS}
      active={tab.id}
      onTab={switchTab}
      footer={footer}
      onBack={onBack}
      progress={false}
      footerAs="span"
    >
      <section className="tab-panel active" key={tab.id}>
        {panels[tab.id]}
      </section>
    </StoryboardShell>
  );
}
