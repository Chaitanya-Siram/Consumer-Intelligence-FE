/**
 * Blocks of the Perception Analysis storyboard (Landscape Analysis, Tier 2).
 *
 * Brand & Competitive convention: no charting library. The donut and strips
 * are hand-drawn so they take colours from the `.sb-pa` tokens and read in
 * both themes. Brand names render through <BrandLogo> with `meta.logos`, so
 * real logos appear as soon as the backend supplies them. Class names are the
 * contract with pa.css.
 */
import BrandLogo from "./BrandLogo.jsx";
import BannerMedia from "./bannerMedia.jsx";

const TONE = { pos: "var(--pos)", neg: "var(--neg)", neu: "var(--neu)", warn: "var(--warn)" };

/* ------------------------------------------------------------- rich text */

// Payload prose may carry <mark>…</mark> highlights (the deck's underlined
// phrases) and nothing else. Split on those tags and render them as <mark>,
// escaping everything else by letting React render plain strings.
export function Rich({ text }) {
  if (!text) return null;
  const parts = String(text).split(/(<mark>.*?<\/mark>)/g);
  return (
    <>
      {parts.map((p, i) => {
        const m = p.match(/^<mark>(.*?)<\/mark>$/);
        // eslint-disable-next-line react/no-array-index-key -- prose order is the identity
        return m ? <mark key={i}>{m[1]}</mark> : <span key={i}>{p}</span>;
      })}
    </>
  );
}

/* --------------------------------------------------------------- chrome */

export function PaBanner({ banner = {}, variant = "b-purple" }) {
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

export function SecHead({ eyebrow, title, note, accent = "." }) {
  return (
    <div className="sec-head">
      <div>
        <div className="sec-eyebrow">{eyebrow}</div>
        <h2 className="sec-title disp">
          {title}
          <span className="accent">{accent}</span>
        </h2>
      </div>
      {note ? <div className="sec-note">{note}</div> : null}
    </div>
  );
}

export function BrandChips({ brands, logos }) {
  if (!brands?.length) return null;
  return (
    <div className="brands">
      {brands.map((b) => (
        <span className="blogo" key={b}>
          <BrandLogo brand={b} logos={logos} size={18} rounded={5} />
          {b}
        </span>
      ))}
    </div>
  );
}

function ShareBar({ pct, max, label = "Share of perception posts", neg = false }) {
  if (pct == null) return null;
  return (
    <div className="share">
      <span>{label}</span>
      <div className="track">
        <div className={`fill${neg ? " neg" : ""}`} style={{ width: `${(pct / Math.max(max, 1)) * 100}%` }} />
      </div>
      <span className="v">{pct}%</span>
    </div>
  );
}

/* ------------------------------------------------------- tab 1 blocks */

export function SummaryPanel({ eyebrow = "In one read", text, keywords, children }) {
  return (
    <div className="summary">
      <div className="eyebrow">{eyebrow}</div>
      <p>{text}</p>
      {keywords?.length ? (
        <div className="kws">
          {keywords.map((k) => (
            <span className="kw" key={k}>
              {k}
            </span>
          ))}
        </div>
      ) : null}
      {children}
    </div>
  );
}

const PICON = {
  benefits: <path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.3 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z" />,
  caution: (
    <>
      <path d="M12 3l10 18H2z" />
      <path d="M12 10v4M12 17.5h.01" />
    </>
  ),
  literacy: <path d="M12 2v20M17 6.5c0-1.9-2.2-3.5-5-3.5S7 4.6 7 6.5 9.2 10 12 10s5 1.6 5 3.5-2.2 3.5-5 3.5-5-1.6-5-3.5" />,
  brands: <path d="M7 11v9H3v-9zM7 11l4-8c1.5 0 2.5 1 2.5 2.5V9H20a2 2 0 0 1 2 2.2l-1.2 7A2 2 0 0 1 18.8 20H7" />,
  parents: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
      <circle cx="17.5" cy="10" r="2.5" />
      <path d="M16 15.5c3 0 5.5 1.8 5.5 4.5" />
    </>
  ),
  concerns: <path d="M4 12a8 8 0 0 1 16 0v5a2 2 0 0 1-2 2h-2v-6h4M4 12v5a2 2 0 0 0 2 2h2v-6H4" />,
  debt: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v1M12 16v1M14.5 9.5c0-1.1-1.1-2-2.5-2s-2.5.9-2.5 2 1.1 2 2.5 2 2.5.9 2.5 2-1.1 2-2.5 2-2.5-.9-2.5-2" />
    </>
  ),
  stress: <path d="M13 2L4 14h7l-1 8 9-12h-7z" />,
};

function Icon({ name }) {
  return (
    <div className="ic">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        {PICON[name] || PICON.benefits}
      </svg>
    </div>
  );
}

