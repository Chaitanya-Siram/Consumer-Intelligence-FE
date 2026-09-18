/**
 * Brand Perception — Tier-2 lens under the Brand Intelligence pillar.
 *
 * Three tabs, following the approved deck (pages 15–17): voice-of-customer
 * popularity and what each product is known for; brand popularity with
 * per-brand takeaways; switchover intent with reasons and verbatim posts.
 * Reads `chartsData.brand_perception`; until the backend publishes that key
 * it renders bp-sample.js and says so in the header.
 */
import { useCallback, useMemo, useState } from "react";

import {
  BarList,
  BpBanner,
  BrandCards,
  Posts,
  ProductCards,
  Reasons,
  Rich,
  SecHead,
  SummaryPanel,
} from "../dashboards/storyboard/bp-blocks.jsx";
import BrandLogo from "../dashboards/storyboard/BrandLogo.jsx";
import StoryboardShell from "../dashboards/storyboard/StoryboardShell.jsx";
import { BP_SAMPLE } from "../dashboards/storyboard/bp-sample.js";
import { mergeLogos } from "../dashboards/storyboard/logos.js";
import "../dashboards/storyboard/bp.css";

export const DASHBOARD_KEY = "brand_perception";
const BANNER_VARIANT = { t1: "b-purple", t2: "b-pink", t3: "b-blue" };

export default function BrandPerceptionScreen({
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
  const story = live?.tabs?.length ? live : BP_SAMPLE;
  const isSample = story === BP_SAMPLE;
  // Logos from this lens plus any other lens in the session (Brand &
  // Competitive already resolves them), so marks show before this lens ships its own.
  const logos = useMemo(() => mergeLogos(chartsData, story.meta?.logos), [chartsData, story]);

  if (chartsLoading) return <div className="sb-state">Loading storyboard…</div>;
  if (chartsError && !live && !isSample) {
    return <div className="sb-state sb-state--error">{chartsError}</div>;
  }

  const { meta = {}, tabs, perception, popularity, switching } = story;
  const tab = tabs.find((t) => t.id === activeTab) || tabs[0];

  // The switch bar uses the short label when the payload gives one.
  const switchRows = (switching?.reasons || []).map((r) => ({ name: r.short || r.title, pct: r.pct }));

  const panels = {
    t1: (
      <div className="page">
        <BpBanner banner={perception?.banner} variant={BANNER_VARIANT.t1} />
        <div className="sec">
          <SecHead
            eyebrow="VOICE OF CUSTOMER"
            title="Brand popularity and what each product is known for"
            note={perception?.note}
          />
          <div className="grid g4-8">
            <div className="stack">
              <div className="card lg">
                <div className="card-title">Brand popularity · VOC</div>
                <BarList rows={perception?.popularity} logos={logos} />
              </div>
              <SummaryPanel text={perception?.summary} keywords={perception?.keywords} />
            </div>
            <ProductCards products={perception?.products} logos={logos} />
          </div>
        </div>
      </div>
    ),

    t2: (
      <div className="page">
        <BpBanner banner={popularity?.banner} variant={BANNER_VARIANT.t2} />
        <div className="sec">
          <SecHead eyebrow="POPULARITY" title="Who the audience talks about, and why" note={popularity?.note} />
          <div className="grid g4-8">
            <div className="stack">
              <div className="card lg">
                <div className="card-title">Popularity · share of brand mentions</div>
                <BarList rows={popularity?.brands} logos={logos} />
              </div>
              {popularity?.lead ? (
                <div className="card">
                  <p className="lead">
                    <Rich text={popularity.lead} />
                  </p>
                </div>
              ) : null}
            </div>
            <BrandCards brands={popularity?.brands} logos={logos} />
          </div>
        </div>
      </div>
    ),

    t3: (
      <div className="page">
        <BpBanner banner={switching?.banner} variant={BANNER_VARIANT.t3} />
        <div className="sec">
          <SecHead eyebrow="SWITCHING BEHAVIOUR" title="Why they switch, and what they weigh" note={switching?.note} />
          <div className="grid g5-7">
            <div className="stack">
              <div className="card lg">
                <div className="card-title">Reasons for switch</div>
                <BarList rows={switchRows} />
              </div>
              {switching?.posts?.length ? (
                <div className="card">
                  <div className="card-title">What people say</div>
                  <Posts posts={switching.posts} />
                </div>
              ) : null}
            </div>
            <div className="card lg">
              <div className="card-title">Switching drivers</div>
              <Reasons reasons={switching?.reasons} />
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
      scope="sb-bp"
      brandName={brandName}
      subtitle={
        <>
          Brand Intelligence · Brand Perception
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
