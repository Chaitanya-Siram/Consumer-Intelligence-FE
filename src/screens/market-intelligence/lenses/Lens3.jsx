/**
 * From Then to Now: Tracking Industry Trends Across Semesters — pages 9-11 of
 * the reference report, one slide per page. Matched structurally: an
 * executive-summary header (title carries the "(n/3)" suffix, per page), a
 * grey panel with the two period badges and the grouped bar chart, and a
 * plain row of category write-ups underneath — no card borders, no delta
 * chips, just a bold name and a paragraph, like the source.
 */
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from "recharts";

import { ExecHeader, GreyPanel, EmptyLens, T, TOOLTIP_STYLE } from "../shared.jsx";

const COLOR_A = "#9CA3AF";
const COLOR_B = "#1E3A8A";

function ValueLabel({ fill }) {
  return ({ x, y, width, value }) =>
    value ? (
      <text x={x + width / 2} y={y - 6} textAnchor="middle" fontSize={11} fontWeight={700} fill={fill}>
        {value}%
      </text>
    ) : null;
}

export default function Lens3({ data }) {
  const lens = data?.trend_tracking;
  const [slide, setSlide] = useState(0);
  if (!lens?.slides?.length) {
    return <EmptyLens label="This session's posts fall in a single month, so there is no earlier period to compare against." />;
  }
  const current = lens.slides[Math.min(slide, lens.slides.length - 1)];

  return (
    <div>
      <ExecHeader
        num="03"
        title={`From Then to Now: Tracking Industry Trends Across Semesters(${slide + 1}/${lens.slides.length})`}
        summary={current.summary || lens.headline}
      />

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {lens.slides.map((s, i) => (
          <button
            key={s.label}
            type="button"
            onClick={() => setSlide(i)}
            style={{ padding: "7px 16px", borderRadius: 8, border: slide === i ? `2px solid ${COLOR_B}` : `1px solid ${T.border}`, background: slide === i ? "#eff6ff" : T.surface, color: slide === i ? COLOR_B : T.muted, cursor: "pointer", fontSize: 12.5, fontWeight: slide === i ? 700 : 400, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.03em" }}
          >
            {s.label}
          </button>
        ))}
      </div>

      <GreyPanel>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 40, marginBottom: 16, flexWrap: "wrap" }}>
          <div style={{ textAlign: "right", whiteSpace: "nowrap" }}>
            <div style={{ fontSize: 12, color: T.text2, display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <span style={{ width: 12, height: 12, background: COLOR_A, borderRadius: 2, display: "inline-block", flexShrink: 0 }} />
              SoV for {lens.period_a} Mentions
            </div>
            <div style={{ display: "inline-block", background: `${COLOR_A}33`, color: T.text2, fontSize: 11, fontWeight: 700, borderRadius: 5, padding: "3px 10px" }}>
              N ({lens.period_a}) ~{lens.n_a >= 1000 ? `${(lens.n_a / 1000).toFixed(1)}K` : lens.n_a}
            </div>
          </div>
          <div style={{ textAlign: "right", whiteSpace: "nowrap" }}>
            <div style={{ fontSize: 12, color: T.text2, display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <span style={{ width: 12, height: 12, background: COLOR_B, borderRadius: 2, display: "inline-block", flexShrink: 0 }} />
              SoV for {lens.period_b} Mentions
            </div>
            <div style={{ display: "inline-block", background: COLOR_B, color: "#fff", fontSize: 11, fontWeight: 700, borderRadius: 5, padding: "3px 10px" }}>
              N ({lens.period_b}) ~{lens.n_b >= 1000 ? `${(lens.n_b / 1000).toFixed(1)}K` : lens.n_b}
            </div>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={current.rows} margin={{ top: 24, left: 10, right: 20, bottom: 10 }} barGap={4} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="category" tick={{ fontSize: 11, fill: T.text2 }} axisLine={{ stroke: "#cbd5e1" }} tickLine={false} interval={0} />
            <YAxis hide domain={[0, "dataMax + 5"]} />
            <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [`${v}%`, ""]} />
            <Bar dataKey="a_pct" name={lens.period_a} fill={COLOR_A} radius={[3, 3, 0, 0]} barSize={26}>
              <LabelList content={ValueLabel({ fill: T.text2 })} />
            </Bar>
            <Bar dataKey="b_pct" name={lens.period_b} fill={COLOR_B} radius={[3, 3, 0, 0]} barSize={26}>
              <LabelList content={ValueLabel({ fill: COLOR_B })} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </GreyPanel>

      <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(4, current.rows.length)}, 1fr)`, gap: 24, marginTop: 28 }}>
        {current.rows.map((item) => (
          <div key={item.category}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 8 }}>{item.category}</div>
            <p style={{ color: T.text2, fontSize: 12, margin: 0, lineHeight: 1.6 }}>
              {item.insight || `${item.a_pct}% of categorised conversation in ${lens.period_a} → ${item.b_pct}% in ${lens.period_b}.`}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
