/**
 * Social Research — the Social Research Tier-1 pillar's single Tier-2
 * screen. Seven tabs (overview + six sub-lenses), all read from one payload:
 * consumer_intelligence/storyboard/social_research.py. There is no sample
 * fallback — every number and citation comes from the session's tagged
 * articles, so until the backend returns `chartsData.social_research` the
 * screen says so, the same way ShiftingAudiencePrioritiesScreen does.
 *
 * The active tab is URL-synced (`/social-research/:tab?`) rather than kept
 * only in component state, so a tab is linkable/shareable/back-button-able.
 * `switchTab` navigates with `replace: true` and carries the current
 * `location.state` forward (the project/session/chartsData the fast-path
 * navigation pattern in router/nav.js relies on) so switching tabs never
 * forces a chart refetch.
 */
import { Chart } from "chart.js/auto";
import { useCallback, useEffect, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import BrandLogo from "../dashboards/storyboard/BrandLogo.jsx";
import { Callout, Card, MatrixTable, Quotes, SentimentDonut, VerdictColumns } from "../dashboards/storyboard/blocks.jsx";
import { Legendary, NetSentimentChart, ShareOfVoiceChart, TrajectoryChart } from "../dashboards/storyboard/charts.jsx";
import { mergeLogos } from "../dashboards/storyboard/logos.js";
import "../dashboards/storyboard/sr.css";
import {
  AppendixColumns,
  CompetitorBreakdown,
  CultureAssociationCards,
  EntityCards,
  FeelPills,
  InsightCards,
  JumpCards,
  PillarsRow,
  SecHead,
  SrBanner,
  ThemeShareCards,
} from "../dashboards/storyboard/sr-blocks.jsx";
import StoryboardShell from "../dashboards/storyboard/StoryboardShell.jsx";
import { StatStrip } from "../dashboards/storyboard/wg-blocks.jsx";
import { paths } from "../router/nav.js";

export const DASHBOARD_KEY = "social_research";

const KNOWN_TABS = [
  "overview",
  "brand_perception",
  "competitive_cultural",
  "occasions_behaviors",
  "motivations_identity",
  "cultural_spaces",
  "appendix",
];

const BANNER_VARIANT = {
  overview: "b-purple",
  brand_perception: "b-pink",
  competitive_cultural: "b-blue",
  occasions_behaviors: "b-green",
  motivations_identity: "b-purple",
  cultural_spaces: "b-pink",
  appendix: "b-blue",
};

export default function SocialResearchScreen({ chartsData, chartsLoading, chartsError, onBack }) {
  const { projectId, sessionId, tab: tabParam } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const activeTab = KNOWN_TABS.includes(tabParam) ? tabParam : "overview";

  // Carries the current location.state (project/session/chartsData) forward
  // so a tab switch stays on the fast path in router/nav.js and never
  // triggers a refetch.
  const switchTab = useCallback(
    (id) => {
      navigate(paths.socialresearch(projectId, sessionId, id), { replace: true, state: location.state });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [navigate, projectId, sessionId, location.state],
  );

  const story = chartsData?.[DASHBOARD_KEY];
  const logos = useMemo(() => mergeLogos(chartsData, story?.meta?.logos), [chartsData, story]);

  // The Chart.js canvases (trend/share-of-voice/net-sentiment) can compute a
  // correct scale internally (confirmed: Chart.js's own scale/point model is
  // right) but never actually repaint the canvas to match once this screen's
  // card photo thumbnails finish loading and shift the page layout —
  // Chart.js's `update()` short-circuits the redraw in this situation, only
  // an unconditional `draw()` forces the canvas to catch up. Chart.js keeps a
  // registry of every live instance (`Chart.instances`), so this is fixed
  // from here without touching the shared charts.jsx primitives: force a
  // resize + unconditional draw a few times as thumbnails settle in.
  const chartKey = 0;
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
        Social Research has no data for this session.{" "}
        {chartsError || "Run Create Dashboard on the Review screen with the Social Research lens selected."}
      </div>
    );
  }

  const {
    meta = {},
    tabs,
    overview = {},
    brand_perception: brandPerception = {},
    competitive_cultural: competitiveCultural = {},
    occasions_behaviors: occasionsBehaviors = {},
    motivations_identity: motivationsIdentity = {},
    cultural_spaces: culturalSpaces = {},
    appendix = {},
  } = story;

  const tab = tabs.find((t) => t.id === activeTab) || tabs[0];
  const otherTabs = tabs.filter((t) => t.id !== "overview");

  const driverColumns = [
    {
      title: "Positive Drivers",
      tone: "positive",
      items: (brandPerception.drivers?.positive || []).map((d) => ({
        label: d.title,
        text: d.count != null ? `${d.count} mentions` : "",
      })),
    },
    {
      title: "Negative Drivers",
      tone: "negative",
      items: (brandPerception.drivers?.negative || []).map((d) => ({
        label: d.title,
        text: d.count != null ? `${d.count} mentions` : "",
      })),
    },
  ];

  const whitespaceColumns = [
    { key: "topic", label: "Whitespace Topic" },
    { key: "why", label: "Why It's a Whitespace" },
    { key: "gap_text", label: "Positioning Gap" },
    { key: "entry", label: "Recommended Entry Point" },
  ];

  const panels = {
    overview: (
      <div className="page">
        <SrBanner banner={overview.banner} variant={BANNER_VARIANT.overview} brand={meta.brand} logos={logos} />
        <div className="sec">
          <SecHead eyebrow="AT A GLANCE" title="Where the brand's social research stands" note={meta.window} />
          <StatStrip stats={overview.banner?.stats} />
        </div>
        {overview.note ? (
          <div className="sec">
            <Callout text={overview.note} />
          </div>
        ) : null}
        <div className="sec">
          <SecHead eyebrow="EXPLORE" title="Jump to a section" />
          <JumpCards tabs={otherTabs} onTab={switchTab} brand={meta.brand} />
        </div>
      </div>
    ),

    brand_perception: (
      <div className="page">
        <SrBanner banner={brandPerception.banner} variant={BANNER_VARIANT.brand_perception} brand={meta.brand} logos={logos} />
        <div className="sec">
          <SecHead eyebrow="LEADING THEMES" title="What the conversation is about" note={brandPerception.note} />
          <ThemeShareCards themes={brandPerception.themes} />
        </div>
        <div className="sec">
          <SecHead eyebrow="TREND" title="Theme volume over time" />
          <Card title="Mentions per theme, over the capture window" className="lg">
            <TrajectoryChart key={chartKey} signals={brandPerception.trend?.signals} days={brandPerception.trend?.days} />
            <Legendary items={brandPerception.trend?.signals?.map((s) => ({ name: s.name, color: s.color }))} />
            {brandPerception.trend_summary ? <div className="comp-summary">{brandPerception.trend_summary}</div> : null}
          </Card>
        </div>
        <div className="sec">
          <SecHead eyebrow="SENTIMENT" title="How the conversation feels" />
          <Card title="Sentiment split" className="lg">
            <SentimentDonut rows={brandPerception.sentiment} />
            {brandPerception.sentiment_summary ? <div className="comp-summary">{brandPerception.sentiment_summary}</div> : null}
          </Card>
          <div style={{ marginTop: 18 }}>
            <VerdictColumns columns={driverColumns} />
          </div>
        </div>
        <div className="sec">
          <SecHead eyebrow="ASSOCIATIONS" title="Where it shows up" />
          <EntityCards entities={brandPerception.associations?.entities} brand={meta.brand} />
        </div>
        <div className="sec">
          <Card title="How it feels" className="lg">
            <FeelPills feel={brandPerception.associations?.feel} />
          </Card>
        </div>
        <div className="sec">
          <SecHead eyebrow="PILLARS" title="The pillars of brand perception" />
          <PillarsRow pillars={brandPerception.pillars} />
        </div>
        {brandPerception.quotes?.length ? (
          <div className="sec">
            <SecHead eyebrow="IN THEIR WORDS" title="What people actually say" />
            <Quotes quotes={brandPerception.quotes} logos={logos} />
          </div>
        ) : null}
      </div>
    ),

    competitive_cultural: (
      <div className="page">
        <SrBanner
          banner={competitiveCultural.banner}
          variant={BANNER_VARIANT.competitive_cultural}
          brand={meta.brand}
          logos={logos}
        />
        <div className="sec">
          <SecHead eyebrow="SHARE OF VOICE" title="Who leads the conversation" note={competitiveCultural.note} />
          <div className="grid g2">
            <Card title="Share of voice" className="lg">
              <ShareOfVoiceChart key={chartKey} rows={competitiveCultural.share_of_voice} brand={meta.brand} />
              {competitiveCultural.share_of_voice_summary ? <div className="comp-summary">{competitiveCultural.share_of_voice_summary}</div> : null}
            </Card>
            <Card title="Net sentiment" className="lg">
              <NetSentimentChart key={chartKey} rows={competitiveCultural.net_sentiment} brand={meta.brand} />
              {competitiveCultural.net_sentiment_summary ? <div className="comp-summary">{competitiveCultural.net_sentiment_summary}</div> : null}
            </Card>
          </div>
        </div>
        <div className="sec">
          <SecHead eyebrow="PER COMPETITOR" title="Each rival's own conversation" />
          <CompetitorBreakdown competitors={competitiveCultural.competitor_breakdown} logos={logos} chartKey={chartKey} />
        </div>
        <div className="sec">
          <SecHead eyebrow="CULTURAL ASSOCIATIONS" title="What each competitor owns culturally" />
          <CultureAssociationCards items={competitiveCultural.culture_associations} logos={logos} />
        </div>
        <div className="sec">
          <SecHead eyebrow="WHITESPACE" title="Where the brand can win next" />
          <Card title="Whitespace & positioning gaps" className="lg">
            <MatrixTable rows={competitiveCultural.whitespace} columns={whitespaceColumns} />
          </Card>
        </div>
        {competitiveCultural.quotes?.length ? (
          <div className="sec">
            <SecHead eyebrow="IN THEIR WORDS" title="What people actually say" />
            <Quotes quotes={competitiveCultural.quotes} logos={logos} />
          </div>
        ) : null}
      </div>
    ),

    occasions_behaviors: (
      <div className="page">
        <SrBanner
          banner={occasionsBehaviors.banner}
          variant={BANNER_VARIANT.occasions_behaviors}
          brand={meta.brand}
          logos={logos}
        />
        <div className="sec">
          <SecHead eyebrow="OCCASIONS" title="When the brand comes up" note={occasionsBehaviors.note} />
          <InsightCards items={occasionsBehaviors.occasions} />
        </div>
        {occasionsBehaviors.quotes?.length ? (
          <div className="sec">
            <SecHead eyebrow="IN THEIR WORDS" title="What people actually say" />
            <Quotes quotes={occasionsBehaviors.quotes} logos={logos} />
          </div>
        ) : null}
      </div>
    ),

    motivations_identity: (
      <div className="page">
        <SrBanner
          banner={motivationsIdentity.banner}
          variant={BANNER_VARIANT.motivations_identity}
          brand={meta.brand}
          logos={logos}
        />
        <div className="sec">
          <SecHead eyebrow="MOTIVATIONS" title="What drives the choice" note={motivationsIdentity.note} />
          <InsightCards items={motivationsIdentity.motivations} />
        </div>
        {motivationsIdentity.quotes?.length ? (
          <div className="sec">
            <SecHead eyebrow="IN THEIR WORDS" title="What people actually say" />
            <Quotes quotes={motivationsIdentity.quotes} logos={logos} />
          </div>
        ) : null}
      </div>
    ),

    cultural_spaces: (
      <div className="page">
        <SrBanner banner={culturalSpaces.banner} variant={BANNER_VARIANT.cultural_spaces} brand={meta.brand} logos={logos} />
        <div className="sec">
          <SecHead eyebrow="CULTURAL SPACES" title="Where the brand lives culturally" note={culturalSpaces.note} />
          <InsightCards items={culturalSpaces.spaces} />
        </div>
        {culturalSpaces.quotes?.length ? (
          <div className="sec">
            <SecHead eyebrow="IN THEIR WORDS" title="What people actually say" />
            <Quotes quotes={culturalSpaces.quotes} logos={logos} />
          </div>
        ) : null}
      </div>
    ),

    appendix: (
      <div className="page">
        <SrBanner banner={appendix.banner} variant={BANNER_VARIANT.appendix} brand={meta.brand} logos={logos} />
        <div className="sec">
          <SecHead eyebrow="APPENDIX" title="Source citations" note={appendix.note} />
          <AppendixColumns groups={appendix.groups} logos={logos} />
        </div>
      </div>
    ),
  };

  const brandName = (
    <>
      <BrandLogo brand={meta.brand || "Brand"} logos={logos} size={28} rounded={7} />
      {meta.brand || "Brand"}
      {meta.category ? <span style={{ fontWeight: 600, color: "var(--ink3)" }}>· {meta.category}</span> : null}
    </>
  );

  return (
    <StoryboardShell
      scope="sb-social-research"
      bannerContext={{ brand: meta.brand, category: meta.category }}
      brandName={brandName}
      subtitle="Social Research"
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
