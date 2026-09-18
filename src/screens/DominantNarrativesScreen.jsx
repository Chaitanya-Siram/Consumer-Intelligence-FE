/**
 * Dominant Narratives — Tier-2 lens under the Landscape Analysis pillar.
 *
 * Four tabs, following the approved deck (pages 18–22): overall usage and
 * engagement narratives; the five landscape questions; the current landscape
 * (platform share of voice, issuer ranking, brand highlights); the audience's
 * financial outlook. Reads `chartsData.dominant_narratives`; until the backend
 * publishes that key it renders dn-sample.js and says so in the header.
 */
import { useCallback, useMemo, useState } from "react";

import {
  Callouts,
  DnBanner,
  Goods,
  IssuerBars,
  OutlookCards,
  PlatformDonut,
  QuestionColumns,
  SecHead,
  SummaryPanel,
  UsageGroups,
} from "../dashboards/storyboard/dn-blocks.jsx";
import BrandLogo from "../dashboards/storyboard/BrandLogo.jsx";
import StoryboardShell from "../dashboards/storyboard/StoryboardShell.jsx";
import { DN_SAMPLE } from "../dashboards/storyboard/dn-sample.js";
import { mergeLogos } from "../dashboards/storyboard/logos.js";
import "../dashboards/storyboard/dn.css";

export const DASHBOARD_KEY = "dominant_narratives";
const BANNER_VARIANT = { t1: "b-purple", t2: "b-pink", t3: "b-blue", t4: "b-green" };

export default function DominantNarrativesScreen({
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

  const live = chartsData?.[DASHBOARD_KEY];
  const story = live?.tabs?.length ? live : DN_SAMPLE;
  const isSample = story === DN_SAMPLE;
  // Logos from this lens, plus any other lens in the session (Brand &
  // Competitive already resolves them), so marks show before this lens ships its own.
  const logos = useMemo(() => mergeLogos(chartsData, story.meta?.logos), [chartsData, story]);

  if (chartsLoading) return <div className="sb-state">Loading storyboard…</div>;
  if (chartsError && !live && !isSample) {
    return <div className="sb-state sb-state--error">{chartsError}</div>;
  }

  const { meta = {}, tabs, usage, observations, landscape, outlook } = story;
  const tab = tabs.find((t) => t.id === activeTab) || tabs[0];

  const panels = {
    t1: (
      <div className="page">
        <DnBanner banner={usage?.banner} variant={BANNER_VARIANT.t1} />
        <div className="sec">
          <SecHead eyebrow="OVERALL USAGE" title="How the category is actually used" note={usage?.note} />
          <div className="grid g4-8">
            <SummaryPanel text={usage?.summary} keywords={usage?.keywords} />
            <UsageGroups groups={usage?.groups} />
          </div>
        </div>
      </div>
    ),

    t2: (
      <div className="page">
        <DnBanner banner={observations?.banner} variant={BANNER_VARIANT.t2} />
        <div className="sec">
          <SecHead
            eyebrow="USAGE & ENGAGEMENT OBSERVATIONS"
            title="Five questions the conversation answers"
            note={observations?.note}
          />
          <QuestionColumns columns={observations?.columns} />
        </div>
      </div>
    ),

    t3: (
      <div className="page">
        <DnBanner banner={landscape?.banner} variant={BANNER_VARIANT.t3} />
        <div className="sec">
          <SecHead
            eyebrow="BRAND IN THE LANDSCAPE"
            title={landscape?.sec_title || "Where the conversation lives, and who leads it"}
            note={landscape?.note}
          />
          <div className="grid g5-7">
            <div className="stack">
              <div className="card lg">
                <div className="card-title">Social media share of voice · by platform</div>
                <PlatformDonut platforms={landscape?.platforms} />
              </div>
              <div className="card lg">
                <div className="card-title">Top issuers in the conversation</div>
                <IssuerBars issuers={landscape?.issuers} logos={logos} />
              </div>
            </div>
            <div className="stack">
              <Callouts callouts={landscape?.callouts} />
              <Goods title={landscape?.goods_title} lead={landscape?.goods_lead} goods={landscape?.goods} />
            </div>
          </div>
        </div>
      </div>
    ),

    t4: (
      <div className="page">
        <DnBanner banner={outlook?.banner} variant={BANNER_VARIANT.t4} />
        <div className="sec">
          <SecHead eyebrow="A SNAPSHOT" title={outlook?.sec_title || "Audience financial outlook"} note={outlook?.note} />
          <OutlookCards themes={outlook?.themes} />
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
      scope="sb-dn"
      brandName={brandName}
      subtitle={
        <>
          Landscape Analysis · Dominant Narratives
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
