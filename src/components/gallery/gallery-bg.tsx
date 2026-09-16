import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Icon } from "@/components/ui/icon"
import { cn } from "@/lib/utils"
import { easeOut } from "@/components/motion/motion-primitives"

type Bg = { kind: "default" | "image" | "video"; src: string | null }
type Overlay = { color: string; opacity: number }

const BG_KEY = "iv:gallery-bg"
const OV_KEY = "iv:gallery-overlay"
const DEFAULT_BG: Bg = { kind: "default", src: null }
const DEFAULT_OVERLAY: Overlay = { color: "#000000", opacity: 0 }

function loadBg(): Bg {
  try {
    const raw = localStorage.getItem(BG_KEY)
    if (raw) {
      const p = JSON.parse(raw) as Bg
      if (p.kind === "image" && p.src) return p // only images persist
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_BG
}
function loadOverlay(): Overlay {
  try {
    const raw = localStorage.getItem(OV_KEY)
    if (raw) return { ...DEFAULT_OVERLAY, ...JSON.parse(raw) }
  } catch {
    /* ignore */
  }
  return DEFAULT_OVERLAY
}

/**
 * Fixed gallery background layers (image/video + gradient wash + a configurable
 * colour overlay) plus a Shift+Cmd+X settings panel to swap the media and tune
 * the overlay. Renders as absolute layers inside the frame; the dialog is fixed.
 */
export function GalleryBackground({
  textLight = false,
  onTextLightChange,
}: {
  textLight?: boolean
  onTextLightChange?: (v: boolean) => void
}) {
  const [bg, setBg] = useState<Bg>(() =>
    typeof window === "undefined" ? DEFAULT_BG : loadBg()
  )
  const [overlay, setOverlay] = useState<Overlay>(() =>
    typeof window === "undefined" ? DEFAULT_OVERLAY : loadOverlay()
  )
  const [open, setOpen] = useState(false)
  const imgInput = useRef<HTMLInputElement>(null)
  const vidInput = useRef<HTMLInputElement>(null)
  const objUrl = useRef<string | null>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.code === "KeyX") {
        e.preventDefault()
        setOpen((o) => !o)
      }
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  useEffect(
    () => () => {
      if (objUrl.current) URL.revokeObjectURL(objUrl.current)
    },
    []
  )

  const setImage = (f: File) => {
    if (objUrl.current) {
      URL.revokeObjectURL(objUrl.current)
      objUrl.current = null
    }
    const r = new FileReader()
    r.onload = () => {
      const next: Bg = { kind: "image", src: String(r.result) }
      setBg(next)
      try {
        localStorage.setItem(BG_KEY, JSON.stringify(next))
      } catch {
        /* quota */
      }
    }
    r.readAsDataURL(f)
  }
  const setVideo = (f: File) => {
    if (objUrl.current) URL.revokeObjectURL(objUrl.current)
    const u = URL.createObjectURL(f)
    objUrl.current = u
    setBg({ kind: "video", src: u })
    try {
      localStorage.removeItem(BG_KEY)
    } catch {
      /* ignore */
    }
  }
  const resetBg = () => {
    if (objUrl.current) {
      URL.revokeObjectURL(objUrl.current)
      objUrl.current = null
    }
    setBg(DEFAULT_BG)
    try {
      localStorage.removeItem(BG_KEY)
    } catch {
      /* ignore */
    }
  }
  const patchOverlay = (patch: Partial<Overlay>) =>
    setOverlay((o) => {
      const n = { ...o, ...patch }
      try {
        localStorage.setItem(OV_KEY, JSON.stringify(n))
      } catch {
        /* ignore */
      }
      return n
    })

  return (
    <>
      {/* base media */}
      {bg.kind === "video" && bg.src ? (
        <video
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          src={bg.src}
          autoPlay
          loop
          muted
          playsInline
        />
      ) : (
        <img
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          src={bg.kind === "image" && bg.src ? bg.src : "/gallery-bg.jpg"}
          alt=""
        />
      )}

      {/* bottom gradient wash */}
      <img
        src="/gradient-bar.png"
        alt=""
        className="pointer-events-none absolute bottom-0 left-0 z-[1] w-full"
      />

      {/* configurable colour overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-[2]"
        style={{ backgroundColor: overlay.color, opacity: overlay.opacity }}
      />

      {/* settings dialog */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed right-4 top-4 z-50 w-[300px]"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.18, ease: easeOut }}
          >
            <div className="rounded-2xl border bg-card p-5 shadow-xl">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h2 className="type-title text-foreground">Background</h2>
                  <p className="type-caption mt-1 text-muted-foreground">
                    ⇧⌘X to toggle
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

              <div className="grid grid-cols-2 gap-2">
                <UploadTile
                  icon="image"
                  label="Image"
                  active={bg.kind === "image"}
                  onClick={() => imgInput.current?.click()}
                />
                <UploadTile
                  icon="videocam"
                  label="Video"
                  active={bg.kind === "video"}
                  onClick={() => vidInput.current?.click()}
                />
              </div>

              <button
                onClick={resetBg}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 type-caption text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Icon name="restart_alt" size={16} />
                Reset background
              </button>

              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="type-caption font-medium text-foreground">
                    Overlay
                  </span>
                  <label className="flex items-center gap-2">
                    <span className="type-caption text-muted-foreground">
                      Colour
                    </span>
                    <input
                      type="color"
                      value={overlay.color}
                      onChange={(e) => patchOverlay({ color: e.target.value })}
                      className="size-6 cursor-pointer rounded border-0 bg-transparent p-0"
                      aria-label="Overlay colour"
                    />
                  </label>
                </div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="type-caption text-muted-foreground">
                    Opacity
                  </span>
                  <span className="type-caption tabular-nums text-muted-foreground">
                    {Math.round(overlay.opacity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.02}
                  value={overlay.opacity}
                  onChange={(e) =>
                    patchOverlay({ opacity: parseFloat(e.target.value) })
                  }
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted accent-[var(--sense-violet,#6952c1)]"
                />
              </div>

              {/* light text toggle (for dark backgrounds) */}
              <button
                type="button"
                onClick={() => onTextLightChange?.(!textLight)}
                className="mt-4 flex w-full items-center justify-between rounded-lg border px-3 py-2 type-caption text-foreground transition-colors hover:bg-muted"
              >
                <span className="flex items-center gap-2">
                  <Icon name="format_color_text" size={16} />
                  Light text
                </span>
                <span
                  className={cn(
                    "flex h-5 w-9 items-center rounded-full px-0.5 transition-colors",
                    textLight
                      ? "justify-end bg-[var(--sense-violet,#6952c1)]"
                      : "justify-start bg-muted-foreground/30"
                  )}
                >
                  <span className="size-4 rounded-full bg-white shadow-sm" />
                </span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <input
        ref={imgInput}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) setImage(f)
          e.target.value = ""
        }}
      />
      <input
        ref={vidInput}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) setVideo(f)
          e.target.value = ""
        }}
      />
    </>
  )
}

function UploadTile({
  icon,
  label,
  active,
  onClick,
}: {
  icon: string
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition-colors",
        active
          ? "border-primary/40 bg-primary/5"
          : "hover:border-foreground/20 hover:bg-muted/60"
      )}
    >
      <span
        className={cn(
          "flex size-8 items-center justify-center rounded-lg",
          active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
        )}
      >
        <Icon name={icon} size={18} />
      </span>
      <span className="type-caption font-medium text-foreground">{label}</span>
    </button>
  )
}
