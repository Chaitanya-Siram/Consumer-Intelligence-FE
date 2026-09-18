/**
 * Audience Expectation — Tier-2 lens under Whitespace & Gap Analysis.
 *
 * Three tabs from the approved decks: needs and preferences mapped to brand
 * attributes (p24 + p25 drivers), unmet needs (p26), digital finance gaps
 * (PDF3 p18 + p20 survey stats). Reads `chartsData.audience_expectation`;
 * renders ae-sample.js with a "Sample data" pill until the backend ships it.
 */
import { useCallback, useMemo, useState } from "react";

import {
  AttributeHub,
  Bullets,
  NeedColumns,
  Pillars,
  SecHead,
  StatStrip,
  WgBanner,
} from "../dashboards/storyboard/wg-blocks.jsx";
import BrandLogo from "../dashboards/storyboard/BrandLogo.jsx";
import StoryboardShell from "../dashboards/storyboard/StoryboardShell.jsx";
import { AE_SAMPLE } from "../dashboards/storyboard/ae-sample.js";
import { mergeLogos } from "../dashboards/storyboard/logos.js";
import "../dashboards/storyboard/wg.css";

export const DASHBOARD_KEY = "audience_expectation";
const BANNER_VARIANT = { t1: "b-purple", t2: "b-pink", t3: "b-blue" };

export default function AudienceExpectationScreen({ chartsData, chartsLoading, chartsError, onBack }) {
  const [activeTab, setActiveTab] = useState("t1");
  const switchTab = useCallback((id) => {
    setActiveTab(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const live = chartsData?.[DASHBOARD_KEY];
  const story = live?.tabs?.length ? live : AE_SAMPLE;
  const isSample = story === AE_SAMPLE;
  const logos = useMemo(() => mergeLogos(chartsData, story.meta?.logos), [chartsData, story]);

  if (chartsLoading) return <div className="sb-state">Loading storyboard…</div>;
  if (chartsError && !live && !isSample) return <div className="sb-state sb-state--error">{chartsError}</div>;

  const { meta = {}, tabs, needs, unmet, digital } = story;
  const tab = tabs.find((t) => t.id === activeTab) || tabs[0];

  const panels = {
    t1: (
      <div className="page">
        <WgBanner banner={needs?.banner} variant={BANNER_VARIANT.t1} />
        <div className="sec">
          <SecHead eyebrow="CONSUMER NEEDS, EXPECTATIONS & PREFERENCES" title="What the audience expects, attribute by attribute" note={needs?.note} />
          <AttributeHub brand={meta.brand} logos={logos} attributes={needs?.attributes} />
        </div>
        {needs?.drivers?.length ? (
          <div className="sec">
            <SecHead eyebrow="KEY DRIVERS" title={needs.drivers_title || "Why they use the product"} note={needs.drivers_lead} />
            <div className="card lg">
              <Bullets points={needs.drivers} />
            </div>
          </div>
        ) : null}
      </div>
    ),
    t2: (
      <div className="page">
        <WgBanner banner={unmet?.banner} variant={BANNER_VARIANT.t2} />
        <div className="sec">
          <SecHead eyebrow="UNMET NEEDS" title="What Gen-Zs look for" note={unmet?.note} />
          <NeedColumns needs={unmet?.needs} />
        </div>
      </div>
    ),
    t3: (
      <div className="page">
        <WgBanner banner={digital?.banner} variant={BANNER_VARIANT.t3} />
        <div className="sec">
          <SecHead eyebrow="UNMET NEEDS · DIGITAL FINANCE" title="What Gen-Zs look for in digital finance" note={digital?.note} />
          <Pillars pillars={digital?.pillars} />
        </div>
        {digital?.survey?.length ? (
          <div className="sec">
            <SecHead eyebrow="MOBILE BANKING EXPERIENCE" title={digital.survey_title || "Are they content with the digital experience?"} note={digital.survey_note} />
            <StatStrip stats={digital.survey} />
          </div>
        ) : null}
      </div>
    ),
  };

  return (
    <StoryboardShell
      scope="sb-wg"
      brandName={<><BrandLogo brand={meta.brand || "Brand"} logos={logos} size={22} rounded={6} />{meta.brand || "Brand"}{meta.category ? <span style={{ fontWeight: 600, color: "var(--ink3)" }}>· {meta.category}</span> : null}</>}
      subtitle={<>Whitespace &amp; Gap Analysis · Audience Expectation{isSample ? <span className="sample-pill">Sample data</span> : null}</>}
      tabs={tabs}
      active={tab.id}
      onTab={switchTab}
      footer={story.footer}
      onBack={onBack}
      progress={false}
      footerAs="span"
    >
      <section className="tab-panel active" key={tab.id}>{panels[tab.id]}</section>
    </StoryboardShell>
  );
}
