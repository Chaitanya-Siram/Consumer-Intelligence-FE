import { useEffect, useRef, useState } from "react";
import { hexToRgb, useOrbSettings, type OrbConfig } from "./orb-settings";
import { cn } from "../../lib/utils";

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

/**
 * Pearlescent optical-glass orb with a flowing liquid ribbon core. The glass is
 * a fixed perfect circle; inside, a domain-warped S/infinity ribbon of colour
 * stays centred with a radial gap to the shell. Every parameter (4-stop palette,
 * motion, ribbon shape, glass) is a uniform driven by the settings panel.
 */
const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform vec3 uFlow;

uniform vec3 uColA, uColB, uColC, uColD;
uniform float uSpeed, uWarp, uBand, uWaveAmp, uWaveFreq, uAngle, uSpin;
uniform float uGap, uShell, uGloss, uRim;
uniform float uAngleRad; // ribbon orientation (radians), driven on the CPU
uniform float uActive; // 0..1 — voice input engaged (eased)
uniform float uLevel;  // 0..1 — live microphone amplitude

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p); vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1,0)), u.x),
             mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0; float a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.02; a *= 0.5; }
  return v;
}
vec3 palette(float x){
  x = clamp(x, 0.0, 1.0);
  if (x < 0.3333) return mix(uColA, uColB, x / 0.3333);
  if (x < 0.6666) return mix(uColB, uColC, (x - 0.3333) / 0.3333);
  return mix(uColC, uColD, (x - 0.6666) / 0.3333);
}

