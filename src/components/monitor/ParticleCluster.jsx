/**
 * ParticleCluster — settle-to-rest organic clustering (ported to JSX).
 *
 * Fixed group centres, velocity sleeping, and hover-expand interaction:
 * - No time-varying attractors → genuine rest state
 * - Hovering a bubble gently expands its personal space, nudging neighbours
 *   outward; they drift back once the cursor leaves
 * - No cursor repulsion — only the hovered bubble is affected
 *
 * `particles` items: { id, color, alpha?, articleId?, isMostNegative?, label? }
 */

import { useEffect, useRef, useCallback, useState } from "react";

// ── Physics tunables ───────────────────────────────────────────────────────────

const R = 23;
const SEP_SAME = R * 2 + 2;
const SEP_DIFF = R * 2 + 8;
const SPRING_K = 0.006;
const REPEL_K = 1.8;
const DAMPING = 0.86;
const SLEEP_V = 0.05;
const HOVER_EXPAND = 16; // max extra px of personal space when fully hovered
const HOVER_IN = 0.04; // lerp rate toward hover (slow ease-in ~1.5s to full)
const HOVER_OUT = 0.03; // lerp rate away from hover (slightly slower ease-out)
const FADE_SPEED = 0.013; // per-frame opacity increment: ~77 frames (1.3s) to fully opaque
const FADE_STAGGER = 0.035; // per-particle stagger offset so they bloom in sequence

// ── Colour helpers ─────────────────────────────────────────────────────────────

