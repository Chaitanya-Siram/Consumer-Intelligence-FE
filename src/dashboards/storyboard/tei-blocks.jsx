/**
 * Blocks of the Track Emerging Issues storyboard (Issues Intelligence, Tier 2).
 *
 * Follows the Brand & Competitive convention: no charting library. Bars are
 * CSS, the trendline and donuts are hand-drawn SVG so they take their colours
 * from the `.sb-tei` tokens and read correctly in both themes. Class names are
 * the contract with tei.css.
 */
import { useRef, useState } from "react";
import BannerMedia from "./bannerMedia.jsx";

const CAT = [
  "var(--c1)", "var(--c2)", "var(--c3)", "var(--c4)",
  "var(--c5)", "var(--c6)", "var(--c7)", "var(--c8)",
];
const TONE = { pos: "var(--pos)", neg: "var(--neg)", neu: "var(--c6)" };

export function TeiBanner({ banner = {}, variant = "b-purple" }) {
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

export function SecHead({ eyebrow, title, note }) {
  return (
    <div className="sec-head">
      <div>
        <div className="sec-eyebrow">{eyebrow}</div>
        <h2 className="sec-title disp">
          {title}
          <span className="accent">.</span>
        </h2>
      </div>
      {note ? <div className="sec-note">{note}</div> : null}
    </div>
  );
}

export function Divider() {
  return <div className="divider" />;
}

export function Bullets({ points, className = "" }) {
  if (!points?.length) return null;
  return (
    <ul className={`bul ${className}`}>
      {points.map((p) => (
        <li key={p}>{p}</li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------ journey rail */

export function JourneyRail({ stages }) {
  if (!stages?.length) return null;
  return (
    <div className="card lg journey">
      <div className="rail" />
      <div className="stages">
        {stages.map((s) => (
          <div className="stage" key={s.label}>
            <div className="stage-head">
              <div className="stage-node" />
              <div className={`stage-pill${s.gate ? " gate" : ""}`}>{s.label}</div>
            </div>
            {s.gate ? (
              <>
                <div className="gate-row">
                  {(s.outcomes || []).map((o) => (
                    <span className={`chip ${o.tone || ""}`} key={o.label}>
                      {o.label}
                    </span>
                  ))}
                </div>
                {s.note ? (
                  <div className="step" style={{ marginTop: 12 }}>
                    <small>{s.note}</small>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="stage-steps">
                {(s.steps || []).map((st) => (
                  <div className="step" key={st.title}>
                    {st.title}
                    {st.detail ? <small>{st.detail}</small> : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- trendline */

const W = 900;
const H = 300;
const M = { l: 56, r: 24, t: 24, b: 44 };

// Smallest of 1/2/5 × 10^n that is >= `raw`; keeps tick labels round.
export function niceStep(raw) {
  if (!Number.isFinite(raw) || raw <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const unit = raw / pow;
  const m = unit <= 1 ? 1 : unit <= 2 ? 2 : unit <= 5 ? 5 : 10;
  return m * pow;
}

export function TrendLine({ trend }) {
  const wrapRef = useRef(null);
  const [tip, setTip] = useState(null);
  const points = trend?.points || [];
  if (points.length < 2) {
    return <div className="sb-chart-empty">Not enough points to draw a trendline.</div>;
  }

  const xs = points.map((_, i) => M.l + (i / (points.length - 1)) * (W - M.l - M.r));
  // Axis scales to the data: a "nice" step (1, 2, 5 × 10^n) giving 4–6 ticks,
  // so six weekly counts of 0–12 read as clearly as a sample in the thousands.
  const dataMax = Math.max(...points.map((p) => Number(p.y) || 0), 1);
  const step = niceStep(dataMax / 5);
  const maxY = Math.max(step, Math.ceil(dataMax / step) * step);
  const y = (v) => M.t + (1 - v / maxY) * (H - M.t - M.b);
  const ticks = [];
  for (let v = 0; v <= maxY + 1e-9; v += step) ticks.push(Math.round(v * 1000) / 1000);
  const path = points.map((p, i) => `${i ? "L" : "M"}${xs[i]},${y(p.y)}`).join(" ");
  const area = `${path} L${xs[xs.length - 1]},${y(0)} L${xs[0]},${y(0)} Z`;
  const unitWord = trend.unit_short || "mentions";

  const onMove = (e) => {
    const hit = e.target.closest("[data-i]");
    if (!hit) return setTip(null);
    const i = Number(hit.dataset.i);
    const wrap = wrapRef.current;
    const svg = wrap.querySelector("svg").getBoundingClientRect();
    const r = wrap.getBoundingClientRect();
    setTip({
      i,
      left: svg.left - r.left + xs[i] * (svg.width / W),
      top: svg.top - r.top + y(points[i].y) * (svg.height / H),
    });
  };

  return (
    <>
      <div className="chart-wrap" ref={wrapRef} onMouseMove={onMove} onMouseLeave={() => setTip(null)}>
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={trend.title}>
          <g className="gridlines">
            {ticks.map((v) => (
              <line key={v} x1={M.l} x2={W - M.r} y1={y(v)} y2={y(v)} />
            ))}
          </g>
          <g className="axis">
            {ticks.map((v) => (
              <text key={v} x={M.l - 10} y={y(v) + 4} textAnchor="end">
                {v.toLocaleString()}
              </text>
            ))}
            {points.map((p, i) => (
              <text key={p.x} x={xs[i]} y={H - 14} textAnchor="middle">
                {p.x}
              </text>
            ))}
            {trend.unit ? (
              <text x={M.l} y={14} textAnchor="start">
                {trend.unit}
              </text>
            ) : null}
          </g>
          <path className="area" d={area} />
          <path className="series" d={path} />
          <g className="ann">
            {(trend.annotations || []).map((a) =>
              points[a.at] ? (
                <g key={a.at}>
                  <line x1={xs[a.at]} x2={xs[a.at]} y1={y(points[a.at].y)} y2={M.t} />
                  <circle r={6} cx={xs[a.at]} cy={y(points[a.at].y)} />
                </g>
              ) : null,
            )}
          </g>
          {points.map((p, i) => (
            <circle key={p.x} className="pt" r={4.5} cx={xs[i]} cy={y(p.y)} data-i={i} />
          ))}
          {points.map((p, i) => (
            <rect
              key={p.x}
              className="hit"
              x={xs[i] - 40}
              y={M.t}
              width={80}
              height={H - M.t - M.b}
              data-i={i}
            />
          ))}
        </svg>
        <div className={`tip${tip ? " on" : ""}`} style={tip ? { left: tip.left, top: tip.top } : undefined}>
          {tip ? (
            <>
              {points[tip.i].x} · <span className="mono">{points[tip.i].y.toLocaleString()}</span> {unitWord}
            </>
          ) : null}
        </div>
      </div>
      {trend.annotations?.length ? (
        <div className="annos">
          {trend.annotations.map((a) => (
            <div className="anno" key={a.label}>
              <b>{a.label}</b>
              {a.text}
            </div>
          ))}
        </div>
      ) : null}
      {trend.footnote ? <div className="footnote">{trend.footnote}</div> : null}
    </>
  );
}

/* ----------------------------------------------------------------- barlist */

export function BarList({ rows, color = "var(--c1)" }) {
  if (!rows?.length) return null;
  const max = Math.max(...rows.map((r) => Number(r.pct) || 0), 1);
  return (
    <div className="barlist">
      {rows.map((r) => (
        <div className="row" key={r.name} title={`${r.name}: ${r.pct}%`}>
          <div className="lbl">{r.name}</div>
          <div className="track">
            <div className="fill" style={{ width: `${(r.pct / max) * 100}%`, background: color }} />
          </div>
          <div className="val">{r.pct}%</div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------- donut */

const R = 60;
const CIRC = 2 * Math.PI * R;

// The ring's inner diameter fits ~13 uppercase characters at 10px; longer
// names are cut so the centre label never overruns the segments. The legend
// beside the donut always carries the full name.
function truncate(name, max) {
  const s = String(name ?? "");
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
}

function segColor(part, i, colors) {
  if (colors?.[i]) return colors[i];
  if (part.tone) return TONE[part.tone];
  return CAT[i % CAT.length];
}

export function Donut({ parts, colors, center }) {
  if (!parts?.length) return null;
  const total = parts.reduce((a, p) => a + (Number(p.pct) || 0), 0) || 1;
  const c = center || parts[0];
  let offset = 0;
  const segs = parts.map((p, i) => {
    const len = (p.pct / total) * CIRC;
    const visible = Math.max(len - 2, 0); // 2px surface gap between segments
    const seg = (
      <circle
        key={p.name}
        className="seg"
        r={R}
        cx={75}
        cy={75}
        fill="none"
        stroke={segColor(p, i, colors)}
        strokeWidth={18}
        strokeDasharray={`${visible} ${CIRC - visible}`}
        strokeDashoffset={-offset}
        transform="rotate(-90 75 75)"
      >
        <title>{`${p.name}: ${p.pct}%`}</title>
      </circle>
    );
    offset += len;
    return seg;
  });
  return (
    <div className="donut">
      <svg viewBox="0 0 150 150" role="img" aria-label={parts.map((p) => `${p.name} ${p.pct}%`).join(", ")}>
        {segs}
        <text className="center" x={75} y={72} textAnchor="middle">
          {c.pct}%
        </text>
        <text className="center-l" x={75} y={90} textAnchor="middle">
          {truncate(c.name, 13)}
        </text>
      </svg>
      <div className="legend">
        {parts.map((p, i) => (
          <span key={p.name}>
            <span className="n">
              <i style={{ background: segColor(p, i, colors) }} />
              {p.name}
            </span>
            <span className="v">{p.pct}%</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------- funnel / themes / etc. */

export function Funnel({ steps }) {
  if (!steps?.length) return null;
  return (
    <div className="funnel">
      {steps.map((s, i) => (
        <FunnelStep key={s.label} step={s} alt={i % 2 === 1} arrow={i < steps.length - 1} />
      ))}
    </div>
  );
}

function FunnelStep({ step, alt, arrow }) {
  return (
    <>
      <div className={`fstat${alt ? " alt" : ""}`}>
        <div className="v">{step.value}</div>
        <div className="l">{step.label}</div>
      </div>
      {arrow ? <div className="arrow">→</div> : null}
    </>
  );
}

export function ThemeCards({ rows }) {
  if (!rows?.length) return null;
  return (
    <div className="themes">
      {rows.map((r) => (
        <div className="theme" key={r.name}>
          <div className="pct">{r.pct}%</div>
          <div className="nm">{r.name}</div>
          {r.text ? <p>{r.text}</p> : null}
        </div>
      ))}
    </div>
  );
}

export function DriverList({ drivers }) {
  if (!drivers?.length) return null;
  return (
    <div className="driver">
      {drivers.map((d, i) => (
        <div className="d" key={d.title} style={{ borderColor: CAT[i % CAT.length] }}>
          <h5>{d.title}</h5>
          <p>{d.text}</p>
        </div>
      ))}
    </div>
  );
}

export function ProfileCards({ profile }) {
  if (!profile?.length) return null;
  return (
    <div className="grid g3">
      {profile.map((p) => (
        <div className="card" key={p.title}>
          <h4>{p.title}</h4>
          {p.sub ? <div className="sub">{p.sub}</div> : null}
          <Bullets points={p.points} />
        </div>
      ))}
    </div>
  );
}

export function UsageQuadrants({ usage }) {
  if (!usage?.length) return null;
  return (
    <div className="grid g2 usage">
      {usage.map((u) => (
        <div className="card" key={u.title}>
          <div className="eyebrow">{u.title}</div>
          {u.segments?.length ? (
            <div className="segs">
              {u.segments.map((s) => (
                <span className="chip" key={s}>
                  {s}
                </span>
              ))}
            </div>
          ) : null}
          <div className="card-title" style={{ margin: "6px 0 0" }}>
            Characteristics
          </div>
          <Bullets points={u.points} />
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
