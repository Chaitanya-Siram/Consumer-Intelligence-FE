/**
 * Market Intelligence — twelve intel lenses (Channel Impact, Share of Voice,
 * Volume Trendline, Regional Dashboards, ...), each its own Recharts view,
 * ported from a Figma Make prototype (Consumer Intelligence Dashboard).
 *
 * Every figure comes from `chartsData.market_intelligence`, computed by the
 * backend from the session's own tagged articles (storyboard/market_intel.py).
 * The lens components receive the whole payload and read their own section.
 */
import { useState } from "react";

import "./market-intelligence/market-intelligence.css";
import { BrandLogo, RegionFlag, T, fmtCompact } from "./market-intelligence/shared.jsx";
import Lens1 from "./market-intelligence/lenses/Lens1.jsx";
import Lens2 from "./market-intelligence/lenses/Lens2.jsx";
import Lens3 from "./market-intelligence/lenses/Lens3.jsx";
import Lens4 from "./market-intelligence/lenses/Lens4.jsx";
import Lens5 from "./market-intelligence/lenses/Lens5.jsx";
import Lens6 from "./market-intelligence/lenses/Lens6.jsx";
import Lens7 from "./market-intelligence/lenses/Lens7.jsx";
import Lens8 from "./market-intelligence/lenses/Lens8.jsx";
import Lens9 from "./market-intelligence/lenses/Lens9.jsx";
import Lens10 from "./market-intelligence/lenses/Lens10.jsx";
import Lens11 from "./market-intelligence/lenses/Lens11.jsx";
import Lens12 from "./market-intelligence/lenses/Lens12.jsx";

const DASHBOARD_KEY = "market_intelligence";
const IMG = (id) => `https://images.unsplash.com/photo-${id}?w=480&h=220&fit=crop&auto=format`;

const first = (rows, key = "name") => rows?.[0]?.[key];

