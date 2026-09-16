// Consumer Intelligence (CI) charts API — separate from the Media Intelligence
// `/charts` + `/ws/charts` endpoints in ./charts.js. The two payloads are merged
// client-side by `fetchAllCharts` so every dashboard reads one `chartsData`.
import { fetchCharts } from './charts.js'
import { hasSavedGraph, restoreNodes } from '../workflow/workflowUtils.js'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// http(s)://host  ->  ws(s)://host/ws/consumer-intelligence/charts
export function ciWsUrl() {
  return `${BASE_URL.replace(/^http/, 'ws')}/ws/consumer-intelligence/charts`
}

// Fetch the (cached) CI charts payload for a session. Throws with the server's
// `detail` on a non-2xx response (400 = session has no CI lens, 404 = no tagged
// articles yet).
export async function fetchCICharts(sessionId) {
  const res = await fetch(`${BASE_URL}/consumer-intelligence/charts?session_id=${sessionId}`)
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

// Lens keys as they appear in the CI charts payload.
export const CI_LENS_KEYS = [
  'trend_intelligence',
  'brand_intelligence',
  'brand_health_storyboard',
  'brand_competitive_intel',
  'market_intelligence',
  'network_map',
]

// Media Intelligence lens keys (existing, untouched).
export const MI_LENS_KEYS = [
  'media_monitoring',
  'media_measurement',
  'narrative_intelligence',
  'pr_impact',
  'reputation_index',
]

// Tier 1 pillar key (workflow analysis node `data.lens` with
// `data.lensType === 'tier1'`) -> the CI payload keys it is backed by.
export const TIER1_TO_CI_KEYS = {
  brand_intelligence: ['brand_intelligence', 'brand_health_storyboard', 'brand_competitive_intel'],
  market_intelligence: ['market_intelligence'],
  network_map_analysis: ['network_map'],
}

// Tier 1 pillars that have no backend yet — the dashboards page shows a
// "Coming soon" card for them. (`reputation_index` is an MI lens, not listed.)
export const COMING_SOON_TIER1 = [
  'landscape_analysis',
  'advanced_metrics',
  'influencer_mapping',
  'whitespace_gap_analysis',
  'regional_intelligence',
  'issues_intelligence',
  'crisis_solutioning',
]

function analysisNodes(session) {
  const wf = session?.workflow
  if (!hasSavedGraph(wf)) return []
  const nodes = restoreNodes(wf)
  return (Array.isArray(nodes) ? nodes : []).filter((n) => n?.type === 'analysis' && n.data?.lens)
}

// Does this session's workflow contain a Consumer Intelligence analysis node?
export function sessionHasCI(session) {
  return analysisNodes(session).some(
    (n) => n.data?.lensType === 'tier1' || CI_LENS_KEYS.includes(n.data?.lens),
  )
}

// Does this session's workflow contain a Media Intelligence analysis node?
export function sessionHasMI(session) {
  return analysisNodes(session).some(
    (n) => n.data?.lensType !== 'tier1' && MI_LENS_KEYS.includes(n.data?.lens),
  )
}

// Fetch MI and CI charts together and merge them into one object. Either call
// may fail without killing the other (e.g. a CI-only session returns 400 from
// `/charts`). Only when BOTH fail is the first error rethrown. When `session`
// is provided, a call is skipped entirely if the workflow has no matching lens.
export async function fetchAllCharts(sessionId, session) {
  let wantMI = true
  let wantCI = true
  if (session) {
    const hasMI = sessionHasMI(session)
    const hasCI = sessionHasCI(session)
    if (hasMI || hasCI) {
      wantMI = hasMI
      wantCI = hasCI
    }
  }

  const skipped = Promise.resolve({ status: 'skipped' })
  const [mi, ci] = await Promise.allSettled([
    wantMI ? fetchCharts(sessionId) : skipped,
    wantCI ? fetchCICharts(sessionId) : skipped,
  ])

  const miOk = mi.status === 'fulfilled' && wantMI
  const ciOk = ci.status === 'fulfilled' && wantCI
  if (!miOk && !ciOk) {
    const firstErr = [mi, ci].find((r) => r.status === 'rejected')?.reason
    throw firstErr instanceof Error ? firstErr : new Error(String(firstErr || 'Failed to load charts.'))
  }

  return {
    ...(miOk ? mi.value : {}),
    ...(ciOk ? ci.value : {}),
  }
}
