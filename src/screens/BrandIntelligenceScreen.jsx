/**
 * Brand Intelligence — a port of docs/Html/"Brand Intelligence.html".
 *
 * A category-trends brief: an Overview tab framing the shifts in the brand's
 * space, then one tab per emerging theme (its conversation-share growth, a
 * sentiment split, the brands leading it and real consumer verbatims), and a
 * closing strategic-bet tab.
 *
 * The source embeds a bespoke video on every card. This port carries none — the
 * hero clip and every section image come from the Pexels-resolved payload
 * (see backend imagery.py); a missing image just leaves the CSS gradient.
 */
import { useEffect, useRef, useState } from "react";

import { Rich } from "../utils/text.jsx";
import BrandLogo from "../dashboards/storyboard/BrandLogo.jsx";
import "../dashboards/storyboard/brand-intel.css";

const DASHBOARD_KEY = "brand_intelligence";

/** The source's `.reveal` blocks start at opacity 0 and fade in on scroll. This
 *  app's dashboards scroll inside a nested container, not the window, so a plain
 *  IntersectionObserver misses most of them — reveal what is already on screen
 *  immediately, then observe the rest, and never leave a block invisible. */
function useReveal(rootRef, dep) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const targets = [...root.querySelectorAll(".reveal:not(.vis)")];
    if (!targets.length) return undefined;

    const show = (el) => el.classList.add("vis");
    if (typeof IntersectionObserver === "undefined") {
      targets.forEach(show);
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            show(entry.target);
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px 40% 0px" },
    );
    targets.forEach((el) => io.observe(el));
    // Safety net: anything still hidden a beat later just gets shown.
    const t = setTimeout(() => targets.forEach(show), 400);
    return () => {
      clearTimeout(t);
      io.disconnect();
    };
  }, [rootRef, dep]);
}

/** Wrap the `em` substring of a title in <em>, the source's accent styling.
 *  Avoids react-markdown here — it emits block <p> which cannot nest in <h1>. */
function emphasize(title, em) {
  const text = String(title || "");
  if (!em || !text.includes(em)) return text;
  const [before, after] = text.split(em);
  return (
    <>
      {before}
      <em>{em}</em>
      {after}
    </>
  );
}

/** A "Brands Leading This Space" card's asset — a real photo, a direct mp4
 *  the brand's own site hosted, or (most brand sites never host a raw video
 *  file, only ever embed one) a YouTube player. `.media-card` in the source
 *  template sizes an <img> and a <video> identically, so a video slots in
 *  without any layout change. */
function LeaderMedia({ media, name }) {
  if (!media?.url) return null;
  const boxStyle = { width: "100%", height: 200, objectFit: "cover", display: "block" };
  if (media.type === "youtube") {
    return (
      <iframe
        src={media.url}
        title={name}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        style={{ ...boxStyle, border: 0 }}
      />
    );
  }
  if (media.type === "mp4" || media.type === "webm") {
    return <video className="banner-video" src={media.url} controls muted playsInline style={boxStyle} />;
  }
  return <img src={media.url} alt={name} loading="lazy" style={boxStyle} />;
}

/** A brand's own site is far more often good for a YouTube clip than a raw
 *  video file — `<video src>` cannot play a YouTube URL at all, so the hero
 *  embeds one instead, with the parameters YouTube documents for an
 *  autoplaying, muted, looping background: `loop=1` only loops when
 *  `playlist` repeats the same video id. */
function youtubeBackgroundSrc(url) {
  const id = url.split("/").pop();
  return `${url}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&modestbranding=1&playsinline=1&rel=0&showinfo=0`;
}

