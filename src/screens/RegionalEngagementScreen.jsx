/**
 * Engagement — Tier-2 lens under Regional Intelligence.
 *
 * Overview compares each market's leading product type in each half-year;
 * per-market tabs show the H1 vs H2 trending product types with shift chips,
 * key insights and the topics of discussion. Reads
 * `chartsData.regional_engagement`; renders the sample until the backend ships it.
 */
import { useCallback, useMemo, useState } from "react";

import {
  BrandTopics, Bullets, OverviewTable, RegionBanner, RegionHead, SecHead, TypeShift, WgBanner, regionTabs,
} from "../dashboards/storyboard/ri-blocks.jsx";
import BrandLogo from "../dashboards/storyboard/BrandLogo.jsx";
import StoryboardShell from "../dashboards/storyboard/StoryboardShell.jsx";
import { RE_SAMPLE } from "../dashboards/storyboard/ri-sample.js";
import { mergeLogos } from "../dashboards/storyboard/logos.js";
import "../dashboards/storyboard/wg.css";
import "../dashboards/storyboard/ri.css";
import { FlagText } from "../utils/countryFlags.jsx";

export const DASHBOARD_KEY = "regional_engagement";

export default function RegionalEngagementScreen({ chartsData, chartsLoading, chartsError, onBack }) {
  const [activeTab, setActiveTab] = useState("overview");
  const switchTab = useCallback((id) => {
    setActiveTab(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const live = chartsData?.[DASHBOARD_KEY];
  const story = live?.regions?.length ? live : RE_SAMPLE;
  const isSample = story === RE_SAMPLE;
  const logos = useMemo(() => mergeLogos(chartsData, story.meta?.logos), [chartsData, story]);

  if (chartsLoading) return <div className="sb-state">Loading storyboard…</div>;
  if (chartsError && !live && !isSample) return <div className="sb-state sb-state--error">{chartsError}</div>;

  const { meta = {}, regions = [], periods = ["H1", "H2"] } = story;
  const tabs = regionTabs(regions);
  const region = regions.find((r) => r.key === activeTab);
  const totalMentions = regions.reduce((a, r) => a + (Number(r.mentions) || 0), 0);

  const overview = (
    <div className="page">
      <WgBanner variant="b-green" banner={{
        eyebrow: "Engagement",
        headline: "What each market engages with, and how it moved",
        sub: story.note,
        stats: [
          { value: String(regions.length), label: "Markets" },
          { value: totalMentions.toLocaleString(), label: "Posts analysed" },
          { value: periods[0], label: "First period" },
          { value: periods[1], label: "Second period" },
        ],
      }} />
      <div className="sec">
        <SecHead eyebrow="ALL MARKETS" title="Leading product type by period" note="Click a row to open that market." />
        <OverviewTable regions={regions} onPick={switchTab} cols={[
          { h: periods[0], render: (r) => r.types_h1?.[0] ? <>{r.types_h1[0].name} <span className="v">{r.types_h1[0].pct}%</span></> : "—" },
          { h: periods[1], render: (r) => r.types_h2?.[0] ? <><span className="hl">{r.types_h2[0].name}</span> <span className="v">{r.types_h2[0].pct}%</span></> : "—" },
          { h: "Headline", render: (r) => <span style={{ color: "var(--ink2)" }}><FlagText text={r.headline} /></span> },
        ]} />
      </div>
    </div>
  );

  const panel = region ? (
    <div className="page">
      <RegionBanner region={region} eyebrow={`Dashboard · ${region.name}`} variant="b-green" stats={[
        { value: (region.mentions || 0).toLocaleString(), label: "Posts analysed" },
        { value: region.types_h2?.[0] ? `${region.types_h2[0].pct}%` : "—", label: `Leads ${periods[1]} · ${region.types_h2?.[0]?.name || ""}` },
        { value: region.types_h1?.[0] ? `${region.types_h1[0].pct}%` : "—", label: `Led ${periods[0]} · ${region.types_h1?.[0]?.name || ""}` },
        { value: String(region.topics?.length || 0), label: "Brands discussed" },
      ]} />
      <div className="sec">
        <RegionHead region={region} sub="Trending product types and topics of discussion" />
        <div className="card lg" style={{ marginTop: 18 }}>
          <div className="card-title">Top trending product types</div>
          <TypeShift h1={region.types_h1} h2={region.types_h2} periods={periods} />
        </div>
        <div className="grid g2" style={{ marginTop: 18 }}>
          <div className="card lg">
            <div className="card-title">Key insights</div>
            <Bullets points={region.insights} />
          </div>
          <div className="card lg">
            <div className="card-title">Topics of discussion</div>
            <BrandTopics topics={region.topics} logos={logos} />
          </div>
        </div>
      </div>
    </div>
  ) : overview;

  return (
    <StoryboardShell
      scope="sb-wg sb-ri"
      bannerContext={{ brand: meta.brand, category: meta.category }}
      brandName={<><BrandLogo brand={meta.brand || "Brand"} logos={logos} size={22} rounded={6} />{meta.brand || "Brand"}{meta.category ? <span style={{ fontWeight: 600, color: "var(--ink3)" }}>· {meta.category}</span> : null}</>}
      subtitle={<>Regional Intelligence · Engagement{isSample ? <span className="sample-pill">Sample data</span> : null}</>}
      tabs={tabs}
      active={region ? region.key : "overview"}
      onTab={switchTab}
      footer={story.footer}
      onBack={onBack}
      progress={false}
      footerAs="span"
    >
      <section className="tab-panel active" key={activeTab}>{panel}</section>
    </StoryboardShell>
  );
}
