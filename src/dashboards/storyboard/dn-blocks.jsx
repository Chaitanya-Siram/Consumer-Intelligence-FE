/**
 * Blocks of the Dominant Narratives storyboard (Landscape Analysis, Tier 2).
 *
 * No charting library: the platform donut is hand-drawn SVG and bars are CSS,
 * so colours come from the `.sb-dn` tokens. Brand names go through
 * <BrandLogo> with a merged logo map (see logos.js) so real marks appear as
 * soon as any lens in the session has resolved them. Class names are the
 * contract with dn.css. `Rich`, `SecHead` and `SummaryPanel` are shared with
 * the Perception Analysis blocks; the class names they emit exist in dn.css.
 */
import BrandLogo from "./BrandLogo.jsx";
import BannerMedia from "./bannerMedia.jsx";
import { Rich } from "./pa-blocks.jsx";

export { Rich, SecHead, SummaryPanel } from "./pa-blocks.jsx";

const CAT = ["var(--c1)", "var(--c2)", "var(--c3)", "var(--c4)", "var(--c5)", "var(--c6)"];

export function DnBanner({ banner = {}, variant = "b-purple" }) {
  return (
    <div className={`tbanner ${variant}`}>
      <BannerMedia image={banner.image} topic={banner.eyebrow || banner.headline} />
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

/** Bullet list. Items are strings or { text, ext } where ext marks secondary research. */
export function Bullets({ points }) {
  if (!points?.length) return null;
  return (
    <ul className="bul">
      {points.map((p, i) => {
        const o = typeof p === "string" ? { text: p } : p;
        return (
          // eslint-disable-next-line react/no-array-index-key -- prose order is the identity
          <li key={i}>
            <Rich text={o.text} />
            {o.ext ? (
              <span className="ext" title="Secondary research, not from tagged posts">
                external
              </span>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

/* ------------------------------------------------------------- tab 1 */

export function UsageGroups({ groups }) {
  if (!groups?.length) return null;
  return (
    <div className="card lg ugroups">
      {groups.map((g) => (
        <div className="ugroup" key={g.title}>
          <h4>{g.title}</h4>
          <Bullets points={g.points} />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------- tab 2 */

export function QuestionColumns({ columns }) {
  if (!columns?.length) return null;
  return (
    <div className="grid g5">
      {columns.map((c, i) => (
        <div className={`card qcol${c.reco ? " reco" : ""}`} key={c.q}>
          <div>
            <span className="n">{c.reco ? "→" : i + 1}</span>
            <div className="q">{c.q}</div>
          </div>
          <Bullets points={c.points} />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------- tab 3 */

const R = 68;
const CIRC = 2 * Math.PI * R;

export function PlatformDonut({ platforms }) {
  if (!platforms?.length) return null;
  const total = platforms.reduce((a, p) => a + (Number(p.pct) || 0), 0) || 1;
  const lead = platforms[0];
  let offset = 0;
  const segs = platforms.map((p, i) => {
    const len = (p.pct / total) * CIRC;
    const visible = Math.max(len - 2, 0);
    const seg = (
      <circle
        key={p.name}
        className="seg"
        r={R}
        cx={85}
        cy={85}
        fill="none"
        stroke={CAT[i % CAT.length]}
        strokeWidth={20}
        strokeDasharray={`${visible} ${CIRC - visible}`}
        strokeDashoffset={-offset}
        transform="rotate(-90 85 85)"
      >
        <title>{`${p.name}: ${p.pct}%`}</title>
      </circle>
    );
    offset += len;
    return seg;
  });
  return (
    <div className="donut">
      <svg viewBox="0 0 170 170" role="img" aria-label={platforms.map((p) => `${p.name} ${p.pct}%`).join(", ")}>
        {segs}
        <text className="center" x={85} y={82} textAnchor="middle">
          {lead.pct}%
        </text>
        <text className="center-l" x={85} y={100} textAnchor="middle">
          {lead.name}
        </text>
      </svg>
      <div className="legend">
        {platforms.map((p, i) => (
          <span key={p.name}>
            <span className="n">
              <i style={{ background: CAT[i % CAT.length] }} />
              {p.name}
            </span>
            <span className="v">{p.pct}%</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function IssuerBars({ issuers, logos }) {
  if (!issuers?.length) return null;
  const max = Math.max(...issuers.map((r) => Number(r.pct) || 0), 1);
  return (
    <div className="barlist">
      {issuers.map((r) => {
        const other = /^others?$/i.test(r.name);
        return (
          <div className="row" key={r.name} title={`${r.name}: ${r.pct}%`}>
            <div className={`lbl${r.is_brand ? " hl" : ""}`}>
              {other ? null : <BrandLogo brand={r.name} logos={logos} size={18} rounded={5} />}
              {r.name}
            </div>
            <div className="track">
              <div className={`fill${r.is_brand ? " hl" : ""}`} style={{ width: `${(r.pct / max) * 100}%` }} />
            </div>
            <div className="val">{r.pct}%</div>
          </div>
        );
      })}
    </div>
  );
}

const ICON = {
  volume: (
    <>
      <path d="M21 12a8 8 0 0 1-8 8H5l-2 2V12a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8z" />
      <path d="M8 12h.01M12 12h.01M16 12h.01" />
    </>
  ),
  award: <path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.3 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z" />,
  rewards: (
    <>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18M7 15h3" />
    </>
  ),
  fee: (
    <>
      <path d="M9 12l2 2 4-4" />
      <circle cx="12" cy="12" r="9" />
    </>
  ),
  benefit: <path d="M12 3l1.8 5.2H19l-4.2 3.1 1.6 5.2L12 13.4l-4.4 3.1 1.6-5.2L5 8.2h5.2z" />,
};

function Icon({ name, fallback = "award" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {ICON[name] || ICON[fallback]}
    </svg>
  );
}

export function Callouts({ callouts }) {
  if (!callouts?.length) return null;
  return (
    <div className="grid g2">
      {callouts.map((c) => (
        <div className="card callout" key={c.title}>
          <div className="ic">
            <Icon name={c.key} />
          </div>
          <div>
            <div className="t">{c.title}</div>
            <p>{c.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function Goods({ title, lead, goods }) {
  if (!goods?.length) return null;
  return (
    <div className="card lg">
      {title ? <div className="card-title">{title}</div> : null}
      {lead ? <p className="lead" style={{ marginBottom: 18 }}>{lead}</p> : null}
      <div className="goods">
        {goods.map((g) => (
          <div className="good" key={g.title}>
            <div className="ic">
              <Icon name={g.key} fallback="benefit" />
            </div>
            <div>
              <h5>{g.title}</h5>
              <p>{g.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- tab 4 */

export function OutlookCards({ themes }) {
  if (!themes?.length) return null;
  const max = Math.max(...themes.map((t) => Number(t.pct) || 0), 1);
  return (
    <div className="grid g3">
      {themes.map((t, i) => {
        const color = CAT[i % CAT.length];
        return (
          <div className="card ocard" key={t.title} style={{ borderColor: color }}>
            <div className="k">
              <i style={{ background: color }} />
              Theme {String(i + 1).padStart(2, "0")}
            </div>
            <h4>{t.title}</h4>
            <p>
              <Rich text={t.text} />
            </p>
            {t.pct != null ? (
              <div className="share">
                <span>Share</span>
                <div className="track">
                  <div className="fill" style={{ width: `${(t.pct / max) * 100}%`, background: color }} />
                </div>
                <span className="v">{t.pct}%</span>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
