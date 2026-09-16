import { useState } from "react";

// Keyword chip input. Press Enter or comma to add, Backspace (on an empty
// field) to remove the last chip. Used for brand / competitor keywords.
// When `required`, at least one chip must remain — the last can't be removed.
export default function TagInput({
  value = [],
  onChange,
  placeholder = "Add keyword…",
  tone = "brand",
  required = false,
  showErrors = false,
}) {
  const [draft, setDraft] = useState("");

  // Brand keyword is single-value: at most one chip is allowed.
  const isBrand = tone === "brand";
  const atMax = isBrand && value.length >= 1;

  function commit(raw) {
    const next = raw.trim().replace(/,$/, "").trim();
    if (!next) return;
    if (atMax) {
      setDraft("");
      return;
    }
    if (!value.includes(next)) onChange([...value, next]);
    setDraft("");
  }

  function onKeyDown(e) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit(draft);
    } else if (e.key === "Backspace" && draft === "" && value.length) {
      onChange(value.slice(0, -1));
    }
  }

  // Removal is always allowed — the `required` rule is enforced by save-time
  // validation (the field shows invalid when emptied), not by blocking removal.
  function remove(k) {
    onChange(value.filter((x) => x !== k));
  }

  const invalid = showErrors && required && value.length === 0;
  return (
    <div
      className={`taginput${invalid ? " taginput--invalid" : ""}`}
      // This widget sits inside a <label> (Field). A click on the field's
      // whitespace makes the label forward the click to its first interactive
      // child — the remove button — which was deleting the chip (notably for
      // brand, where the input is hidden once a keyword exists). Swallow those
      // whitespace clicks so they never reach the button.
      onClick={(e) => {
        if (e.target === e.currentTarget) e.preventDefault();
      }}
    >
      {value.map((k) => (
        <span className={`pill pill--${tone}`} key={k}>
          {k}
          <button
            type="button"
            className="taginput__x"
            aria-label={`Remove ${k}`}
            // Prevent the focused field from blurring (which fires commit + a
            // re-render) before the click lands — that race swallowed the remove.
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              remove(k);
            }}
            title={`Remove ${k}`}
          >
            ×
          </button>
        </span>
      ))}
      {!atMax && (
        <input
          className="taginput__field"
          value={draft}
          placeholder={value.length ? "" : placeholder}
          onChange={(e) => {
            setDraft(e.target.value);
          }}
          onKeyDown={onKeyDown}
          onBlur={() => commit(draft)}
          onPaste={(e) => {
            const clipboard = e.clipboardData;
            let items = [];

            const html = clipboard.getData("text/html");
            if (html) {
              const doc = new DOMParser().parseFromString(html, "text/html");
              const nodes = doc.body.querySelectorAll("li, p");
              if (nodes.length > 0) {
                items = Array.from(nodes)
                  .map((n) => n.textContent?.trim() || "")
                  .filter(Boolean);
              } else {
                items = doc.body.innerHTML
                  .split(/<br\s*\/?>/i)
                  .map((t) => t.replace(/<[^>]+>/g, "").trim())
                  .filter(Boolean);
              }
            }

            if (items.length === 0) {
              const text = clipboard.getData("text/plain");
              if (text) {
                const normalized = text
                  .replace(/\r\n/g, "\n")
                  .replace(/\r/g, "\n")
                  .trim();

                items = normalized
                  .split("\n")
                  .map((t) => t.trim())
                  .filter(Boolean);
              }
            }

            if (items.length > 0) {
              e.preventDefault();
              let newValues = [...value];
              
              const currentDraft = draft.trim();
              if (currentDraft && !newValues.includes(currentDraft)) {
                newValues.push(currentDraft);
              }
              setDraft("");

              for (const item of items) {
                if (isBrand && newValues.length >= 1) break;
                if (!newValues.includes(item)) {
                  newValues.push(item);
                }
              }

              onChange(newValues);
            }
          }}
        />
      )}
    </div>
  );
}
