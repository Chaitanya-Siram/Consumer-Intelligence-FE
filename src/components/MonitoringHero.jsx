import { useEffect, useRef, useState } from "react";
// import HeroCanvas from './HeroCanvas.jsx'  // commented out — replaced by video bg
import { DownloadIcon } from "./Icons.jsx";

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Pick the highest quality mp4 file ≤ 1080p from a video_files array. */
function pickBestFile(videoFiles = []) {
  const mp4 = videoFiles
    .filter((f) => f.file_type === "video/mp4" && f.width <= 1920)
    .sort((a, b) => b.width - a.width);
  return mp4[0]?.link ?? null;
}

// ─── Pexels hook ──────────────────────────────────────────────────────────────

function usePexelsVideo(session, chartsData) {
  // const [bgVideoSrc, setBgVideoSrc] = useState()
  // const [pexelsVideos, setPexelsVideos] = useState([])

  const [bgVideoSrc, setBgVideoSrc] = useState();
  const [pexelsVideos, setPexelsVideos] = useState([]);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const fetchPexelsVideos = async (brandKeyword) => {
      const apiKey = import.meta.env.VITE_PEXELS_API_KEY;
      if (!apiKey) {
        console.warn("[usePexelsVideo] VITE_PEXELS_API_KEY not set in .env");
        return;
      }

      const cleanQuery = (brandKeyword || "business technology")
        .replace(/['"’]/g, "")
        .trim();
      const pexelsBase = import.meta.env.DEV
        ? "/api-pexels"
        : "https://api.pexels.com";
      const url = `${pexelsBase}/videos/search?query=${encodeURIComponent(cleanQuery)}&per_page=15&orientation=landscape&locale=en-US`;

      try {
        const res = await fetch(url, { headers: { Authorization: apiKey } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const videos = data.videos ?? [];

        const mp4Links = [];
        for (const video of videos) {
          const link = pickBestFile(video.video_files ?? []);
          if (link && !mp4Links.includes(link)) {
            mp4Links.push(link);
          }
          if (mp4Links.length >= 4) break;
        }

        if (mp4Links.length > 0) {
          setPexelsVideos(mp4Links);
          setBgVideoSrc(mp4Links[0]);
        } else if (query !== "business technology") {
          fetchedRef.current = false; // allow retry with fallback
          fetchPexelsVideos("business technology");
        }
      } catch (err) {
        console.warn("[usePexelsVideo] fetch failed:", err.message);
      }
    };

    // Derive query from session.brand_keywords
    const brandKeywords = session?.brand_keywords ?? [];
    const query = brandKeywords.length > 0 ? brandKeywords[0] : null;
    fetchPexelsVideos(query);
  }, [session]); // eslint-disable-line react-hooks/exhaustive-deps

  return { bgVideoSrc, pexelsVideos, setBgVideoSrc };
}

// ─── sub-components ──────────────────────────────────────────────────────────

const PenIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={15}
    height={15}
  >
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);

// ─── main component ───────────────────────────────────────────────────────────

/**
 * MonitoringHero — full-bleed video hero for the Daily Monitoring view.
 *
 * Props:
 *   session        — the current session object (used for brand_keywords)
 *   chartsData     — raw charts payload; reads overall_assessment at root level
 *   meta           — optional { name } override for the hero title
 *   virtualReport  — { day, date, total, pos, neut, neg } for the KPI card
 *   kicker / headLead / headEm / sub / stats — legacy text props (still supported)
 *   onBack / onDownload / downloading / downloadDisabled / downloadError — actions
 */
export default function MonitoringHero({
  session,
  chartsData,
  meta,
  virtualReport,
  kicker,
  headLead,
  headEm,
  sub,
  stats = [],
  onBack,
  onDownload,
  downloading = false,
  downloadDisabled = false,
  downloadError = "",
  project,
}) {
  const { bgVideoSrc } = usePexelsVideo(session, chartsData);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        minHeight: 360,
        overflow: "hidden",
        flexShrink: 0,
        background:
          "linear-gradient(135deg, #0D1628 0%, #160D2E 50%, #0A2540 100%)",
        borderRadius: 20,
      }}
    >
      {/* ── Background video ─────────────────────────────────────────── */}
      {bgVideoSrc && (
        <video
          key={bgVideoSrc}
          autoPlay
          loop
          muted
          playsInline
          src={bgVideoSrc}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 1,
            filter: "saturate(0.65) brightness(0.85)",
            mixBlendMode: "screen",
          }}
        />
      )}

      {/* ── Radial auras ─────────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: [
            "radial-gradient(ellipse 55% 90% at 10% 65%, rgba(139,53,214,0.5) 0%, transparent 60%)",
            "radial-gradient(ellipse 45% 75% at 88% 45%, rgba(61,217,214,0.32) 0%, transparent 55%)",
            "radial-gradient(ellipse 40% 60% at 50% 10%, rgba(99,91,255,0.2) 0%, transparent 50%)",
          ].join(", "),
        }}
      />

      {/* ── Bottom-to-top fade so text sits cleanly ──────────────────── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "linear-gradient(to bottom, rgba(13,22,40,0.05) 0%, rgba(13,22,40,0.55) 60%, rgba(13,22,40,0.85) 100%)",
        }}
      />

      {/* ── Top action bar (back + download) ─────────────────────────── */}
      {(onBack || onDownload) && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "14px 28px",
            background:
              "linear-gradient(to bottom, rgba(13,22,40,0.6) 0%, transparent 100%)",
          }}
        >
          {onBack ? (
            <button
              onClick={onBack}
              style={{
                background: "rgba(0, 0, 0, 1)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "rgba(255, 255, 255, 0.8)",
                borderRadius: 20,
                padding: "6px 14px",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontFamily: "Inter, SF Pro Display, sans-serif",
                transition: "background 0.2s, color 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.16)";
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                e.currentTarget.style.color = "rgba(255,255,255,0.8)";
              }}
            >
              ← Back to dashboards
            </button>
          ) : (
            <span />
          )}

          {onDownload && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: 4,
              }}
            >
              <button
                onClick={onDownload}
                disabled={downloading || downloadDisabled}
                title={
                  downloadDisabled
                    ? "No articles in the current selection to export"
                    : "Download the current view as a Word report"
                }
                style={{
                  background:
                    downloading || downloadDisabled
                      ? "rgba(255,255,255,0.04)"
                      : "rgba(255,255,255,0.12)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  color:
                    downloading || downloadDisabled
                      ? "rgba(255,255,255,0.35)"
                      : "#fff",
                  borderRadius: 20,
                  padding: "6px 14px",
                  fontSize: 12,
                  cursor:
                    downloading || downloadDisabled ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontFamily: "Inter, SF Pro Display, sans-serif",
                }}
              >
                <DownloadIcon width={13} height={13} />
                {downloading ? "Preparing…" : "Download report"}
              </button>
              {downloadError && (
                <p style={{ margin: 0, fontSize: 11, color: "#FF6B6B" }}>
                  {downloadError}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Hero text + KPI card ──────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          bottom: 24,
          left: 36,
          right: 36,
          zIndex: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: 40,
          flexWrap: "wrap",
          paddingTop: 72, // space for the top bar on short screens
        }}
      >
        {/* Left — title + assessment */}
        <div style={{ flex: 1, minWidth: 280 }}>
          <button
            className="brand-BrandHero "
            // onClick={() => navigate(paths.project(projectId))}
          >
            <span className="brand__dot" />
            {project?.name || "Intelligence"}
          </button>
          <div
            style={{
              fontSize: 12,
              fontFamily: "Inter, SF Pro Display, sans-serif",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.9)",
              marginBottom: 8,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span
              style={{
                width: 9,
                height: 9,
                borderRadius: "50%",
                background: "#4CB782",
                display: "inline-block",
                boxShadow: "0 0 6px #4CB782",
                fontFamily: "Inter, SF Pro Display, sans-serif",
              }}
            />
            {kicker || "Media Monitoring · Live"}
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: "clamp(22px, 3vw, 32px)",
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
            }}
          >
            {meta?.name ?? headLead ?? "Media Monitoring"}
            {headEm && (
              <em
                style={{ fontStyle: "normal", color: "rgba(255,255,255,0.75)" }}
              >
                {" "}
                {headEm}
              </em>
            )}
          </h1>

          {/* overall_assessment from chartsData (root-level) */}
          {chartsData?.overall_assessment && (
            <p
              style={{
                margin: "10px 0 0",
                fontSize: 12.5,
                color: "rgba(255,255,255,0.7)",
                lineHeight: 1.55,
                maxWidth: 650,
              }}
            >
              {chartsData.overall_assessment.replace(/\*\*/g, "")}
            </p>
          )}

          {/* Legacy sub text (shown when no overall_assessment) */}
          {!chartsData?.overall_assessment && sub && (
            <p
              style={{
                margin: "10px 0 0",
                fontSize: 12.5,
                color: "rgba(255,255,255,0.6)",
                lineHeight: 1.55,
                maxWidth: 600,
              }}
            >
              {sub}
            </p>
          )}

          {/* Legacy stats row */}
          {stats.length > 0 && (
            <div style={{ display: "flex", gap: 20, marginTop: 14 }}>
              {stats.map((s, i) => (
                <div
                  key={i}
                  style={{ display: "flex", flexDirection: "column", gap: 2 }}
                >
                  <span
                    style={{
                      fontSize: 20,
                      fontWeight: 800,
                      color: "#fff",
                      fontFamily: "JetBrains Mono, monospace",
                    }}
                  >
                    {s.n}
                  </span>
                  <span
                    style={{
                      fontSize: 9,
                      color: "rgba(255,255,255,0.5)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {s.l}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right — glassmorphic KPI card */}
        {virtualReport && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              background: "rgba(255,255,255,0.08)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.12)",
              padding: "16px 20px",
              borderRadius: 16,
              width: 380,
              boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
              flexShrink: 0,
            }}
          >
            {/* Date header row */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: 9.5,
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.6)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                {virtualReport.day} · {virtualReport.date}
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: "#ffffff",
                  background: "rgba(255,255,255,0.15)",
                  padding: "2px 8px",
                  borderRadius: 20,
                  fontFamily: "JetBrains Mono, monospace",
                }}
              >
                {virtualReport.total} Articles
              </span>
            </div>

            {/* Sentiment counts */}
            <div style={{ display: "flex", gap: 16, marginTop: 4 }}>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 900,
                    color: "#4CB782",
                    fontFamily: "JetBrains Mono, monospace",
                  }}
                >
                  {virtualReport.pos}
                </div>
                <div
                  style={{
                    fontSize: 8.5,
                    color: "rgba(255,255,255,0.5)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Positive
                </div>
              </div>
              <div
                style={{
                  flex: 1,
                  borderLeft: "1px solid rgba(255,255,255,0.1)",
                  paddingLeft: 16,
                }}
              >
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 900,
                    color: "#E0E0E0",
                    fontFamily: "JetBrains Mono, monospace",
                  }}
                >
                  {virtualReport.neut}
                </div>
                <div
                  style={{
                    fontSize: 8.5,
                    color: "rgba(255,255,255,0.5)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Neutral
                </div>
              </div>
              <div
                style={{
                  flex: 1,
                  borderLeft: "1px solid rgba(255,255,255,0.1)",
                  paddingLeft: 16,
                }}
              >
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 900,
                    color: "#FF6B6B",
                    fontFamily: "JetBrains Mono, monospace",
                  }}
                >
                  {virtualReport.neg}
                </div>
                <div
                  style={{
                    fontSize: 8.5,
                    color: "rgba(255,255,255,0.5)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Negative
                </div>
              </div>
            </div>

            {/* Sentiment progress bar */}
            {virtualReport.total > 0 && (
              <div
                style={{
                  height: 4,
                  borderRadius: 99,
                  overflow: "hidden",
                  display: "flex",
                  gap: 1,
                  marginTop: 6,
                  background: "rgba(255,255,255,0.1)",
                }}
              >
                {virtualReport.pos > 0 && (
                  <div
                    style={{ flex: virtualReport.pos, background: "#4CB782" }}
                  />
                )}
                {virtualReport.neut > 0 && (
                  <div
                    style={{
                      flex: virtualReport.neut,
                      background: "rgba(255,255,255,0.45)",
                    }}
                  />
                )}
                {virtualReport.neg > 0 && (
                  <div
                    style={{ flex: virtualReport.neg, background: "#FF6B6B" }}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