function hexToRgb(hex) {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toRgba(hex, alpha, bri) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${~~Math.min(255, r * bri)},${~~Math.min(255, g * bri)},${~~Math.min(255, b * bri)},${alpha})`;
}

// ── data_alert icon — perfectly centred inside the bubble ──────────────────────

function drawAlertBadge(ctx, px, py) {
  ctx.save();

  const cx = Math.round(px);
  const cy = Math.round(py) - 1;

  ctx.fillStyle = "rgba(255,255,255,0.96)";

  // Stem
  ctx.beginPath();
  ctx.roundRect(cx - 1.5, cy - 9, 3, 12, 1);
  ctx.fill();

  // Dot
  ctx.beginPath();
  ctx.arc(cx, cy + 6, 1.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ── Initialisation ─────────────────────────────────────────────────────────────

function init(data, cw, ch) {
  const cx = cw / 2;
  const cy = ch / 2;

  const countMap = new Map();
  for (const d of data) countMap.set(d.color, (countMap.get(d.color) ?? 0) + 1);
  const colorKeys = [...countMap.keys()];
  const nc = colorKeys.length;

  const packR = (key) => R * Math.sqrt((countMap.get(key) ?? 1) / 0.91);
  const avgPackR = colorKeys.reduce((s, k) => s + packR(k), 0) / nc;

  const spacing = avgPackR * 1.55;
  const startAngle = -Math.PI / 2;

  const centers = colorKeys.map((key, i) => ({
    key,
    x: cx + Math.cos(startAngle + (i / nc) * Math.PI * 2) * spacing,
    y: cy + Math.sin(startAngle + (i / nc) * Math.PI * 2) * spacing,
  }));

  const centerMap = new Map(centers.map((c) => [c.key, c]));

  const bodies = data.map((d, idx) => {
    const gc = centerMap.get(d.color);
    const n = countMap.get(d.color);
    const sr = R * Math.sqrt(n) * 0.85;
    const angle = Math.random() * Math.PI * 2;
    const dist = sr * Math.random();
    const bri = 0.91 + Math.random() * 0.18;

    return {
      ...d,
      x: gc.x + Math.cos(angle) * dist,
      y: gc.y + Math.sin(angle) * dist,
      vx: 0,
      vy: 0,
      groupKey: d.color,
      displayColor: toRgba(d.color, 1, bri),
      hoverW: 0,
      // Negative start: particle waits (idx * FADE_STAGGER / FADE_SPEED) frames
      // before becoming visible. Physics runs from frame 0 regardless so the
      // cluster is already settled by the time each bubble fades in.
      drawAlpha: -(idx * FADE_STAGGER),
      bri,
    };
  });

  return { bodies, centers };
}

// ── Physics step ───────────────────────────────────────────────────────────────

function step(bodies, centers, hoverIdx) {
  const n = bodies.length;
  if (n === 0) return;

  const centerMap = new Map(centers.map((c) => [c.key, c]));

  for (let i = 0; i < n; i++) {
    const b = bodies[i];
    b.drawAlpha = Math.min(1, b.drawAlpha + FADE_SPEED);

    const gc = centerMap.get(b.groupKey);
    const target = i === hoverIdx ? 1 : 0;
    b.hoverW += (target - b.hoverW) * (target > b.hoverW ? HOVER_IN : HOVER_OUT);
    if (b.hoverW < 0.001) b.hoverW = 0;

    let ax = (gc.x - b.x) * SPRING_K;
    let ay = (gc.y - b.y) * SPRING_K;

    for (let j = i + 1; j < n; j++) {
      const o = bodies[j];
      const dx = b.x - o.x;
      const dy = b.y - o.y;
      const d2 = dx * dx + dy * dy;
      const expand = Math.max(b.hoverW, o.hoverW) * HOVER_EXPAND;
      const sep = (b.groupKey === o.groupKey ? SEP_SAME : SEP_DIFF) + expand;
      if (d2 < sep * sep && d2 > 1e-6) {
        const d = Math.sqrt(d2);
        const mag = ((sep - d) / d) * REPEL_K * 0.5;
        const fx = dx * mag;
        const fy = dy * mag;
        ax += fx;
        ay += fy;
        o.vx -= fx;
        o.vy -= fy;
      }
    }

    b.vx = (b.vx + ax) * DAMPING;
    b.vy = (b.vy + ay) * DAMPING;

    const allSleeping = hoverIdx === -1 && b.hoverW === 0;
    if (allSleeping && Math.abs(b.vx) < SLEEP_V && Math.abs(b.vy) < SLEEP_V) {
      b.vx = 0;
      b.vy = 0;
    }

    b.x += b.vx;
    b.y += b.vy;
  }
}

// ── Renderer ───────────────────────────────────────────────────────────────────

function render(ctx, bodies, cw, ch) {
  ctx.clearRect(0, 0, cw, ch);
  for (const b of bodies) {
    if (b.drawAlpha <= 0) continue;
    const r = R + b.hoverW * 2;
    ctx.beginPath();
    ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
    ctx.fillStyle =
      b.drawAlpha >= 1 ? b.displayColor : toRgba(b.color, b.drawAlpha, b.bri);
    ctx.fill();
    if (b.isMostNegative && b.drawAlpha > 0.5) {
      ctx.beginPath();
      ctx.arc(b.x, b.y, r - 1, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,255,255,${0.7 * Math.min(1, (b.drawAlpha - 0.5) * 2)})`;
      ctx.lineWidth = 2;
      ctx.stroke();
      drawAlertBadge(ctx, b.x, b.y);
    }
  }
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function ParticleCluster({
  particles,
  onParticleClick,
  style,
  className,
}) {
  const canvasRef = useRef(null);
  const bodiesRef = useRef([]);
  const centersRef = useRef([]);
  const hoverIdxRef = useRef(-1);
  const prevHoverRef = useRef(-1);
  const rafRef = useRef(0);
  const lastTooltipPosRef = useRef({ x: -9999, y: -9999, above: false });
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Size the canvas from the actual cluster geometry (group-centre ring +
    // settled group radius + bubble radius + hover-expand margin) so bubbles
    // never spill past the canvas edge and get clipped.
    const counts = new Map();
    for (const p of particles) counts.set(p.color, (counts.get(p.color) ?? 0) + 1);
    const keys = [...counts.keys()];
    const nc = keys.length || 1;
    const packR = (k) => R * Math.sqrt((counts.get(k) ?? 1) / 0.91);
    const avgPackR = keys.reduce((s, k) => s + packR(k), 0) / nc;
    const spacing = avgPackR * 1.55; // matches init(): group-centre distance
    const maxGroupR = keys.reduce(
      (m, k) => Math.max(m, R * Math.sqrt(counts.get(k)) * 1.15),
      R,
    );
    const extent = spacing + maxGroupR + R + HOVER_EXPAND;
    const sz = Math.max(300, Math.ceil(extent * 2));
    canvas.width = sz;
    canvas.height = sz;

    const { bodies, centers } = init(particles, sz, sz);
    bodiesRef.current = bodies;
    centersRef.current = centers;
    cancelAnimationFrame(rafRef.current);

    function loop() {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      step(bodiesRef.current, centersRef.current, hoverIdxRef.current);
      render(ctx, bodiesRef.current, canvas.width, canvas.height);
      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [particles]);

  const toCanvasCoords = (e) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (el.width / rect.width),
      y: (e.clientY - rect.top) * (el.height / rect.height),
    };
  };

  const hitTest = (cx, cy) => {
    const bs = bodiesRef.current;
    for (let i = 0; i < bs.length; i++) {
      if ((bs[i].x - cx) ** 2 + (bs[i].y - cy) ** 2 <= R * R) return i;
    }
    return -1;
  };

  const handleMouseMove = useCallback((e) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const sx = el.width / rect.width;
    const sy = el.height / rect.height;
    const cx = (e.clientX - rect.left) * sx;
    const cy = (e.clientY - rect.top) * sy;
    const idx = hitTest(cx, cy);
    hoverIdxRef.current = idx;
    el.style.cursor = idx >= 0 ? "pointer" : "default";

    if (idx !== prevHoverRef.current) {
      prevHoverRef.current = idx;
      if (idx >= 0) {
        const b = bodiesRef.current[idx];
        const tipX = b.x / sx;
        const tipY = b.y / sy;
        const cssR = R / sx;
        const above = tipY > cssR + 48;
        lastTooltipPosRef.current = { x: tipX, y: tipY, above };
        setTooltip({ x: tipX, y: tipY, label: b.label ?? "", above });
      } else {
        setTooltip(null);
      }
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    hoverIdxRef.current = -1;
    prevHoverRef.current = -1;
    setTooltip(null);
  }, []);

  const handleClick = useCallback(
    (e) => {
      if (!onParticleClick) return;
      const { x, y } = toCanvasCoords(e);
      const idx = hitTest(x, y);
      if (idx >= 0) {
        const b = bodiesRef.current[idx];
        onParticleClick(b.articleId ?? String(b.id));
      }
    },
    [onParticleClick],
  );

  const tip = tooltip ?? lastTooltipPosRef.current;

  return (
    <div
      className={className}
      style={{ position: "relative", display: "block", ...style }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          width: "100%",
          height: "auto",
          cursor: "default",
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      />

      <div
        style={{
          position: "absolute",
          left: tip.x,
          top: tip.above ? tip.y - (R + 12) : tip.y + (R + 10),
          transform: tip.above
            ? "translate(-50%, -100%)"
            : "translate(-50%, 0)",
          pointerEvents: "none",
          maxWidth: 200,
          padding: "7px 11px",
          borderRadius: 8,
          background: "rgba(15, 15, 17, 0.90)",
          border: "1px solid rgba(255,255,255,0.13)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          fontSize: 11,
          fontWeight: 500,
          lineHeight: 1.45,
          color: "#E8E8EE",
          letterSpacing: "-0.01em",
          whiteSpace: "normal",
          wordBreak: "break-word",
          zIndex: 50,
          opacity: tooltip?.label ? 1 : 0,
          transition: "opacity 0.20s ease-out",
        }}
      >
        {tooltip?.label ?? ""}
      </div>
    </div>
  );
}
