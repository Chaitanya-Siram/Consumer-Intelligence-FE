#!/usr/bin/env node
// Records the narrated Workflow-screen walkthrough video and the tutorial
// screenshots.
//
//   node scripts/tutorial/record-workflow-tutorial.mjs
//
// Prerequisites
//   - the Vite dev server running (npm run dev → http://localhost:3000)
//   - macOS `say` for text-to-speech (any voice; default Samantha)
//   - an ffmpeg with libx264 + aac (set FFMPEG=/path/to/ffmpeg, or have it on PATH)
//
// The backend is fully stubbed with page.route(), so nothing is created on a
// real server. The video (+ poster) lands in public/tutorials/ so the app can
// play it from the Tutorial menu; screenshots land in docs/tutorials/images/.

import { chromium } from "playwright";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SCENES } from "./narration.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../..");
// The video is served by the app (Tutorial → Watch video), so it lives in public/.
const VIDEO_DIR = process.env.TUTORIAL_VIDEO_DIR || path.join(ROOT, "public/tutorials");
const VIDEO_FILE = path.join(VIDEO_DIR, "workflow-screen-walkthrough.mp4");
const POSTER_FILE = path.join(VIDEO_DIR, "workflow-screen-walkthrough.jpg");
// Screenshots feed the written tutorial in docs/.
const IMG_DIR = process.env.TUTORIAL_IMG_DIR || path.join(ROOT, "docs/tutorials/images");
const WORK = process.env.TUTORIAL_WORK || path.join(ROOT, ".tutorial-build");
const APP_URL = process.env.APP_URL || "http://localhost:3000";
const API_BASE = (process.env.API_BASE || readViteApiBase()).replace(/\/$/, "");
const FFMPEG = process.env.FFMPEG || "ffmpeg";
// Samantha is the most natural voice shipped with macOS. For an even softer
// tone install "Ava (Premium)" or "Zoe (Premium)" under System Settings →
// Accessibility → Spoken Content and run with VOICE=Ava.
const VOICE = process.env.VOICE || "Samantha";
const RATE = process.env.RATE || "168"; // words per minute; slower reads calmer
const W = 1920;
const H = 1080;
const GAP_MS = 350; // breathing room after each spoken segment
// Gentle EQ + level to make the synthetic voice sound softer and rounder.
const VOICE_FILTER = "highshelf=f=4500:g=-4,equalizer=f=180:t=q:w=1:g=1.5,lowpass=f=11000,volume=0.8";

fs.mkdirSync(VIDEO_DIR, { recursive: true });
fs.mkdirSync(IMG_DIR, { recursive: true });
fs.mkdirSync(path.join(WORK, "tts"), { recursive: true });
fs.mkdirSync(path.join(WORK, "video"), { recursive: true });

function readViteApiBase() {
  try {
    const env = fs.readFileSync(path.join(ROOT, ".env"), "utf8");
    const m = env.match(/^VITE_API_BASE_URL=(.+)$/m);
    if (m) return m[1].trim();
  } catch {}
  return "http://localhost:8000";
}

/* ---------------- text-to-speech ---------------- */

function ttsDurationMs(file) {
  const r = spawnSync(FFMPEG, ["-hide_banner", "-i", file], { encoding: "utf8" });
  const m = (r.stderr || "").match(/Duration: (\d+):(\d+):(\d+\.\d+)/);
  if (!m) throw new Error(`Could not read duration of ${file}`);
  return Math.round((+m[1] * 3600 + +m[2] * 60 + +m[3]) * 1000);
}

function synthesize() {
  const clips = [];
  for (const scene of SCENES) {
    scene.steps.forEach((step, i) => {
      const file = path.join(WORK, "tts", `${scene.id}-${i}.wav`);
      if (!fs.existsSync(file)) {
        const r = spawnSync("say", ["-v", VOICE, "-r", RATE, "-o", file, "--data-format=LEI16@22050", step.text]);
        if (r.status !== 0) throw new Error(`say failed: ${r.stderr}`);
      }
      clips.push({ scene: scene.id, index: i, file, durationMs: ttsDurationMs(file) });
    });
  }
  return clips;
}