// `stat` and `subtitle` are functions of the payload so every card headline is
// a real figure from this session, not the reference report's.
const LENSES = [
  { id: 1, title: "Channel Impact Analysis", tag: "SOCIAL MEDIA", color: "#2563eb", img: IMG("1551288049-bebda4e38f71"), Component: Lens1,
    subtitle: (s) => `Post volume by brand across ${s.channel_impact?.platforms?.length || 0} platforms`,
    stat: (s) => (s.channel_impact?.periods || []).map((p) => p.label).join(" vs ") || "—" },
  { id: 2, title: "Industry Trends: Share of Voice", tag: "TRENDS", color: "#d97706", img: IMG("1611974789855-9c2a0a7236a3"), Component: Lens2,
    subtitle: (s) => `${s.industry_trends?.categories?.length || 0} trend categories · N=${fmtCompact(s.industry_trends?.total)}`,
    stat: (s) => (first(s.industry_trends?.categories) ? `${first(s.industry_trends.categories)} ${s.industry_trends.categories[0].pct}%` : "—") },
  { id: 3, title: "Trend Tracking Across Semesters", tag: "TRACKING", color: "#059669", img: IMG("1526628953301-3e589a6a8b74"), Component: Lens3,
    subtitle: (s) => (s.trend_tracking?.period_b ? `SoV comparison ${s.trend_tracking.period_a} vs ${s.trend_tracking.period_b}` : "Needs two periods of data"),
    stat: (s) => `${s.trend_tracking?.slides?.length || 0} slide views` },
  { id: 4, title: "Volume Trendline", tag: "VOLUME", color: "#7c3aed", img: IMG("1560221328-12fe60f83ab8"), Component: Lens4,
    subtitle: (s) => `Monthly conversation volume · ${s.volume_trendline?.months?.length || 0} months`,
    stat: (s) => `N = ${fmtCompact(s.volume_trendline?.total)} total` },
  { id: 5, title: "Key Themes of Discussion", tag: "THEMES", color: "#db2777", img: IMG("1560472354-b33ff0c44a43"), Component: Lens5,
    subtitle: (s) => (s.key_themes?.period_b ? `${s.key_themes.period_a} vs ${s.key_themes.period_b} theme analysis` : "Theme share of conversation"),
    stat: (s) => (first(s.key_themes?.rows, "theme") ? `${first(s.key_themes.rows, "theme")} ${s.key_themes.rows[0].pct}%` : "—") },
  { id: 6, title: "Voice of User Analysis", tag: "USER VOICE", color: "#0891b2", img: IMG("1524661135-423995f22d0b"), Component: Lens6,
    subtitle: () => "Product trends & regional brand preferences",
    stat: (s) => (s.voice_of_user?.product_trends || []).slice(0, 2).map((p) => `${p.name} ${p.pct}%`).join(" | ") || "—" },
  { id: 7, title: "Brand Analysis", tag: "BRANDS", color: "#ea580c", img: IMG("1611162616305-c69b3fa7fbe0"), Component: Lens7,
    subtitle: () => "Post type mix by platform per brand",
    stat: (s) => `${s.brand_analysis?.brands?.length || 0} brands analyzed` },
  { id: 8, title: "New Launches", tag: "LAUNCHES", color: "#65a30d", img: IMG("1504711434969-e33886168f5c"), Component: Lens8,
    subtitle: () => "Product category launch distribution",
    stat: (s) => (first(s.new_launches?.categories) ? `${first(s.new_launches.categories)} ${s.new_launches.categories[0].pct}%` : `${s.new_launches?.total || 0} launch posts`) },
  { id: 9, title: "Campaigns", tag: "CAMPAIGNS", color: "#dc2626", img: IMG("1552664730-d307ca884978"), Component: Lens9,
    subtitle: (s) => (first(s.campaigns?.campaigns) ? `${s.campaigns.campaigns[0].brand} ${s.campaigns.campaigns[0].name} engagement` : "Hashtag campaigns in the conversation"),
    stat: (s) => {
      const c = first(s.campaigns?.campaigns, "posts") != null ? s.campaigns.campaigns[0] : null;
      if (!c) return "No campaigns detected";
      return c.reach ? `${fmtCompact(c.reach)} total reach` : `${c.posts} posts · ${fmtCompact(c.engagement)} engagement`;
    } },
  { id: 10, title: "Events & Conferences", tag: "EVENTS", color: "#0284c7", img: IMG("1726249686209-8f662c0322ed"), Component: Lens10,
    subtitle: (s) => ((s.events?.events || []).map((e) => e.name).join(", ") || "Event mentions in the conversation"),
    stat: (s) => `${s.events?.events?.length || 0} events · ${s.events?.total || 0} posts` },
  { id: 11, title: "Product Trends: Global", tag: "GLOBAL", color: "#9333ea", img: IMG("1620584898989-d39f7f9ed1b7"), Component: Lens11,
    subtitle: () => "Global product-category view with regional breakdown",
    stat: (s) => (s.product_trends?.global || []).slice(0, 4).map((g) => g.name.split(" ")[0]).join(" · ") || "—" },
  { id: 12, title: "Regional Dashboards", tag: "REGIONAL", color: "#0d9488", img: IMG("1591696205602-2f950c417cb9"), Component: Lens12,
    subtitle: (s) => `${s.regional?.regions?.length || 0} regions: ${(s.regional?.regions || []).map((r) => r.name).join(", ")}`,
    stat: (s) => `${s.regional?.regions?.length || 0} markets covered` },
];

const btn = { background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 8, padding: "7px 14px", color: "#334155", cursor: "pointer", fontSize: 13, fontFamily: "'Inter', sans-serif", fontWeight: 500 };

