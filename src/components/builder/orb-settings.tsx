import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { AnimatePresence, motion } from "motion/react"
import { Icon } from "@/components/ui/icon"
import { easeOut } from "@/components/motion/motion-primitives"

/** All tunable parameters for the WebGL orb. */
export interface OrbConfig {
  colors: [string, string, string, string] // 4-stop palette (hex)
  speed: number // motion multiplier
  warp: number // domain-warp amount
  band: number // ribbon thickness
  waveAmp: number // ribbon curvature amplitude
  waveFreq: number // ribbon curvature frequency
  angle: number // ribbon angle offset (degrees)
  spin: number // continuous 360° rotation rate
  gap: number // fluid spread (inner fade radius; lower = spreads more)
  shell: number // glass brightness
  gloss: number // specular / highlight strength
  rim: number // fresnel rim strength
}

export const DEFAULT_ORB_CONFIG: OrbConfig = {
  colors: ["#B301FF", "#D500E1", "#E45A28", "#F5882E"],
  speed: 1.8,
  warp: 0.08,
  band: 0.33,
  waveAmp: 0.12,
  waveFreq: 1.0,
  angle: 13,
  spin: 0.6,
  gap: 0.9,
  shell: 1.05,
  gloss: 0.26,
  rim: 0.2,
}

const STORAGE_KEY = "iv:orb"        // live config
const DEFAULT_KEY = "iv:orb:default" // user-saved default baseline

export function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return [1, 1, 1]
  const n = parseInt(m[1], 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

interface OrbSettingsValue {
  config: OrbConfig
  setConfig: (patch: Partial<OrbConfig>) => void
  reset: () => void
  saveAsDefault: () => void
  savedAt: number
  open: boolean
  setOpen: (o: boolean) => void
}

const Ctx = createContext<OrbSettingsValue | null>(null)

/** The baseline defaults — a user-saved default if present, else built-in. */
function loadDefault(): OrbConfig {
  try {
    const raw = localStorage.getItem(DEFAULT_KEY)
    if (raw) return { ...DEFAULT_ORB_CONFIG, ...JSON.parse(raw) }
  } catch {
    /* ignore */
  }
  return DEFAULT_ORB_CONFIG
}

function load(): OrbConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...DEFAULT_ORB_CONFIG, ...JSON.parse(raw) }
  } catch {
    /* ignore */
  }
  return loadDefault()
}

export function OrbSettingsProvider({ children }: { children: ReactNode }) {
  const [config, setConfigState] = useState<OrbConfig>(() =>
    typeof window === "undefined" ? DEFAULT_ORB_CONFIG : load()
  )
  const [open, setOpen] = useState(false)
  const [savedAt, setSavedAt] = useState(0) // bump to flash "Saved"

  const setConfig = (patch: Partial<OrbConfig>) =>
    setConfigState((c) => {
      const next = { ...c, ...patch }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        /* ignore */
      }
      return next
    })

  // Restore to the saved default baseline (or built-in if none saved).
  const reset = () => {
    const base = loadDefault()
    setConfigState(base)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(base))
    } catch {
      /* ignore */
    }
  }

  // Persist the current config as the default baseline.
  const saveAsDefault = () => {
    try {
      localStorage.setItem(DEFAULT_KEY, JSON.stringify(config))
    } catch {
      /* ignore */
    }
    setSavedAt(Date.now())
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.code === "KeyS") {
        e.preventDefault()
        setOpen((o) => !o)
      }
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const value = useMemo<OrbSettingsValue>(
    () => ({ config, setConfig, reset, saveAsDefault, savedAt, open, setOpen }),
    [config, open, savedAt]
  )

  return (
    <Ctx.Provider value={value}>
      {children}
      <OrbSettingsDialog />
    </Ctx.Provider>
  )
}

const NOOP_ORB_SETTINGS: OrbSettingsValue = {
  config: DEFAULT_ORB_CONFIG,
  setConfig: () => {},
  reset: () => {},
  saveAsDefault: () => {},
  savedAt: 0,
  open: false,
  setOpen: () => {},
}