export function PerceptionCards({ themes, logos }) {
  if (!themes?.length) return null;
  const max = Math.max(...themes.map((t) => Number(t.pct) || 0), 1);
  return (
    <div className="grid g3">
      {themes.map((t) => (
        <div className="card pcard" key={t.title}>
          <Icon name={t.key} />
          <h4>{t.title}</h4>
          <p>
            <Rich text={t.text} />
          </p>
          <BrandChips brands={t.brands} logos={logos} />
          <ShareBar pct={t.pct} max={max} />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------- tab 2 blocks */

const R = 68;
const CIRC = 2 * Math.PI * R;

export function SentimentDonut({ split }) {
  if (!split?.length) return null;
  const total = split.reduce((a, p) => a + (Number(p.pct) || 0), 0) || 1;
  const lead = split.find((p) => p.tone === "pos") || split[0];
  let offset = 0;
  const segs = split.map((p) => {
    const len = (p.pct / total) * CIRC;
    const visible = Math.max(len - 2, 0); // 2px surface gap between segments
    const seg = (
      <circle
        key={p.name}
        className="seg"
        r={R}
        cx={85}
        cy={85}
        fill="none"
        stroke={TONE[p.tone] || TONE.neu}
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
    <>
      <div className="donut">
        <svg viewBox="0 0 170 170" role="img" aria-label={split.map((p) => `${p.name} ${p.pct}%`).join(", ")}>
          {segs}
          <text className="center" x={85} y={82} textAnchor="middle">
            {lead.pct}%
          </text>
          <text className="center-l" x={85} y={100} textAnchor="middle">
            {lead.name}
          </text>
        </svg>
        <div className="legend">
          {split.map((p) => (
            <span key={p.name}>
              <span className="n">
                <i style={{ background: TONE[p.tone] || TONE.neu }} />
                {p.name}
              </span>
              <span className="v">{p.pct}%</span>
            </span>
          ))}
        </div>
      </div>
      <div className="strip">
        {split.map((p) => (
          <div key={p.name} style={{ width: `${p.pct}%`, background: TONE[p.tone] || TONE.neu }} title={`${p.name} ${p.pct}%`} />
        ))}
      </div>
    </>
  );
}

export function DriverGroups({ groups, logos }) {
  if (!groups?.length) return null;
  return (
    <div className="card lg dgroups">
      {groups.map((g) => (
        <div className={`dgroup ${g.tone}`} key={g.label}>
          <div className="dh">
            <i />
            {g.label}
            {g.pct != null ? <span className="pct">{g.pct}% of rated posts</span> : null}
          </div>
          {(g.drivers || []).map((d) => (
            <div className="driver" key={d.title}>
              <h5>{d.title}</h5>
              <p>
                <Rich text={d.text} />
              </p>
              <BrandChips brands={d.brands} logos={logos} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function Quotes({ quotes }) {
  if (!quotes?.length) return null;
  return (
    <div className="quotes">
      {quotes.map((q) => (
        <div className={`quote ${q.tone || ""}`} key={q.text}>
          &ldquo;{q.text}&rdquo;
          {q.source ? <small>{q.source}</small> : null}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------- tab 3 blocks */

export function EmotionMix({ mix, title = "Emotion mix · rated posts" }) {
  if (!mix?.length) return null;
  return (
    <>
      <div className="divider" />
      <div className="card-title">{title}</div>
      <div className="emo-strip">
        {mix.map((m) => (
          <div key={m.name} style={{ width: `${m.pct}%`, background: TONE[m.tone] || TONE.neu }} title={`${m.name} ${m.pct}%`} />
        ))}
      </div>
      <div className="emo-legend">
        {mix.map((m) => (
          <span key={m.name}>
            <span className="n">
              <i style={{ background: TONE[m.tone] || TONE.neu }} />
              {m.name}
            </span>
            <span className="v">{m.pct}%</span>
          </span>
        ))}
      </div>
    </>
  );
}

export function AspectHead({ label, tags }) {
  if (!label) return null;
  return (
    <div className="aspect-head">
      {label}
      {tags?.length ? (
        <span className="tags">
          {tags.map((t) => (
            <span className="tag" key={t}>
              {t}
            </span>
          ))}
        </span>
      ) : null}
    </div>
  );
}

export function AspectCards({ aspects }) {
  if (!aspects?.length) return null;
  const max = Math.max(...aspects.map((a) => Number(a.pct) || 0), 1);
  return (
    <div className="grid g3">
      {aspects.map((a) => (
        <div className="card ecard" key={a.title}>
          <Icon name={a.key} />
          <h4>{a.title}</h4>
          <p>
            <Rich text={a.text} />
          </p>
          <ShareBar pct={a.pct} max={max} label="Share of rated posts" neg />
        </div>
      ))}
    </div>
  );
}
