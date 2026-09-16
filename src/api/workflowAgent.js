// Workflow-builder agent: the conversational WebSocket URL.
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// http(s)://host  ->  ws(s)://host/ws/workflow-agent?token=<jwt>
// The token goes in the query string because browsers can't set an
// Authorization header on a WebSocket handshake.
export function workflowAgentWsUrl() {
  const base = `${BASE_URL.replace(/^http/, 'ws')}/ws/workflow-agent`
  const token = localStorage.getItem('auth_token')
  return token ? `${base}?token=${encodeURIComponent(token)}` : base
}
