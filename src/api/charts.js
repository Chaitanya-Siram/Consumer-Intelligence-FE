// Charts: the streaming WebSocket URL for dashboard generation.
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// http(s)://host  ->  ws(s)://host/ws/charts
export function chartsWsUrl() {
  return `${BASE_URL.replace(/^http/, 'ws')}/ws/charts`
}

// Fetch the (cached) charts payload for a session — used to restore dashboards
// after a page refresh without re-running generation.
export async function fetchCharts(sessionId) {
  const res = await fetch(`${BASE_URL}/charts?session_id=${sessionId}`)
  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`
    try {
      const body = await res.json()
      if (body?.detail) detail = body.detail
    } catch { /* non-JSON error body */ }
    throw new Error(detail)
  }
  return res.json()
}

// Download the media-monitoring articles as a BeOne-style .docx report and save
// it via the browser. `days` is an optional array of YYYY-MM-DD strings to limit
// the report to specific dates (empty = all dates).
export async function downloadMediaMonitoringReport(sessionId, days = []) {
  const params = new URLSearchParams()
  params.set('session_id', sessionId)
  days.forEach((d) => params.append('days', d))

  const res = await fetch(`${BASE_URL}/media-monitoring/report?${params.toString()}`)
  if (!res.ok) {
    let detail = `Report download failed (${res.status})`
    try {
      const body = await res.json()
      if (body?.detail) detail = body.detail
    } catch { /* non-JSON error body */ }
    throw new Error(detail)
  }

  const blob = await res.blob()
  const disposition = res.headers.get('Content-Disposition') || ''
  const match = disposition.match(/filename="?([^";]+)"?/)
  const filename = match ? match[1] : 'media_monitoring_report.docx'

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
