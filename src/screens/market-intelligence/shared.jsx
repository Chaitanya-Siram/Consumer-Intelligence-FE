/**
 * Shared design tokens and building blocks for the Market Intelligence lens.
 *
 * Ported from a Figma Make prototype (Consumer Intelligence Dashboard) — inline
 * styles, not Tailwind, as the source used. Brand marks come from the same
 * registry every other dashboard uses (`meta.logos`, registered by nav.js's
 * seedCharts), channels from PlatformIcon, regions from circle flags.
 */
import { useEffect, useId } from "react";
import { Icon } from "@iconify/react";
import * as am5 from "@amcharts/amcharts5";
import * as am5map from "@amcharts/amcharts5/map";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import am5geodata_worldLow from "@amcharts/amcharts5-geodata/worldLow";

import StoryBrandLogo from "../../dashboards/storyboard/BrandLogo.jsx";
import { countryIso } from "../../utils/countryFlags.jsx";
import { brandLogoUrl } from "../../dashboards/storyboard/chartAxisIcons.js";

export { default as PlatformIcon } from "../../dashboards/storyboard/PlatformIcon.jsx";

// React StrictMode mounts every effect twice on the same DOM element; this
// tells amCharts5 to dispose whichever Root already owns a container before
// handing it to a new one, rather than leaving two Roots contending for one
// canvas (see Lens12.jsx's CountryMap for the concrete symptom this fixed).
am5.registry.autoDispose = true;

// ── Light-theme design tokens ──────────────────────────────────────────────
export const T = {
  bg: "#f8fafc",
  surface: "#ffffff",
  surface2: "#f1f5f9",
  border: "#e2e8f0",
  border2: "#cbd5e1",
  text: "#0f172a",
  text2: "#334155",
  muted: "#64748b",
  faint: "#94a3b8",
};

export const PALETTE = [
  "#2563eb", "#d97706", "#059669", "#7c3aed", "#db2777", "#0891b2",
  "#ea580c", "#65a30d", "#dc2626", "#0284c7", "#9333ea", "#0d9488", "#f59e0b",
];
export const colorAt = (i) => PALETTE[i % PALETTE.length];

export const PLATFORM_COLORS = {
  Facebook: "#1877F2",
  Instagram: "#E4405F",
  YouTube: "#FF0000",
  X: "#000000",
  "X (Twitter)": "#000000",
  Twitter: "#1da1f2",
  TikTok: "#010101",
  Tiktok: "#010101",
  Forums: "#64748b",
  "Online News": "#0ea5e9",
  Review: "#f59e0b",
  Blogs: "#a855f7",
  Tumblr: "#35465c",
  Reddit: "#ff4500",
  LinkedIn: "#0a66c2",
  TV: "#7c3aed",
  Print: "#475569",
};
export const platformColor = (name, i = 0) => PLATFORM_COLORS[name] || colorAt(i);

export const TONE_COLORS = { pos: "#10b981", neu: "#64748b", neg: "#ef4444" };

export const fmtCompact = (n) => {
  const v = Number(n) || 0;
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return v.toLocaleString();
};
export const fmtPct = (v) => (v == null ? "—" : `${v}%`);
export const fmtDelta = (v) => (v == null ? "—" : `${v > 0 ? "+" : ""}${v}pp`);

// ── Brand / platform / region marks ────────────────────────────────────────
export function BrandLogo({ name, size = 28 }) {
  const url = brandLogoUrl(name);
  return (
    <StoryBrandLogo
      brand={name}
      logos={url ? { [name]: url } : undefined}
      size={size}
      rounded={Math.round(size * 0.22)}
    />
  );
}

export function BrandLabel({ name, size = 26, bold = true }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <BrandLogo name={name} size={size} />
      <span style={{ fontWeight: bold ? 600 : 400, color: T.text }}>{name}</span>
    </span>
  );
}

/** A country's circular flag; multi-country regions (LATAM, Europe) get a globe. */
export function RegionFlag({ iso, size = 20 }) {
  if (!iso) return <span style={{ fontSize: size * 0.95, lineHeight: 1 }}>🌎</span>;
  return <Icon icon={`circle-flags:${iso}`} width={size} height={size} style={{ flexShrink: 0 }} />;
}

export function RegionLabel({ name, iso, size = 20, style }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, ...style }}>
      <RegionFlag iso={iso || countryIso(name)} size={size} />
      <span>{name}</span>
    </span>
  );
}

