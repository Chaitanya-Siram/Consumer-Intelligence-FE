/**
 * Blocks of the Brand & Competitive Intel storyboard, ported one-for-one from
 * docs/Html/Brand_and_Competitive.html.
 *
 * That page uses no charting library at all — every visual is a CSS bar whose
 * width the payload supplies. Class names are the contract with bci.css.
 */
import BrandLogo from "./BrandLogo.jsx";
import BannerMedia from "./bannerMedia.jsx";
import PlatformIcon from "./PlatformIcon.jsx";
import { Rich } from "../../utils/text.jsx";

const TONE_CLASS = { pos: "tag-pos", neu: "", neg: "tag-neg" };

/** 36,554 -> 36.6K, 35,688,728 -> 35.7M. The source page abbreviates both. */
export function compact(value) {
  const n = Number(value) || 0;
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(Math.round(n));
}

function formatKpi(kpi) {
  if (kpi.format === "compact") return compact(kpi.value);
  if (kpi.format === "signed") return `${kpi.value > 0 ? "+" : ""}${kpi.value}`;
  return Number(kpi.value).toLocaleString();
}

export function BciBanner({ tab, variant = "b-purple" }) {
  const banner = tab.banner || {};
  return (
    <div className={`tbanner ${variant}`}>
      <BannerMedia image={banner.image} topic={banner.eyebrow || banner.headline || tab.label} />
      <div className="banner-tint" />
      <div className="banner-inner">
        <div className="b-eyebrow">
          <span className="dot" />
          {banner.eyebrow}
        </div>
        <div className="b-title disp">{banner.headline || tab.label}</div>
        {banner.sub ? (
          <div className="b-sub">
            <Rich text={banner.sub} />
          </div>
        ) : null}
        {banner.stats?.length ? (
          <div className="b-stats">
            {banner.stats.map((stat) => (
              <div className="b-stat" key={stat.label}>
                <div className="v">{stat.value}</div>
                <div className="l">{stat.label}</div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function SecHead({ eyebrow, title, note }) {
  return (
    <div className="sec-head">
      <div>
        <div className="sec-eyebrow">{eyebrow}</div>
        <h2 className="sec-title disp">
          {title}
          <span className="accent">.</span>
        </h2>
      </div>
      {note ? <div className="sec-note">{note}</div> : null}
    </div>
  );
}

export function KpiCards({ kpis }) {
  if (!kpis?.length) return null;
  return (
    <div className="grid g4">
      {kpis.map((kpi) => (
        <div className="card kpi" key={kpi.label}>
          <div className="k-label">{kpi.label}</div>
          <div className="k-val disp">{formatKpi(kpi)}</div>
          {kpi.sub ? <div className="k-sub">{kpi.sub}</div> : null}
          {kpi.tag ? (
            <span className={`k-tag ${TONE_CLASS[kpi.tone] || "tag-brand"}`}>{kpi.tag}</span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

/** The page's core visual: a label, a filled track, and the value. Pass
 * `logos` only when `rows` are actually brands (not platforms/themes/drivers)
 * — it renders a BrandLogo next to the label instead of plain text. Pass
 * `platformIcons` when `rows` are channel/platform names (TV, Facebook, ...)
 * instead — same idea, a PlatformIcon monogram rather than a brand mark. */
export function BarList({ rows, color = "var(--brand-1)", valueKey = "value", pctKey = "bar_pct", logos, platformIcons }) {
  if (!rows?.length) return <div className="sb-chart-empty">No data for this view.</div>;
  return (
    <div className="barlist">
      {rows.map((row) => (
        <div className="row" key={row.name || row.brand}>
          <span className="lbl" style={logos || platformIcons ? { display: "inline-flex", alignItems: "center", gap: 6 } : undefined}>
            {logos ? <BrandLogo brand={row.brand} logos={logos} size={16} rounded={5} /> : null}
            {platformIcons ? <PlatformIcon platform={row.name} size={16} rounded={5} /> : null}
            {row.name || row.brand}
          </span>
          <div className="track">
            <div
              className="fill"
              style={{ width: `${Math.max(2, row[pctKey])}%`, background: color }}
            />
          </div>
          <span className="val">{Number(row[valueKey]).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

export function SentimentBar({ split }) {
  if (!split?.length) return null;
  return (
    <>
      <div className="sent-bar">
        {split.map((part) => (
          <div
            key={part.label}
            style={{ width: `${part.pct}%`, background: `var(--${part.tone})` }}
          />
        ))}
      </div>
      <div className="sent-legend">
        {split.map((part) => (
          <span key={part.label}>
            <i style={{ background: `var(--${part.tone})` }} />
            {part.label} {part.pct}%
          </span>
        ))}
      </div>
    </>
  );
}

export function Chips({ items }) {
  if (!items?.length) return null;
  return (
    <div className="chips">
      {items.map((item) => (
        <span className="chip" key={item.name}>
          {item.name} <b>{Number(item.value).toLocaleString()}</b>
        </span>
      ))}
    </div>
  );
}

/**
 * The two stories moving the numbers. The source renders them as a positive and
 * a negative callout side by side, not as plain cards.
 */
export function StoryCards({ drivers }) {
  if (!drivers?.length) return null;
  return (
    <div className="grid g2">
      {drivers.map((driver) => (
        <div className={`callout ${driver.tone === "neg" ? "neg" : "pos"}`} key={driver.title}>
          <div className="ic">{driver.tone === "neg" ? "⚠️" : "◆"}</div>
          <div>
            <div className="ctitle">{driver.title}</div>
            <div className="ctext">
              <Rich text={driver.text} inline />
            </div>
            {driver.tag ? (
              <span className={`k-tag ${TONE_CLASS[driver.tone] || "tag-brand"}`}>{driver.tag}</span>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Positive / Neutral / Negative share per brand, stacked — the source page's
 * "Sentiment Composition by Brand". Built as a CSS bar per brand, matching the
 * page's no-chart-library convention.
 */
export function SentimentComposition({ rows, logos }) {
  if (!rows?.some((r) => r.pos_pct || r.neu_pct || r.neg_pct)) return null;
  return (
    <div>
      {rows.map((row) => (
        <div className="row" key={row.brand} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
          <span
            className="lbl"
            style={{ width: 110, flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <BrandLogo brand={row.brand} logos={logos} size={18} rounded={5} />
            {row.is_brand ? <b>{row.brand}</b> : row.brand}
          </span>
          <div className="sent-bar" style={{ flex: 1 }}>
            <div style={{ width: `${row.pos_pct}%`, background: "var(--pos)" }} />
            <div style={{ width: `${row.neu_pct}%`, background: "var(--neu)" }} />
            <div style={{ width: `${row.neg_pct}%`, background: "var(--neg)" }} />
          </div>
        </div>
      ))}
      <div className="sent-legend" style={{ marginTop: 6 }}>
        <span><i style={{ background: "var(--pos)" }} />Positive</span>
        <span><i style={{ background: "var(--neu)" }} />Neutral</span>
        <span><i style={{ background: "var(--neg)" }} />Negative</span>
      </div>
    </div>
  );
}

export function QuoteCards({ posts, flat = false }) {
  if (!posts?.length) return flat ? <p className="ctext">No posts in this group.</p> : null;
  const cards = posts.map((post, i) => (
    // eslint-disable-next-line react/no-array-index-key -- rank order is the identity
    <div className="qcard" key={`${post.source}-${i}`}>
      <div className="qtext">{post.text}</div>
      <div className="qmeta">
        <span className={`pill ${TONE_CLASS[post.sentiment?.slice(0, 3).toLowerCase()] || ""}`}>
          {post.sentiment}
        </span>
        <span>{compact(post.engagement)} engagement</span>
        {post.source ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <PlatformIcon platform={post.source} size={14} rounded={4} />
            {post.source}
          </span>
        ) : null}
      </div>
    </div>
  ));
  // `flat`: the caller has already placed us inside a column card.
  return flat ? <>{cards}</> : <div className="grid g2">{cards}</div>;
}

export function CompetitorTable({ rows, brand, logos }) {
  if (!rows?.length) return null;
  return (
    <div className="card lg" style={{ overflowX: "auto" }}>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Brand</th>
            <th>Mentions</th>
            <th>Share</th>
            <th>Net sentiment</th>
            <th>Engagement</th>
            <th>Eng. share</th>
            <th>Avg / post</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.brand} className={row.is_brand ? "hl" : undefined}>
              <td>
                <span className={`rank${row.rank === 1 ? " r1" : ""}`}>{row.rank}</span>
              </td>
              <td>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <BrandLogo brand={row.brand} logos={logos} size={22} rounded={6} />
                  {row.is_brand ? <b>{row.brand}</b> : row.brand}
                </span>
              </td>
              <td className="val">{row.value.toLocaleString()}</td>
              <td className="val">{row.share}%</td>
              <td>
                {row.net_sentiment === null ? (
                  // Too few mentions to rate — saying so beats printing a 0.
                  <span className="val" title={`Fewer than 3 mentions of ${row.brand}`}>
                    —
                  </span>
                ) : (
                  <span
                    className="pill"
                    style={{
                      background:
                        row.net_sentiment >= 0 ? "rgba(31,138,85,.12)" : "rgba(200,54,47,.1)",
                      color: row.net_sentiment >= 0 ? "var(--pos)" : "var(--neg)",
                    }}
                  >
                    {row.net_sentiment > 0 ? "+" : ""}
                    {row.net_sentiment}
                  </span>
                )}
              </td>
              <td className="val">{compact(row.engagement)}</td>
              <td className="val">{row.engagement_share}%</td>
              <td className="val">{row.avg_engagement.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.some((r) => r.net_sentiment === null) ? (
        <div className="small-note">
          Brands with fewer than three mentions are not rated — a single article would
          score ±100 and read as a result.
        </div>
      ) : null}
      {brand ? null : null}
    </div>
  );
}

export function Callout({ text, tone = "pos", icon = "◆" }) {
  if (!text) return null;
  return (
    <div className={`callout ${tone}`}>
      <div className="ic">{icon}</div>
      <div>
        <Rich text={text} />
      </div>
    </div>
  );
}

export function Divider() {
  return <div className="divider" />;
}