function Hero({ hero }) {
  const media = hero.media;
  return (
    <div className="hero">
      {media?.type === "youtube" ? (
        <iframe
          className="hero-img"
          src={youtubeBackgroundSrc(media.url)}
          title=""
          allow="autoplay; encrypted-media"
          style={{ border: 0, pointerEvents: "none" }}
        />
      ) : media?.url ? (
        <video
          className="hero-img"
          src={media.url}
          poster={media.poster || ""}
          autoPlay
          muted
          loop
          playsInline
        />
      ) : null}
      <div className="hero-overlay" />
      <div className="hero-content">
        <span className="hero-eyebrow">{hero.eyebrow}</span>
        <h1 className="hero-title">{emphasize(hero.title, hero.title_em)}</h1>
        {hero.date_label ? <span className="hero-date">{hero.date_label}</span> : null}
        {hero.subtitle ? (
          <div className="sec-desc" style={{ color: "#cbb8b0", maxWidth: 620, marginBottom: "1.5rem" }}>
            <Rich text={hero.subtitle} inline />
          </div>
        ) : null}
        <div className="kpi-strip">
          {(hero.kpis || []).map((k) => (
            <div className="kpi-item" key={k.label}>
              <span className="kpi-val">{k.value}</span>
              <span className="kpi-lbl">{k.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function OverviewPanel({ overview, hero, onJump }) {
  return (
    <div className="tab-panel active" style={{ marginTop: 0 }}>
      <div className="content-wrap" style={{ paddingTop: "3rem" }}>
        <div className="context-setter reveal">
          <span className="ctx-label">Executive Overview</span>
          <div className="ctx-text">
            {overview.context ? (
              <Rich text={overview.context} inline />
            ) : (
              `Emerging shifts reshaping the ${hero.title_em || "category"} conversation.`
            )}
          </div>
        </div>
        <div className="overview-grid reveal">
          {overview.cards.map((c) => (
            <button
              type="button"
              className="ov-card"
              key={c.tab_id}
              onClick={() => onJump(c.tab_id)}
            >
              <span className="ov-num">{c.num}</span>
              <div className="ov-title">{c.title}</div>
              {c.stat ? <span className="ov-stat">{c.stat}</span> : null}
              {c.desc ? (
                <div className="ov-desc">
                  <Rich text={c.desc} inline />
                </div>
              ) : null}
              <span className="ov-cta">Explore →</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ConversationShare({ growth }) {
  return (
    <div>
      <span className="section-label">Conversation Share</span>
      <div className="conv-share">
        <div className="conv-year">
          <span className="conv-year-lbl">{growth.from_label}</span>
          <span className="conv-year-val">{growth.from_val}</span>
        </div>
        <div className="conv-arrow">→</div>
        <div className="conv-year">
          <span className="conv-year-lbl">{growth.to_label}</span>
          <span className="conv-year-val">{growth.to_val}</span>
          {growth.has_delta ? (
            <div className="conv-badge">
              {growth.delta_pct >= 0 ? "↑ +" : "↓ "}
              {growth.delta_pct}%
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SentimentSplit({ rows }) {
  return (
    <div>
      <span className="section-label">Consumer Sentiment Split</span>
      <div className="sentiment-split">
        {rows.map((r) => (
          <div className={`sent-cell ${r.tone}`} key={r.label}>
            <span className="sent-pct">{r.pct}%</span>
            <span className="sent-lbl">{r.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ThemePanel({ tab, active, image, logos }) {
  const leaders = tab.leaders || { items: [] };
  return (
    <div className={`tab-panel ${active ? "active" : ""}`} style={{ paddingTop: "2rem" }}>
      <div
        className="sec-banner"
        style={{
          background: "var(--card)",
          boxShadow: "0 4px 32px rgba(0,0,0,.10)",
          borderBottom: "4px solid var(--brand-1)",
          borderRadius: 16,
          margin: "0 2rem",
        }}
      >
        <div className="sec-banner-text">
          <span className="sec-tag">{tab.banner.tag}</span>
          <h2 className="sec-title">{tab.banner.title}</h2>
          {tab.banner.stat ? <span className="sec-stat">{tab.banner.stat}</span> : null}
          {tab.banner.desc ? (
            <div className="sec-desc">
              <Rich text={tab.banner.desc} inline />
            </div>
          ) : null}
        </div>
        {image ? (
          <img
            src={image}
            alt={tab.label}
            loading="lazy"
            style={{
              width: 340,
              height: 220,
              objectFit: "cover",
              borderRadius: 12,
              flexShrink: 0,
              boxShadow: "0 8px 30px rgba(0,0,0,.12)",
            }}
          />
        ) : null}
      </div>

      <div className="content-wrap" style={{ paddingTop: "3rem" }}>
        {tab.context ? (
          <div className="context-setter reveal">
            <span className="ctx-label">Why This Matters</span>
            <div className="ctx-text">
              <Rich text={tab.context} inline />
            </div>
          </div>
        ) : null}

        <div className="grid-2 reveal" style={{ marginBottom: "2rem" }}>
          <ConversationShare growth={tab.growth} />
          <SentimentSplit rows={tab.sentiment} />
        </div>

        <div className="divider" />

        <div className="sec-header reveal">
          <span className="sec-header-tag">
            {leaders.tag} &nbsp;·&nbsp;{" "}
            <strong style={{ color: "var(--brand-1)", fontSize: 12 }}>
              Engagement {leaders.engagement}
            </strong>{" "}
            &nbsp;·&nbsp;{" "}
            <strong style={{ color: "var(--brand-1)", fontSize: 12 }}>
              Mentions {leaders.reviews}
            </strong>
          </span>
          <h3>
            Brands Leading <em>This Space</em>
          </h3>
        </div>
        <div className="grid-3 reveal">
          {leaders.items.map((l) => (
            <div className="media-card" key={l.name}>
              <LeaderMedia media={l.media} name={l.name} />
              <div className="media-info">
                <div
                  className="media-name"
                  style={{ display: "flex", alignItems: "center", gap: 8 }}
                >
                  <BrandLogo brand={l.name} logos={logos} size={20} rounded={6} />
                  {l.name}
                </div>
                {l.desc ? (
                  <div className="media-desc">
                    <Rich text={l.desc} inline />
                  </div>
                ) : null}
                {l.badge ? <span className="media-badge">{l.badge}</span> : null}
              </div>
            </div>
          ))}
        </div>

        {tab.verbatims?.length ? (
          <>
            <div className="divider" />
            <div className="sec-header reveal">
              <span className="sec-header-tag">Consumer Voice</span>
              <h3>
                Real Words from <em>Real Consumers</em>
              </h3>
            </div>
            <div className="verbatim-grid reveal">
              {tab.verbatims.map((v, i) => (
                // eslint-disable-next-line react/no-array-index-key -- verbatims have no id
                <div className="verbatim" key={i}>
                  <p className="verbatim-text">{v.text}</p>
                  <span className="verbatim-source">{v.source}</span>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

function StrategyPanel({ tab, active }) {
  const s = tab.strategy || {};
  return (
    <div className={`tab-panel ${active ? "active" : ""}`} style={{ paddingTop: "2rem" }}>
      <div
        className="sec-banner"
        style={{
          background: "var(--card)",
          boxShadow: "0 4px 32px rgba(0,0,0,.10)",
          borderBottom: "4px solid var(--brand-1)",
          borderRadius: 16,
          margin: "0 2rem",
        }}
      >
        <div className="sec-banner-text">
          <span className="sec-tag">{tab.banner.tag}</span>
          <h2 className="sec-title">{tab.banner.title}</h2>
        </div>
      </div>
      <div className="content-wrap" style={{ paddingTop: "3rem" }}>
        <div className="context-setter reveal">
          <span className="ctx-label">Recommendation</span>
          <div className="ctx-text">
            {s.body ? <Rich text={s.body} inline /> : "Run Create Dashboard to generate the recommendation."}
          </div>
        </div>
        {s.formula?.length ? (
          <div className="reveal" style={{ marginTop: "2rem" }}>
            <span className="section-label">{s.title || "Winning Formula"}</span>
            <div className="conv-share" style={{ flexWrap: "wrap" }}>
              {s.formula.map((f, i) => (
                <span key={f}>
                  {i > 0 ? <span className="conv-arrow">+</span> : null}
                  <span className="conv-year-val" style={{ fontSize: "1.1rem" }}>
                    {f}
                  </span>
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function BrandIntelligenceScreen({
  chartsData,
  chartsLoading,
  chartsError,
  onBack,
}) {
  const story = chartsData?.[DASHBOARD_KEY];
  const [tab, setTab] = useState("overview");
  const rootRef = useRef(null);
  useReveal(rootRef, tab);

  if (chartsLoading) return <div className="sb-state">Loading brand intelligence…</div>;
  if (chartsError) return <div className="sb-state sb-state--error">{chartsError}</div>;
  if (!story?.tabs?.length) {
    return (
      <div className="sb-state">
        No brand intelligence yet. Run <strong>Create Dashboard</strong> from the Review screen.
      </div>
    );
  }

  const { meta, hero, overview, tabs } = story;
  const jump = (id) => {
    setTab(id);
    rootRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="sb-lens sb-brand-intel" ref={rootRef}>
      <div className="nav-wrap">
        <div className="nav-inner">
          {onBack ? (
            <button type="button" className="sb-back" onClick={onBack}>
              ← Back
            </button>
          ) : null}
          <div className="brand">
            <div className="brand-text">
              <div className="brand-name">{meta.brand || "Brand"} Intelligence</div>
              <div className="brand-sub">{meta.window_label}</div>
            </div>
          </div>
          <div className="tab-bar">
            <button
              type="button"
              className={`tab ${tab === "overview" ? "active" : ""}`}
              onClick={() => jump("overview")}
            >
              <span className="tdot" />
              Overview
            </button>
            {tabs.map((t) => (
              <button
                type="button"
                className={`tab ${tab === t.id ? "active" : ""}`}
                key={t.id}
                onClick={() => jump(t.id)}
              >
                <span className="tdot" />
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Hero hero={hero} />

      {tab === "overview" ? (
        <OverviewPanel overview={overview} hero={hero} onJump={jump} />
      ) : null}

      {tabs.map((t) =>
        t.strategy ? (
          <StrategyPanel key={t.id} tab={t} active={tab === t.id} />
        ) : (
          <ThemePanel
            key={t.id}
            tab={t}
            active={tab === t.id}
            image={t.banner?.image}
            logos={meta.logos}
          />
        ),
      )}
    </div>
  );
}
