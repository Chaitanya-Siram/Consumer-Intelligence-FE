/**
 * Blocks of the Brand Perception storyboard (Brand Intelligence, Tier 2).
 *
 * No charting library: bars are CSS. Every brand name goes through <BrandLogo>
 * with a merged logo map (see logos.js), so real marks appear as soon as any
 * lens in the session has resolved them. Class names are the contract with
 * bp.css. `Rich`, `SecHead`, `SummaryPanel` are shared with pa-blocks.
 */
import BrandLogo from "./BrandLogo.jsx";
import { Rich } from "./pa-blocks.jsx";

export { Rich, SecHead, SummaryPanel } from "./pa-blocks.jsx";

export function BpBanner({ banner = {}, variant = "b-purple" }) {
  return (
    <div className={`tbanner ${variant}`}>
      {banner.image ? <img className="banner-video" src={banner.image} alt="" /> : null}
      <div className="banner-tint" />
      <div className="banner-inner">
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

export function Bullets({ points }) {
  if (!points?.length) return null;
  return (
    <ul className="bul">
      {points.map((p, i) => (
        // eslint-disable-next-line react/no-array-index-key -- prose order is the identity
        <li key={i}>
          <Rich text={p} />
        </li>
      ))}
    </ul>
  );
}

/** Horizontal bar list. `logos` optional: when given, each label gets a BrandLogo. */
export function BarList({ rows, logos, nameKey = "name" }) {
  if (!rows?.length) return null;
  const max = Math.max(...rows.map((r) => Number(r.pct) || 0), 1);
  return (
    <div className="barlist">
      {rows.map((r) => (
        <div className="row" key={r[nameKey]} title={`${r[nameKey]}: ${r.pct}%`}>
          <div className={`lbl${r.is_brand ? " hl" : ""}`}>
            {logos ? <BrandLogo brand={r[nameKey]} logos={logos} size={22} rounded={6} /> : null}
            {r[nameKey]}
          </div>
          <div className="track">
            <div className={`fill${r.is_brand ? " hl" : ""}`} style={{ width: `${(r.pct / max) * 100}%` }} />
          </div>
          <div className="val">{r.pct}%</div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------- tab 1 */

export function ProductCards({ products, logos }) {
  if (!products?.length) return null;
  return (
    <div className="grid g3">
      {products.map((p) => (
        <div className="card pcard" key={p.name}>
          <div className="head">
            <BrandLogo brand={p.brand} logos={logos} size={26} rounded={7} />
            <div>
              <div className="nm">{p.name}</div>
              <div className="iss">{p.brand}</div>
            </div>
          </div>
          {p.tags?.length || p.award ? (
            <div className="tags">
              {(p.tags || []).map((t) => (
                <span className="tag" key={t}>
                  {t}
                </span>
              ))}
              {p.award ? <span className="tag award">★ {p.award}</span> : null}
            </div>
          ) : null}
          <p>
            <Rich text={p.text} />
          </p>
          {p.quote?.text ? (
            <div className="quote">
              &ldquo;{p.quote.text}&rdquo;
              {p.quote.source ? <small>{p.quote.source}</small> : null}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------- tab 2 */

export function BrandCards({ brands, logos }) {
  if (!brands?.length) return null;
  return (
    <div className="grid g2">
      {brands.map((b) => (
        <div className={`card bcard${b.is_brand ? " brand" : ""}`} key={b.name}>
          <div className="top">
            <BrandLogo brand={b.name} logos={logos} size={34} rounded={9} />
            <div className="nm">{b.name}</div>
            {b.pct != null ? (
              <div className="pct">
                {b.pct}%<small>of mentions</small>
              </div>
            ) : null}
          </div>
          <Bullets points={b.points} />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------- tab 3 */

export function Reasons({ reasons }) {
  if (!reasons?.length) return null;
  return (
    <div className="reasons">
      {reasons.map((r, i) => (
        <div className="reason" key={r.title}>
          <div className="n">{i + 1}</div>
          <div>
            <h5>
              {r.title}
              {r.pct != null ? <span className="pct">{r.pct}%</span> : null}
            </h5>
            <p>
              <Rich text={r.text} />
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function Posts({ posts }) {
  if (!posts?.length) return null;
  return (
    <div className="posts">
      {posts.map((p) => (
        <div className="post" key={p.title || p.text}>
          {p.source ? (
            <div className="who">
              <i />
              {p.source}
            </div>
          ) : null}
          {p.title ? <div className="t">{p.title}</div> : null}
          <p>{p.text}</p>
          {p.reply ? <div className="rep">{p.reply}</div> : null}
        </div>
      ))}
    </div>
  );
}
