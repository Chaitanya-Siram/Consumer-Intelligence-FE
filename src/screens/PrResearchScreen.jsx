/**
 * PR Research — the PR Research Tier-1 pillar's single Tier-2 screen. Six
 * tabs (overview + editorial analysis + authors + publications + audience
 * profile + appendix), all read from one payload:
 * consumer_intelligence/storyboard/pr_research.py. Editorial/news lens built
 * around an early-vs-late period comparison (the source deck compares two
 * tax seasons) rather than a competitor set or dataset-driven pillars.
 *
 * No trend chart here, unlike the other three Social lenses — the source
 * deck itself has none; its comparisons are all before/after donuts, driver
 * cards and rankings, not a continuous trendline.
 */
import { useCallback, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import BrandLogo from "../dashboards/storyboard/BrandLogo.jsx";
import { Card, Quotes, SentimentDonut } from "../dashboards/storyboard/blocks.jsx";
import { mergeLogos } from "../dashboards/storyboard/logos.js";
import { AppendixColumns, JumpCards, PeriodTabs, PrBanner, RankTable, Rich, SecHead, ThemeShareCards } from "../dashboards/storyboard/pr-blocks.jsx";
import "../dashboards/storyboard/pr.css";
import StoryboardShell from "../dashboards/storyboard/StoryboardShell.jsx";
import { BarList, StatStrip } from "../dashboards/storyboard/wg-blocks.jsx";
import { paths } from "../router/nav.js";

export const DASHBOARD_KEY = "pr_research";

const KNOWN_TABS = ["overview", "editorial_analysis", "authors", "publications", "audience_profile", "appendix"];

const BANNER_VARIANT = {
  overview: "b-navy",
  editorial_analysis: "b-slate",
  authors: "b-gold",
  publications: "b-navy",
  audience_profile: "b-slate",
  appendix: "b-navy",
};

function fmtEngagement(n) {
  const v = Number(n) || 0;
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return String(v);
}

function fmtSentiment(sentiment) {
  const lead = (sentiment || []).reduce((a, r) => (Number(r.pct) > Number(a?.pct ?? -1) ? r : a), null);
  if (!lead) return "—";
  const label = lead.tone === "pos" ? "positive" : lead.tone === "neg" ? "negative" : "neutral";
  return `${lead.pct}% ${label}`;
}

const AUTHOR_COLUMNS = [
  { key: "name", label: "Author", logo: true, round: 999 },
  { key: "affiliation", label: "Publication", logo: true, logoKey: "logoName" },
  { key: "engagementFmt", label: "Engagement" },
  { key: "articles", label: "Articles" },
  { key: "sentimentFmt", label: "Sentiment" },
];

const PUB_COLUMNS = [
  { key: "name", label: "Publication", logo: true },
  { key: "engagementFmt", label: "Engagement" },
  { key: "articles", label: "Articles" },
  { key: "sentimentFmt", label: "Sentiment" },
];

function withFormatted(rows) {
  return (rows || []).map((r) => ({
    ...r,
    engagementFmt: fmtEngagement(r.engagement),
    sentimentFmt: fmtSentiment(r.sentiment),
    logoName: r.affiliation ? r.affiliation.split(",")[0].trim() : r.name,
  }));
}

export default function PrResearchScreen({ chartsData, chartsLoading, chartsError, onBack }) {
  const { projectId, sessionId, tab: tabParam } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const activeTab = KNOWN_TABS.includes(tabParam) ? tabParam : "overview";

  const switchTab = useCallback(
    (id) => {
      navigate(paths.prresearch(projectId, sessionId, id), { replace: true, state: location.state });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [navigate, projectId, sessionId, location.state],
  );

  const story = chartsData?.[DASHBOARD_KEY];
  const logos = useMemo(() => mergeLogos(chartsData, story?.meta?.logos), [chartsData, story]);

  const [eaPeriod, setEaPeriod] = useState("late");
  const [authorsPeriod, setAuthorsPeriod] = useState("late");
  const [pubsPeriod, setPubsPeriod] = useState("late");
  const [audiencePeriod, setAudiencePeriod] = useState("late");

  if (chartsLoading) return <div className="sb-state">Loading storyboard…</div>;
  if (!story?.tabs?.length) {
    return (
      <div className={`sb-state${chartsError ? " sb-state--error" : ""}`}>
        PR Research has no data for this session.{" "}
        {chartsError || "Run Create Dashboard on the Review screen with the PR Research lens selected."}
      </div>
    );
  }

  const {
    meta = {},
    tabs,
    overview = {},
    editorial_analysis: editorialAnalysis = {},
    authors = {},
    publications = {},
    audience_profile: audienceProfile = {},
    appendix = {},
  } = story;

  const tab = tabs.find((t) => t.id === activeTab) || tabs[0];
  const otherTabs = tabs.filter((t) => t.id !== "overview");

  const resolvePeriod = (section, want) => (want === "early" ? section.early : section.late) || section.early || section.late;

  const eaActive = resolvePeriod(editorialAnalysis, eaPeriod);
  const authorsActive = resolvePeriod(authors, authorsPeriod);
  const pubsActive = resolvePeriod(publications, pubsPeriod);
  const audienceActive = resolvePeriod(audienceProfile, audiencePeriod);

  const panels = {
    overview: (
      <div className="page">
        <PrBanner banner={overview.banner} variant={BANNER_VARIANT.overview} brand={meta.brand} logos={logos} />
        <div className="sec">
          <SecHead eyebrow="AT A GLANCE" title="Where the coverage stands." note={meta.window} />
          <StatStrip stats={overview.banner?.stats} />
        </div>
        <div className="sec">
          <SecHead eyebrow="EXPLORE" title="Jump to a section." />
          <JumpCards tabs={otherTabs} onTab={switchTab} brand={meta.brand} />
        </div>
      </div>
    ),

    editorial_analysis: (
      <div className="page">
        <PrBanner banner={editorialAnalysis.banner} variant={BANNER_VARIANT.editorial_analysis} brand={meta.brand} logos={logos} />
        {editorialAnalysis.narrative_shift ? (
          <div className="sec">
            <SecHead eyebrow="NARRATIVE SHIFT" title="How coverage changed" />
            <div className="callout">
              <Rich text={editorialAnalysis.narrative_shift} />
            </div>
          </div>
        ) : null}
        <div className="sec">
          <SecHead eyebrow="OVERALL SENTIMENT" title="Sentiment, before and after" />
          <div className="grid g2">
            {editorialAnalysis.early ? (
              <Card title={`Earlier · ${editorialAnalysis.early.window}`} className="lg">
                <SentimentDonut rows={editorialAnalysis.early.sentiment} />
                <div className="comp-summary">{editorialAnalysis.early.sentiment_summary}</div>
              </Card>
            ) : null}
            {editorialAnalysis.late ? (
              <Card title={`Later · ${editorialAnalysis.late.window}`} className="lg">
                <SentimentDonut rows={editorialAnalysis.late.sentiment} />
                <div className="comp-summary">{editorialAnalysis.late.sentiment_summary}</div>
              </Card>
            ) : null}
          </div>
        </div>
        <div className="sec">
          <SecHead eyebrow="KEY THEMES" title="What drove positive and negative coverage" />
          <PeriodTabs early={editorialAnalysis.early} late={editorialAnalysis.late} active={eaPeriod} onChange={setEaPeriod} />
          {eaActive ? (
            <>
              <div className="comp-sub">Key positive drivers</div>
              <ThemeShareCards themes={eaActive.positive_drivers} />
              <div className="comp-sub" style={{ marginTop: 18 }}>
                Key negative drivers
              </div>
              <ThemeShareCards themes={eaActive.negative_drivers} />
            </>
          ) : null}
        </div>
        {eaActive?.quotes_positive?.length || eaActive?.quotes_negative?.length ? (
          <div className="sec">
            <SecHead eyebrow="IN THEIR WORDS" title="Selected coverage" />
            {eaActive.quotes_positive?.length ? <Quotes quotes={eaActive.quotes_positive} logos={logos} /> : null}
            {eaActive.quotes_negative?.length ? (
              <div style={{ marginTop: 16 }}>
                <Quotes quotes={eaActive.quotes_negative} logos={logos} />
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    ),

    authors: (
      <div className="page">
        <PrBanner banner={authors.banner} variant={BANNER_VARIANT.authors} brand={meta.brand} logos={logos} />
        <div className="sec">
          <SecHead eyebrow="KEY AUTHORS" title="Who covered the story" note={authors.note} />
          <PeriodTabs early={authors.early} late={authors.late} active={authorsPeriod} onChange={setAuthorsPeriod} />
          {authorsActive ? (
            <div className="grid g2">
              <Card title="By engagement" className="lg">
                <RankTable rows={withFormatted(authorsActive.authors_by_reach)} columns={AUTHOR_COLUMNS} logos={logos} />
              </Card>
              <Card title="By volume" className="lg">
                <RankTable rows={withFormatted(authorsActive.authors_by_volume)} columns={AUTHOR_COLUMNS} logos={logos} />
              </Card>
            </div>
          ) : null}
        </div>
      </div>
    ),

    publications: (
      <div className="page">
        <PrBanner banner={publications.banner} variant={BANNER_VARIANT.publications} brand={meta.brand} logos={logos} />
        <div className="sec">
          <SecHead eyebrow="KEY PUBLICATIONS" title="Where the story ran" note={publications.note} />
          <PeriodTabs early={publications.early} late={publications.late} active={pubsPeriod} onChange={setPubsPeriod} />
          {pubsActive ? (
            <div className="grid g2">
              <Card title="By engagement" className="lg">
                <RankTable rows={withFormatted(pubsActive.publications_by_reach)} columns={PUB_COLUMNS} logos={logos} />
              </Card>
              <Card title="By volume" className="lg">
                <RankTable rows={withFormatted(pubsActive.publications_by_volume)} columns={PUB_COLUMNS} logos={logos} />
              </Card>
            </div>
          ) : null}
        </div>
      </div>
    ),

    audience_profile: (
      <div className="page">
        <PrBanner banner={audienceProfile.banner} variant={BANNER_VARIANT.audience_profile} brand={meta.brand} logos={logos} />
        <div className="sec">
          <SecHead eyebrow="AUDIENCE SEGMENTS" title="Who's reading, and why" note={audienceProfile.note} />
          <PeriodTabs early={audienceProfile.early} late={audienceProfile.late} active={audiencePeriod} onChange={setAudiencePeriod} />
          {audienceActive ? (
            <>
              <Card title="Conversational share" className="lg">
                <BarList rows={audienceActive.audience?.map((s) => ({ name: s.title, pct: s.pct, count: s.count }))} />
              </Card>
              <div style={{ marginTop: 18 }}>
                <ThemeShareCards themes={audienceActive.audience} />
              </div>
            </>
          ) : null}
        </div>
      </div>
    ),

    appendix: (
      <div className="page">
        <PrBanner banner={appendix.banner} variant={BANNER_VARIANT.appendix} brand={meta.brand} logos={logos} />
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
      scope="sb-pr-research"
      bannerContext={{ brand: meta.brand }}
      brandName={brandName}
      subtitle="PR Research"
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
