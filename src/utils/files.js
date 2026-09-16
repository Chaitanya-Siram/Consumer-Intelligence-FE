// Helpers to turn a session's S3 `source_file` key into display values.
// Keys look like: session_files/session_<id>/<YYYY-MM-DD>/raw_<name>_<ts><ext>

export function prettyFileName(sourceFile) {
  if (!sourceFile) return 'Untitled file'
  const base = sourceFile.split('/').pop() || sourceFile
  const dot = base.lastIndexOf('.')
  const ext = dot >= 0 ? base.slice(dot) : ''
  let stem = dot >= 0 ? base.slice(0, dot) : base
  if (stem.startsWith('raw_')) stem = stem.slice(4)
  stem = stem.replace(/_\d{6,}$/, '') // strip trailing _<unix-timestamp>
  return stem + ext
}

export function fileExt(sourceFile) {
  if (!sourceFile) return ''
  const dot = sourceFile.lastIndexOf('.')
  return dot >= 0 ? sourceFile.slice(dot + 1).toUpperCase() : ''
}

// Best-effort upload date: prefer created_at, else the date folder in the key.
export function uploadedDate(session) {
  if (session.created_at) {
    const d = new Date(session.created_at)
    if (!Number.isNaN(d.getTime())) return d
  }
  const m = (session.source_file || '').match(/\/(\d{4}-\d{2}-\d{2})\//)
  if (m) {
    const d = new Date(m[1])
    if (!Number.isNaN(d.getTime())) return d
  }
  return null
}

export function formatDate(date) {
  if (!date) return '—'
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
}
