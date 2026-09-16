import { useRef } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Icon } from "@/components/ui/icon"
import { useCover } from "./cover-provider"
import { easeOut } from "@/components/motion/motion-primitives"
import { cn } from "@/lib/utils"

export function SettingsDialog() {
  const { cover, setImage, setVideo, reset, settingsOpen, closeSettings } =
    useCover()
  const imageInput = useRef<HTMLInputElement>(null)
  const videoInput = useRef<HTMLInputElement>(null)

  return (
    <AnimatePresence>
      {settingsOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: easeOut }}
        >
          {/* backdrop */}
          <button
            aria-label="Close settings"
            className="absolute inset-0 bg-foreground/25 backdrop-blur-[2px]"
            onClick={closeSettings}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Dashboard settings"
            className="relative z-10 w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 6 }}
            transition={{ duration: 0.2, ease: easeOut }}
          >
            <div className="mb-1 flex items-start justify-between">
              <div>
                <h2 className="type-title text-foreground">Dashboard settings</h2>
                <p className="type-caption mt-1 text-muted-foreground">
                  Cover media for the hero panel
                </p>
              </div>
              <button
                onClick={closeSettings}
                className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Close"
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <UploadTile
                icon={<Icon name="image" size={20} />}
                label="Upload image"
                hint="PNG, JPG, WebP"
                active={cover.kind === "image"}
                onClick={() => imageInput.current?.click()}
              />
              <UploadTile
                icon={<Icon name="videocam" size={20} />}
                label="Background video"
                hint="MP4, WebM"
                active={cover.kind === "video"}
                onClick={() => videoInput.current?.click()}
              />
            </div>

            <button
              onClick={reset}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2.5 type-label text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Icon name="restart_alt" size={18} />
              Reset to default gradient
            </button>

            <p className="type-caption mt-4 text-muted-foreground/70">
              Tip: press{" "}
              <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                ⇧⌘X
              </kbd>{" "}
              anytime to open this panel.
            </p>

            <input
              ref={imageInput}
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
              ref={videoInput}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) setVideo(f)
                e.target.value = ""
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function UploadTile({
  icon,
  label,
  hint,
  active,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  hint: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-colors",
        active
          ? "border-primary/40 bg-primary/5"
          : "hover:border-foreground/20 hover:bg-muted/60"
      )}
    >
      <span
        className={cn(
          "flex size-9 items-center justify-center rounded-lg",
          active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
        )}
      >
        {icon}
      </span>
      <span className="type-label text-foreground">{label}</span>
      <span className="type-caption text-muted-foreground">{hint}</span>
    </button>
  )
}
