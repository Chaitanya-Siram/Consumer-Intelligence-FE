/**
 * Lens-specific blocks for Social Research — the Social Research Tier-1
 * pillar's single Tier-2 screen (seven tabs: overview + six sub-lenses).
 * Reads the payload built by
 * consumer_intelligence/storyboard/social_research.py.
 *
 * No charting library for anything that doesn't need one: theme, pillar and
 * insight cards are plain CSS, same house style as wg-blocks.jsx. The two
 * generic primitives (`SentimentDonut`, `MatrixTable`) live in blocks.jsx
 * since they're reusable beyond this lens; everything here is composed on
 * top of those plus the shared `Card` / `SectionHead` / `Callout` /
 * `VerdictColumns` / `Quotes` / chart primitives used directly by the
 * screen. Class names here are the contract with sr.css.
 */
import { useState } from "react";

import BrandLogo from "./BrandLogo.jsx";
import BannerMedia, { useBannerImage } from "./bannerMedia.jsx";
import { Card, SentimentDonut } from "./blocks.jsx";
import { Legendary, TrajectoryChart } from "./charts.jsx";
import { Rich, SecHead } from "./pa-blocks.jsx";
import { BarList } from "./wg-blocks.jsx";

export { Rich, SecHead };

export const CAT = ["var(--c1)", "var(--c2)", "var(--c3)", "var(--c4)", "var(--c5)", "var(--c6)", "var(--c7)"];

/** Small photo standing in for the PPT's per-card image, resolved the same
 * way tab banners already are (Pexels by topic, cached, Unsplash fallback). */
function CardThumb({ topic }) {
  const url = useBannerImage({ topic });
  if (!url) return null;
  return <div className="card-thumb" style={{ backgroundImage: `url(${url})` }} aria-hidden="true" />;
}

/**
 * Hero banner: eyebrow / headline / sub / stats, same shape as every other
 * lens's banner (WgBanner, DnBanner, PaBanner) — plus one distinctive touch:
 * a small circular "brand badge" with a CSS-only rotating conic-gradient
 * ring around the brand mark, so this lens's hero doesn't look identical to
 * every other lens's banner.
 */
