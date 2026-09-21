/**
 * Presentational blocks of the storyboard, ported one-for-one from the markup in
 * docs/Html/*.html. Class names are the contract with storyboard.css — renaming
 * one here silently unstyles that block.
 */
import { useEffect, useMemo, useRef, useState } from "react";

import { Rich } from "../../utils/text.jsx";
import BannerMedia from "./bannerMedia.jsx";
import BrandLogo from "./BrandLogo.jsx";

const POSITIVE = "#059669";
const NEGATIVE = "#dc2626";

/** Counts an integer up on mount, matching the hero's animated headline stat. */
function useCountUp(target, run) {
  const [value, setValue] = useState(run ? 0 : target);

  useEffect(() => {
    if (!run || !Number.isFinite(target)) {
      setValue(target);
      return undefined;
    }
    let frame;
    const started = performance.now();
    const tick = (now) => {
      // easeOutCubic — fast start, gentle settle, as in the source page
      const t = Math.min(1, (now - started) / 1100);
      setValue(Math.round(target * (1 - (1 - t) ** 3)));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, run]);

  return value;
}

function HeroStat({ stat }) {
  // Only a plain integer can count up; "+34%" and "83.9%" render as written.
  const numeric = /^\d[\d,]*$/.test(String(stat.value))
    ? Number(String(stat.value).replace(/,/g, ""))
    : null;
  const counted = useCountUp(numeric ?? 0, Boolean(stat.animate && numeric !== null));

  return (
    <div className="hstat">
      <div className="v">
        {stat.animate && numeric !== null ? <em>{counted.toLocaleString()}</em> : stat.value}
      </div>
      <div className="l">{stat.label}</div>
    </div>
  );
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

export function Hero({ hero }) {
  const media = hero?.media;
  // Pexels results carry type:"video" (a leftover from when this field only
  // ever came from Pexels); the brand's own site instead reports the actual
  // file type it found — "mp4"/"webm" play the same way, "youtube" cannot
  // and needs an iframe embed instead.
  const isFile = media?.type === "video" || media?.type === "mp4" || media?.type === "webm";
  return (
    <div className="hero">
      <div className="hero-grid" />
      {media?.type === "youtube" ? (
        <iframe
          className="hero-video"
          src={youtubeBackgroundSrc(media.url)}
          title=""
          allow="autoplay; encrypted-media"
          style={{ border: 0, pointerEvents: "none" }}
        />
      ) : isFile && media.url ? (
        <video className="hero-video" autoPlay muted loop playsInline poster={media.poster || ""}>
          <source src={media.url} type="video/mp4" />
        </video>
      ) : media?.url ? (
        <img className="hero-video" src={media.url} alt="" />
      ) : null}
      <div className="hero-video-tint" />
      <div className="hero-inner">
        <div className="hero-top">
          <div className="hero-eyebrow">
            <span className="dot" />
            {hero?.eyebrow}
          </div>
          <div className="hero-chips">
            {(hero?.chips || []).map((chip) => (
              <div className="hero-chip" key={chip}>
                {chip}
              </div>
            ))}
          </div>
        </div>
        <div className="hero-center">
          <h1 className="hero-title">{hero?.title}</h1>
          {hero?.subtitle ? <p className="hero-sub">{hero.subtitle}</p> : null}
          {hero?.stats?.length ? (
            <div className="hero-stats">
              {hero.stats.map((stat) => (
                <HeroStat stat={stat} key={stat.label} />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// Ported from the source page's makeParticles(): 18 drifting dots per banner,
// with a distinct colour set per tab.
const PARTICLE_COLORS = {
  "b-snapshot": ["rgba(76,29,149,.4)", "rgba(147,51,234,.3)", "rgba(255,255,255,.15)"],
  "b-trends": ["rgba(168,85,247,.5)", "rgba(124,58,237,.35)", "rgba(255,255,255,.2)"],
  "b-position": ["rgba(192,38,211,.45)", "rgba(147,51,234,.3)", "rgba(255,255,255,.18)"],
};

function BannerParticles({ variant }) {
  const colors = PARTICLE_COLORS[variant] || PARTICLE_COLORS["b-snapshot"];
  // Randomised once per banner: re-rolling on every render would make the dots
  // jump instead of drift.
  const dots = useMemo(
    () =>
      Array.from({ length: 18 }, () => {
        const size = 6 + Math.random() * 18;
        return {
          width: `${size}px`,
          height: `${size}px`,
          background: colors[Math.floor(Math.random() * colors.length)],
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animation: `sb-floatUp ${3 + Math.random() * 5}s ${Math.random() * 4}s linear infinite`,
        };
      }),
    [colors],
  );

  return (
    <div className="anim-layer">
      {dots.map((style, i) => (
        // eslint-disable-next-line react/no-array-index-key -- decorative, order is identity
        <div key={i} style={{ position: "absolute", borderRadius: "50%", opacity: 0, ...style }} />
      ))}
    </div>
  );
}

export function TabBanner({ tab }) {
  const banner = tab.banner || {};
  return (
    <div className={`tbanner ${tab.banner_class || "b-snapshot"}`}>
      <div className="bg-overlay" />
      <BannerParticles variant={tab.banner_class} />
      <BannerMedia image={banner.image} topic={banner.eyebrow || banner.headline || tab.label} className="banner-img" />
      <div className="text-layer">
        <div className="eyebrow">{banner.eyebrow}</div>
        <h2>{banner.headline || tab.label}</h2>
        {banner.sub ? <p className="tsub">{banner.sub}</p> : null}
        {banner.badges?.length ? (
          <div className="tbadges">
            {banner.badges.map((badge) => (
              <span className="tbadge" key={badge}>
                {badge}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function ContextSetter({ context }) {
  if (!context?.body) return null;
  return (
    <div className={`ctx-setter ${context.tone || "brand"} reveal`}>
      <div className="ctx-icon">{context.icon}</div>
      <div className="ctx-text">
        <div className="ctx-why">{context.heading}</div>
        <div className="ctx-line">
          <Rich text={context.body} />
        </div>
      </div>
    </div>
  );
}

export function KpiFlipGrid({ kpis }) {
  const [flipped, setFlipped] = useState(() => new Set());
  if (!kpis?.length) return null;

  const toggle = (index) =>
    setFlipped((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });

  return (
    <div className="kpi-grid reveal">
      {kpis.map((kpi, index) => (
        <div
          key={kpi.label}
          className={`kpi k-accent${flipped.has(index) ? " flipped" : ""}`}
          style={{ "--ac1": kpi.accent?.[0], "--ac2": kpi.accent?.[1] }}
          onClick={() => toggle(index)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggle(index);
            }
          }}
          role="button"
          tabIndex={0}
        >
          <div className="kpi-flip">
            <div className="kpi-front">
              <div className="l">{kpi.label}</div>
              <div className="v">{kpi.value}</div>
              <div className={`delta ${kpi.direction === "down" ? "dn" : "up"}`}>
                {kpi.direction === "down" ? "↓" : "↑"} {kpi.delta}
              </div>
            </div>
            <div className="kpi-back">
              <div className="blbl">What This Means</div>
              <p>{kpi.back || "No analysis was generated for this card."}</p>
            </div>
          </div>
          <div className="flip-hint">↻ flip</div>
        </div>
      ))}
    </div>
  );
}

export function SectionHead({ eyebrow, title, emphasis, desc, style }) {
  return (
    <div className="sec-head reveal" style={style}>
      {eyebrow ? <div className="sec-eyebrow">{eyebrow}</div> : null}
      <div className="sec-title">
        {title} {emphasis ? <em>{emphasis}</em> : null}
      </div>
      {desc ? <div className="sec-desc">{desc}</div> : null}
    </div>
  );
}

export function Card({ title, sub, onOpen, children, className = "" }) {
  return (
    <div
      className={`card reveal ${className}`}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (onOpen && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onOpen();
        }
      }}
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
    >
      <div className="card-head">
        <div>
          <div className="card-title">{title}</div>
          {sub ? <div className="card-sub">{sub}</div> : null}
        </div>
        {onOpen ? (
          <button
            type="button"
            className="mini-btn"
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
          >
            ✦ AI
          </button>
        ) : null}
      </div>
      <div className="card-body">{children}</div>
    </div>
  );
}

export function SignalCards({ signals, captureLabel, onOpen }) {
  if (!signals?.length) return null;
  return (
    <div className="sig-grid reveal d1">
      {signals.map((signal) => (
        <div
          key={signal.id}
          className="sig-card"
          style={{ "--sc": signal.color }}
          onClick={() => onOpen(signal.id)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onOpen(signal.id);
            }
          }}
          role="button"
          tabIndex={0}
        >
          <div className="sig-card-in">
            <div className={`sig-stage stage-${signal.stage}`}>{signal.stage_label}</div>
            <div className="sig-name">{signal.name}</div>
            <div
              className="sig-growth"
              style={{ color: signal.growth >= 0 ? POSITIVE : NEGATIVE }}
            >
              {signal.growth >= 0 ? "+" : ""}
              {signal.growth}%
            </div>
            <div className="sig-glabel">Share-of-conversation growth</div>
            <div className="sig-rows">
              <div className="sig-row">
                <span className="k">Volume</span>
                <span className="vv">{signal.volume.toLocaleString()}</span>
              </div>
              <div className="sig-row">
                <span className="k">Net sentiment</span>
                <span
                  className="vv"
                  style={{ color: signal.net_sentiment >= 0 ? POSITIVE : NEGATIVE }}
                >
                  {signal.net_sentiment >= 0 ? "+" : ""}
                  {signal.net_sentiment}
                </span>
              </div>
              <div className="sig-row">
                <span className="k">Leader</span>
                <span className="vv" style={{ fontSize: "10.5px" }}>
                  {signal.leaders?.[0]
                    ? `${signal.leaders[0].brand} (${signal.leaders[0].count})`
                    : "—"}
                </span>
              </div>
              <div className="sig-row">
                <span className="k">{captureLabel}</span>
                <span className="vv" style={{ color: "var(--brand-1)" }}>
                  {signal.brand_capture}%
                </span>
              </div>
            </div>
            <div className="sig-cta">✦ AI deep-dive →</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function CaptureRanking({ rows }) {
  const ref = useRef(null);

  // The bars start at width 0 in CSS and transition to their real width; setting
  // it in a frame after mount is what makes them animate rather than appear.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      ref.current?.querySelectorAll(".bar-fill").forEach((el) => {
        el.style.width = el.dataset.w || "0%";
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [rows]);

  if (!rows?.length) return null;
  const peak = Math.max(...rows.map((r) => r.capture), 1);

  return (
    <div className="card reveal d1" ref={ref}>
      <div className="card-body">
        {rows.map((row) => (
          <div className="rankrow" key={row.name}>
            <div className="rname">{row.name}</div>
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{ background: `linear-gradient(90deg,${row.color},${row.color}cc)` }}
                // Scaled to the strongest bar so the widest row fills the track.
                data-w={`${Math.max(6, (row.capture / peak) * 100)}%`}
              >
                <span className="bv">{row.capture}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Callout({ text }) {
  if (!text) return null;
  return (
    <div className="callout reveal">
      <Rich text={text} />
    </div>
  );
}

const CI_API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

/** Loads Twitter's own embed script once, then asks it to activate any new
 * `.twitter-tweet` blockquotes already in the DOM (widgets.js only scans on
 * load and on explicit `widgets.load()` calls, not via a MutationObserver). */
function useTwitterWidgets(active) {
  useEffect(() => {
    if (!active) return undefined;
    const existing = document.querySelector('script[data-twitter-widgets]');
    if (existing) {
      window.twttr?.widgets?.load();
      return undefined;
    }
    const script = document.createElement("script");
    script.src = "https://platform.twitter.com/widgets.js";
    script.async = true;
    script.dataset.twitterWidgets = "1";
    document.body.appendChild(script);
    return undefined;
  }, [active]);
}

/** Real evidence for a verbatim quote, in the same preference order the
 * backend resolved it: an official embed (X/YouTube, live and ToS-safe),
 * else a server-captured screenshot of the live post, else the plain quote
 * text every caller already showed before this existed. */
function VerbatimEvidence({ quote, logos }) {
  const embed = quote.embed;
  useTwitterWidgets(embed?.type === "twitter");

  if (embed?.type === "twitter") {
    return (
      <blockquote className="twitter-tweet" data-conversation="none">
        <a href={quote.url}>{quote.text}</a>
      </blockquote>
    );
  }
  if (embed?.type === "youtube") {
    return (
      <iframe
        className="vb-embed"
        src={`https://www.youtube.com/embed/${embed.video_id}`}
        title={quote.source || "Embedded post"}
        allow="encrypted-media"
      />
    );
  }
  if (quote.screenshot_key) {
    return (
      <img
        className="vb-shot"
        src={`${CI_API_BASE}/consumer-intelligence/verbatim-image?key=${encodeURIComponent(quote.screenshot_key)}`}
        alt={quote.text}
      />
    );
  }
  return (
    <>
      “{quote.text}”
      <span className="src">
        {logos && quote.source ? <BrandLogo brand={quote.source.split(" · ")[0]} logos={logos} size={14} rounded={4} /> : null}
        {quote.source}
      </span>
    </>
  );
}

export function Quotes({ quotes, logos }) {
  if (!quotes?.length) return null;
  return (
    <div className="vb-grid reveal d1">
      {quotes.map((quote) => (
        <div className={`vb${quote.embed || quote.screenshot_key ? " vb-evidence" : ""}`} key={quote.source + quote.text.slice(0, 24)}>
          <VerbatimEvidence quote={quote} logos={logos} />
          {/* Caption below, not an overlay — an overlay badge collides with a
           * real embed's own UI (follow/menu button, reply row). */}
          {quote.engagement != null ? <div className="vb-engagement">{Number(quote.engagement).toLocaleString()} engagements</div> : null}
        </div>
      ))}
    </div>
  );
}

export function Priorities({ priorities, onOpen }) {
  if (!priorities?.length) return null;
  return (
    <div className="prio-grid reveal d1">
      {priorities.map((priority) => (
        <div
          key={priority.num}
          className="prio"
          onClick={() => onOpen(priority.signal_id)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onOpen(priority.signal_id);
            }
          }}
          role="button"
          tabIndex={0}
        >
          <div className="prio-num">{priority.num}</div>
          <div className="prio-name">{priority.name}</div>
          <div className="prio-score">{priority.score}</div>
          <div style={{ marginBottom: "10px" }}>
            <span className={`sig-stage stage-${priority.stage}`}>{priority.stage_label}</span>
          </div>
          <div className="prio-why">
            {priority.why ? <Rich text={priority.why} /> : "No analysis was generated."}
          </div>
          <div className="prio-cta">✦ AI deep-dive →</div>
        </div>
      ))}
    </div>
  );
}

export function VerdictColumns({ columns }) {
  if (!columns?.length) return null;
  return (
    <div className="grid2 reveal">
      {columns.map((column) => (
        <div
          className="card"
          key={column.title}
          style={{
            borderLeft: `4px solid ${column.tone === "positive" ? "var(--pos)" : "var(--neg)"}`,
          }}
        >
          <div className="card-body">
            <div
              style={{
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: ".12em",
                textTransform: "uppercase",
                color: column.tone === "positive" ? "var(--pos)" : "var(--neg)",
                marginBottom: "10px",
              }}
            >
              {column.title}
            </div>
            <div style={{ fontSize: "12.5px", color: "var(--ink2)", lineHeight: 1.7 }}>
              {column.items.length ? (
                column.items.map((item) => (
                  <div key={item.label}>
                    <strong>{item.label}</strong>
                    {item.text ? <> — {item.text}</> : null}
                  </div>
                ))
              ) : (
                <span className="sb-muted">Nothing in this group.</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Word-boundary-safe label truncation with an ellipsis; never cuts mid-word. */
function truncateLabel(text, chars) {
  const s = String(text || "");
  if (s.length <= chars) return s;
  return s.slice(0, chars).replace(/\s+\S*$/, "") + "…";
}

const SENTIMENT_R = 68;
const SENTIMENT_CIRC = 2 * Math.PI * SENTIMENT_R;
const SENTIMENT_COLOR = { pos: "var(--pos)", neg: "var(--neg)", neu: "var(--neu)" };

/**
 * Three-slice hand-drawn donut for a fixed pos/neg/neu sentiment split.
 * Same stroke-dasharray/dashoffset technique as wg-blocks.jsx's `ShareDonut`,
 * but with three hardcoded tone colours instead of a category palette.
 */
export function SentimentDonut({ rows }) {
  if (!rows?.length) return null;
  const total = rows.reduce((a, r) => a + (Number(r.pct) || 0), 0) || 1;
  const lead = rows.reduce((a, r) => (Number(r.pct) > Number(a.pct) ? r : a), rows[0]);
  let off = 0;
  return (
    <div className="donut">
      <svg viewBox="0 0 170 170" role="img" aria-label={rows.map((r) => `${r.name} ${r.pct}%`).join(", ")}>
        {rows.map((r) => {
          const color = SENTIMENT_COLOR[r.tone] || SENTIMENT_COLOR.neu;
          const len = (r.pct / total) * SENTIMENT_CIRC, vis = Math.max(len - 2, 0);
          const seg = (
            <circle
              key={r.name}
              className="seg"
              r={SENTIMENT_R}
              cx={85}
              cy={85}
              fill="none"
              stroke={color}
              strokeWidth={20}
              strokeDasharray={`${vis} ${SENTIMENT_CIRC - vis}`}
              strokeDashoffset={-off}
              transform="rotate(-90 85 85)"
            >
              <title>{`${r.name}: ${r.pct}%`}</title>
            </circle>
          );
          off += len;
          return seg;
        })}
        <text className="center" x={85} y={82} textAnchor="middle">
          {lead.pct}%
        </text>
        <text className="center-l" x={85} y={100} textAnchor="middle">
          {String(lead.name).slice(0, 14)}
        </text>
      </svg>
      <div className="legend">
        {rows.map((r) => (
          <span key={r.name}>
            <span className="n">
              <i style={{ background: SENTIMENT_COLOR[r.tone] || SENTIMENT_COLOR.neu }} />
              {r.name}
            </span>
            <span className="v">
              {r.pct}%{r.count != null ? ` · ${r.count}` : ""}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

/** Generic multi-category donut (unlike SentimentDonut, colors aren't tone-locked
 * to pos/neg/neutral) — for splits like "share of conversation by pillar/topic". */
export function CategoryDonut({ rows, colors }) {
  if (!rows?.length) return null;
  const total = rows.reduce((a, r) => a + (Number(r.pct) || 0), 0) || 1;
  const lead = rows.reduce((a, r) => (Number(r.pct) > Number(a.pct) ? r : a), rows[0]);
  let off = 0;
  return (
    <div className="donut">
      <svg viewBox="0 0 170 170" role="img" aria-label={rows.map((r) => `${r.name} ${r.pct}%`).join(", ")}>
        {rows.map((r, i) => {
          const color = colors?.[i % (colors.length || 1)] || SENTIMENT_COLOR.neu;
          const len = (r.pct / total) * SENTIMENT_CIRC, vis = Math.max(len - 2, 0);
          const seg = (
            <circle
              key={r.name}
              className="seg"
              r={SENTIMENT_R}
              cx={85}
              cy={85}
              fill="none"
              stroke={color}
              strokeWidth={20}
              strokeDasharray={`${vis} ${SENTIMENT_CIRC - vis}`}
              strokeDashoffset={-off}
              transform="rotate(-90 85 85)"
            >
              <title>{`${r.name}: ${r.pct}%`}</title>
            </circle>
          );
          off += len;
          return seg;
        })}
        <text className="center" x={85} y={82} textAnchor="middle">
          {lead.pct}%
        </text>
        <text className="center-l" x={85} y={100} textAnchor="middle">
          {truncateLabel(lead.name, 16)}
        </text>
      </svg>
      <div className="legend">
        {rows.map((r, i) => (
          <span key={r.name}>
            <span className="n">
              <i style={{ background: colors?.[i % (colors.length || 1)] || SENTIMENT_COLOR.neu }} />
              {r.name}
            </span>
            <span className="v">
              {r.pct}%{r.count != null ? ` · ${r.count}` : ""}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

const PCT_KEYS = new Set(["competitor_share", "brand_share", "gap"]);

/** Plain HTML table for the whitespace/gap rows — no sorting, no interaction. */
export function MatrixTable({ rows, columns }) {
  if (!rows?.length || !columns?.length) return null;
  return (
    <table className="matrix-table">
      <thead>
        <tr>
          {columns.map((c) => (
            <th key={c.key}>{c.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          // eslint-disable-next-line react/no-array-index-key -- rows have no stable id
          <tr key={row.topic || i}>
            {columns.map((c) => {
              const v = row[c.key];
              return <td key={c.key}>{PCT_KEYS.has(c.key) && v != null && v !== "" ? `${v}%` : v}</td>;
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function WhatsNext({ whatsNext, onTab }) {
  if (!whatsNext?.title && !whatsNext?.actions?.length) return null;
  return (
    <div className="whats-next reveal">
      <div className="wn-inner">
        <div>
          <div className="wn-eyebrow">
            <span className="icon" />
            {whatsNext.eyebrow}
          </div>
          <h3 className="wn-title">{whatsNext.title}</h3>
          {whatsNext.sub ? <p className="wn-sub">{whatsNext.sub}</p> : null}
        </div>
        <div>
          <div className="wn-actions">
            {(whatsNext.actions || []).map((action) => (
              <div
                key={action.target + action.title}
                className="wn-action"
                onClick={() => onTab(action.target)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onTab(action.target);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div className="wnum">{action.num}</div>
                <h5>{action.title}</h5>
                <p>{action.body}</p>
              </div>
            ))}
          </div>
          {whatsNext.cta ? (
            <div className="wn-cta-row">
              <button
                type="button"
                className="wn-cta"
                onClick={() => onTab(whatsNext.cta.target)}
              >
                <span className="wn-cta-lbl">{whatsNext.cta.label}</span>
                <span className="wn-cta-name">{whatsNext.cta.name}</span>
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M5 12h14M13 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
