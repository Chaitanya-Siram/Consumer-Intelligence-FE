/**
 * Blocks specific to the Shifting Audience Priorities storyboard (Advanced
 * Metrics, Tier 2). Everything else on that screen reuses tei-blocks.jsx and
 * the `.sb-tei` tokens; these add the index gauge, the tracking tiles, the
 * banded score meter and the benchmark bars. Hand-drawn SVG/CSS, no library.
 * Class names are the contract with sap.css.
 */

const TONE = { pos: "var(--pos)", neg: "var(--neg)", neu: "var(--c6)" };

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, Number(v) || 0));
}

/* ------------------------------------------------------------------ gauge */

// Half-ring gauge: `index.value` on a `min..max` scale, prior value as a tick.
export function IndexGauge({ index }) {
  if (!index) return null;
  const { value, prior, min = 0, max = 100, label, sub, note } = index;
  const span = max - min || 1;
  const frac = clamp((value - min) / span, 0, 1);
  const priorFrac = prior == null ? null : clamp((prior - min) / span, 0, 1);
  const R = 84;
  const cx = 110;
  const cy = 112;
  const arc = (f) => {
    const a = Math.PI * (1 - f);
    return { x: cx + R * Math.cos(a), y: cy - R * Math.sin(a) };
  };
  const start = arc(0);
  const end = arc(frac);
  const full = arc(1);
  const large = frac > 0.5 ? 1 : 0;
  const delta = prior == null ? null : value - prior;
  return (
    <div className="gauge">
      <svg viewBox="0 0 220 130" role="img" aria-label={`${label}: ${value} of ${max}`}>
        <path className="gauge-track" d={`M${start.x},${start.y} A${R},${R} 0 1 1 ${full.x},${full.y}`} />
        {frac > 0 ? (
          <path className="gauge-fill" d={`M${start.x},${start.y} A${R},${R} 0 ${large} 1 ${end.x},${end.y}`} />
        ) : null}
        {priorFrac != null ? (
          <g className="gauge-prior" transform={`translate(${arc(priorFrac).x},${arc(priorFrac).y})`}>
            <circle r={5} />
          </g>
        ) : null}
        <text className="gauge-min" x={start.x} y={cy + 18} textAnchor="middle">
          {min}
        </text>
        <text className="gauge-max" x={full.x} y={cy + 18} textAnchor="middle">
          {max}
        </text>
        <text className="gauge-value disp" x={cx} y={cy - 6} textAnchor="middle">
          {value}
        </text>
        <text className="gauge-label" x={cx} y={cy + 14} textAnchor="middle">
          {label}
        </text>
      </svg>
      <div className="gauge-meta">
        {delta != null ? (
          <span className={`chip ${delta > 0 ? "pos" : delta < 0 ? "neg" : "neu"}`}>
            {delta > 0 ? "+" : ""}
            {delta} vs prior
          </span>
        ) : null}
        {sub ? <div className="gauge-sub">{sub}</div> : null}
        {note ? <p className="gauge-note">{note}</p> : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- param list */

export function ParamList({ params }) {
  if (!params?.length) return null;
  return (
    <div className="params">
      {params.map((p, i) => (
        <div className="param" key={p.key || p.name}>
          <div className="param-n mono">{String(i + 1).padStart(2, "0")}</div>
          <div>
            <h5>{p.name}</h5>
            {p.text ? <p>{p.text}</p> : null}
          </div>
        </div>
      ))}
    </div>
  );
}

/* --------------------------------------------------------- tracking tiles */

const ICON = {
  nps: "◎",
  sentiment: "☺",
  switch: "⇄",
  usage: "↻",
};

export function TrackingTiles({ tracking }) {
  if (!tracking?.length) return null;
  return (
    <div className="tiles">
      {tracking.map((t) => (
        <div className={`tile dir-${t.dir || "flat"}`} key={t.key || t.name}>
          <div className="tile-head">
            <span className="tile-ico" aria-hidden="true">
              {ICON[t.key] || "•"}
            </span>
            <span className="tile-name">{t.name}</span>
          </div>
          <div className="tile-val disp">
            {t.value}
            {t.unit ? <small>{t.unit}</small> : null}
          </div>
          <div className="tile-trend">
            <span className="arrow" aria-hidden="true">
              {t.dir === "up" ? "▲" : t.dir === "down" ? "▼" : "●"}
            </span>
            {t.trend}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------- banded meter */

export function BandMeter({ monthly }) {
  if (!monthly) return null;
  const { score, min = 0, max = 100, bands = [], text } = monthly;
  const span = max - min || 1;
  const pos = clamp((score - min) / span, 0, 1) * 100;
  let from = min;
  const segs = bands.map((b) => {
    const w = ((b.to - from) / span) * 100;
    const seg = <div className="band" key={b.to} style={{ width: `${w}%`, background: TONE[b.tone] || TONE.neu }} />;
    from = b.to;
    return seg;
  });
  const current = bands.find((b) => score <= b.to) || bands[bands.length - 1];
  return (
    <div className="meter">
      <div className="meter-top">
        <div className="meter-score disp">{score}</div>
        {current ? <span className={`chip ${current.tone}`}>{current.tone === "pos" ? "Strong" : current.tone === "neg" ? "Weak" : "Moderate"}</span> : null}
      </div>
      <div className="meter-track">
        {segs}
        <div className="meter-pin" style={{ left: `${pos}%` }} />
      </div>
      <div className="meter-scale">
        <span>{min}</span>
        <span>{max}</span>
      </div>
      {text ? <p className="meter-text">{text}</p> : null}
    </div>
  );
}

/* ---------------------------------------------------------- benchmark bars */

export function BenchmarkBars({ benchmark }) {
  const rows = benchmark?.rows || [];
  if (!rows.length) return null;
  const max = Math.max(...rows.map((r) => Number(r.value) || 0), 1);
  const v = benchmark.verdict;
  return (
    <div className="bench">
      {rows.map((r) => (
        <div className={`bench-row${r.is_brand ? " brand" : ""}`} key={r.name}>
          <div className="bench-name">{r.name}</div>
          <div className="bench-track">
            <div className="bench-fill" style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
          <div className="bench-val mono">{r.value}</div>
        </div>
      ))}
      {v?.label ? (
        <div className="bench-verdict">
          <span className={`chip ${v.tone || "neu"}`}>{v.label}</span>
          <small>Brand index against the industry-wide index over the same posts.</small>
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------- spike list */

export function SpikeList({ spikes }) {
  if (!spikes?.length) return null;
  return (
    <div className="annos">
      {spikes.map((s) => (
        <div className="anno" key={`${s.at}-${s.label}`}>
          <b>{s.label}</b>
          {s.text}
        </div>
      ))}
    </div>
  );
}

/* --------------------------------------------------------------- rich lead */

// The lead may carry <b>…</b> from the backend contract. Allow only that tag.
export function BoldOnly({ text, className = "" }) {
  if (!text) return null;
  const safe = String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/&lt;(\/?)b&gt;/g, "<$1b>");
  // eslint-disable-next-line react/no-danger
  return <p className={className} dangerouslySetInnerHTML={{ __html: safe }} />;
}
