import { useRef, useEffect } from 'react'

function hexToRgb(hex) {
  let h = hex.replace('#', '')
  if (h.length === 3) h = h.split('').map(c => c + c).join('')
  const n = parseInt(h, 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

// Animated "media network" backdrop — drifting nodes connected by
// distance-based links, evoking a signal/relationship graph.
export default function NetworkBg({ linkDistance = 150 }) {
  const ref = useRef(null)
  const nodesRef = useRef([])

  useEffect(() => {
    const cvs = ref.current
    if (!cvs) return
    const ctx = cvs.getContext('2d')
    let raf
    let dpr = Math.min(window.devicePixelRatio || 1, 2)

    const css = getComputedStyle(document.documentElement)
    const colA = hexToRgb(css.getPropertyValue('--accent-a').trim() || '#5B6CF9')
    const colB = hexToRgb(css.getPropertyValue('--accent-b').trim() || '#00C9A7')

    const seedNodes = (w, h) => {
      const count = Math.min(70, Math.max(28, Math.round((w * h) / 22000)))
      nodesRef.current = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        r: 1.4 + Math.random() * 1.6,
        pulseOffset: Math.random() * Math.PI * 2,
        warm: Math.random() > 0.62,
      }))
    }

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = cvs.clientWidth, h = cvs.clientHeight
      cvs.width = w * dpr
      cvs.height = h * dpr
      if (!nodesRef.current.length) seedNodes(w, h)
    }
    resize()
    window.addEventListener('resize', resize)

    const draw = (now) => {
      const w = cvs.clientWidth, h = cvs.clientHeight
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)

      const nodes = nodesRef.current
      const t = now * 0.001

      for (const n of nodes) {
        n.x += n.vx
        n.y += n.vy
        if (n.x < 0 || n.x > w) n.vx *= -1
        if (n.y < 0 || n.y > h) n.vy *= -1
        n.x = Math.max(0, Math.min(w, n.x))
        n.y = Math.max(0, Math.min(h, n.y))
      }

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j]
          const dx = a.x - b.x, dy = a.y - b.y
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < linkDistance) {
            const alpha = (1 - d / linkDistance) * 0.16
            const c = a.warm || b.warm ? colB : colA
            ctx.strokeStyle = `rgba(${c.r},${c.g},${c.b},${alpha})`
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
      }

      for (const n of nodes) {
        const pulse = 0.55 + 0.45 * Math.sin(t * 1.2 + n.pulseOffset)
        const c = n.warm ? colB : colA
        const r = n.r * (0.85 + pulse * 0.3)
        ctx.beginPath()
        ctx.fillStyle = `rgba(${c.r},${c.g},${c.b},${0.32 + pulse * 0.3})`
        ctx.arc(n.x, n.y, r * 2.6, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.fillStyle = `rgba(${c.r},${c.g},${c.b},${0.7 + pulse * 0.3})`
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2)
        ctx.fill()
      }

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [linkDistance])

  return <canvas ref={ref} className="network-bg-canvas" aria-hidden="true" />
}
