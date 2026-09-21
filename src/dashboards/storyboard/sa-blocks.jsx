/**
 * Social Audit block library — the lens-specific pieces (banner, whitespace
 * and influencer cards) that don't already exist generically in blocks.jsx /
 * sr-blocks.jsx. Class names here are the contract with sa.css.
 */
import BrandLogo from "./BrandLogo.jsx";
import BannerMedia from "./bannerMedia.jsx";
import { Rich, SecHead, AppendixColumns, JumpCards } from "./sr-blocks.jsx";

export { Rich, SecHead, AppendixColumns, JumpCards };

/**
 * Hero banner — same shape as SrBanner/SlBanner, renamed classes so this
 * lens's badge/ring don't collide with the other two lenses' CSS.
 */
export function SaBanner({ banner = {}, variant = "b-navy", brand, logos }) {
  return (
    <div className={`tbanner ${variant}`}>
      <BannerMedia image={banner.image} topic={banner.eyebrow || banner.headline} />
      <div className="banner-tint" />
      <div className="banner-inner">
        {brand ? (
          <div className="sa-badge" title={brand}>
            <div className="sa-badge-ring" />
            <div className="sa-badge-logo">
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

/** Two-column Positive/Negative sentiment-driver paragraphs (the deck's own
 * bullet-block style is closer to prose than a per-item driver list, so this
 * is a simpler two-card layout rather than blocks.jsx's itemized VerdictColumns). */
export function SentimentColumns({ positive, negative }) {
  if (!positive && !negative) return null;
  return (
    <div className="grid2 reveal">
      <div className="card" style={{ borderLeft: "4px solid var(--pos)" }}>
        <div className="card-body">
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--pos)", marginBottom: 10 }}>
            Positive
          </div>
          <p>{positive ? <Rich text={positive} /> : <span className="muted">Nothing in this group.</span>}</p>
        </div>
      </div>
      <div className="card" style={{ borderLeft: "4px solid var(--neg)" }}>
        <div className="card-body">
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--neg)", marginBottom: 10 }}>
            Negative
          </div>
          <p>{negative ? <Rich text={negative} /> : <span className="muted">Nothing in this group.</span>}</p>
        </div>
      </div>
    </div>
  );
}

/** Top Influencer Voices: real author handle, platform, reach and their
 * single highest-engagement quote — no invented bios, only computed data. */
export function InfluencerCards({ influencers, logos }) {
  if (!influencers?.length) return null;
  return (
    <div className="grid g2">
      {influencers.map((inf) => (
        <div className="card influencer-card" key={inf.author}>
          <div className="influencer-head">
            <div className="influencer-id">
              <BrandLogo brand={inf.author} logos={logos} photoUrl={inf.photo_url} size={36} rounded={999} />
              <div>
                <div className="influencer-name">{inf.author}</div>
                <div className="influencer-meta">
                  {inf.platform} · {inf.mentions} mention{inf.mentions === 1 ? "" : "s"}
                </div>
              </div>
            </div>
            <div className="influencer-reach">{Number(inf.engagement).toLocaleString()} engagement</div>
          </div>
          {inf.quote?.text ? (
            <a className="quote" href={inf.quote.url || undefined} target="_blank" rel="noreferrer">
              “{inf.quote.text}”
              <small>
                {logos ? <BrandLogo brand={inf.quote.source?.split(" · ")[0]} logos={logos} size={13} rounded={4} /> : null}
                {inf.quote.source}
              </small>
            </a>
          ) : null}
        </div>
      ))}
    </div>
  );
}

/** Whitespace opportunity cards: one per pillar, anchored to that pillar's
 * real lowest-volume theme rather than an invented strategic name. */
export function WhitespaceCards({ whitespaces }) {
  if (!whitespaces?.length) return null;
  return (
    <div className="grid g2">
      {whitespaces.map((w) => (
        <div className="card whitespace-card" key={w.pillar}>
          <span className="whitespace-tag">{w.pillar}</span>
          <h4>{w.title || w.theme}</h4>
          {w.text ? (
            <p>
              <Rich text={w.text} />
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
