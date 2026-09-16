/**
 * Events / Conferences — pages 29–34 of the Auto Appearance report: an
 * overview across every named event (sentiment, share of voice, channel
 * notes, brand participation, sentiment drivers), a comparative thematic
 * breakdown across five fixed pillars, the top trends spotted, and one
 * deep-dive per event. Every number is computed from tagged posts; every
 * event name is detected purely by the extraction agent (`Signals.events`),
 * never a keyword regex. Every sentence was written by the narrative pass
 * over those numbers and checked by the figure guard.
 */
import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";

import { InsightCard, SectionTitle, StatRow, BrandLogo, PlatformIcon, RegionLabel, EmptyLens, ChartBox, TrackBar, SentimentLegend, T, TONE_COLORS, colorAt, platformColor } from "../shared.jsx";

const COLOR = "#7c3aed";
const heading = { fontSize: 12, fontWeight: 600, color: T.text2, marginBottom: 10, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.06em", textTransform: "uppercase" };

const TABS = [
  { id: "overview", label: "Top Engaging Events", page: "01" },
  { id: "thematic", label: "Comparative Thematic Breakdown", page: "02" },
  { id: "trends", label: "Trends Spotted During Events", page: "03" },
  { id: "deepdive", label: "Event Deep-Dive", page: "04" },
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
    <div role="tablist" aria-label="Events pages" style={{ display: "flex", gap: 6, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 6, width: "fit-content", flexWrap: "wrap" }}>
      {TABS.map((tab) => {
        const on = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(tab.id)}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, minHeight: 40, padding: "0 14px", borderRadius: 8, border: "none", cursor: "pointer", background: on ? COLOR : "transparent", color: on ? "#fff" : T.muted, fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, fontWeight: 700, letterSpacing: "0.02em", transition: "background 150ms, color 150ms" }}
          >
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, opacity: 0.8 }}>{tab.page}</span>
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

