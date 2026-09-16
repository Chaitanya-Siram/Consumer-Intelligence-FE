import { useEffect, useId, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LabelList } from "recharts";
import * as am5 from "@amcharts/amcharts5";
import * as am5map from "@amcharts/amcharts5/map";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import am5geodata_worldLow from "@amcharts/amcharts5-geodata/worldLow";

import { SectionTitle, BrandLogo, RegionFlag, EmptyLens, T, colorAt } from "../shared.jsx";

// React StrictMode mounts every effect twice on the same DOM element; without
// this, the second amCharts5 Root attaches to a container the first Root
// never released, and the chart it builds renders unpredictably (correctly
// for some countries, blank for others, depending on exact timing) — this
// tells amCharts5 to dispose whichever Root already owns a container before
// handing it to a new one, which is exactly this situation.
am5.registry.autoDispose = true;

// amCharts5's world-low geodata keys every feature by its alpha-2 id
// directly, so no numeric-id or hand-tuned zoom/center lookup is needed: the
// map zooms to the EXACT computed bounding box of the target feature(s),
// which fits any country's real size and shape automatically.
const LATAM_IDS = ["BR", "MX", "AR", "CL", "CO", "EC", "PY", "PE", "UY", "VE", "BO", "HT", "CR", "SV", "GT", "HN", "JM", "NI", "PA", "SR"];
// Padding around the fitted bounds so the country doesn't touch the panel edge.
const BOUNDS_PADDING = 0.18;

/**
 * The bounds of a country's main landmass, not its farthest-flung exclave.
 * The US feature's own bounding box spans from Alaska (~-170° longitude) to
 * the East Coast (~-65°) — geographically correct, but it zooms the panel
 * out to a third of the globe to fit a state most viewers don't expect to
 * see there. For a MultiPolygon, this takes the single ring with the
 * largest bounding-box area (the mainland, for every country this app
 * tracks) and ignores the rest; a plain Polygon has only one ring anyway.
 */
function mainlandBounds(geometry) {
  if (geometry.type !== "MultiPolygon") return am5map.getGeoBounds(geometry);
  let best = null;
  let bestArea = -1;
  for (const coordinates of geometry.coordinates) {
    const bounds = am5map.getGeoBounds({ type: "Polygon", coordinates });
    const area = Math.abs(bounds.right - bounds.left) * Math.abs(bounds.bottom - bounds.top);
    if (area > bestArea) {
      bestArea = area;
      best = bounds;
    }
  }
  return best || am5map.getGeoBounds(geometry);
}

// amCharts5's bounds use "top" for the NORTHERN (larger) latitude and
// "bottom" for the SOUTHERN (smaller) one — opposite of a screen y-axis.
// Padding must grow top and shrink bottom to actually enlarge the box.
function paddedBounds(bounds) {
  const w = bounds.right - bounds.left;
  const h = bounds.top - bounds.bottom;
  const px = w * BOUNDS_PADDING || 2;
  const py = Math.abs(h) * BOUNDS_PADDING || 2;
  return { left: bounds.left - px, right: bounds.right + px, top: bounds.top + py, bottom: bounds.bottom - py };
}

// amCharts5's zoomLevel is not the standard web-map-tile "span = 360 / 2^Z"
// convention (confirmed empirically: Z=8 shows a span of roughly 20-25°, not
// 360/2^8). Fitted from that one measured point against the defined Z=1 ==
// the whole 360°-wide world: span(Z) = 360 * 0.683^(Z-1).
function zoomLevelForSpan(spanDegrees) {
  const span = Math.max(spanDegrees, 0.01);
  return 1 + Math.log(360 / span) / Math.log(1 / 0.683);
}

/**
 * Zoomed on a light panel: the target country fills in primary blue against a
 * near-white ground, not the reference report's dark navy — legible at a
 * glance and consistent with every other lens on this screen. Drawn with
 * amCharts5 (pan/zoom and a name tooltip on hover), like the Product Trends
 * world map; the zoom is computed to fit the actual country's bounding box,
 * not a hand-picked zoom level, so it fills the panel for a tiny country
 * (Netherlands) and a huge one (Canada) alike.
 */
