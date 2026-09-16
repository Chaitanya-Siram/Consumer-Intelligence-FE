import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from "recharts";

import { SectionTitle, StatRow, EmptyLens, ChartBox, T, TOOLTIP_STYLE, GRID_PROPS, AXIS_TICK, fmtCompact } from "../shared.jsx";

const COLOR = "#0891b2";

const CustomDot = ({ cx, cy }) => <circle cx={cx} cy={cy} r={5} fill="#3b82f6" stroke="#fff" strokeWidth={2} />;
const CustomLabel = ({ x, y, value }) => (
  <text x={x} y={y - 12} textAnchor="middle" fontSize={11} fontWeight={700} fill="#1d4ed8" fontFamily="'JetBrains Mono', monospace">
    {fmtCompact(value)}
  </text>
);

export default function Lens4({ data }) {
  const lens = data?.volume_trendline;
  const meta = data?.meta || {};
  if (!lens?.months?.length) return <EmptyLens label="No dated posts in this session." />;
  const first = lens.months[0];
  const last = lens.months[lens.months.length - 1];

  return (
    <div style={{ background: T.bg, padding: 32, fontFamily: "'Inter', sans-serif" }}>
      <SectionTitle num="04" color={COLOR} title="Volume Trendline" subtitle={`Monthly conversation volume — ${first.month} to ${last.month} · ${meta.window_label}`} />

      <StatRow
        color={COLOR}
        items={[
          { label: "Total Conversations", value: lens.total.toLocaleString() },
          { label: "Peak Month", value: `${lens.peak.month} ${fmtCompact(lens.peak.value)}` },
          { label: "Lowest", value: `${lens.low.month} ${fmtCompact(lens.low.value)}` },
          ...(lens.growth_pct != null ? [{ label: `Change ${lens.growth_from}→${lens.growth_to}`, value: `${lens.growth_pct > 0 ? "+" : ""}${lens.growth_pct}%` }] : []),
        ]}
      />

      {lens.headline ? (
        <div style={{ background: "#ecfeff", border: `1px solid ${COLOR}33`, borderLeft: `4px solid ${COLOR}`, borderRadius: 8, padding: "14px 18px", marginTop: 20 }}>
          <p style={{ fontSize: 13, color: T.text2, lineHeight: 1.7, margin: 0 }}>{lens.headline}</p>
        </div>
      ) : null}

      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "18px 22px", marginTop: 16, fontSize: 13, color: T.text2, lineHeight: 1.65 }}>
        Across {lens.months.length} month{lens.months.length === 1 ? "" : "s"}, conversation peaked in {lens.peak.month} at {lens.peak.value.toLocaleString()} posts and was quietest in{" "}
        {lens.low.month} at {lens.low.value.toLocaleString()}.
        {lens.growth_pct != null ? ` Volume ${lens.growth_pct >= 0 ? "rose" : "fell"} ${Math.abs(lens.growth_pct)}% from ${lens.growth_from} to ${lens.growth_to}.` : ""}
        {lens.partial_month ? ` ${lens.partial_month} is a partial month — the data stops part-way through it, so it is shown but not counted as a low or a trend endpoint.` : ""}
      </div>

      {lens.drivers?.length ? (
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "18px 22px", marginTop: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: COLOR, marginBottom: 8, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.04em", textTransform: "uppercase" }}>
            Conversation Trends
          </div>
          <ul style={{ margin: 0, padding: "0 0 0 18px", display: "flex", flexDirection: "column", gap: 10 }}>
            {lens.drivers.map((text) => (
              <li key={text} style={{ fontSize: 13, color: T.text2, lineHeight: 1.6 }}>{text}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {lens.driver_panels?.length ? (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${lens.driver_panels.length}, 1fr)`, gap: 16, marginTop: 16 }}>
          {lens.driver_panels.map((panel) => (
            <div key={panel.title} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "16px 18px" }}>
              <div style={{ fontWeight: 700, fontSize: 12.5, color: COLOR, marginBottom: 6 }}>{panel.title}</div>
              <p style={{ fontSize: 12.5, color: T.text2, margin: 0, lineHeight: 1.6 }}>{panel.text}</p>
            </div>
          ))}
        </div>
      ) : null}

      <ChartBox
        title="Monthly Conversation Volume"
        subtitle={`${first.month} to ${last.month}`}
        right={<span style={{ fontSize: 12, color: "#0369a1", fontFamily: "'JetBrains Mono', monospace", background: "#e0f2fe", border: "1px solid #bae6fd", borderRadius: 6, padding: "3px 10px", fontWeight: 700 }}>N = {fmtCompact(lens.total)}</span>}
        style={{ marginTop: 24, background: "#f8fafc" }}
      >
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={lens.months} margin={{ top: 36, right: 24, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="blueGradL4" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid {...GRID_PROPS} />
            <XAxis dataKey="month" tick={AXIS_TICK} axisLine={false} tickLine={false} />
            <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} tickFormatter={fmtCompact} width={52} />
            <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [v.toLocaleString(), "Conversations"]} />
            <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2.5} fill="url(#blueGradL4)" dot={<CustomDot />} activeDot={{ r: 7, fill: "#1d4ed8" }}>
              <LabelList content={<CustomLabel />} />
            </Area>
          </AreaChart>
        </ResponsiveContainer>
        <p style={{ textAlign: "right", fontSize: 11, color: T.muted, margin: "8px 0 0", fontFamily: "'JetBrains Mono', monospace" }}>
          {lens.peak.month}: {lens.peak.value.toLocaleString()} · N = {lens.total.toLocaleString()} total
        </p>
      </ChartBox>
    </div>
  );
}
