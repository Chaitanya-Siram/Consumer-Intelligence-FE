import { Rich } from "../utils/text.jsx";

export function TopNarrativesList({ narratives }) {
  if (!narratives || narratives.length === 0) return null;

  return (
    <div
      className="top-narratives-list"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        marginBottom: "24px",
      }}
    >
      <h3
        style={{
          fontSize: "16px",
          fontWeight: 600,
          color: "var(--text)",
          margin: "0 0 8px",
        }}
      >
        Top Narratives
      </h3>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "16px",
        }}
      >
        {narratives.map((narrative, i) => (
          <div
            key={i}
            style={{
              background: "#fff",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {(narrative.tags || []).map((tag, j) => (
                <span
                  key={j}
                  style={{
                    background: "rgba(99, 102, 241, 0.1)",
                    color: "#6366f1",
                    padding: "4px 8px",
                    borderRadius: "6px",
                    fontSize: "10.5px",
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>

            <h4
              style={{
                fontSize: "15px",
                fontWeight: 600,
                color: "var(--text)",
                margin: 0,
                lineHeight: 1.4,
              }}
            >
              {narrative.title}
            </h4>

            <p
              style={{
                fontSize: "13px",
                color: "var(--text-soft)",
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              <Rich text={narrative.summary} />
            </p>

            <div
              style={{
                marginTop: "auto",
                paddingTop: "12px",
                borderTop: "1px solid var(--border-light)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: "12px",
                  color: "var(--text-soft)",
                  fontWeight: 500,
                }}
              >
                Coverage:{" "}
                <strong style={{ color: "var(--text)" }}>
                  {narrative.coverage}
                </strong>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
