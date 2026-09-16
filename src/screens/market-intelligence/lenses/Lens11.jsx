/**
 * Product Trends — pages 36 (Global) and 37 (Region) of the reference report,
 * as two tabs rather than one long scroll: the global category breakdown,
 * then the per-region breakdown, each opening with the report's own
 * "Executive Summary" cover treatment.
 */
import { useEffect, useState } from "react";

import { ExecHeader, GreyPanel, InsightCard, RegionFlag, WorldMap, EmptyLens, T } from "../shared.jsx";

const COLOR = "#0d9488";
const TINTS = [
  { color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
  { color: "#0d9488", bg: "#f0fdfa", border: "#99f6e4" },
  { color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  { color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
];

const TABS = [
  { id: "global", label: "Global", page: "01" },
  { id: "region", label: "Region", page: "02" },
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
    <div role="tablist" aria-label="Product Trends pages" style={{ display: "flex", gap: 6, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 6, width: "fit-content" }}>
      {TABS.map((tab) => {
        const on = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(tab.id)}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, minHeight: 40, padding: "0 18px", borderRadius: 8, border: "none", cursor: "pointer", background: on ? COLOR : "transparent", color: on ? "#fff" : T.muted, fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, fontWeight: 700, letterSpacing: "0.02em", transition: "background 150ms, color 150ms" }}
          >
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, opacity: 0.8 }}>{tab.page}</span>
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

function GlobalTab({ lens }) {
  return (
    <Reveal>
      <ExecHeader num="11" title="Product Trends: Global" summary={lens.perspective} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, alignItems: "start" }}>
        <div>
          <WorldMap regions={lens.leading_regions} mode="flag" height={380} />
          <p style={{ fontSize: 10.5, color: "#94a3b8", margin: "8px 0 0", lineHeight: 1.5 }}>
            {lens.leading_regions?.length ? `Where ${lens.global[0].name} also leads regionally.` : "No region shares the global leader's top category."}
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(2, lens.global.length)}, 1fr)`, gap: 16 }}>
          {lens.global.map((t, i) => {
            const tint = TINTS[i % TINTS.length];
            return (
              <div key={t.name} style={{ background: tint.bg, border: `1px solid ${tint.border}`, borderRadius: 14, padding: "22px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 52, fontWeight: 900, color: tint.color, lineHeight: 1, letterSpacing: "-0.02em" }}>{t.pct}%</div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 700, color: "#0f172a", lineHeight: 1.2 }}>{t.name}</div>
                {t.image ? (
                  <div style={{ borderRadius: 10, overflow: "hidden", display: "flex", justifyContent: "center", boxShadow: `inset 0 0 0 1px ${tint.border}` }}>
                    <img src={t.image} alt={t.name} style={{ height: 100, width: "100%", objectFit: "cover" }} />
                  </div>
                ) : null}
                <p style={{ fontSize: 11.5, color: "#475569", margin: 0, lineHeight: 1.6 }}>{t.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <InsightCard color={COLOR} title="Global Market Leadership">
          {lens.global[0].name} leads product conversation at {lens.global[0].pct}% of {lens.total.toLocaleString()} categorised mentions
          {lens.global[1] ? `; ${lens.global[1].name} follows at ${lens.global[1].pct}%` : ""}.
        </InsightCard>
      </div>
    </Reveal>
  );
}

function RegionTab({ lens }) {
  const barMax = Math.max(50, ...lens.regions.flatMap((r) => r.products.map((p) => p.pct)));
  return (
    <Reveal>
      <ExecHeader num="11" title="Top Product Trends: Region" summary={lens.region_headline} />
      {lens.regions.length ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, alignItems: "start" }}>
          <WorldMap regions={lens.regions} mode="flag" height={420} />
          <GreyPanel>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(2, lens.regions.length)}, 1fr)`, gap: 16 }}>
              {lens.regions.map((region) => (
                <div key={region.name} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "16px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                    <RegionFlag iso={region.iso} size={22} />
                    <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 700, color: "#0f172a" }}>{region.name}</span>
                    <span style={{ marginLeft: "auto", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: T.faint }}>N={region.n}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                    {region.products.map((p, i) => (
                      <div key={p.name}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
                          <span style={{ fontSize: 10.5, color: "#475569", lineHeight: 1.3, flex: 1, paddingRight: 6 }}>{p.name}</span>
                          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, fontWeight: 700, color: i === 0 ? "#2563eb" : "#64748b", flexShrink: 0 }}>{p.pct}%</span>
                        </div>
                        <div style={{ height: 5, background: T.surface2, borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${Math.round((p.pct / barMax) * 100)}%`, background: i === 0 ? "#2563eb" : i === 1 ? "#60a5fa" : "#bfdbfe", borderRadius: 3 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </GreyPanel>
        </div>
      ) : (
        <EmptyLens label="No region in this session cleared the minimum post count for its own product breakdown." />
      )}

      {lens.regions.length ? (
        <div style={{ marginTop: 24 }}>
          <InsightCard color={COLOR} title="Regional Divergence">
            {lens.regions.filter((r) => r.products[0]?.name !== lens.global[0].name).length
              ? lens.regions.filter((r) => r.products[0]?.name !== lens.global[0].name).map((r) => `${r.name} differs from the global leader, led instead by ${r.products[0].name} (${r.products[0].pct}%).`).join(" ")
              : `Every region leads with ${lens.global[0].name}, matching the global picture.`}
          </InsightCard>
        </div>
      ) : null}
    </Reveal>
  );
}

export default function Lens11({ data }) {
  const lens = data?.product_trends;
  const meta = data?.meta || {};
  const [tab, setTab] = useState("global");
  if (!lens?.global?.length) return <EmptyLens label="No post in this session mentions a recognised product category." />;

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <TabBar active={tab} onChange={setTab} />
      </div>

      {tab === "global" ? <GlobalTab lens={lens} /> : <RegionTab lens={lens} />}

      <p style={{ fontSize: 9, color: "#94a3b8", fontStyle: "italic", marginTop: 24, lineHeight: 1.5 }}>
        Source: this session's tagged posts · {meta.window_label} · a post can sit in more than one product category
      </p>
    </div>
  );
}
