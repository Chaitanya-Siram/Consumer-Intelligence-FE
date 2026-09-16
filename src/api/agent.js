// Interactive data agent: the streaming WebSocket URL.
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// http(s)://host  ->  ws(s)://host/ws/agent
export function agentWsUrl() {
  return `${BASE_URL.replace(/^http/, 'ws')}/ws/agent`
}
