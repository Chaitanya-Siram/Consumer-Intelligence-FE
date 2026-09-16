/**
 * Industry Trends: Share of Voice — page 8 of the reference report. Matched
 * structurally: an executive-summary header, a grey panel holding the donut
 * (with its N total centred in the hole) and the full legend, then a plain
 * five-column deep-dive underneath — no card borders, no rainbow per-category
 * colour, just the report's blue and two bullet points each.
 */
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

import { ExecHeader, GreyPanel, EmptyLens, T, TOOLTIP_STYLE, fmtCompact } from "../shared.jsx";

const BLUE = "#1E40AF";
const RADIAN = Math.PI / 180;

const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.02) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function Lens2({ data }) {
  const lens = data?.industry_trends;
  const meta = data?.meta || {};
  if (!lens?.categories?.length) return <EmptyLens />;
  const rows = lens.categories.map((c) => ({ ...c, color: BLUE }));

  return (
    <div>
      <ExecHeader num="02" title="Industry Trends: Share of Voice" summary={lens.headline} />

      <GreyPanel>
        <div style={{ display: "grid", gridTemplateColumns: "220px 1fr 1fr", gap: 24, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.text2 }}>Key Insights</div>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>Industry Trends ({meta.window_label})</div>
          </div>

          <div style={{ position: "relative", height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={rows} cx="50%" cy="50%" innerRadius={70} outerRadius={120} dataKey="value" paddingAngle={1.5} labelLine={false} label={renderLabel} stroke="#F1F5F9" strokeWidth={2}>
                  {rows.map((entry, i) => (
                    <Cell key={entry.name} fill={BLUE} fillOpacity={1 - i * 0.055} />
                  ))}
                </Pie>
                <Tooltip {...TOOLTIP_STYLE} formatter={(v, _n, item) => [`${item.payload.pct}% (${v} mentions)`, item.payload.name]} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center", pointerEvents: "none" }}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 800, color: BLUE }}>N~{fmtCompact(lens.total)}</div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {rows.map((d) => (
              <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: BLUE, opacity: 1 - rows.indexOf(d) * 0.055, flexShrink: 0 }} />
                <span style={{ fontSize: 12.5, color: T.text2, flex: 1 }}>{d.name}</span>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: BLUE, fontFamily: "'Barlow Condensed', sans-serif" }}>{d.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </GreyPanel>

      {lens.top?.length ? (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(5, lens.top.length)}, 1fr)`, gap: 24, marginTop: 32 }}>
          {lens.top.map((item) => (
            <div key={item.name}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 26, fontWeight: 800, color: BLUE, lineHeight: 1 }}>{item.pct}%</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: BLUE, marginTop: 4, marginBottom: 10 }}>{item.name}</div>
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                {(item.drivers?.length ? item.drivers : [`${item.posts} posts; ${item.positive_text}.`]).map((b) => (
                  <li key={b} style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                    <span style={{ color: T.faint, fontSize: 12, lineHeight: 1.5, flexShrink: 0 }}>•</span>
                    <span style={{ fontSize: 12, color: T.text, lineHeight: 1.55 }}>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
