import { useEffect, useState } from "react"

export interface AsyncState<T> {
  loading: boolean
  data: T | null
  error: Error | null
}

/**
 * Minimal data-fetching hook. Today it wraps the mock loaders; at handover
 * the loader passed in simply becomes a real `fetch`, no component changes.
 */
export function useAsync<T>(
  loader: () => Promise<T>,
  deps: React.DependencyList
): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({
    loading: true,
    data: null,
    error: null,
  })

  useEffect(() => {
    let active = true
    setState((s) => ({ ...s, loading: true }))
    loader()
      .then((data) => active && setState({ loading: false, data, error: null }))
      .catch(
        (error: Error) =>
          active && setState({ loading: false, data: null, error })
      )
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return state
}
