import { useEffect, useRef, useState } from 'react'

export default function EditProjectModal({ project, onClose, onEdit }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const nameRef = useRef(null)

  // Reset + focus whenever the modal opens.
  useEffect(() => {
    if (project) {
      setName(project.name || '')
      setDescription(project.description || '')
      setError('')
      setSubmitting(false)
      // focus after the element is painted
      setTimeout(() => nameRef.current?.focus(), 0)
    }
  }, [project])

  // Close on Escape.
  useEffect(() => {
    if (!project) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [project, onClose])

  if (!project) return null

  async function handleSubmit(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Project name is required.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await onEdit(project.id, { name: trimmed, description: description.trim() })
    } catch (err) {
      setError(err.message || 'Failed to update project.')
      setSubmitting(false)
    }
  }

  return (
    <div className="overlay" onMouseDown={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onMouseDown={(e) => e.stopPropagation()}>
        <button
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            background: "transparent",
            border: "none",
            fontSize: 24,
            lineHeight: 1,
            cursor: "pointer",
            color: "var(--text-1)"
          }}
          onClick={onClose}
          aria-label="Close modal"
        >
          ×
        </button>
        <h2 id="modal-title" className="modal__title">Edit project</h2>
        <p className="modal__sub">Update the name and description of this project.</p>

        <form onSubmit={handleSubmit} className="form">
          <label className="field">
            <span className="field__label">Name</span>
            <input
              ref={nameRef}
              className="field__input"
              type="text"
              value={name}
              maxLength={50}
              placeholder="e.g. Media Monitoring"
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <label className="field">
            <span className="field__label">Description <span className="field__opt">(optional)</span></span>
            <textarea
              className="field__input field__textarea"
              value={description}
              rows={3}
              placeholder="What is this project about?"
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>

          {error && <p className="form__error">{error}</p>}

          <div className="form__actions">
            <button type="button" className="btn btn--ghost" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" disabled={submitting}>
              {submitting ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