export function SrBanner({ banner = {}, variant = "b-purple", brand, logos }) {
  return (
    <div className={`tbanner ${variant}`}>
      <BannerMedia image={banner.image} topic={banner.eyebrow || banner.headline} />
      <div className="banner-tint" />
      <div className="banner-inner">
        {brand ? (
          <div className="sr-badge" title={brand}>
            <div className="sr-badge-ring" />
            <div className="sr-badge-logo">
              <BrandLogo brand={brand} logos={logos} size={54} rounded={999} />
            </div>
          </div>
        ) : null}
        {banner.eyebrow ? (
          <div className="b-eyebrow">
            <span className="dot" />
            {banner.eyebrow}
          </div>
        ) : null}
        <div className="b-title disp">{banner.headline}</div>
        {banner.sub ? <div className="b-sub">{banner.sub}</div> : null}
        {banner.stats?.length ? (
          <div className="b-stats">
            {banner.stats.map((s) => (
              <div className="b-stat" key={s.label}>
                <div className="v">{s.value}</div>
                <div className="l">{s.label}</div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** Theme-share cards: photo + title + pct (+ count/text when present). */
export function ThemeShareCards({ themes }) {
  if (!themes?.length) return null;
  return (
    <div className={`grid g${Math.min(themes.length, 5) || 1}`}>
      {themes.map((t, i) => (
        <div className="card src-tint illustrated" key={t.key} style={{ borderTopColor: CAT[i % CAT.length] }}>
          <CardThumb topic={t.title} />
          <div className="pct" style={{ color: CAT[i % CAT.length] }}>
            {t.pct}%
          </div>
          <h4>{t.title}</h4>
          {t.count != null ? <div className="count">{Number(t.count).toLocaleString()} mentions</div> : null}
          {t.text ? (
            <p>
              <Rich text={t.text} />
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

/**
 * Named-entity cards: the specific venues/events/platforms posts actually
 * name (e.g. "Heineken Riverdeck"), each with a matching photo — the PPT's
 * "Brand Associations" icon+image cards, but data-driven off real extracted
 * names rather than a fixed category.
 */
export function EntityCards({ entities, brand }) {
  if (!entities?.length) return null;
  return (
    <div className={`grid g${Math.min(entities.length, 3) || 1}`}>
      {entities.map((e, i) => (
        <div className="card entity-card" key={e.key} style={{ borderTopColor: CAT[i % CAT.length] }}>
          <CardThumb topic={`${brand || ""} ${e.title}`} />
          <div className="entity-body">
            <h4>{e.title}</h4>
            <div className="count">{e.count} mention{e.count === 1 ? "" : "s"}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** How it makes people feel: plain tag pills (a small fixed emotional vocabulary). */
export function FeelPills({ feel }) {
  if (!feel?.length) return null;
  return (
    <div className="assoc-col">
      <div className="assoc-h">How it makes people feel</div>
      <div className="pills">
        {feel.map((a) => (
          <span className="pill feel" key={a.key}>
            {a.title}
            <b>{a.count}</b>
          </span>
        ))}
      </div>
    </div>
  );
}

function PillarQuote({ quote }) {
  if (!quote?.text) return null;
  const body = (
    <>
      &ldquo;{quote.text}&rdquo;
      {quote.source ? <small>{quote.source}</small> : null}
    </>
  );
  return quote.url ? (
    <a className="quote" href={quote.url} target="_blank" rel="noreferrer">
      {body}
    </a>
  ) : (
    <div className="quote">{body}</div>
  );
}

/** 3-card pillar row: pct + title + text + an optional real-quote citation. */
export function PillarsRow({ pillars }) {
  if (!pillars?.length) return null;
  return (
    <div className={`grid g${Math.min(pillars.length, 3) || 1}`}>
      {pillars.map((p, i) => (
        <div className="card pillar illustrated" key={p.key} style={{ borderColor: CAT[i % CAT.length] }}>
          <CardThumb topic={p.title} />
          <div className="big">{p.pct}%</div>
          <h4>{p.title}</h4>
          {p.text ? (
            <p>
              <Rich text={p.text} />
            </p>
          ) : null}
          <PillarQuote quote={p.quote} />
        </div>
      ))}
    </div>
  );
}

/**
 * Generic insight card grid: title + pct (+ count/text), used for occasions,
 * cultural spaces and motivations. `opportunity` only ever appears on
 * motivation rows, so the callout sub-box only renders when it's present.
 */
export function InsightCards({ items }) {
  if (!items?.length) return null;
  return (
    <div className={`grid g${Math.min(items.length, 5) || 1}`}>
      {items.map((it, i) => (
        <div className="card src-tint illustrated" key={it.key} style={{ borderTopColor: CAT[i % CAT.length] }}>
          <CardThumb topic={it.title} />
          <div className="pct" style={{ color: CAT[i % CAT.length] }}>
            {it.pct}%
          </div>
          <h4>{it.title}</h4>
          {it.count != null ? <div className="count">{Number(it.count).toLocaleString()} mentions</div> : null}
          {it.text ? (
            <p>
              <Rich text={it.text} />
            </p>
          ) : null}
          {it.opportunity ? (
            <div className="opportunity">
              <span className="ok">Opportunity</span>
              <Rich text={it.opportunity} />
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

/**
 * Per-competitor breakdown: theme distribution + volume trend + sentiment
 * split, one sub-tab per rival — the deck's repeated per-brand slide pattern
 * (line + bar + donut, once per competitor). Each chart carries its own
 * one-line computed summary, not just one card-level blurb.
 */
export function CompetitorBreakdown({ competitors, logos, chartKey }) {
  const [active, setActive] = useState(0);
  if (!competitors?.length) return null;
  const c = competitors[Math.min(active, competitors.length - 1)];
  return (
    <div className="comp-breakdown">
      <div className="comp-tabs">
        {competitors.map((comp, i) => (
          <button
            type="button"
            key={comp.brand}
            className={`comp-tab${i === active ? " active" : ""}`}
            onClick={() => setActive(i)}
          >
            <BrandLogo brand={comp.brand} logos={logos} size={18} rounded={5} />
            {comp.brand}
          </button>
        ))}
      </div>
      <div className="card comp-card">
        <div className="card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <BrandLogo brand={c.brand} logos={logos} size={26} rounded={7} />
          {c.brand}
          <span className="muted" style={{ marginLeft: "auto", fontWeight: 600 }}>
            {c.mentions} mentions
          </span>
        </div>
        {c.text ? (
          <p style={{ margin: "6px 0 16px" }}>
            <Rich text={c.text} />
          </p>
        ) : null}
        <div className="comp-grid">
          <div>
            <div className="comp-sub">Theme distribution</div>
            <BarList rows={c.themes?.map((t) => ({ name: t.name, pct: t.pct }))} compact />
            {c.themes_summary ? <div className="comp-summary">{c.themes_summary}</div> : null}
          </div>
          <div>
            <div className="comp-sub">Volume trend</div>
            <TrajectoryChart key={chartKey} signals={c.trend?.signals} days={c.trend?.days} />
            <Legendary items={c.trend?.signals?.map((s) => ({ name: s.name, color: s.color }))} />
            {c.trend_summary ? <div className="comp-summary">{c.trend_summary}</div> : null}
          </div>
          <div>
            <div className="comp-sub">Sentiment</div>
            <SentimentDonut rows={c.sentiment} />
            {c.sentiment_summary ? <div className="comp-summary">{c.sentiment_summary}</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Competitor culture-association cards: brand logo + icon + photo + title + pct. */
export function CultureAssociationCards({ items, logos }) {
  if (!items?.length) return null;
  return (
    <div className="grid g4">
      {items.map((c, i) => (
        <div className="card src-tint illustrated" key={c.brand} style={{ borderTopColor: CAT[i % CAT.length] }}>
          <CardThumb topic={`${c.brand} ${c.title}`} />
          <div className="card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <BrandLogo brand={c.brand} logos={logos} size={26} rounded={7} />
            {c.brand}
          </div>
          <div className="pct" style={{ color: CAT[i % CAT.length] }}>
            {c.pct}%
          </div>
          <h4>{c.title}</h4>
          {c.text ? (
            <p>
              <Rich text={c.text} />
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

/** Appendix: four columns of real citations — actual article links, not placeholders. */
export function AppendixColumns({ groups, logos }) {
  if (!groups?.length) return null;
  return (
    <div className="grid g4 appendix-grid">
      {groups.map((g) => (
        <div className="card appendix-col" key={g.title}>
          <div className="card-title">{g.title}</div>
          {g.sources?.length ? (
            <ul className="src-list">
              {g.sources.map((s) => (
                <li key={s.url || s.title}>
                  {s.url ? (
                    <a href={s.url} target="_blank" rel="noreferrer">
                      {s.title}
                    </a>
                  ) : (
                    <span>{s.title}</span>
                  )}
                  {s.source ? (
                    <span className="src-name">
                      {logos ? <BrandLogo brand={s.source.split(" · ")[0]} logos={logos} size={14} rounded={4} /> : null}
                      {s.source}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <div className="muted">No citations gathered for this group.</div>
          )}
        </div>
      ))}
    </div>
  );
}

/** Overview tab: one clickable card per other tab, labelled with its real payload label. */
export function JumpCards({ tabs, onTab, brand }) {
  if (!tabs?.length) return null;
  return (
    <div className="grid g3 jump-grid">
      {tabs.map((t, i) => (
        <div
          className="card jump-card illustrated"
          key={t.id}
          style={{ borderTopColor: CAT[i % CAT.length] }}
          onClick={() => onTab(t.id)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onTab(t.id);
            }
          }}
          role="button"
          tabIndex={0}
        >
          <CardThumb topic={`${brand || ""} ${t.label}`} />
          <div className="jump-card-body">
            <h4>{t.label}</h4>
            <span className="go">Explore →</span>
          </div>
        </div>
      ))}
    </div>
  );
}
