/**
 * PR Research block library — the lens-specific pieces (banner, period
 * selector) that don't already exist generically in blocks.jsx / sr-blocks.jsx.
 * Class names here are the contract with pr.css.
 */
import BrandLogo, { avatarSrc } from "./BrandLogo.jsx";
import BannerMedia, { bannerTopic } from "./bannerMedia.jsx";
import { AppendixColumns, JumpCards, Rich, SecHead, ThemeShareCards } from "./sr-blocks.jsx";

export { AppendixColumns, JumpCards, Rich, SecHead, ThemeShareCards };

/**
 * Author/publication ranking table — like the shared MatrixTable, but any
 * column marked `logo: true` gets a BrandLogo next to its own text. A
 * publication column uses its own name for a real outlet logo; an author
 * column uses the author's own name, which BrandLogo has no real logo for
 * and so renders as an initials avatar — each column's image is its own,
 * never borrowed from the other column.
 */
export function RankTable({ rows, columns, logos }) {
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
          <tr key={row.name || i}>
            {columns.map((c) => (
              <td key={c.key}>
                {c.logo ? (
                  <span className="rank-name">
                    <BrandLogo brand={row[c.logoKey || c.key]} logos={logos} photoUrl={c.key === "name" ? avatarSrc(row) : null} size={20} rounded={c.round ?? 6} />
                    {row[c.key]}
                  </span>
                ) : (
                  row[c.key]
                )}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Hero banner — same shape as SrBanner/SlBanner/SaBanner, renamed classes. */
export function PrBanner({ banner = {}, variant = "b-navy", brand, logos }) {
  return (
    <div className={`tbanner ${variant}`}>
      <BannerMedia image={banner.image} topic={bannerTopic(banner)} />
      <div className="banner-tint" />
      <div className="banner-inner">
        {brand ? (
          <div className="pr-badge" title={brand}>
            <div className="pr-badge-ring" />
            <div className="pr-badge-logo">
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

/** Two-pill early/late period selector, labelled with each period's real
 * computed date-range rather than hardcoded year names. */
export function PeriodTabs({ early, late, active, onChange }) {
  if (!early && !late) return null;
  const options = [
    early ? { id: "early", label: `Earlier · ${early.window}` } : null,
    late ? { id: "late", label: `Later · ${late.window}` } : null,
  ].filter(Boolean);
  return (
    <div className="comp-tabs">
      {options.map((o) => (
        <button key={o.id} type="button" className={`comp-tab${active === o.id ? " active" : ""}`} onClick={() => onChange(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