function Donut({ data, size = 150, colors }) {
  return (
    <div style={{ width: size, height: size, flexShrink: 0 }}>
      <ResponsiveContainer width={size} height={size}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={size * 0.28} outerRadius={size * 0.46} dataKey="value" paddingAngle={2}>
            {data.map((entry, i) => (
              <Cell key={entry.name} fill={colors(entry, i)} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => [`${v}%`, ""]} contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function BulletList({ items, color = COLOR }) {
  if (!items?.length) return null;
  return (
    <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((t) => (
        <li key={t} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          <span style={{ color, fontSize: 13, lineHeight: 1.4, flexShrink: 0 }}>•</span>
          <span style={{ fontSize: 12.5, color: T.text2, lineHeight: 1.55 }}>{t}</span>
        </li>
      ))}
    </ul>
  );
}

function OverviewTab({ lens, events, neutral }) {
  return (
    <Reveal>
      {lens.headline ? (
        <div style={{ background: "#f5f3ff", border: `1px solid ${COLOR}33`, borderLeft: `4px solid ${COLOR}`, borderRadius: 8, padding: "14px 18px", marginBottom: 20 }}>
          <p style={{ fontSize: 13, color: T.text2, lineHeight: 1.7, margin: 0 }}>{lens.headline}</p>
        </div>
      ) : null}

      <div style={{ padding: "16px 20px", background: T.surface2, borderRadius: 10, border: `1px solid ${T.border}`, marginBottom: 20 }}>
        <p style={{ fontSize: 14, color: T.text2, lineHeight: 1.75, margin: 0 }}>
          {lens.total.toLocaleString()} posts in this session name an event: {events.map((e, i) => (
            <span key={e.name}>
              <strong>{e.name}</strong>{e.region ? ` (${e.region})` : ""}{i < events.length - 1 ? ", " : ""}
            </span>
          ))}. Sentiment, channel mix and brand activity below are computed from those posts only.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <ChartBox title="Sentiment Distribution" subtitle={`N = ${lens.total.toLocaleString()} event posts`}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <Donut data={lens.overall_sentiment} colors={(e) => TONE_COLORS[e.tone]} />
            <SentimentLegend split={lens.overall_sentiment} />
          </div>
        </ChartBox>
        <ChartBox title="Events / Conferences — Share of Voice" subtitle="% of event posts">
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <Donut data={lens.share_of_voice} colors={(_e, i) => colorAt(i)} />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {lens.share_of_voice.map((s, i) => (
                <div key={s.name} style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: T.text2 }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: colorAt(i), display: "inline-block" }} />
                    {s.name}
                  </span>
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 700, color: colorAt(i) }}>{s.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </ChartBox>
      </div>

      {lens.channels?.length ? (
        <ChartBox title="Channel Distribution" subtitle="Share of event posts by platform, and how each is used" style={{ marginTop: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {lens.channels.map((c, i) => (
              <div key={c.platform}>
                <TrackBar label={<><PlatformIcon platform={c.platform} size={14} rounded={4} />{c.platform}</>} value={`${c.pct}%`} pct={c.pct} color={platformColor(c.platform, i)} />
                {c.note ? <p style={{ fontSize: 11.5, color: T.text2, margin: "4px 0 0 0", lineHeight: 1.5 }}>{c.note}</p> : null}
              </div>
            ))}
          </div>
        </ChartBox>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 20 }}>
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderLeft: "4px solid #16a34a", borderRadius: 10, padding: "16px 20px" }}>
          <div style={{ ...heading, color: "#15803d" }}>Key Drivers for Positive Sentiment</div>
          <BulletList items={lens.positive_drivers} color="#16a34a" />
        </div>
        <div style={{ background: "#fff1f2", border: "1px solid #fecdd3", borderLeft: "4px solid #dc2626", borderRadius: 10, padding: "16px 20px" }}>
          <div style={{ ...heading, color: "#dc2626" }}>Key Drivers for Negative Sentiment</div>
          {lens.negative_drivers?.length ? <BulletList items={lens.negative_drivers} color="#dc2626" /> : <span style={{ fontSize: 11.5, color: T.faint }}>No meaningful negative-sentiment driver in this dataset.</span>}
        </div>
      </div>

      {lens.brand_participation?.length ? (
        <div style={{ ...heading, marginTop: 20 }}>
          Brand Participation and Activities
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12, marginTop: 12, textTransform: "none", letterSpacing: 0 }}>
            {lens.brand_participation.map((b) => (
              <div key={b.name} style={{ display: "flex", gap: 10, alignItems: "flex-start", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: "12px 14px" }}>
                <BrandLogo name={b.name} size={28} />
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: T.text, marginBottom: 2 }}>{b.name}</div>
                  <div style={{ fontSize: 11.5, color: T.text2, lineHeight: 1.5 }}>{b.blurb || `${b.posts} posts, most at ${b.top_event || "the tracked events"}.`}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div style={{ marginTop: 28 }}>
        <InsightCard color={COLOR} title="Key Takeaway">
          {events[0].name} carries {events[0].share}% of event conversation across {events[0].n} posts
          {events[0].brands[0] ? `, with ${events[0].brands[0].name} the most-named brand there` : ""}.
          {" "}Overall, {neutral}% of event posts are neutral.
        </InsightCard>
      </div>
    </Reveal>
  );
}

function ThematicTab({ lens, events }) {
  return (
    <Reveal>
      {lens.thematic_headline ? (
        <div style={{ background: "#f5f3ff", border: `1px solid ${COLOR}33`, borderLeft: `4px solid ${COLOR}`, borderRadius: 8, padding: "14px 18px", marginBottom: 20 }}>
          <p style={{ fontSize: 13, color: T.text2, lineHeight: 1.7, margin: 0 }}>{lens.thematic_headline}</p>
        </div>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
        {(lens.thematic || []).map((p, i) => (
          <div key={p.title} style={{ background: T.surface, border: `1px solid ${T.border}`, borderTop: `4px solid ${colorAt(i)}`, borderRadius: 10, padding: "16px 16px" }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: T.text, marginBottom: 10, lineHeight: 1.35 }}>{p.title}</div>
            <BulletList items={p.points} color={colorAt(i)} />
            {p.takeaway ? (
              <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${T.border}`, fontSize: 12, fontWeight: 700, color: colorAt(i) }}>{p.takeaway}</div>
            ) : null}
          </div>
        ))}
      </div>

      {events.length > 1 && lens.comparative?.length ? (
        <ChartBox title="Comparative Thematic Breakdown" subtitle="% distribution of post types across events" style={{ marginTop: 24 }}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={lens.comparative} margin={{ left: 0, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="theme" tick={{ fontSize: 10, fill: "#334155" }} axisLine={false} tickLine={false} angle={-10} textAnchor="end" height={50} interval={0} />
              <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => [`${v}%`, ""]} contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              {events.map((e, i) => (
                <Bar key={e.name} dataKey={e.name} name={e.name} fill={colorAt(i)} radius={[3, 3, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>
      ) : null}

      {lens.brand_voices?.length ? (
        <ChartBox title="Brand Voices" subtitle="Real posts from the tracked events, highest engagement first" style={{ marginTop: 24 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {lens.brand_voices.map((q) => (
              <p key={q} style={{ fontSize: 13, color: T.text2, lineHeight: 1.65, margin: 0, fontStyle: "italic", borderLeft: `3px solid ${COLOR}`, paddingLeft: 12 }}>"{q}"</p>
            ))}
          </div>
        </ChartBox>
      ) : null}
    </Reveal>
  );
}

function TrendsTab({ lens }) {
  return (
    <Reveal>
      {lens.trends_summary ? (
        <div style={{ background: "#f5f3ff", border: `1px solid ${COLOR}33`, borderLeft: `4px solid ${COLOR}`, borderRadius: 8, padding: "14px 18px", marginBottom: 20 }}>
          <p style={{ fontSize: 13, color: T.text2, lineHeight: 1.7, margin: 0 }}>{lens.trends_summary}</p>
        </div>
      ) : null}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
        {(lens.trends || []).map((t, i) => (
          <div key={t.name} style={{ background: T.surface, border: `1px solid ${T.border}`, borderLeft: `4px solid ${colorAt(i)}`, borderRadius: 10, padding: "18px 20px" }}>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 34, fontWeight: 800, color: colorAt(i), lineHeight: 1, marginBottom: 4 }}>{t.pct}%</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 10 }}>{t.name}</div>
            <BulletList items={t.points} color={colorAt(i)} />
          </div>
        ))}
      </div>
    </Reveal>
  );
}

/** A colourful varying-size tag cloud — the reference's word cloud under
 * Content Sources, approximated with flowing flex-wrap text (no true
 * cloud-packing library), which reads the same at a glance: the more a
 * hashtag repeats, the larger and bolder it sits. */
function WordCloud({ terms }) {
  if (!terms?.length) {
    return (
      <p style={{ fontSize: 11, color: T.faint, textAlign: "center", margin: "16px 0 4px" }}>
        No hashtags on this event's posts.
      </p>
    );
  }
  const max = Math.max(...terms.map((t) => t.n), 1);
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 10px", alignItems: "baseline", justifyContent: "center", padding: "12px 4px 4px" }}>
      {terms.map((t, i) => (
        <span key={t.tag} style={{ fontSize: `${10 + Math.round((t.n / max) * 12)}px`, fontWeight: 600 + Math.round((t.n / max) * 200), color: colorAt(i), lineHeight: 1.3 }}>
          {t.tag}
        </span>
      ))}
    </div>
  );
}

const eventPanel = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "18px 20px" };

function DeepDiveTab({ lens, events, active, setActive, event }) {
  const eventColor = (i) => colorAt(i);
  return (
    <Reveal>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {events.map((e, i) => (
          <button key={e.name} type="button" onClick={() => setActive(i)} style={{ flex: "1 1 180px", padding: "14px 12px", borderRadius: 10, border: active === i ? `2px solid ${eventColor(i)}` : `1px solid ${T.border}`, background: active === i ? `${eventColor(i)}11` : T.surface, color: active === i ? eventColor(i) : T.muted, cursor: "pointer", textAlign: "left", fontFamily: "'Inter', sans-serif" }}>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 17, fontWeight: 700, marginBottom: 2 }}>{e.name}</div>
            <div style={{ fontSize: 11 }}>{e.dates}</div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, fontWeight: 700, marginTop: 4 }}>N = {e.n.toLocaleString()}</div>
          </button>
        ))}
      </div>

      <div style={{ marginTop: 16 }}>
        <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 26, fontWeight: 800, color: T.text, margin: "0 0 4px" }}>{event.name}</h3>
        <p style={{ fontSize: 13, color: T.muted, margin: 0, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {event.region ? <RegionLabel name={event.region} iso={event.iso} size={16} /> : null}
          {event.region ? " · " : ""}{event.dates} · <strong style={{ color: eventColor(active) }}>N = {event.n.toLocaleString()} conversations</strong>
        </p>
        {event.summary ? <p style={{ fontSize: 13, color: T.text2, lineHeight: 1.65, margin: "10px 0 0" }}>{event.summary}</p> : null}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginTop: 20 }}>
        <div style={eventPanel}>
          <div style={{ ...heading, textAlign: "center" }}>Types of Posts</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
            {event.post_types.length ? event.post_types.map((pt, i) => (
              <TrackBar key={pt.name} label={pt.name} value={`${pt.pct}%`} pct={pt.pct} color={colorAt(i)} />
            )) : <span style={{ fontSize: 11, color: T.faint }}>No typed content.</span>}
          </div>
          <div style={{ textAlign: "right", fontSize: 10, color: T.faint, marginTop: 10, fontFamily: "'JetBrains Mono', monospace" }}>N = {event.n.toLocaleString()}</div>
        </div>

        <div style={eventPanel}>
          <div style={{ ...heading, textAlign: "center" }}>Sentiment Distribution</div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginTop: 8 }}>
            <Donut data={event.sentiment} size={130} colors={(e) => TONE_COLORS[e.tone]} />
            <SentimentLegend split={event.sentiment} size={16} />
          </div>
        </div>

        <div style={eventPanel}>
          <div style={{ ...heading, textAlign: "center" }}>Content Sources</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
            {event.sources.map((s, i) => (
              <TrackBar key={s.name} label={<><PlatformIcon platform={s.name} size={14} rounded={4} />{s.name}</>} value={`${s.pct}%`} pct={s.pct} color={platformColor(s.name, i)} />
            ))}
          </div>
          <div style={{ textAlign: "right", fontSize: 10, color: T.faint, marginTop: 6, fontFamily: "'JetBrains Mono', monospace" }}>N = {event.n.toLocaleString()}</div>
          <WordCloud terms={event.terms} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20, marginTop: 20, alignItems: "start" }}>
        <div style={eventPanel}>
          <div style={{ ...heading, textAlign: "center", marginBottom: 14 }}>Theme Insights</div>
          {event.post_types.some((pt) => pt.insight) ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px" }}>
              {event.post_types.filter((pt) => pt.insight).map((pt) => (
                <p key={pt.name} style={{ fontSize: 12, color: T.text2, margin: 0, lineHeight: 1.6 }}>
                  <strong style={{ color: T.text }}>{pt.name} ({pt.pct}%):</strong> {pt.insight}
                </p>
              ))}
            </div>
          ) : <span style={{ fontSize: 11, color: T.faint }}>No theme insight generated for this event.</span>}
        </div>

        {event.brands.length ? (
          <div style={eventPanel}>
            <div style={{ ...heading, marginBottom: 12 }}>Brand Participation and Activities</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {event.brands.map((b) => (
                <div key={b.name} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <BrandLogo name={b.name} size={26} />
                  <div style={{ fontSize: 12, color: T.text2, lineHeight: 1.5 }}>
                    <strong style={{ color: T.text }}>{b.name}</strong> — {b.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {event.quote ? (
        <div style={{ marginTop: 20, background: "#fdf4ff", border: "1px solid #e9d5ff", borderRadius: 10, padding: "16px 20px" }}>
          <p style={{ fontSize: 13, color: "#7e22ce", lineHeight: 1.7, margin: 0, fontStyle: "italic" }}>"{event.quote}"</p>
          <div style={{ marginTop: 8, fontSize: 11, color: "#6b21a8" }}>Highest-engagement post about {event.name}</div>
        </div>
      ) : null}
    </Reveal>
  );
}

export default function Lens10({ data }) {
  const lens = data?.events;
  const meta = data?.meta || {};
  const [active, setActive] = useState(0);
  const [tab, setTab] = useState("overview");
  const events = lens?.events || [];
  if (!events.length) {
    return (
      <div>
        <SectionTitle num="10" color={COLOR} title="Events / Conferences" subtitle="Social listening around trade shows, expos and conferences" />
        <EmptyLens label="No named event (expo, auto show, conference, …) appears on three or more posts in this session." />
      </div>
    );
  }
  const event = events[Math.min(active, events.length - 1)];
  const neutral = lens.overall_sentiment.find((s) => s.tone === "neu")?.value ?? 0;

  return (
    <div>
      <SectionTitle num="10" color={COLOR} title="Events / Conferences" subtitle={`Social listening across ${events.length} event${events.length === 1 ? "" : "s"} named in the conversation · ${meta.window_label}`} />

      <StatRow
        color={COLOR}
        items={[
          { label: "Events Tracked", value: String(events.length) },
          { label: "Conversations", value: lens.total.toLocaleString() },
          { label: "Overall Neutral", value: `${neutral}%` },
          { label: "Largest Event", value: `${events[0].name} ${events[0].share}% SoV` },
        ]}
      />

      <div style={{ marginTop: 20, marginBottom: 20 }}>
        <TabBar active={tab} onChange={setTab} />
      </div>

      {tab === "overview" ? <OverviewTab lens={lens} events={events} neutral={neutral} /> : null}
      {tab === "thematic" ? <ThematicTab lens={lens} events={events} /> : null}
      {tab === "trends" ? <TrendsTab lens={lens} /> : null}
      {tab === "deepdive" ? <DeepDiveTab lens={lens} events={events} active={active} setActive={setActive} event={event} /> : null}
    </div>
  );
}
