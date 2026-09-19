/**
 * Brand & Competitive Intel — a faithful port of docs/Html/Brand_and_Competitive.html.
 *
 * Three tabs: an overview of volume, sentiment and engagement; a deep-dive into
 * what drives each sentiment; and a competitor benchmark. The source page uses no
 * charting library — every visual is a CSS bar — so this screen renders none.
 */
import { useCallback, useState } from "react";

import {
  BarList,
  BciBanner,
  Callout,
  Chips,
  CompetitorTable,
  Divider,
  KpiCards,
  QuoteCards,
  SecHead,
  SentimentBar,
  SentimentComposition,
  StoryCards,
  compact,
} from "../dashboards/storyboard/bci-blocks.jsx";
import BrandLogo from "../dashboards/storyboard/BrandLogo.jsx";
import PlatformIcon from "../dashboards/storyboard/PlatformIcon.jsx";
import StoryboardShell from "../dashboards/storyboard/StoryboardShell.jsx";
import "../dashboards/storyboard/bci.css";

const DASHBOARD_KEY = "brand_competitive_intel";
const BANNER_VARIANT = { t1: "b-purple", t2: "b-pink", t3: "b-green" };

export default function BrandCompetitiveScreen({
  chartsData,
  chartsLoading,
  chartsError,
  onBack,
}) {
  const story = chartsData?.[DASHBOARD_KEY];
  const [activeTab, setActiveTab] = useState("t1");

  const switchTab = useCallback((id) => {
    setActiveTab(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  if (chartsLoading) return <div className="sb-state">Loading storyboard…</div>;
  if (chartsError) return <div className="sb-state sb-state--error">{chartsError}</div>;
  if (!story?.tabs?.length) {
    return (
      <div className="sb-state">
        No storyboard yet. Run <strong>Create Dashboard</strong> from the Review screen.
      </div>
    );
  }

  const { meta, tabs } = story;
  const tab = tabs.find((t) => t.id === activeTab) || tabs[0];
  const rated = story.sentiment_split?.reduce((sum, p) => sum + p.value, 0) || 0;

  // The top-N brands by average engagement per post, for the t3 efficiency cards.
  const engagementLeaders = [...(story.competitor_ranks || [])]
    .sort((a, b) => b.avg_engagement - a.avg_engagement)
    .slice(0, 4);

  const panels = {
    t1: (
      <div className="page">
        <BciBanner tab={tab} variant={BANNER_VARIANT.t1} />
        <SecHead
          eyebrow="AT A GLANCE"
          title="Volume, sentiment &amp; engagement"
          note={`All figures computed directly from the ${meta.total_conversations.toLocaleString()} tagged posts in this session.`}
        />
        <KpiCards kpis={story.kpis} />
        <Divider />
        <SecHead
          eyebrow="SENTIMENT &amp; ENGAGEMENT"
          title="How the conversation breaks down"
          note={`Sentiment mix, channel distribution and what conversation centres on — of ${rated.toLocaleString()} rated posts.`}
        />
        <div className="grid g3">
          <div className="card lg">
            <div className="sec-eyebrow">SENTIMENT MIX</div>
            <h2 className="sec-title disp" style={{ fontSize: 17, marginBottom: 4 }}>
              Of {rated.toLocaleString()} rated posts
            </h2>
            <SentimentBar split={story.sentiment_split} />
          </div>
          <div className="card lg">
            <div className="sec-eyebrow">TOP CHANNELS BY VOLUME</div>
            <h2 className="sec-title disp" style={{ fontSize: 17, marginBottom: 14 }}>
              Where the posts live
            </h2>
            <BarList rows={story.platforms} platformIcons />
          </div>
          <div className="card lg">
            <div className="sec-eyebrow">CONSUMER EXPECTATIONS</div>
            <h2 className="sec-title disp" style={{ fontSize: 17, marginBottom: 14 }}>
              What conversation centres on
            </h2>
            <BarList rows={story.themes} color="var(--brand-2)" />
          </div>
        </div>
        <Divider />
        <SecHead eyebrow="WHAT MOVED THE NEEDLE" title="The stories driving the swing" />
        <StoryCards drivers={story.drivers} />
      </div>
    ),

    t2: (
      <div className="page">
        <BciBanner tab={tab} variant={BANNER_VARIANT.t2} />
        <SecHead
          eyebrow="MENU &amp; PRODUCT CHATTER"
          title={`Most-mentioned entities in ${meta.brand} posts`}
          note="Organisations and people tagged across the corpus, excluding the brand and its benchmarked rivals."
        />
        <div className="grid g5-7">
          <div className="card lg">
            <BarList rows={story.items} />
          </div>
          <div className="card lg">
            <div className="sec-eyebrow" style={{ marginBottom: 10 }}>READING THE LIST</div>
            <p className="ctext" style={{ fontSize: 13, lineHeight: 1.7 }}>
              The entities above are the organisations and people named most often
              alongside {meta.brand} in this window — partners, rivals, public
              figures and outlets. The longer bars are the associations shaping the
              conversation; the tail is incidental co-mention.
            </p>
            <div className="divider" />
            <Chips items={story.items?.slice(0, 8)} />
          </div>
        </div>
        <Divider />
        <SecHead
          eyebrow="CHANNEL EFFICIENCY"
          title="Where volume is loudest vs. where engagement is highest"
        />
        <div className="grid g3">
          {(story.platform_engagement || []).map((row) => (
            <div className="card kpi" key={row.name}>
              <div className="k-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <PlatformIcon platform={row.name} size={16} rounded={5} />
                {row.name}
              </div>
              <div className="k-val disp">{row.volume.toLocaleString()}</div>
              {row.engagement ? (
                <>
                  <div className="k-sub">posts · {compact(row.engagement)} total engagement</div>
                  <span className="k-tag tag-brand">{row.avg_engagement.toLocaleString()} avg / post</span>
                </>
              ) : (
                <div className="k-sub">No engagement data for this channel</div>
              )}
            </div>
          ))}
        </div>
        {story.platform_engagement?.length >= 2 ? (
          <div className="small-note">
            {story.platform_engagement[0].name} carries the volume; the highest
            average engagement per post sits with{" "}
            {[...story.platform_engagement].sort((a, b) => b.avg_engagement - a.avg_engagement)[0].name}
            {" "}— volume and amplification rarely agree.
          </div>
        ) : null}
        <Divider />
        <SecHead
          eyebrow="DRIVER ANALYSIS"
          title="What&rsquo;s driving positive vs. negative sentiment"
          note="Theme frequency across positively- and negatively-rated posts, from keyword patterns in post text."
        />
        <div className="grid g2">
          <div className="card lg">
            <div className="k-label" style={{ color: "var(--pos)", marginBottom: 14 }}>
              POSITIVE SENTIMENT DRIVERS
            </div>
            <BarList rows={story.positive_drivers} color="var(--pos)" />
          </div>
          <div className="card lg">
            <div className="k-label" style={{ color: "var(--neg)", marginBottom: 14 }}>
              NEGATIVE SENTIMENT DRIVERS
            </div>
            <BarList rows={story.negative_drivers} color="var(--neg)" />
          </div>
        </div>
        {story.operational_issues?.length ? (
          <>
            <Divider />
            <SecHead
              eyebrow="CONSUMER UNMET NEEDS"
              title="Where operational experience falls short"
              note="Negative-post sub-themes that point to a specific, addressable consumer need, ranked by frequency."
            />
            <div className="card lg">
              <BarList rows={story.operational_issues} color="var(--brand-2)" />
              <div className="divider" />
              <p style={{ fontSize: 13, lineHeight: 1.7 }}>
                These sub-themes are the recurring, addressable gaps in{" "}
                {meta.brand}&rsquo;s negative conversation — the operational issues
                consumers name most, ahead of one-off events.
              </p>
            </div>
          </>
        ) : null}
        <Divider />
        <SecHead
          eyebrow="WHAT CONSUMERS ACTUALLY SAID"
          title="Highest-engagement posts, by sentiment"
        />
        <div className="grid g2">
          <div className="card lg">
            <div className="k-label" style={{ color: "var(--pos)", marginBottom: 14 }}>
              TOP POSITIVE DRIVERS
            </div>
            <QuoteCards
              posts={(story.top_posts || []).filter((p) => /pos/i.test(p.sentiment)).slice(0, 4)}
              flat
            />
          </div>
          <div className="card lg">
            <div className="k-label" style={{ color: "var(--neg)", marginBottom: 14 }}>
              TOP NEGATIVE DRIVERS
            </div>
            <QuoteCards
              posts={(story.top_posts || []).filter((p) => /neg/i.test(p.sentiment)).slice(0, 4)}
              flat
            />
          </div>
        </div>
      </div>
    ),

    t3: (
      <div className="page">
        <BciBanner tab={tab} variant={BANNER_VARIANT.t3} />
        <SecHead
          eyebrow="SHARE OF VOICE"
          title={`Mentions across ${meta.brand} and ${meta.competitors.length} tracked competitors`}
          note={
            meta.dataset_mode === "brand"
              ? "This export tracks a single brand, so competitor rows are thin by construction."
              : "Brand-name detection across all posts; a single post can mention more than one brand."
          }
        />
        <CompetitorTable rows={story.competitor_ranks} brand={meta.brand} logos={meta.logos} />
        <Divider />
        <SecHead
          eyebrow="SENTIMENT COMPOSITION BY BRAND"
          title="Positive, Neutral &amp; Negative share, stacked"
          note="Of each brand's sentiment-rated posts."
        />
        <div className="card lg">
          <SentimentComposition rows={story.competitor_ranks} logos={meta.logos} />
        </div>
        <Divider />
        <SecHead
          eyebrow="ENGAGEMENT EFFICIENCY"
          title="Average engagement per post, by brand"
          note="Total interactions divided by number of mentions — reach quality, not reach volume."
        />
        <div className="grid g4">
          {engagementLeaders.map((row) => (
            <div className="card kpi" key={row.brand}>
              <div className="k-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <BrandLogo brand={row.brand} logos={meta.logos} size={16} rounded={5} />
                {row.brand}
              </div>
              <div className="k-val disp">{row.avg_engagement.toLocaleString()}</div>
              <div className="k-sub">avg. engagement / post</div>
              {row.is_brand ? <span className="k-tag tag-brand">{meta.brand}</span> : null}
            </div>
          ))}
        </div>
        <div className="card" style={{ marginTop: 18 }}>
          <BarList rows={story.avg_engagement} valueKey="value" color="var(--brand-3)" logos={meta.logos} />
        </div>
      </div>
    ),
  };

  return (
    <StoryboardShell
      scope="sb-bci"

      bannerContext={{ brand: meta.brand, category: meta.category }}
      brandName={meta.brand || "Brand"}
      subtitle="SOCIAL & MEDIA INTELLIGENCE"
      tabs={tabs}
      active={activeTab}
      onTab={switchTab}
      footer={story.footer}
      onBack={onBack}
      progress={false}
      footerAs="span"
    >
      {/* No scroll-reveal: unlike Trend, this source page animates nothing. */}
      <section className="tab-panel active" key={activeTab}>
        {panels[tab.id]}
      </section>
    </StoryboardShell>
  );
}
