/**
 * Congruence & Content Intelligence — Tier-2 lens under the AI/LLM Audit and
 * Analysis pillar.
 *
 * Four tabs from the service deck: an overview of the three-stage framework,
 * then one tab per stage — LLM Analysis (who shapes the narrative: ranked
 * sources and journalists), LLM Interpretation (sentiment, themes, per-LLM
 * matrix, scores), Brand Narrative Intelligence Scan (intent vs LLM narrative,
 * heat-map, risk and opportunity flags, actions). Reads
 * `chartsData.congruence_content`; renders cc-sample.js until the backend ships it.
 */
import { useCallback, useMemo, useState } from "react";

import {
  BarList, Bullets, Flags, Flow, HeatMap, JournalistTable, LlmChips, Outcomes, PillarRows, ScoreTiles,
  SecHead, SentimentDonut, SourceTable, StageCards, ThemeBubbles, WgBanner, Words,
} from "../dashboards/storyboard/cc-blocks.jsx";
import BrandLogo from "../dashboards/storyboard/BrandLogo.jsx";
import StoryboardShell from "../dashboards/storyboard/StoryboardShell.jsx";
import { CC_SAMPLE } from "../dashboards/storyboard/cc-sample.js";
import { mergeLogos } from "../dashboards/storyboard/logos.js";
import "../dashboards/storyboard/wg.css";
import "../dashboards/storyboard/cc.css";

export const DASHBOARD_KEY = "congruence_content";
const BANNER_VARIANT = { t1: "b-purple", t2: "b-purple", t3: "b-blue", t4: "b-green" };

export default function CongruenceContentScreen({ chartsData, chartsLoading, chartsError, onBack }) {
  const [activeTab, setActiveTab] = useState("t1");
  const switchTab = useCallback((id) => {
    setActiveTab(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const live = chartsData?.[DASHBOARD_KEY];
  const story = live?.tabs?.length ? live : CC_SAMPLE;
  const isSample = story === CC_SAMPLE;
  const logos = useMemo(() => mergeLogos(chartsData, story.meta?.logos), [chartsData, story]);

  if (chartsLoading) return <div className="sb-state">Loading storyboard…</div>;
  if (chartsError && !live && !isSample) return <div className="sb-state sb-state--error">{chartsError}</div>;

  const { meta = {}, tabs, overview, analysis, interpretation, scan } = story;
  const tab = tabs.find((t) => t.id === activeTab) || tabs[0];

  const panels = {
    t1: (
      <div className="page">
        <WgBanner banner={overview?.banner} variant={BANNER_VARIANT.t1} />
        <div className="sec">
          <SecHead eyebrow="HOW IT WORKS" title="Brand content, as perceived by different LLMs" note={overview?.note} />
          <Flow inputs={overview?.inputs} llms={meta.llms} datasets={overview?.datasets} />
        </div>
        <div className="sec">
          <SecHead eyebrow="INSIGHTS FRAMEWORK" title="Three stages, from sources to the delta" note="Each stage is a tab above. Questions, method and deliverables per stage." />
          <StageCards stages={overview?.stages} />
        </div>
        <div className="sec">
          <SecHead eyebrow="BENEFITS" title="What the audit produces" />
          <Outcomes outcomes={overview?.outcomes} />
        </div>
      </div>
    ),

    t2: (
      <div className="page">
        <WgBanner banner={analysis?.banner} variant={BANNER_VARIANT.t2} />
        <div className="sec">
          <SecHead eyebrow="LLM ANALYSIS" title="Who is shaping the conversation inside LLMs" accent="?" note={analysis?.note} />
          <div className="grid g4-8">
            <div className="stack">
              <div className="card lg">
                <div className="card-title">Source types</div>
                <BarList rows={analysis?.source_types} color="var(--c1)" />
              </div>
              {analysis?.concentration ? (
                <div className="card">
                  <div className="card-title">Where influence concentrates</div>
                  <p className="lead" style={{ fontSize: 13.5 }}>{analysis.concentration}</p>
                </div>
              ) : null}
            </div>
            <div className="card lg">
              <div className="card-title">Ranked media sources</div>
              <SourceTable sources={analysis?.sources} logos={logos} />
            </div>
          </div>
          <div className="card lg" style={{ marginTop: 18 }}>
            <div className="card-title">Journalist / reporter influence</div>
            <JournalistTable journalists={analysis?.journalists} />
          </div>
        </div>
      </div>
    ),

    t3: (
      <div className="page">
        <WgBanner banner={interpretation?.banner} variant={BANNER_VARIANT.t3} />
        <div className="sec">
          <SecHead eyebrow="LLM INTERPRETATION STUDY" title="How the brand is described across LLMs" note={interpretation?.note} />
          <div className="grid g4-8">
            <div className="stack">
              <div className="card lg">
                <div className="card-title">Dominating sentiment</div>
                <SentimentDonut s={interpretation?.sentiment} />
                {interpretation?.sentiment_note ? <p className="muted" style={{ marginTop: 16 }}>{interpretation.sentiment_note}</p> : null}
              </div>
              <div className="card">
                <div className="card-title">Language cues</div>
                <Words words={interpretation?.language} />
              </div>
            </div>
            <div className="card lg">
              <div className="card-title">Top themes · responses touching each</div>
              <ThemeBubbles themes={interpretation?.themes} />
            </div>
          </div>
          <div className="grid g2" style={{ marginTop: 18 }}>
            <div className="card lg">
              <div className="card-title">Theme × sentiment matrix</div>
              <HeatMap cols={interpretation?.matrix?.llms} rows={interpretation?.matrix?.rows} rowKey="theme" diverging legend={interpretation?.matrix?.legend} />
            </div>
            <div className="card lg">
              <div className="card-title">Narrative strength &amp; consistency</div>
              <ScoreTiles scores={interpretation?.scores} />
            </div>
          </div>
        </div>
      </div>
    ),

    t4: (
      <div className="page">
        <WgBanner banner={scan?.banner} variant={BANNER_VARIANT.t4} />
        <div className="sec">
          <SecHead eyebrow="BRAND NARRATIVE INTELLIGENCE SCAN" title={`${meta.brand || "Brand"} intent vs. LLM narrative`} note={scan?.note} />
          <div className="card lg">
            <PillarRows pillars={scan?.pillars} brand={meta.brand} />
          </div>
        </div>
        <div className="sec">
          <div className="grid g7-5" style={{ gridTemplateColumns: "7fr 5fr" }}>
            <div className="card lg">
              <div className="card-title">Consistency / incongruence heat-map</div>
              <HeatMap cols={scan?.heatmap?.llms} rows={scan?.heatmap?.rows} rowKey="pillar" legend={scan?.heatmap?.legend} />
            </div>
            <div className="card lg">
              <div className="card-title">Recommended actions</div>
              <Bullets points={scan?.actions} />
            </div>
          </div>
        </div>
        <div className="sec">
          <SecHead eyebrow="THE DELTA" title="Opportunity and risk flags" />
          <Flags flags={scan?.flags} />
        </div>
      </div>
    ),
  };

  return (
    <StoryboardShell
      scope="sb-wg sb-cc"
      bannerContext={{ brand: meta.brand, category: meta.category }}
      brandName={<><BrandLogo brand={meta.brand || "Brand"} logos={logos} size={22} rounded={6} />{meta.brand || "Brand"}{meta.category ? <span style={{ fontWeight: 600, color: "var(--ink3)" }}>· {meta.category}</span> : null}</>}
      subtitle={<>AI/LLM Audit and Analysis · Congruence &amp; Content Intelligence{isSample ? <span className="sample-pill">Sample data</span> : null}</>}
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
