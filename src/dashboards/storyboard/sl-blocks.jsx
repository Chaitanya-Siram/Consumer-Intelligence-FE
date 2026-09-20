/**
 * Lens-specific blocks for Social Listening — single-brand (no competitor
 * set), organised around the dataset's top computed conversation "pillars"
 * (taxonomy theme groups) rather than a hardcoded client phrase list. Reads
 * the payload built by consumer_intelligence/storyboard/social_listening.py.
 *
 * Generic pieces (JumpCards, AppendixColumns, SecHead, Rich) are re-exported
 * from sr-blocks.jsx rather than duplicated — same precedent as pa-blocks.jsx
 * sharing Rich/SecHead with every other lens-blocks file.
 */
import BrandLogo from "./BrandLogo.jsx";
import BannerMedia, { useBannerImage } from "./bannerMedia.jsx";
import { Rich, SecHead } from "./pa-blocks.jsx";
import { AppendixColumns, JumpCards } from "./sr-blocks.jsx";

export { AppendixColumns, JumpCards, Rich, SecHead };

export const CAT = ["var(--c1)", "var(--c2)", "var(--c3)", "var(--c4)", "var(--c5)", "var(--c6)", "var(--c7)"];

/** Small photo standing in for a per-card image — same Pexels/Unsplash
 * resolution every other lens's banners and cards already use. */
function CardThumb({ topic }) {
  const url = useBannerImage({ topic });
  if (!url) return null;
  return <div className="card-thumb" style={{ backgroundImage: `url(${url})` }} aria-hidden="true" />;
}

/** Hero banner: eyebrow / headline / sub / stats + the brand badge, same
 * shape as Social Research's SrBanner. */
export function SlBanner({ banner = {}, variant = "b-purple", brand, logos }) {
  return (
    <div className={`tbanner ${variant}`}>
      <BannerMedia image={banner.image} topic={banner.eyebrow || banner.headline} />
      <div className="banner-tint" />
      <div className="banner-inner">
        {brand ? (
          <div className="sl-badge" title={brand}>
            <div className="sl-badge-ring" />
            <div className="sl-badge-logo">
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

/** Pillar cards: photo + pct + title (+ count/text) — the dataset's top
 * computed conversation pillars, one per card. */
export function PillarCards({ pillars }) {
  if (!pillars?.length) return null;
  return (
    <div className={`grid g${Math.min(pillars.length, 4) || 1}`}>
      {pillars.map((p, i) => (
        <div className="card src-tint illustrated" key={p.key} style={{ borderTopColor: CAT[i % CAT.length] }}>
          <CardThumb topic={p.title} />
          <div className="pct" style={{ color: CAT[i % CAT.length] }}>
            {p.pct}%
          </div>
          <h4>{p.title}</h4>
          {p.count != null ? <div className="count">{Number(p.count).toLocaleString()} mentions</div> : null}
          {p.text ? (
            <p>
              <Rich text={p.text} />
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

/** Pillar sub-tab selector: plain text pills (single-brand lens, no logos
 * to disambiguate) — pairs with whatever per-pillar card the screen renders
 * for the active index. */
export function PillarTabs({ pillars, active, onChange }) {
  if (!pillars?.length) return null;
  return (
    <div className="comp-tabs">
      {pillars.map((p, i) => (
        <button type="button" key={p} className={`comp-tab${i === active ? " active" : ""}`} onClick={() => onChange(i)}>
          {p}
        </button>
      ))}
    </div>
  );
}
