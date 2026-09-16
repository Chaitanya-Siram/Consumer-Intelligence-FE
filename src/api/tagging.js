// Tagging: the streaming WebSocket URL + fetching the tagged articles.
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

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

// http(s)://host  ->  ws(s)://host/ws/tagging?token=<jwt>
// The token goes in the query string because browsers can't set an
// Authorization header on a WebSocket handshake.
export function taggingWsUrl() {
  const base = `${BASE_URL.replace(/^http/, 'ws')}/ws/tagging`
  const token = localStorage.getItem('auth_token')
  return token ? `${base}?token=${encodeURIComponent(token)}` : base
}

export async function getTaggedArticles(sessionId) {
  const res = await fetch(`${BASE_URL}/tagging/${sessionId}`)
  return handle(res)
}

// Patch tagged fields on one or more articles. `updates` is an array of
// { id, <changed tagged fields> }. Returns { updated_count, updated_ids, ... }.
export async function updateTaggedArticles(sessionId, updates) {
  const res = await fetch(`${BASE_URL}/tagging/${sessionId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })
  return handle(res)
}

// Append one or more new articles (body + tags) to the session. `articles` is an
// array of article objects. Returns the created articles with server-assigned ids.
export async function addTaggedArticles(sessionId, articles) {
  const res = await fetch(`${BASE_URL}/tagging/${sessionId}/articles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(articles),
  })
  return handle(res)
}

// Fetch a single article by URL and AI-tag it (preview only — not saved).
// Returns the tagged article object (confidences as 0–100 percents). Throws with
// a "Subscription required…" message when the article body can't be fetched.
export async function fetchArticleByUrl(sessionId, url) {
  const res = await fetch(`${BASE_URL}/tagging/${sessionId}/fetch-article`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })
  return handle(res)
}

// Delete a manually-added article (added_type === 'Manual') by id.
export async function deleteTaggedArticle(sessionId, articleId) {
  const res = await fetch(`${BASE_URL}/tagging/${sessionId}/articles/${encodeURIComponent(articleId)}`, {
    method: 'DELETE',
  })
  return handle(res)
}

// Promote irrelevant articles to relevant. The backend AI-tags them in place and
// returns the updated (now fully-tagged) articles.
export async function markArticlesRelevant(sessionId, ids) {
  const res = await fetch(`${BASE_URL}/tagging/${sessionId}/articles/mark-relevant`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  })
  return handle(res)
}

// Demote relevant articles to irrelevant, keeping their tags. `reason` is required.
export async function markArticlesIrrelevant(sessionId, ids, reason) {
  const res = await fetch(`${BASE_URL}/tagging/${sessionId}/articles/mark-irrelevant`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids, reason }),
  })
  return handle(res)
}

// Set an approval flag on a set of articles. `ids` is an array of article ids.
// `forMonitoring` targets the separate is_approved_for_monitoring flag used by
// the Media Monitoring review popup (default targets is_approved_for_dashboards).
export async function approveTaggedArticles(sessionId, ids, isApproved = true, forMonitoring = false) {
  const res = await fetch(`${BASE_URL}/tagging/${sessionId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids, is_approved: isApproved, for_monitoring: forMonitoring }),
  })
  return handle(res)
}
