/**
 * The community graph from docs/Html/Network_Map.html.
 *
 * A seeded cluster scatter, not a physics simulation: nodes are drawn around a
 * ring of cluster centres, most edges stay inside a cluster, and the whole layout
 * is reproduced from one integer seed. That is what makes the map identical on
 * every visit and every machine instead of reshuffling on each render — so a
 * reader can be told "the cluster at four o'clock" and find it again.
 *
 * Each community's share of the conversation drives its node count, so visual
 * weight on the canvas tracks the data rather than the layout table.
 */
import { useCallback, useEffect, useRef } from "react";

const GREY = ["#bbb", "#ccc", "#c4c4c4", "#d0d0d0", "#b8b8b8"];
const PAD = 18;
const BADGE = 15;

/** The source page's LCG. Kept exactly so a seed reproduces its composition. */
function seededRand(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function hex2rgba(hex, a) {
  if (!hex?.startsWith("#")) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function buildNet(seed, numNodes, numEdges, communities, highlight) {
  const rand = seededRand(seed);
  const nodes = [];
  const cx = 0.5;
  const cy = 0.5;

  communities.forEach((community, ci) => {
    const rad = (community.angle * Math.PI) / 180;
    const bx = cx + Math.cos(rad) * community.dist;
    const by = cy + Math.sin(rad) * community.dist;
    const count = Math.floor(numNodes * community.frac);
    for (let i = 0; i < count; i += 1) {
      const spread = 0.05 + rand() * 0.07;
      const a2 = rand() * Math.PI * 2;
      const d2 = rand() * spread;
      const isHL = highlight >= 0 && ci === highlight;
      // With one cluster highlighted the rest fade to grey, so the deep-dive
      // shows where that community sits without redrawing the map.
      const alpha =
        highlight < 0 ? 0.55 + rand() * 0.45 : isHL ? 0.75 + rand() * 0.25 : 0.12 + rand() * 0.1;
      nodes.push({
        x: bx + Math.cos(a2) * d2,
        y: by + Math.sin(a2) * d2,
        r: isHL
          ? 2.0 + rand() * (ci < 2 ? 3.0 : 2.2)
          : (1.5 + rand() * (ci < 2 ? 2.5 : 1.8)) * (highlight < 0 ? 1 : 0.6),
        color: isHL ? community.color : highlight >= 0 ? "#ccc" : community.color,
        comm: ci,
        alpha,
      });
    }
  });

  // Unclustered chatter fills the ring so the clusters read as dense, not sparse.
  for (let i = nodes.length; i < numNodes; i += 1) {
    const a = rand() * Math.PI * 2;
    const d = 0.3 + rand() * 0.22;
    nodes.push({
      x: cx + Math.cos(a) * d,
      y: cy + Math.sin(a) * d,
      r: 0.7 + rand() * 1.1,
      color: GREY[Math.floor(rand() * GREY.length)],
      comm: -1,
      alpha: 0.12 + rand() * 0.12,
    });
  }

  const edges = [];
  const byComm = new Map();
  nodes.forEach((n, i) => {
    if (n.comm >= 0) {
      if (!byComm.has(n.comm)) byComm.set(n.comm, []);
      byComm.get(n.comm).push(i);
    }
  });

  for (let i = 0; i < numEdges; i += 1) {
    const a = Math.floor(rand() * nodes.length);
    let b;
    // Most edges stay inside a community: that is what makes clusters visible.
    if (nodes[a].comm >= 0 && rand() < 0.68) {
      const same = byComm.get(nodes[a].comm) || [];
      b = same[Math.floor(rand() * same.length)];
    } else {
      b = Math.floor(rand() * nodes.length);
    }
    if (a === b || b === undefined) continue;
    const isHL = highlight >= 0 && nodes[a].comm === highlight && nodes[b].comm === highlight;
    edges.push({
      a,
      b,
      color: highlight >= 0 && !isHL ? "#ddd" : nodes[a].color,
      alpha: highlight >= 0 ? (isHL ? 0.28 : 0.05) : 0.13,
    });
  }
  return { nodes, edges };
}

export default function NetworkCanvas({
  communities,
  seed = 7777,
  nodeCount = 1600,
  edgeCount = 1100,
  labeled = false,
  highlight = -1,
  onSelect,
  height = 380,
}) {
  const canvasRef = useRef(null);
  const badgesRef = useRef([]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !communities?.length) return;
    const parent = canvas.parentElement;
    const W = parent?.clientWidth || 480;
    const H = parent?.clientHeight || height;

    // Back the canvas at device resolution; the CSS box stays the same size, so
    // this only stops the dots looking soft on a retina screen.
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;

    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const { nodes, edges } = buildNet(seed, nodeCount, edgeCount, communities, highlight);
    const sx = (x) => PAD + x * (W - PAD * 2);
    const sy = (y) => PAD + y * (H - PAD * 2);

    edges.forEach((e) => {
      const na = nodes[e.a];
      const nb = nodes[e.b];
      if (!na || !nb) return;
      ctx.beginPath();
      ctx.moveTo(sx(na.x), sy(na.y));
      ctx.lineTo(sx(nb.x), sy(nb.y));
      ctx.strokeStyle = hex2rgba(e.color, e.alpha);
      ctx.lineWidth = 0.5;
      ctx.stroke();
    });

    nodes.forEach((n) => {
      ctx.beginPath();
      ctx.arc(sx(n.x), sy(n.y), n.r, 0, Math.PI * 2);
      ctx.fillStyle = hex2rgba(n.color, n.alpha);
      ctx.fill();
    });

    badgesRef.current = [];
    const badge = (community, ci, size) => {
      const rad = (community.angle * Math.PI) / 180;
      const px = sx(0.5 + Math.cos(rad) * community.dist);
      const py = sy(0.5 + Math.sin(rad) * community.dist);
      ctx.shadowColor = "rgba(0,0,0,0.25)";
      ctx.shadowBlur = 6;
      ctx.fillStyle = community.color;
      roundRect(ctx, px - size, py - size, size * 2, size * 2, 5);
      ctx.fill();
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#fff";
      ctx.font = `bold ${size - 2}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(ci + 1), px, py);
      return { ci, px, py, r: size };
    };

    if (labeled && highlight < 0) {
      badgesRef.current = communities.map((c, ci) => badge(c, ci, BADGE));
    } else if (highlight >= 0 && communities[highlight]) {
      badge(communities[highlight], highlight, 16);
    }
  }, [communities, seed, nodeCount, edgeCount, labeled, highlight, height]);

  useEffect(() => {
    draw();
    const parent = canvasRef.current?.parentElement;
    if (!parent || typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", draw);
      return () => window.removeEventListener("resize", draw);
    }
    const observer = new ResizeObserver(draw);
    observer.observe(parent);
    return () => observer.disconnect();
  }, [draw]);

  const handleClick = (event) => {
    if (!onSelect || !badgesRef.current.length) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const hit = badgesRef.current.find(
      (b) => Math.abs(x - b.px) <= b.r + 4 && Math.abs(y - b.py) <= b.r + 4,
    );
    if (hit) onSelect(hit.ci);
  };

  return (
    <canvas
      ref={canvasRef}
      onClick={handleClick}
      style={{ display: "block", cursor: onSelect && labeled ? "pointer" : "default" }}
      aria-label={`Community network map with ${communities?.length || 0} clusters`}
    />
  );
}
