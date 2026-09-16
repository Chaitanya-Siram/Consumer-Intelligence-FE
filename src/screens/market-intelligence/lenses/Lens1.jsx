/**
 * Channel Impact Analysis — pages 3–6 of the Auto Appearance report, rebuilt in
 * place: Key Takeaways, brand × platform volume per comparison window, the
 * comparative strategy table, and the events pillars. Every number comes from
 * `channel_impact`; every sentence was written by the narrative pass from those
 * numbers and checked by the figure guard. When a sentence was dropped, the
 * block falls back to a plain statement of the figure it stands on.
 */
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from "recharts";

import { BrandLogo, PlatformIcon, BrandTick, EmptyLens, T, TOOLTIP_STYLE, platformColor, fmtCompact } from "../shared.jsx";

const C = {
  primary: "#1E40AF",
  secondary: "#3B82F6",
  accent: "#D97706",
  bg: "#F8FAFC",
  card: "#FFFFFF",
  muted: "#E9EEF6",
  mutedFg: "#475569",
  border: "#DBEAFE",
  ink: "#0F172A",
};
const DISPLAY = "'Barlow Condensed', sans-serif";
const MONO = "'JetBrains Mono', monospace";

const TOPIC_LABELS = {
  volume: "Volume",
  platforms: "Platform shift",
  brands: "Brand hierarchy",
  content: "Content mix",
  regions: "Regional weight",
  influencers: "Creator voice",
};

const signed = (v) => (v == null ? "—" : `${v > 0 ? "+" : ""}${v}`);

const TABS = [
  { id: "takeaways", label: "Key Takeaways", page: "01" },
  { id: "channels", label: "Channel Impact", page: "02" },
  { id: "comparative", label: "Comparative Table", page: "03" },
  { id: "events", label: "Events & Conferences", page: "04" },
];

/** One tab's content, faded in on mount; shown at once under reduced motion. */
function Reveal({ children }) {
  const [shown, setShown] = useState(() => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(frame);
  }, []);
  return (
    <div style={{ opacity: shown ? 1 : 0, transform: shown ? "none" : "translateY(10px)", transition: "opacity 300ms ease-out, transform 300ms ease-out" }}>
      {children}
    </div>
  );
}

function TabBar({ active, onChange }) {
  return (
    <div role="tablist" aria-label="Channel Impact pages" style={{ display: "flex", gap: 6, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 6, width: "fit-content" }}>
      {TABS.map((tab) => {
        const on = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={on}
            aria-controls={`ci-panel-${tab.id}`}
            id={`ci-tab-${tab.id}`}
            onClick={() => onChange(tab.id)}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, minHeight: 44, padding: "0 16px", borderRadius: 8, border: "none", cursor: "pointer", background: on ? C.primary : "transparent", color: on ? "#fff" : C.mutedFg, fontFamily: DISPLAY, fontSize: 15, fontWeight: 700, letterSpacing: "0.02em", transition: "background 150ms, color 150ms" }}
          >
            <span style={{ fontFamily: MONO, fontSize: 10, opacity: 0.8 }}>{tab.page}</span>
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

function Title({ line1, line2, size = 34 }) {
  return (
    <h2 style={{ fontFamily: DISPLAY, fontSize: size, fontWeight: 800, color: C.ink, margin: 0, lineHeight: 1.05, letterSpacing: "0.01em" }}>
      {line1}
      <br />
      <span style={{ color: C.primary }}>{line2}</span>
    </h2>
  );
}

function Card({ children, style }) {
  return <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 22, boxShadow: "0 1px 3px rgba(15,23,42,0.05)", ...style }}>{children}</div>;
}

function ShiftBadge({ shift }) {
  const up = shift.delta_pp >= 0;
  return (
    <span title={`${shift.type}: ${shift.a_pct}% → ${shift.b_pct}% of typed posts (${signed(shift.delta_pp)}pp)`}
      style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: MONO, fontSize: 10, fontWeight: 700, color: C.accent, background: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: 6, padding: "2px 7px", whiteSpace: "nowrap" }}>
      <span aria-hidden="true">{up ? "↑" : "↓"}</span>
      {shift.type.split("/")[0]} {shift.a_pct}%→{shift.b_pct}%
    </span>
  );
}

function ChangeChip({ label, value, basis }) {
  if (value == null) return null;
  const up = value >= 0;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: C.card, border: `1px solid ${C.border}`, borderRadius: 999, padding: "5px 12px 5px 6px", fontSize: 12, color: C.mutedFg }}>
      <PlatformIcon platform={label} size={18} rounded={5} />
      {label}
      <span style={{ fontFamily: MONO, fontWeight: 700, color: C.accent }} aria-label={`${up ? "up" : "down"} ${Math.abs(value)} percent`}>
        <span aria-hidden="true">{up ? "↑" : "↓"}</span> {signed(value)}%
      </span>
      {basis === "per_day_rate" ? <span style={{ fontSize: 10, color: T.faint }}>per-day</span> : null}
    </span>
  );
}

