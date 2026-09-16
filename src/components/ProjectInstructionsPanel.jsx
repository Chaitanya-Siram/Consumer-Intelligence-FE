import { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { getProject, addSectionsPrompt } from "../api/projects.js";

const PLACEHOLDER = `## Client & Project Context
Who is the client? What industry, market position, communications goals?

## Key Narratives to Track
What messaging or narratives should the analysis prioritise?

## Competitors
Which organisations to watch for Share of Voice and benchmarking?

## Analysis Priorities
What matters most — sentiment, reach, themes, risk signals?

## Tone & Framing
How should insights be framed — executive summary, analyst depth, technical detail?`;

export default function ProjectInstructionsPanel({
  projectId,
  projectName,
  initialValue = "",
  onClose,
  onSave,
}) {
  const [content, setContent] = useState(initialValue || "");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (!projectId) {
      setContent(initialValue || "");
      setLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 80);
      return;
    }

    setLoading(true);
    getProject(projectId)
      .then((proj) => {
        // API returns monitoring_sections_prompt in project response
        const savedPrompt =
          proj?.monitoring_sections_prompt || proj?.sections_prompt;
        if (savedPrompt) {
          setContent(savedPrompt);
        } else {
          setContent(initialValue || "");
        }
      })
      .catch(console.error)
      .finally(() => {
        setLoading(false);
        setTimeout(() => textareaRef.current?.focus(), 80);
      });
  }, [projectId, initialValue]);

  async function handleSave() {
    setSaving(true);
    try {
      if (projectId) {
        await addSectionsPrompt(projectId, content);
        toast.success("Monitoring section instructions saved.");
      }
      if (onSave) {
        onSave(content);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Failed to save project instructions.");
    } finally {
      setSaving(false);
    }
  }

  // Handle Escape key to close
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <>
      {/* Transparent click-catcher — closes when user clicks outside the panel */}
      <div
        onMouseDown={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 199,
          background: "transparent",
        }}
      />

      {/* Panel — anchored to the right of the sidebar (sidebar: left 16px + width 208px + 16px gap = 240px) */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Monitoring Section Instructions"
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          position: "fixed",
          top: "68px",
          left: "252px",
          zIndex: 200,
          display: "flex",
          flexDirection: "column",
          width: "580px",
          maxWidth: "calc(100vw - 256px)",
          height: "560px",
          maxHeight: "calc(100vh - 84px)",
          background: "#ffffff",
          borderRadius: "18px",
          boxShadow:
            "0 20px 60px -12px rgba(0, 0, 0, 0.28), 0 0 0 1px rgba(0,0,0,0.07)",
          overflow: "hidden",
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 20px 16px 20px",
          }}
        >
          {/* Left: icon + title block */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* Purple book icon in rounded square */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "38px",
                height: "38px",
                borderRadius: "9px",
                background: "rgba(124, 58, 237, 0.12)",
                flexShrink: 0,
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#7c3aed"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
            </div>
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "#1a1a2e",
                  lineHeight: 1.2,
                  letterSpacing: "-0.01em",
                }}
              >
                Monitoring Section Instructions
              </h2>
              <p
                style={{
                  margin: "3px 0 0 0",
                  fontSize: "12px",
                  color: "#8b8fa8",
                  fontWeight: 400,
                }}
              >
                {projectName || "Untitled Project"}
              </p>
            </div>
          </div>

          {/* Right: X close button in rounded square */}
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              border: "1px solid rgba(0,0,0,0.1)",
              background: "#f5f5f7",
              cursor: "pointer",
              color: "#6b7280",
              transition: "background 0.15s",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#eaeaec";
              e.currentTarget.style.borderColor = "rgba(0,0,0,0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#f5f5f7";
              e.currentTarget.style.borderColor = "rgba(0,0,0,0.1)";
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* ── Body / Textarea ── */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            padding: "0 16px 16px 16px",
          }}
        >
          {loading ? (
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "380px",
                background: "#f7f7f9",
                borderRadius: "12px",
                color: "#9ca3af",
                fontSize: "13px",
              }}
            >
              Loading instructions…
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={PLACEHOLDER}
              spellCheck={false}
              style={{
                flex: 1,
                height: "100%",
                minHeight: "260px",
                width: "100%",
                boxSizing: "border-box",
                resize: "none",
                overflowY: "auto",
                borderRadius: "12px",
                padding: "18px 16px",
                fontSize: "13px",
                lineHeight: "1.75",
                fontFamily:
                  '"SFMono-Regular", "Menlo", "Monaco", "Consolas", "Liberation Mono", "Courier New", monospace',
                background: "#f7f7f9",
                border: "1.5px solid transparent",
                color: "#374151",
                outline: "none",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "rgba(124, 58, 237, 0.25)";
                e.target.style.background = "#f9f8ff";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "transparent";
                e.target.style.background = "#f7f7f9";
              }}
            />
          )}
        </div>

        {/* ── Footer ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 20px 18px 20px",
            borderTop: "1px solid rgba(0,0,0,0.07)",
            background: "#ffffff",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "11.5px",
              color: "#9ca3af",
              fontWeight: 400,
            }}
          >
            Markdown · injected as context into every Analysis run
          </p>

          <button
            onClick={handleSave}
            disabled={saving || !content.trim()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              height: "34px",
              padding: "0 18px",
              fontSize: "13px",
              fontWeight: 600,
              background: saving
                ? "#9ca3af"
                : saved
                  ? "#10b981"
                  : content.trim()
                    ? "#7c3aed"
                    : "#c4b5fd",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: saving || !content.trim() ? "not-allowed" : "pointer",
              transition: "background 0.18s, transform 0.1s",
              letterSpacing: "0.01em",
              boxShadow:
                content.trim() && !saving && !saved
                  ? "0 2px 8px rgba(124, 58, 237, 0.35)"
                  : "none",
            }}
            onMouseEnter={(e) => {
              if (!saving && !saved && content.trim()) {
                e.currentTarget.style.background = "#6d28d9";
                e.currentTarget.style.transform = "translateY(-1px)";
              }
            }}
            onMouseLeave={(e) => {
              if (!saving && !saved) {
                e.currentTarget.style.background = content.trim()
                  ? "#7c3aed"
                  : "#c4b5fd";
                e.currentTarget.style.transform = "none";
              }
            }}
          >
            {saving ? (
              <span>Saving…</span>
            ) : saved ? (
              <>
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Saved</span>
              </>
            ) : (
              <>
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                <span>Save</span>
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
