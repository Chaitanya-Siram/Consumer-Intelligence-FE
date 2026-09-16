import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

import { InsightCard, SectionTitle, StatRow, BrandLogo, PlatformIcon, EmptyLens, ChartBox, T, colorAt, fmtCompact } from "../shared.jsx";

const COLOR = "#7c3aed";

function StatPill({ label, value }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", background: T.surface2, borderRadius: 8, padding: "6px 12px", minWidth: 54 }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: T.text, fontFamily: "'Barlow Condensed', sans-serif" }}>{value}</span>
      <span style={{ fontSize: 10, color: T.muted, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.04em" }}>{label}</span>
    </div>
  );
}

function ProductCard({ brand, product, platform, reach, likes, shares, views, url, blurb }) {
  const title = url ? <a href={url} target="_blank" rel="noreferrer" style={{ color: T.text, textDecoration: "none" }}>{product}</a> : product;
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        {brand ? <BrandLogo name={brand} size={32} /> : <PlatformIcon platform={platform} size={32} rounded={7} />}
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: T.muted, fontFamily: "'JetBrains Mono', monospace", marginBottom: 2 }}>
            {brand || "Unbranded"} · <PlatformIcon platform={platform} size={12} rounded={3} /> {platform}
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, lineHeight: 1.4 }}>{title}</div>
        </div>
      </div>
      {blurb ? <p style={{ fontSize: 11.5, color: T.text2, margin: 0, lineHeight: 1.55 }}>{blurb}</p> : null}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {reach ? <StatPill label="REACH" value={fmtCompact(reach)} /> : null}
        {likes ? <StatPill label="LIKES" value={fmtCompact(likes)} /> : null}
        {shares ? <StatPill label="SHARES" value={fmtCompact(shares)} /> : null}
        {views ? <StatPill label="VIEWS" value={fmtCompact(views)} /> : null}
        {!reach && !likes && !shares && !views ? <span style={{ fontSize: 11, color: T.faint }}>No engagement data on this post</span> : null}
      </div>
    </div>
  );
}

export default function Lens8({ data }) {
  const lens = data?.new_launches;
  const meta = data?.meta || {};
  if (!lens?.total) return <EmptyLens label="No posts in this session read as a product launch (launch, introducing, now available, …)." />;
  const categories = lens.categories.map((c, i) => ({ ...c, color: c.name === "Others" ? "#94a3b8" : colorAt(i) }));
  const named = categories.filter((c) => c.name !== "Others");
  const lead = named[0];

  return (
    <div>
      <SectionTitle num="08" color={COLOR} title="New Launches" subtitle={`Product launch posts by category — ${lens.total.toLocaleString()} launch posts · ${meta.window_label}`} />

      <StatRow
        color={COLOR}
        items={[
          { label: "Launch Posts", value: lens.total.toLocaleString() },
          ...(lead ? [{ label: "Top Category", value: `${lead.name} ${lead.pct}%` }] : []),
          { label: "Categories", value: String(named.length) },
          { label: "Period", value: meta.window_label },
        ]}
      />

      {lens.headline ? (
        <div style={{ background: "#f5f3ff", border: `1px solid ${COLOR}33`, borderLeft: `4px solid ${COLOR}`, borderRadius: 8, padding: "14px 18px", marginTop: 20 }}>
          <p style={{ fontSize: 13, color: T.text2, lineHeight: 1.7, margin: 0 }}>{lens.headline}</p>
        </div>
      ) : null}

      <ChartBox title="New Launches — Product Trend Distribution" subtitle="% share of launch posts by product category" style={{ marginTop: 24 }}>
        <ResponsiveContainer width="100%" height={categories.length * 40 + 40}>
          <BarChart data={categories} layout="vertical" margin={{ left: 150, right: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
            <XAxis type="number" tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" width={155} tick={{ fontSize: 12, fill: "#334155" }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v, _n, item) => [`${v}% (${item.payload.value} posts)`, "Share"]} contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="pct" radius={[0, 6, 6, 0]} label={{ position: "right", formatter: (v) => `${v}%`, fontSize: 11, fill: "#334155" }}>
              {categories.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartBox>

      <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 28 }}>
        {named.map((c) => (
          <div key={c.name} style={{ background: T.surface, border: `1px solid ${c.color}33`, borderLeft: `3px solid ${c.color}`, borderRadius: 10, padding: "18px 20px" }}>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 15, fontWeight: 700, color: c.color, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 14 }}>
              {c.name} — {c.pct}%
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
              {(lens.products[c.name] || []).map((p, i) => (
                <ProductCard key={`${p.url || p.product}-${i}`} {...p} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {lead ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 24 }}>
          <InsightCard color={lead.color} title={`${lead.name} leads launches`}>
            {lead.name} accounts for {lead.pct}% of the {lens.total} launch posts in this session ({lead.value} posts).
          </InsightCard>
          {named[1] ? (
            <InsightCard color={named[1].color} title={`${named[1].name} follows`}>
              {named[1].name} is the second most-launched category at {named[1].pct}% ({named[1].value} posts).
            </InsightCard>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