// ── World map (amCharts5) ────────────────────────────────────────────────
// Real, approximate country/region centroids — the same coordinates the
// regional-dashboard single-country zoom uses, extended with a few known
// multi-country groupings. A region this session tracks that isn't in here
// (or that names a bare country the taxonomy has no ISO for) is skipped
// entirely rather than guessing a position.
const COUNTRY_COORDS = {
  us: [-98, 38], gb: [-2, 54], de: [10, 51], au: [134, -26], kr: [128, 36],
  ph: [122, 12], cn: [105, 36], in: [80, 22], ca: [-100, 60], fr: [2, 46],
  es: [-4, 40], it: [12, 42], jp: [138, 37], br: [-52, -14], mx: [-102, 24],
};
const REGION_GROUP_COORDS = { latam: [-58, -15], "latin america": [-58, -15], europe: [10, 50], apac: [110, 10] };

function coordsFor(region) {
  if (region.iso && COUNTRY_COORDS[region.iso]) return COUNTRY_COORDS[region.iso];
  return REGION_GROUP_COORDS[String(region.name || "").toLowerCase().trim()] || null;
}

/**
 * A light, interactive world map with one marker per region — a dot
 * (`mode="dot"`) or the region's own circular flag (`mode="flag"`). Pages
 * 36-37 of the reference report both open with a world map; this is that
 * map, positioned from the same real coordinates the Regional Dashboards'
 * single-country zoom uses, drawn with amCharts5 (pan/zoom, a tooltip that
 * tracks the hovered country or marker, hover highlight on every country —
 * not just the ones carrying a marker). Renders nothing if no supplied
 * region resolves to a real position.
 */
export function WorldMap({ regions, mode = "dot", height = 380, style }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const positioned = (regions || []).map((r) => ({ ...r, coords: coordsFor(r) })).filter((r) => r.coords);
  const key = positioned.map((r) => `${r.name}:${r.coords.join(",")}`).join("|") + `|${mode}`;

  useEffect(() => {
    if (!positioned.length) return undefined;
    const root = am5.Root.new(`world-map-${id}`);
    root.setThemes([am5themes_Animated.new(root)]);

    const chart = root.container.children.push(
      am5map.MapChart.new(root, { panX: "translateX", panY: "translateY", projection: am5map.geoNaturalEarth1(), wheelY: "none" })
    );
    // The canvas paints its own background regardless of the div's CSS
    // background behind it — fill it the same light panel colour so the map
    // reads as one continuous surface, the way the reference report's maps do.
    chart.set("background", am5.Rectangle.new(root, { fill: am5.color(0xf5f8ff), fillOpacity: 1 }));

    const polygonSeries = chart.series.push(am5map.MapPolygonSeries.new(root, { geoJSON: am5geodata_worldLow }));
    polygonSeries.mapPolygons.template.setAll({
      fill: am5.color(0xe2e8f0),
      stroke: am5.color(0xf5f8ff),
      strokeWidth: 0.75,
      tooltipText: "{name}",
      interactive: true,
    });
    polygonSeries.mapPolygons.template.states.create("hover", { fill: am5.color(0xbfdbfe) });

    const pointSeries = chart.series.push(am5map.MapPointSeries.new(root, {}));
    pointSeries.bullets.push((_root, _series, dataItem) => {
      const context = dataItem.dataContext;
      const sprite =
        mode === "flag" && context.iso
          ? am5.Picture.new(root, {
              src: `https://api.iconify.design/circle-flags/${context.iso}.svg`,
              width: 22,
              height: 22,
              centerX: am5.p50,
              centerY: am5.p50,
              tooltipText: "{title}",
              cursorOverStyle: "pointer",
            })
          : am5.Circle.new(root, {
              radius: 6,
              fill: am5.color(0x1e40af),
              stroke: am5.color(0xffffff),
              strokeWidth: 2,
              tooltipText: "{title}",
              cursorOverStyle: "pointer",
            });
      return am5.Bullet.new(root, { sprite });
    });
    pointSeries.data.setAll(positioned.map((r) => ({ longitude: r.coords[0], latitude: r.coords[1], title: r.name, iso: r.iso })));

    chart.appear(600, 100);

    return () => root.dispose();
  }, [id, key, mode, positioned.length]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!positioned.length) return null;
  return (
    <div style={{ background: "#F5F8FF", border: "1px solid #DBEAFE", borderRadius: 10, overflow: "hidden", ...style }}>
      <div id={`world-map-${id}`} style={{ width: "100%", height }} />
    </div>
  );
}

/** Recharts category tick that draws the brand's mark above its name. */
export function BrandTick({ x, y, payload }) {
  const name = payload?.value ?? "";
  const url = brandLogoUrl(name);
  const short = name.length > 12 ? `${name.slice(0, 11)}…` : name;
  return (
    <g transform={`translate(${x},${y})`}>
      {url ? <image href={url} x={-8} y={4} width={16} height={16} /> : null}
      <text y={url ? 34 : 16} textAnchor="middle" fontSize={10} fill="#64748b">
        {short}
      </text>
    </g>
  );
}

