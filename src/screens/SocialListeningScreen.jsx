/**
 * Social Listening — the Social Listening Tier-1 pillar's single Tier-2
 * screen. Six tabs (overview + four sub-lenses + appendix), all read from one
 * payload: consumer_intelligence/storyboard/social_listening.py. Single
 * brand, no competitor set — organised around the dataset's own top
 * computed conversation pillars rather than a hardcoded phrase list.
 *
 * Follows the exact pattern proven on SocialResearchScreen.jsx: URL-synced
 * tabs, a resync pass that force-redraws every live Chart.js instance a few
 * times as this screen's card photos settle the layout (see that screen's
 * comment for why `update()` alone doesn't always repaint), and real
 * verbatim evidence via the shared `Quotes` component.
 */
import { Chart } from "chart.js/auto";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import BrandLogo from "../dashboards/storyboard/BrandLogo.jsx";
import { Card, Quotes, SentimentDonut } from "../dashboards/storyboard/blocks.jsx";
import { Legendary, TrajectoryChart } from "../dashboards/storyboard/charts.jsx";
import { mergeLogos } from "../dashboards/storyboard/logos.js";
import { AppendixColumns, JumpCards, PillarCards, PillarTabs, Rich, SecHead, SlBanner } from "../dashboards/storyboard/sl-blocks.jsx";
import "../dashboards/storyboard/sl.css";
import StoryboardShell from "../dashboards/storyboard/StoryboardShell.jsx";
import { BarList, StatStrip } from "../dashboards/storyboard/wg-blocks.jsx";
import { paths } from "../router/nav.js";

export const DASHBOARD_KEY = "social_listening";

const KNOWN_TABS = ["overview", "overall_expressions", "conversation_settings", "occasions_usage", "expression_deep_dive", "appendix"];

const BANNER_VARIANT = {
  overview: "b-purple",
  overall_expressions: "b-pink",
  conversation_settings: "b-blue",
  occasions_usage: "b-green",
  expression_deep_dive: "b-purple",
  appendix: "b-pink",
};