void main(){
  vec2 st = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  float d = length(st);
  float R = 0.46;
  float aaw = 1.4 / uRes.y;
  if (d > R + aaw) { gl_FragColor = vec4(0.0); return; }

  float z = sqrt(max(R * R - d * d, 0.0)) / R;

  // pearlescent glass shell
  vec3 shell = mix(vec3(0.94, 0.94, 0.98), vec3(0.82, 0.81, 0.93),
                   clamp(0.5 - st.y, 0.0, 1.0)) * uShell;

  // flowing liquid ribbon
  float voice = uLevel;                                 // live mic amplitude
  float t = uTime * 0.10 * uSpeed;
  vec2 p = st + uFlow.xy * 0.14 + uMouse * 0.03;
  float w = fbm(p * 2.0 + vec2(t * 0.3, -t * 0.2));
  p += (w - 0.5) * uWarp;

  // orientation driven on the CPU (idle spin → nearest horizontal while listening)
  float ang = uAngleRad;
  float ca = cos(ang), sa = sin(ang);
  vec2 rp = vec2(ca * p.x - sa * p.y, sa * p.x + ca * p.y);

  // undulation; amplitude responds to the speaker's voice level
  float phase = uTime * 0.35 * uSpeed + uMouse.x * 0.6;
  float wave = uWaveAmp * (sin(rp.x * uWaveFreq + phase)
             + 0.4 * sin(rp.x * uWaveFreq * 2.2 - phase * 1.3))
             * (1.0 + voice * 1.4);
  float dist = abs(rp.y - wave);
  float band = smoothstep(uBand, 0.0, dist);
  band *= smoothstep(0.64, 0.12, abs(rp.x));

  float u = clamp(rp.x * 0.9 + 0.5 + (w - 0.5) * 0.2, 0.0, 1.0);
  vec3 fluid = palette(u);
  fluid *= 0.82 + 0.18 * smoothstep(0.14, 0.0, dist);
  fluid *= 1.0 + voice * 0.12;

  float gap = smoothstep(R * 0.96, R * uGap, d);
  float body = clamp(band * gap, 0.0, 1.0);

  vec3 col = mix(shell, fluid, body * 0.95);
  col += fluid * band * gap * (0.18 + voice * 0.35);   // glow with the voice

  // glass shading + soft gloss
  col *= mix(0.92, 1.06, z);
  float hi = smoothstep(0.34, 0.0, length(st - vec2(-0.14, 0.16)));
  col = mix(col, vec3(1.0), hi * uGloss);
  float crescent = smoothstep(0.10, 0.0, abs(d - R * 0.9))
                 * smoothstep(-0.1, 0.45, -st.y);
  col += crescent * uGloss * 0.5;

  float fres = smoothstep(R * 0.80, R, d);
  col = mix(col, vec3(1.0), fres * uRim);
  col.r += fres * 0.04; col.b -= fres * 0.025;

  float alpha = 1.0 - smoothstep(R - aaw, R + aaw, d);
  gl_FragColor = vec4(col, alpha);
}
`;

function compile(
  gl: WebGLRenderingContext,
  type: number,
  src: string,
): WebGLShader | null {
  try {
    const sh = gl.createShader(type);
    if (!sh) return null;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.warn("SenseOrb shader compile error:", gl.getShaderInfoLog(sh));
      gl.deleteShader(sh);
      return null;
    }
    return sh;
  } catch (e) {
    console.warn("SenseOrb shader compile exception:", e);
    return null;
  }
}

/** Animated glass-orb visual; all parameters come from the settings panel. */
export function SenseOrb({
  size = 150,
  active = false,
  getLevel,
}: {
  size?: number;
  /** When true (voice input engaged) the ribbon eases to a horizontal wave. */
  active?: boolean;
  /** Returns the live mic amplitude (0..1) so the wave responds to speech. */
  getLevel?: () => number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { config } = useOrbSettings();
  const cfgRef = useRef<OrbConfig>(config);
  const activeRef = useRef(active);
  const getLevelRef = useRef(getLevel);
  const [webglReady, setWebglReady] = useState(false);

  const state = useRef({
    mx: 0,
    my: 0,
    tmx: 0,
    tmy: 0,
    fx: 0,
    fy: 0,
    av: 0,
    lv: 0,
    ang: 0,
    lastT: 0,
    inited: false,
  });

  useEffect(() => {
    cfgRef.current = config;
  }, [config]);
  useEffect(() => {
    activeRef.current = active;
  }, [active]);
  useEffect(() => {
    getLevelRef.current = getLevel;
  }, [getLevel]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let gl: WebGLRenderingContext | null = null;
    try {
      gl = canvas.getContext("webgl", {
        premultipliedAlpha: false,
        alpha: true,
        antialias: true,
      });
    } catch (e) {
      console.warn("SenseOrb WebGL context init exception:", e);
      gl = null;
    }
    if (!gl) {
      setWebglReady(false);
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);

    const vertShader = compile(gl, gl.VERTEX_SHADER, VERT);
    const fragShader = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vertShader || !fragShader) {
      setWebglReady(false);
      return;
    }

    const program = gl.createProgram();
    if (!program) {
      setWebglReady(false);
      return;
    }
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn(
        "SenseOrb program link error:",
        gl.getProgramInfoLog(program),
      );
      gl.deleteProgram(program);
      setWebglReady(false);
      return;
    }

    gl.useProgram(program);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );
    const aPos = gl.getAttribLocation(program, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const loc = (n: string) => gl.getUniformLocation(program, n);
    const uRes = loc("uRes");
    const uTime = loc("uTime");
    const uMouse = loc("uMouse");
    const uFlow = loc("uFlow");
    const uColA = loc("uColA");
    const uColB = loc("uColB");
    const uColC = loc("uColC");
    const uColD = loc("uColD");
    const uSpeed = loc("uSpeed");
    const uWarp = loc("uWarp");
    const uBand = loc("uBand");
    const uWaveAmp = loc("uWaveAmp");
    const uWaveFreq = loc("uWaveFreq");
    const uAngle = loc("uAngle");
    const uSpin = loc("uSpin");
    const uAngleRad = loc("uAngleRad");
    const uGap = loc("uGap");
    const uShell = loc("uShell");
    const uGloss = loc("uGloss");
    const uRim = loc("uRim");
    const uActive = loc("uActive");
    const uLevel = loc("uLevel");

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    setWebglReady(true);

    function onMove(e: PointerEvent) {
      const r = canvas!.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      state.current.tmx = Math.max(-1, Math.min(1, (e.clientX - cx) / 280));
      state.current.tmy = Math.max(-1, Math.min(1, (e.clientY - cy) / 280));
    }
    window.addEventListener("pointermove", onMove);

    const start = performance.now();
    let raf = 0;
    const render = () => {
      const now = performance.now();
      const tsec = (now - start) / 1000;
      const s = state.current;
      const cfg = cfgRef.current;
      if (!s.inited) {
        s.ang = (cfg.angle * Math.PI) / 180;
        s.lastT = now;
        s.inited = true;
      }
      const dt = Math.min(0.05, (now - s.lastT) / 1000);
      s.lastT = now;

      s.mx += (s.tmx - s.mx) * 0.05;
      s.my += (s.tmy - s.my) * 0.05;
      s.fx += (s.mx * 0.5 - s.fx) * 0.016;
      s.fy += (-s.my * 0.5 - s.fy) * 0.016;
      s.av += ((activeRef.current ? 1 : 0) - s.av) * 0.08; // eased engage/settle
      const lvl = getLevelRef.current ? getLevelRef.current() : 0;
      s.lv += (lvl - s.lv) * 0.25; // responsive, smoothed

      // orientation: idle → continuous spin; listening → ease to nearest horizontal
      if (activeRef.current) {
        const target = Math.round(s.ang / Math.PI) * Math.PI;
        s.ang += (target - s.ang) * 0.05; // gentle ease-in
      } else {
        s.ang += cfg.spin * 0.5 * dt;
        if (s.ang > Math.PI * 2) s.ang -= Math.PI * 2;
      }

      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, tsec);
      gl.uniform2f(uMouse, s.mx, -s.my);
      gl.uniform3f(uFlow, s.fx, s.fy, 0);
      gl.uniform3fv(uColA, hexToRgb(cfg.colors[0]));
      gl.uniform3fv(uColB, hexToRgb(cfg.colors[1]));
      gl.uniform3fv(uColC, hexToRgb(cfg.colors[2]));
      gl.uniform3fv(uColD, hexToRgb(cfg.colors[3]));
      gl.uniform1f(uSpeed, cfg.speed);
      gl.uniform1f(uWarp, cfg.warp);
      gl.uniform1f(uBand, cfg.band);
      gl.uniform1f(uWaveAmp, cfg.waveAmp);
      gl.uniform1f(uWaveFreq, cfg.waveFreq);
      gl.uniform1f(uAngle, cfg.angle);
      gl.uniform1f(uSpin, cfg.spin);
      gl.uniform1f(uAngleRad, s.ang);
      gl.uniform1f(uGap, cfg.gap);
      gl.uniform1f(uShell, cfg.shell);
      gl.uniform1f(uGloss, cfg.gloss);
      gl.uniform1f(uRim, cfg.rim);
      gl.uniform1f(uActive, s.av);
      gl.uniform1f(uLevel, s.lv * s.av); // only while engaged
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      raf = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [size]);

  return (
    <div
      className={cn(
        "relative",
        "flex",
        "items-center",
        "justify-center",
        "overflow-hidden",
        "rounded-full",
        "select-none",
      )}
      style={{
        width: size,
        height: size,
        background:
          "radial-gradient(circle at 50% 50%, rgba(255, 250, 255, 0.28) 0%, rgba(245, 235, 255, 0.52) 65%, rgba(225, 215, 245, 0.75) 100%)",
        boxShadow:
          "inset 0 0 16px rgba(255, 255, 255, 0.95), inset 0 0 32px rgba(255, 0, 234, 0.28), 0 16px 40px rgba(255, 0, 234, 0.15)",
        border: "1.5px solid rgba(255, 255, 255, 0.9)",
      }}
    >
      {/* Fallback Animated Liquid Wave (visible if WebGL is initializing or fallback) */}
      <div
        className={cn(
          "absolute",
          "inset-0",
          "opacity-80",
          "pointer-events-none",
        )}
        style={{
          background:
            "linear-gradient(135deg, #B301FF 0%, #D500E1 35%, #E45A28 70%, #F5882E 100%)",
          filter: "blur(12px)",
          animation: "orbWaveMorph 6s ease-in-out infinite alternate",
        }}
      />

      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className={`absolute inset-0 z-10 transition-opacity duration-300 ${
          webglReady ? "opacity-100" : "opacity-0"
        }`}
        style={{ width: size, height: size }}
        aria-hidden
      />

      <style>{`
        @keyframes orbWaveMorph {
          0% {
            border-radius: 42% 58% 70% 30% / 45% 45% 55% 55%;
            transform: rotate(-25deg) scale(0.65);
          }
          50% {
            border-radius: 65% 35% 30% 70% / 55% 30% 70% 45%;
            transform: rotate(75deg) scale(0.80);
          }
          100% {
            border-radius: 35% 65% 50% 50% / 30% 65% 35% 70%;
            transform: rotate(125deg) scale(0.74);
          }
        }
      `}</style>
    </div>
  );
}
