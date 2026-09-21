/**
 * Blocks shared by the three Regional Intelligence storyboards. Every screen
 * is "Overview + one tab per region"; these pieces render the per-region
 * slices and the overview table. Reuses the Whitespace blocks (wg-blocks) and
 * stylesheet plus ri.css additions.
 */
import { CountryName } from "../../utils/countryFlags.jsx";
import BrandLogo from "./BrandLogo.jsx";
import { BarList, Bullets, CAT, Rich, WgBanner } from "./wg-blocks.jsx";

export { BarList, Bullets, Rich, SecHead, SummaryPanel, WgBanner } from "./wg-blocks.jsx";

const TONE = { pos: "var(--pos)", neg: "var(--neg)" };
const isOther = (n) => /^others?$/i.test(n);

/** Tabs for StoryboardShell: Overview first, then one per region. */
export function regionTabs(regions) {
  return [{ id: "overview", label: "Overview" }, ...(regions || []).map((r) => ({ id: r.key, label: r.name }))];
}

export function RegionHead({ region, sub }) {
  return (
    <div className="rhead">
            <div>
        <div className="nm"><CountryName name={region.name} size={22} gap={8} /></div>
        {sub ? <div className="sub">{sub}</div> : null}
      </div>
    </div>
  );
}

/** Banner built from a region record. */
export function RegionBanner({ region, eyebrow, variant, stats }) {
  return <WgBanner variant={variant} banner={{ eyebrow, headline: region.headline, sub: region.summary, stats }} />;
}

/* ------------------------------------------------------------ sentiment */

export function SentimentBar({ s }) {
  if (!s) return null;
  return (
    <div className="sbar">
      <div style={{ width: `${s.pos}%`, background: TONE.pos }} title={`Positive ${s.pos}%`}>{s.pos >= 8 ? `${s.pos}%` : ""}</div>
      <div className="neu" style={{ width: `${s.neu}%`, background: "var(--bg2)" }} title={`Neutral ${s.neu}%`}>{s.neu >= 8 ? `${s.neu}%` : ""}</div>
      <div style={{ width: `${s.neg}%`, background: TONE.neg }} title={`Negative ${s.neg}%`}>{s.neg >= 8 ? `${s.neg}%` : ""}</div>
    </div>
  );
}

export function NetSentiment({ s }) {
  if (!s) return null;
  const net = (Number(s.pos) || 0) - (Number(s.neg) || 0);
  return (
    <div className="net">
      {net > 0 ? "+" : ""}{net}
      <small>Net sentiment</small>
    </div>
  );
}

export function ThemeColumns({ themes }) {
  if (!themes?.length) return null;
  const max = Math.max(...themes.map((t) => Number(t.pct) || 0), 1);
  return (
    <>
      <div className="tcols" style={{ gridTemplateColumns: `repeat(${themes.length},1fr)` }}>
        {themes.map((t) => (
          <div className="tc" key={t.name}>
            <div className="pv" style={{ bottom: `calc(${(t.pct / max) * 100}% + 6px)` }}>{t.pct}%</div>
            <div className="bar" style={{ height: `${(t.pct / max) * 100}%` }} title={`${t.name} ${t.pct}%`} />
          </div>
        ))}
      </div>
      <div className="tcols-x" style={{ gridTemplateColumns: `repeat(${themes.length},1fr)` }}>
        {themes.map((t) => (
          <div key={t.name}>
            <div className="n">{t.name}</div>
            {t.sub ? <div className="s">({t.sub})</div> : null}
          </div>
        ))}
      </div>
    </>
  );
}

/* ----------------------------------------------------------- engagement */

