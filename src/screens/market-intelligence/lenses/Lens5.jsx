import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from "recharts";

import { SectionTitle, StatRow, EmptyLens, ChartBox, T, TOOLTIP_STYLE, GRID_PROPS, AXIS_TICK, colorAt } from "../shared.jsx";

const COLOR = "#ec4899";

function ThemeCard({ pct, label, color, text }) {
  return (
    <div style={{ background: T.surface, border: `1px solid ${color}33`, borderLeft: `4px solid ${color}`, borderRadius: 8, padding: "16px 18px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 26, fontWeight: 800, color, lineHeight: 1 }}>{pct}%</span>
        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, fontWeight: 700, color, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</span>
      </div>
      <p style={{ margin: 0, fontSize: 12.5, color: T.text2, lineHeight: 1.6 }}>{text}</p>
    </div>
  );
}

const renderLabel = ({ x, y, width, value }) =>
  value ? (
    <text x={x + width + 4} y={y + 10} fontSize={10} fill="#64748b" fontFamily="'JetBrains Mono', monospace" fontWeight={600}>
      {value}%
    </text>
  ) : null;

export default function Lens5({ data }) {
  const lens = data?.key_themes;
  const [tab, setTab] = useState("all");
  if (!lens?.rows?.length) return <EmptyLens label="The tagger produced no sub-themes for this session." />;
  const comparative = Boolean(lens.period_b);
  const rows = tab === "all" ? lens.rows : lens.rows.slice(0, 6);
  const lead = lens.rows[0];
  const mover = comparative ? [...lens.rows].sort((a, b) => (b.b_pct - b.a_pct) - (a.b_pct - a.a_pct))[0] : null;

  return (
    <div style={{ background: T.bg, padding: 32, fontFamily: "'Inter', sans-serif" }}>
      <SectionTitle num="05" color={COLOR} title="Key Themes Of Discussion" subtitle={comparative ? `Share of conversation themes — ${lens.period_b} vs ${lens.period_a}` : `Share of conversation themes across ${lens.total.toLocaleString()} themed posts`} />

      <StatRow
        color={COLOR}
        items={[
          { label: "Top Theme", value: `${lead.pct}% ${lead.theme}` },
          ...(mover ? [{ label: "Fastest Growing", value: `${mover.theme} ${mover.b_pct - mover.a_pct >= 0 ? "+" : ""}${(mover.b_pct - mover.a_pct).toFixed(1)}pp` }] : []),
          { label: "Themed Posts", value: lens.total.toLocaleString() },
          ...(comparative ? [{ label: "Periods", value: `${lens.period_a} → ${lens.period_b}` }] : []),
        ]}
      />

      {lens.headline ? (
        <div style={{ background: "#fdf2f8", border: `1px solid ${COLOR}33`, borderLeft: `4px solid ${COLOR}`, borderRadius: 8, padding: "12px 18px", marginTop: 20 }}>
          <p style={{ fontSize: 13, color: T.text2, lineHeight: 1.7, margin: 0 }}>{lens.headline}</p>
        </div>
      ) : null}

      <div style={{ display: "flex", gap: 8, marginTop: 24, marginBottom: 20 }}>
        {[{ key: "all", label: "All Themes" }, { key: "top", label: "Top 6" }].map(({ key, label }) => (
          <button key={key} type="button" onClick={() => setTab(key)} style={{ padding: "8px 20px", borderRadius: 20, border: tab === key ? "none" : `1px solid ${T.border2}`, background: tab === key ? COLOR : T.surface, color: tab === key ? "#fff" : T.text2, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
            {label}
          </button>
        ))}
      </div>

      <ChartBox
        title="Themes by Share of Conversation (%)"
        subtitle={comparative ? `${lens.period_a} vs ${lens.period_b}` : "Share of themed posts"}
        right={<span style={{ fontSize: 11, color: T.muted, background: "#fef9c3", border: "1px solid #fde047", borderRadius: 6, padding: "3px 10px", fontStyle: "italic" }}>One sub-theme per post</span>}
      >
        <ResponsiveContainer width="100%" height={rows.length * 56 + 40}>
          <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 60, left: 4, bottom: 0 }} barCategoryGap="28%" barGap={4}>
            <CartesianGrid {...GRID_PROPS} horizontal={false} />
            <XAxis type="number" tick={AXIS_TICK} axisLine={false} tickLine={false} unit="%" />
            <YAxis type="category" dataKey="theme" tick={{ fontSize: 12, fill: "#334155" }} axisLine={false} tickLine={false} width={200} />
            <Tooltip {...TOOLTIP_STYLE} formatter={(v, name) => [`${v}%`, name === "a_pct" ? lens.period_a : name === "b_pct" ? lens.period_b : "Share"]} />
            {comparative ? (
              <>
                <Legend formatter={(v) => (v === "a_pct" ? lens.period_a : lens.period_b)} wrapperStyle={{ fontSize: 12, color: T.text2, paddingTop: 8 }} />
                <Bar dataKey="a_pct" name="a_pct" fill="#c4b5fd" radius={[0, 3, 3, 0]}><LabelList content={renderLabel} /></Bar>
                <Bar dataKey="b_pct" name="b_pct" fill="#1e3a5f" radius={[0, 3, 3, 0]}><LabelList content={renderLabel} /></Bar>
              </>
            ) : (
              <Bar dataKey="pct" name="pct" fill="#1e3a5f" radius={[0, 3, 3, 0]}><LabelList content={renderLabel} /></Bar>
            )}
          </BarChart>
        </ResponsiveContainer>
      </ChartBox>

      {lens.insights?.length ? (
        <>
          <div style={{ marginTop: 28 }}>
            <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 700, color: T.text, margin: "0 0 14px", letterSpacing: "0.02em" }}>Key Theme Insights — Top Drivers</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {lens.insights.slice(0, 4).map((ins, i) => (
                <ThemeCard key={ins.theme} pct={ins.pct} label={ins.theme} color={colorAt(i)} text={ins.text} />
              ))}
            </div>
          </div>
          {lens.insights.length > 4 ? (
            <div style={{ marginTop: 24 }}>
              <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 700, color: T.text, margin: "0 0 14px", letterSpacing: "0.02em" }}>Additional Drivers</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                {lens.insights.slice(4).map((ins, i) => (
                  <ThemeCard key={ins.theme} pct={ins.pct} label={ins.theme} color={colorAt(i + 4)} text={ins.text} />
                ))}
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