function CountryMap({ iso, name }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const targetIds = iso ? [iso.toUpperCase()] : /latam|latin/i.test(name || "") ? LATAM_IDS : null;

  useEffect(() => {
    if (!targetIds) return undefined;
    const root = am5.Root.new(`country-map-${id}`);
    root.setThemes([am5themes_Animated.new(root)]);

    const chart = root.container.children.push(
      am5map.MapChart.new(root, { panX: "translateX", panY: "translateY", projection: am5map.geoMercator(), wheelY: "none" })
    );
    // The canvas paints its own background regardless of the div's CSS
    // background behind it — fill it the same light panel colour so the map
    // reads as one continuous surface, the way the reference report's maps do.
    chart.set("background", am5.Rectangle.new(root, { fill: am5.color(0xf5f8ff), fillOpacity: 1 }));

    const polygonSeries = chart.series.push(am5map.MapPolygonSeries.new(root, { geoJSON: am5geodata_worldLow }));
    polygonSeries.mapPolygons.template.setAll({ strokeWidth: 0.75, tooltipText: "{name}", interactive: true });
    polygonSeries.mapPolygons.template.adapters.add("fill", (_fill, target) =>
      targetIds.includes(target.dataItem?.dataContext?.id) ? am5.color(0x1e40af) : am5.color(0xf5f8ff)
    );
    polygonSeries.mapPolygons.template.adapters.add("stroke", (_stroke, target) =>
      targetIds.includes(target.dataItem?.dataContext?.id) ? am5.color(0xf5f8ff) : am5.color(0xe2e8f0)
    );

    // Bounds are computed straight from the plain imported GeoJSON (available
    // synchronously, independent of amCharts5's own data-processing timing).
    // `homeGeoPoint`/`homeZoomLevel` are only the target for a "go home"
    // reset button and never apply on their own; `zoomToGeoBounds` and
    // `zoomToGeoPoint` (amCharts5's animated pan/zoom methods) did not
    // visibly move this chart in testing. Setting `zoomLevel` directly is
    // the one call confirmed to actually apply — a MapChart is panned the
    // same way: `rotationX`/`rotationY` rotate the projection so the target
    // longitude/latitude sits at its centre, which is the direct-property
    // equivalent of "pan to this point".
    const matches = (am5geodata_worldLow.features || []).filter((f) => targetIds.includes(f.id));
    let zoomTimer;
    if (matches.length) {
      const bounds = matches.map((f) => mainlandBounds(f.geometry)).reduce((acc, b) => ({
        left: Math.min(acc.left, b.left),
        right: Math.max(acc.right, b.right),
        top: Math.max(acc.top, b.top),
        bottom: Math.min(acc.bottom, b.bottom),
      }));
      const padded = paddedBounds(bounds);
      const centerLon = (padded.left + padded.right) / 2;
      const centerLat = (padded.top + padded.bottom) / 2;
      // The wider of the two spans is what must fit the (roughly square)
      // panel; a country taller than it is wide would need the latitude
      // span instead, so take whichever is larger.
      const zoom = zoomLevelForSpan(Math.max(padded.right - padded.left, padded.top - padded.bottom));
      zoomTimer = setTimeout(() => {
        chart.set("rotationX", -centerLon);
        chart.set("rotationY", -centerLat);
        chart.set("zoomLevel", zoom);
      }, 60);
    }

    return () => {
      clearTimeout(zoomTimer);
      root.dispose();
    };
  }, [id, iso, name]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!targetIds) return null;
  return (
    <div style={{ background: "#F5F8FF", border: "1px solid #DBEAFE", borderRadius: 10, overflow: "hidden" }}>
      <div id={`country-map-${id}`} style={{ width: "100%", height: 200 }} />
    </div>
  );
}

const ACCENT = "#1E40AF";
const A_COLOR = "#3B82F6";
const B_COLOR = "#1e293b";
const label = { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, fontWeight: 700, color: ACCENT, letterSpacing: "0.08em", textTransform: "uppercase" };