/** H1 vs H2 product-type shift with computed deltas. */
// Product-type names drift between periods ("Wet sanding" vs "Wet sanding
// Products", "Ceramic/SiO2 Powered" vs "Ceramic/SiO2 Infused"); compare on a
// normalised stem so the shift chips match the same type across halves.
const stem = (n) =>
  String(n).toLowerCase()
    .replace(/\b(products?|cleaners?|powered|infused|and|&)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export function TypeShift({ h1, h2, periods = ["H1", "H2"] }) {
  if (!h1?.length && !h2?.length) return null;
  const m1 = new Map((h1 || []).map((r) => [stem(r.name), r.pct]));
  const deltas = (h2 || [])
    .filter((r) => !isOther(r.name))
    .map((r) => {
      const prev = m1.get(stem(r.name));
      return { name: r.name, prev, now: r.pct, d: prev == null ? null : r.pct - prev };
    })
    .filter((x) => x.d == null || Math.abs(x.d) >= 3)
    .sort((a, b) => Math.abs(b.d ?? 99) - Math.abs(a.d ?? 99))
    .slice(0, 5);
  return (
    <>
      <div className="shift">
        <div className="h1">
          <div className="ph">{periods[0]}</div>
          <BarList rows={h1} compact color="var(--ink3)" />
        </div>
        <div className="h2">
          <div className="ph">{periods[1]}</div>
          <BarList rows={h2} compact color="var(--c4)" />
        </div>
      </div>
      {deltas.length ? (
        <div className="delta">
          {deltas.map((x) => (
            <span key={x.name} className={x.d == null ? "new" : x.d > 0 ? "up" : "down"}>
              {x.d == null ? "new" : x.d > 0 ? "▲" : "▼"} {x.name} <b>{x.d == null ? `${x.now}%` : `${x.prev}% → ${x.now}%`}</b>
            </span>
          ))}
        </div>
      ) : null}
    </>
  );
}

/* ---------------------------------------------------------------- brands */

const R = 68, CIRC = 2 * Math.PI * R;
// Non-brand segments skip the brand pink so the project brand stays unique.
const SEG = CAT.filter((c) => c !== "var(--c2)");
const segColor = (r, i) => (r.is_brand ? "var(--brand-2)" : isOther(r.name) ? "var(--c6)" : SEG[i % SEG.length]);

export function BrandDonut({ rows, logos }) {
  if (!rows?.length) return null;
  const total = rows.reduce((a, r) => a + (Number(r.pct) || 0), 0) || 1;
  const lead = rows.find((r) => !isOther(r.name)) || rows[0];
  let off = 0;
  return (
    <div className="donut">
      <svg viewBox="0 0 170 170" role="img" aria-label={rows.map((r) => `${r.name} ${r.pct}%`).join(", ")}>
        {rows.map((r, i) => {
          const len = (r.pct / total) * CIRC, vis = Math.max(len - 2, 0);
          const seg = (
            <circle key={r.name} className="seg" r={R} cx={85} cy={85} fill="none" stroke={segColor(r, i)} strokeWidth={20}
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
              <i style={{ background: segColor(r, i) }} />
              {isOther(r.name) ? null : <BrandLogo brand={r.name} logos={logos} size={18} rounded={5} />}
              <span style={r.is_brand ? { color: "var(--brand-1)", fontWeight: 700 } : undefined}>{r.name}</span>
            </span>
            <span className="v">{r.pct}%</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function BrandTopics({ topics, logos }) {
  if (!topics?.length) return null;
  return (
    <div className="btopics">
      {topics.map((t) => (
        <div className="btopic" key={t.brand + t.text.slice(0, 20)}>
          <BrandLogo brand={t.brand} logos={logos} size={34} rounded={9} />
          <div>
            <div className="bn">{t.brand}</div>
            <p>
              <Rich text={t.text} />
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function OtherChips({ others, logos }) {
  if (!others?.length) return null;
  return (
    <div className="chips">
      {others.map((o) => (
        <span className="chip" key={o}>
          <BrandLogo brand={o} logos={logos} size={16} rounded={4} />
          {o}
        </span>
      ))}
    </div>
  );
}

/* --------------------------------------------------------------- overview */

/** Generic overview table. `cols` = [{ h, render(region) }]. */
export function OverviewTable({ regions, cols, onPick }) {
  if (!regions?.length) return null;
  return (
    <div className="card lg ovr-wrap">
      <table className="ovr">
        <thead>
          <tr>
            <th>Market</th>
            {cols.map((c) => <th key={c.h}>{c.h}</th>)}
          </tr>
        </thead>
        <tbody>
          {regions.map((r) => (
            <tr key={r.key} className="link" onClick={() => onPick?.(r.key)} title={`Open ${r.name}`}>
              <td>
                <div className="rg">
                  <CountryName name={r.name} />
                </div>
              </td>
              {cols.map((c) => <td key={c.h}>{c.render(r)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export { Bullets as InsightList };
