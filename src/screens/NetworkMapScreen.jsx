/**
 * Network Map — a faithful port of docs/Html/Network_Map.html.
 *
 * Three slides: the network and its scale, the communities mapped onto it, and a
 * representative voice from inside one of them. The map is a canvas drawn from a
 * seed (see NetworkCanvas.jsx) so it is identical on every visit; the numbered
 * badges and the community cards both open the same deep-dive.
 */
import { useCallback, useEffect, useState } from "react";

import NetworkCanvas from "../dashboards/storyboard/NetworkCanvas.jsx";
import BrandLogo from "../dashboards/storyboard/BrandLogo.jsx";
import { Rich } from "../utils/text.jsx";
import "../dashboards/storyboard/network.css";

const DASHBOARD_KEY = "network_map";

/** A brand's own site is far more often good for a YouTube clip than a raw
 *  video file — `<video src>` cannot play a YouTube URL at all, so the hero
 *  embeds one instead, with the parameters YouTube documents for an
 *  autoplaying, muted, looping background: `loop=1` only loops when
 *  `playlist` repeats the same video id. */
function youtubeBackgroundSrc(url) {
  const id = url.split("/").pop();
  return `${url}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&modestbranding=1&playsinline=1&rel=0&showinfo=0`;
}

/**
 * The quick AI panel a numbered badge opens. The source page has two distinct
 * interactions — badge for insights, card for the full deep-dive — and the popup
 * offers a button through to the latter.
 */
