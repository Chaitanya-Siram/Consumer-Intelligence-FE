import { LENSES } from "./constants.js";
import { TIER1_LENSES, TIER2_LENSES } from "./tierLensData.js";

const LENS_TYPES = [
  { key: "intelligence", label: "Media Intelligence Lens" },
  { key: "tier1", label: "Consumer Intelligence Tier 1 Lens" },
];

// Single "Lens" selector:
//   1. Choose lens type (Intelligence Lens | Tier 1 Lens)
//   2. Choose specific lens from that type
//   3. If Tier 1 chosen → Tier 2 checkboxes appear
//
// Stored on node data:
//   d.lensType  — 'intelligence' | 'tier1'
//   d.lens      — specific lens key
//   d.tier2     — array of selected tier 2 labels (tier1 only)
export default function UnifiedLensPanel({ lensType, lens, tier2 = [], set, showErrors, otherSelectedLenses = [] }) {
  function handleTypeChange(e) {
    set({ lensType: e.target.value, lens: "", tier2: [] });
  }

  function handleLensChange(e) {
    const key = e.target.value;
    if (lensType === "tier1") {
      const allTier2 = (TIER2_LENSES[key] || []).map((t) => t.label);
      set({ lens: key, tier2: allTier2 });
    } else {
      set({ lens: key, tier2: [] });
    }
  }

  function handleTier2Change(label, checked) {
    const next = checked ? [...tier2, label] : tier2.filter((v) => v !== label);
    set({ tier2: next });
  }

  const lensOptions = lensType === "intelligence" ? LENSES : lensType === "tier1" ? TIER1_LENSES : [];

  return (
    <>
      {/* Step 1 — lens type */}
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
          Intelligence Lens
        </label>

        <select
          className="wfinput"
          value={lensType || ""}
          onChange={handleTypeChange}
          style={showErrors && !lensType ? { borderColor: "var(--red, #ef4444)" } : undefined}
        >
          <option value="">Select a lens…</option>
          {LENS_TYPES.map((t) => (
            <option key={t.key} value={t.key}>
              {t.label}
            </option>
          ))}
        </select>

        {showErrors && !lensType && (
          <span style={{ fontSize: 12, color: "var(--red, #ef4444)" }}>
            A lens type must be selected.
          </span>
        )}
      </div>

      {/* Step 2 — specific lens (appears after type is chosen) */}
      {lensType && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <select
            className="wfinput"
            value={lens || ""}
            onChange={handleLensChange}
            style={showErrors && !lens ? { borderColor: "var(--red, #ef4444)" } : undefined}
          >
            <option value="">Select a lens…</option>
            {lensOptions.map((l) => {
              const isTaken = otherSelectedLenses.includes(l.key);
              return (
                <option key={l.key} value={l.key} disabled={isTaken}>
                  {l.label}
                  {isTaken ? " (Already selected in another node)" : ""}
                </option>
              );
            })}
          </select>

          {showErrors && !lens && (
            <span style={{ fontSize: 12, color: "var(--red, #ef4444)" }}>
              A specific lens must be selected.
            </span>
          )}
        </div>
      )}

      {/* Step 3 — Tier 2 checkboxes (tier1 only, after specific lens chosen) */}
      {lensType === "tier1" && lens && TIER2_LENSES[lens] && (
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
            {TIER2_LENSES[lens].map((t2) => {
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