export default function SocialListeningScreen({ chartsData, chartsLoading, chartsError, onBack }) {
  const { projectId, sessionId, tab: tabParam } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const activeTab = KNOWN_TABS.includes(tabParam) ? tabParam : "overview";

  const switchTab = useCallback(
    (id) => {
      navigate(paths.sociallistening(projectId, sessionId, id), { replace: true, state: location.state });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [navigate, projectId, sessionId, location.state],
  );

  const story = chartsData?.[DASHBOARD_KEY];
  const logos = useMemo(() => mergeLogos(chartsData, story?.meta?.logos), [chartsData, story]);

  // Same Chart.js resize/repaint fix proven on Social Research: force a
  // resize + unconditional draw a few times as card photos load and settle
  // the page layout, since Chart.js's own update() can skip the repaint.
  useEffect(() => {
    const resync = () => {
      Object.values(Chart.instances).forEach((inst) => {
        try {
          inst.resize();
          inst.draw();
        } catch {
          // instance may have unmounted between the timer firing and this running
        }
      });
    };
    const delays = [400, 900, 1600, 2600, 4000];
    const timers = delays.map((ms) => setTimeout(resync, ms));
    return () => timers.forEach(clearTimeout);
  }, [activeTab]);

  const [oeIdx, setOeIdx] = useState(0);
  const [csIdx, setCsIdx] = useState(0);
  const [ouIdx, setOuIdx] = useState(0);

  if (chartsLoading) return <div className="sb-state">Loading storyboard…</div>;
  if (!story?.tabs?.length) {
    return (
      <div className={`sb-state${chartsError ? " sb-state--error" : ""}`}>
        Social Listening has no data for this session.{" "}
        {chartsError || "Run Create Dashboard on the Review screen with the Social Listening lens selected."}
      </div>
    );
  }

  const {
    meta = {},
    tabs,
    overview = {},
    overall_expressions: overallExpressions = {},
    conversation_settings: conversationSettings = {},
    occasions_usage: occasionsUsage = {},
    expression_deep_dive: expressionDeepDive = {},
    appendix = {},
  } = story;

  const tab = tabs.find((t) => t.id === activeTab) || tabs[0];
  const otherTabs = tabs.filter((t) => t.id !== "overview");

  const pillarNames = (overallExpressions.pillars || []).map((p) => p.title);
  const oeActive = overallExpressions.pillar_breakdown?.[Math.min(oeIdx, (overallExpressions.pillar_breakdown?.length || 1) - 1)];
  const csActive = conversationSettings.pillar_breakdown?.[Math.min(csIdx, (conversationSettings.pillar_breakdown?.length || 1) - 1)];
  const ouActive = occasionsUsage.pillar_breakdown?.[Math.min(ouIdx, (occasionsUsage.pillar_breakdown?.length || 1) - 1)];

  const panels = {
    overview: (
      <div className="page">
        <SlBanner banner={overview.banner} variant={BANNER_VARIANT.overview} brand={meta.brand} logos={logos} />
        <div className="sec">
          <SecHead eyebrow="AT A GLANCE" title="Where the brand's social listening stands." note={meta.window} />
          <StatStrip stats={overview.banner?.stats} />
        </div>
        <div className="sec">
          <SecHead eyebrow="EXPLORE" title="Jump to a section." />
          <JumpCards tabs={otherTabs} onTab={switchTab} brand={meta.brand} />
        </div>
      </div>
    ),

    overall_expressions: (
      <div className="page">
        <SlBanner banner={overallExpressions.banner} variant={BANNER_VARIANT.overall_expressions} brand={meta.brand} logos={logos} />
        <div className="sec">
          <SecHead eyebrow="PILLARS" title="What the conversation is about" note={overallExpressions.note} />
          <PillarCards pillars={overallExpressions.pillars} />
        </div>
        <div className="sec">
          <SecHead eyebrow="TREND" title="Pillar volume over time" />
          <Card title="Mentions per pillar, over the capture window" className="lg">
            <TrajectoryChart signals={overallExpressions.trend?.signals} days={overallExpressions.trend?.days} />
            <Legendary items={overallExpressions.trend?.signals?.map((s) => ({ name: s.name, color: s.color }))} />
            {overallExpressions.trend_summary ? <div className="comp-summary">{overallExpressions.trend_summary}</div> : null}
          </Card>
        </div>
        <div className="sec">
          <SecHead eyebrow="PER PILLAR" title="Who uses it, and where" />
          <PillarTabs pillars={pillarNames} active={oeIdx} onChange={setOeIdx} />
          {oeActive ? (
            <div className="card comp-card">
              <div className="card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {oeActive.pillar}
                <span className="muted" style={{ marginLeft: "auto", fontWeight: 600 }}>
                  {oeActive.mentions} mentions
                </span>
              </div>
              {oeActive.text ? (
                <p style={{ margin: "6px 0 16px" }}>
                  <Rich text={oeActive.text} />
                </p>
              ) : null}
              <div className="comp-sub">Platform distribution</div>
              <BarList rows={oeActive.platforms} compact />
            </div>
          ) : null}
        </div>
        {overallExpressions.quotes?.length ? (
          <div className="sec">
            <SecHead eyebrow="IN THEIR WORDS" title="What people actually say" />
            <Quotes quotes={overallExpressions.quotes} logos={logos} />
          </div>
        ) : null}
      </div>
    ),

    conversation_settings: (
      <div className="page">
        <SlBanner banner={conversationSettings.banner} variant={BANNER_VARIANT.conversation_settings} brand={meta.brand} logos={logos} />
        <div className="sec">
          <SecHead eyebrow="PER PILLAR" title="Where each pillar's conversation actually happens" note={conversationSettings.note} />
          <PillarTabs pillars={pillarNames} active={csIdx} onChange={setCsIdx} />
          {csActive ? (
            <div className="card comp-card">
              <div className="card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {csActive.pillar}
                <span className="muted" style={{ marginLeft: "auto", fontWeight: 600 }}>
                  {csActive.mentions} mentions
                </span>
              </div>
              {csActive.text ? (
                <p style={{ margin: "6px 0 16px" }}>
                  <Rich text={csActive.text} />
                </p>
              ) : null}
              <div className="comp-sub">Conversation setting</div>
              <BarList rows={csActive.settings} compact />
            </div>
          ) : null}
        </div>
      </div>
    ),

    occasions_usage: (
      <div className="page">
        <SlBanner banner={occasionsUsage.banner} variant={BANNER_VARIANT.occasions_usage} brand={meta.brand} logos={logos} />
        <div className="sec">
          <SecHead eyebrow="PER PILLAR" title="How occasion-tied each pillar's conversation is" note={occasionsUsage.note} />
          <PillarTabs pillars={pillarNames} active={ouIdx} onChange={setOuIdx} />
          {ouActive ? (
            <div className="card comp-card">
              <div className="card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {ouActive.pillar}
                <span className="muted" style={{ marginLeft: "auto", fontWeight: 600 }}>
                  {ouActive.relevant_pct}% occasion-relevant
                </span>
              </div>
              {ouActive.text ? (
                <p style={{ margin: "6px 0 16px" }}>
                  <Rich text={ouActive.text} />
                </p>
              ) : null}
              {ouActive.occasion_types?.length ? (
                <>
                  <div className="comp-sub">Occasion type (of occasion-relevant posts)</div>
                  <BarList rows={ouActive.occasion_types} compact />
                </>
              ) : (
                <div className="muted">No occasion-tied posts for this pillar in this dataset.</div>
              )}
            </div>
          ) : null}
        </div>
        {occasionsUsage.quotes?.length ? (
          <div className="sec">
            <SecHead eyebrow="IN THEIR WORDS" title="What people actually say" />
            <Quotes quotes={occasionsUsage.quotes} logos={logos} />
          </div>
        ) : null}
      </div>
    ),

    expression_deep_dive: (
      <div className="page">
        <SlBanner banner={expressionDeepDive.banner} variant={BANNER_VARIANT.expression_deep_dive} brand={meta.brand} logos={logos} />
        {expressionDeepDive.note ? (
          <div className="sec">
            <p className="muted">{expressionDeepDive.note}</p>
          </div>
        ) : null}
        <div className="sec">
          <div className="grid g2">
            <Card title="Literal vs. figurative usage" className="lg">
              <BarList rows={expressionDeepDive.literal_vs_figurative} />
              {expressionDeepDive.literal_vs_figurative_summary ? (
                <div className="comp-summary">{expressionDeepDive.literal_vs_figurative_summary}</div>
              ) : null}
            </Card>
            <Card title="Sentiment" className="lg">
              <SentimentDonut rows={expressionDeepDive.sentiment} />
              {expressionDeepDive.sentiment_summary ? <div className="comp-summary">{expressionDeepDive.sentiment_summary}</div> : null}
            </Card>
          </div>
        </div>
        {expressionDeepDive.figurative_settings?.length ? (
          <div className="sec">
            <SecHead eyebrow="WITHIN FIGURATIVE USAGE" title="Top conversation settings" />
            <Card title="Conversation setting, figurative posts only" className="lg">
              <BarList rows={expressionDeepDive.figurative_settings} compact />
              {expressionDeepDive.figurative_settings_summary ? (
                <div className="comp-summary">{expressionDeepDive.figurative_settings_summary}</div>
              ) : null}
            </Card>
          </div>
        ) : null}
        {expressionDeepDive.quotes?.length ? (
          <div className="sec">
            <SecHead eyebrow="IN THEIR WORDS" title="What people actually say" />
            <Quotes quotes={expressionDeepDive.quotes} logos={logos} />
          </div>
        ) : null}
      </div>
    ),

    appendix: (
      <div className="page">
        <SlBanner banner={appendix.banner} variant={BANNER_VARIANT.appendix} brand={meta.brand} logos={logos} />
        <div className="sec">
          <SecHead eyebrow="APPENDIX" title="Source citations" note={appendix.note} />
          <AppendixColumns groups={appendix.groups} logos={logos} />
        </div>
      </div>
    ),
  };

  const brandName = (
    <>
      <BrandLogo brand={meta.brand || "Brand"} logos={logos} size={22} rounded={6} />
      {meta.brand || "Brand"}
    </>
  );

  return (
    <StoryboardShell
      scope="sb-social-listening"
      bannerContext={{ brand: meta.brand }}
      brandName={brandName}
      subtitle="Social Listening"
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
