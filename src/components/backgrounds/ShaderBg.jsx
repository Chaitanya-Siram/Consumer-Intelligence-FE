import { useRef, useEffect } from 'react'

function hexToRgb(hex) {
  let h = hex.replace('#', '')
  if (h.length === 3) h = h.split('').map(c => c + c).join('')
  const n = parseInt(h, 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)) }

export default function ShaderBg({ intensity = 55, speed = 1, dark = true }) {
  const ref = useRef(null)
  const ripplesRef = useRef([])
  const startRef = useRef(performance.now())

  useEffect(() => {
    const cvs = ref.current
    if (!cvs) return
    const ctx = cvs.getContext('2d')
    let raf
    let dpr = Math.min(window.devicePixelRatio || 1, 2)
    let scrollTimeout
    let isScrolling = false

    const handleScroll = () => {
      isScrolling = true
      if (scrollTimeout) clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(() => {
        isScrolling = false
      }, 150)
    }

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      cvs.width = cvs.clientWidth * dpr
      cvs.height = cvs.clientHeight * dpr
    }
    resize()
    window.addEventListener('resize', resize)
    // Capture scroll events from any scroll container globally (like .canvas)
    window.addEventListener('scroll', handleScroll, { capture: true, passive: true })

    const css = getComputedStyle(document.documentElement)
    const colA = css.getPropertyValue('--accent-a').trim() || '#7C3AED'
    const colB = css.getPropertyValue('--accent-b').trim() || '#EC4899'
    const colC = '#3DD9D6'
    const palette = [colA, colB, colC]

    let nextRippleAt = performance.now() + 1500

    const spawnRipple = (now) => {
      const w = cvs.clientWidth, h = cvs.clientHeight
      ripplesRef.current.push({
        x: Math.random() * w * 0.8 + w * 0.1,
        y: Math.random() * h * 0.8 + h * 0.1,
        t0: now,
        life: 14000 + Math.random() * 6000,
        color: palette[Math.floor(Math.random() * palette.length)],
        max: Math.max(w, h) * (0.7 + Math.random() * 0.5),
      })
    }

    const draw = () => {
      const now = performance.now()

      // Pause rendering completely during scrolling to free up GPU and main thread cycles
      if (isScrolling) {
        raf = requestAnimationFrame(draw)
        return
      }

      const w = cvs.clientWidth, h = cvs.clientHeight
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)

      if (now > nextRippleAt) {
        spawnRipple(now)
        nextRippleAt = now + (3000 + Math.random() * 1500) / Math.max(0.25, speed)
      }

      ripplesRef.current = ripplesRef.current.filter(r => (now - r.t0) < r.life)

      // Spacing 32 (reduced from 16) yields 75% fewer dots, massively lowering draw call count
      const spacing = 32
      const cols = Math.ceil(w / spacing) + 1
      const rows = Math.ceil(h / spacing) + 1
      const baseAlpha = (dark ? 0.16 : 0.14) * (intensity / 55)
      const tIdle = (now - startRef.current) * 0.0004 * speed

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * spacing
          const y = j * spacing

          const idle = 0.5 + 0.5 * Math.sin(i * 0.35 + j * 0.4 + tIdle)
          let r = 0.95 + idle * 0.45 // Adjusted radius scale for spacing 32

          let rippleR = 0, rippleG = 0, rippleB = 0, rippleA = 0
          for (const rip of ripplesRef.current) {
            const dx = x - rip.x, dy = y - rip.y
            // Math.sqrt is slightly faster than Math.hypot in V8
            const d = Math.sqrt(dx * dx + dy * dy)
            const age = (now - rip.t0) / rip.life
            const radius = rip.max * Math.pow(age, 0.62)
            const thickness = 70 + age * 90
            const distFromRing = Math.abs(d - radius)
            if (distFromRing < thickness) {
              const fall = 1 - distFromRing / thickness
              const env = Math.sin(Math.PI * age) ** 1.5
              const a = fall * env * 0.85 * (intensity / 55)
              const c = hexToRgb(rip.color)
              rippleR += c.r * a
              rippleG += c.g * a
              rippleB += c.b * a
              rippleA = Math.max(rippleA, a)
              r += a * 0.8
            }
          }

          if (rippleA > 0.005) {
            const norm = Math.max(rippleA, 0.001)
            const rR = clamp(rippleR / norm, 0, 255)
            const gG = clamp(rippleG / norm, 0, 255)
            const bB = clamp(rippleB / norm, 0, 255)
            const a = clamp(baseAlpha + rippleA * 0.9, 0, 0.85)
            ctx.fillStyle = `rgba(${rR|0},${gG|0},${bB|0},${a})`
          } else {
            const v = dark ? 255 : 20
            ctx.fillStyle = `rgba(${v},${v},${v},${baseAlpha * (0.55 + idle * 0.45)})`
          }

          ctx.beginPath()
          ctx.arc(x, y, r, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      raf = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('scroll', handleScroll, { capture: true })
      if (scrollTimeout) clearTimeout(scrollTimeout)
    }
  }, [intensity, speed, dark])

  return <canvas ref={ref} className="shader-canvas" aria-hidden="true" />
}
