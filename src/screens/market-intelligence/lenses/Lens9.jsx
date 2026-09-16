import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

import { InsightCard, SectionTitle, StatRow, BrandLogo, PlatformIcon, EmptyLens, ChartBox, T, platformColor, fmtCompact } from "../shared.jsx";

const COLOR = "#e11d48";

function MetricCell({ value, align = "right" }) {
  return (
    <td style={{ padding: "10px 14px", fontSize: 13, color: T.text, borderBottom: `1px solid ${T.border}`, textAlign: align, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600 }}>
      {value}
    </td>
  );
}

export default function Lens9({ data }) {
  const lens = data?.campaigns;
  const meta = data?.meta || {};
  const [active, setActive] = useState(0);
  const campaigns = lens?.campaigns || [];
  if (!campaigns.length) {
    return (
      <div>
        <SectionTitle num="09" color={COLOR} title="Campaigns" subtitle="Brand campaign analysis — social engagement, channel performance and audience sentiment" />
        <EmptyLens label="No campaign hashtag appears on three or more posts in this session, so there is no campaign to report on." />
      </div>
    );
  }
  const c = campaigns[Math.min(active, campaigns.length - 1)];
  const top = [...c.channels].sort((a, b) => b.total_engagement - a.total_engagement)[0];
  const pos = c.sentiment.find((s) => s.tone === "pos")?.value ?? 0;
  const neg = c.sentiment.find((s) => s.tone === "neg")?.value ?? 0;

  return (
    <div>
      <SectionTitle num="09" color={COLOR} title="Campaigns" subtitle={`Hashtag campaigns in the conversation — engagement, channel performance and sentiment · ${meta.window_label}`} />

      <StatRow
        color={COLOR}
        items={[
          { label: "Campaign", value: c.name },
          ...(c.brand ? [{ label: "Brand", value: <><BrandLogo name={c.brand} size={18} /> {c.brand}</> }] : []),
          { label: "First seen", value: c.first_seen || "—" },
          { label: "Posts", value: String(c.posts) },
          ...(top ? [{ label: "Top Platform", value: `${top.platform} ${fmtCompact(top.total_engagement)} eng.` }] : []),
        ]}
      />

      {campaigns.length > 1 ? (
        <div style={{ display: "flex", gap: 8, marginTop: 20, flexWrap: "wrap" }}>
          {campaigns.map((cp, i) => (
            <button key={cp.name} type="button" onClick={() => setActive(i)} style={{ padding: "7px 14px", borderRadius: 8, border: active === i ? `1.5px solid ${COLOR}` : `1px solid ${T.border}`, background: active === i ? `${COLOR}14` : T.surface, color: active === i ? COLOR : T.muted, cursor: "pointer", fontSize: 13, fontWeight: active === i ? 700 : 400 }}>
              {cp.name} · {cp.posts}
            </button>
          ))}
        </div>
      ) : null}

      <div style={{ background: T.surface, border: `1px solid ${COLOR}33`, borderLeft: `4px solid ${COLOR}`, borderRadius: 12, padding: 24, marginTop: 24, boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
          {c.brand ? <BrandLogo name={c.brand} size={48} /> : null}
          <div>
            <div style={{ fontSize: 11, color: T.muted, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em", marginBottom: 4 }}>
              {(c.brand || "CAMPAIGN").toUpperCase()} · {c.first_seen ? `FIRST SEEN ${c.first_seen}` : ""}{c.last_seen && c.last_seen !== c.first_seen ? ` – ${c.last_seen}` : ""}
            </div>
            <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 26, fontWeight: 800, color: T.text, margin: 0, letterSpacing: "0.02em" }}>{c.name}</h3>
          </div>
        </div>
        <p style={{ fontSize: 14, color: T.text2, lineHeight: 1.75, margin: 0, whiteSpace: "pre-line" }}>{c.description || c.verdict}</p>
      </div>

      <ChartBox title="Channel Engagement Metrics" subtitle="Summed across every post carrying the hashtag" style={{ marginTop: 24 }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: T.surface2 }}>
                {["Platform", "Posts", "Likes", "Shares", "Views", "Total Engagement"].map((h) => (
                  <th key={h} style={{ padding: "10px 14px", fontSize: 11, color: T.muted, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.06em", textAlign: h === "Platform" ? "left" : "right", borderBottom: `2px solid ${T.border}`, whiteSpace: "nowrap" }}>
                    {h.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {c.channels.map((row, i) => (
                <tr key={row.platform}>
                  <td style={{ padding: "10px 14px", borderBottom: `1px solid ${T.border}` }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: T.text }}>
                      <PlatformIcon platform={row.platform} size={18} rounded={5} />
                      {row.platform}
                    </span>
                  </td>
                  <MetricCell value={String(row.posts)} />
                  <MetricCell value={row.likes ? row.likes.toLocaleString() : "N/A"} />
                  <MetricCell value={row.shares ? row.shares.toLocaleString() : "N/A"} />
                  <MetricCell value={row.views ? row.views.toLocaleString() : "N/A"} />
                  <MetricCell value={row.total_engagement ? row.total_engagement.toLocaleString() : "N/A"} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartBox>

      {c.channels.some((r) => r.total_engagement) ? (
        <ChartBox title="Engagement by Platform" subtitle={`Total engagement per channel for ${c.name}`} style={{ marginTop: 24 }}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={c.channels} margin={{ left: 10, right: 50 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="platform" tick={{ fontSize: 12, fill: "#334155" }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmtCompact} tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => [v.toLocaleString(), "Engagement"]} contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="total_engagement" radius={[6, 6, 0, 0]} label={{ position: "top", formatter: fmtCompact, fontSize: 11, fill: "#334155" }}>
                {c.channels.map((row, i) => (
                  <Cell key={row.platform} fill={platformColor(row.platform, i)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 24 }}>
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderLeft: "4px solid #16a34a", borderRadius: 10, padding: "18px 20px" }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, fontWeight: 700, color: "#15803d", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>Positive sentiment · {pos}%</div>
          {c.positive_synthesis ? <p style={{ fontSize: 12.5, color: "#166534", lineHeight: 1.6, margin: "0 0 10px" }}>{c.positive_synthesis}</p> : null}
          <p style={{ fontSize: 13, color: "#166534", lineHeight: 1.6, margin: 0, fontStyle: c.positive_quote ? "italic" : "normal" }}>
            {c.positive_quote ? `“${c.positive_quote}”` : "No positive post in this campaign."}
          </p>
        </div>
        <div style={{ background: "#fff1f2", border: "1px solid #fecdd3", borderLeft: "4px solid #dc2626", borderRadius: 10, padding: "18px 20px" }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, fontWeight: 700, color: "#dc2626", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>Negative sentiment · {neg}%</div>
          {c.negative_synthesis ? <p style={{ fontSize: 12.5, color: "#991b1b", lineHeight: 1.6, margin: "0 0 10px" }}>{c.negative_synthesis}</p> : null}
          <p style={{ fontSize: 13, color: "#991b1b", lineHeight: 1.6, margin: 0, fontStyle: c.negative_quote ? "italic" : "normal" }}>
            {c.negative_quote ? `“${c.negative_quote}”` : "No negative post in this campaign."}
          </p>
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <InsightCard color={COLOR} title="Overall Verdict">{c.verdict}</InsightCard>
      </div>
    </div>
  );
}
