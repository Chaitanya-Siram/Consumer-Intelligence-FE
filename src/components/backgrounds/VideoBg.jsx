import { useEffect, useRef } from 'react'

export default function VideoBg({ src, dark, bgRefsRef }) {
  const vidARef = useRef(null)
  const vidBRef = useRef(null)
  const activeRef  = useRef('a')
  const prevSrcRef = useRef(src)
  const rafRef     = useRef(null)

  // Initial src on mount
  useEffect(() => {
    const va = vidARef.current
    const vb = vidBRef.current
    if (!va || !vb) return
    va.style.opacity = '1'
    vb.style.opacity = '0'
    va.src = src
    va.load()
    va.play().catch(() => {})
    // Expose both slots to Dashboard for banner canvas compositing
    if (bgRefsRef) { bgRefsRef.current.vidA = va; bgRefsRef.current.vidB = vb }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Handle src changes — preload behind current, then crossfade
  useEffect(() => {
    if (src === prevSrcRef.current) return
    prevSrcRef.current = src

    const va = vidARef.current
    const vb = vidBRef.current
    if (!va || !vb) return

    const incoming = activeRef.current === 'a' ? vb : va
    const outgoing  = activeRef.current === 'a' ? va : vb

    if (rafRef.current) cancelAnimationFrame(rafRef.current)

    // Load new video into inactive slot, keep invisible until ready
    incoming.style.opacity = '0'
    incoming.src = src
    incoming.load()

    const startFade = () => {
      incoming.play().catch(() => {})
      // Swap active slot now so any consumer sees the new video immediately
      activeRef.current = activeRef.current === 'a' ? 'b' : 'a'

      const DURATION = 900
      const start = performance.now()

      const tick = (now) => {
        const p = Math.min((now - start) / DURATION, 1)
        const t = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2
        incoming.style.opacity = String(t)
        outgoing.style.opacity  = String(1 - t)

        if (p < 1) {
          rafRef.current = requestAnimationFrame(tick)
        } else {
          incoming.style.opacity = '1'
          outgoing.style.opacity  = '0'
          rafRef.current = null
        }
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    incoming.addEventListener('canplay', startFade, { once: true })
    return () => incoming.removeEventListener('canplay', startFade)
  }, [src])

  return (
    <div className="video-bg" aria-hidden="true">
      <video ref={vidARef} autoPlay loop muted playsInline preload="auto"
        className="video-bg-el" style={{ opacity: 1, transition: 'none' }} />
      <video ref={vidBRef} autoPlay loop muted playsInline preload="auto"
        className="video-bg-el" style={{ opacity: 0, transition: 'none' }} />
      <div className={`video-bg-overlay ${dark ? 'dark' : 'light'}`} />
    </div>
  )
}
