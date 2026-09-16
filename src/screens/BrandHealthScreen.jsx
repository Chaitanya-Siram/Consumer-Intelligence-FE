/**
 * Brand Health Tracker — a port of docs/Html/BrandHealth_Tracker_Storyboard.html.
 *
 * A landing screen carrying the weighted Brand Health Index, one screen per BHI
 * dimension, and a competitive screen. `bhi_dimension` from the tagger supplies
 * exactly the five dimensions the source page tracks, with its own weights.
 *
 * A dimension's score is net sentiment mapped onto 0-100 — affection, not volume.
 * That is the distinction the tracker exists to make, so the copy says it too.
 */
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  CategoryBars,
  ContributionBars,
  DimensionRadar,
  GaugeRows,
  GroupedSentimentBars,
  HealthFunnel,
  PosRateRadar,
  SentimentDonut,
  StackedSentimentArea,
  TrendLine,
} from "../dashboards/storyboard/health-charts.jsx";
import BrandLogo from "../dashboards/storyboard/BrandLogo.jsx";
import { Rich } from "../utils/text.jsx";
import ivWordmark from "../assets/images/infovision-wordmark.png";
import "../dashboards/storyboard/health.css";

const DASHBOARD_KEY = "brand_health_storyboard";
const HOME = "home";
const EXECUTIVE = "executive";
const COMPETITIVE = "competitive";
const FINALE = "finale";

function scoreClass(score) {
  if (score >= 80) return "score-high";
  if (score >= 60) return "score-good";
  if (score >= 40) return "score-mid";
  return "score-low";
}

// Mirrors the source page's `.section`: a small `.sec-tag` label and an optional
// `.sec-subtitle` — no large <h2>. `tag` is the label; `title` is the descriptive
// line and falls through to the subtitle so nothing is lost.
function Section({ tag, title, subtitle, onAsk, takeaway, children }) {
  const sub = [title, subtitle].filter(Boolean).join(" — ");
  return (
    <div className="section">
      <div className="sec-hdr">
        <div className="sec-left">
          {tag || title ? <div className="sec-tag">{tag || title}</div> : null}
          {sub && (tag || title) !== sub ? <div className="sec-subtitle">{sub}</div> : null}
        </div>
        {onAsk ? (
          <button type="button" className="ai-btn" onClick={() => onAsk({ title: title || tag })}>
            &#10022; Insights
          </button>
        ) : null}
      </div>
      {children}
      {takeaway ? (
        <div className="sec-takeaway">
          <Rich text={takeaway} inline />
        </div>
      ) : null}
    </div>
  );
}

function Card({ title, sub, className = "", onAsk, children }) {
  return (
    <div className={`card ${className}`}>
      <div className="card-hdr">
        <div>
          <div className="card-title">{title}</div>
          {sub ? <div className="card-sub">{sub}</div> : null}
        </div>
        {onAsk ? (
          <button type="button" className="ai-btn" onClick={() => onAsk({ title, sub })}>
            &#10022; Insights
          </button>
        ) : null}
      </div>
      {children}
    </div>
  );
}

/**
 * The source page fills each `.tab-hero` with an animated shader canvas. We have
 * a resolved Pexels photo per dimension instead — drop it in behind the dark
 * overlay so the banner carries the brand's own imagery, not a bare gradient.
 */
function TabHeroImg({ src }) {
  if (!src) return null;
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        zIndex: 0,
      }}
    />
  );
}

