/**
 * Trend Intelligence — a faithful port of docs/Html/Trend_Storyboard.html.
 *
 * Three tabs rather than a grid of charts: the snapshot states the tension, the
 * trends isolate the signals behind it, and the third benchmarks the brand's
 * position in each. Layout and styling come from the approved page; every number
 * and every line of prose comes from the session's tagged data.
 */
import { useCallback, useMemo, useState } from "react";

import {
  Callout,
  Card,
  CaptureRanking,
  ContextSetter,
  Hero,
  KpiFlipGrid,
  Priorities,
  Quotes,
  SectionHead,
  SignalCards,
  TabBanner,
  VerdictColumns,
  WhatsNext,
} from "../dashboards/storyboard/blocks.jsx";
import {
  Heatmap,
  LeadersChart,
  Legendary,
  MomentumChart,
  NetSentimentChart,
  PhaseChart,
  ShareOfVoiceChart,
  TrajectoryChart,
} from "../dashboards/storyboard/charts.jsx";
import StoryboardShell, { useReveal } from "../dashboards/storyboard/StoryboardShell.jsx";
import "../dashboards/storyboard/trend.css";

const DASHBOARD_KEY = "trend_intelligence";

export default function TrendIntelligenceScreen({
  chartsData,
  chartsLoading,
  chartsError,
  onBack,
}) {
  const story = chartsData?.[DASHBOARD_KEY];
  const [activeTab, setActiveTab] = useState("tab1");
  const [modalKey, setModalKey] = useState(null);

  const openModal = useCallback((key) => setModalKey(key), []);
  const closeModal = useCallback(() => setModalKey(null), []);

  const switchTab = useCallback((id) => {
    setActiveTab(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // A new panel mounts on every tab switch, so the reveal observer is rebound.
  const panelRef = useReveal(activeTab);

  const signals = useMemo(() => story?.signals || [], [story]);
  const palette = useMemo(() => signals.map((s) => s.color), [signals]);

  if (chartsLoading) return <div className="sb-state">Loading storyboard…</div>;
  if (chartsError) return <div className="sb-state sb-state--error">{chartsError}</div>;

  // `trend_intelligence` used to be an array of charts. A session whose charts.json
  // predates the storyboard would otherwise render a blank page.
  if (Array.isArray(story) || !story?.tabs?.length) {
    return (
      <div className="sb-state">
        No storyboard yet. Run <strong>Create Dashboard</strong> from the Review screen.
      </div>
    );
  }

  const { meta, tabs, modals } = story;
  const tab = tabs.find((t) => t.id === activeTab) || tabs[0];
  const captureLabel = meta.dataset_mode === "category" ? "Brand capture" : "Share of brand";

  const panels = {
    tab1: (
      <>
        <Hero hero={story.hero} />
        <div className="page">
          <TabBanner tab={tab} />
          <ContextSetter context={tab.context} />
          <KpiFlipGrid kpis={tab.kpis} />
          <div className="grid2">
            <Card
              title="Category Share of Voice"
              sub={`% of ${meta.total_conversations.toLocaleString()} conversations naming each brand`}
              onOpen={() => openModal("sov")}
            >
              <Legendary
                items={[
                  { name: meta.brand, color: "var(--brand-1)" },
                  { name: "Competitors", color: "#c4b5fd" },
                ]}
              />
              <ShareOfVoiceChart rows={story.sov} brand={meta.brand} />
            </Card>
            <Card
              title="Net Sentiment League Table"
              sub="Positive% minus Negative% per brand"
              onOpen={() => openModal("netsent")}
              className="d1"
            >
              <Legendary
                items={[
                  { name: meta.brand, color: "var(--brand-1)" },
                  { name: "Competitors", color: "#10B981" },
                ]}
              />
              <NetSentimentChart rows={story.net_sentiment} brand={meta.brand} />
            </Card>
          </div>
          <WhatsNext whatsNext={tab.whats_next} onTab={switchTab} />
        </div>
      </>
    ),

    tab2: (
      <div className="page">
        <TabBanner tab={tab} />
        <ContextSetter context={tab.context} />
        <SectionHead
          eyebrow="Signal Identification"
          title="The"
          emphasis="emerging signals"
          desc="Each card shows the trend's share-growth trajectory, conversation volume, net sentiment, and which brands currently lead. Click any card for an AI deep-dive grounded in the dataset."
        />
        <SignalCards signals={signals} captureLabel={captureLabel} onOpen={openModal} />
        <Card
          title="Conversation Trajectory — Share of Daily Volume"
          sub={`Per 1,000 daily mentions · ${meta.window_label} · normalised`}
          onOpen={() => openModal("signal_all")}
        >
          <Legendary items={signals.map((s) => ({ name: s.name, color: s.color }))} />
          <TrajectoryChart signals={signals} days={meta.days} />
        </Card>
        <div style={{ height: "20px" }} />
        <div className="grid2">
          <Card
            title="Phase Analysis — Daily Share"
            sub="Share of daily conversation by signal"
            onOpen={() => openModal("phase")}
          >
            <PhaseChart signals={signals} days={meta.days} />
          </Card>
          <Card
            title="Cumulative Share Momentum"
            sub={`Indexed to ${meta.days[1] || "the first full day"} = 100`}
            onOpen={() => openModal("momentum")}
            className="d1"
          >
            <MomentumChart signals={signals} days={meta.days} />
          </Card>
        </div>
        <SectionHead
          eyebrow="Consumer Voice"
          title="The"
          emphasis="human signal"
          desc="Representative conversations drawn directly from the dataset, evidencing each signal."
          style={{ marginTop: "8px" }}
        />
        <Quotes quotes={story.quotes} />
        <WhatsNext whatsNext={tab.whats_next} onTab={switchTab} />
      </div>
    ),

    tab3: (
      <div className="page">
        <TabBanner tab={tab} />
        <ContextSetter context={tab.context} />
        <SectionHead
          eyebrow="Competitive Capture"
          title={meta.capture_label}
          desc="Read each bar as ownership. The widest bars are where this brand's conversation actually concentrates."
        />
        <CaptureRanking rows={story.capture_ranking} />
        <Callout text={story.callout} />
        <div style={{ height: "24px" }} />
        <div className="grid2">
          <Card
            title="Who Leads Each Trend"
            sub="Brand mention counts within each signal"
            onOpen={() => openModal("leaders")}
          >
            <LeadersChart matrix={story.leaders_matrix} palette={palette} />
          </Card>
          <Card
            title="Signal × Platform Heatmap"
            sub="Where each trend lives — activation channels"
            onOpen={() => openModal("heatmap")}
            className="d1"
          >
            <Heatmap signals={signals} platforms={meta.platforms} />
          </Card>
        </div>
        <SectionHead
          eyebrow="Strategic Playbook"
          title="Priorities ranked by"
          emphasis="strategic weight"
          desc="Volume alone would over-weight the largest conversation. Weighting momentum, sentiment and the brand's existing foothold surfaces where action pays."
          style={{ marginTop: "8px" }}
        />
        <Priorities priorities={story.priorities} onOpen={openModal} />
        <VerdictColumns columns={story.verdict_columns} />
        <WhatsNext whatsNext={tab.whats_next} onTab={switchTab} />
      </div>
    ),
  };

  return (
    <StoryboardShell
      scope="sb-trend"

      bannerContext={{ brand: meta.brand, category: meta.category }}
      brandName={`${meta.brand || "Brand"} × InfoVision`}
      subtitle="Trend Intelligence Storyboard"
      tabs={tabs}
      active={activeTab}
      onTab={switchTab}
      footer={story.footer}
      modal={modalKey ? modals[modalKey] : null}
      onCloseModal={closeModal}
      onBack={onBack}
    >
      <section className="tab-panel active" key={activeTab} ref={panelRef}>
        {panels[tab.id]}
      </section>
    </StoryboardShell>
  );
}
