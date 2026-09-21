/**
 * State-Level Sentiment — Tier-2 lens under Regional Intelligence.
 *
 * Overview tab compares every market's sentiment split, net score and top
 * theme; one tab per market shows the headline, key insights, sentiment and
 * product-theme columns from that market's deck slide. Reads
 * `chartsData.regional_sentiment`; renders the sample until the backend ships it.
 */
import { useCallback, useMemo, useState } from "react";

import {
  Bullets, NetSentiment, OverviewTable, RegionBanner, RegionHead, SecHead, SentimentBar, ThemeColumns, WgBanner, regionTabs,
} from "../dashboards/storyboard/ri-blocks.jsx";
import BrandLogo from "../dashboards/storyboard/BrandLogo.jsx";
import StoryboardShell from "../dashboards/storyboard/StoryboardShell.jsx";
import { RS_SAMPLE } from "../dashboards/storyboard/ri-sample.js";
import { mergeLogos } from "../dashboards/storyboard/logos.js";
import "../dashboards/storyboard/wg.css";
import "../dashboards/storyboard/ri.css";
import { FlagText } from "../utils/countryFlags.jsx";

export const DASHBOARD_KEY = "regional_sentiment";

export default function RegionalSentimentScreen({ chartsData, chartsLoading, chartsError, onBack }) {
  const [activeTab, setActiveTab] = useState("overview");
  const switchTab = useCallback((id) => {
    setActiveTab(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const live = chartsData?.[DASHBOARD_KEY];
  const story = live?.regions?.length ? live : RS_SAMPLE;
  const isSample = story === RS_SAMPLE;
  const logos = useMemo(() => mergeLogos(chartsData, story.meta?.logos), [chartsData, story]);

  if (chartsLoading) return <div className="sb-state">Loading storyboard…</div>;
  if (chartsError && !live && !isSample) return <div className="sb-state sb-state--error">{chartsError}</div>;

  const { meta = {}, regions = [] } = story;
  const tabs = regionTabs(regions);
  const region = regions.find((r) => r.key === activeTab);

  const best = [...regions].sort((a, b) => (b.sentiment?.pos - b.sentiment?.neg) - (a.sentiment?.pos - a.sentiment?.neg))[0];
  const totalMentions = regions.reduce((a, r) => a + (Number(r.mentions) || 0), 0);

  const overview = (
    <div className="page">
      <WgBanner variant="b-blue" banner={{
        eyebrow: "State-Level Sentiment",
        headline: `How ${meta.category || "the category"} is felt, market by market`,
        sub: story.note,
        stats: [
          { value: String(regions.length), label: "Markets" },
          { value: totalMentions.toLocaleString(), label: "Posts analysed" },
          { value: best ? best.name : "—", label: "Most positive market" },
          { value: best ? `+${best.sentiment.pos - best.sentiment.neg}` : "—", label: "Best net sentiment" },
        ],
      }} />
      <div className="sec">
        <SecHead eyebrow="ALL MARKETS" title="Sentiment and leading theme by market" note="Click a row to open that market." />
        <OverviewTable regions={regions} onPick={switchTab} cols={[
          { h: "Sentiment", render: (r) => r.sentiment ? (
            <div className="mini" title={`+${r.sentiment.pos} / ${r.sentiment.neu} / -${r.sentiment.neg}`}>
              <div style={{ width: `${r.sentiment.pos}%`, background: "var(--pos)" }} />
              <div style={{ width: `${r.sentiment.neu}%`, background: "var(--bg2)" }} />
              <div style={{ width: `${r.sentiment.neg}%`, background: "var(--neg)" }} />
            </div>) : <span className="v">—</span> },
          { h: "Net", render: (r) => r.sentiment ? <span className={`v${r === best ? " hl" : ""}`}>{r.sentiment.pos - r.sentiment.neg > 0 ? "+" : ""}{r.sentiment.pos - r.sentiment.neg}</span> : <span className="v">—</span> },
          { h: "Top theme", render: (r) => r.themes?.[0] ? <>{r.themes[0].name} <span className="v">{r.themes[0].pct}%</span></> : "—" },
          { h: "Headline", render: (r) => <span style={{ color: "var(--ink2)" }}><FlagText text={r.headline} /></span> },
        ]} />
      </div>
    </div>
  );

  const panel = region ? (
    <div className="page">
      <RegionBanner region={region} eyebrow={`Dashboard · ${region.name}`} variant="b-blue" stats={[
        { value: (region.mentions || 0).toLocaleString(), label: "Posts analysed" },
        { value: region.sentiment ? `${region.sentiment.pos}%` : "—", label: "Positive" },
        { value: region.sentiment ? `${region.sentiment.neg}%` : "—", label: "Negative" },
        { value: region.themes?.[0] ? `${region.themes[0].pct}%` : "—", label: `Top theme · ${region.themes?.[0]?.name || ""}` },
      ]} />
      <div className="sec">
        <RegionHead region={region} sub="Key insights and sentiment" />
        <div className="grid g5-7" style={{ marginTop: 18 }}>
          <div className="stack">
            <div className="card lg">
              <div className="card-title">Sentiment</div>
              <NetSentiment s={region.sentiment} />
              <SentimentBar s={region.sentiment} />
              <div className="slegend">
                <span><i style={{ background: "var(--pos)" }} />Positive</span>
                <span><i style={{ background: "var(--bg2)", border: "1px solid var(--line)" }} />Neutral</span>
                <span><i style={{ background: "var(--neg)" }} />Negative</span>
              </div>
            </div>
            <div className="card lg">
              <div className="card-title">Top product themes</div>
              <ThemeColumns themes={region.themes} />
              <p className="muted" style={{ marginTop: 14 }}>Bracketed labels are the top discussion within each theme. Shares may exceed 100% due to multiple mentions.</p>
            </div>
          </div>
          <div className="card lg">
            <div className="card-title">Key insights</div>
            <Bullets points={region.insights} />
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
      subtitle={<>Regional Intelligence · State-Level Sentiment{isSample ? <span className="sample-pill">Sample data</span> : null}</>}
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
