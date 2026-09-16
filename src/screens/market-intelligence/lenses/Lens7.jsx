/**
 * Brand Analysis — pages 18 (global) and 19+ (one page per brand) of the
 * reference report. Page 18: a flowing global narrative, a brand-share logo
 * grid and a product-association table, both on grey panels, plus two blue
 * takeaways. Page 19: per platform, a content-type mix chart AND one
 * write-up per content type ("Product Announcements/Launches (70%): ..."),
 * not a single sentence summarising the platform.
 */
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts";

import { ExecHeader, GreyPanel, BrandLogo, PlatformIcon, EmptyLens, T, colorAt } from "../shared.jsx";

const BLUE = "#1E40AF";
const TYPE_COLORS = {
  "Announcements/Launches": "#3b82f6",
  "Product Demos/Tutorials": "#10b981",
  "Sponsorship/Collab/Event": "#f59e0b",
  "Promotions/Giveaways": "#ec4899",
  "Customer Testimonials": "#8b5cf6",
  Campaigns: "#f97316",
};

function BarValueLabel({ x, y, width, height, value }) {
  return (
    <text x={x + width + 6} y={y + height / 2} dy={4} fontSize={10.5} fontWeight={700} fill="#334155" textAnchor="start">
      {value}%
    </text>
  );
}

function PlatformBar({ rows }) {
  if (!rows.length) return <div style={{ fontSize: 11, color: T.faint }}>No typed content on this platform.</div>;
  return (
    <ResponsiveContainer width="100%" height={rows.length * 26 + 4}>
      <BarChart data={rows.map((d) => ({ name: d.type, value: d.pct }))} layout="vertical" margin={{ left: 0, right: 34, top: 0, bottom: 0 }} barSize={13}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
        <XAxis type="number" domain={[0, 100]} hide />
        <YAxis type="category" dataKey="name" width={155} tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
        <Tooltip formatter={(v) => [`${v}%`]} contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 11 }} />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {rows.map((d) => (
            <Cell key={d.type} fill={TYPE_COLORS[d.type] ?? BLUE} />
          ))}
          <LabelList dataKey="value" content={BarValueLabel} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function Lens7({ data }) {
  const lens = data?.brand_analysis;
  const meta = data?.meta || {};
  const [active, setActive] = useState(0);
  if (!lens?.share?.length) return <EmptyLens label="No brand mentions were tagged in this session." />;
  const share = lens.share;
  const brands = lens.brands || [];
  const brand = brands[Math.min(active, brands.length - 1)];
  const brandColor = colorAt(active);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <ExecHeader num="07" title="Brand Key Findings: Global" summary={null} />

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 24 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {(lens.takeaways?.length ? lens.takeaways : [`${share[0].name} (${share[0].pct}%) leads all brand mentions in this session.`]).map((t) => (
            <p key={t} style={{ fontSize: 13.5, color: BLUE, lineHeight: 1.65, margin: 0, fontWeight: 500 }}>{t}</p>
          ))}
        </div>

        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "20px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          {(lens.global_paragraphs?.length
            ? lens.global_paragraphs
            : [`${share[0].name} leads brand mentions at ${share[0].pct}% (${share[0].value.toLocaleString()} posts)${share[1] && share[1].name !== "Others" ? `, ahead of ${share[1].name} at ${share[1].pct}%` : ""}.`]
          ).map((p, i) => (
            <p key={i} style={{ fontSize: 12.5, color: T.text2, lineHeight: 1.65, margin: i === 0 ? "0 0 12px" : "0 0 12px" }}>{p}</p>
          ))}
        </div>
      </div>

      <GreyPanel style={{ marginTop: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "20px 16px" }}>
          {share.map((b) => (
            <div key={b.name} style={{ textAlign: "center" }}>
              {b.name !== "Others" ? (
                <>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}><BrandLogo name={b.name} size={32} /></div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 800, color: BLUE }}>{b.pct}%</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.text2, textTransform: "uppercase", letterSpacing: "0.04em" }}>{b.name}</div>
                </>
              ) : (
                <>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 800, color: BLUE, marginTop: 40 }}>{b.pct}%</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.text2, textTransform: "uppercase", letterSpacing: "0.04em" }}>Others</div>
                </>
              )}
            </div>
          ))}
        </div>
      </GreyPanel>

      {lens.associations?.length ? (
        <GreyPanel style={{ marginTop: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: BLUE, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 16 }}>
            Top Associations of Brands with Product Trends
          </div>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(5, lens.associations.length)}, 1fr)`, gap: 20 }}>
            {lens.associations.map(({ category, brands: names }) => (
              <div key={category}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: T.text, marginBottom: 10 }}>{category}</div>
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                  {names.map((b) => (
                    <li key={b} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: T.text2 }}>
                      <BrandLogo name={b} size={16} />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </GreyPanel>
      ) : null}

      {brand ? (
        <div style={{ marginTop: 28 }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 17, fontWeight: 700, color: T.text, marginBottom: 12 }}>Brand Platform Breakdown</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            {brands.map((b, i) => (
              <button key={b.name} type="button" onClick={() => setActive(i)} style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 14px", borderRadius: 8, border: active === i ? `1.5px solid ${colorAt(i)}` : `1px solid ${T.border}`, background: active === i ? `${colorAt(i)}18` : T.surface, color: active === i ? colorAt(i) : T.muted, cursor: "pointer", fontSize: 13, fontWeight: active === i ? 700 : 400, fontFamily: "'Inter', sans-serif" }}>
                <BrandLogo name={b.name} size={20} />
                {b.name}
              </button>
            ))}
          </div>

          <div style={{ background: T.surface, border: `1px solid ${brandColor}44`, borderRadius: 12, padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
              <BrandLogo name={brand.name} size={44} />
              <div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 800, color: T.text }}>{brand.name}</div>
                <div style={{ fontSize: 12, color: brandColor, fontWeight: 600, marginTop: 2 }}>{brand.mentions.toLocaleString()} mentions · {meta.window_label}</div>
              </div>
            </div>
            {brand.summary ? (
              <p style={{ fontSize: 13, color: T.text2, lineHeight: 1.65, margin: "0 0 20px", background: `${brandColor}0c`, borderLeft: `3px solid ${brandColor}`, padding: "10px 14px", borderRadius: "0 8px 8px 0" }}>{brand.summary}</p>
            ) : null}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
              {brand.platforms.map((p) => (
                <div key={p.platform} style={{ background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 10, padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: T.text2 }}>
                      <PlatformIcon platform={p.platform} size={16} rounded={5} />
                      {p.platform}
                    </span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: T.muted, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4, padding: "2px 6px" }}>N={p.n}</span>
                  </div>
                  <PlatformBar rows={p.data} />
                  {p.data.some((t) => t.text) ? (
                    <ul style={{ margin: "12px 0 0", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8, borderTop: `1px solid ${T.border}`, paddingTop: 10 }}>
                      {p.data.filter((t) => t.text).map((t) => (
                        <li key={t.type} style={{ fontSize: 11.5, color: T.text2, lineHeight: 1.55 }}>
                          <strong style={{ color: T.text }}>{t.type} ({t.pct}%):</strong> {t.text}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {p.quote ? (
                    <p style={{ fontSize: 11, color: T.muted, fontStyle: "italic", margin: "10px 0 0", borderTop: `1px solid ${T.border}`, paddingTop: 8, lineHeight: 1.5 }}>
                      "{p.quote}"
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
