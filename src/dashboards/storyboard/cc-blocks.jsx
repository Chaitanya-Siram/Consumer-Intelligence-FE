/**
 * Blocks for the Congruence & Content Intelligence storyboard (AI/LLM Audit
 * and Analysis, Tier 2). No charting library; bubbles, heat-maps and bars are
 * CSS/SVG on the `.sb-wg` tokens. Reuses the Whitespace blocks.
 */
import BrandLogo from "./BrandLogo.jsx";
import { Bullets, CAT, Rich } from "./wg-blocks.jsx";

export { BarList, Bullets, Rich, SecHead, SummaryPanel, WgBanner } from "./wg-blocks.jsx";

// Assistant colours: fixed per name so the same LLM has one colour everywhere.
const LLM_COLOR = {
  chatgpt: "#10A37F", gemini: "#4E7CF6", copilot: "#8B5CF6", claude: "#D97757", perplexity: "#1F2937", "meta ai": "#0866FF",
};
const llmColor = (n) => LLM_COLOR[String(n).toLowerCase()] || "var(--c6)";
const llmMark = (n) => String(n).replace(/[^A-Za-z]/g, "").slice(0, 2).toUpperCase();

export function LlmChips({ llms }) {
  if (!llms?.length) return null;
  return (
    <div className="llms">
      {llms.map((l) => (
        <span className="llm" key={l}>
          <i style={{ background: llmColor(l) }}>{llmMark(l)}</i>
          {l}
        </span>
      ))}
    </div>
  );
}

function MiniLlms({ llms }) {
  if (!llms?.length) return null;
  return (
    <span className="mini-llms">
      {llms.map((l) => (
        <i key={l} style={{ background: llmColor(l) }} title={l}>{llmMark(l)}</i>
      ))}
    </span>
  );
}

/* ------------------------------------------------------------- overview */

