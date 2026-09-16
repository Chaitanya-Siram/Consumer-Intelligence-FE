// Client for session listing/deletion and file upload.
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// Bearer token for the endpoints that resolve the caller's organization.
function getAuthHeaders(extraHeaders = {}) {
  const token = localStorage.getItem('auth_token')
  const headers = { ...extraHeaders }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

async function handle(res) {
  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`
    try {
      const data = await res.json()
      if (data && data.detail) detail = data.detail
    } catch {
      /* non-JSON error body */
    }
    throw new Error(detail)
  }
  if (res.status === 204) return null
  return res.json()
}

export function listSessions(projectId) {
  return fetch(`${BASE_URL}/projects/${projectId}/sessions`).then(handle)
}

export function listGeneratedQueries(projectId) {
  return fetch(`${BASE_URL}/projects/${projectId}/generated-queries`).then(handle)
}

export function deleteSession(sessionId) {
  return fetch(`${BASE_URL}/sessions/${sessionId}`, { method: 'DELETE' }).then(handle)
}

// Fetch a single session (including its saved workflow graph).
export function getSession(sessionId) {
  return fetch(`${BASE_URL}/sessions/${sessionId}`).then(handle)
}

// Persist the workflow designer graph (nodes + edges) on a session.
export function saveWorkflow(sessionId, workflow) {
  return fetch(`${BASE_URL}/sessions/${sessionId}/workflow`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workflow }),
  }).then(handle)
}

// Uploads a file → backend stores the parsed articles and returns
// { file_upload_id, record_count }. No session is created; put the
// file_upload_id on the workflow's data node and call createSession.
export function uploadFile({
  projectId,
  file,
  brandKeywords = [],
  competitorKeywords = [],
  messageKeywords = [],
}) {
  const form = new FormData()
  // The project may not exist yet (the AI chat uploads before saving); the rows
  // are claimed when the session is created.
  if (projectId != null && projectId !== '') {
    form.append('project_id', String(projectId))
  }
  if (file) form.append('file', file)
  if (brandKeywords.length)     form.append('brand_keywords',      JSON.stringify(brandKeywords))
  if (competitorKeywords.length) form.append('competitor_keywords', JSON.stringify(competitorKeywords))
  if (messageKeywords.length)   form.append('message_keywords',    JSON.stringify(messageKeywords))
  return fetch(`${BASE_URL}/upload`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: form,
  }).then(handle)
}

// Creates a session from the workflow graph. Keywords are read off the graph's
// data nodes, so only the project id and the workflow are sent.
export function createSession({ projectId, workflow }) {
  return fetch(`${BASE_URL}/session`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      project_id: Number(projectId),
      workflow,
    }),
  }).then(handle)
}

export const createSessionNoFile = createSession

