/**
 * Social Audit — the Social Audit Tier-1 pillar's single Tier-2 screen.
 * Seven tabs (overview + conversation landscape + three fixed research
 * pillars + additional insights + appendix), all read from one payload:
 * consumer_intelligence/storyboard/social_audit.py. Single brand, no
 * competitor set. Unlike Social Research/Listening's dataset-driven
 * "pillars", this deck's three pillars (Devices, AI, Screentime) are the
 * audit's own fixed research scope — each pillar tab shows its own
 * generic, dataset-driven themes underneath.
 *
 * Follows the same proven pattern as SocialResearchScreen/SocialListeningScreen:
 * URL-synced tabs, a Chart.js resync pass, and real verbatim evidence via
 * the shared `Quotes` component.
 */
import { Chart } from "chart.js/auto";
import { useCallback, useEffect, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import BrandLogo from "../dashboards/storyboard/BrandLogo.jsx";
import { Card, CategoryDonut, Quotes, SentimentDonut } from "../dashboards/storyboard/blocks.jsx";
import { Legendary, TrajectoryChart } from "../dashboards/storyboard/charts.jsx";
import { mergeLogos } from "../dashboards/storyboard/logos.js";
import {
  AppendixColumns,
  InfluencerCards,
  JumpCards,
  SaBanner,
  SecHead,
  SentimentColumns,
  WhitespaceCards,
} from "../dashboards/storyboard/sa-blocks.jsx";
import "../dashboards/storyboard/sa.css";
import { ThemeShareCards } from "../dashboards/storyboard/sr-blocks.jsx";
import StoryboardShell from "../dashboards/storyboard/StoryboardShell.jsx";
import { StatStrip } from "../dashboards/storyboard/wg-blocks.jsx";
import { paths } from "../router/nav.js";

export const DASHBOARD_KEY = "social_audit";

const KNOWN_TABS = ["overview", "conversation_landscape", "devices", "ai", "screentime", "additional_insights", "appendix"];

const BANNER_VARIANT = {
  overview: "b-navy",
  conversation_landscape: "b-slate",
  devices: "b-blue",
  ai: "b-teal",
  screentime: "b-orange",
  additional_insights: "b-navy",
  appendix: "b-slate",
};

const PILLAR_DONUT_COLORS = ["var(--c1)", "var(--c5)", "var(--c2)"];
const PILLAR_TAB = { devices: "devices", ai: "ai", screentime: "screentime" };

export default function SocialAuditScreen({ chartsData, chartsLoading, chartsError, onBack }) {
  const { projectId, sessionId, tab: tabParam } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const activeTab = KNOWN_TABS.includes(tabParam) ? tabParam : "overview";

  const switchTab = useCallback(
    (id) => {
      navigate(paths.socialaudit(projectId, sessionId, id), { replace: true, state: location.state });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [navigate, projectId, sessionId, location.state],
  );

  const story = chartsData?.[DASHBOARD_KEY];
  const logos = useMemo(() => mergeLogos(chartsData, story?.meta?.logos), [chartsData, story]);

  // Same Chart.js resize/repaint fix proven on Social Research/Listening.
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

  if (chartsLoading) return <div className="sb-state">Loading storyboard…</div>;
  if (!story?.tabs?.length) {
    return (
      <div className={`sb-state${chartsError ? " sb-state--error" : ""}`}>
        Social Audit has no data for this session.{" "}
        {chartsError || "Run Create Dashboard on the Review screen with the Social Audit lens selected."}
      </div>
    );
  }

  const {
    meta = {},
    tabs,
    overview = {},
    conversation_landscape: conversationLandscape = {},
    devices = {},
    ai = {},
    screentime = {},
    additional_insights: additionalInsights = {},
    appendix = {},
  } = story;

  const tab = tabs.find((t) => t.id === activeTab) || tabs[0];
  const otherTabs = tabs.filter((t) => t.id !== "overview");

  const pillarPanel = (pillarTab, variant) => (
    <div className="page">
      <SaBanner banner={pillarTab.banner} variant={variant} brand={meta.brand} logos={logos} />
      <div className="sec">
        <SecHead eyebrow="THEMES" title="What the conversation is about" note={pillarTab.note} />
        <ThemeShareCards themes={pillarTab.themes} />
      </div>
      <div className="sec">
        <SecHead eyebrow="TREND" title="Theme volume over time" />
        <Card title="Mentions per theme, over the capture window" className="lg">
          <TrajectoryChart signals={pillarTab.trend?.signals} days={pillarTab.trend?.days} />
          <Legendary items={pillarTab.trend?.signals?.map((s) => ({ name: s.name, color: s.color }))} />
          {pillarTab.trend_summary ? <div className="comp-summary">{pillarTab.trend_summary}</div> : null}
        </Card>
      </div>
      <div className="sec">
        <SecHead eyebrow="SENTIMENT" title="How the conversation feels" />
        <Card title="Sentiment split" className="lg">
          <SentimentDonut rows={pillarTab.sentiment} />
          {pillarTab.sentiment_summary ? <div className="comp-summary">{pillarTab.sentiment_summary}</div> : null}
        </Card>
        <div style={{ marginTop: 18 }}>
          <SentimentColumns positive={pillarTab.sentiment_positive_text} negative={pillarTab.sentiment_negative_text} />
        </div>
      </div>
      {pillarTab.quotes?.length ? (
        <div className="sec">
          <SecHead eyebrow="SUPPORTING VERBATIMS" title="What people actually say" />
          <Quotes quotes={pillarTab.quotes} logos={logos} />
        </div>
      ) : null}
    </div>
  );

  const panels = {
    overview: (
      <div className="page">
        <SaBanner banner={overview.banner} variant={BANNER_VARIANT.overview} brand={meta.brand} logos={logos} />
        <div className="sec">
          <SecHead eyebrow="AT A GLANCE" title="Where the audit stands." note={meta.window} />
          <StatStrip stats={overview.banner?.stats} />
        </div>
        <div className="sec">
          <SecHead eyebrow="EXPLORE" title="Jump to a section." />
          <JumpCards tabs={otherTabs} onTab={switchTab} brand={meta.brand} />
        </div>
      </div>
    ),

    conversation_landscape: (
      <div className="page">
        <SaBanner banner={conversationLandscape.banner} variant={BANNER_VARIANT.conversation_landscape} brand={meta.brand} logos={logos} />
        <div className="sec">
          <SecHead eyebrow="OVERVIEW" title="Overview of conversation landscape" note={conversationLandscape.note} />
          <Card title="Share of conversation by pillar" className="lg">
            <CategoryDonut rows={conversationLandscape.pillar_split?.map((p) => ({ name: p.name, pct: p.pct, count: p.count }))} colors={PILLAR_DONUT_COLORS} />
          </Card>
        </div>
        <div className="sec">
          <SecHead eyebrow="TREND" title="Pillar volume over time" />
          <Card title="Mentions per pillar, over the capture window" className="lg">
            <TrajectoryChart signals={conversationLandscape.trend?.signals} days={conversationLandscape.trend?.days} />
            <Legendary items={conversationLandscape.trend?.signals?.map((s) => ({ name: s.name, color: s.color }))} />
            {conversationLandscape.trend_summary ? <div className="comp-summary">{conversationLandscape.trend_summary}</div> : null}
          </Card>
        </div>
        <div className="sec">
          <SecHead eyebrow="PER PILLAR" title="Each pillar, in brief" />
          <ThemeShareCards themes={conversationLandscape.pillar_split?.map((p) => ({ key: p.key, title: p.name, pct: p.pct, count: p.count, text: p.text }))} />
        </div>
        {conversationLandscape.quotes?.length ? (
          <div className="sec">
            <SecHead eyebrow="IN THEIR WORDS" title="What people actually say" />
            <Quotes quotes={conversationLandscape.quotes} logos={logos} />
          </div>
        ) : null}
      </div>
    ),

    devices: pillarPanel(devices, BANNER_VARIANT[PILLAR_TAB.devices]),
    ai: pillarPanel(ai, BANNER_VARIANT[PILLAR_TAB.ai]),
    screentime: pillarPanel(screentime, BANNER_VARIANT[PILLAR_TAB.screentime]),

    additional_insights: (
      <div className="page">
        <SaBanner banner={additionalInsights.banner} variant={BANNER_VARIANT.additional_insights} brand={meta.brand} logos={logos} />
        {additionalInsights.top_engaging?.length ? (
          <div className="sec">
            <SecHead eyebrow="TOP ENGAGING CONVERSATIONS" title="What resonated most" note={additionalInsights.note} />
            <Quotes quotes={additionalInsights.top_engaging} logos={logos} />
          </div>
        ) : null}
        {additionalInsights.top_influencers?.length ? (
          <div className="sec">
            <SecHead eyebrow="TOP INFLUENCER VOICES" title="Who's leading the conversation" />
            <InfluencerCards influencers={additionalInsights.top_influencers} logos={logos} />
          </div>
        ) : null}
        {additionalInsights.whitespaces?.length ? (
          <div className="sec">
            <SecHead eyebrow={`WHITESPACES FOR ${(meta.brand || "THE BRAND").toUpperCase()}`} title="Emerging, underserved themes" />
            <WhitespaceCards whitespaces={additionalInsights.whitespaces} />
          </div>
        ) : null}
      </div>
    ),

    appendix: (
      <div className="page">
        <SaBanner banner={appendix.banner} variant={BANNER_VARIANT.appendix} brand={meta.brand} logos={logos} />
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
      scope="sb-social-audit"
      bannerContext={{ brand: meta.brand }}
      brandName={brandName}
      subtitle="Social Audit"
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
