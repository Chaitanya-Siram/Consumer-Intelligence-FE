import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { tier1Label, tier1Image, tier2Options } from "../workflow/tierLensData.js";
import { tileFor } from "../components/Icons.jsx";
import { paths } from "../router/nav.js";

// Tier 2 gallery for one of the "Our Core Offering: Intelligent Architecture"
// Tier 1 lenses. Most sub-lenses are UI/navigation only for now — there is no
// backend aggregation behind them yet, so their cards show placeholder copy
// and a "coming soon" toast. A sub-lens carrying a `route` (e.g. under Brand
// Intelligence, or Network Map Analysis) is real: it opens the existing
// charts-backed dashboard instead, optionally on a specific `slide`.
export default function IntelLensScreen({
  tier1Key,
  selectedTier2,
  projectId,
  sessionId,
  project,
  session,
  chartsData,
  onBack,
}) {
  const navigate = useNavigate();
  const title = tier1Label(tier1Key);
  const image = tier1Image(tier1Key);
  const allTier2 = tier2Options(tier1Key);
  // A cold deep-link (no navigation state) has no selection to filter by —
  // show every sub-lens under the pillar rather than an empty page.
  const tier2 =
    Array.isArray(selectedTier2) && selectedTier2.length
      ? allTier2.filter((t2) => selectedTier2.includes(t2.label))
      : allTier2;

  return (
    <div style={{ padding: "8px 4px 64px" }}>
      <button
        type="button"
        onClick={onBack}
        style={{
          background: "var(--bg-2, #f1f5f9)",
          border: "1px solid var(--border, #e2e8f0)",
          borderRadius: 8,
          padding: "7px 14px",
          color: "var(--text, #334155)",
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 500,
          marginBottom: 28,
        }}
      >
        ← Dashboards
      </button>

      <div style={{ marginBottom: 36 }}>
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--accent, #2563eb)",
            margin: "0 0 8px",
          }}
        >
          Empowering Businesses Through Actionable Intelligence
        </p>
        <h1
          style={{
            fontSize: 30,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: "var(--text-1, #0f172a)",
            margin: "0 0 10px",
          }}
        >
          {title}
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "var(--text-muted, #64748b)",
            margin: 0,
            maxWidth: 720,
          }}
        >
          {tier2.length} sub-lens{tier2.length === 1 ? "" : "es"} under this
          pillar. Select one to explore its focus.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 18,
        }}
      >
        {tier2.map((t2, idx) => {
          const { bg, fg } = tileFor(idx);
          const cardImage = t2.image || image;
          const routeBuilder = t2.route ? paths[t2.route] : null;
          const handleClick = () => {
            if (routeBuilder) {
              navigate(routeBuilder(projectId, sessionId), {
                state: {
                  project,
                  session,
                  chartsData,
                  initialSlide: t2.slide,
                  backTo: paths.intel(projectId, sessionId, tier1Key),
                  // Carried through so the destination's own "Back" button can
                  // restore this same filtered gallery instead of falling back
                  // to showing every sub-lens (checked and unchecked alike).
                  selectedTier2,
                },
              });
            } else {
              toast(`${t2.label} — detailed analytics coming soon.`);
            }
          };
          return (
            <button
              key={t2.label}
              type="button"
              onClick={handleClick}
              style={{
                background: "var(--surface, #fff)",
                border: "1px solid var(--border, #e2e8f0)",
                borderRadius: 14,
                padding: 0,
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.18s ease",
                overflow: "hidden",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.10)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {cardImage ? (
                <div
                  style={{
                    position: "relative",
                    height: 110,
                    overflow: "hidden",
                    background: "var(--bg-2, #f1f5f9)",
                  }}
                >
                  <img
                    src={cardImage}
                    alt=""
                    loading="lazy"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: `linear-gradient(135deg, ${fg}33 0%, ${fg}66 100%)`,
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: 10,
                      right: 10,
                      background: "rgba(255,255,255,0.95)",
                      color: fg,
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: 4,
                    }}
                  >
                    #{String(idx + 1).padStart(2, "0")}
                  </div>
                </div>
              ) : null}
              <div style={{ padding: "16px 20px 18px" }}>
                {!cardImage ? (
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 9,
                      background: bg,
                      color: fg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      fontWeight: 700,
                      marginBottom: 14,
                    }}
                  >
                    {String(idx + 1).padStart(2, "0")}
                  </div>
                ) : null}
                <h3
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "var(--text-1, #0f172a)",
                    margin: "0 0 6px",
                  }}
                >
                  {t2.label}
                </h3>
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--text-muted, #64748b)",
                    margin: "0 0 12px",
                    lineHeight: 1.5,
                  }}
                >
                  {t2.description}
                </p>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    color: routeBuilder ? fg : "var(--text-muted, #94a3b8)",
                  }}
                >
                  {routeBuilder ? "Open dashboard →" : "Coming soon"}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
