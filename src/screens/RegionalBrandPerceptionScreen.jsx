/**
 * Brand Perception (regional) — Tier-2 lens under Regional Intelligence.
 *
 * Overview compares the leading brand and the project brand's share in every
 * market; per-market tabs show the brand-mention donut with logos, what is said
 * about each leading brand, and the long tail. Reads
 * `chartsData.regional_brand_perception`; renders the sample until the backend ships it.
 */
import { useCallback, useMemo, useState } from "react";

import {
  BrandDonut, BrandTopics, OtherChips, OverviewTable, RegionBanner, RegionHead, SecHead, WgBanner, regionTabs,
} from "../dashboards/storyboard/ri-blocks.jsx";
import BrandLogo from "../dashboards/storyboard/BrandLogo.jsx";
import StoryboardShell from "../dashboards/storyboard/StoryboardShell.jsx";
import { RBP_SAMPLE } from "../dashboards/storyboard/ri-sample.js";
import { mergeLogos } from "../dashboards/storyboard/logos.js";
import "../dashboards/storyboard/wg.css";
import "../dashboards/storyboard/ri.css";

export const DASHBOARD_KEY = "regional_brand_perception";
const isOther = (n) => /^others?$/i.test(n);

export default function RegionalBrandPerceptionScreen({ chartsData, chartsLoading, chartsError, onBack }) {
  const [activeTab, setActiveTab] = useState("overview");
  const switchTab = useCallback((id) => {
    setActiveTab(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const live = chartsData?.[DASHBOARD_KEY];
  const story = live?.regions?.length ? live : RBP_SAMPLE;
  const isSample = story === RBP_SAMPLE;
  const logos = useMemo(() => mergeLogos(chartsData, story.meta?.logos), [chartsData, story]);

  if (chartsLoading) return <div className="sb-state">Loading storyboard…</div>;
  if (chartsError && !live && !isSample) return <div className="sb-state sb-state--error">{chartsError}</div>;

  const { meta = {}, regions = [] } = story;
  const tabs = regionTabs(regions);
  const region = regions.find((r) => r.key === activeTab);
  const leader = (r) => (r.brands || []).filter((b) => !isOther(b.name))[0];
  const own = (r) => (r.brands || []).find((b) => b.is_brand);
  const bestOwn = [...regions].filter(own).sort((a, b) => own(b).pct - own(a).pct)[0];

  const overview = (
    <div className="page">
      <WgBanner variant="b-purple" banner={{
        eyebrow: "Brand Perception",
        headline: `Who leads each market, and where ${meta.brand || "the brand"} stands`,
        sub: story.note,
        stats: [
          { value: String(regions.length), label: "Markets" },
          { value: String(regions.filter(own).length), label: `Markets naming ${meta.brand || "brand"}` },
          { value: bestOwn ? bestOwn.name : "—", label: `Strongest ${meta.brand || "brand"} market` },
          { value: bestOwn ? `${own(bestOwn).pct}%` : "—", label: "Share there" },
        ],
      }} />
      <div className="sec">
        <SecHead eyebrow="ALL MARKETS" title="Market leader vs. the brand" note="Click a row to open that market." />
        <OverviewTable regions={regions} onPick={switchTab} cols={[
          { h: "Market leader", render: (r) => { const l = leader(r); return l ? <span className="bb"><BrandLogo brand={l.name} logos={logos} size={18} rounded={5} />{l.name} <span className="v">{l.pct}%</span></span> : "—"; } },
          { h: meta.brand || "Brand", render: (r) => { const o = own(r); return o ? <span className="bb hl"><BrandLogo brand={o.name} logos={logos} size={18} rounded={5} /><span className="v hl">{o.pct}%</span></span> : <span className="v">not in top mentions</span>; } },
          { h: "Brands tracked", render: (r) => <span className="v">{(r.brands || []).filter((b) => !isOther(b.name)).length}</span> },
          { h: "Headline", render: (r) => <span style={{ color: "var(--ink2)" }}>{r.headline}</span> },
        ]} />
      </div>
    </div>
  );

  const panel = region ? (
    <div className="page">
      <RegionBanner region={region} eyebrow={`Dashboard · ${region.name}`} variant="b-purple" stats={[
        { value: (region.mentions || 0).toLocaleString(), label: "Posts analysed" },
        { value: leader(region) ? `${leader(region).pct}%` : "—", label: `Leader · ${leader(region)?.name || ""}` },
        { value: own(region) ? `${own(region).pct}%` : "—", label: `${meta.brand || "Brand"} share` },
        { value: String((region.brands || []).filter((b) => !isOther(b.name)).length), label: "Brands tracked" },
      ]} />
      <div className="sec">
        <RegionHead region={region} sub="Top brand mentions and what is said about them" />
        <div className="grid g5-7" style={{ marginTop: 18 }}>
          <div className="stack">
            <div className="card lg">
              <div className="card-title">Top brand mentions</div>
              <BrandDonut rows={region.brands} logos={logos} />
            </div>
            {region.others?.length ? (
              <div className="card">
                <div className="card-title">Others include</div>
                <OtherChips others={region.others} logos={logos} />
              </div>
            ) : null}
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
      subtitle={<>Regional Intelligence · Brand Perception{isSample ? <span className="sample-pill">Sample data</span> : null}</>}
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