function AiPopup({ community, onClose, onDeepDive }) {
  useEffect(() => {
    if (!community) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [community, onClose]);

  if (!community) return null;

  return (
    <div
      id="aiPopupOverlay"
      className="open"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div id="aiPopup" role="dialog" aria-modal="true" aria-label={`AI insights: ${community.name}`}>
        <div className="ai-popup-header" style={{ background: community.color }}>
          <button type="button" className="ai-popup-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
          <div className="ai-popup-eyebrow">Community {community.id + 1} · AI Insights</div>
          <div className="ai-popup-title">{community.name}</div>
        </div>
        <div className="ai-popup-body">
          {community.insights?.length ? (
            community.insights.map((insight, i) => (
              // eslint-disable-next-line react/no-array-index-key -- order is the identity
              <div className="ai-insight-item" key={i}>
                <div className="ai-insight-num" style={{ background: community.color }}>
                  {i + 1}
                </div>
                <div className="ai-insight-text">
                  <Rich text={insight} />
                </div>
              </div>
            ))
          ) : (
            <div className="ai-insight-text">No AI analysis was generated for this community.</div>
          )}
        </div>
        <div className="ai-popup-footer">
          <span className="ai-footer-label">✦ AI-generated insights</span>
          <button
            type="button"
            className="ai-deepdive-btn"
            style={{ background: community.color }}
            onClick={() => onDeepDive(community.id)}
          >
            Full Deep-Dive →
          </button>
        </div>
      </div>
    </div>
  );
}

function DeepDive({ community, communities, graph, meta, onClose }) {
  useEffect(() => {
    if (!community) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [community, onClose]);

  if (!community) return null;

  return (
    <div
      id="deepDiveOverlay"
      className="open"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div id="deepDivePanel" role="dialog" aria-modal="true" aria-label={community.name}>
        <div className="dd-body">
        <button type="button" className="dd-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <div className="dd-header" style={{ borderColor: community.color }}>
          <div className="dd-eyebrow" style={{ color: community.color }}>
            Community {community.id + 1}
          </div>
          <div className="dd-title">{community.name}</div>
          {community.subtitle ? (
            <div className="dd-subtitle">
              <Rich text={community.subtitle} />
            </div>
          ) : null}
        </div>

        <div className="dd-kpi-strip">
          {community.kpis.map((kpi) => (
            <div className="dd-kpi" key={kpi.lbl}>
              <div className="dd-kpi-val" style={{ color: community.color }}>
                {kpi.val}
              </div>
              <div className="dd-kpi-lbl">{kpi.lbl}</div>
              <div className="dd-kpi-sub">{kpi.sub}</div>
            </div>
          ))}
        </div>

        {community.sentiment_split?.length ? (
          <div className="sent-split">
            {community.sentiment_split.map((part) => (
              <div
                className="sent-pill"
                key={part.label}
                style={{
                  background:
                    part.tone === "pos"
                      ? "rgba(0,137,123,.10)"
                      : part.tone === "neg"
                        ? "rgba(200,16,46,.10)"
                        : "rgba(120,120,120,.10)",
                }}
              >
                <div
                  className="sent-pill-val"
                  style={{
                    color:
                      part.tone === "pos" ? "#00897B" : part.tone === "neg" ? "#C8102E" : "#777",
                  }}
                >
                  {part.pct}%
                </div>
                <div className="sent-pill-lbl">{part.label}</div>
              </div>
            ))}
          </div>
        ) : null}

        <div className="dd-two-col">
          <div className="dd-map-wrap" style={{ height: 300 }}>
            {/* Same seed, one cluster lit: shows where this group sits in the whole. */}
            <NetworkCanvas
              communities={communities}
              seed={graph.seed}
              nodeCount={graph.nodes}
              edgeCount={graph.edges}
              highlight={community.id}
              height={300}
            />
          </div>
          <div className="dd-voices-wrap">
            <div className="dd-section-title">Most active accounts</div>
            {community.members?.length ? (
              community.members.map((member, i) => (
                <div className="voice-row" key={member}>
                  <div className="voice-rank">{i + 1}</div>
                  <div className="voice-avatar" style={{ background: community.color }}>
                    {member.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="voice-info">
                    <div className="voice-handle">
                      {member.startsWith("@") ? member : `@${member}`}
                    </div>
                    <div className="voice-role">in {community.name}</div>
                  </div>
                  {community.voices?.[i] ? (
                    <div className="voice-badges">
                      <span className="voice-badge" style={{ background: community.color }}>
                        {community.voices[i].posts} post{community.voices[i].posts === 1 ? "" : "s"}
                      </span>
                    </div>
                  ) : null}
                  {community.voices?.[i] ? (
                    <div className="voice-metric">
                      <div className="voice-metric-val">{community.voices[i].metric_value}</div>
                      <div className="voice-metric-lbl">{community.voices[i].metric_label}</div>
                    </div>
                  ) : null}
                </div>
              ))
            ) : (
              <div className="voice-role">No named accounts in this cluster.</div>
            )}
            {community.topics?.length ? (
              <>
                <div className="dd-section-title" style={{ marginTop: 18 }}>
                  What this community talks about
                </div>
                {community.topics.map((topic) => (
                  <div className="topic-row" key={topic.name}>
                    <div className="topic-head">
                      <span className="topic-name">{topic.name}</span>
                      <span className="topic-pct">{topic.pct}%</span>
                    </div>
                    <div className="topic-bar-bg">
                      <div className="topic-bar-fill" style={{ width: `${topic.bar_pct}%` }} />
                    </div>
                    <div className="topic-desc">
                      {topic.value} of this community&rsquo;s posts
                    </div>
                  </div>
                ))}
              </>
            ) : null}
            {community.rivals?.length ? (
              <>
                <div className="dd-section-title" style={{ marginTop: 18 }}>
                  Co-mentioned brands
                </div>
                {community.rivals.map((rival) => (
                  <div className="topic-row" key={rival.brand}>
                    <div className="topic-head">
                      <span className="topic-name" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <BrandLogo brand={rival.brand} logos={meta.logos} size={18} rounded={5} />
                        {rival.brand}
                      </span>
                      <span className="topic-pct">{rival.count}</span>
                    </div>
                  </div>
                ))}
              </>
            ) : null}
          </div>
        </div>

        <div className="dd-insight-grid">
          {community.insights?.length ? (
            community.insights.map((insight, i) => (
              // eslint-disable-next-line react/no-array-index-key -- order is the identity
              <div className="dd-insight-box" key={i}>
                <div className="dd-insight-label" style={{ color: community.color }}>
                  Insight {i + 1}
                </div>
                <div className="dd-insight-text">
                  <Rich text={insight} />
                </div>
              </div>
            ))
          ) : (
            <div className="dd-insight-box">
              <div className="dd-insight-text">
                No AI analysis was generated for this community.
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NetworkMapScreen({
  chartsData,
  chartsLoading,
  chartsError,
  onBack,
  initialSlide = 0,
}) {
  const story = chartsData?.[DASHBOARD_KEY];
  const [slide, setSlide] = useState(initialSlide);
  const [openId, setOpenId] = useState(null);
  const [popupId, setPopupId] = useState(null);

  const openDeepDive = useCallback((id) => {
    setPopupId(null);
    setOpenId(id);
  }, []);
  const closeDeepDive = useCallback(() => setOpenId(null), []);
  // A badge opens the quick panel; a card opens the full deep-dive.
  const openPopup = useCallback((id) => setPopupId(id), []);
  const closePopup = useCallback(() => setPopupId(null), []);

  if (chartsLoading) return <div className="sb-state">Loading network map…</div>;
  if (chartsError) return <div className="sb-state sb-state--error">{chartsError}</div>;
  if (!story?.communities) {
    return (
      <div className="sb-state">
        No network map yet. Run <strong>Create Dashboard</strong> from the Review screen.
      </div>
    );
  }

  const { meta, communities, graph, slides, network_stats: stats, spotlight } = story;

  if (!communities.length) {
    return (
      <div className="sb-state">
        No communities of {5} or more posts in this session, so there is no network to map.
      </div>
    );
  }

  const active = communities.find((c) => c.id === openId) || null;
  const TABS = ["NETWORK OVERVIEW", "COMMUNITY MAPPING", "INFLUENCER DEEP-DIVE"];

  return (
    <div className="sb-lens sb-network">
      <div className="topbar">
        {onBack ? (
          <button type="button" className="sb-back" onClick={onBack}>
            ← Back
          </button>
        ) : null}
        <div className="tb-brand">
          {meta.brand} Consumer Intelligence · Communities Network Map
        </div>
        <div className="tb-badge">{meta.total_conversations.toLocaleString()} MENTIONS</div>
      </div>

      <div className="page-tabs">
        {TABS.map((label, i) => (
          <div
            key={label}
            className={`page-tab${i === slide ? " active" : ""}`}
            onClick={() => {
              setSlide(i);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setSlide(i);
              }
            }}
            role="button"
            tabIndex={0}
          >
            {label}
          </div>
        ))}
      </div>

      {/* ---------------------------------------------------------- SLIDE 1 */}
      {slide === 0 ? (
        <div className="slide active">
          <div className="s1-hero">
            {story.hero?.media?.type === "youtube" ? (
              <iframe
                src={youtubeBackgroundSrc(story.hero.media.url)}
                title=""
                allow="autoplay; encrypted-media"
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0, pointerEvents: "none" }}
              />
            ) : story.hero?.media?.url ? (
              <video autoPlay muted loop playsInline poster={story.hero.media.poster || ""}>
                <source src={story.hero.media.url} type="video/mp4" />
              </video>
            ) : null}
            <div className="s1-hero-overlay" />
            <div className="s1-hero-content">
              <div className="s1-hero-eyebrow">{story.hero?.eyebrow}</div>
              <div className="s1-hero-title">{story.hero?.title || "Communities & Voices"}</div>
              {story.hero?.subtitle ? (
                <div className="s1-hero-sub">
                  <Rich text={story.hero.subtitle} />
                </div>
              ) : null}
              <div className="s1-hero-chip">
                <span className="dot" />
                {meta.total_conversations.toLocaleString()} mentions ·{" "}
                {stats.accounts.toLocaleString()} accounts · {communities.length} communities
              </div>
            </div>
          </div>

          <div className="s1-grid">
            <div className="s1-left">
              <div className="s1-eyebrow">{slides[0].eyebrow}</div>
              <div className="s1-title" style={{ fontSize: 38, marginBottom: 18 }}>
                {slides[0].title || "The Network"}
              </div>
              {slides[0].body ? (
                <div className="s1-desc">
                  <Rich text={slides[0].body} />
                </div>
              ) : null}
            </div>

            <div className="s1-right">
              <div className="s1-metric">
                <div className="s1-metric-row">
                  <span className="s1-val">{stats.accounts.toLocaleString()}</span>
                  <span className="s1-lbl">Accounts</span>
                </div>
                <p className="s1-desc-text">
                  Distinct authors posting about {meta.brand} in this window, across{" "}
                  {communities.length} communities.
                </p>
              </div>
              <hr className="s1-divider" />
              <div className="s1-metric">
                <div className="s1-metric-row">
                  <span className="s1-val">~{stats.connections.toLocaleString()}</span>
                  <span className="s1-lbl">Connections</span>
                </div>
                <p className="s1-desc-text">
                  Modelled edges between accounts — co-mentions and shared community
                  membership that bind the conversation together.
                </p>
              </div>
              <hr className="s1-divider" />
              <div className="s1-metric">
                <div className="s1-metric-row">
                  <span className="s1-val">{stats.bridges.toLocaleString()}</span>
                  <span className="s1-lbl">Bridge Accounts</span>
                </div>
                <p className="s1-desc-text">{stats.bridge_note}. These carry a narrative from one room to another.</p>
              </div>
              <hr className="s1-divider" />
              <div>
                <div className="s1-social-title">Conversation Metrics</div>
                {story.conversation_metrics.map((metric) => (
                  <div key={metric.label}>
                    <div className="s1-social-num">{metric.value}</div>
                    <div className="s1-social-sub">{metric.label}</div>
                  </div>
                ))}
                <div className="info-box">
                  <div className="info-box-title">What we did</div>
                  <div className="info-box-text">
                    We used a force-directed layout with modularity and centrality
                    scoring to segment accounts into communities, placing each
                    cluster by how central it is to the {meta.brand} conversation.
                    Communities with more connections (degree) and more
                    cross-cluster reach (betweenness) gravitate to the center.
                  </div>
                </div>
                {story.callout ? (
                  <div className="info-box">
                    <div className="info-box-title">What does this mean?</div>
                    <div className="info-box-text">
                      <Rich text={story.callout} inline />
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="s1-mapband">
            <div className="s1-network-wrap">
              <NetworkCanvas
                communities={communities}
                seed={graph.seed}
                nodeCount={graph.nodes}
                edgeCount={graph.edges}
              />
            </div>
            <p className="s1-note">
              Figures reflect this capture window; connection counts are modelled
              from the mention sample.
            </p>
          </div>
        </div>
      ) : null}

      {/* ---------------------------------------------------------- SLIDE 2 */}
      {slide === 1 ? (
        <div className="slide active">
          <div className="s2-wrap">
            <div className="s2-label">{slides[1].eyebrow}</div>
            <div className="s2-headline">
              {slides[1].body ? (
                <Rich text={slides[1].body} />
              ) : (
                `${communities.length} distinct communities drive the ${meta.brand} conversation.`
              )}
            </div>
            <div className="s2-body">
              <div>
                <div className="s2-network-wrap">
                  <NetworkCanvas
                    communities={communities}
                    seed={graph.seed}
                    nodeCount={graph.nodes}
                    edgeCount={graph.edges}
                    labeled
                    onSelect={openPopup}
                  />
                </div>
                <p className="s2-map-hint">💡 Click the numbered badges for a deep-dive</p>
              </div>
              <div className="comm-cards">
                {communities.map((community) => (
                  <div
                    className="c-card"
                    key={community.id}
                    onClick={() => openDeepDive(community.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openDeepDive(community.id);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="c-card-head">
                      <div className="c-card-title">{community.name}</div>
                      <div className="c-badge" style={{ background: community.color }}>
                        {community.id + 1}
                      </div>
                    </div>
                    <hr className="c-divider" />
                    {community.members?.length ? (
                      <p className="c-members">
                        {community.members.map((m) => (m.startsWith("@") ? m : `@${m}`)).join(" · ")}
                      </p>
                    ) : null}
                    {community.subtitle ? (
                      <div className="c-narrative">
                        <Rich text={community.subtitle} />
                      </div>
                    ) : null}
                    <div className="c-stat-row">
                      <div className="c-stat">
                        <div className="c-stat-val">{community.mentions.toLocaleString()}</div>
                        <div className="c-stat-lbl">Mentions</div>
                      </div>
                      <div className="c-stat">
                        <div className="c-stat-val">{community.engagement_share}%</div>
                        <div className="c-stat-lbl">Eng. Share</div>
                      </div>
                      <div className="c-stat">
                        <div className="c-stat-val">{community.positive_rate}%</div>
                        <div className="c-stat-lbl">Positive</div>
                      </div>
                    </div>
                    <div className="c-explore-row">
                      <span className="c-explore-btn" style={{ background: community.color }}>
                        Full Deep-Dive →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* ---------------------------------------------------------- SLIDE 3 */}
      {slide === 2 ? (
        <div className="slide active">
          <div className="s3-wrap">
            {spotlight ? (
              <>
                <div className="s3-label">
                  {slides[2].eyebrow} · {spotlight.community}
                </div>
                <div className="s3-headline">
                  {slides[2].body ? (
                    <Rich text={slides[2].body} />
                  ) : (
                    "A representative voice from the warmest community in the network."
                  )}
                </div>
                <div className="inf-grid">
                <div className="inf-profile">
                  <div className="inf-avatar" style={{ background: spotlight.color }}>
                    {spotlight.initials}
                  </div>
                  <div className="inf-id">
                    <div className="inf-handle">{spotlight.handle}</div>
                    <div className="inf-role">
                      {spotlight.role || `Active voice · ${spotlight.community}`}
                    </div>
                    {spotlight.bio ? (
                      <div className="inf-bio">
                        <Rich text={spotlight.bio} />
                      </div>
                    ) : null}
                    <div className="inf-tag">
                      Community {spotlight.community_id + 1} · {spotlight.community}
                    </div>
                  </div>
                </div>
                <div className="inf-kpis">
                  {spotlight.kpis.map((kpi) => (
                    <div className="inf-kpi" key={kpi.lbl}>
                      <div className="inf-kpi-val">{kpi.val}</div>
                      <div className="inf-kpi-lbl">{kpi.lbl}</div>
                      <div className="inf-kpi-sub">{kpi.sub}</div>
                    </div>
                  ))}
                </div>
                </div>
                {spotlight.implication ? (
                  <div className="inf-implication">
                    <div className="inf-implication-title">What this voice means</div>
                    <div className="inf-implication-text">
                      <Rich text={spotlight.implication} />
                    </div>
                  </div>
                ) : null}
                {spotlight.quotes?.length ? (
                  <>
                    <div className="inf-sec-title">In their own words</div>
                    {spotlight.quotes.map((quote, i) => (
                      // eslint-disable-next-line react/no-array-index-key -- order is the identity
                      <div className="verbatim" key={i}>
                        <div className="verbatim-text">“{quote.text}”</div>
                        <div className="verbatim-meta">
                          <span className="verbatim-badge">{quote.sentiment}</span>
                          <span className="verbatim-eng">{quote.source}</span>
                        </div>
                      </div>
                    ))}
                  </>
                ) : null}
              </>
            ) : (
              <div className="s3-headline">
                No account in this session posted often enough to profile.
              </div>
            )}
          </div>
        </div>
      ) : null}

      {story.footer?.length ? (
        <div className="foot">
          {story.footer.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </div>
      ) : null}

      <AiPopup
        community={communities.find((c) => c.id === popupId) || null}
        onClose={closePopup}
        onDeepDive={openDeepDive}
      />

      <DeepDive
        community={active}
        communities={communities}
        graph={graph}
        meta={meta}
        onClose={closeDeepDive}
      />
    </div>
  );
}
