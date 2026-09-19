/**
 * Brand Performance — Tier-2 lens under Whitespace & Gap Analysis.
 *
 * Three tabs from PDF3: share of voice + comparative sentiment (p23), digital
 * experience per brand (p21), mobile banking experience (p19, survey data).
 * Reads `chartsData.brand_performance`; renders bpf-sample.js until the
 * backend ships it.
 */
import { useCallback, useMemo, useState } from "react";

import {
  BrandColumns,
  Bullets,
  GroupedBars,
  SecHead,
  SentimentStack,
  ShareDonut,
  StackedColumns,
  WgBanner,
} from "../dashboards/storyboard/wg-blocks.jsx";
import BrandLogo from "../dashboards/storyboard/BrandLogo.jsx";
import StoryboardShell from "../dashboards/storyboard/StoryboardShell.jsx";
import { BPF_SAMPLE } from "../dashboards/storyboard/bpf-sample.js";
import { mergeLogos } from "../dashboards/storyboard/logos.js";
import "../dashboards/storyboard/wg.css";

export const DASHBOARD_KEY = "brand_performance";
const BANNER_VARIANT = { t1: "b-purple", t2: "b-blue", t3: "b-green" };

export default function BrandPerformanceScreen({ chartsData, chartsLoading, chartsError, onBack }) {
  const [activeTab, setActiveTab] = useState("t1");
  const switchTab = useCallback((id) => {
    setActiveTab(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const live = chartsData?.[DASHBOARD_KEY];
  const story = live?.tabs?.length ? live : BPF_SAMPLE;
  const isSample = story === BPF_SAMPLE;
  const logos = useMemo(() => mergeLogos(chartsData, story.meta?.logos), [chartsData, story]);

  if (chartsLoading) return <div className="sb-state">Loading storyboard…</div>;
  if (chartsError && !live && !isSample) return <div className="sb-state sb-state--error">{chartsError}</div>;

  const { meta = {}, tabs, voice, digital, mobile } = story;
  const tab = tabs.find((t) => t.id === activeTab) || tabs[0];

  const panels = {
    t1: (
      <div className="page">
        <WgBanner banner={voice?.banner} variant={BANNER_VARIANT.t1} />
        <div className="sec">
          <SecHead eyebrow="SOCIAL MEDIA DASHBOARD" title={`${meta.brand} vs competitors`} note={voice?.note} />
          <div className="grid g5-7">
            <div className="card lg">
              <div className="card-title">Share of voice</div>
              <ShareDonut rows={voice?.share} logos={logos} />
            </div>
            <div className="card lg">
              <div className="card-title">Comparative sentiment</div>
              <SentimentStack rows={voice?.sentiment} logos={logos} />
              {voice?.callout ? <p className="muted" style={{ marginTop: 18 }}>{voice.callout}</p> : null}
            </div>
          </div>
        </div>
      </div>
    ),
    t2: (
      <div className="page">
        <WgBanner banner={digital?.banner} variant={BANNER_VARIANT.t2} />
        <div className="sec">
          <SecHead eyebrow="DIGITAL EXPERIENCE" title={`${meta.brand} vs competitors`} note={digital?.note} />
          <BrandColumns brands={digital?.brands} logos={logos} />
        </div>
      </div>
    ),
    t3: (
      <div className="page">
        <WgBanner banner={mobile?.banner} variant={BANNER_VARIANT.t3} />
        <div className="sec">
          <SecHead eyebrow="MOBILE BANKING EXPERIENCE" title="The surge, and what drives it" note={mobile?.note} />
          <div className="card lg">
            <Bullets points={mobile?.surge} />
          </div>
        </div>
        <div className="sec">
          <div className="grid g2">
            <div className="card lg">
              <div className="card-title">Mobile banking activity{mobile?.activity?.ext ? <span className="ext">external</span> : null}</div>
              <GroupedBars rows={mobile?.activity?.rows} series={mobile?.activity?.series || []} />
            </div>
            <div className="card lg">
              <div className="card-title">Preferred way of opening a deposit account{mobile?.channel?.ext ? <span className="ext">external</span> : null}</div>
              <StackedColumns groups={mobile?.channel?.groups} series={mobile?.channel?.series || []} />
            </div>
          </div>
        </div>
      </div>
    ),
  };

  return (
    <StoryboardShell
      scope="sb-wg"
      bannerContext={{ brand: meta.brand, category: meta.category }}
      brandName={<><BrandLogo brand={meta.brand || "Brand"} logos={logos} size={22} rounded={6} />{meta.brand || "Brand"}{meta.category ? <span style={{ fontWeight: 600, color: "var(--ink3)" }}>· {meta.category}</span> : null}</>}
      subtitle={<>Whitespace &amp; Gap Analysis · Brand Performance{isSample ? <span className="sample-pill">Sample data</span> : null}</>}
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
