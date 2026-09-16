import { useEffect, useRef, useState } from "react";

// Popup to write the Media Monitoring "section" prompt used to classify
// articles into sections during tagging.
export default function SectionPromptModal({
  open,
  initialValue = "",
  saving = false,
  onClose,
  onSave,
}) {
  const [prompt, setPrompt] = useState(initialValue);
  const ref = useRef(null);

  useEffect(() => {
    if (open) {
      setPrompt(initialValue);
      setTimeout(() => ref.current?.focus(), 0);
    }
  }, [open, initialValue]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  function handleSubmit(e) {
    e.preventDefault();
    if (saving) return;
    onSave(prompt.trim());
  }

  return (
    <div className="overlay" onMouseDown={onClose}>
      <div
        className="modal modal--wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sp-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 id="sp-title" className="modal__title">
          Monitoring Section Instructions
        </h2>
        <p className="modal__sub">
          Describe the sections the tagging agent should sort articles into. Use
          the exact section names you want — one per line or in prose.
        </p>

        <form onSubmit={handleSubmit} className="form">
          <label className="field">
            <span className="field__label">Section prompt</span>
            <textarea
              ref={ref}
              className="field__input field__textarea"
              value={prompt}
              rows={10}
              placeholder={
                "e.g.\nBeOne News — articles primarily about BeOne\nCompetitor News — articles about AstraZeneca, Novartis, Roche, Regeneron\nIndustry News — broader oncology / pharma coverage"
              }
              onChange={(e) => setPrompt(e.target.value)}
            />
          </label>

          <div className="form__actions">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={saving}
            >
              {saving ? "Saving…" : "Save section prompt"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