/* ---------------- API stubs ---------------- */

function installApiStubs(page) {
  const project = { id: 101, name: "US Hotel Brand Competitive Media Analysis", description: "", is_active: true };
  let session = null;
  let savedWorkflow = null;

  const json = (route, body, status = 200) =>
    route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });

  return page.route((url) => url.href.startsWith(API_BASE), async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const p = url.pathname;
    const method = req.method();
    const body = () => {
      try {
        return JSON.parse(req.postData() || "{}");
      } catch {
        return {};
      }
    };

    if (p === "/data-provider-keys/active") return json(route, { "Google News": "google_news", "Bing News": "bing_news" });
    if (p === "/projects" && method === "GET") return json(route, session ? [project] : []);
    if (p === "/projects" && method === "POST") {
      Object.assign(project, body());
      return json(route, project);
    }
    if (p === `/projects/${project.id}` && method === "GET") return json(route, project);
    if (p === `/projects/${project.id}` && method === "PUT") {
      Object.assign(project, body());
      return json(route, project);
    }
    if (p === `/projects/${project.id}/add_sections_prompt`) return json(route, { ok: true });
    if (p === `/projects/${project.id}/sessions`) return json(route, session ? [session] : []);
    if (p === `/projects/${project.id}/generated-queries`) return json(route, []);
    if (p === "/session" && method === "POST") {
      savedWorkflow = body().workflow || null;
      session = {
        id: 501,
        project_id: project.id,
        status: "draft",
        session_type: "api",
        workflow: savedWorkflow,
        created_at: new Date().toISOString(),
      };
      return json(route, { session_id: 501, id: 501 });
    }
    if (p === "/sessions/501" && method === "GET") return json(route, session || {}, session ? 200 : 404);
    if (p === "/sessions/501/workflow" && method === "PUT") {
      savedWorkflow = body().workflow || savedWorkflow;
      if (session) session.workflow = savedWorkflow;
      return json(route, { ok: true });
    }
    if (p.startsWith("/sessions/501/")) return json(route, []);
    if (method === "OPTIONS") return route.fulfill({ status: 204 });
    return json(route, {});
  });
}

/* ---------------- on-screen overlay (cursor, caption, drag ghost) ---------------- */