function LensGrid({ story, onNavigate, onBack }) {
  const meta = story.meta;
  const brands = meta.brands?.length ? meta.brands : [meta.brand, ...(meta.competitors || [])].filter(Boolean);

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <header style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "20px 48px", position: "sticky", top: 0, zIndex: 50, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {onBack ? (
              <button type="button" onClick={onBack} style={btn}>← Back</button>
            ) : null}
            <BrandLogo name={meta.brand} size={44} />
            <div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 600, letterSpacing: "0.18em", color: "#d97706", textTransform: "uppercase" }}>
                {meta.brand} · {meta.window_label}
              </div>
              <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 24, fontWeight: 800, letterSpacing: "0.02em", color: "#0f172a", margin: 0, lineHeight: 1.1 }}>
                Market Intelligence Dashboard
              </h1>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#94a3b8" }}>
              12 Intel Lenses · N={fmtCompact(meta.total_conversations)}
            </span>
            <span style={{ background: "#dcfce7", color: "#15803d", fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, border: "1px solid #bbf7d0" }}>● LIVE</span>
          </div>
        </div>
      </header>

      <div style={{ position: "relative", minHeight: 220, overflow: "hidden", borderBottom: "1px solid #e2e8f0", background: "linear-gradient(90deg, #fff 0%, #f1f5f9 100%)" }}>
        <div style={{ display: "flex", alignItems: "center", padding: "28px 64px" }}>
          <div style={{ maxWidth: 1400, margin: "0 auto", width: "100%" }}>
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 42, fontWeight: 800, color: "#0f172a", margin: 0, lineHeight: 1.1 }}>
              {meta.brand}
              <br />
              <span style={{ color: "#2563eb" }}>Market Intelligence</span>
            </p>
            <p style={{ color: "#64748b", fontSize: 14, marginTop: 10, marginBottom: 0 }}>
              {brands.length} Brands · {meta.platforms?.length || 0} Platforms · {story.regional?.regions?.length || 0} Regions
              {story.regional?.excluded?.length ? ` (+${story.regional.excluded.length} too thin to score)` : ""} ·{" "}
              {story.industry_trends?.categories?.length || 0} Trend Categories · {meta.window_label}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 16, flexWrap: "wrap" }}>
              {brands.map((b) => (
                <div key={b} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <BrandLogo name={b} size={26} />
                  <span style={{ fontSize: 12, color: "#475569", fontWeight: 500 }}>{b}</span>
                </div>
              ))}
              {(story.regional?.regions || []).map((r) => (
                <div key={r.name} style={{ display: "flex", alignItems: "center", gap: 5, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20, padding: "3px 10px 3px 5px" }}>
                  <RegionFlag iso={r.iso} size={16} />
                  <span style={{ fontSize: 11, color: "#475569" }}>{r.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "40px 48px 80px" }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#94a3b8", margin: "0 0 2px" }}>Select an Intel Lens</h2>
          <p style={{ color: "#cbd5e1", fontSize: 12, margin: 0 }}>Click any card to explore detailed analytics</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))", gap: 18 }}>
          {LENSES.map((lens) => (
            <button
              key={lens.id}
              type="button"
              onClick={() => onNavigate(lens.id)}
              style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 0, cursor: "pointer", textAlign: "left", transition: "all 0.18s ease", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
              onMouseEnter={(e) => { const el = e.currentTarget; el.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)"; el.style.transform = "translateY(-3px)"; el.style.borderColor = `${lens.color}66`; }}
              onMouseLeave={(e) => { const el = e.currentTarget; el.style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)"; el.style.transform = "translateY(0)"; el.style.borderColor = "#e2e8f0"; }}
            >
              <div style={{ position: "relative", height: 140, overflow: "hidden", background: "#f1f5f9" }}>
                <img src={lens.img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${lens.color}22 0%, ${lens.color}55 100%)` }} />
                <div style={{ position: "absolute", top: 10, left: 10, background: lens.color, color: "#fff", fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", padding: "3px 8px", borderRadius: 4, fontFamily: "'JetBrains Mono', monospace" }}>{lens.tag}</div>
                <div style={{ position: "absolute", top: 10, right: 10, background: "rgba(255,255,255,0.95)", color: lens.color, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4, fontFamily: "'JetBrains Mono', monospace" }}>#{String(lens.id).padStart(2, "0")}</div>
              </div>
              <div style={{ padding: "16px 18px 18px" }}>
                <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 19, fontWeight: 700, color: "#0f172a", margin: "0 0 5px", lineHeight: 1.2 }}>{lens.title}</h3>
                <p style={{ color: "#64748b", fontSize: 12, margin: "0 0 12px", lineHeight: 1.4 }}>{lens.subtitle(story)}</p>
                <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: lens.color, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lens.stat(story)}</span>
                  <span style={{ width: 26, height: 26, borderRadius: "50%", background: `${lens.color}15`, color: lens.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>→</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function LensDetail({ story, lensId, onHome, onNavigate }) {
  const lens = LENSES.find((l) => l.id === lensId) || LENSES[0];
  const { Component, color } = lens;
  const prev = lens.id > 1 ? lens.id - 1 : null;
  const next = lens.id < 12 ? lens.id + 1 : null;
  const navBtn = (id, label, primary) => (
    <button
      type="button"
      onClick={() => onNavigate(id)}
      style={primary
        ? { background: color, border: "none", borderRadius: 8, padding: "8px 20px", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "'Inter', sans-serif" }
        : { ...btn, padding: "8px 16px" }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <div style={{ position: "sticky", top: 0, zIndex: 50, background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "12px 48px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button type="button" onClick={onHome} style={btn}>← Home</button>
          <div style={{ width: 1, height: 24, background: "#e2e8f0" }} />
          <div>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color, letterSpacing: "0.12em" }}>LENS {String(lens.id).padStart(2, "0")} / 12</span>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 700, color: "#0f172a", margin: 0, letterSpacing: "0.02em" }}>{lens.title}</h2>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {prev && navBtn(prev, "← Prev", false)}
          {next && navBtn(next, "Next →", true)}
        </div>
      </div>

      <div style={{ padding: "36px 48px 80px", maxWidth: 1400, margin: "0 auto" }}>
        <Component data={story} />
      </div>

      <div style={{ borderTop: "1px solid #e2e8f0", padding: "20px 48px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff" }}>
        <div style={{ display: "flex", gap: 6 }}>
          {LENSES.map((l) => (
            <button
              type="button"
              key={l.id}
              onClick={() => onNavigate(l.id)}
              style={{ width: 30, height: 30, borderRadius: 6, border: l.id === lens.id ? `2px solid ${color}` : "1px solid #e2e8f0", background: l.id === lens.id ? `${color}15` : "#fff", color: l.id === lens.id ? color : "#94a3b8", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'JetBrains Mono', monospace" }}
            >
              {l.id}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {prev && navBtn(prev, "← Previous Lens", false)}
          {next && navBtn(next, "Next Lens →", true)}
        </div>
      </div>
    </div>
  );
}

export default function MarketIntelligenceScreen({ chartsData, chartsLoading, chartsError, onBack, initialLensId = null }) {
  const [activeLens, setActiveLens] = useState(initialLensId);
  const story = chartsData?.[DASHBOARD_KEY];

  if (chartsLoading) return <div className="sb-state">Loading market intelligence…</div>;
  if (chartsError) return <div className="sb-state sb-state--error">{chartsError}</div>;
  if (!story?.meta) {
    return (
      <div className="sb-state">
        No market intelligence yet. Run <strong>Create Dashboard</strong> from the Review screen.
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: T.text }}>
      {activeLens === null ? (
        <LensGrid story={story} onNavigate={setActiveLens} onBack={onBack} />
      ) : (
        <LensDetail story={story} lensId={activeLens} onHome={() => setActiveLens(null)} onNavigate={setActiveLens} />
      )}
    </div>
  );
}