export function StageCards({ stages }) {
  if (!stages?.length) return null;
  return (
    <div className="stages">
      {stages.map((s) => (
        <div className={`card stage ${s.tone || "purple"}`} key={s.title}>
          <div className="sh">
            <span className="n">{s.n}</span>
            <span className="t">{s.title}</span>
          </div>
          <div className="sb">
            <div>
              <div className="lab">Questions</div>
              {(s.questions || []).map((q) => <div className="q" key={q}>{q}</div>)}
            </div>
            <div>
              <div className="lab">Method</div>
              <Bullets points={s.method} />
            </div>
            <div>
              <div className="lab">Deliverables</div>
              <Bullets points={s.deliverables} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function Flow({ inputs, llms, datasets }) {
  return (
    <div className="flow">
      <div className="box">
        <div className="lab">Evaluation inputs</div>
        <Bullets points={inputs} />
      </div>
      <div className="arrow">→</div>
      <div className="box">
        <div className="lab">LLMs analysed</div>
        <LlmChips llms={llms} />
      </div>
      <div className="arrow">→</div>
      <div className="box">
        <div className="lab">Data sets</div>
        <Bullets points={datasets} />
      </div>
    </div>
  );
}

export function Outcomes({ outcomes }) {
  if (!outcomes?.length) return null;
  return (
    <div className="outcomes">
      {outcomes.map((o) => (
        <div className="card outcome" key={o.title}>
          <div className="lab">{o.title}</div>
          {(o.items || []).map((it) => <div className="it" key={it}>{it}</div>)}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------- analysis */

export function SourceTable({ sources, logos }) {
  if (!sources?.length) return null;
  return (
    <div className="tbl-wrap">
      <table className="rank">
        <thead>
          <tr><th>#</th><th>Source</th><th>Type</th><th style={{ textAlign: "right" }}>Citations</th><th style={{ textAlign: "right" }}>Reach</th><th>Cited by</th></tr>
        </thead>
        <tbody>
          {sources.map((s, i) => (
            <tr key={s.name}>
              <td><span className={`rk${i === 0 ? " r1" : ""}`}>{i + 1}</span></td>
              <td><span className="nm"><BrandLogo brand={s.name} logos={logos} size={20} rounded={6} />{s.name}</span></td>
              <td><span className="type">{s.type}</span></td>
              <td className="num">{s.mentions}</td>
              <td className="num">{s.reach || "—"}</td>
              <td><MiniLlms llms={s.llms} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function JournalistTable({ journalists }) {
  if (!journalists?.length) return null;
  return (
    <div className="tbl-wrap">
      <table className="rank">
        <thead>
          <tr><th>#</th><th>Journalist</th><th>Outlet</th><th style={{ textAlign: "right" }}>Citations</th><th>Beat</th></tr>
        </thead>
        <tbody>
          {journalists.map((j, i) => (
            <tr key={j.name}>
              <td><span className={`rk${i === 0 ? " r1" : ""}`}>{i + 1}</span></td>
              <td><span className="nm">{j.name}</span></td>
              <td>{j.outlet}</td>
              <td className="num">{j.mentions}</td>
              <td><span className="type">{j.beat}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* -------------------------------------------------------- interpretation */

const R = 68, CIRC = 2 * Math.PI * R;
const TONE = { pos: "var(--pos)", neg: "var(--neg)", neu: "var(--c6)" };

export function SentimentDonut({ s }) {
  if (!s) return null;
  const parts = [{ k: "pos", name: "Positive", pct: s.pos }, { k: "neg", name: "Negative", pct: s.neg }, { k: "neu", name: "Neutral", pct: s.neu }];
  let off = 0;
  return (
    <div className="donut">
      <svg viewBox="0 0 170 170" role="img" aria-label={parts.map((p) => `${p.name} ${p.pct}%`).join(", ")}>
        {parts.map((p) => {
          const len = (p.pct / 100) * CIRC, vis = Math.max(len - 2, 0);
          const seg = <circle key={p.k} className="seg" r={R} cx={85} cy={85} fill="none" stroke={TONE[p.k]} strokeWidth={20} strokeDasharray={`${vis} ${CIRC - vis}`} strokeDashoffset={-off} transform="rotate(-90 85 85)"><title>{`${p.name}: ${p.pct}%`}</title></circle>;
          off += len;
          return seg;
        })}
        <text className="center" x={85} y={82} textAnchor="middle">{s.pos}%</text>
        <text className="center-l" x={85} y={100} textAnchor="middle">Positive</text>
      </svg>
      <div className="legend">
        {parts.map((p) => (
          <span key={p.k}><span className="n"><i style={{ background: TONE[p.k] }} />{p.name}</span><span className="v">{p.pct}%</span></span>
        ))}
      </div>
    </div>
  );
}

/** Theme bubbles sized by count (sqrt scale), coloured in fixed order. */
export function ThemeBubbles({ themes }) {
  if (!themes?.length) return null;
  const max = Math.max(...themes.map((t) => Number(t.count) || 0), 1);
  return (
    <div className="bubbles">
      {themes.map((t, i) => {
        const d = 84 + Math.sqrt(t.count / max) * 96;
        return (
          <div className="bubble" key={t.name} style={{ width: d, height: d, background: CAT[i % CAT.length] }} title={`${t.name}: ${t.count}`}>
            <div className="bn">{t.name}</div>
            <div className="bc">{t.count}</div>
            {t.sub?.length && d > 130 ? <div className="bs">{t.sub.slice(0, 2).join(" · ")}</div> : null}
          </div>
        );
      })}
    </div>
  );
}

// Diverging (-100..100) or sequential (0..100) heat cell colour.
function heatColor(v, diverging) {
  if (diverging) {
    const t = Math.min(1, Math.abs(v) / 100);
    return v >= 0 ? `rgba(31,138,85,${0.18 + t * 0.72})` : `rgba(200,54,47,${0.18 + t * 0.72})`;
  }
  const t = Math.min(1, Math.max(0, v) / 100);
  return `rgba(91,31,115,${0.12 + t * 0.78})`;
}

export function HeatMap({ cols, rows, rowKey = "theme", diverging = false, legend }) {
  if (!rows?.length || !cols?.length) return null;
  return (
    <div className="tbl-wrap">
      <table className="heat">
        <thead>
          <tr><th />{cols.map((c) => <th key={c}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r[rowKey]}>
              <td className="lbl">{r[rowKey]}</td>
              {r.values.map((v, i) => (
                <td key={cols[i]}>
                  <div className="cell" style={{ background: heatColor(v, diverging), color: Math.abs(v) < 35 && !diverging ? "var(--ink)" : "#fff" }} title={`${cols[i]} · ${r[rowKey]}: ${v}`}>
                    {v > 0 && diverging ? "+" : ""}{v}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {legend ? <div className="heat-legend">{legend}</div> : null}
    </div>
  );
}

export function ScoreTiles({ scores }) {
  if (!scores?.length) return null;
  return (
    <div className="scores">
      {scores.map((s) => (
        <div className="score" key={s.name}>
          <div className="v">{s.value}<small> / 100</small></div>
          <div className="n">{s.name}</div>
          <div className="t">{s.text}</div>
          <div className="track"><div className="fill" style={{ width: `${s.value}%` }} /></div>
        </div>
      ))}
    </div>
  );
}

export function Words({ words }) {
  if (!words?.length) return null;
  return <div className="words">{words.map((w) => <span className="word" key={w}>{w}</span>)}</div>;
}

/* ------------------------------------------------------------------ scan */

const STATUS_COLOR = { aligned: "var(--pos)", diluted: "var(--warn)", contradicted: "var(--neg)" };

export function PillarRows({ pillars, brand }) {
  if (!pillars?.length) return null;
  return (
    <>
      <div className="pil-head"><span>Narrative pillar</span><span>{brand ? `${brand} intent` : "Brand intent"}</span><span>LLM narrative</span><span className="r">Alignment</span></div>
      <div className="pillars">
        {pillars.map((p) => (
          <div className="pil" key={p.name}>
            <div>
              <div className="pn">{p.name}</div>
              <span className={`st ${p.status}`}>{p.status}</span>
            </div>
            <div className="col"><div className="lab">Intent</div><p><Rich text={p.intent} /></p></div>
            <div className="col"><div className="lab">LLM narrative</div><p><Rich text={p.llm} /></p></div>
            <div className="al">
              <div className="v" style={{ color: STATUS_COLOR[p.status] || "var(--ink)" }}>{p.align}%</div>
              <div className="track"><div className="fill" style={{ width: `${p.align}%`, background: STATUS_COLOR[p.status] || "var(--ink3)" }} /></div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export function Flags({ flags }) {
  if (!flags?.length) return null;
  return (
    <div className="flags">
      {flags.map((f) => (
        <div className={`flag ${f.tone}`} key={f.title}>
          <div className="ft">{f.tone}</div>
          <h5>{f.title}</h5>
          <p><Rich text={f.text} /></p>
        </div>
      ))}
    </div>
  );
}