const OVERLAY_SCRIPT = `(() => {
  function mount() {
    if (document.getElementById('tut-cursor')) return;
    const style = document.createElement('style');
    style.textContent = \`
      #tut-cursor{position:fixed;left:-100px;top:-100px;width:22px;height:22px;border-radius:50%;
        background:rgba(99,91,255,.32);border:2.5px solid #635bff;transform:translate(-50%,-50%);
        box-shadow:0 0 0 4px rgba(99,91,255,.14),0 4px 14px rgba(0,0,0,.28);pointer-events:none;z-index:2147483647}
      #tut-cursor.grab{background:rgba(99,91,255,.75);transform:translate(-50%,-50%) scale(.85)}
      #tut-cursor.tut-click::after{content:'';position:absolute;inset:-6px;border-radius:50%;border:2px solid #635bff;
        animation:tutRipple .5s ease-out forwards}
      @keyframes tutRipple{from{transform:scale(.6);opacity:1}to{transform:scale(2.3);opacity:0}}
      #tut-caption{position:fixed;left:50%;bottom:28px;transform:translateX(-50%) translateY(12px);opacity:0;
        max-width:56vw;padding:11px 20px;border-radius:999px;background:rgba(17,17,27,.84);color:#fff;
        font:600 17px/1.35 -apple-system,Inter,system-ui,sans-serif;letter-spacing:.01em;
        backdrop-filter:blur(10px);box-shadow:0 10px 34px rgba(0,0,0,.35);pointer-events:none;z-index:2147483646;
        transition:opacity .35s ease,transform .35s ease;white-space:nowrap}
      #tut-caption.on{opacity:1;transform:translateX(-50%)}
      #tut-ghost{position:fixed;left:-500px;top:-500px;pointer-events:none;z-index:2147483645;opacity:0;padding:9px 16px;
        border-radius:10px;background:#fff;border:1px solid rgba(99,91,255,.45);box-shadow:0 12px 34px rgba(0,0,0,.22);
        font:600 15px -apple-system,Inter,system-ui,sans-serif;color:#1f2337;transform:rotate(-2deg)}
      #tut-ghost.on{opacity:.96}
    \`;
    document.head.appendChild(style);
    const cur = document.createElement('div'); cur.id = 'tut-cursor';
    const cap = document.createElement('div'); cap.id = 'tut-caption';
    const ghost = document.createElement('div'); ghost.id = 'tut-ghost';
    document.body.append(cur, cap, ghost);
    const ease = 'cubic-bezier(.4,0,.2,1)';
    window.__tut = {
      move(x, y, ms) {
        cur.style.transition = 'left ' + ms + 'ms ' + ease + ', top ' + ms + 'ms ' + ease;
        cur.style.left = x + 'px'; cur.style.top = y + 'px';
        ghost.style.transition = cur.style.transition;
        ghost.style.left = (x + 16) + 'px'; ghost.style.top = (y + 16) + 'px';
      },
      click() { cur.classList.remove('tut-click'); void cur.offsetWidth; cur.classList.add('tut-click'); },
      caption(t) { cap.textContent = t || ''; cap.classList.toggle('on', !!t); },
      ghost(t) { ghost.textContent = t || ''; ghost.classList.toggle('on', !!t); },
      grab(on) { cur.classList.toggle('grab', !!on); },
    };
  }
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
})();`;

/* ---------------- recorder ---------------- */

