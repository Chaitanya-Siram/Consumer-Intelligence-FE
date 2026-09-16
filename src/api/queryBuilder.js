// Query-builder intake agent: the streaming WebSocket URL.
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// http(s)://host  ->  ws(s)://host/ws/query-builder?project_id=<id>
export function queryBuilderWsUrl(projectId) {
  const base = `${BASE_URL.replace(/^http/, 'ws')}/ws/query-builder`
  return projectId != null ? `${base}?project_id=${encodeURIComponent(projectId)}` : base
}