/** The panel a card's Insights button opens. */
function HealthModal({ panel, onClose }) {
  useEffect(() => {
    if (!panel) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panel, onClose]);

  return (
    <div
      className={`modal-bg${panel ? " show" : ""}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {panel ? (
        <div className="modal" role="dialog" aria-modal="true" aria-label={panel.title}>
          <div className="modal-hdr">
            <div>
              <div className="modal-badge">AI INSIGHTS</div>
              <div className="modal-title">{panel.title}</div>
            </div>
            <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
              &#10005;
            </button>
          </div>
          <div className="modal-body">
            {panel.sub ? <p>{panel.sub}</p> : null}
            {panel.lines?.length ? (
              panel.lines.map((line, i) => (
                // eslint-disable-next-line react/no-array-index-key -- order is the identity
                <div className="impl-card" key={i}>
                  <h4>{line.title}</h4>
                  <p>{line.text}</p>
                </div>
              ))
            ) : (
              <p>No AI analysis was generated for this view.</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function BrandHealthScreen({ chartsData, chartsLoading, chartsError, onBack }) {
  const story = chartsData?.[DASHBOARD_KEY];
  const [view, setView] = useState(HOME);

  const go = useCallback((next) => {
    setView(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // `.topnav` is display:none until `.visible` is added — the source page reveals
  // it once the reader scrolls past the landing hero. Inner screens have no hero,
  // so it is shown immediately there or the page has no navigation at all.
  const [panel, setPanel] = useState(null);
  const [navVisible, setNavVisible] = useState(false);
  useEffect(() => {
    if (view !== HOME) {
      setNavVisible(true);
      return undefined;
    }
    const onScroll = () => setNavVisible(window.scrollY > 240);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [view]);

  const dimensions = useMemo(() => story?.dimensions || [], [story]);

  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [view]);

  if (chartsLoading) return <div className="sb-state">Loading brand health…</div>;
  if (chartsError) return <div className="sb-state sb-state--error">{chartsError}</div>;
  if (!story?.dimensions) {
    return (
      <div className="sb-state">
        No brand health index yet. Run <strong>Create Dashboard</strong> from the Review screen.
      </div>
    );
  }

  const { meta, bhi, competitive } = story;
  const active = dimensions.find((d) => d.key === view) || null;
  const scored = dimensions.filter((d) => d.volume > 0);
  const strongest = scored.length ? scored.reduce((a, b) => (b.score > a.score ? b : a)) : null;
  const weakest = scored.length ? scored.reduce((a, b) => (b.score < a.score ? b : a)) : null;
  const nextDimension = active
    ? dimensions[(dimensions.indexOf(active) + 1) % dimensions.length]
    : null;

  // Photos resolved per dimension; the non-dimension banners (executive,
  // competitive, finale) borrow from the pool so no banner is a bare gradient.
  const heroPhotos = dimensions.map((d) => d.image).filter(Boolean);
  const heroPhoto = (n) => heroPhotos[n % heroPhotos.length] || story.hero?.media?.poster || null;

  // The panel is assembled from the payload, never generated at open time, so it
  // cannot state a figure the dashboard does not already show.
  const ask = ({ title, sub }) => {
    const lines = [];
    if (active) {
      lines.push({
        title: `${active.name} scores ${active.score}`,
        text: `${active.band}. ${active.volume.toLocaleString()} posts, net sentiment ${
          active.net_sentiment > 0 ? "+" : ""
        }${active.net_sentiment}, carrying ${active.weight}% of the index.`,
      });
      (active.insights || []).forEach((text, i) =>
        lines.push({ title: `Insight ${i + 1}`, text }),
      );
    } else {
      lines.push({
        title: `Brand Health Index ${bhi.score}`,
        text: `${bhi.band}. ${bhi.covered} of ${bhi.of} dimensions had enough coverage to score.`,
      });
      if (story.callout) lines.push({ title: "Sharpest split", text: story.callout });
    }
    setPanel({ title, sub, lines });
  };

  return (
    <div className="sb-lens sb-health">
      <div className="sb-prog">
        <div className="sb-prog-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className={`topnav${navVisible ? " visible" : ""}`}>
        {onBack ? (
          <button type="button" className="sb-back" onClick={onBack}>
            ← Back
          </button>
        ) : null}
        <div className="topnav-brand">
          <BrandLogo brand={meta.brand} logos={meta.logos} size={26} rounded={7} />
          <span>{meta.brand} · Brand Health Intelligence</span>
        </div>
        <div className="topnav-sep" />
        <div className="nav-pills">
          <button
            type="button"
            className={`nav-pill${view === HOME ? " active" : ""}`}
            onClick={() => go(HOME)}
          >
            <span className="tdot" />
            Home
          </button>
          <button
            type="button"
            className={`nav-pill${view === EXECUTIVE ? " active" : ""}`}
            onClick={() => go(EXECUTIVE)}
          >
            <span className="tdot" />
            Executive
          </button>
          {dimensions.map((d) => (
            <button
              type="button"
              key={d.key}
              className={`nav-pill${view === d.key ? " active" : ""}`}
              onClick={() => go(d.key)}
            >
              <span className="tdot" />
              {d.name}
            </button>
          ))}
          <button
            type="button"
            className={`nav-pill${view === COMPETITIVE ? " active" : ""}`}
            onClick={() => go(COMPETITIVE)}
          >
            <span className="tdot" />
            Competitive
          </button>
          <button
            type="button"
            className={`nav-pill${view === FINALE ? " active" : ""}`}
            onClick={() => go(FINALE)}
          >
            <span className="tdot" />
            Finale
          </button>
        </div>
        <div className="nav-bhi">
          <span className="nav-bhi-label">BHI</span>
          <span className={`nav-bhi-score ${scoreClass(bhi.score)}`}>{bhi.score}</span>
        </div>
      </div>

      {/* ------------------------------------------------------------- HOME */}
      {view === HOME ? (
        <div className="page active" id="page-landing">
          <div className="landing-hero">
            {onBack ? (
              <button type="button" className="sb-back landing-back" onClick={onBack}>
                ← Back
              </button>
            ) : null}
            <div className="landing-particles" />
            <div className="landing-content">
              <div className="landing-iv">
                <img src={ivWordmark} alt="InfoVision Intelligence" />
              </div>
              <BrandLogo
                className="landing-logo"
                brand={meta.brand}
                logos={meta.logos}
                size={48}
                rounded={14}
              />
              <div className="landing-h1">
                {story.hero?.title || `${meta.brand} Brand Health`}
              </div>
              {story.hero?.subtitle ? (
                <div className="landing-sub">
                  <Rich text={story.hero.subtitle} inline />
                </div>
              ) : null}
              <div className="landing-meta">
                <div className="landing-meta-item">{meta.window_label}</div>
                <div className="landing-meta-item">
                  {meta.total_conversations.toLocaleString()} mentions analysed
                </div>
                <div className="landing-meta-item">
                  {meta.classified.toLocaleString()} brand-relevant
                </div>
                {(story.hero?.chips || []).slice(0, 1).map((chip) => (
                  <div className="landing-meta-item" key={chip}>
                    {chip}
                  </div>
                ))}
              </div>

              <div className="landing-bhi">
                <div className={`landing-bhi-score ${scoreClass(bhi.score)}`}>{bhi.score}</div>
                <div className="landing-bhi-right">
                  <div className="landing-bhi-label">Brand Health Index</div>
                  <div className="landing-bhi-delta">{bhi.band}</div>
                </div>
              </div>

              <div className="dim-grid">
                  {dimensions.slice(0, 4).map((d) => (
                    <div
                      className="dim-nav-card"
                      key={d.key}
                      onClick={() => go(d.key)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          go(d.key);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      {/* The photo belongs on the icon strip, not the card: the body
                          below it stays white so the score stays legible. */}
                      <div
                        className="dim-nav-icon"
                        style={
                          d.image
                            ? { backgroundImage: `url(${d.image})` }
                            : { background: `linear-gradient(135deg, ${d.color}, ${d.color}bb)` }
                        }
                      />
                      <div className="dim-nav-score">{d.score}</div>
                      <div className="dim-nav-name">{d.name}</div>
                      {(() => {
                        const bench = story.radar.find((r) => r.name === d.name)?.benchmark;
                        const above = bench === undefined || d.score >= bench;
                        return (
                          <div className={`dim-nav-status ${above ? "status-above" : "status-at"}`}>
                            {above ? "Above Benchmark" : "At Benchmark"}
                          </div>
                        );
                      })()}
                    </div>
                  ))}
                </div>
                <div className="dim-grid-bottom">
                  {dimensions.slice(4).map((d) => (
                    <div
                      className="dim-nav-card"
                      key={d.key}
                      onClick={() => go(d.key)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          go(d.key);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <div
                        className="dim-nav-icon"
                        style={
                          d.image
                            ? { backgroundImage: `url(${d.image})` }
                            : { background: `linear-gradient(135deg, ${d.color}, ${d.color}bb)` }
                        }
                      />
                      <div className="dim-nav-score">{d.score}</div>
                      <div className="dim-nav-name">{d.name}</div>
                      {(() => {
                        const bench = story.radar.find((r) => r.name === d.name)?.benchmark;
                        const above = bench === undefined || d.score >= bench;
                        return (
                          <div className={`dim-nav-status ${above ? "status-above" : "status-at"}`}>
                            {above ? "Above Benchmark" : "At Benchmark"}
                          </div>
                        );
                      })()}
                    </div>
                  ))}
                  <div
                    className="dim-nav-card"
                    onClick={() => go(COMPETITIVE)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        go(COMPETITIVE);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <div
                      className="dim-nav-icon"
                      style={
                        dimensions.find((d) => d.image)
                          ? {
                              backgroundImage: `url(${
                                [...dimensions].reverse().find((d) => d.image).image
                              })`,
                            }
                          : { background: "linear-gradient(135deg,#1c7c9c,#1c7c9cbb)" }
                      }
                    />
                    <div className="dim-nav-score">{competitive.tracked}</div>
                    <div className="dim-nav-name">Competitors Tracked</div>
                    <div className="dim-nav-status status-above">
                      {competitive.co_mentions?.length || 0} co-mentioned
                    </div>
                  </div>
                  <div
                    className="dim-nav-card"
                    onClick={() => go(FINALE)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        go(FINALE);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <div
                      className="dim-nav-icon"
                      style={
                        dimensions.find((d) => d.image)
                          ? { backgroundImage: `url(${dimensions.find((d) => d.image).image})` }
                          : { background: "linear-gradient(135deg,#702082,#702082bb)" }
                      }
                    />
                    <div className="dim-nav-score">
                      {competitive.rank ? `#${competitive.rank}` : "\u2014"}
                    </div>
                    <div className="dim-nav-name">SoV Ranking</div>
                    <div className="dim-nav-status status-above">
                      of {competitive.share_of_voice.length} brands
                    </div>
                  </div>
                </div>
            </div>
            <button type="button" className="scroll-hint" onClick={() => go(EXECUTIVE)}>
              &#9662; Enter Dashboard
            </button>
          </div>
        </div>
      ) : null}

      {/* ------------------------------------------------------- EXECUTIVE */}
      {view === EXECUTIVE ? (
        <>
          <div className="tab-hero" style={{ background: "linear-gradient(135deg,#702082,#702082aa)" }}>
            <TabHeroImg src={heroPhoto(0)} />
            <div className="tab-hero-overlay" />
            <div className="tab-hero-content">
              <button type="button" className="tab-back" onClick={() => go(HOME)}>
                ← Home
              </button>
              <div className="thc-meta">
                <span className="thc-meta-item">Executive Dashboard</span>
                <span className="thc-meta-item">
                  {meta.classified.toLocaleString()} of{" "}
                  {meta.total_conversations.toLocaleString()} posts classified
                </span>
                <span className={`thc-pill`}>{bhi.band}</span>
              </div>
              <h1 className="thc-h1">Executive Summary</h1>
              <div className="thc-sub">
                A score is net sentiment on a 0-100 scale — affection, not volume.
                A dimension can carry a large weight and still add little if it
                scores badly.
              </div>
            </div>
          </div>

          <div className="page active" id="page-executive">
            <div className="page-inner">
              <div className="story-card">
                <span className="story-num">01</span>
                <div className="story-eyebrow">Executive Dashboard</div>
                <div className="story-title">{meta.brand} at a glance</div>
                <div className="story-body">
                  This tracker turns {meta.total_conversations.toLocaleString()} tagged
                  posts into five weighted dimensions. Each is scored as net sentiment
                  on a 0-100 scale &mdash; affection, not volume &mdash; benchmarked
                  against the other dimensions, and rolled into one Brand Health Index.
                </div>
                <div className="story-what">
                  <div className="story-what-item">
                    <strong>What you&rsquo;ll see</strong>Five dimension scores with
                    benchmark status
                  </div>
                  <div className="story-what-item">
                    <strong>Why it matters</strong>One unified view of where to invest,
                    protect and accelerate
                  </div>
                  <div className="story-what-item">
                    <strong>How to read it</strong>Click any dimension in the nav bar
                    above
                  </div>
                </div>
              </div>

              <div className="section">
                <div className="sec-hdr">
                  <div className="sec-left">
                    <div className="sec-tag">Brand Health Index</div>
                    <div className="sec-subtitle">
                      Weighted composite ·{" "}
                      {(bhi.contributions || [])
                        .map((c) => `${c.name} ${c.weight}%`)
                        .join(" · ")}
                    </div>
                  </div>
                  <button type="button" className="ai-btn" onClick={() => ask({ title: "Brand Health Index" })}>
                    &#10022; Insights
                  </button>
                </div>
                {story.callout ? (
                  <div className="sec-takeaway">
                    <Rich text={story.callout} inline />
                  </div>
                ) : null}
              </div>

              {strongest && weakest ? (
                <div className="section">
                  <div className="sec-hdr">
                    <div className="sec-left">
                      <div className="sec-tag">Strategic Analysis</div>
                    </div>
                  </div>
                  <div className="strat-grid">
                    <div className="strat-card">
                      <h4>Strongest Signal</h4>
                      <div className="strat-metric" style={{ color: "var(--pos)" }}>
                        {strongest.name}
                      </div>
                      <p>
                        {strongest.band} — {strongest.volume.toLocaleString()} posts at{" "}
                        {strongest.net_sentiment > 0 ? "+" : ""}
                        {strongest.net_sentiment} net sentiment. Its{" "}
                        {strongest.weight}% weight contributes{" "}
                        {bhi.contributions?.find((c) => c.name === strongest.name)?.contribution ?? 0}{" "}
                        to the index.
                      </p>
                    </div>
                    <div className="strat-card">
                      <h4>Primary Risk</h4>
                      <div className="strat-metric" style={{ color: "var(--neg)" }}>
                        {weakest.name}
                      </div>
                      <p>
                        {weakest.band} — carries {weakest.weight}% of the index but
                        contributes only{" "}
                        {bhi.contributions?.find((c) => c.name === weakest.name)?.contribution ?? 0}.
                        The gap between its weight and its score is where the index
                        loses points.
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              <Section
                tag="Dimension Radar"
                subtitle="A dimension can carry a large weight and still add little, if it scores badly."
              >
                <div className="g2">
                  <Card onAsk={ask} title="Brand Health Radar" sub="Each dimension against the mean of the others">
                    <DimensionRadar rows={story.radar} brand={meta.brand} />
                  </Card>
                  <Card onAsk={ask} title="BHI Weighted Contribution" sub="What each dimension adds to the index">
                    <ContributionBars rows={bhi.contributions} />
                  </Card>
                </div>
              </Section>

              <Section tag="SENTIMENT" title="Daily sentiment trend (brand-relevant)"
                subtitle="Positive · Neutral · Negative, stacked across the window.">
                <Card onAsk={ask} title="Daily Sentiment Trend" sub="Positive / Neutral / Negative stacked area">
                  <StackedSentimentArea rows={story.sentiment_trend} />
                </Card>
              </Section>

              <Section tag="KPI Signal Landscape" subtitle="Every brand-health KPI ranked by signal volume.">
                <Card title="Complete KPI Distribution" sub="Classified posts per dimension">
                  <CategoryBars rows={story.kpi_distribution} color="#702082" />
                </Card>
              </Section>

              {dimensions.filter((d) => d.volume > 0).length >= 3 ? (
                <Section tag={`${dimensions[0].name} → ${dimensions[dimensions.length - 1].name} Funnel`}
                  subtitle="Each stage is a subset of the one above it — the drop-off is the story.">
                  <Card title="Brand Equity Funnel" sub="Posts at each stage of the relationship" onAsk={ask}>
                    <HealthFunnel
                      rows={dimensions
                        .filter((d) => d.volume > 0)
                        .map((d) => ({ name: `${d.score} ${d.name}`, value: d.volume, color: d.color }))}
                    />
                  </Card>
                </Section>
              ) : null}

              <Section tag="Signal Intelligence">
                <div className="g2">
                  <Card title="Daily KPI Signal Intensity" sub="Classified posts per day">
                    <TrendLine
                      rows={story.sentiment_trend}
                      color="#9333ea"
                      valueKey="volume"
                      label="Posts"
                    />
                  </Card>
                  <Card onAsk={ask} title="Sentiment Distribution" sub="Across all classified posts">
                    <SentimentDonut split={story.sentiment_split} />
                  </Card>
                </div>
                <div style={{ height: 18 }} />
                <Card title="Media Channel Distribution" sub="Where the conversation happens">
                  <CategoryBars rows={story.channels} color="#c026d3" />
                </Card>
              </Section>
            </div>
          </div>
        </>
      ) : null}

      {/* -------------------------------------------------------- DIMENSION */}
      {active ? (
        <>
          <div className="tab-hero" style={{ background: `linear-gradient(135deg, ${active.color}, ${active.color}aa)` }}>
            <TabHeroImg src={active.image || heroPhoto(dimensions.indexOf(active))} />
            <div className="tab-hero-overlay" />
            <div className="tab-hero-content">
              <button type="button" className="tab-back" onClick={() => go(HOME)}>
                ← Home
              </button>
              <div className="thc-meta">
                <span className="thc-meta-item">
                  Dimension {dimensions.indexOf(active) + 1} of {dimensions.length}
                </span>
                <span className="thc-meta-item">Weight: {active.weight}%</span>
                <span className="thc-pill">{active.band}</span>
              </div>
              <h1 className="thc-h1">{active.name}</h1>
              <div className="thc-sub">
                {`Where the ${active.name.toLowerCase()} conversation stands — scored, benchmarked and broken down.`}
              </div>
            </div>
          </div>

          <div className="page active" id={`page-${active.key}`}>
            <div className="page-inner">
              {active.headline || active.body ? (
                <div className="story-card">
                  <span className="story-num">
                    {String(dimensions.indexOf(active) + 2).padStart(2, "0")}
                  </span>
                  <div className="story-eyebrow">{active.name} Analysis</div>
                  <div className="story-title">{active.headline || active.name}</div>
                  {active.body ? (
                    <div className="story-body">
                      <Rich text={active.body} inline />
                    </div>
                  ) : null}
                  <div className="story-what">
                    <div className="story-what-item">
                      <strong>Volume leader</strong>
                      {active.sub_kpis?.[0]
                        ? `${active.sub_kpis[0].name} (${active.sub_kpis[0].value})`
                        : "—"}
                    </div>
                    <div className="story-what-item">
                      <strong>Risk signal</strong>
                      {(() => {
                        const worst = [...(active.sub_kpis || [])].sort(
                          (a, b) => (b.negative || 0) - (a.negative || 0),
                        )[0];
                        return worst && worst.negative
                          ? `${worst.name} — ${worst.negative} negative`
                          : `${active.band} overall`;
                      })()}
                    </div>
                  </div>
                </div>
              ) : null}

              <Section tag={`${active.name} · at a glance`}>
                <div className="kpi-grid">
                  {(() => {
                    // KPI labels follow the source page: score, signal count,
                    // positive rate and high-confidence share.
                    const split = active.sentiment_split || [];
                    const rated = split.reduce((t, s) => t + s.value, 0);
                    const pos = split.find((s) => s.tone === "pos")?.value || 0;
                    const neg = split.find((s) => s.tone === "neg")?.value || 0;
                    const high = active.confidence?.find((c) => c.name === "High")?.value || 0;
                    const bench = story.radar.find((r) => r.name === active.name)?.benchmark;
                    return [
                      {
                        lbl: `${active.name} Score`,
                        val: active.score,
                        sub: `/ 100 \u00b7 ${active.band}`,
                        cls: scoreClass(active.score),
                        badge:
                          bench === undefined
                            ? null
                            : `${active.score >= bench ? "\u25b2 +" : "\u25bc "}${Math.abs(active.score - bench)} vs others`,
                        badgeClass:
                          bench !== undefined && active.score >= bench ? "status-above" : "status-at",
                      },
                      {
                        lbl: "Total Signals",
                        val: active.volume.toLocaleString(),
                        sub: `${active.share}% of classified \u00b7 weight ${active.weight}%`,
                      },
                      {
                        lbl: "Positive Rate",
                        val: rated ? `${Math.round((pos * 100) / rated)}%` : "\u2014",
                        sub: `${pos} pos / ${neg} neg of ${rated} rated`,
                      },
                      {
                        lbl: "High Confidence",
                        val: active.volume ? `${Math.round((high * 100) / active.volume)}%` : "\u2014",
                        sub: `${high} of ${active.volume.toLocaleString()} signals`,
                      },
                    ];
                  })().map((kpi) => (
                    <div className="kpi" key={kpi.lbl}>
                      <div className="kpi-lbl">{kpi.lbl}</div>
                      <div className={`kpi-val ${kpi.cls || ""}`}>
                        {kpi.val}
                        {kpi.badge ? (
                          <span className={`kpi-badge ${kpi.badgeClass}`}>{kpi.badge}</span>
                        ) : null}
                      </div>
                      <div className="kpi-sub">{kpi.sub}</div>
                    </div>
                  ))}
                </div>
              </Section>

              <Section tag="BREAKDOWN" title={`What ${active.name.toLowerCase()} is made of`}>
                <div className="g2">
                  <Card onAsk={ask} title="Sub-KPI Breakdown" sub="Sub-themes inside this dimension">
                    <CategoryBars rows={active.sub_kpis} color={active.color} />
                  </Card>
                  <Card onAsk={ask} title="Sentiment by Sub-KPI" sub="Positive / Neutral / Negative per sub-theme">
                    <GroupedSentimentBars rows={active.sub_kpis} />
                  </Card>
                </div>
                <div style={{ height: 18 }} />
                <div className="g2">
                  <Card title={active.key === "trust" ? "Trust Sentiment" : `${active.name} Sentiment`} sub="Of posts carrying a rating">
                    <SentimentDonut split={active.sentiment_split} />
                  </Card>
                  <Card onAsk={ask} title="Channel Distribution" sub="Where this dimension is discussed">
                    <CategoryBars rows={active.channels} color={active.color} />
                  </Card>
                </div>
                {active.themes?.length ? (
                  <>
                    <div style={{ height: 18 }} />
                    <Card
                      onAsk={ask}
                      title={active.key === "trust" ? "Trust Theme Breakdown" : "Theme Association"}
                      sub={`What consumers associate with ${meta.brand} here`}
                    >
                      <CategoryBars rows={active.themes} color={active.color} />
                    </Card>
                  </>
                ) : null}
              </Section>

              <Section
                tag="SIGNAL"
                title="Daily volume and confidence"
                subtitle="Confidence is the tagger's own certainty — it tells you how much to lean on the score."
              >
                <div className="g2">
                  <Card title="Daily Signal Volume" sub="Positive vs. Negative signals per day">
                    <StackedSentimentArea rows={active.daily} />
                  </Card>
                  <Card title="Confidence Distribution" sub="Tagger certainty across these posts">
                    <CategoryBars rows={active.confidence} color={active.color} horizontal={false} />
                  </Card>
                </div>
                {active.sub_kpis?.length >= 3 ? (
                  <>
                    <div style={{ height: 18 }} />
                    <div className="g2">
                      <Card onAsk={ask} title="Sub-KPI Radar — Positive Signal Strength" sub="Normalised positive rate across sub-KPIs">
                        <PosRateRadar rows={active.sub_kpis} brand={meta.brand} color={active.color} />
                      </Card>
                      {active.sub_kpis.some((s) => s.negative > 0) ? (
                        <Card onAsk={ask} title="Negative Signal Concentration" sub="Where friction lives in this dimension">
                          <CategoryBars
                            rows={active.sub_kpis
                              .filter((s) => s.negative > 0)
                              .map((s) => ({ name: s.name, value: s.negative }))}
                            color="#EF4444"
                          />
                        </Card>
                      ) : null}
                    </div>
                  </>
                ) : null}
              </Section>

              {(() => {
                // The source page benchmarks every dimension against the peer set;
                // the competitive heatmap already scores each brand per dimension.
                const bench = (competitive.heatmap?.rows || [])
                  .map((row) => {
                    const cell = row.cells.find((c) => c.dimension === active.name);
                    return cell && cell.score !== null
                      ? { name: row.brand, value: cell.score }
                      : null;
                  })
                  .filter(Boolean);
                return bench.length >= 2 ? (
                  <Section
                    tag="BENCHMARK"
                    title={`${active.name} vs. the peer set`}
                    subtitle="Every brand scored on this dimension, same 0-100 scale."
                  >
                    <Card onAsk={ask} title={`${active.name} Benchmarking`} sub={`${meta.brand} vs. tracked competitors`}>
                      <GaugeRows
                        rows={bench.map((b) => ({
                          ...b,
                          color: b.name === meta.brand ? active.color : "#9CA3AF",
                          bold: b.name === meta.brand,
                        }))}
                        logos={meta.logos}
                        max={100}
                      />
                    </Card>
                  </Section>
                ) : null;
              })()}

              {active.key === "advocacy" ? (
                <Section
                  tag="PROGRESSION"
                  title="Usage vs. loyalty vs. advocacy"
                  subtitle="Each stage is a subset of the one above it — the drop-off is the story."
                >
                  <Card title="Advocacy Funnel" sub="Posts at each stage of the relationship">
                    <HealthFunnel
                      rows={dimensions
                        .filter((d) => ["Awareness", "Consideration", "Preference", "Advocacy"].includes(d.name))
                        .map((d) => ({ name: d.name, value: d.volume, color: d.color }))}
                    />
                  </Card>
                </Section>
              ) : null}

              {active.insights?.length ? (
                <Section tag="ANALYSIS" title={`What this means for ${meta.brand}`}>
                  <div className="signal-grid">
                    {active.insights.map((insight, i) => (
                      // eslint-disable-next-line react/no-array-index-key -- order is the identity
                      <div className="signal-card" key={i}>
                        <div className="signal-title">Insight {i + 1}</div>
                        <div className="signal-item">
                          <div className="signal-badge" style={{ background: active.color }}>
                            {i + 1}
                          </div>
                          <div className="signal-text">
                            <Rich text={insight} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              ) : null}

              {nextDimension ? (
                <div className="outro">
                  <div className="story-eyebrow">Next</div>
                  <div className="story-title">{nextDimension.name}</div>
                  <div className="story-body">
                    {nextDimension.name} scores {nextDimension.score} ({nextDimension.band}) on{" "}
                    {nextDimension.volume.toLocaleString()} posts.
                  </div>
                  <button type="button" className="story-cta" onClick={() => go(nextDimension.key)}>
                    Open {nextDimension.name} &rarr;
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </>
      ) : null}

      {/* ------------------------------------------------------ COMPETITIVE */}
      {view === COMPETITIVE ? (
        <>
          <div className="tab-hero" style={{ background: "linear-gradient(135deg,#1c7c9c,#1c7c9caa)" }}>
            <TabHeroImg src={heroPhoto(2)} />
            <div className="tab-hero-overlay" />
            <div className="tab-hero-content">
              <button type="button" className="tab-back" onClick={() => go(HOME)}>
                ← Home
              </button>
              <div className="thc-meta">
                <span className="thc-meta-item">Competitive Intelligence</span>
                <span className="thc-pill">
                  {meta.dataset_mode === "brand" ? "Single-brand export" : "Category export"}
                </span>
              </div>
              <h1 className="thc-h1">
                {meta.brand} against the {competitive.tracked} brands named here
              </h1>
              {meta.dataset_mode === "brand" ? (
                <div className="thc-sub">
                  This export tracks one brand, so competitor rows are thin by construction —
                  read them as presence, not as market share.
                </div>
              ) : null}
            </div>
          </div>

          <div className="page active">
            <div className="page-inner">
              <Section tag="SHARE OF VOICE" title="Who is named, and how often">
                <table className="comp-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Brand</th>
                      <th>Share of voice</th>
                      <th>Net sentiment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {competitive.share_of_voice.map((row, i) => {
                      const rated = competitive.sentiment_league.find((s) => s.brand === row.brand);
                      return (
                        <tr key={row.brand} className={row.brand === meta.brand ? "is-brand" : undefined}>
                          <td>{i + 1}</td>
                          <td>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                              <BrandLogo brand={row.brand} logos={meta.logos} size={22} rounded={6} />
                              {row.brand === meta.brand ? <b>{row.brand}</b> : row.brand}
                            </span>
                          </td>
                          <td>{row.value}%</td>
                          <td>
                            {rated ? (
                              <span className={`pill ${rated.value >= 0 ? "ppos" : "pneg"}`}>
                                {rated.value > 0 ? "+" : ""}
                                {rated.value}
                              </span>
                            ) : (
                              // Below the rating threshold — a single article scores ±100.
                              <span className="pill pneu">not rated</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Section>

              {competitive.heatmap?.rows?.length ? (
                <Section tag="INDEX" title="Each brand as a composite score">
                  <div className="g3">
                    {competitive.heatmap.rows.slice(0, 6).map((row) => {
                      const rated = row.cells.filter((c) => c.score !== null);
                      const avg = rated.length
                        ? Math.round(rated.reduce((t, c) => t + c.score, 0) / rated.length)
                        : null;
                      return (
                        <div className="index-card" key={row.brand}>
                          <div className="index-brand">
                            <BrandLogo brand={row.brand} logos={meta.logos} size={30} rounded={8} />
                            <div>{row.is_brand ? <b>{row.brand}</b> : row.brand}</div>
                          </div>
                          <div className={`index-score ${avg === null ? "" : scoreClass(avg)}`}>
                            {avg === null ? "\u2014" : avg}
                          </div>
                          <div className="index-delta">
                            {rated.length} of {row.cells.length} dimensions rated
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Section>
              ) : null}

              {competitive.co_mentions?.length ? (
                <Section
                  tag="CO-MENTIONS"
                  title="How the brand reads when a rival is in the post"
                  subtitle="Only posts naming both. Brands under three mentions are not rated."
                >
                  <div className="g2">
                    <Card onAsk={ask} title="Competitor Co-Mention Volume" sub="Posts naming both brands">
                      <GaugeRows
                        rows={competitive.co_mentions.map((c) => ({ name: c.brand, value: c.value, color: "#1c7c9c" }))}
                        logos={meta.logos}
                      />
                    </Card>
                    <Card title="Share of Competitive Co-Mentions" sub="Split across rivals named">
                      <GaugeRows
                        rows={competitive.co_mentions.map((c) => ({ name: c.brand, value: c.share, color: "#9333ea" }))}
                        logos={meta.logos}
                        suffix="%"
                      />
                    </Card>
                  </div>
                  <div style={{ height: 18 }} />
                  <div className="g2">
                    <Card title="Sentiment When Co-Mentioned" sub="Net sentiment of those posts">
                      <GaugeRows
                        rows={competitive.co_mentions
                          .filter((c) => c.net_sentiment !== null)
                          .map((c) => ({ name: c.brand, value: c.net_sentiment, color: "#10B981" }))}
                        logos={meta.logos}
                      />
                    </Card>
                    <Card
                      title="Net Sentiment Differential"
                      sub={`Versus ${meta.brand}'s own net sentiment`}
                    >
                      <GaugeRows
                        rows={competitive.co_mentions
                          .filter((c) => c.differential !== null)
                          .map((c) => ({
                            name: c.brand,
                            value: c.differential,
                            color: c.differential >= 0 ? "#10B981" : "#EF4444",
                          }))}
                        logos={meta.logos}
                      />
                    </Card>
                  </div>
                </Section>
              ) : null}

              {competitive.heatmap?.rows?.length ? (
                <Section
                  tag="ALL DIMENSIONS"
                  title="Competitive heatmap"
                  subtitle="Every brand on the same 0-100 scale. A blank cell is not measured, not zero."
                >
                  <div className="card">
                    <div style={{ overflowX: "auto" }}>
                      <div className="heatmap" style={{ minWidth: 600 }}>
                        <div className="hm-row">
                          <div className="hm-label" />
                          {competitive.heatmap.dimensions.map((d) => (
                            <div className="hm-label col-label" style={{ flex: 1 }} key={d}>
                              {d}
                            </div>
                          ))}
                        </div>
                        {competitive.heatmap.rows.map((row) => (
                          <div className="hm-row" key={row.brand}>
                            <div className="hm-label">
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                                <BrandLogo brand={row.brand} logos={meta.logos} size={18} rounded={5} />
                                {row.is_brand ? <b>{row.brand}</b> : row.brand}
                              </span>
                            </div>
                            {row.cells.map((cell) => (
                              <div
                                className="hm-cell"
                                key={cell.dimension}
                                title={
                                  cell.score === null
                                    ? `${row.brand} · ${cell.dimension}: ${cell.volume} posts, too few to rate`
                                    : `${row.brand} · ${cell.dimension}: ${cell.score} from ${cell.volume} posts`
                                }
                                style={{
                                  flex: 1,
                                  // Opacity carries the score; an unrated cell stays blank.
                                  background:
                                    cell.score === null
                                      ? "var(--bg2)"
                                      : `rgba(112,32,130,${0.1 + (cell.score / 100) * 0.75})`,
                                  color: cell.score !== null && cell.score > 55 ? "#fff" : "var(--text)",
                                }}
                              >
                                {cell.score === null ? "—" : cell.score}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Section>
              ) : null}

              <Section tag="COMPOSITE" title="Brand Health Index over the window">
                <Card title="BHI Composite" sub="Daily net sentiment, the index's underlying signal">
                  <TrendLine rows={story.sentiment_trend} color="#1c7c9c" label="Net sentiment" />
                </Card>
              </Section>
            </div>
          </div>
        </>
      ) : null}

      {/* ---------------------------------------------------------- FINALE */}
      {view === FINALE ? (
        <>
          <div className="tab-hero" style={{ background: "linear-gradient(135deg,#3b0764,#9333ea,#c026d3)" }}>
            <TabHeroImg src={heroPhoto(3)} />
            <div className="tab-hero-overlay" />
            <div className="tab-hero-content">
              <button type="button" className="tab-back" onClick={() => go(HOME)}>
                ← Home
              </button>
              <div className="thc-meta">
                <span className="thc-meta-item">The Composite</span>
                <span className="thc-pill">{bhi.band}</span>
              </div>
              <h1 className="thc-h1">
                Brand Health Index {bhi.score} — {bhi.band}
              </h1>
              <div className="thc-sub">
                The weighted read across {bhi.covered} of {bhi.of} dimensions, and
                how it moved over {story.bhi_series?.span || meta.window_label}.
              </div>
            </div>
          </div>

          <div className="page active">
            <div className="page-inner">
              <Section
                tag="COMPOSITE"
                title={`BHI composite — ${story.bhi_series?.span || meta.window_label}`}
                subtitle={`${meta.brand} scored on the same 0-100 net-sentiment scale, per day.`}
              >
                <Card onAsk={ask} title="BHI Composite" sub="Brand health per day across the window">
                  <TrendLine
                    rows={(story.bhi_series?.points || []).map((p) => ({ day: p.label, score: p.score }))}
                    color="#9333ea"
                    valueKey="score"
                    label="Brand health"
                  />
                </Card>
              </Section>

              <Section tag="METHOD" title="BHI methodology">
                <div className="card">
                  <div className="card-hdr">
                    <div>
                      <div className="card-title">BHI Methodology</div>
                      <div className="card-sub">Weighted composite of five 0-100 sub-indices</div>
                    </div>
                  </div>
                  <div style={{ padding: "0 20px 20px" }}>
                    <p className="story-body">
                      Each dimension is scored as net sentiment on a 0-100 scale — the
                      share of its conversation that is positive, not the volume of it.
                      The five dimension scores are then combined on the source page's
                      own weights:
                    </p>
                    <table className="comp-table" style={{ marginTop: 12 }}>
                      <thead>
                        <tr>
                          <th>Dimension</th>
                          <th>Weight</th>
                          <th>Score</th>
                          <th>Contribution</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(bhi.contributions || []).map((c) => (
                          <tr key={c.name}>
                            <td>{c.name}</td>
                            <td>{c.weight}%</td>
                            <td>{c.score}</td>
                            <td>{c.contribution}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {bhi.renormalised ? (
                      <p className="story-body" style={{ marginTop: 12 }}>
                        {bhi.covered} of {bhi.of} dimensions had enough coverage to
                        score; the weights above were renormalised across those.
                      </p>
                    ) : null}
                  </div>
                </div>
              </Section>
            </div>
          </div>
        </>
      ) : null}

      <HealthModal panel={panel} onClose={() => setPanel(null)} />

      {story.footer?.length ? (
        <div className="page-footer">
          {story.footer.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
