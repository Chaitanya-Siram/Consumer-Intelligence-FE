/**
 * Blocks shared by the three Whitespace & Gap Analysis storyboards
 * (Audience Expectation, Brand Messaging, Brand Performance).
 *
 * No charting library: bars are CSS, rings / donut are hand-drawn SVG so
 * colours come from the `.sb-wg` tokens. Brand names go through <BrandLogo>
 * with a merged logo map (logos.js). Class names are the contract with wg.css.
 * `Rich`, `SecHead`, `SummaryPanel` are shared with pa-blocks.
 */
import { FlagText } from "../../utils/countryFlags.jsx";
import BrandLogo from "./BrandLogo.jsx";
import BannerMedia from "./bannerMedia.jsx";
import { Rich } from "./pa-blocks.jsx";

export { Rich, SecHead, SummaryPanel } from "./pa-blocks.jsx";

export const CAT = ["var(--c1)", "var(--c2)", "var(--c3)", "var(--c4)", "var(--c5)", "var(--c6)", "var(--c7)"];
const TONE = { pos: "var(--pos)", neg: "var(--neg)", neu: "var(--neu)", warn: "var(--warn)" };

export function WgBanner({ banner = {}, variant = "b-purple" }) {
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
        <div className="b-title disp"><FlagText text={banner.headline} size={24} /></div>
        {banner.sub ? <div className="b-sub"><FlagText text={banner.sub} /></div> : null}
        {banner.stats?.length ? (
          <div className="b-stats">
            {banner.stats.map((s) => (
              <div className="b-stat" key={s.label}>
                <div className="v"><FlagText text={s.value} size={26} /></div>
                <div className="l">{s.label}</div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** Bullets: strings or { text, ext }. `tone` colours the dots. */
export function Bullets({ points, tone }) {
  if (!points?.length) return null;
  return (
    <ul className={`bul ${tone || ""}`}>
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

export function BarList({ rows, logos, color = "var(--c1)", compact = false }) {
  if (!rows?.length) return null;
  const max = Math.max(...rows.map((r) => Number(r.pct) || 0), 1);
  return (
    <div className={`barlist${compact ? " compact" : ""}`}>
      {rows.map((r) => (
        <div className="row" key={r.name} title={`${r.name}: ${r.pct}%`}>
          <div className={`lbl${r.is_brand ? " hl" : ""}`}>
            {logos && r.sources?.length ? (
              // A category ("News & trade press") has no logo of its own: show the
              // icons of the outlets it is made of, overlapped like an avatar stack.
              <span className="lbl-icons" style={{ display: "inline-flex", flexShrink: 0 }}>
                {r.sources.map((source, i) => (
                  <span key={source} title={source} style={{ display: "inline-flex", marginLeft: i ? -7 : 0, borderRadius: 999, boxShadow: "0 0 0 2px var(--surface, #fff)" }}>
                    <BrandLogo brand={source} logos={logos} size={20} rounded={999} />
                  </span>
                ))}
              </span>
            ) : logos && !/^others?$/i.test(r.name) ? (
              <BrandLogo brand={r.name} logos={logos} size={20} rounded={6} />
            ) : null}
            {r.name}
          </div>
          <div className="track">
            <div className={`fill${r.is_brand ? " hl" : ""}`} style={{ width: `${(r.pct / max) * 100}%`, background: r.is_brand ? undefined : color }} />
          </div>
          <div className="val">{r.pct}%</div>
        </div>
      ))}
    </div>
  );
}

export function StatStrip({ stats }) {
  if (!stats?.length) return null;
  return (
    <div className="stats4">
      {stats.map((s) => (
        <div className="stat" key={s.label}>
          <div className="v">{s.value}</div>
          <div className="l">
            {s.label}
            {s.ext ? <span className="ext">external</span> : null}
          </div>
        </div>
      ))}
    </div>
  );
}

export function Quote({ quote }) {
  if (!quote?.text) return null;
  return (
    <div className="quote">
      &ldquo;{quote.text}&rdquo;
      {quote.source ? <small>{quote.source}</small> : null}
    </div>
  );
}

/* ------------------------------------------- Audience Expectation blocks */

function Ring({ pct, color }) {
  const r = 26, c = 2 * Math.PI * r, vis = (Math.max(0, Math.min(100, pct)) / 100) * c;
  return (
    <svg className="ring" viewBox="0 0 64 64" aria-hidden="true">
      <circle r={r} cx={32} cy={32} fill="none" stroke="var(--bg2)" strokeWidth={7} />
      <circle r={r} cx={32} cy={32} fill="none" stroke={color} strokeWidth={7} strokeDasharray={`${vis} ${c - vis}`} transform="rotate(-90 32 32)" strokeLinecap="round" />
      <text x={32} y={37} textAnchor="middle">{pct}%</text>
    </svg>
  );
}

/** p24: brand hub with attribute rings either side. */
export function AttributeHub({ brand, logos, attributes }) {
  if (!attributes?.length) return null;
  const left = attributes.filter((_, i) => i % 2 === 0);
  const right = attributes.filter((_, i) => i % 2 === 1);
  const Col = ({ items, offset }) => (
    <div className="attrs">
      {items.map((a, i) => (
        <div className="card attr" key={a.name}>
          <Ring pct={a.pct} color={CAT[(i * 2 + offset) % CAT.length]} />
          <div>
            <h5>
              {a.name}
              <span className="pct">{a.pct}%</span>
            </h5>
            <Bullets points={a.points} />
          </div>
        </div>
      ))}
    </div>
  );
  return (
    <div className="hub">
      <Col items={left} offset={0} />
      <div className="card hub-center">
        <BrandLogo brand={brand} logos={logos} size={64} rounded={16} />
        <div className="nm">{brand}</div>
        <div className="sub">Attribute mapping</div>
      </div>
      <Col items={right} offset={1} />
    </div>
  );
}

/** p26: coloured-header columns. */
export function NeedColumns({ needs }) {
  if (!needs?.length) return null;
  return (
    <div className={`grid g${Math.min(needs.length, 5)}`}>
      {needs.map((n, i) => (
        <div className="card ncol" key={n.title}>
          <div className="nh" style={{ background: CAT[i % CAT.length] }}>{n.title}</div>
          <div className="nb">
            {n.pct != null ? <div className="pct">{n.pct}%</div> : null}
            <div>
              <Rich text={n.text} />
              {n.ext ? <span className="ext">external</span> : null}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** p18: four pillars with share, text and a quote. */
export function Pillars({ pillars }) {
  if (!pillars?.length) return null;
  return (
    <div className={`grid g${Math.min(pillars.length, 4)}`}>
      {pillars.map((p, i) => (
        <div className="card pillar" key={p.title} style={{ borderColor: CAT[i % CAT.length] }}>
          <div className="big">{p.pct}%</div>
          <h4>{p.title}</h4>
          <p>
            <Rich text={p.text} />
          </p>
          <Quote quote={p.quote} />
        </div>
      ))}
    </div>
  );
}

/* --------------------------------------------- Brand Performance blocks */

const R = 68;
const CIRC = 2 * Math.PI * R;

export function ShareDonut({ rows, logos }) {
  if (!rows?.length) return null;
  const total = rows.reduce((a, r) => a + (Number(r.pct) || 0), 0) || 1;
  const lead = rows.find((r) => r.is_brand) || rows[0];
  let off = 0;
  return (
    <div className="donut">
      <svg viewBox="0 0 170 170" role="img" aria-label={rows.map((r) => `${r.name} ${r.pct}%`).join(", ")}>
        {rows.map((r, i) => {
          const len = (r.pct / total) * CIRC, vis = Math.max(len - 2, 0);
          const seg = (
            <circle key={r.name} className="seg" r={R} cx={85} cy={85} fill="none" stroke={CAT[i % CAT.length]} strokeWidth={20}
              strokeDasharray={`${vis} ${CIRC - vis}`} strokeDashoffset={-off} transform="rotate(-90 85 85)">
              <title>{`${r.name}: ${r.pct}%`}</title>
            </circle>
          );
          off += len;
          return seg;
        })}
        <text className="center" x={85} y={82} textAnchor="middle">{lead.pct}%</text>
        <text className="center-l" x={85} y={100} textAnchor="middle">{String(lead.name).slice(0, 14)}</text>
      </svg>
      <div className="legend">
        {rows.map((r, i) => (
          <span key={r.name}>
            <span className="n">
              <i style={{ background: CAT[i % CAT.length] }} />
              <BrandLogo brand={r.name} logos={logos} size={18} rounded={5} />
              {r.name}
            </span>
            <span className="v">{r.pct}%</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/** Per-brand stacked pos / neu / neg bars. */
export function SentimentStack({ rows, logos }) {
  if (!rows?.length) return null;
  return (
    <>
      <div className="stacked">
        {rows.map((r) => (
          <div className="row" key={r.name}>
            <div className="lbl">
              <BrandLogo brand={r.name} logos={logos} size={20} rounded={6} />
              {r.name}
            </div>
            <div className="bar">
              <div style={{ width: `${r.pos}%`, background: TONE.pos }} title={`Positive ${r.pos}%`}>{r.pos >= 8 ? `${r.pos}%` : ""}</div>
              <div className="neu" style={{ width: `${r.neu}%`, background: "var(--bg2)" }} title={`Neutral ${r.neu}%`}>{r.neu >= 8 ? `${r.neu}%` : ""}</div>
              <div style={{ width: `${r.neg}%`, background: TONE.neg }} title={`Negative ${r.neg}%`}>{r.neg >= 8 ? `${r.neg}%` : ""}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="slegend">
        <span><i style={{ background: TONE.pos }} />Positive</span>
        <span><i style={{ background: "var(--bg2)", border: "1px solid var(--line)" }} />Neutral</span>
        <span><i style={{ background: TONE.neg }} />Negative</span>
      </div>
    </>
  );
}

/** p21: one column per brand. */
export function BrandColumns({ brands, logos }) {
  if (!brands?.length) return null;
  return (
    <div className={`grid g${Math.min(brands.length, 3)}`}>
      {brands.map((b) => (
        <div className="card bcol" key={b.name}>
          <div className="bh">
            <BrandLogo brand={b.name} logos={logos} size={30} rounded={8} />
            {b.name}
          </div>
          <div>
            <div className="card-title" style={{ marginBottom: 10 }}>Themes</div>
            <BarList rows={b.themes} compact color={b.is_brand ? "var(--brand-2)" : "var(--c1)"} />
          </div>
          <div>
            <div className="lab pos">What is working</div>
            <Bullets points={b.working} tone="pos" />
          </div>
          <div>
            <div className="lab neg">What is not working</div>
            <Bullets points={b.not_working} tone="neg" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** p19 left: grouped bars, two series. */
export function GroupedBars({ rows, series }) {
  if (!rows?.length) return null;
  const max = Math.max(...rows.flatMap((r) => r.values), 1);
  return (
    <div className="grouped">
      {rows.map((r) => (
        <div className="row" key={r.name}>
          <div className="lbl">{r.name}</div>
          <div className="pair">
            {r.values.map((v, i) => (
              <div key={i} data-v={`${v}%`} style={{ width: `${(v / max) * 88}%`, background: CAT[i] }} />
            ))}
          </div>
        </div>
      ))}
      <div className="slegend">
        {series.map((s, i) => (
          <span key={s}><i style={{ background: CAT[i] }} />{s}</span>
        ))}
      </div>
    </div>
  );
}

/** p19 right: stacked columns per group. */
export function StackedColumns({ groups, series }) {
  if (!groups?.length) return null;
  return (
    <>
      <div className="cols" style={{ gridTemplateColumns: `repeat(${groups.length},1fr)` }}>
        {groups.map((g) => (
          <div className="col" key={g.name}>
            {g.values.map((v, i) => (
              <div key={i} style={{ height: `${v}%`, background: CAT[i % CAT.length] }} title={`${series[i]} ${v}%`}>{v >= 10 ? `${v}%` : ""}</div>
            ))}
          </div>
        ))}
      </div>
      <div className="cols-x" style={{ gridTemplateColumns: `repeat(${groups.length},1fr)` }}>
        {groups.map((g) => <div key={g.name}>{g.name}</div>)}
      </div>
      <div className="slegend">
        {series.map((s, i) => (
          <span key={s}><i style={{ background: CAT[i % CAT.length] }} />{s}</span>
        ))}
      </div>
    </>
  );
}

/* ----------------------------------------------- Brand Messaging blocks */

export function Initiatives({ initiatives }) {
  if (!initiatives?.length) return null;
  return (
    <div className="inits">
      {initiatives.map((it, i) => (
        <div className="init" key={it.title}>
          <div className="pct" style={{ color: CAT[i % CAT.length] }}>{it.pct}%</div>
          <div className="body" style={{ borderColor: CAT[i % CAT.length] }}>
            <h5>{it.title}</h5>
            <Bullets points={it.points} />
          </div>
        </div>
      ))}
    </div>
  );
}