export function useOrbSettings(): OrbSettingsValue {
  // Read-only fallback when used outside a provider (e.g. the nav-rail orb).
  return useContext(Ctx) ?? NOOP_ORB_SETTINGS
}

/* ------------------------------- dialog ------------------------------- */
function OrbSettingsDialog() {
  const { config, setConfig, reset, saveAsDefault, savedAt, open, setOpen } =
    useOrbSettings()
  const justSaved = Date.now() - savedAt < 1800

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed right-4 top-4 z-50 w-[300px]"
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 12 }}
          transition={{ duration: 0.18, ease: easeOut }}
        >
          <div className="max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl border bg-card p-5 shadow-xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="type-title text-foreground">Orb settings</h2>
                <p className="type-caption mt-1 text-muted-foreground">
                  ⇧⌘S to toggle
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            <p className="type-caption mb-2 font-medium text-foreground">
              Palette
            </p>
            <div className="mb-4 grid grid-cols-4 gap-2">
              {config.colors.map((hex, i) => (
                <ColorSwatch
                  key={i}
                  value={hex}
                  onChange={(v) => {
                    const next = [...config.colors] as OrbConfig["colors"]
                    next[i] = v
                    setConfig({ colors: next })
                  }}
                />
              ))}
            </div>

            <Slider label="Motion speed" value={config.speed} min={0} max={3} step={0.05} onChange={(v) => setConfig({ speed: v })} />
            <Slider label="Ribbon width" value={config.band} min={0.05} max={0.4} step={0.01} onChange={(v) => setConfig({ band: v })} />
            <Slider label="Curve amount" value={config.waveAmp} min={0} max={0.3} step={0.01} onChange={(v) => setConfig({ waveAmp: v })} />
            <Slider label="Curve frequency" value={config.waveFreq} min={1} max={6} step={0.1} onChange={(v) => setConfig({ waveFreq: v })} />
            <Slider label="Angle offset" value={config.angle} min={-90} max={90} step={1} onChange={(v) => setConfig({ angle: v })} />
            <Slider label="Rotation speed" value={config.spin} min={0} max={3} step={0.05} onChange={(v) => setConfig({ spin: v })} />
            <Slider label="Warp / turbulence" value={config.warp} min={0} max={0.5} step={0.01} onChange={(v) => setConfig({ warp: v })} />
            <Slider label="Fluid spread" value={config.gap} min={0.3} max={0.9} step={0.02} onChange={(v) => setConfig({ gap: v })} />
            <Slider label="Glass brightness" value={config.shell} min={0.7} max={1.1} step={0.01} onChange={(v) => setConfig({ shell: v })} />
            <Slider label="Gloss / specular" value={config.gloss} min={0} max={0.6} step={0.02} onChange={(v) => setConfig({ gloss: v })} />
            <Slider label="Rim / fresnel" value={config.rim} min={0} max={0.6} step={0.02} onChange={(v) => setConfig({ rim: v })} />

            <button
              onClick={saveAsDefault}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 type-caption font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Icon name={justSaved ? "check" : "bookmark"} size={16} />
              {justSaved ? "Saved as default" : "Set as default"}
            </button>
            <button
              onClick={reset}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 type-caption text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Icon name="restart_alt" size={16} />
              Reset to default
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function ColorSwatch({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <label
      className="relative block aspect-square cursor-pointer overflow-hidden rounded-lg border"
      style={{ backgroundColor: value, borderColor: "var(--sense-hairline)" }}
    >
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0"
        aria-label="Palette colour"
      />
    </label>
  )
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
}) {
  return (
    <div className="mb-3">
      <div className="mb-1 flex items-center justify-between">
        <span className="type-caption text-foreground">{label}</span>
        <span className="type-caption tabular-nums text-muted-foreground">
          {value.toFixed(2)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted accent-[var(--sense-violet,#6952c1)]"
      />
    </div>
  )
}
