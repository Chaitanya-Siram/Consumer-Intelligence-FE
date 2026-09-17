/**
 * Track Emerging Issues — Tier-2 lens under the Issues Intelligence pillar.
 *
 * Three tabs, following the approved deck (pages 7–13): the issue's lifecycle
 * and awareness trendline; audience behaviour and usage; the themes, drivers
 * and single-vs-multiple perception. Layout and styling follow the Brand &
 * Competitive storyboard. Reads `chartsData.track_emerging_issues`; until the
 * backend publishes that key it renders the sample payload in tei-sample.js
 * and says so in the header.
 */
import { useCallback, useState } from "react";

import {
  BarList,
  Bullets,
  Divider,
  Donut,
  DriverList,
  Funnel,
  JourneyRail,
  ProfileCards,
  Quote,
  SecHead,
  TeiBanner,
  ThemeCards,
  TrendLine,
  UsageQuadrants,
} from "../dashboards/storyboard/tei-blocks.jsx";
import StoryboardShell from "../dashboards/storyboard/StoryboardShell.jsx";
import { TEI_SAMPLE } from "../dashboards/storyboard/tei-sample.js";
import "../dashboards/storyboard/tei.css";

export const DASHBOARD_KEY = "track_emerging_issues";
const BANNER_VARIANT = { t1: "b-purple", t2: "b-pink", t3: "b-green" };

export default function TrackEmergingIssuesScreen({
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

  if (chartsLoading) return <div className="sb-state">Loading storyboard…</div>;

  // A missing key is expected until the backend ships this lens: fall back to
  // the sample rather than showing an empty state, so the layout stays
  // reviewable. A charts *error* still surfaces if the payload had nothing.
  const live = chartsData?.[DASHBOARD_KEY];
  const story = live?.tabs?.length ? live : TEI_SAMPLE;
  const isSample = story === TEI_SAMPLE;
  if (chartsError && !live && !isSample) {
    return <div className="sb-state sb-state--error">{chartsError}</div>;
  }

  const { meta = {}, tabs, journey, trend, behaviour, themes, motivation, multi } = story;
  const tab = tabs.find((t) => t.id === activeTab) || tabs[0];

  const panels = {
    t1: (
      <div className="page">
        <TeiBanner banner={journey?.banner} variant={BANNER_VARIANT.t1} />
        <div className="sec">
          <SecHead
            eyebrow="LIFECYCLE FRAMEWORK"
            title="The stages the audience moves through"
            note="Discovery → documentation → verification → activation. Sub-steps are the touchpoints the conversation actually names."
          />
          <JourneyRail stages={journey?.stages} />
        </div>
        <div className="sec">
          <SecHead eyebrow="AWARENESS" title="Mention trendline for the issue" note={trend?.headline} />
          <div className="card lg">
            {trend?.title ? <div className="card-title">{trend.title}</div> : null}
            <TrendLine trend={trend} />
          </div>
        </div>
      </div>
    ),

    t2: (
      <div className="page">
        <TeiBanner banner={behaviour?.banner} variant={BANNER_VARIANT.t2} />
        <div className="sec">
          <SecHead
            eyebrow="AUDIENCE PROFILE"
            title="Behaviour, interests and attitude"
            note="What the segment does, what it cares about, and the stance it takes toward the category."
          />
          <ProfileCards profile={behaviour?.profile} />
        </div>
        <div className="sec">
          <SecHead
            eyebrow="USAGE INSIGHTS"
            title="How the segment actually uses the product"
            note={behaviour?.usage_note}
          />
          <UsageQuadrants usage={behaviour?.usage} />
        </div>
      </div>
    ),

    t3: (
      <div className="page">
        <TeiBanner banner={themes?.banner} variant={BANNER_VARIANT.t3} />
        <div className="sec">
          <SecHead
            eyebrow="THEMATIC STUDY"
            title="What the conversation is about"
            note="Share of issue-related posts by theme. Percentages sum to the rated set."
          />
          <Funnel steps={themes?.funnel} />
          <div className="grid g5-7" style={{ marginTop: 18 }}>
            <div className="card">
              <div className="card-title">Themes of discussion</div>
              <BarList rows={themes?.rows} color="var(--c1)" />
            </div>
            <div className="card">
              <div className="card-title">What each theme is saying</div>
              <ThemeCards rows={themes?.rows} />
            </div>
          </div>
        </div>

        <div className="sec">
          <SecHead eyebrow="MOTIVATION" title="What drives the choice" note={motivation?.note} />
          <div className="grid g4-8">
            <div className="card">
              <div className="card-title">Share of motivation mentions</div>
              <Donut parts={motivation?.split} />
            </div>
            <div className="card">
              <div className="card-title">Driver detail</div>
              <DriverList drivers={motivation?.drivers} />
            </div>
          </div>
        </div>

        <div className="sec">
          <SecHead
            eyebrow="SINGLE VS MULTIPLE"
            title="One product or several, and how each is perceived"
            note={multi?.note}
          />
          <div className="grid g2">
            <div className="card">
              <div className="card-title">Single vs multiple</div>
              <Donut parts={multi?.holders} colors={["var(--c1)", "var(--c2)"]} />
            </div>
            <div className="card">
              <div className="card-title">Sentiment</div>
              <Donut parts={multi?.sentiment} />
            </div>
          </div>
          <div className="grid g2" style={{ marginTop: 18 }}>
            <HolderCard title="Themes · single product holders" data={multi?.single} color="var(--c1)" />
            <HolderCard title="Themes · multiple product holders" data={multi?.multiple} color="var(--c2)" />
          </div>
        </div>
      </div>
    ),
  };

  return (
    <StoryboardShell
      scope="sb-tei"
      brandName={meta.brand || "Emerging Issues"}
      subtitle={
        <>
          Issues Intelligence · Track Emerging Issues
          {isSample ? <span className="sample-pill" style={{ marginLeft: 10 }}>Sample data</span> : null}
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

function HolderCard({ title, data, color }) {
  if (!data) return null;
  return (
    <div className="card">
      <div className="card-title">{title}</div>
      <BarList rows={data.rows} color={color} />
      {data.points?.length ? (
        <>
          <Divider />
          <Bullets points={data.points} />
        </>
      ) : null}
      {data.quote ? (
        <div style={{ marginTop: 14 }}>
          <Quote quote={data.quote} />
        </div>
      ) : null}
    </div>
  );
}
