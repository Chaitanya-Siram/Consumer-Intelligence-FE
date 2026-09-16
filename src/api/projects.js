// Thin client for the FastAPI project CRUD endpoints.
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

function getAuthHeaders(extraHeaders = {}) {
  const token = localStorage.getItem('auth_token')
  const headers = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
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

export function listProjects({ includeInactive = true } = {}) {
  const params = new URLSearchParams({ include_inactive: String(includeInactive) })
  return fetch(`${BASE_URL}/projects?${params}`, {
    headers: getAuthHeaders(),
  }).then(handle)
}

export function getProject(id) {
  return fetch(`${BASE_URL}/projects/${id}`, {
    headers: getAuthHeaders(),
  }).then(handle)
}

export function createProject({ name, description }) {
  return fetch(`${BASE_URL}/projects`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ name, description: description || null }),
  }).then(handle)
}

export function updateProject(id, { name, description }) {
  return fetch(`${BASE_URL}/projects/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ name, description: description || null }),
  }).then(handle)
}

export function deleteProject(id) {
  return fetch(`${BASE_URL}/projects/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  }).then(handle)
}

// Set (or clear) the Media Monitoring section prompt used during tagging.
// Pass an empty string / null to clear it.
export function addSectionsPrompt(id, sectionsPrompt) {
  return fetch(`${BASE_URL}/projects/${id}/add_sections_prompt`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ sections_prompt: sectionsPrompt || null }),
  }).then(handle)
}

// Set (or clear) a recurring daily schedule on a generated query. Pass a null
// time to unschedule. `time` is "HH:MM" local; `timezone` is an IANA name.
export function scheduleGeneratedQuery(projectId, queryId, time, timezone) {
  return fetch(`${BASE_URL}/projects/${projectId}/generated-queries/${queryId}/schedule`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ schedule_time: time || null, schedule_timezone: timezone || null }),
  }).then(handle)
}

// Persist the Media Monitoring section display order (after drag-reorder).
// Pass sessionId to also reorder that session's cached charts file.
export function updateSectionsOrders(id, sectionsOrders, sessionId = null) {
  return fetch(`${BASE_URL}/projects/${id}/sections_orders`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ sections_orders: sectionsOrders, session_id: sessionId }),
  }).then(handle)
}