async function main() {
  console.log("▸ synthesizing narration with", VOICE);
  const clips = synthesize();
  const clipFor = (scene, i) => clips.find((c) => c.scene === scene && c.index === i);

  console.log("▸ launching browser");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: W, height: H },
    deviceScaleFactor: 1,
    recordVideo: { dir: path.join(WORK, "video"), size: { width: W, height: H } },
    colorScheme: "light",
  });
  await context.addInitScript(() => {
    try {
      localStorage.setItem("auth_token", "tutorial-token");
      localStorage.setItem("organization_id", "1");
      localStorage.setItem("theme", "light");
    } catch {}
  });
  await context.addInitScript(OVERLAY_SCRIPT);

  const page = await context.newPage();
  const t0 = Date.now();
  const now = () => Date.now() - t0;
  const timeline = [];
  let currentScene = null;

  await installApiStubs(page);
  // Keep any WebSocket the Review page opens in a quiet "connected" state.
  await page.routeWebSocket(() => true, () => {});

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  let cursor = { x: W / 2, y: H / 2 };

  async function moveTo(x, y, ms = 600) {
    await page.evaluate(([x, y, ms]) => window.__tut.move(x, y, ms), [x, y, ms]);
    const steps = Math.max(8, Math.round(ms / 25));
    const from = { ...cursor };
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const e = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      await page.mouse.move(from.x + (x - from.x) * e, from.y + (y - from.y) * e);
      await sleep(ms / steps);
    }
    cursor = { x, y };
  }
  async function center(locator) {
    await locator.first().waitFor({ state: "visible", timeout: 8000 });
    const box = await locator.first().boundingBox();
    if (!box) throw new Error("element has no bounding box");
    return { x: box.x + box.width / 2, y: box.y + box.height / 2, box };
  }
  async function hover(locator, ms = 600, dwell = 500) {
    const c = await center(locator);
    await moveTo(c.x, c.y, ms);
    await sleep(dwell);
  }
  async function click(locator, { ms = 600, after = 400, fx = 0.5, fy = 0.5 } = {}) {
    const c = await center(locator);
    const x = c.box.x + c.box.width * fx;
    const y = c.box.y + c.box.height * fy;
    await moveTo(x, y, ms);
    await page.evaluate(() => window.__tut.click());
    await page.mouse.down();
    await sleep(80);
    await page.mouse.up();
    await sleep(after);
  }
  async function typeInto(locator, text, delay = 34) {
    await click(locator, { after: 200 });
    await page.keyboard.type(text, { delay });
    await sleep(300);
  }
  async function addTags(fieldLabel, items) {
    for (const item of items) {
      const input = page.locator("label.wffld", { hasText: fieldLabel }).locator(".taginput__field");
      await click(input, { ms: 350, after: 150 });
      await page.keyboard.type(item, { delay: 42 });
      await sleep(180);
      await page.keyboard.press("Enter");
      await sleep(420);
    }
  }
  async function selectOption(fieldLabel, value) {
    const sel = page.locator(".wfpanel label.wffld", { hasText: fieldLabel }).locator("select");
    await click(sel, { after: 250 });
    await sel.selectOption(value);
    await sleep(500);
  }
  async function caption(text) {
    await page.evaluate((t) => window.__tut.caption(t), text);
  }
  async function shot(name) {
    await page.evaluate(() => window.__tut.caption(""));
    await sleep(380);
    await page.screenshot({ path: path.join(IMG_DIR, `${name}.png`) });
    const sc = currentScene;
    if (sc) await caption(sc.caption);
  }
  async function nodeCount() {
    return page.locator(".react-flow__node").count();
  }
  async function dropModule(type, label, target) {
    const before = await nodeCount();
    const item = page.locator(`.wfmod--${type}`);
    const c = await center(item);
    await moveTo(c.x, c.y, 550);
    await page.mouse.down();
    await page.evaluate((l) => { window.__tut.grab(true); window.__tut.ghost(l); }, label);
    await sleep(160);
    await moveTo(target.x, target.y, 950);
    await sleep(120);
    await page.mouse.up();
    await sleep(350);
    if ((await nodeCount()) === before) {
      // Native HTML5 drag did not reach React; replay the drop synthetically.
      await page.evaluate(([type, x, y]) => {
        const MIME = "application/x-iv-module";
        const src = document.querySelector(`.wfmod--${type}`);
        const canvas = document.querySelector(".wfcanvas");
        const dt = new DataTransfer();
        src.dispatchEvent(new DragEvent("dragstart", { bubbles: true, cancelable: true, dataTransfer: dt, clientX: x, clientY: y }));
        if (!dt.getData(MIME)) dt.setData(MIME, type);
        canvas.dispatchEvent(new DragEvent("dragover", { bubbles: true, cancelable: true, dataTransfer: dt, clientX: x, clientY: y }));
        canvas.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: dt, clientX: x, clientY: y }));
        src.dispatchEvent(new DragEvent("dragend", { bubbles: true, dataTransfer: dt }));
      }, [type, target.x, target.y]);
    }
    await page.evaluate(() => { window.__tut.grab(false); window.__tut.ghost(""); });
    await sleep(900); // let the fitView animation settle
  }
  async function connect(sourceNode, targetNode) {
    const s = await center(sourceNode.locator(".react-flow__handle.source"));
    const t = await center(targetNode.locator(".react-flow__handle.target"));
    await moveTo(s.x, s.y, 550);
    await page.mouse.down();
    await page.evaluate(() => window.__tut.grab(true));
    await sleep(150);
    await moveTo(t.x, t.y, 1000);
    await sleep(200);
    await page.mouse.up();
    await page.evaluate(() => window.__tut.grab(false));
    await sleep(450);
  }
  async function autoFormat() {
    await click(page.locator('[aria-label="Auto format layout"]'), { after: 900 });
  }
  async function canvasPoint(fx, fy) {
    const c = await center(page.locator(".wfcanvas"));
    return { x: c.box.x + c.box.width * fx, y: c.box.y + c.box.height * fy };
  }

  const dataNode = page.locator(".react-flow__node", { has: page.locator(".wfnode--data") });
  const saveBtn = page.locator(".wfbtn--flowing-save");
  const runBtn = page.locator(".wfbtn--flowing-run");
  const panelField = (label) => page.locator(".wfpanel label.wffld", { hasText: label });

  /* ---- actions keyed from narration.mjs ---- */
  const ACTIONS = {
    idle: async () => {},
    hoverPalette: async () => {
      await sleep(1200);
      for (const t of ["data", "analysis", "review", "assembly", "output"]) await hover(page.locator(`.wfmod--${t}`), 320, 220);
    },
    hoverActions: async () => { await sleep(400); await hover(saveBtn, 550, 900); await hover(runBtn, 450, 600); },

    openDataNode: async () => {
      await sleep(1400);
      await click(dataNode.locator(".wfnode__head"), { after: 600 });
      await shot("04-data-panel");
    },
    clickRestApi: async () => {
      await hover(page.locator('.wfseg__btn:has-text("File Upload")'), 500, 1400);
      await click(page.locator('.wfseg__btn:has-text("REST API")'), { after: 500 });
    },
    typeQuery: async () => {
      await typeInto(panelField("Query").locator("textarea"), "'Marriott' OR 'Marriott Bonvoy'", 26);
      await page.keyboard.press("Tab");
    },
    typeBrand: async () => addTags("Brand Keyword", ["Marriott"]),
    typeMessageKeywords: async () => {
      await addTags("Message Keywords", ["Loyalty", "Sustainability", "Expansion"]);
      await shot("05-data-configured");
    },

    dropAnalysis: async () => { await sleep(600); await dropModule("analysis", "Analysis", await canvasPoint(0.6, 0.4)); },
    selectLens: async () => selectOption("Intelligence Lens", "media_measurement"),
    selectLlm: async () => selectOption("LLM Model", "openai"),
    typeCompetitors: async () => {
      await addTags("Competitor Keywords", ["Hilton", "Hyatt", "IHG"]);
      await shot("06-analysis-configured");
    },

    dropReview: async () => {
      await sleep(500);
      await dropModule("review", "Review", await canvasPoint(0.75, 0.5));
    },
    setThresholds: async () => {
      await sleep(300);
      await click(panelField("Flag threshold").locator("input[type=range]"), { fx: 0.4, after: 900 });
      await click(panelField("Auto-approve").locator("input[type=range]"), { fx: 0.8, after: 500 });
      await shot("08-review-configured");
    },

    dropAssembly: async () => {
      await sleep(300);
      await dropModule("assembly", "Assembly", await canvasPoint(0.8, 0.5));
    },
    typeClientName: async () => typeInto(panelField("Client Name").locator("input"), "Marriott"),
    selectLayoutAndChart: async () => {
      await selectOption("Dashboard Layout", "Classic");
      await click(page.locator('.wfpanel button:has-text("Dashboard Charts")'), { ms: 450, after: 450 });
      await click(page.locator('.wfpanel .wfcheck:has-text("Top Sources")'), { ms: 450, after: 400 });
      await shot("09-assembly-charts");
    },

    dropOutput: async () => {
      await sleep(400);
      await dropModule("output", "Output", await canvasPoint(0.85, 0.5));
    },
    typeProject: async () => {
      await typeInto(panelField("Project Name").locator("input"), "US Hotel Brand Competitive Media Analysis", 16);
      await typeInto(panelField("Project Description").locator("textarea"), "Competitive media analysis for Marriott against Hilton, Hyatt and IHG.", 12);
      await shot("10-output-configured");
    },

    deselectAndFormat: async () => {
      await click(page.locator(".react-flow__pane"), { fx: 0.5, fy: 0.9, ms: 450, after: 300 });
      await sleep(3200);
      await autoFormat();
      await shot("12-complete-workflow");
    },
    clickSave: async () => {
      await click(saveBtn, { after: 600 });
      await page.locator('button:has-text("Review")').first().waitFor({ timeout: 10000 }).catch(() => {});
      await sleep(400);
      await shot("13-workflow-saved");
    },

    clickRun: async () => {
      await sleep(900);
      await click(runBtn, { after: 1500 });
      await shot("14-run-tagging-agent");
    },
  };

  /* ---- go ---- */
  console.log("▸ recording");
  await page.goto(`${APP_URL}/new/workflow`, { waitUntil: "networkidle" });
  await page.locator(".wfnode--data").waitFor({ timeout: 20000 });
  await sleep(800);
  await moveTo(W * 0.55, H * 0.55, 400);
  await shot("01-workflow-screen");

  for (const scene of SCENES) {
    currentScene = scene;
    await caption(scene.caption);
    for (let i = 0; i < scene.steps.length; i++) {
      const step = scene.steps[i];
      const clip = clipFor(scene.id, i);
      const start = now();
      timeline.push({ scene: scene.id, index: i, key: step.key, startMs: start, file: clip.file, durationMs: clip.durationMs });
      const action = ACTIONS[step.key];
      if (!action) throw new Error(`No action for key ${step.key}`);
      try {
        await action();
      } catch (err) {
        console.warn(`  ! step ${scene.id}.${step.key} failed: ${err.message}`);
        timeline[timeline.length - 1].error = err.message;
      }
      const remaining = clip.durationMs + GAP_MS - (now() - start);
      if (remaining > 0) await sleep(remaining);
      console.log(`  ✓ ${scene.id}.${step.key} @${(start / 1000).toFixed(1)}s`);
    }
  }
  await caption("");
  await sleep(1200);
  const totalMs = now();

  const videoPath = await page.video().path();
  await context.close();
  await browser.close();
  fs.writeFileSync(path.join(WORK, "timeline.json"), JSON.stringify({ totalMs, timeline }, null, 2));

  /* ---- mux narration onto the recording ---- */
  console.log("▸ muxing audio + video");
  const args = ["-y", "-hide_banner", "-loglevel", "error", "-i", videoPath];
  const filters = [];
  const labels = [];
  timeline.forEach((t, i) => {
    args.push("-i", t.file);
    filters.push(`[${i + 1}:a]adelay=${t.startMs}|${t.startMs}[a${i}]`);
    labels.push(`[a${i}]`);
  });
  filters.push(`${labels.join("")}amix=inputs=${labels.length}:normalize=0:dropout_transition=0,${VOICE_FILTER},apad[mix]`);
  const outFile = VIDEO_FILE;
  args.push(
    "-filter_complex", filters.join(";"),
    "-map", "0:v:0", "-map", "[mix]",
    "-c:v", "libx264", "-preset", "slow", "-crf", "26", "-pix_fmt", "yuv420p", "-r", "25",
    "-c:a", "aac", "-b:a", "160k", "-ar", "44100", "-ac", "2",
    "-shortest", "-movflags", "+faststart",
    outFile,
  );
  const r = spawnSync(FFMPEG, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) {
    console.error(r.stderr);
    throw new Error("ffmpeg mux failed");
  }
  // Poster frame for the in-app video popup: the finished graph.
  const posterSrc = path.join(IMG_DIR, "12-complete-workflow.png");
  if (fs.existsSync(posterSrc)) {
    spawnSync(FFMPEG, ["-y", "-hide_banner", "-loglevel", "error", "-i", posterSrc, "-vf", "scale=1280:-1", "-q:v", "4", POSTER_FILE]);
  }
  console.log(`▸ done → ${outFile}  (${(totalMs / 1000).toFixed(0)}s, ${timeline.filter((t) => t.error).length} step errors)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
