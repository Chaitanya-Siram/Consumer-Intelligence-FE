// URL scheme + id-based data loading for the router.
//
// Navigation passes the full project/session/charts objects via react-router
// `state` (fast path, no refetch). On a cold deep-link / refresh that state is
// gone, so we fetch by the id in the URL — results are cached per id so tab
// switches and back/forward don't refetch.
import { useEffect, useState } from 'react'
import { getProject } from '../api/projects.js'
import { getSession } from '../api/sessions.js'
import { fetchAllCharts } from '../api/consumerIntelligence.js'
import { registerBrandLogos } from '../dashboards/storyboard/chartAxisIcons.js'

export const paths = {
  projects: () => '/',
  project: (pid) => `/${pid}/sessions`,
  workflow: (pid, sid) => `/${pid}/sessions/${sid}/workflow`,
  review: (pid, sid) => `/${pid}/sessions/${sid}/review`,
  dashboards: (pid, sid) => `/${pid}/sessions/${sid}/dashboards`,
  measurement: (pid, sid) => `/${pid}/sessions/${sid}/measurement`,
  monitoring: (pid, sid) => `/${pid}/sessions/${sid}/monitoring`,
  primpact: (pid, sid) => `/${pid}/sessions/${sid}/primpact`,
  narrative: (pid, sid) => `/${pid}/sessions/${sid}/narrative`,
  reputation: (pid, sid) => `/${pid}/sessions/${sid}/reputation`,
  // Consumer Intelligence dashboards
  trend: (pid, sid) => `/${pid}/sessions/${sid}/trend`,
  competitive: (pid, sid) => `/${pid}/sessions/${sid}/competitive`,
  network: (pid, sid) => `/${pid}/sessions/${sid}/network`,
  health: (pid, sid) => `/${pid}/sessions/${sid}/health`,
  brandintel: (pid, sid) => `/${pid}/sessions/${sid}/brand-intel`,
  // Issues Intelligence → Track Emerging Issues (Tier 2)
  issues: (pid, sid) => `/${pid}/sessions/${sid}/issues`,
  // Advanced Metrics → Shifting Audience Priorities (Tier 2)
  priorities: (pid, sid) => `/${pid}/sessions/${sid}/priorities`,
  // Landscape Analysis → Perception Analysis (Tier 2)
  perception: (pid, sid) => `/${pid}/sessions/${sid}/perception`,
  // Landscape Analysis → Dominant Narratives (Tier 2)
  narratives: (pid, sid) => `/${pid}/sessions/${sid}/narratives`,
  // Brand Intelligence → Brand Perception (Tier 2)
  brandperception: (pid, sid) => `/${pid}/sessions/${sid}/brand-perception`,
  marketintel: (pid, sid) => `/${pid}/sessions/${sid}/market-intelligence`,
  // Tier 2 gallery for a Tier 1 CI pillar (brand_intelligence, market_intelligence, ...)
  intel: (pid, sid, tier1Key) => `/${pid}/sessions/${sid}/intel/${tier1Key}`,
  workflowStudio: () => '/workflow-studio',
  // The saved studio workflow, so a reload or a second save reuses the session
  // instead of creating another one.
  workflowStudioSession: (pid, sid) => `/${pid}/sessions/${sid}/workflow-studio`,
}

const cache = { project: new Map(), session: new Map(), charts: new Map() }

export function seedCharts(sessionId, data) {
  if (sessionId != null && data) {
    cache.charts.set(String(sessionId), data)
    // Every charts payload passes through here (navigation seed, cache fill,
    // fresh build), so this is the one place brand logos reach the CI charts.
    try {
      registerBrandLogos(data)
    } catch { /* logo registration is best-effort */ }
  }
}

export function seedSession(sessionId, data) {
  if (sessionId != null && data) cache.session.set(String(sessionId), data)
}

export function invalidateSessionCache(sessionId) {
  if (sessionId != null) {
    const key = String(sessionId)
    cache.session.delete(key)
    cache.charts.delete(key)
  }
}

async function cached(map, id, fetchFn, forceRefresh = false) {
  const key = String(id)
  if (!forceRefresh && map.has(key)) return map.get(key)
  const value = await fetchFn(id)
  map.set(key, value)
  return value
}

export const loadProject = (id, force = false) => cached(cache.project, id, getProject, force)
export const loadSession = (id, force = false) => cached(cache.session, id, getSession, force)
// Pass the session so fetchAllCharts can skip the MI or CI call a session
// never configured (a CI-only session would otherwise wait on a slow MI build).
const fetchChartsForSession = async (id) => fetchAllCharts(id, await loadSession(id).catch(() => null))
export const loadCharts = (id, force = false) => cached(cache.charts, id, fetchChartsForSession, force)

// Resolve charts with explicit loading/error status so dashboards can show a
// spinner while the API is in flight (instead of a premature "no data" state).
export function useCharts(id, seed) {
  const [state, setState] = useState(() =>
    seed ? { data: seed, loading: false, error: '' } : { data: null, loading: id != null, error: '' },
  )
  useEffect(() => {
    if (id == null) {
      setState({ data: null, loading: false, error: '' })
      return undefined
    }
    // If a seed was provided (from navigation state), use it and also populate
    // the module-level cache so back/forward navigation stays fast.
    if (seed) {
      seedCharts(id, seed)
      setState({ data: seed, loading: false, error: '' })
      return undefined
    }
    // No seed — check the in-memory cache first, then fall back to the API.
    const cachedData = cache.charts.get(String(id))
    if (cachedData) {
      setState({ data: cachedData, loading: false, error: '' })
      return undefined
    }
    let cancelled = false
    setState({ data: null, loading: true, error: '' })
    fetchChartsForSession(id)
      .then((data) => {
        if (!cancelled) {
          // Populate the cache so sub-route navigations don't re-fetch.
          seedCharts(id, data)
          setState({ data, loading: false, error: '' })
        }
      })
      .catch((err) => {
        if (!cancelled) setState({ data: null, loading: false, error: err?.message || 'Failed to load dashboard data.' })
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, seed])
  return state
}

// Resolve an entity for a route: use the object passed via navigation `state`
// when present, otherwise fetch it by id (deep-link / refresh).
export function useResolved(loadFn, id, seed) {
  const [value, setValue] = useState(seed || null)
  useEffect(() => {
    if (id == null) {
      setValue(null)
      return undefined
    }
    if (seed) {
      setValue(seed)
      return undefined
    }
    let cancelled = false
    loadFn(id)
      .then((data) => {
        if (!cancelled) setValue(data)
      })
      .catch(() => {
        /* leave null; screens guard against missing data */
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, seed])
  return value
}