// ── Shared layout components ────────────────────────────────────────────────
export function SectionTitle({ num, color, title, subtitle }) {
  return (
    <div style={{ marginBottom: 28, borderBottom: `1px solid ${T.border}`, paddingBottom: 24 }}>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color, letterSpacing: "0.16em", marginBottom: 8 }}>
        LENS {num}
      </div>
      <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 34, fontWeight: 800, color: T.text, margin: "0 0 8px", letterSpacing: "0.02em" }}>
        {title}
      </h2>
      <p style={{ color: T.muted, fontSize: 14, margin: 0, lineHeight: 1.5 }}>{subtitle}</p>
    </div>
  );
}

export function StatRow({ items, color }) {
  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
      {items.map(({ label, value }) => (
        <div key={label} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: "12px 20px", minWidth: 120, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 11, color: T.faint, marginBottom: 4, fontFamily: "'JetBrains Mono', monospace" }}>{label}</div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 700, color, display: "inline-flex", alignItems: "center", gap: 6 }}>
            {value}
          </div>
        </div>
      ))}
    </div>
  );
}

export function InsightCard({ color, title, children }) {
  return (
    <div style={{ background: T.surface, border: `1px solid ${color}33`, borderLeft: `3px solid ${color}`, borderRadius: 8, padding: "16px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, fontWeight: 700, color, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
        {title}
      </div>
      <div style={{ color: T.text2, fontSize: 13, margin: 0, lineHeight: 1.6 }}>{children}</div>
    </div>
  );
}

export function ChartBox({ title, subtitle, right, children, style }) {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", ...style }}>
      {title || right ? (
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: subtitle ? 4 : 16 }}>
          <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 17, fontWeight: 700, color: T.text, margin: 0 }}>{title}</h3>
          {right}
        </div>
      ) : null}
      {subtitle ? <p style={{ fontSize: 12, color: T.muted, margin: "0 0 20px" }}>{subtitle}</p> : null}
      {children}
    </div>
  );
}

/**
 * The reference report's recurring cover treatment: a small blue eyebrow, a
 * black title, and — beside it, not below — a blue narrative paragraph. Pages
 * 8, 9-11, 13, 18, 26, 36 all open this way. `num`/`color` keep the lens's own
 * numbering and accent for anything rendered below; the header itself is
 * always the report's blue, regardless of the lens's own accent colour.
 */
export function ExecHeader({ num, eyebrow = "EXECUTIVE SUMMARY", title, summary, color = "#2563eb" }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(260px,1fr) minmax(260px,1.2fr)", gap: 32, alignItems: "start", marginBottom: 28, paddingBottom: 24, borderBottom: `1px solid ${T.border}` }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#1E40AF", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8, fontFamily: "'JetBrains Mono', monospace" }}>
          {num ? `LENS ${num} · ` : ""}{eyebrow}
        </div>
        <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 34, fontWeight: 800, color: T.text, margin: 0, lineHeight: 1.15, letterSpacing: "0.01em" }}>{title}</h2>
      </div>
      {summary ? <p style={{ fontSize: 14, color: "#1E40AF", lineHeight: 1.7, margin: 0, fontWeight: 500 }}>{summary}</p> : null}
    </div>
  );
}

/** The light-grey card the reference wraps its hero chart in. */
export function GreyPanel({ children, style }) {
  return <div style={{ background: "#F1F5F9", borderRadius: 16, padding: "28px 32px", ...style }}>{children}</div>;
}

export function EmptyLens({ label = "Not enough data in this session for this lens." }) {
  return (
    <div style={{ background: T.surface2, border: `1px dashed ${T.border2}`, borderRadius: 10, padding: "28px 24px", color: T.muted, fontSize: 13, textAlign: "center" }}>
      {label}
    </div>
  );
}

/** A label + filled track + value row — the page's lightest visual. */
export function TrackBar({ label, value, pct, color, max = 100 }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.text2, marginBottom: 3, gap: 8 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>{label}</span>
        <span style={{ fontWeight: 700, color }}>{value}</span>
      </div>
      <div style={{ height: 6, background: T.surface2, borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${Math.min(100, Math.max(2, (pct / max) * 100))}%`, height: "100%", background: color, borderRadius: 3 }} />
      </div>
    </div>
  );
}

export function SentimentLegend({ split, size = 20 }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {(split || []).map((s) => (
        <div key={s.name} style={{ display: "flex", justifyContent: "space-between", gap: 24, alignItems: "center" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: T.text2 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: TONE_COLORS[s.tone], display: "inline-block" }} />
            {s.name}
          </span>
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: size, fontWeight: 700, color: TONE_COLORS[s.tone] }}>{s.value}%</span>
        </div>
      ))}
    </div>
  );
}

// Recharts shared style props
export const TOOLTIP_STYLE = {
  contentStyle: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", color: "#0f172a" },
};
export const GRID_PROPS = { strokeDasharray: "3 3", stroke: "#f1f5f9" };
export const AXIS_TICK = { fontSize: 11, fill: "#64748b" };
