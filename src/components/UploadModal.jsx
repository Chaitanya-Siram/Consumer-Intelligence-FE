import { useEffect, useRef, useState } from "react";

const splitList = (s) =>
  s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

export default function UploadModal({
  open,
  projectId,
  onClose,
  onUploaded,
  defaultKeywords,
}) {
  const [file, setFile] = useState(null);
  const [brand, setBrand] = useState("");
  const [competitors, setCompetitors] = useState("");
  const [messages, setMessages] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef(null);

  // Prefill keyword fields from the most recent session's workflow details so a
  // re-upload reuses the same brand / competitor / message keywords.
  useEffect(() => {
    if (open) {
      setFile(null);
      setBrand((defaultKeywords?.brandKeywords || []).join(", "));
      setCompetitors((defaultKeywords?.competitorKeywords || []).join(", "));
      setMessages((defaultKeywords?.messageKeywords || []).join(", "));
      setError("");
      setSubmitting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
    // Only re-initialise when the modal opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    const brandKeywords = splitList(brand);
    const competitorKeywords = splitList(competitors);
    const messageKeywords = splitList(messages);

    if (!file) return setError("Please choose a file to upload.");
    if (brandKeywords.length !== 1)
      return setError("Enter exactly one brand keyword.");
    if (competitorKeywords.length === 0)
      return setError("Enter at least one competitor keyword.");
    if (messageKeywords.length === 0)
      return setError("Enter at least one message keyword.");

    setError("");
    setSubmitting(true);
    try {
      // Parent persists the file (save) and navigates to the new session's
      // review page for tagging. Awaiting keeps the modal open on failure.
      await onUploaded({
        file,
        brandKeywords,
        competitorKeywords,
        messageKeywords,
      });
    } catch (err) {
      setError(err?.message || "Upload failed. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="overlay" onMouseDown={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 id="upload-title" className="modal__title">
          Upload file
        </h2>
        <p className="modal__sub">
          Add a CSV, Excel, or JSON file to this project.
        </p>

        <form onSubmit={handleSubmit} className="form">
          <label className="field">
            <span className="field__label">File</span>
            <input
              ref={fileRef}
              className="field__input field__file"
              type="file"
              accept=".csv,.xlsx,.xls,.json"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>

          <label className="field">
            <span className="field__label">Brand keyword</span>
            <input
              className="field__input"
              type="text"
              value={brand}
              placeholder="e.g. Lumen"
              disabled

              // onChange={(e) => setBrand(e.target.value)}
            />
          </label>

          <label className="field">
            <span className="field__label">
              Competitor keywords{" "}
              <span className="field__opt">(comma-separated)</span>
            </span>
            <input
              className="field__input"
              type="text"
              value={competitors}
              placeholder="e.g. Vertex, Northstar"
              disabled
              // onChange={(e) => setCompetitors(e.target.value)}
            />
          </label>

          <label className="field">
            <span className="field__label">
              Message keywords{" "}
              <span className="field__opt">(comma-separated)</span>
            </span>
            <input
              className="field__input"
              type="text"
              value={messages}
              disabled
              placeholder="e.g. innovation, sustainability"
              // onChange={(e) => setMessages(e.target.value)}
            />
          </label>

          {error && <p className="form__error">{error}</p>}

          <div className="form__actions">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={submitting}
            >
              {submitting ? "Uploading…" : "Upload & Start Tagging"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
