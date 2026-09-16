import { TIER1_LENSES, TIER2_LENSES } from "./tierLensData.js";

// Renders the Tier 1 Lens dropdown + Tier 2 sub-lens checkboxes.
// Props:
//   tier1   — string  — currently selected Tier 1 key (d.tier1)
//   tier2   — array   — array of selected Tier 2 labels (d.tier2)
//   set     — fn      — node data setter, same signature as AnalysisPanel's set
//   showErrors — bool
export default function TierLensPanel({ tier1, tier2 = [], set, showErrors }) {
  function handleTier1Change(e) {
    const key = e.target.value;
    // Pre-check all Tier 2 sub-lenses when a new Tier 1 is selected
    const allTier2 = (TIER2_LENSES[key] || []).map((t) => t.label);
    set({ tier1: key, tier2: allTier2 });
  }

  function handleTier2Change(label, checked) {
    const next = checked
      ? [...tier2, label]
      : tier2.filter((v) => v !== label);
    set({ tier2: next });
  }

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--label, var(--text))",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          Tier 1 Lens
        </label>

        <select
          className="wfinput"
          value={tier1 || ""}
          onChange={handleTier1Change}
          style={showErrors && !tier1 ? { borderColor: "var(--red, #ef4444)" } : undefined}
        >
          <option value="">Select a lens…</option>
          {TIER1_LENSES.map((l) => (
            <option key={l.key} value={l.key}>
              {l.label}
            </option>
          ))}
        </select>

        {showErrors && !tier1 && (
          <span style={{ fontSize: 12, color: "var(--red, #ef4444)" }}>
            A Tier 1 Lens must be selected.
          </span>
        )}
      </div>

      {TIER2_LENSES[tier1] && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--label, var(--text))",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            Tier 2 Lens
          </label>

          <span style={{ fontSize: 12, color: "var(--hint, var(--text))", opacity: 0.7 }}>
            Select at least one sub-lens.
          </span>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {TIER2_LENSES[tier1].map((t2) => {
              const checked = tier2.includes(t2.label);
              return (
                <label
                  key={t2.label}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 8,
                    cursor: "pointer",
                    fontSize: 13,
                    color: "var(--text)",
                    userSelect: "none",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => handleTier2Change(t2.label, e.target.checked)}
                    style={{ width: 14, height: 14, marginTop: 2, cursor: "pointer" }}
                  />
                  <span>{t2.label}</span>
                </label>
              );
            })}
          </div>

          {showErrors && tier2.length === 0 && (
            <span style={{ fontSize: 12, color: "var(--red, #ef4444)" }}>
              At least one Tier 2 sub-lens must be selected.
            </span>
          )}
        </div>
      )}
    </>
  );
}