export default function Lens12({ data }) {
  const lens = data?.regional;
  const [active, setActive] = useState(0);
  const regions = lens?.regions || [];
  if (!regions.length) return <EmptyLens label="No region or country is recorded on this session's posts." />;
  const region = regions[Math.min(active, regions.length - 1)];
  const brands = region.brands.map((b, i) => ({ ...b, color: b.name === "Others" ? "#94a3b8" : colorAt(i) }));
  const trendMax = Math.max(1, ...region.trend_types.flatMap((t) => [t.a_pct || 0, t.b_pct || 0]));
  const rightMax = Math.max(1, ...region.trend_right.map((t) => t.value));

  return (
    <div>
      <SectionTitle num="12" color="#0d9488" title="Regional Dashboards" subtitle={`${regions.length}-region deep dive — ${regions.map((r) => r.name).join(", ")}`} />

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 28 }}>
        {regions.map((r, i) => (
          <button key={r.name} type="button" onClick={() => setActive(i)} style={{ padding: "7px 14px", borderRadius: 8, border: active === i ? `2px solid ${ACCENT}` : "1px solid #e2e8f0", background: active === i ? "#eff6ff" : "#fff", color: active === i ? ACCENT : "#64748b", cursor: "pointer", fontSize: 13, fontWeight: active === i ? 700 : 400, fontFamily: "'Inter', sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
            <RegionFlag iso={r.iso} size={16} />
            <span>{r.name}</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#94a3b8" }}>{r.n}</span>
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", minHeight: 760, borderRadius: 14, overflow: "hidden", border: "1px solid #e2e8f0", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
        <div style={{ background: "#F8FAFC", borderRight: "1px solid #DBEAFE", padding: "28px 20px", display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontStyle: "italic", fontSize: 12, color: "#64748b", letterSpacing: "0.1em", marginBottom: 4 }}>DASHBOARD</div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontStyle: "italic", fontSize: 38, fontWeight: 800, color: "#0f172a", lineHeight: 1.0, letterSpacing: "0.02em" }}>{region.name.toUpperCase()}</div>
            <div style={{ marginTop: 8 }}><RegionFlag iso={region.iso} size={28} /></div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#64748b", marginTop: 8 }}>N = {region.n.toLocaleString()} · {region.share}% of corpus</div>
          </div>
          <CountryMap iso={region.iso} name={region.name} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontStyle: "italic", fontWeight: 700, fontSize: 13, color: "#1E40AF", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>Key Insights</div>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
              {region.key_insights.map((insight) => (
                <li key={insight} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ color: "#1E40AF", fontSize: 14, lineHeight: 1.5, flexShrink: 0 }}>•</span>
                  <p style={{ fontSize: 11.5, color: "#334155", margin: 0, lineHeight: 1.55 }}>{insight}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div style={{ background: "#fff", padding: "28px 32px", display: "flex", flexDirection: "column", gap: 24 }}>
          <p style={{ fontSize: 13, color: "#0f172a", lineHeight: 1.7, margin: 0 }}>{region.summary}</p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>
            <div>
              <div style={{ ...label, marginBottom: 4 }}>Top Themes</div>
              {region.top_themes.length ? (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={region.top_themes} margin={{ top: 24, left: 10, right: 10, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#475569" }} axisLine={false} tickLine={false} interval={0} height={50} tickFormatter={(v) => (v.length > 14 ? `${v.slice(0, 14)}…` : v)} />
                    <YAxis hide />
                    <Tooltip formatter={(v) => [`${v}%`, "Share of posts"]} contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 11 }} />
                    <Bar dataKey="value" fill={ACCENT} radius={[4, 4, 0, 0]}>
                      <LabelList dataKey="value" position="top" formatter={(v) => `${v}%`} style={{ fontSize: 11, fontWeight: 700, fill: ACCENT, fontFamily: "'Barlow Condensed', sans-serif" }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <p style={{ fontSize: 11, color: T.faint }}>No sub-themes tagged here.</p>}
              <p style={{ fontSize: 9, color: "#94a3b8", margin: "8px 0 0", fontStyle: "italic" }}>Share of this region's posts carrying each sub-theme.</p>
            </div>

            <div>
              <div style={{ ...label, marginBottom: 12 }}>Topics of Discussion</div>
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                {region.topics.map((t) => (
                  <li key={t} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <span style={{ color: ACCENT, flexShrink: 0, marginTop: 1 }}>•</span>
                    <p style={{ fontSize: 11.5, color: "#334155", margin: 0, lineHeight: 1.55, fontStyle: "italic" }}>“{t}”</p>
                  </li>
                ))}
              </ul>
              <p style={{ fontSize: 9, color: "#94a3b8", margin: "8px 0 0", fontStyle: "italic" }}>The region's highest-engagement posts.</p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>
            <div>
              <div style={{ ...label, marginBottom: 10 }}>Trending Product Types</div>
              {lens.period_b && region.trend_types.length ? (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: A_COLOR }}>{lens.period_a}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: B_COLOR }}>{lens.period_b}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    {region.trend_types.map((item) => (
                      <div key={item.type} style={{ display: "grid", gridTemplateColumns: "1fr 8px 1fr", alignItems: "center", gap: 4 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
                          <span style={{ fontSize: 9.5, color: "#64748b", textAlign: "right", lineHeight: 1.2 }}>{item.type}</span>
                          {item.a_pct ? (
                            <div style={{ width: Math.max(22, Math.round((item.a_pct / trendMax) * 72)), height: 14, background: A_COLOR, borderRadius: 2, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 4 }}>
                              <span style={{ fontSize: 9, color: "#fff", fontWeight: 700 }}>{item.a_pct}%</span>
                            </div>
                          ) : <div style={{ width: 20, height: 14, background: "#f1f5f9", borderRadius: 2 }} />}
                        </div>
                        <div style={{ width: 1, height: 14, background: "#e2e8f0", margin: "0 2px" }} />
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          {item.b_pct ? (
                            <div style={{ width: Math.max(22, Math.round((item.b_pct / trendMax) * 72)), height: 14, background: B_COLOR, borderRadius: 2, flexShrink: 0, display: "flex", alignItems: "center", paddingLeft: 4 }}>
                              <span style={{ fontSize: 9, color: "#fff", fontWeight: 700 }}>{item.b_pct}%</span>
                            </div>
                          ) : <div style={{ width: 20, height: 14, background: "#f1f5f9", borderRadius: 2 }} />}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : null}
              <div style={{ marginTop: 16, borderTop: "1px solid #f1f5f9", paddingTop: 10 }}>
                {region.trend_right.map((item) => (
                  <div key={item.type} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5, gap: 8 }}>
                    <span style={{ fontSize: 10, color: "#475569", flex: 1 }}>{item.type}</span>
                    <div style={{ width: Math.round((item.value / rightMax) * 90), height: 12, background: B_COLOR, borderRadius: 2, flexShrink: 0 }} />
                    <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, fontWeight: 700, color: B_COLOR, minWidth: 28, textAlign: "right" }}>{item.value}%</span>
                  </div>
                ))}
                {!region.trend_right.length ? <p style={{ fontSize: 11, color: T.faint }}>No product category mentioned in this region.</p> : null}
              </div>
            </div>

            <div>
              <div style={{ ...label, marginBottom: 10 }}>Top Brand Mentions</div>
              {brands.length ? (
                <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                  <div style={{ flexShrink: 0 }}>
                    <PieChart width={160} height={160}>
                      <Pie data={brands} cx={76} cy={76} innerRadius={46} outerRadius={74} dataKey="pct" paddingAngle={1}>
                        {brands.map((b) => (
                          <Cell key={b.name} fill={b.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v, _n, item) => [`${v}% (${item.payload.value})`, ""]} contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 11 }} />
                    </PieChart>
                    <div style={{ textAlign: "center", marginTop: -8 }}>
                      <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 800, color: brands[0].color }}>{brands[0].pct}%</span>
                    </div>
                  </div>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                    {brands.map((b) => (
                      <div key={b.name} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 2, background: b.color, flexShrink: 0 }} />
                        <div style={{ display: "flex", alignItems: "center", gap: 5, flex: 1 }}>
                          {b.name !== "Others" && <BrandLogo name={b.name} size={16} />}
                          <span style={{ fontSize: 11, color: "#334155" }}>{b.name}</span>
                        </div>
                        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, fontWeight: 700, color: "#334155" }}>{b.pct}%</span>
                      </div>
                    ))}
                    <p style={{ fontSize: 9, color: "#94a3b8", margin: "6px 0 0", fontStyle: "italic", lineHeight: 1.4 }}>Share of brand mentions in {region.name}'s posts.</p>
                  </div>
                </div>
              ) : <p style={{ fontSize: 11, color: T.faint }}>No brand mentions in this region.</p>}
            </div>
          </div>

          <p style={{ fontSize: 9, color: "#94a3b8", borderTop: "1px solid #f1f5f9", paddingTop: 10, margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>
            Every figure on this page is computed from the {region.n.toLocaleString()} posts recorded against {region.name} in this session.
            {lens.excluded?.length
              ? ` Regions with fewer than ${lens.min_posts} posts are not scored: ${lens.excluded.map((r) => `${r.name} (${r.n})`).join(", ")}.`
              : ""}
          </p>
        </div>
      </div>
    </div>
  );
}
