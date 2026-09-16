import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { SettingsDialog } from "./settings-dialog"

export type CoverKind = "default" | "image" | "video"

export interface CoverState {
  kind: CoverKind
  /** data URL (image) or object URL (video); null for default gradient. */
  src: string | null
}

interface CoverContextValue {
  /** Manual cover override for the active dashboard scope (default = none). */
  cover: CoverState
  setImage: (file: File) => void
  setVideo: (file: File) => void
  reset: () => void
  /** Point the cover controls at a specific dashboard (per-dashboard covers). */
  setScope: (scope: string) => void
  settingsOpen: boolean
  openSettings: () => void
  closeSettings: () => void
}

const STORAGE_PREFIX = "iv:cover:"
const DEFAULT_COVER: CoverState = { kind: "default", src: null }
const keyFor = (scope: string) => STORAGE_PREFIX + scope

const CoverContext = createContext<CoverContextValue | null>(null)

function loadScope(scope: string): CoverState {
  try {
    const raw = localStorage.getItem(keyFor(scope))
    if (raw) {
      const parsed = JSON.parse(raw) as CoverState
      // Only images are persisted (as data URLs). Video object URLs die on reload.
      if (parsed.kind === "image" && parsed.src) return parsed
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_COVER
}

/**
 * Provides per-dashboard cover media + a global Shift+Cmd+X (Ctrl+Shift+X)
 * settings panel. Each dashboard has its own manual override slot, keyed by the
 * active scope; unset dashboards fall back to their data cover / gradient.
 */
export function CoverProvider({ children }: { children: ReactNode }) {
  const [scope, setScopeState] = useState("global")
  const [overrides, setOverrides] = useState<Record<string, CoverState>>({})
  const [settingsOpen, setSettingsOpen] = useState(false)
  // Live video object URLs, per scope, for revocation.
  const objectUrls = useRef<Record<string, string>>({})

  const cover = overrides[scope] ?? DEFAULT_COVER

  const setScope = useCallback((next: string) => {
    setScopeState(next)
    setOverrides((prev) =>
      next in prev ? prev : { ...prev, [next]: loadScope(next) }
    )
  }, [])

  const revokeScopeUrl = useCallback((s: string) => {
    const url = objectUrls.current[s]
    if (url) {
      URL.revokeObjectURL(url)
      delete objectUrls.current[s]
    }
  }, [])

  const setImage = useCallback(
    (file: File) => {
      const s = scope
      revokeScopeUrl(s)
      const reader = new FileReader()
      reader.onload = () => {
        const next: CoverState = { kind: "image", src: String(reader.result) }
        setOverrides((prev) => ({ ...prev, [s]: next }))
        try {
          localStorage.setItem(keyFor(s), JSON.stringify(next))
        } catch {
          /* quota — keep in memory only */
        }
      }
      reader.readAsDataURL(file)
    },
    [scope, revokeScopeUrl]
  )

  const setVideo = useCallback(
    (file: File) => {
      const s = scope
      revokeScopeUrl(s)
      const url = URL.createObjectURL(file)
      objectUrls.current[s] = url
      setOverrides((prev) => ({ ...prev, [s]: { kind: "video", src: url } }))
      // Video isn't persisted (object URLs expire); clear any stored image.
      try {
        localStorage.removeItem(keyFor(s))
      } catch {
        /* ignore */
      }
    },
    [scope, revokeScopeUrl]
  )

  const reset = useCallback(() => {
    const s = scope
    revokeScopeUrl(s)
    setOverrides((prev) => ({ ...prev, [s]: DEFAULT_COVER }))
    try {
      localStorage.removeItem(keyFor(s))
    } catch {
      /* ignore */
    }
  }, [scope, revokeScopeUrl])

  // Global shortcut: Shift+Cmd+X (mac) / Shift+Ctrl+X (win/linux).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.code === "KeyX") {
        e.preventDefault()
        setSettingsOpen((o) => !o)
      }
      if (e.key === "Escape") setSettingsOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // Revoke all live object URLs on unmount.
  useEffect(() => {
    const urls = objectUrls.current
    return () => {
      Object.values(urls).forEach((u) => URL.revokeObjectURL(u))
    }
  }, [])

  const value = useMemo<CoverContextValue>(
    () => ({
      cover,
      setImage,
      setVideo,
      reset,
      setScope,
      settingsOpen,
      openSettings: () => setSettingsOpen(true),
      closeSettings: () => setSettingsOpen(false),
    }),
    [cover, setImage, setVideo, reset, setScope, settingsOpen]
  )

  return (
    <CoverContext.Provider value={value}>
      {children}
      <SettingsDialog />
    </CoverContext.Provider>
  )
}

export function useCover(): CoverContextValue {
  const ctx = useContext(CoverContext)
  if (!ctx) throw new Error("useCover must be used within <CoverProvider>")
  return ctx
}
