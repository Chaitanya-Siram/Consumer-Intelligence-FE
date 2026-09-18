/**
 * User Behaviour Analysis — Tier-2 lens under the Consumer Segmentation
 * Analysis pillar.
 *
 * Two tabs from the approved deck (pages 32–34): the audience's age
 * sub-segments and what defines each; why they carry multiple cards and how
 * they choose between them, with brand choice. Reuses the Whitespace shared
 * styles and blocks. Reads `chartsData.user_behaviour`; renders ub-sample.js
 * with a "Sample data" pill until the backend ships it.
 */
import { useCallback, useMemo, useState } from "react";

import { BarList, Bullets, Rich, SecHead, WgBanner } from "../dashboards/storyboard/wg-blocks.jsx";
import BrandLogo from "../dashboards/storyboard/BrandLogo.jsx";
import StoryboardShell from "../dashboards/storyboard/StoryboardShell.jsx";
import { UB_SAMPLE } from "../dashboards/storyboard/ub-sample.js";
import { mergeLogos } from "../dashboards/storyboard/logos.js";
import "../dashboards/storyboard/wg.css";
import "../dashboards/storyboard/ub.css";

export const DASHBOARD_KEY = "user_behaviour";
const BANNER_VARIANT = { t1: "b-purple", t2: "b-blue" };
const SEG_COLORS = ["var(--c1)", "var(--c2)", "var(--c4)", "var(--c5)"];

export default function UserBehaviourScreen({ chartsData, chartsLoading, chartsError, onBack }) {
  const [activeTab, setActiveTab] = useState("t1");
  const switchTab = useCallback((id) => {
    setActiveTab(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const live = chartsData?.[DASHBOARD_KEY];
  const story = live?.tabs?.length ? live : UB_SAMPLE;
  const isSample = story === UB_SAMPLE;
  const logos = useMemo(() => mergeLogos(chartsData, story.meta?.logos), [chartsData, story]);

  if (chartsLoading) return <div className="sb-state">Loading storyboard…</div>;
  if (chartsError && !live && !isSample) return <div className="sb-state sb-state--error">{chartsError}</div>;

  const { meta = {}, tabs, segments, multi } = story;
  const tab = tabs.find((t) => t.id === activeTab) || tabs[0];
  const segMax = Math.max(...(segments?.groups || []).map((g) => Number(g.pct) || 0), 1);

  const panels = {
    t1: (
      <div className="page">
        <WgBanner banner={segments?.banner} variant={BANNER_VARIANT.t1} />
        <div className="sec">
          <SecHead eyebrow="SUB-SEGMENTS" title="What are the sub-segments of the audience" accent="?" note={segments?.note} />
          {segments?.lead ? (
            <p className="lead" style={{ marginBottom: 18, maxWidth: 900 }}>
              <Rich text={segments.lead} />
            </p>
          ) : null}
          <div className="segs">
            {(segments?.groups || []).map((g, i) => (
              <div className="card seg" key={g.key || g.title} style={{ borderColor: SEG_COLORS[i % SEG_COLORS.length] }}>
                <div className="range">
                  {g.range}
                  {g.pct != null ? <small>of posts</small> : null}
                </div>
                <h4 style={{ color: SEG_COLORS[i % SEG_COLORS.length] }}>{g.title}</h4>
                {g.pct != null ? (
                  <div className="share">
                    <div className="track">
                      <div className="fill" style={{ width: `${(g.pct / segMax) * 100}%`, background: SEG_COLORS[i % SEG_COLORS.length] }} />
                    </div>
                    <span className="v">{g.pct}%</span>
                  </div>
                ) : null}
                <Bullets points={g.points} />
              </div>
            ))}
          </div>
        </div>
      </div>
    ),

    t2: (
      <div className="page">
        <WgBanner banner={multi?.banner} variant={BANNER_VARIANT.t2} />
        <div className="sec">
          <SecHead eyebrow="KEY DRIVERS" title="What makes them choose multiple credit cards" accent="?" note={multi?.note} />
          <div className="grid g4-8">
            <div className="card lg" style={{ alignSelf: "start" }}>
              <div className="card-title">Brand choice</div>
              <BarList rows={multi?.brand_choice} logos={logos} />
            </div>
            <div className="card lg qa">
              {(multi?.questions || []).map((qa, i) => (
                <div className="row" key={qa.q}>
                  <div className="q">{qa.q}</div>
                  <div className="a" style={{ borderColor: SEG_COLORS[i % SEG_COLORS.length] }}>
                    <Bullets points={qa.points} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
  };

  return (
    <StoryboardShell
      scope="sb-wg sb-ub"
      brandName={<><BrandLogo brand={meta.brand || "Brand"} logos={logos} size={22} rounded={6} />{meta.brand || "Brand"}{meta.category ? <span style={{ fontWeight: 600, color: "var(--ink3)" }}>· {meta.category}</span> : null}</>}
      subtitle={<>Consumer Segmentation Analysis · User Behaviour Analysis{isSample ? <span className="sample-pill">Sample data</span> : null}</>}
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
