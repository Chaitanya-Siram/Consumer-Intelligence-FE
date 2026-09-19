/**
 * Brand Messaging — Tier-2 lens under Whitespace & Gap Analysis.
 *
 * One tab per tracked brand (PDF3 p24–26): the brand's headline, and the
 * message themes its initiatives fall into with share and bullets. Tabs are
 * derived from `brands[]`, project brand first. Reads
 * `chartsData.brand_messaging`; renders bm-sample.js until the backend ships it.
 */
import { useCallback, useMemo, useState } from "react";

import { Initiatives, SecHead, WgBanner } from "../dashboards/storyboard/wg-blocks.jsx";
import BrandLogo from "../dashboards/storyboard/BrandLogo.jsx";
import StoryboardShell from "../dashboards/storyboard/StoryboardShell.jsx";
import { BM_SAMPLE } from "../dashboards/storyboard/bm-sample.js";
import { mergeLogos } from "../dashboards/storyboard/logos.js";
import "../dashboards/storyboard/wg.css";

export const DASHBOARD_KEY = "brand_messaging";
const VARIANTS = ["b-purple", "b-blue", "b-green", "b-pink"];

export default function BrandMessagingScreen({ chartsData, chartsLoading, chartsError, onBack }) {
  const [activeTab, setActiveTab] = useState(null);
  const switchTab = useCallback((id) => {
    setActiveTab(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const live = chartsData?.[DASHBOARD_KEY];
  const story = live?.brands?.length ? live : BM_SAMPLE;
  const isSample = story === BM_SAMPLE;
  const logos = useMemo(() => mergeLogos(chartsData, story.meta?.logos), [chartsData, story]);

  // Project brand first, then competitors in payload order.
  const brands = useMemo(() => {
    const list = [...(story.brands || [])];
    list.sort((a, b) => (b.is_brand ? 1 : 0) - (a.is_brand ? 1 : 0));
    return list;
  }, [story]);
  const tabs = brands.map((b) => ({ id: b.name, label: b.name }));

  if (chartsLoading) return <div className="sb-state">Loading storyboard…</div>;
  if (chartsError && !live && !isSample) return <div className="sb-state sb-state--error">{chartsError}</div>;
  if (!brands.length) return <div className="sb-state">No brand messaging data yet.</div>;

  const { meta = {} } = story;
  const current = brands.find((b) => b.name === activeTab) || brands[0];
  const idx = brands.indexOf(current);
  const total = current.initiatives?.reduce((a, i) => a + (Number(i.pct) || 0), 0);

  const banner = {
    eyebrow: current.is_brand ? "Brand messaging" : "Competitor messaging",
    headline: current.headline,
    sub: current.sub,
    stats: [
      { value: String(current.initiatives?.length || 0), label: "Message themes" },
      { value: current.initiatives?.[0] ? `${current.initiatives[0].pct}%` : "—", label: `Top · ${current.initiatives?.[0]?.title || ""}` },
      { value: current.mentions != null ? current.mentions.toLocaleString() : "—", label: "Posts analysed" },
    ],
  };

  return (
    <StoryboardShell
      scope="sb-wg"
      bannerContext={{ brand: meta.brand, category: meta.category }}
      brandName={<><BrandLogo brand={meta.brand || "Brand"} logos={logos} size={22} rounded={6} />{meta.brand || "Brand"}{meta.category ? <span style={{ fontWeight: 600, color: "var(--ink3)" }}>· {meta.category}</span> : null}</>}
      subtitle={<>Whitespace &amp; Gap Analysis · Brand Messaging{isSample ? <span className="sample-pill">Sample data</span> : null}</>}
      tabs={tabs}
      active={current.name}
      onTab={switchTab}
      footer={story.footer}
      onBack={onBack}
      progress={false}
      footerAs="span"
    >
      <section className="tab-panel active" key={current.name}>
        <div className="page">
          <WgBanner banner={banner} variant={VARIANTS[idx % VARIANTS.length]} />
          <div className="sec">
            <SecHead eyebrow="WHAT THE BRAND TALKS ABOUT" title={`${current.name} message themes`} note={story.note} />
            <div className="grid g4-8">
              <div className="card lg bhero" style={{ alignSelf: "start", flexDirection: "column", alignItems: "flex-start" }}>
                <BrandLogo brand={current.name} logos={logos} size={56} rounded={14} />
                <div className="t">{current.sub}</div>
                {total ? <div className="muted">{total >= 99 ? "Shares sum to 100% of initiative posts." : `Shares cover ${total}% of initiative posts.`}</div> : null}
              </div>
              <div className="card lg">
                <Initiatives initiatives={current.initiatives} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </StoryboardShell>
  );
}