function PlatformLegend({ platforms }) {
  return (
    <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center", marginTop: 6 }}>
      {platforms.map((p, i) => (
        <span key={p} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: C.mutedFg }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: platformColor(p, i), display: "inline-block" }} />
          <PlatformIcon platform={p} size={14} rounded={4} />
          {p}
        </span>
      ))}
    </div>
  );
}

function Hero({ media, brand }) {
  const box = { width: "100%", aspectRatio: "4 / 3", borderRadius: 14, overflow: "hidden", border: `1px solid ${C.border}`, background: `linear-gradient(135deg, ${C.muted}, ${C.border})` };
  if (media?.type === "youtube") {
    return (
      <div style={box}>
        <iframe title={`${brand} video`} src={`${media.url}?autoplay=1&mute=1&loop=1&controls=0&modestbranding=1&playsinline=1&rel=0`} style={{ width: "100%", height: "100%", border: 0 }} allow="autoplay; encrypted-media" />
      </div>
    );
  }
  if (media?.url) return <div style={box}><img src={media.url} alt={media.alt || brand} style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>;
  return <div style={box} aria-hidden="true" />;
}

export default function Lens1({ data }) {
  const block = data?.channel_impact;
  const meta = data?.meta || {};
  const [active, setActive] = useState(null);
  const [tab, setTab] = useState("takeaways");
  if (!block?.periods?.length) return <EmptyLens label="No dated posts naming a brand on a channel in this session." />;

  const { platforms, brands, periods, change, comparative, takeaways, events, facts, provenance } = block;
  const two = periods.length === 2;
  const last = periods[periods.length - 1];
  const first = periods[0];
  const topPlatform = Object.entries(last.leaders || {}).sort((a, b) => b[1].posts - a[1].posts)[0];
  const leaderCounts = Object.values(last.leaders || {}).reduce((m, l) => ({ ...m, [l.brand]: (m[l.brand] || 0) + 1 }), {});
  const leadBrand = Object.entries(leaderCounts).sort((a, b) => b[1] - a[1])[0];
  const basisNote = change.basis === "per_day_rate" ? " (mentions per day — the two windows differ in length)" : "";

  const headline = takeaways.headline || (two && change.total_pct != null
    ? `Brand posts moved ${signed(change.total_pct)}% from ${first.label} to ${last.label}${basisNote}. ${topPlatform ? `${topPlatform[0]} carried the most brand posts in ${last.label}.` : ""}`
    : `${last.total.toLocaleString()} brand posts across ${platforms.length} platforms in ${last.label}.`);
  const thesis = takeaways.thesis || (leadBrand ? `${leadBrand[0]} leads ${leadBrand[1]} of ${Object.keys(last.leaders).length} platforms in ${last.label}; every figure below is computed from this session's tagged posts.` : "");
  const summary = block.summary || (topPlatform ? `${topPlatform[0]} is the loudest channel in ${last.label}, led by ${topPlatform[1].brand} with ${topPlatform[1].posts} posts.` : "");
  const intro = comparative.intro || `Each cell is one brand on one platform: its posts in ${last.label}${two ? `, the change against ${first.label},` : ""} and how its content mix shifted. Cells under ${provenance.min_cell_posts} posts are not characterised.`;

  const chart = (period) => (
    <Card key={period.label} style={{ padding: "18px 14px 12px" }}>
      <ResponsiveContainer width="100%" height={330}>
        <BarChart data={period.rows} margin={{ top: 22, right: 8, left: 0, bottom: 20 }} barCategoryGap="22%" barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.muted} vertical={false} />
          <XAxis dataKey="brand" tick={<BrandTick />} interval={0} height={52} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: C.mutedFg }} axisLine={false} tickLine={false} width={36} />
          <Tooltip {...TOOLTIP_STYLE} />
          {platforms.map((p, i) => (
            <Bar key={p} dataKey={p} name={p} fill={platformColor(p, i)} radius={[3, 3, 0, 0]} isAnimationActive={false}>
              <LabelList dataKey={p} position="top" formatter={(v) => (v ? v : "")} style={{ fontSize: 9, fill: C.mutedFg, fontFamily: MONO }} />
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
      <PlatformLegend platforms={platforms} />
      <div style={{ textAlign: "center", fontFamily: MONO, fontSize: 11, color: T.faint, marginTop: 10 }}>{period.label} · {period.total.toLocaleString()} brand posts · {period.n.toLocaleString()} posts</div>
    </Card>
  );

  const panel = (id) => ({ role: "tabpanel", id: `ci-panel-${id}`, "aria-labelledby": `ci-tab-${id}` });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28, color: C.ink }}>
      <TabBar active={tab} onChange={setTab} />

      {/* ── 01 · Key Takeaways (p3) ────────────────────────────────────── */}
      {tab === "takeaways" ? (
      <Reveal key="takeaways">
        <section {...panel("takeaways")} style={{ display: "grid", gridTemplateColumns: "minmax(260px, 1fr) 2fr", gap: 28 }}>
          <div>
            <h2 id="ci-takeaways" style={{ fontFamily: DISPLAY, fontSize: 40, fontWeight: 500, margin: "0 0 16px", color: C.ink }}>Key Takeaways</h2>
            <p style={{ fontSize: 15, lineHeight: 1.65, color: C.ink, margin: "0 0 22px" }}>{thesis}</p>
            <Hero media={meta.hero_media} brand={meta.brand} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Card style={{ borderColor: C.border }}>
              <p style={{ fontSize: 15, lineHeight: 1.65, margin: 0, fontWeight: 500 }}>{headline}</p>
            </Card>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
              {takeaways.cards.map((card, i) => (
                <Card key={card.topic} style={{ padding: 18, background: i % 2 ? "#F5F8FF" : C.card }}>
                  <span style={{ display: "inline-block", fontFamily: MONO, fontSize: 10, fontWeight: 700, color: C.primary, background: "#EFF6FF", border: `1px solid ${C.border}`, borderRadius: 6, padding: "3px 8px", marginBottom: 10 }}>{card.chip}</span>
                  <div style={{ fontFamily: DISPLAY, fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{card.title || TOPIC_LABELS[card.topic] || card.topic}</div>
                  <p style={{ fontSize: 12.5, lineHeight: 1.6, color: C.mutedFg, margin: 0 }}>{card.text || `Computed for ${first.label}${two ? ` → ${last.label}` : ""}: ${card.chip}.`}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </Reveal>
      ) : null}

      {/* ── 02 · Channel Impact (p4) ───────────────────────────────────── */}
      {tab === "channels" ? (
      <Reveal key="channels">
        <section {...panel("channels")}>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(240px, 1fr) 2fr", gap: 28, alignItems: "start", marginBottom: 18 }}>
            <div id="ci-title"><Title line1="Channel" line2="Impact Analysis" /></div>
            <p style={{ fontSize: 15, lineHeight: 1.65, color: C.primary, margin: 0 }}>{summary}</p>
          </div>
          <div style={{ background: C.muted, borderRadius: 18, padding: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: two ? "1fr 1fr" : "1fr", gap: 20 }}>{periods.map(chart)}</div>
            <p style={{ fontFamily: MONO, fontSize: 10, color: T.faint, margin: "12px 4px 0" }}>
              Posts naming each brand on each platform, de-duplicated by URL. A post naming two brands counts once for each.
            </p>
          </div>
          {two ? (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14, alignItems: "center" }}>
              <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em", color: C.mutedFg, textTransform: "uppercase" }}>Change {first.label} → {last.label}</span>
              {platforms.map((p) => <ChangeChip key={p} label={p} value={change.by_platform[p]} basis={change.basis} />)}
            </div>
          ) : null}
        </section>
      </Reveal>
      ) : null}

      {/* ── 03 · Comparative table (p5) ────────────────────────────────── */}
      {tab === "comparative" ? (
      <Reveal key="comparative">
        <section {...panel("comparative")} style={{ display: "grid", gridTemplateColumns: "minmax(240px, 300px) 1fr", gap: 28, alignItems: "stretch" }}>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 24 }}>
            <div id="ci-comparative"><Title line1="Comparative Channel" line2={`Impact of ${brands.length} Brands`} size={30} /></div>
            <div style={{ background: C.primary, color: "#fff", borderRadius: 14, padding: "22px 20px", fontSize: 14.5, lineHeight: 1.65 }}>{intro}</div>
          </div>
          <div style={{ overflowX: "auto", border: `1px solid ${C.border}`, borderRadius: 14, background: C.card }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr>
                  <th style={{ padding: "12px 14px", borderBottom: `1px solid ${C.border}`, background: "#F5F8FF", width: 120 }} aria-label="Brand" />
                  {platforms.map((p) => (
                    <th key={p} style={{ padding: "12px 14px", textAlign: "left", borderBottom: `1px solid ${C.border}`, background: "#F5F8FF", fontFamily: MONO, fontSize: 11, letterSpacing: "0.08em", color: C.mutedFg, textTransform: "uppercase", minWidth: 170 }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><PlatformIcon platform={p} size={22} rounded={6} />{p}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparative.rows.map((row) => (
                  <tr key={row.brand} onMouseEnter={() => setActive(row.brand)} onMouseLeave={() => setActive(null)} style={{ background: active === row.brand ? "#F8FAFF" : "transparent", transition: "background 150ms" }}>
                    <td style={{ padding: "14px", borderBottom: `1px solid ${C.border}`, verticalAlign: "top" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, textAlign: "center" }}>
                        <BrandLogo name={row.brand} size={40} />
                        <span style={{ fontFamily: DISPLAY, fontSize: 13, fontWeight: 700 }}>{row.brand}</span>
                      </div>
                    </td>
                    {platforms.map((p) => {
                      const cell = row.cells[p];
                      const posts = two ? `${cell.posts_a ?? 0} → ${cell.posts_b} posts` : `${cell.posts_b} posts`;
                      return (
                        <td key={p} title={`${row.brand} · ${p}: ${posts}${cell.change_pct != null ? ` (${signed(cell.change_pct)}%${change.basis === "per_day_rate" ? " per-day" : ""})` : ""}`} style={{ padding: "14px", borderBottom: `1px solid ${C.border}`, borderLeft: `1px solid ${C.border}`, verticalAlign: "top", lineHeight: 1.55, color: C.ink }}>
                          {cell.suppressed ? (
                            <span style={{ color: T.faint }}>— <span style={{ fontFamily: MONO, fontSize: 10 }}>{cell.posts_b} post{cell.posts_b === 1 ? "" : "s"}, too few to characterise</span></span>
                          ) : (
                            <>
                              <div style={{ marginBottom: cell.shifts.length ? 8 : 0 }}>{cell.text || `${posts}${cell.mix_b[0] ? `; ${cell.mix_b[0].type} ${cell.mix_b[0].pct}% of typed posts` : ""}.`}</div>
                              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{cell.shifts.map((s) => <ShiftBadge key={s.type} shift={s} />)}</div>
                            </>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </Reveal>
      ) : null}

      {/* ── 04 · Events (p6) ───────────────────────────────────────────── */}
      {tab === "events" ? (
      <Reveal key="events">
        <section {...panel("events")}>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(240px, 1fr) 2fr", gap: 28, alignItems: "start", marginBottom: 22 }}>
            <div id="ci-events"><Title line1="Key Takeaways —" line2="Events & Conferences" size={30} /></div>
            <p style={{ fontSize: 15, lineHeight: 1.65, color: C.ink, margin: 0 }}>
              {events.headline || `Five levers, each read from ${events.scope}: how brands amplify, activate, integrate creators and communities, educate, and showcase innovation.`}
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${events.pillars.length}, 1fr)`, gap: 18 }}>
            {events.pillars.map((pillar) => (
              <div key={pillar.title} style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 15, fontWeight: 700, color: C.primary, minHeight: 44, marginBottom: 12 }}>{pillar.title}</div>
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
                  {(pillar.points.length ? pillar.points : Object.entries(pillar.evidence).slice(0, 3).map(([k, v]) => `${k.replace(/_/g, " ")}: ${typeof v === "number" ? v : Array.isArray(v) ? v.map((x) => x.name || x).join(", ") || "none" : v}`)).map((point) => (
                    <li key={point} style={{ fontSize: 12.5, lineHeight: 1.55, color: C.ink }}>{point}</li>
                  ))}
                </ul>
                <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" style={{ margin: "14px 0 10px", color: T.faint }}><path d="M12 4v13m0 0l-5-5m5 5l5-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <div style={{ background: C.primary, color: "#fff", borderRadius: 12, padding: "16px 14px", fontSize: 13, fontWeight: 700, lineHeight: 1.55, minHeight: 92 }}>
                  {pillar.takeaway || <span style={{ opacity: 0.85, fontWeight: 500 }}>No takeaway written for this pillar.</span>}
                </div>
              </div>
            ))}
          </div>
          <p style={{ fontFamily: MONO, fontSize: 10, color: T.faint, margin: "10px 0 0" }}>Evidence scope: {events.scope}.</p>
        </section>
      </Reveal>
      ) : null}

      {/* ── Footer · provenance ───────────────────────────────────────── */}
      <p style={{ fontFamily: MONO, fontSize: 10.5, color: C.mutedFg, borderTop: `1px solid ${C.border}`, paddingTop: 12, margin: 0, lineHeight: 1.6 }}>
        Computed from {provenance.articles_tagged.toLocaleString()} tagged posts · {provenance.articles_used.toLocaleString()} dated
        {provenance.undated ? ` (${provenance.undated} undated excluded from period figures)` : ""} · {provenance.deduplicated} duplicate URL{provenance.deduplicated === 1 ? "" : "s"} removed ·
        cells under {provenance.min_cell_posts} posts not characterised · windows: {block.period_mode.replace(/_/g, " ")}
        {change.basis === "per_day_rate" ? " · changes on per-day rates" : ""} · {facts.creator_voice_share_pct}% of posts from creators
      </p>
    </div>
  );
}
