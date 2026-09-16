import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Icon } from "../ui/icon"
import { cn } from "../../lib/utils"
import { SenseOrb } from "./sense-orb"
import { WIDGET_DND_TYPE } from "./dashboard-canvas"

export interface AttachedFile {
  name: string
  type: string
  content?: string
}

export interface ChatMessage {
  role: "user" | "assistant"
  text: string
  fileDownload?: { name: string; content: string; type: string }
  turnIndex?: number
  widgets?: any[]
  htmlCode?: string
  dashboardTitle?: string
  insightCard?: { text: string; imageUrl?: string | null }
}

const MODELS = ["Claude Opus 5", "Claude Sonnet 5", "Claude Haiku 4.5"] as const

export function ChatPanel({
  title = "Chat 01",
  messages,
  activeTurnIndex,
  onSelectTurn,
  onSend,
  attachment,
  onDropWidget,
  onClearAttachment,
}: {
  title?: string
  messages: ChatMessage[]
  activeTurnIndex?: number | null
  onSelectTurn?: (index: number) => void
  onSend: (text: string, files?: AttachedFile[]) => void
  attachment?: { label: string } | null
  onDropWidget?: (id: string) => void
  onClearAttachment?: () => void
}) {
  const [value, setValue] = useState("")
  const [dragOver, setDragOver] = useState(false)
  const [model, setModel] = useState<(typeof MODELS)[number]>("Claude Sonnet 5")
  const [modelOpen, setModelOpen] = useState(false)
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([])
  const [recording, setRecording] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const taRef = useRef<HTMLTextAreaElement>(null)

  const levelRef = useRef(0)
  const recognitionRef = useRef<any>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const rafRef = useRef(0)
  const recordingRef = useRef(false)
  const baseTextRef = useRef("")

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    })
  }, [messages])

  function stopVoice() {
    recordingRef.current = false
    try {
      recognitionRef.current?.stop()
    } catch {
      /* ignore */
    }
    recognitionRef.current = null
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    audioCtxRef.current?.close().catch(() => undefined)
    audioCtxRef.current = null
    levelRef.current = 0
  }

  async function startVoice() {
    recordingRef.current = true
    baseTextRef.current = value ? value + " " : ""

    const SR: any =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SR) {
      const rec = new SR()
      rec.continuous = true
      rec.interimResults = true
      rec.lang = "en-US"
      rec.maxAlternatives = 1
      rec.onresult = (e: any) => {
        let txt = ""
        for (let i = 0; i < e.results.length; i++) txt += e.results[i][0].transcript
        txt = txt.replace(/[^\x00-\x7F]/g, "")
        setValue(baseTextRef.current + txt)
      }
      rec.onerror = () => undefined
      recognitionRef.current = rec
      try {
        rec.start()
      } catch {
        /* ignore */
      }
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      if (!recordingRef.current) {
        stream.getTracks().forEach((t) => t.stop())
        return
      }
      streamRef.current = stream
      const Ctx =
        (window as any).AudioContext || (window as any).webkitAudioContext
      const ctx: AudioContext = new Ctx()
      audioCtxRef.current = ctx
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 512
      ctx.createMediaStreamSource(stream).connect(analyser)
      const data = new Uint8Array(analyser.frequencyBinCount)
      const loop = () => {
        analyser.getByteTimeDomainData(data)
        let sum = 0
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128
          sum += v * v
        }
        levelRef.current = Math.min(1, Math.sqrt(sum / data.length) * 3.5)
        rafRef.current = requestAnimationFrame(loop)
      }
      loop()
    } catch {
      /* ignore */
    }
  }

  function toggleVoice() {
    setRecording((r) => {
      const next = !r
      if (next) startVoice()
      else stopVoice()
      return next
    })
  }

  useEffect(() => () => stopVoice(), [])

  useEffect(() => {
    const el = taRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`
  }, [value])

  function send() {
    const text = value.trim()
    if (!text && attachedFiles.length === 0) return
    if (recordingRef.current) {
      stopVoice()
      setRecording(false)
    }
    onSend(text, attachedFiles)
    setValue("")
    setAttachedFiles([])
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const rawFiles = Array.from(e.target.files ?? [])
    rawFiles.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const content = event.target?.result as string
        setAttachedFiles((prev) => [
          ...prev,
          { name: file.name, type: file.type || "text/plain", content },
        ])
      }
      if (file.type.includes("json") || file.type.includes("text") || file.name.endsWith(".csv")) {
        reader.readAsText(file)
      } else {
        setAttachedFiles((prev) => [
          ...prev,
          { name: file.name, type: file.type || "application/octet-stream" },
        ])
      }
    })
    e.target.value = ""
  }

  function triggerDownload(file: { name: string; content: string; type: string }) {
    const blob = new Blob([file.content], { type: file.type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = file.name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const empty = messages.length === 0
  const showOrb = empty || recording

  return (
    <aside className="flex h-full w-full flex-col rounded-[var(--sense-radius)] bg-white p-[20px]">
      <p className="type-body font-semibold text-[#2e2e2e]">{title}</p>

      {showOrb ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <SenseOrb active={recording} getLevel={() => levelRef.current} />
          <p className="type-body max-w-[280px] text-center text-[#363535]">
            {recording
              ? "Listening… speak now"
              : "Build dashboards, charts and ask questions"}
          </p>
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="flex flex-1 flex-col gap-3 overflow-y-auto py-4"
        >
          {messages.map((m, i) => {
            const isUser = m.role === "user";
            const isActiveTurn = activeTurnIndex === i || (activeTurnIndex == null && i === messages.length - 1 && !isUser);
            const isSelectableAssistant = !isUser && (m.widgets || m.htmlCode || m.turnIndex != null);

            return (
              <div
                key={i}
                onClick={() => {
                  if (isSelectableAssistant && onSelectTurn) {
                    onSelectTurn(i);
                  }
                }}
                className={cn(
                  "type-caption flex flex-col gap-1.5 transition-all duration-200",
                  isUser
                    ? "max-w-[85%] self-end rounded-[12px] bg-[#f4f4f6] px-3.5 py-2.5 text-foreground"
                    : cn(
                        "w-[95%] self-start rounded-[12px] p-3 border text-[dimgray]",
                        isSelectableAssistant && "cursor-pointer hover:border-indigo-400 hover:shadow-xs",
                        isActiveTurn
                          ? "bg-indigo-50/60 border-indigo-500/80 text-slate-900 shadow-xs"
                          : "bg-white border-slate-200/80"
                      )
                )}
              >
                {!isUser && (
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="text-[11px] font-bold tracking-wide uppercase text-slate-400">
                      Response Turn #{m.turnIndex ?? (Math.floor(i / 2) + 1)}
                    </span>
                    {isActiveTurn && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-xs">
                        <Icon name="check" size={10} /> Active Response
                      </span>
                    )}
                  </div>
                )}

                <div>{m.text}</div>

                {/* Insight card — shown for Q&A / analytics answers */}
                {m.insightCard && (
                  <div className="mt-2 overflow-hidden rounded-xl border border-violet-100 bg-gradient-to-br from-violet-50 via-indigo-50 to-fuchsia-50">
                    {m.insightCard.imageUrl && (
                      <div className="h-28 overflow-hidden">
                        <img
                          src={m.insightCard.imageUrl}
                          alt="Insight visual"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-3">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Icon name="auto_awesome" size={13} className="text-violet-500" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-violet-600">
                          AI Insight
                        </span>
                      </div>
                      <p className="text-[12px] leading-relaxed text-slate-700 whitespace-pre-wrap">
                        {m.insightCard.text}
                      </p>
                    </div>
                  </div>
                )}

                {m.fileDownload && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerDownload(m.fileDownload!);
                    }}
                    title={m.fileDownload.name}
                    className="mt-1 flex max-w-full items-center gap-1.5 self-start rounded-[8px] border border-black/10 bg-black/5 px-2.5 py-1.5 text-[12px] font-medium text-black transition-colors hover:bg-black/10"
                  >
                    <Icon name="download" size={14} className="shrink-0" />
                    <span className="truncate">
                      Download&nbsp;
                      <span className="opacity-70">
                        {m.fileDownload.name.replace(/\.[^.]+$/, "").replace(/_/g, " ").slice(0, 40)}
                        {m.fileDownload.name.replace(/\.[^.]+$/, "").length > 40 ? "…" : ""}
                      </span>
                    </span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* composer */}
      <div
        onDragOver={(e) => {
          if (Array.from(e.dataTransfer.types).includes(WIDGET_DND_TYPE)) {
            e.preventDefault()
            setDragOver(true)
          }
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          const id = e.dataTransfer.getData(WIDGET_DND_TYPE)
          setDragOver(false)
          if (id && onDropWidget) onDropWidget(id)
        }}
        className={cn(
          "mt-3 flex flex-col gap-3 rounded-[16px] border bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.12)] transition-colors",
          dragOver && "bg-[#faf9ff]"
        )}
        style={{
          borderColor: dragOver
            ? "var(--sense-violet, #6952c1)"
            : "var(--sense-hairline)",
        }}
      >
        {attachment && (
          <div className="flex items-center gap-1.5 self-start rounded-[8px] bg-[#f0edff] py-1 pl-2 pr-1 type-caption text-foreground">
            <Icon name="insert_chart" size={14} />
            <span className="max-w-[180px] truncate">
              Editing: {attachment.label}
            </span>
            <button
              type="button"
              aria-label="Detach chart"
              onClick={onClearAttachment}
              className="flex size-4 items-center justify-center rounded text-muted-foreground hover:text-foreground"
            >
              <Icon name="close" size={12} />
            </button>
          </div>
        )}

        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {attachedFiles.map((file, i) => (
              <span
                key={`${file.name}-${i}`}
                className="flex items-center gap-1 rounded-[8px] bg-[#f4f4f6] py-1 pl-2 pr-1 type-caption text-foreground"
              >
                <Icon name="description" size={14} />
                <span className="max-w-[140px] truncate">{file.name}</span>
                <button
                  type="button"
                  aria-label={`Remove ${file.name}`}
                  onClick={() =>
                    setAttachedFiles((a) => a.filter((_, j) => j !== i))
                  }
                  className="flex size-4 items-center justify-center rounded text-muted-foreground hover:text-foreground"
                >
                  <Icon name="close" size={12} />
                </button>
              </span>
            ))}
          </div>
        )}

        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder={
            attachment
              ? "Make it a pie, or add insights…"
              : "Ask to build a chart or section, or upload data…"
          }
          className="type-body max-h-[180px] min-h-[24px] w-full resize-none overflow-y-auto bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
        />

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Add attachment"
              onClick={() => fileInput.current?.click()}
              className="flex size-9 items-center justify-center rounded-full border text-foreground transition-colors hover:bg-muted"
              style={{ borderColor: "var(--sense-hairline)" }}
            >
              <Icon name="add" size={20} />
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setModelOpen((o) => !o)}
                aria-haspopup="listbox"
                aria-expanded={modelOpen}
                className="flex h-9 items-center gap-1.5 rounded-full border px-3 type-caption font-medium text-foreground transition-colors hover:bg-muted"
                style={{ borderColor: "var(--sense-hairline)" }}
              >
                <span className="whitespace-nowrap">
                  {model.replace("Claude ", "")}
                </span>
                <Icon name="expand_more" size={16} />
              </button>

              <AnimatePresence>
                {modelOpen && (
                  <>
                    <button
                      aria-label="Close model menu"
                      className="fixed inset-0 z-10 cursor-default"
                      onClick={() => setModelOpen(false)}
                    />
                    <motion.ul
                      role="listbox"
                      initial={{ opacity: 0, y: 6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.98 }}
                      transition={{ duration: 0.14 }}
                      className="absolute bottom-full left-0 z-20 mb-2 w-[200px] overflow-hidden rounded-[12px] border bg-[#fff] p-1 shadow-lg"
                      style={{ borderColor: "var(--sense-hairline)" }}
                    >
                      {MODELS.map((m) => (
                        <li key={m}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={m === model}
                            onClick={() => {
                              setModel(m)
                              setModelOpen(false)
                            }}
                            className={cn(
                              "flex w-full items-center justify-between rounded-[8px] px-2.5 py-2 type-caption text-foreground transition-colors hover:bg-muted",
                              m === model && "bg-muted"
                            )}
                          >
                            {m}
                            {m === model && <Icon name="check" size={16} />}
                          </button>
                        </li>
                      ))}
                    </motion.ul>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleVoice}
              aria-label={recording ? "Stop recording" : "Voice input"}
              aria-pressed={recording}
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-full border transition-colors",
                recording
                  ? "border-transparent bg-[var(--sense-red)] text-white"
                  : "text-foreground hover:bg-muted"
              )}
              style={
                recording ? undefined : { borderColor: "var(--sense-hairline)" }
              }
            >
              <Icon name={recording ? "stop" : "mic"} size={20} />
            </button>

            <button
              type="button"
              onClick={send}
              aria-label="Send"
              disabled={!value.trim() && attachedFiles.length === 0}
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#2e2e2e] text-white transition-[transform,opacity] hover:scale-105 disabled:opacity-30 disabled:hover:scale-100"
            >
              <Icon name="arrow_upward" size={20} />
            </button>
          </div>
        </div>

        <input
          ref={fileInput}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>
    </aside>
  )
}
