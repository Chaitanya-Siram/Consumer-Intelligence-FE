import { SectionTitle, BrandLogo, RegionFlag, EmptyLens, T, colorAt } from "../shared.jsx";

const COLOR = "#059669";
const card = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 };

export default function Lens6({ data }) {
  const lens = data?.voice_of_user;
  const meta = data?.meta || {};
  if (!lens?.top_brands?.length && !lens?.product_trends?.length) return <EmptyLens />;
  const products = lens.product_trends || [];
  const lead = products[0];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <SectionTitle num="06" color={COLOR} title="Voice of User Analysis" subtitle={`Global brand activity, product trend share and regional preferences — ${meta.window_label}`} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 24, marginTop: 8 }}>
        <div style={card}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.12em", color: COLOR, textTransform: "uppercase", marginBottom: 12 }}>Global Summary</div>
          {lens.headline ? (
            <p style={{ fontSize: 13, color: T.text2, lineHeight: 1.7, margin: 0, whiteSpace: "pre-line" }}>{lens.headline}</p>
          ) : (
            <>
              {lead ? (
                <p style={{ fontSize: 13, color: T.text2, lineHeight: 1.7, margin: 0 }}>
                  {lead.name} ({lead.pct}%) leads product conversation{products[1] ? `, followed by ${products[1].name} (${products[1].pct}%)` : ""}.
                </p>
              ) : null}
              {lens.top_brands?.length ? (
                <p style={{ fontSize: 13, color: T.text2, lineHeight: 1.7, margin: "14px 0 0" }}>
                  {lens.top_brands.map((b) => b.name).join(", ")} are the most-mentioned brands, holding{" "}
                  {lens.top_brands.reduce((t, b) => t + b.share, 0).toFixed(1)}% of brand mentions between them.
                </p>
              ) : null}
            </>
          )}
          {lens.regional_trends?.length ? (
            <div style={{ marginTop: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.text, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Regional Trends</div>
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                {lens.regional_trends.map((t) => (
                  <li key={t} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ flexShrink: 0, width: 6, height: 6, borderRadius: "50%", background: COLOR, marginTop: 6 }} />
                    <span style={{ fontSize: 12, color: T.text2, lineHeight: 1.6 }}>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={card}>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 17, fontWeight: 700, color: T.text, marginBottom: 4 }}>Brands Activity</div>
            <p style={{ fontSize: 12, color: T.muted, margin: "0 0 16px" }}>The most-mentioned brands in this session</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {lens.top_brands.map((b, i) => (
                <div key={b.name} style={{ border: `1px solid ${colorAt(i)}33`, borderLeft: `3px solid ${colorAt(i)}`, borderRadius: 8, padding: "12px 14px", background: `${colorAt(i)}08` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <BrandLogo name={b.name} size={30} />
                    <div>
                      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 700, color: T.text }}>{b.name}</div>
                      <div style={{ fontSize: 11, color: colorAt(i), fontWeight: 600 }}>{b.tagline}</div>
                    </div>
                  </div>
                  <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 4 }}>
                    {b.bullets.map((bullet) => (
                      <li key={bullet} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                        <span style={{ flexShrink: 0, color: colorAt(i), fontSize: 14, lineHeight: 1.4 }}>•</span>
                        <span style={{ fontSize: 12, color: T.text2, lineHeight: 1.55 }}>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {products.length ? (
            <div style={card}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 17, fontWeight: 700, color: T.text, marginBottom: 4 }}>Product Trends</div>
              <p style={{ fontSize: 12, color: T.muted, margin: "0 0 16px" }}>Share of categorised product conversation</p>
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${products.length}, 1fr)`, gap: 12 }}>
                {products.map((p, i) => (
                  <div key={p.name} style={{ background: `${colorAt(i + 3)}0d`, border: `1px solid ${colorAt(i + 3)}33`, borderTop: `3px solid ${colorAt(i + 3)}`, borderRadius: 8, padding: "14px 12px" }}>
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 38, fontWeight: 800, color: colorAt(i + 3), lineHeight: 1, marginBottom: 4 }}>{p.pct}%</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 6 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.5 }}>{p.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {lens.regional_prefs?.length ? (
        <div style={{ ...card, marginTop: 20 }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 17, fontWeight: 700, color: T.text, marginBottom: 4 }}>Regional Brand Preferences</div>
          <p style={{ fontSize: 12, color: T.muted, margin: "0 0 16px" }}>Most-mentioned brand per region and what drives its conversation</p>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(7, lens.regional_prefs.length)}, 1fr)`, gap: 10 }}>
            {lens.regional_prefs.map((r, i) => (
              <div key={r.region} style={{ background: T.surface2, border: `1px solid ${colorAt(i)}33`, borderTop: `3px solid ${colorAt(i)}`, borderRadius: 8, padding: "12px 10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: T.muted, letterSpacing: "0.08em", marginBottom: 8, textTransform: "uppercase" }}>
                  <RegionFlag iso={r.iso} size={16} />
                  {r.region}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <BrandLogo name={r.brand} size={22} />
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, fontWeight: 700, color: T.text }}>{r.brand}</span>
                </div>
                <div style={{ fontSize: 10, color: T.muted, lineHeight: 1.5 }}>{r.share}% of the region's brand mentions. {r.driver}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
