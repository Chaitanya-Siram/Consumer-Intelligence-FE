/**
 * Perception Analysis — Tier-2 lens under the Landscape Analysis pillar.
 *
 * Three tabs, following the approved deck (pages 28–31): the general
 * perception themes; sentiment split and the drivers behind each pole; the
 * overall emotional outlook and its negative aspects. Layout and styling
 * follow the Brand & Competitive storyboard. Reads
 * `chartsData.perception_analysis`; until the backend publishes that key it
 * renders the sample payload in pa-sample.js and says so in the header.
 */
import { useCallback, useMemo, useState } from "react";

import {
  AspectCards,
  AspectHead,
  DriverGroups,
  EmotionMix,
  PaBanner,
  PerceptionCards,
  Quotes,
  Rich,
  SecHead,
  SentimentDonut,
  SummaryPanel,
} from "../dashboards/storyboard/pa-blocks.jsx";
import BrandLogo from "../dashboards/storyboard/BrandLogo.jsx";
import StoryboardShell from "../dashboards/storyboard/StoryboardShell.jsx";
import { PA_SAMPLE } from "../dashboards/storyboard/pa-sample.js";
import { mergeLogos } from "../dashboards/storyboard/logos.js";
import "../dashboards/storyboard/pa.css";

export const DASHBOARD_KEY = "perception_analysis";
const BANNER_VARIANT = { t1: "b-purple", t2: "b-pink", t3: "b-green" };

export default function PerceptionAnalysisScreen({
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

  // A missing key is expected until the backend ships this lens: fall back to
  // the sample so the layout stays reviewable. A charts *error* still
  // surfaces if there is nothing to show.
  const live = chartsData?.[DASHBOARD_KEY];
  const story = live?.tabs?.length ? live : PA_SAMPLE;
  const isSample = story === PA_SAMPLE;
  // Logos from this lens plus any other lens in the session (Brand &
  // Competitive already resolves them), so marks show before this lens ships its own.
  const logos = useMemo(() => mergeLogos(chartsData, story.meta?.logos), [chartsData, story]);

  if (chartsLoading) return <div className="sb-state">Loading storyboard…</div>;
  if (chartsError && !live && !isSample) {
    return <div className="sb-state sb-state--error">{chartsError}</div>;
  }

  const { meta = {}, tabs, perception, sentiment, emotion } = story;
  const tab = tabs.find((t) => t.id === activeTab) || tabs[0];

  const panels = {
    t1: (
      <div className="page">
        <PaBanner banner={perception?.banner} variant={BANNER_VARIANT.t1} />
        <div className="sec">
          <SecHead
            eyebrow="USER PERCEPTION & EMOTIONS"
            title="What is the general perception of the category"
            accent="?"
            note={perception?.note}
          />
          <div className="grid g4-8">
            <SummaryPanel text={perception?.summary} keywords={perception?.keywords} />
            <PerceptionCards themes={perception?.themes} logos={logos} />
          </div>
        </div>
      </div>
    ),

    t2: (
      <div className="page">
        <PaBanner banner={sentiment?.banner} variant={BANNER_VARIANT.t2} />
        <div className="sec">
          <SecHead eyebrow="SENTIMENT ANALYSIS" title="Key sentiment drivers for adoption" note={sentiment?.note} />
          <div className="grid g5-7">
            <div className="stack">
              <div className="card lg">
                <div className="card-title">Sentiment analysis</div>
                <SentimentDonut split={sentiment?.split} />
              </div>
              {sentiment?.quotes?.length ? (
                <div className="card">
                  <div className="card-title">What people say</div>
                  <Quotes quotes={sentiment.quotes} />
                </div>
              ) : null}
            </div>
            <DriverGroups groups={sentiment?.groups} logos={logos} />
          </div>
        </div>
      </div>
    ),

    t3: (
      <div className="page">
        <PaBanner banner={emotion?.banner} variant={BANNER_VARIANT.t3} />
        <div className="sec">
          <SecHead
            eyebrow="OVERALL EMOTION"
            title="What is the overall emotion around usage"
            accent="?"
            note={emotion?.note}
          />
          <div className="grid g4-8">
            <SummaryPanel text={emotion?.summary}>
              <EmotionMix mix={emotion?.mix} />
            </SummaryPanel>
            <div>
              {emotion?.lead ? (
                <p className="lead">
                  <Rich text={emotion.lead} />
                </p>
              ) : null}
              <AspectHead label={emotion?.aspect_label} tags={emotion?.aspect_tags} />
              <AspectCards aspects={emotion?.aspects} />
            </div>
          </div>
        </div>
      </div>
    ),
  };

  const brandName = (
    <>
      <BrandLogo brand={meta.brand || "Brand"} logos={logos} size={22} rounded={6} />
      {meta.brand || "Brand"}
      {meta.category ? <span style={{ fontWeight: 600, color: "var(--ink3)" }}>· {meta.category}</span> : null}
    </>
  );

  return (
    <StoryboardShell
      scope="sb-pa"
      bannerContext={{ brand: meta.brand, category: meta.category }}
      brandName={brandName}
      subtitle={
        <>
          Landscape Analysis · Perception Analysis
          {isSample ? <span className="sample-pill">Sample data</span> : null}
        </>
      }
      tabs={tabs}
      active={tab.id}
      onTab={switchTab}
      footer={story.footer}
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
