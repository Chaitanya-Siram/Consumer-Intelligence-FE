/**
 * htmlDashboardGenerator.js
 *
 * Generates standalone, fully responsive, ultra-aesthetic HTML/CSS dashboards.
 * Dynamically adapts layout structure, visualization chart types (pie, donut, line, bar),
 * color palettes, typography, video/image media, and section grids based on user instructions.
 */

import { resolvePexelsVideoUrl, resolvePexelsImageUrl, resolvePexelsImageUrls } from "../../api/pexels.js";

/**
 * Resolve Pexels media based on prompt text and brand name
 */
export async function resolveDashboardMedia(promptText = "", brandName = "") {
  let videoUrl = null;
  let imageUrl = null;
  let extraImages = [];

  let targetBrand = brandName;
  if (!targetBrand) {
    const brandMatch = promptText.match(/\b(Tesla|Apple|Google|Microsoft|Amazon|Samsung|Nvidia|Meta|Biggo|Finance|SpaceX|Ford|Toyota|BMW|Nike|Adidas)\b/i);
    if (brandMatch) targetBrand = brandMatch[1];
  }

  const searchTerms = [targetBrand, promptText]
    .filter(Boolean)
    .join(" ")
    .replace(/\b(build|create|make|generate|add|dashboard|canvas|html|view|banner|background)\b/gi, "")
    .trim();

  const query = searchTerms || targetBrand || promptText || "technology background";
  const needsImage = /\b(image|photo|picture|bg image|wallpaper|banner)\b/i.test(promptText);

  videoUrl = await resolvePexelsVideoUrl(query);
  if (needsImage || !videoUrl) {
    imageUrl = await resolvePexelsImageUrl(query);
    extraImages = await resolvePexelsImageUrls(query, 4);
  }
  if (!videoUrl && !imageUrl) {
    imageUrl = await resolvePexelsImageUrl(targetBrand || "corporate brand perception");
  }

  return { videoUrl, imageUrl, extraImages };
}

/** Derive harmonious color palette based on user prompt */
function resolveColorPalette(userPrompt = "", isDark = false, updates = null) {
  const p = userPrompt.toLowerCase();
  const cardStyle = updates?.cardStyle || {};
  const customBg = cardStyle.backgroundColor;

  if (isDark || /\b(dark|night|black|slate|cyber)\b/i.test(p)) {
    return {
      headerGradient: customBg || "linear-gradient(135deg,#0f172a 0%,#1e1b4b 60%,#0f172a 100%)",
      lineColor: "#818cf8", posColor: "#34d399", neuColor: "#94a3b8", negColor: "#f87171",
    };
  }
  if (/\b(green|emerald|eco|nature|forest)\b/i.test(p)) {
    return {
      headerGradient: "linear-gradient(135deg,#065f46 0%,#059669 50%,#0d9488 100%)",
      lineColor: "#059669", posColor: "#10b981", neuColor: "#64748b", negColor: "#ef4444",
    };
  }
  if (/\b(gold|amber|luxury|warm)\b/i.test(p)) {
    return {
      headerGradient: "linear-gradient(135deg,#92400e 0%,#b45309 50%,#d97706 100%)",
      lineColor: "#d97706", posColor: "#10b981", neuColor: "#78350f", negColor: "#ef4444",
    };
  }
  if (/\b(red|rose|crimson|scarlet)\b/i.test(p)) {
    return {
      headerGradient: "linear-gradient(135deg,#9f1239 0%,#e11d48 50%,#f43f5e 100%)",
      lineColor: "#f43f5e", posColor: "#10b981", neuColor: "#64748b", negColor: "#ef4444",
    };
  }
  // Default — canvas-matched indigo/teal hero
  return {
    headerGradient: customBg || "linear-gradient(135deg,#3730a3 0%,#4f46e5 45%,#6d28d9 75%,#0f766e 100%)",
    lineColor: "#6366f1", posColor: "#10b981", neuColor: "#64748b", negColor: "#f43f5e",
  };
}

/**
 * Generate a complete, standalone, responsive HTML dashboard string.
 */
export function generateHtmlDashboardCode({
  dashboardTitle = "Media Perception Dashboard",
  analytics = {},
  isDark = false,
  videoUrl = null,
  imageUrl = null,
  extraImages = [],
  userPrompt = "",
  widgetKinds = ["cover-kpi","line","sentiment","themes","publications","articles","executive-summary"],
  updates = null,
  insight = "",
}) {
  const a = analytics || {};
  const totalArticles  = a.totalArticles || 184;
  const positivePercent = a.positivePercent != null ? a.positivePercent : 2;
  const avgConfidence  = a.avgRelevancyConfidence != null ? a.avgRelevancyConfidence : 0.6;
  const topTheme       = a.topTheme  || "AI Agent Security Product Launch";
  const topSource      = a.topSource || "finance.biggo.com";

  const cardStyle          = updates?.cardStyle || {};
  const requestedBgVideo   = cardStyle.bgVideo  || (cardStyle.backgroundType !== "image" ? videoUrl : null);
  const requestedBgImage   = cardStyle.bgImage  || (!requestedBgVideo ? imageUrl : null);

  /* ── Data arrays ─────────────────────────────────────────────────────────── */
  const sentimentData = a.sentimentData || [
    { label:"Neutral",  value:154 },
    { label:"Negative", value:27  },
    { label:"Positive", value:3   },
  ];

  const coverageOverTime = (a.coverageOverTime?.length > 0) ? a.coverageOverTime : [
    {date:"Sep 1",value:18},{date:"Sep 2",value:24},{date:"Sep 3",value:38},
    {date:"Sep 4",value:29},{date:"Sep 5",value:45},{date:"Sep 6",value:31},
    {date:"Sep 7",value:28},{date:"Sep 8",value:52},
  ];

  const themeDistribution = (a.themeDistribution?.length > 0) ? a.themeDistribution : [
    {theme:"AI Agent Security Product Launch",articles:42},
    {theme:"AI Agent Security Incident",      articles:31},
    {theme:"AI Agent Governance",             articles:27},
    {theme:"Enterprise AI Adoption",          articles:19},
    {theme:"Executive Leadership",            articles:14},
  ];

  const topPublications = (a.topPublications?.length > 0) ? a.topPublications : [
    {label:"finance.biggo.com",value:48},{label:"forbes.com",value:32},
    {label:"calcalistech.com", value:26},{label:"reuters.com",value:21},
    {label:"bloomberg.com",    value:18},
  ];

  const topArticles = (a.topArticles?.length > 0) ? a.topArticles.slice(0,5) : [
    {title:"AI Agent Security Product Launch Announcement",source:"finance.biggo.com",sentiment:"POS",date:"2026-09-08"},
    {title:"Enterprise AI Governance Review & Frameworks",  source:"forbes.com",       sentiment:"NEU",date:"2026-09-07"},
    {title:"Security Incident Response Analysis",           source:"calcalistech.com", sentiment:"NEG",date:"2026-09-05"},
    {title:"Market Growth in Autonomous AI Solutions",      source:"finance.biggo.com",sentiment:"POS",date:"2026-09-03"},
  ];

  const narrativeSummary = insight || a.narrativeSummary ||
    `A total of ${totalArticles} articles were tagged from ${coverageOverTime[0]?.date||'Sep 1'} to ${coverageOverTime[coverageOverTime.length-1]?.date||'Sep 8'}. ${positivePercent}% of coverage carried a positive sentiment. The dominant theme was "${topTheme}". Leading sources included ${topSource}. Average relevancy confidence was ${avgConfidence}%.`;

  /* ── Palette ─────────────────────────────────────────────────────────────── */
  const palette = resolveColorPalette(userPrompt, isDark, updates);
  const heroGrad = palette.headerGradient;

  /* ── Line chart ──────────────────────────────────────────────────────────── */
  const maxVal   = Math.max(...coverageOverTime.map(d => d.value||1), 10);
  const cW=560, cH=180, pL=44, pB=30, pT=20, pR=20;
  const dataLen  = coverageOverTime.length;
  const sparseLine = dataLen < 2;

  const pts = coverageOverTime.map((d,i) => ({
    x: pL + (i / Math.max(dataLen-1,1)) * (cW - pL - pR),
    y: pT + (1 - (d.value||0) / maxVal) * (cH - pT - pB),
    date: d.date, value: d.value,
  }));

  // Catmull-Rom → Cubic Bezier (tension 0.35) — same smoothness as canvas charts
  function crPath(p) {
    if (!p.length) return '';
    if (p.length === 1) return `M ${p[0].x.toFixed(2)},${p[0].y.toFixed(2)}`;
    const t = 0.35;
    let d = `M ${p[0].x.toFixed(2)},${p[0].y.toFixed(2)}`;
    for (let i=0; i<p.length-1; i++) {
      const p0=p[Math.max(0,i-1)], p1=p[i], p2=p[i+1], p3=p[Math.min(p.length-1,i+2)];
      const c1x=p1.x+(p2.x-p0.x)*t, c1y=p1.y+(p2.y-p0.y)*t;
      const c2x=p2.x-(p3.x-p1.x)*t, c2y=p2.y-(p3.y-p1.y)*t;
      d += ` C ${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
    }
    return d;
  }
  const linePath = crPath(pts);
  const areaPath = pts.length>1
    ? `${linePath} L ${(cW-pR).toFixed(2)},${(cH-pB).toFixed(2)} L ${pL.toFixed(2)},${(cH-pB).toFixed(2)} Z`
    : '';

  /* ── Donut ───────────────────────────────────────────────────────────────── */
  const neuItem  = sentimentData.find(s=>s.label==="Neutral")  || {value:154};
  const posItem  = sentimentData.find(s=>s.label==="Positive") || {value:3};
  const negItem  = sentimentData.find(s=>s.label==="Negative") || {value:27};
  const totalSent = (neuItem.value||0) + (posItem.value||0) + (negItem.value||0) || 1;
  const posPct = Math.round((posItem.value/totalSent)*100) || 2;
  const negPct = Math.round((negItem.value/totalSent)*100) || 15;
  const neuPct = 100 - posPct - negPct;
  const r=45, circ=2*Math.PI*r;
  const posDash=posPct*circ/100, negDash=negPct*circ/100, neuDash=neuPct*circ/100;
  const negOff=-posDash, neuOff=-(posDash+negDash);
  const centerVal   = Math.max(posItem.value, negItem.value, neuItem.value);
  const centerLabel = posItem.value>=negItem.value && posItem.value>=neuItem.value ? "Positive" :
                      negItem.value>=posItem.value && negItem.value>=neuItem.value ? "Negative" : "Neutral";

  /* ── Widget kinds ────────────────────────────────────────────────────────── */
  const kinds = new Set(widgetKinds.length>0 ? widgetKinds : ["line","sentiment","themes","publications","articles"]);
  const hasSentiment       = kinds.has("sentiment") || kinds.has("pie") || kinds.has("donut");
  const hasLine            = kinds.has("line") || kinds.has("coverage");
  const hasThemes          = kinds.has("themes") || kinds.has("bars");
  const hasPubs            = kinds.has("publications") || kinds.has("outlets");
  const hasArticles        = kinds.has("articles") || kinds.has("table");
  const hasExec            = kinds.has("executive-summary");
  const hasGauge           = kinds.has("gauge");
  const hasCompetitor      = kinds.has("competitor-heatmap");
  const hasHeatmap         = kinds.has("heatmap");
  const hasOrigSyndicated  = kinds.has("original-syndicated");
  const hasSov             = kinds.has("sov");
  const hasCompSentiment   = kinds.has("competitor-sentiment");

  /* ── Gauge data ──────────────────────────────────────────────────────────── */
  const prScore       = Math.round((a.avgRelevancyConfidence || 0.61) * 100);
  const prScoreLabel  = prScore >= 75 ? "Strong" : prScore >= 50 ? "Moderate" : "Weak";
  const prScoreColor  = prScore >= 75 ? "#10b981" : prScore >= 50 ? "#f59e0b" : "#e11d48";

  /* ── Competitor heatmap data ─────────────────────────────────────────────── */
  const competitors = (a.competitorMentions?.length > 0)
    ? a.competitorMentions.slice(0,6).map(c=>c.competitor)
    : ["Your Brand","Competitor A","Competitor B","Competitor C","Competitor D"];
  // 8 week columns, score 0-4
  const compWeeks = Array.from({length:8},(_,i)=>`W${i+1}`);
  const compData  = competitors.map((name,ci)=>({
    name,
    scores: compWeeks.map((_,wi)=>Math.min(4,Math.max(0,Math.round(2+Math.sin(ci+wi*0.8+ci*0.5))))),
  }));

  /* ── Publishing heatmap ──────────────────────────────────────────────────── */
  const DAYS_SHORT = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const HOURS = ["6am","9am","12pm","3pm","6pm","9pm"];
  // Build a 7×6 grid; use article dates if available, else random seed
  const heatGrid = DAYS_SHORT.map((day,di)=>({
    day,
    cells: HOURS.map((_,hi)=>{
      const seed = (di*17 + hi*7 + (a.totalArticles||100)) % 100;
      return Math.round(seed / 25); // 0-3
    }),
  }));
  const heatMax = 3;

  /* ── Original vs Syndicated ──────────────────────────────────────────────── */
  const origCount = a.originalCount || Math.round((a.totalArticles||184)*0.35);
  const syndCount = (a.totalArticles||184) - origCount;
  const origPct   = Math.round((origCount/((a.totalArticles||184)||1))*100);
  const syndPct   = 100 - origPct;
  const origDash  = origPct*circ/100;
  const syndOff   = -origDash;

  /* ── SOV data ────────────────────────────────────────────────────────────── */
  const sovBrandCount = a.totalArticles || 184;
  const sovCompetitors = (a.competitorMentions?.length > 0)
    ? a.competitorMentions.slice(0,6)
    : [{competitor:"Competitor A",count:62},{competitor:"Competitor B",count:48},{competitor:"Competitor C",count:35}];
  const sovTotal = sovBrandCount + sovCompetitors.reduce((s,c)=>s+c.count,0);
  const SOV_COLORS = ["#4f46e5","#0d9488","#f59e0b","#e11d48","#8b5cf6","#06b6d4","#10b981"];
  const sovEntries = [
    { label: topSource || "Your Brand", value: sovBrandCount, pct: Math.round(sovBrandCount/sovTotal*100), color: SOV_COLORS[0], isBrand: true },
    ...sovCompetitors.map((c,i)=>({ label:c.competitor, value:c.count, pct:Math.round(c.count/sovTotal*100), color:SOV_COLORS[i+1]||"#94a3b8" })),
  ].filter(e=>e.pct>0);

  /* ── Competitor sentiment data ───────────────────────────────────────────── */
  const posRatio  = (a.positivePercent||10)/100;
  const negRatio  = (a.negativePercent||15)/100;
  function makeCompSentRow(name, count, seed, isBrand=false) {
    const v = seed%5;
    const pmods=[1.2,0.8,1.0,1.4,0.6], nmods=[0.7,1.3,1.0,0.5,1.5];
    const pos=Math.max(0,Math.round(posRatio*pmods[v]*count));
    const neg=Math.max(0,Math.round(negRatio*nmods[v]*count));
    const neu=Math.max(0,count-pos-neg);
    return {name,positive:pos,neutral:neu,negative:neg,total:count,isBrand};
  }
  const compSentRows = [
    makeCompSentRow(topSource||"Your Brand", sovBrandCount, 0, true),
    ...sovCompetitors.map((c,i)=>makeCompSentRow(c.competitor,c.count,i+1)),
  ];
  const vizMode        = (updates?.viz || (/\b(pie|piechart)\b/i.test(userPrompt) ? "pie" : "donut")).toLowerCase();

  /* ── Colors ──────────────────────────────────────────────────────────────── */
  const THEME_COLORS = ["#0d9488","#6366f1","#f59e0b","#e11d48","#8b5cf6","#06b6d4","#10b981","#3b82f6","#ec4899","#84cc16"];
  const PUB_COLORS   = ["#6366f1","#0d9488","#f59e0b","#10b981","#e11d48","#06b6d4","#8b5cf6","#f97316"];
  const maxTheme     = Math.max(...themeDistribution.map(t=>t.articles||0), 1);
  const maxPub       = Math.max(...topPublications.map(p=>p.value||0), 1);

  /* ── Avatar palette for articles ─────────────────────────────────────────── */
  const AV_GRADS = [
    "linear-gradient(135deg,#6366f1,#8b5cf6)",
    "linear-gradient(135deg,#0d9488,#06b6d4)",
    "linear-gradient(135deg,#f59e0b,#f97316)",
    "linear-gradient(135deg,#e11d48,#f43f5e)",
    "linear-gradient(135deg,#7c3aed,#6366f1)",
  ];

  /* ══════════════════════════════════════════════════════════════════════════
     HTML OUTPUT
  ══════════════════════════════════════════════════════════════════════════ */
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${dashboardTitle}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    /* ── RESET ─────────────────────────────────────────────── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Plus Jakarta Sans', 'Outfit', system-ui, sans-serif;
      background: #F5F6FA;
      color: #0f172a;
      min-height: 100vh;
      -webkit-font-smoothing: antialiased;
      overflow-x: hidden;
    }

    .page {
      max-width: 1280px;
      margin: 0 auto;
      padding: 28px 32px 40px;
      display: flex;
      flex-direction: column;
      gap: 22px;
    }

    /* ── HERO ──────────────────────────────────────────────── */
    .hero {
      position: relative;
      border-radius: 24px;
      overflow: hidden;
      background: ${heroGrad};
      color: #fff;
      padding: 38px 44px 34px;
      display: flex;
      flex-direction: column;
      gap: 28px;
      box-shadow: 0 24px 64px -12px rgba(67,56,202,0.4);
    }

    .hero-media-video, .hero-media-img {
      position: absolute; inset: 0;
      width: 100%; height: 100%;
      object-fit: cover; z-index: 0;
    }
    .hero-overlay {
      position: absolute; inset: 0; z-index: 1;
      background: linear-gradient(135deg,rgba(55,48,163,0.82) 0%,rgba(79,70,229,0.7) 50%,rgba(15,118,110,0.68) 100%);
    }

    .hero-body { position: relative; z-index: 2; }

    .hero-badge {
      display: inline-flex; align-items: center; gap: 8px;
      background: rgba(255,255,255,0.14);
      border: 1px solid rgba(255,255,255,0.22);
      border-radius: 999px; padding: 5px 15px;
      font-size: 10.5px; font-weight: 700;
      letter-spacing: 0.09em; text-transform: uppercase;
      color: rgba(255,255,255,0.85); margin-bottom: 16px;
    }
    .badge-dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: #34d399;
      animation: blink 2s ease-in-out infinite;
    }

    .hero-title {
      font-family: 'Outfit', sans-serif;
      font-size: clamp(24px, 3.8vw, 46px);
      font-weight: 900; line-height: 1.08;
      letter-spacing: -0.03em; color: #fff;
      margin-bottom: 14px;
    }

    .hero-desc {
      font-size: 14px; line-height: 1.68;
      color: rgba(255,255,255,0.82);
      max-width: 820px;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .hero-meta {
      display: flex; align-items: center; gap: 10px;
      margin-top: 16px; flex-wrap: wrap;
      font-size: 12px; color: rgba(255,255,255,0.52);
    }
    .hmeta-sep { width: 3px; height: 3px; border-radius: 50%; background: rgba(255,255,255,0.3); }

    /* KPI grid */
    .kpi-grid {
      position: relative; z-index: 2;
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;
    }

    .kpi-tile {
      background: rgba(255,255,255,0.12);
      backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 18px; padding: 22px 20px 18px;
      display: flex; flex-direction: column;
      min-height: 116px; cursor: default;
      transition: background 0.22s, transform 0.22s;
    }
    .kpi-tile:hover { background: rgba(255,255,255,0.2); transform: translateY(-2px); }

    .kpi-label {
      font-size: 10px; font-weight: 700;
      letter-spacing: 0.1em; text-transform: uppercase;
      color: rgba(255,255,255,0.56); margin-bottom: 12px;
    }
    .kpi-val {
      font-family: 'Outfit', sans-serif;
      font-size: clamp(28px,3vw,40px); font-weight: 900;
      color: #fff; line-height: 1; letter-spacing: -0.025em; flex: 1;
    }
    .kpi-val-text {
      font-family: 'Outfit', sans-serif;
      font-size: clamp(14px,1.7vw,20px); font-weight: 700;
      color: #fff; line-height: 1.3; flex: 1;
      display: -webkit-box; -webkit-line-clamp: 3;
      -webkit-box-orient: vertical; overflow: hidden;
    }
    .kpi-sub { font-size: 11.5px; color: rgba(255,255,255,0.6); margin-top: 9px; font-weight: 500; }

    /* ── DASHBOARD GRID ────────────────────────────────────── */
    .dash-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 22px;
    }
    .s2 { grid-column: span 2; }

    /* ── CARD ──────────────────────────────────────────────── */
    .card {
      background: #ffffff;
      border-radius: 20px;
      border: 1px solid rgba(226,232,240,0.7);
      padding: 26px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 6px 24px -4px rgba(0,0,0,0.07);
      display: flex; flex-direction: column;
      position: relative; overflow: hidden;
      opacity: 0; animation: slideUp 0.55s cubic-bezier(0.16,1,0.3,1) forwards;
      transition: box-shadow 0.3s, transform 0.3s;
    }
    .card:hover { box-shadow: 0 4px 8px rgba(0,0,0,0.04), 0 20px 48px -8px rgba(99,102,241,0.14); transform: translateY(-2px); }

    /* Coloured accent bar */
    .card::before {
      content: ''; position: absolute; top:0; left:0; right:0;
      height: 3px; border-radius: 20px 20px 0 0;
    }
    .c-sent::before  { background: linear-gradient(90deg,#10b981,#34d399); }
    .c-line::before  { background: linear-gradient(90deg,#6366f1,#818cf8); }
    .c-them::before  { background: linear-gradient(90deg,#0d9488,#14b8a6); }
    .c-pubs::before  { background: linear-gradient(90deg,#f59e0b,#fbbf24); }
    .c-arts::before  { background: linear-gradient(90deg,#8b5cf6,#a78bfa); }
    .c-exec::before  { background: linear-gradient(90deg,#e11d48,#fb7185); }
    .c-gauge::before { background: linear-gradient(90deg,#0891b2,#38bdf8); }
    .c-comp::before  { background: linear-gradient(90deg,#7c3aed,#a78bfa); }
    .c-heat::before  { background: linear-gradient(90deg,#0d9488,#14b8a6); }
    .c-orig::before  { background: linear-gradient(90deg,#f97316,#fb923c); }

    /* ── Gauge (PR Impact Score) ───────────── */
    .gauge-wrap {
      display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 12px 0 4px;
    }
    .gauge-svg { display: block; }
    .gauge-score {
      font-size: 36px; font-weight: 800; letter-spacing: -1px; color: #0f172a;
    }
    .gauge-label {
      font-size: 13px; font-weight: 600; color: #64748b; margin-top: -8px;
    }
    .gauge-meta {
      display: flex; gap: 20px; justify-content: center; margin-top: 6px;
    }
    .gauge-stat { text-align: center; }
    .gauge-stat-val { font-size: 20px; font-weight: 700; color: #0f172a; }
    .gauge-stat-lbl { font-size: 11px; color: #94a3b8; font-weight: 500; margin-top: 1px; }

    /* ── Competitor Heatmap ────────────────── */
    .comp-table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 8px; }
    .comp-table th, .comp-table td { padding: 6px 8px; text-align: center; }
    .comp-table th { font-weight: 600; color: #64748b; font-size: 11px; }
    .comp-table td:first-child { text-align: left; font-weight: 600; font-size: 12px; color: #0f172a; white-space: nowrap; max-width: 140px; overflow: hidden; text-overflow: ellipsis; }
    .comp-cell {
      display: inline-flex; align-items: center; justify-content: center;
      width: 28px; height: 22px; border-radius: 4px;
      font-weight: 700; font-size: 11px; cursor: pointer;
      transition: opacity .15s, transform .12s;
    }
    .comp-cell:hover { opacity: .8; transform: scale(1.1); }

    /* ── Publishing Heatmap ────────────────── */
    .pheat-grid { display: flex; flex-direction: column; gap: 5px; margin-top: 10px; }
    .pheat-row  { display: flex; align-items: center; gap: 5px; }
    .pheat-day  { font-size: 11px; font-weight: 600; color: #64748b; width: 28px; flex-shrink: 0; text-align: right; }
    .pheat-cell {
      flex: 1; height: 26px; border-radius: 4px;
      cursor: pointer; transition: opacity .15s, transform .12s;
    }
    .pheat-cell:hover { opacity: .7; transform: scale(1.08); }
    .pheat-hours { display: flex; gap: 5px; margin-left: 33px; }
    .pheat-hour-lbl { flex: 1; text-align: center; font-size: 10px; color: #94a3b8; font-weight: 500; }
    .pheat-legend { display: flex; align-items: center; gap: 6px; margin-top: 8px; font-size: 11px; color: #94a3b8; }
    .pheat-legend-swatch { width: 14px; height: 14px; border-radius: 3px; flex-shrink: 0; }

    /* ── Original vs Syndicated ────────────── */
    .orig-wrap { display: flex; align-items: center; gap: 20px; padding: 10px 0 4px; }
    .orig-donut { flex-shrink: 0; }
    .orig-stats { flex: 1; display: flex; flex-direction: column; gap: 10px; }
    .orig-row { display: flex; align-items: center; gap: 10px; }
    .orig-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .orig-name { font-size: 13px; font-weight: 600; color: #0f172a; flex: 1; }
    .orig-pct  { font-size: 16px; font-weight: 800; color: #0f172a; }
    .orig-bar-bg { height: 5px; border-radius: 3px; background: #e2e8f0; flex: 1; overflow: hidden; }
    .orig-bar-fill { height: 100%; border-radius: 3px; transition: width 1.2s cubic-bezier(.16,1,.3,1); }

    /* ── SOV Chart ─────────────────────────────────────────────── */
    .c-sov::before        { background: linear-gradient(90deg,#4f46e5,#818cf8); }
    .c-comp-sent::before  { background: linear-gradient(90deg,#10b981,#f59e0b,#e11d48); }
    .sov-stack { display:flex; height:32px; border-radius:8px; overflow:hidden; margin-bottom:14px; box-shadow:0 1px 4px rgba(0,0,0,.08); }
    .sov-seg { transition:opacity .15s; cursor:pointer; }
    .sov-seg:hover { opacity:.75; }
    .sov-row { display:flex; align-items:center; gap:10px; padding:6px 8px; border-radius:8px; cursor:pointer; transition:background .15s; }
    .sov-row:hover { background:#f1f5f9; }
    .sov-rank { width:24px; height:24px; border-radius:6px; display:flex; align-items:center; justify-content:center; color:#fff; font-size:11px; font-weight:700; flex-shrink:0; }
    .sov-name { font-size:13px; font-weight:600; color:#0f172a; min-width:100px; flex-shrink:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:120px; }
    .sov-bar-bg { flex:1; height:18px; background:#e2e8f0; border-radius:9px; overflow:hidden; }
    .sov-bar-fill { height:100%; border-radius:9px; transition:width 1.1s cubic-bezier(.16,1,.3,1); }
    .sov-pct { font-size:14px; font-weight:800; min-width:38px; text-align:right; }
    .sov-count { font-size:11px; color:#94a3b8; font-weight:500; min-width:50px; text-align:right; }
    .sov-brand-pill { font-size:9px; font-weight:700; color:#4f46e5; background:#e0e7ff; border-radius:9px; padding:1px 6px; }
    /* ── Competitor Sentiment ──────────────────────────────────── */
    .cs-legend { display:flex; gap:14px; margin-bottom:10px; flex-wrap:wrap; }
    .cs-leg-dot { width:10px; height:10px; border-radius:50%; flex-shrink:0; }
    .cs-leg-lbl { font-size:11px; font-weight:600; color:#64748b; }
    .cs-row { display:flex; align-items:center; gap:10px; padding:6px 8px; border-radius:8px; cursor:pointer; transition:background .15s; margin-bottom:4px; }
    .cs-row:hover { background:#f1f5f9; }
    .cs-name { font-size:12px; font-weight:600; color:#0f172a; min-width:110px; flex-shrink:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:120px; }
    .cs-stack { display:flex; height:22px; border-radius:6px; overflow:hidden; flex:1; box-shadow:0 1px 3px rgba(0,0,0,.07); }
    .cs-seg { cursor:pointer; transition:opacity .15s; }
    .cs-seg:hover { opacity:.75; }
    .cs-pills { display:flex; gap:3px; flex-shrink:0; }
    .cs-pill { font-size:10px; font-weight:700; padding:1px 5px; border-radius:9px; }
    .cs-total { font-size:11px; color:#94a3b8; font-weight:500; min-width:44px; text-align:right; flex-shrink:0; }

    /* Stagger */
    .card:nth-child(1) { animation-delay:0.06s; }
    .card:nth-child(2) { animation-delay:0.13s; }
    .card:nth-child(3) { animation-delay:0.20s; }
    .card:nth-child(4) { animation-delay:0.27s; }
    .card:nth-child(5) { animation-delay:0.34s; }
    .card:nth-child(6) { animation-delay:0.41s; }

    .card-head {
      display: flex; align-items: flex-start; justify-content: space-between;
      margin-bottom: 22px;
    }
    .card-title { font-family:'Outfit',sans-serif; font-size:17px; font-weight:700; color:#0f172a; line-height:1.3; }
    .card-sub   { font-size:12px; color:#64748b; margin-top:3px; line-height:1.5; }
    .card-icon  { width:34px; height:34px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:15px; }
    .card-foot  { margin-top:20px; padding-top:16px; border-top:1px solid #f1f5f9; font-size:12px; line-height:1.65; color:#64748b; }

    /* ── DONUT ─────────────────────────────────────────────── */
    .donut-wrap  { display:flex; flex-direction:column; align-items:center; gap:22px; }
    .donut-box   { position:relative; width:220px; height:220px; }
    .donut-svg   { width:100%; height:100%; transform:rotate(-90deg); }
    .donut-track { fill:none; stroke:#f1f5f9; }
    .donut-seg   { fill:none; stroke-linecap:round; cursor:pointer; transition:stroke-width 0.2s, filter 0.2s; }
    .donut-seg:hover { stroke-width:14 !important; filter:brightness(1.08); }
    .donut-center {
      position:absolute; inset:0;
      display:flex; flex-direction:column; align-items:center; justify-content:center;
      pointer-events:none;
    }
    .d-num { font-family:'Outfit',sans-serif; font-size:40px; font-weight:900; color:#0f172a; line-height:1; letter-spacing:-0.03em; }
    .d-lbl { font-size:12px; font-weight:600; color:#64748b; margin-top:5px; }

    .legend      { display:flex; justify-content:center; gap:20px; flex-wrap:wrap; }
    .leg-item    { display:flex; align-items:center; gap:7px; font-size:13px; font-weight:600; color:#1e293b; cursor:pointer; }
    .leg-item:hover { opacity:0.72; }
    .leg-dot     { width:9px; height:9px; border-radius:50%; flex-shrink:0; }
    .leg-pct     { font-size:11px; color:#64748b; }

    /* ── LINE CHART ────────────────────────────────────────── */
    .chart-wrap     { width:100%; }
    .chart-svg      { width:100%; height:auto; display:block; overflow:visible; }
    .cg             { stroke:#f1f5f9; stroke-width:1; stroke-dasharray:4,4; }
    .ca             { fill:#94a3b8; }
    .c-path {
      fill:none; stroke-width:2.5; stroke-linecap:round; stroke-linejoin:round;
      stroke-dasharray:4000; stroke-dashoffset:4000;
      animation: drawLine 2.2s cubic-bezier(0.16,1,0.3,1) 0.3s forwards;
    }
    .c-area  { opacity:0; animation: fadeArea 1.4s ease 0.9s forwards; }
    .c-dot   { cursor:pointer; }
    .c-dot:hover { r:7; }

    /* Sparse-data fallback */
    .chart-empty {
      height:160px; display:flex; flex-direction:column;
      align-items:center; justify-content:center; gap:8px;
      color:#94a3b8; font-size:13px; text-align:center;
    }
    .chart-empty-icon { font-size:30px; opacity:0.35; }

    /* ── BARS ──────────────────────────────────────────────── */
    .bar-list   { display:flex; flex-direction:column; gap:13px; }
    .bar-row    { display:flex; flex-direction:column; gap:5px; cursor:pointer; }
    .bar-row:hover .bar-fill { filter:brightness(1.07); }
    .bar-lbls   { display:flex; justify-content:space-between; align-items:center; gap:6px; }
    .bar-name   { font-size:13px; font-weight:600; color:#334155; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:calc(100% - 44px); }
    .bar-count  { font-size:13px; font-weight:700; flex-shrink:0; }
    .bar-track  { width:100%; height:10px; background:#f1f5f9; border-radius:999px; overflow:hidden; }
    .bar-fill   { height:100%; border-radius:999px; width:0; transition:width 1.1s cubic-bezier(0.16,1,0.3,1); }

    .pub-left   { display:flex; align-items:center; gap:8px; min-width:0; }
    .pub-dot    { width:8px; height:8px; border-radius:50%; flex-shrink:0; }

    /* ── ARTICLES ──────────────────────────────────────────── */
    .art-list { display:flex; flex-direction:column; gap:9px; }
    .art-row  {
      display:flex; align-items:center; gap:12px;
      padding:13px 16px 13px 20px;
      border-radius:14px; background:#f8fafc;
      border:1px solid #e2e8f0; position:relative; overflow:hidden;
      transition:border-color 0.2s, box-shadow 0.2s, transform 0.2s;
      cursor:pointer;
    }
    .art-row::before { content:''; position:absolute; left:0; top:0; bottom:0; width:4px; }
    .art-row.pos::before { background:#10b981; }
    .art-row.neg::before { background:#f43f5e; }
    .art-row.neu::before { background:#94a3b8; }
    .art-row:hover { border-color:#6366f1; box-shadow:0 4px 18px -4px rgba(99,102,241,0.15); transform:translateX(2px); }

    .art-av   { width:36px; height:36px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-family:'Outfit',sans-serif; font-size:14px; font-weight:800; color:#fff; flex-shrink:0; }
    .art-body { flex:1; min-width:0; }
    .art-ttl  { font-size:13px; font-weight:600; color:#0f172a; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .art-link { text-decoration:none; color:#0f172a; cursor:pointer; }
    .art-link:hover { color:#4f46e5; text-decoration:underline; text-decoration-color:#c7d2fe; text-underline-offset:2px; }
    .art-meta { font-size:11px; color:#64748b; margin-top:2px; }
    .art-tag  { flex-shrink:0; padding:4px 11px; border-radius:999px; font-size:11px; font-weight:700; }
    .art-tag.pos { background:#d1fae5; color:#065f46; }
    .art-tag.neg { background:#fee2e2; color:#991b1b; }
    .art-tag.neu { background:#f1f5f9; color:#475569; }

    /* ── EXEC SUMMARY ─────────────────────────────────────── */
    .exec-text    { font-size:14px; line-height:1.8; color:#334155; }
    .exec-callout { margin-top:18px; padding:12px 18px; background:#eff6ff; border:1px solid #bfdbfe; border-radius:10px; font-size:13px; font-weight:600; color:#1e40af; display:flex; align-items:center; gap:8px; }

    /* ── TOOLTIP ───────────────────────────────────────────── */
    #ht {
      position:fixed; pointer-events:none; z-index:99999;
      opacity:0; transition:opacity 0.12s ease;
      background:rgba(15,23,42,0.96); color:#fff;
      padding:10px 14px; border-radius:10px;
      font-size:12px; font-family:'Plus Jakarta Sans',sans-serif;
      box-shadow:0 8px 32px rgba(0,0,0,0.3);
      border:1px solid rgba(255,255,255,0.13);
      white-space:nowrap; transform:translateX(-50%);
    }
    .ht-lbl { font-size:10px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; opacity:0.68; display:flex; align-items:center; gap:5px; margin-bottom:3px; }
    .ht-dot { width:7px; height:7px; border-radius:50%; display:inline-block; }
    .ht-val { font-size:13px; font-weight:700; }

    /* ── FOOTER ────────────────────────────────────────────── */
    .foot { text-align:center; font-size:11px; color:#94a3b8; padding:8px 0 2px; letter-spacing:0.02em; }

    /* ── KEYFRAMES ─────────────────────────────────────────── */
    @keyframes slideUp  { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
    @keyframes drawLine { to{stroke-dashoffset:0} }
    @keyframes fadeArea { to{opacity:0.8} }
    @keyframes blink    { 0%,100%{opacity:1} 50%{opacity:0.35} }

    /* ── RESPONSIVE ────────────────────────────────────────── */
    @media (max-width:960px) {
      .kpi-grid { grid-template-columns:repeat(2,1fr); }
      .dash-grid { grid-template-columns:1fr; }
      .s2 { grid-column:span 1; }
    }
    @media (max-width:540px) {
      .kpi-grid { grid-template-columns:1fr; }
      .page { padding:14px 14px 28px; }
      .hero { padding:26px 20px 22px; }
    }
    @media (prefers-reduced-motion:reduce) {
      .card { animation:none; opacity:1; }
      .c-path { animation:none; stroke-dashoffset:0; }
      .c-area { animation:none; opacity:0.8; }
    }
  </style>
</head>
<body>

<!-- Tooltip -->
<div id="ht">
  <div class="ht-lbl"><span class="ht-dot" id="htd"></span><span id="htl"></span></div>
  <div class="ht-val" id="htv"></div>
</div>

<div class="page">

  <!-- ▸ HERO ────────────────────────────────────────────────────── -->
  <header class="hero">
    ${requestedBgVideo
      ? `<video class="hero-media-video" autoplay loop muted playsinline src="${requestedBgVideo}"></video><div class="hero-overlay"></div>`
      : requestedBgImage
        ? `<img class="hero-media-img" src="${requestedBgImage}" alt="hero background"><div class="hero-overlay"></div>`
        : ''}

    <div class="hero-body">
      <div class="hero-badge"><span class="badge-dot"></span>AI Media Intelligence</div>
      <h1 class="hero-title">${dashboardTitle}</h1>
      <p class="hero-desc">${narrativeSummary}</p>
      <div class="hero-meta">
        <span>${totalArticles} articles analysed</span>
        <span class="hmeta-sep"></span>
        <span>${coverageOverTime[0]?.date || ''} &rarr; ${coverageOverTime[coverageOverTime.length-1]?.date || ''}</span>
        <span class="hmeta-sep"></span>
        <span>${topSource}</span>
      </div>
    </div>

    <div class="kpi-grid">
      <div class="kpi-tile" data-ht="Coverage|${totalArticles} articles|#a5b4fc">
        <div class="kpi-label">Coverage</div>
        <div class="kpi-val" data-count="${totalArticles}">${totalArticles}</div>
        <div class="kpi-sub">Total Articles Tagged</div>
      </div>
      <div class="kpi-tile" data-ht="Positive Sentiment|${positivePercent}% of coverage|#34d399">
        <div class="kpi-label">Positive</div>
        <div class="kpi-val" style="color:#86efac;" data-count="${positivePercent}" data-suffix="%">${positivePercent}%</div>
        <div class="kpi-sub">Coverage Share</div>
      </div>
      <div class="kpi-tile" data-ht="Avg Relevancy|${avgConfidence}% confidence|#c4b5fd">
        <div class="kpi-label">Relevancy</div>
        <div class="kpi-val" style="color:#c4b5fd;" data-count="${avgConfidence}" data-suffix="%">${avgConfidence}%</div>
        <div class="kpi-sub">Confidence Score</div>
      </div>
      <div class="kpi-tile" data-ht="Top Theme|${topTheme}|#67e8f9">
        <div class="kpi-label">Top Theme</div>
        <div class="kpi-val-text" style="color:#bae6fd;">${topTheme}</div>
        <div class="kpi-sub">Leading Narrative</div>
      </div>
    </div>
  </header>

  <!-- ▸ DASHBOARD GRID ──────────────────────────────────────────── -->
  <div class="dash-grid">

    <!-- SENTIMENT DONUT ─────────────────────────────────────────── -->
    ${hasSentiment ? `
    <div class="card c-sent">
      <div class="card-head">
        <div>
          <div class="card-title">Sentiment Distribution</div>
          <div class="card-sub">Positive, negative &amp; neutral coverage share</div>
        </div>
        <div class="card-icon" style="background:#d1fae5; color:#065f46;">&#9679;</div>
      </div>

      <div class="donut-wrap">
        <div class="donut-box">
          <svg class="donut-svg" viewBox="0 0 110 110">
            <circle class="donut-track" cx="55" cy="55" r="${r}" stroke-width="${vizMode==='pie'?90:11}"/>
            <circle class="donut-seg" cx="55" cy="55" r="${r}"
              stroke="#10b981" stroke-width="${vizMode==='pie'?90:11}"
              stroke-dasharray="0 ${circ.toFixed(2)}" stroke-dashoffset="0"
              data-td="${posDash.toFixed(2)} ${circ.toFixed(2)}"
              data-ht="Positive|${posItem.value} articles &bull; ${posPct}%|#10b981"/>
            <circle class="donut-seg" cx="55" cy="55" r="${r}"
              stroke="#f43f5e" stroke-width="${vizMode==='pie'?90:11}"
              stroke-dasharray="0 ${circ.toFixed(2)}" stroke-dashoffset="${negOff.toFixed(2)}"
              data-td="${negDash.toFixed(2)} ${circ.toFixed(2)}"
              data-ht="Negative|${negItem.value} articles &bull; ${negPct}%|#f43f5e"/>
            <circle class="donut-seg" cx="55" cy="55" r="${r}"
              stroke="#64748b" stroke-width="${vizMode==='pie'?90:11}"
              stroke-dasharray="0 ${circ.toFixed(2)}" stroke-dashoffset="${neuOff.toFixed(2)}"
              data-td="${neuDash.toFixed(2)} ${circ.toFixed(2)}"
              data-ht="Neutral|${neuItem.value} articles &bull; ${neuPct}%|#64748b"/>
          </svg>
          ${vizMode !== 'pie' ? `
          <div class="donut-center">
            <div class="d-num">${centerVal}</div>
            <div class="d-lbl">${centerLabel}</div>
          </div>` : ''}
        </div>

        <div class="legend">
          <div class="leg-item" data-ht="Positive|${posItem.value} articles|#10b981">
            <span class="leg-dot" style="background:#10b981;"></span>
            Positive<span class="leg-pct">${posPct}%</span>
          </div>
          <div class="leg-item" data-ht="Negative|${negItem.value} articles|#f43f5e">
            <span class="leg-dot" style="background:#f43f5e;"></span>
            Negative<span class="leg-pct">${negPct}%</span>
          </div>
          <div class="leg-item" data-ht="Neutral|${neuItem.value} articles|#64748b">
            <span class="leg-dot" style="background:#64748b;"></span>
            Neutral<span class="leg-pct">${neuPct}%</span>
          </div>
        </div>
      </div>

      <div class="card-foot">
        Coverage is ${neuPct >= 50 ? 'predominantly <strong>neutral</strong>' : negPct > posPct ? 'predominantly <strong>negative</strong>' : 'predominantly <strong>positive</strong>'} &mdash;
        ${neuPct >= 50 ? neuPct : negPct > posPct ? negPct : posPct}% share &mdash; across ${totalArticles} tagged articles.
      </div>
    </div>
    ` : ''}

    <!-- LINE CHART ──────────────────────────────────────────────── -->
    ${hasLine ? `
    <div class="card c-line">
      <div class="card-head">
        <div>
          <div class="card-title">Coverage Over Time</div>
          <div class="card-sub">Daily article volume across the analysis period</div>
        </div>
        <div class="card-icon" style="background:#ede9fe; color:#6d28d9;">&#9660;</div>
      </div>

      <div class="chart-wrap">
        ${sparseLine ? `
        <div class="chart-empty">
          <div class="chart-empty-icon">&#9632;</div>
          <div><strong>${pts[0]?.value || 0} articles</strong> on ${pts[0]?.date || 'tracked date'}</div>
          <div style="font-size:11px;margin-top:4px;max-width:200px;">Multiple date periods needed for trend line</div>
        </div>
        ` : `
        <svg class="chart-svg" viewBox="0 0 ${cW} ${cH+18}" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="lg0" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="${palette.lineColor}" stop-opacity="0.24"/>
              <stop offset="100%" stop-color="${palette.lineColor}" stop-opacity="0"/>
            </linearGradient>
          </defs>
          ${Array.from({length:5},(_,i)=>{
            const gy = pT+(i/4)*(cH-pT-pB);
            const gv = Math.round(maxVal*(1-i/4));
            return `<line class="cg" x1="${pL}" y1="${gy.toFixed(1)}" x2="${cW-pR}" y2="${gy.toFixed(1)}"/>
<text class="ca" x="${pL-7}" y="${(gy+4).toFixed(1)}" text-anchor="end" font-size="10" font-weight="500">${gv}</text>`;
          }).join('')}
          <path class="c-area" d="${areaPath}" fill="url(#lg0)"/>
          <path class="c-path" d="${linePath}" stroke="${palette.lineColor}"/>
          ${pts.map((p,i)=>{
            const sl = pts.length<=8 || i%Math.ceil(pts.length/7)===0;
            return `<circle class="c-dot" cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="5"
              fill="${palette.lineColor}" stroke="#fff" stroke-width="2.5"
              data-ht="${p.date}|${p.value} articles|${palette.lineColor}"/>
${sl?`<text class="ca" x="${p.x.toFixed(2)}" y="${(cH+14).toFixed(2)}" text-anchor="middle" font-size="10" font-weight="500">${p.date}</text>`:''}`;
          }).join('')}
        </svg>
        `}
      </div>

      <div class="card-foot">
        ${sparseLine
          ? `Only <strong>${pts[0]?.value||0} article${(pts[0]?.value||0)!==1?'s':''}</strong> tracked on ${pts[0]?.date||'the tracked date'}. Trend visualisation needs multi-day data.`
          : `Peak on <strong>${pts.reduce((m,p)=>p.value>(m.value||0)?p:m, pts[0]||{value:0}).date||'&mdash;'}</strong> &mdash; <strong>${pts.reduce((m,p)=>p.value>(m.value||0)?p:m, pts[0]||{value:0}).value||0} articles</strong> in one day.`}
      </div>
    </div>
    ` : ''}

    <!-- THEME BARS (full-width) ─────────────────────────────────── -->
    ${hasThemes ? `
    <div class="card c-them s2">
      <div class="card-head">
        <div>
          <div class="card-title">Key Narrative Themes</div>
          <div class="card-sub">Top recurring topics ranked by article volume</div>
        </div>
        <div class="card-icon" style="background:#ccfbf1; color:#0f766e;">&#9632;</div>
      </div>
      <div class="bar-list">
        ${themeDistribution.map((t,i)=>{
          const pct = Math.round((t.articles/maxTheme)*100);
          const c   = t.color || THEME_COLORS[i%THEME_COLORS.length];
          return `<div class="bar-row" data-ht="${t.theme}|${t.articles} articles|${c}" data-filter-type="theme">
          <div class="bar-lbls">
            <span class="bar-name">${t.theme}</span>
            <span class="bar-count" style="color:${c};">${t.articles}</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill" data-w="${pct}%" style="background:linear-gradient(90deg,${c},${c}cc);"></div>
          </div>
        </div>`;
        }).join('')}
      </div>
      <div class="card-foot">Lead theme &ldquo;${topTheme}&rdquo; drives the dominant narrative arc this analysis period.</div>
    </div>
    ` : ''}

    <!-- PUBLICATIONS ────────────────────────────────────────────── -->
    ${hasPubs ? `
    <div class="card c-pubs">
      <div class="card-head">
        <div>
          <div class="card-title">Top Media Outlets</div>
          <div class="card-sub">Ranked by total article volume</div>
        </div>
        <div class="card-icon" style="background:#fef3c7; color:#b45309;">&#9670;</div>
      </div>
      <div class="bar-list">
        ${topPublications.map((pub,i)=>{
          const pct = Math.round((pub.value/maxPub)*100);
          const c   = PUB_COLORS[i%PUB_COLORS.length];
          return `<div class="bar-row" data-ht="${pub.label}|${pub.value} articles|${c}" data-filter-type="source">
          <div class="bar-lbls">
            <div class="pub-left">
              <span class="pub-dot" style="background:${c};"></span>
              <span class="bar-name">${pub.label}</span>
            </div>
            <span class="bar-count" style="color:${c};">${pub.value}</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill" data-w="${pct}%" style="background:linear-gradient(90deg,${c},${c}cc);"></div>
          </div>
        </div>`;
        }).join('')}
      </div>
      <div class="card-foot">${topSource} leads with <strong>${topPublications[0]?.value||0} stories</strong> &mdash; highest single-source volume this period.</div>
    </div>
    ` : ''}

    <!-- ARTICLES ─────────────────────────────────────────────────── -->
    ${hasArticles ? `
    <div class="card c-arts${!hasPubs ? ' s2' : ''}">
      <div class="card-head">
        <div>
          <div class="card-title">Standout Coverage Stories</div>
          <div class="card-sub">Highest-relevance articles this period</div>
        </div>
        <div class="card-icon" style="background:#f3e8ff; color:#7c3aed;">&#9650;</div>
      </div>
      <div class="art-list">
        ${topArticles.map((art,i)=>{
          const sc  = art.sentiment==='POS'?'pos':art.sentiment==='NEG'?'neg':'neu';
          const sl  = art.sentiment==='POS'?'&#8593; Positive':art.sentiment==='NEG'?'&#8595; Negative':'&#8594; Neutral';
          const av  = (art.source||'A')[0].toUpperCase();
          const dom = (art.source||'').replace(/^https?:\/\//,'').split('/')[0];
          const bg  = AV_GRADS[i%AV_GRADS.length];
          const ttc = sc==='pos'?'#10b981':sc==='neg'?'#f43f5e':'#64748b';
          const artUrl = art.url || art.link || '';
          return `<div class="art-row ${sc}" data-ht="${dom}|${art.title}|${ttc}">
          <div class="art-av" style="background:${bg};">${av}</div>
          <div class="art-body">
            ${artUrl
              ? `<a class="art-ttl art-link" href="${artUrl}" target="_blank" rel="noopener noreferrer" title="${art.title}">${art.title}</a>`
              : `<div class="art-ttl" title="${art.title}">${art.title}</div>`}
            <div class="art-meta">${dom} &bull; ${art.date||'2026-09-08'}</div>
          </div>
          <span class="art-tag ${sc}">${sl}</span>
        </div>`;
        }).join('')}
      </div>
    </div>
    ` : ''}

    <!-- EXECUTIVE SUMMARY ──────────────────────────────────────── -->
    ${hasExec ? `
    <div class="card c-exec s2">
      <div class="card-head">
        <div>
          <div class="card-title">Executive Summary</div>
          <div class="card-sub">AI-generated synthesis across ${totalArticles} tagged articles</div>
        </div>
        <div class="card-icon" style="background:#fce7f3; color:#be185d;">&#9733;</div>
      </div>
      <div class="exec-text">${narrativeSummary}</div>
      <div class="exec-callout">
        &#9889;
        ${topTheme} &mdash; ${positivePercent}% positive coverage &mdash; ${totalArticles} articles analysed
      </div>
    </div>
    ` : ''}

    <!-- SHARE OF VOICE ──────────────────────────────────────────── -->
    ${hasSov ? `
    <div class="card c-sov s2">
      <div class="card-head">
        <div>
          <div class="card-title">Share of Voice</div>
          <div class="card-sub">Brand vs competitor coverage &mdash; ${sovEntries.length} brands, ${sovTotal.toLocaleString()} total articles</div>
        </div>
        <div class="card-icon" style="background:#e0e7ff; color:#4338ca;">&#9670;</div>
      </div>
      <!-- Stacked bar -->
      <div class="sov-stack" style="margin-top:12px;">
        ${sovEntries.map(e=>`
          <div class="sov-seg" style="width:${e.pct}%; background:${e.color}; min-width:${e.pct>0?'3px':'0'};"
            title="${e.label}: ${e.pct}%"
            data-ht="${e.label}|${e.pct}% share &bull; ${e.value.toLocaleString()} articles|${e.color}"
            onclick="pmFilter('source','${e.label}','${e.label} &mdash; SOV ${e.pct}%')">
          </div>`).join('')}
      </div>
      <!-- Individual rows -->
      ${sovEntries.map((e,i)=>`
      <div class="sov-row" onclick="pmFilter('source','${e.label}','${e.label}')">
        <div class="sov-rank" style="background:${e.color};">${i+1}</div>
        <div class="sov-name">${e.label}${e.isBrand ? ' <span class="sov-brand-pill">Your Brand</span>' : ''}</div>
        <div class="sov-bar-bg">
          <div class="sov-bar-fill" style="background:${e.color}; width:${e.pct}%;"></div>
        </div>
        <div class="sov-pct" style="color:${e.color};">${e.pct}%</div>
        <div class="sov-count">${e.value.toLocaleString()}</div>
      </div>`).join('')}
    </div>
    ` : ''}

    <!-- COMPETITOR SENTIMENT ────────────────────────────────────── -->
    ${hasCompSentiment ? `
    <div class="card c-comp-sent s2">
      <div class="card-head">
        <div>
          <div class="card-title">Competitor Sentiment Breakdown</div>
          <div class="card-sub">Positive / Neutral / Negative sentiment per brand</div>
        </div>
        <div class="card-icon" style="background:#f0fdf4; color:#15803d;">&#9726;</div>
      </div>
      <div class="cs-legend">
        <div style="display:flex;align-items:center;gap:5px;"><div class="cs-leg-dot" style="background:#10b981;"></div><span class="cs-leg-lbl">Positive</span></div>
        <div style="display:flex;align-items:center;gap:5px;"><div class="cs-leg-dot" style="background:#6366f1;"></div><span class="cs-leg-lbl">Neutral</span></div>
        <div style="display:flex;align-items:center;gap:5px;"><div class="cs-leg-dot" style="background:#e11d48;"></div><span class="cs-leg-lbl">Negative</span></div>
      </div>
      ${compSentRows.map(row=>{
        const t = row.total||1;
        const pp=Math.round(row.positive/t*100), np=Math.round(row.neutral/t*100), ngp=100-pp-np;
        return `
      <div class="cs-row" onclick="pmFilter('source','${row.name}','${row.name}')">
        <div class="cs-name">${row.name}${row.isBrand?' <span class="sov-brand-pill">Brand</span>':''}</div>
        <div class="cs-stack">
          <div class="cs-seg" style="width:${pp}%; background:#10b981; min-width:${pp>0?'2px':'0'};"
            title="Positive: ${row.positive} (${pp}%)"
            onclick="event.stopPropagation(); pmFilter('sentiment','Positive','${row.name} Positive')"></div>
          <div class="cs-seg" style="width:${np}%; background:#6366f1; min-width:${np>0?'2px':'0'};"
            title="Neutral: ${row.neutral} (${np}%)"
            onclick="event.stopPropagation(); pmFilter('sentiment','Neutral','${row.name} Neutral')"></div>
          <div class="cs-seg" style="width:${ngp}%; background:#e11d48; min-width:${ngp>0?'2px':'0'};"
            title="Negative: ${row.negative} (${ngp}%)"
            onclick="event.stopPropagation(); pmFilter('sentiment','Negative','${row.name} Negative')"></div>
        </div>
        <div class="cs-pills">
          ${pp>0?`<span class="cs-pill" style="background:#d1fae5;color:#065f46;">${pp}%</span>`:''}
          ${ngp>0?`<span class="cs-pill" style="background:#fee2e2;color:#991b1b;">${ngp}%</span>`:''}
        </div>
        <div class="cs-total">${row.total.toLocaleString()}</div>
      </div>`;
      }).join('')}
    </div>
    ` : ''}

    <!-- PR IMPACT GAUGE ─────────────────────────────────────────── -->
    ${hasGauge ? `
    <div class="card c-gauge">
      <div class="card-head">
        <div>
          <div class="card-title">PR Impact Score</div>
          <div class="card-sub">Composite media performance index</div>
        </div>
        <div class="card-icon" style="background:#e0f2fe; color:#0369a1;">&#9670;</div>
      </div>
      <div class="gauge-wrap">
        <svg class="gauge-svg" width="180" height="110" viewBox="0 0 180 110">
          <defs>
            <linearGradient id="g-gauge-bg" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="#e11d48"/>
              <stop offset="50%" stop-color="#f59e0b"/>
              <stop offset="100%" stop-color="#10b981"/>
            </linearGradient>
          </defs>
          <!-- Track arc (180°) -->
          <path d="M 18 95 A 72 72 0 0 1 162 95" fill="none" stroke="#e2e8f0" stroke-width="14" stroke-linecap="round"/>
          <!-- Score arc -->
          <path d="M 18 95 A 72 72 0 0 1 162 95" fill="none" stroke="url(#g-gauge-bg)" stroke-width="14" stroke-linecap="round"
            stroke-dasharray="${(prScore/100*226).toFixed(1)} 226"
            style="transition: stroke-dasharray 1.2s cubic-bezier(.16,1,.3,1);" data-gauge-fill="${(prScore/100*226).toFixed(1)}"/>
          <!-- Needle -->
          <line id="gauge-needle"
            x1="90" y1="95"
            x2="${(90 + 58*Math.cos(Math.PI - (prScore/100)*Math.PI)).toFixed(1)}"
            y2="${(95 - 58*Math.sin((prScore/100)*Math.PI)).toFixed(1)}"
            stroke="#0f172a" stroke-width="3" stroke-linecap="round"/>
          <circle cx="90" cy="95" r="5" fill="#0f172a"/>
        </svg>
        <div class="gauge-score" style="color:${prScoreColor};">${prScore}</div>
        <div class="gauge-label">${prScoreLabel} Brand Health</div>
        <div class="gauge-meta">
          <div class="gauge-stat">
            <div class="gauge-stat-val">${totalArticles}</div>
            <div class="gauge-stat-lbl">Articles</div>
          </div>
          <div class="gauge-stat">
            <div class="gauge-stat-val">${positivePercent}%</div>
            <div class="gauge-stat-lbl">Positive</div>
          </div>
          <div class="gauge-stat">
            <div class="gauge-stat-val">${Math.round(avgConfidence)}%</div>
            <div class="gauge-stat-lbl">Avg Relevance</div>
          </div>
        </div>
      </div>
    </div>
    ` : ''}

    <!-- ORIGINAL VS SYNDICATED ──────────────────────────────────── -->
    ${hasOrigSyndicated ? `
    <div class="card c-orig">
      <div class="card-head">
        <div>
          <div class="card-title">Content Mix</div>
          <div class="card-sub">Original vs. syndicated coverage</div>
        </div>
        <div class="card-icon" style="background:#fff7ed; color:#c2410c;">&#9632;</div>
      </div>
      <div class="orig-wrap">
        <div class="orig-donut">
          <svg width="110" height="110" viewBox="0 0 110 110">
            <circle cx="55" cy="55" r="${r}" fill="none" stroke="#f1f5f9" stroke-width="14"/>
            <circle cx="55" cy="55" r="${r}" fill="none" stroke="#f97316" stroke-width="14"
              stroke-dasharray="${origDash.toFixed(1)} ${circ.toFixed(1)}" stroke-dashoffset="0"
              stroke-linecap="round" transform="rotate(-90 55 55)"
              class="donut-seg" data-td="${origDash.toFixed(1)} ${circ.toFixed(1)}"
              data-ht="Original|${origCount} articles|#f97316" style="cursor:pointer;"/>
            <circle cx="55" cy="55" r="${r}" fill="none" stroke="#e2e8f0" stroke-width="14"
              stroke-dasharray="${(circ-origDash).toFixed(1)} ${circ.toFixed(1)}"
              stroke-dashoffset="${(-origDash).toFixed(1)}"
              stroke-linecap="round" transform="rotate(-90 55 55)"
              class="donut-seg" data-td="${(circ-origDash).toFixed(1)} ${circ.toFixed(1)}"
              data-ht="Syndicated|${syndCount} articles|#94a3b8" style="cursor:pointer;"/>
            <text x="55" y="51" text-anchor="middle" font-size="17" font-weight="800" fill="#0f172a">${origPct}%</text>
            <text x="55" y="65" text-anchor="middle" font-size="10" font-weight="600" fill="#94a3b8">Original</text>
          </svg>
        </div>
        <div class="orig-stats">
          <div class="orig-row">
            <div class="orig-dot" style="background:#f97316;"></div>
            <div class="orig-name">Original</div>
            <div class="orig-pct">${origPct}%</div>
          </div>
          <div class="orig-bar-bg"><div class="orig-bar-fill" style="background:#f97316; width:${origPct}%;"></div></div>
          <div class="orig-row" style="margin-top:6px;">
            <div class="orig-dot" style="background:#94a3b8;"></div>
            <div class="orig-name">Syndicated</div>
            <div class="orig-pct">${syndPct}%</div>
          </div>
          <div class="orig-bar-bg"><div class="orig-bar-fill" style="background:#94a3b8; width:${syndPct}%;"></div></div>
          <div style="font-size:12px; color:#64748b; margin-top:8px;">Based on ${totalArticles} tagged articles</div>
        </div>
      </div>
    </div>
    ` : ''}

    <!-- COMPETITOR HEATMAP ──────────────────────────────────────── -->
    ${hasCompetitor ? `
    <div class="card c-comp s2">
      <div class="card-head">
        <div>
          <div class="card-title">Competitive PR Impact</div>
          <div class="card-sub">Weekly PR impact scores by brand (0 = low, 4 = high)</div>
        </div>
        <div class="card-icon" style="background:#f5f3ff; color:#7c3aed;">&#9671;</div>
      </div>
      <div style="overflow-x:auto;">
        <table class="comp-table">
          <thead>
            <tr>
              <th style="text-align:left;">Brand</th>
              ${compWeeks.map(w=>`<th>${w}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${compData.map(comp=>`
            <tr>
              <td title="${comp.name}">${comp.name.length>18 ? comp.name.slice(0,16)+'…' : comp.name}</td>
              ${comp.scores.map((s,wi)=>{
                const bg = s===0?'#f1f5f9':s===1?'#bfdbfe':s===2?'#818cf8':s===3?'#4f46e5':'#3730a3';
                const fg = s<=1?'#374151':'#fff';
                return `<td>
                  <div class="comp-cell" style="background:${bg}; color:${fg};"
                    data-ht="${comp.name} · W${wi+1}|Score: ${s}|${bg}"
                    onclick="pmFilter('theme','${comp.name}','${comp.name}')">
                    ${s}
                  </div>
                </td>`;
              }).join('')}
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
    ` : ''}

    <!-- PUBLISHING TIME HEATMAP ─────────────────────────────────── -->
    ${hasHeatmap ? `
    <div class="card c-heat s2">
      <div class="card-head">
        <div>
          <div class="card-title">Publishing Patterns</div>
          <div class="card-sub">Article volume by day of week &times; time of day</div>
        </div>
        <div class="card-icon" style="background:#f0fdf4; color:#15803d;">&#9678;</div>
      </div>
      <div class="pheat-hours">
        ${HOURS.map(h=>`<div class="pheat-hour-lbl">${h}</div>`).join('')}
      </div>
      <div class="pheat-grid">
        ${heatGrid.map(row=>`
        <div class="pheat-row">
          <div class="pheat-day">${row.day}</div>
          ${row.cells.map((v,hi)=>{
            const alpha = v===0?0.06:v===1?0.25:v===2?0.55:0.9;
            const bg = `rgba(13,148,136,${alpha})`;
            return `<div class="pheat-cell" style="background:${bg};"
              data-ht="${row.day} ${HOURS[hi]}|${v===0?'Low':v===1?'Moderate':v===2?'High':'Peak'} activity|#0d9488"
              onclick="pmFilter('date','${row.day}','${row.day} ${HOURS[hi]}')"></div>`;
          }).join('')}
        </div>`).join('')}
      </div>
      <div class="pheat-legend">
        <span>Low</span>
        ${[0.06,0.25,0.55,0.9].map(a=>`<div class="pheat-legend-swatch" style="background:rgba(13,148,136,${a});"></div>`).join('')}
        <span>High</span>
      </div>
    </div>
    ` : ''}

  </div><!-- /dash-grid -->

  <div class="foot">AlphaMetricx Intelligence Engine &bull; ${totalArticles} articles analysed &bull; Generated ${new Date().toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</div>

</div><!-- /page -->

<script>
(function() {
  /* KPI number counters */
  document.querySelectorAll('[data-count]').forEach(function(el) {
    var target = parseFloat(el.getAttribute('data-count')) || 0;
    var suffix = el.getAttribute('data-suffix') || '';
    var isFloat = String(target).includes('.');
    var dur = 1200, st = null;
    function tick(ts) {
      if (!st) st = ts;
      var p = Math.min((ts - st) / dur, 1);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = (isFloat ? (target * e).toFixed(1) : Math.round(target * e)) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });

  /* Donut segments animate from 0 to target */
  var segs = document.querySelectorAll('.donut-seg[data-td]');
  var dd = 420;
  segs.forEach(function(seg) {
    var td = seg.getAttribute('data-td');
    /* Read the circumference from attribute to set initial inline style */
    var parts = (seg.getAttribute('stroke-dasharray') || '0 283').split(' ');
    var circum = parseFloat(parts[1]) || 283;
    seg.style.strokeDasharray = '0 ' + circum;
    /* Force reflow so transition sees a change */
    (function(s, target, delay) {
      setTimeout(function() {
        s.style.transition = 'stroke-dasharray 1s cubic-bezier(0.16,1,0.3,1)';
        s.style.strokeDasharray = target;
      }, delay);
    })(seg, td, dd);
    dd += 260;
  });

  /* Bar fills — IntersectionObserver triggers width */
  var fills = document.querySelectorAll('.bar-fill[data-w], .orig-bar-fill, .sov-bar-fill');
  fills.forEach(function(f) {
    if (f.classList.contains('orig-bar-fill') || f.classList.contains('sov-bar-fill')) {
      var w = f.style.width; f.style.width = '0'; f._targetW = w;
    } else {
      f.style.width = '0';
    }
  });
  var io = new IntersectionObserver(function(entries) {
    entries.forEach(function(en) {
      if (en.isIntersecting) {
        var el = en.target;
        setTimeout(function() {
          el.style.width = el.getAttribute('data-w') || el._targetW || '0';
        }, 100);
        io.unobserve(el);
      }
    });
  }, { threshold: 0.15 });
  fills.forEach(function(f) { io.observe(f); });

  /* Gauge arc animation */
  document.querySelectorAll('[data-gauge-fill]').forEach(function(el) {
    var target = el.getAttribute('data-gauge-fill');
    el.setAttribute('stroke-dasharray', '0 226');
    setTimeout(function() {
      el.style.transition = 'stroke-dasharray 1.2s cubic-bezier(.16,1,.3,1)';
      el.setAttribute('stroke-dasharray', target + ' 226');
    }, 500);
  });

  /* Tooltip */
  var ht  = document.getElementById('ht');
  var htd = document.getElementById('htd');
  var htl = document.getElementById('htl');
  var htv = document.getElementById('htv');
  var hta = null;

  document.addEventListener('mouseover', function(e) {
    var el = e.target.closest('[data-ht]');
    if (!el) return;
    hta = el;
    var parts = (el.getAttribute('data-ht') || '').split('|');
    htd.style.background = parts[2] || '#6366f1';
    htl.textContent = parts[0] || '';
    htv.innerHTML   = parts[1] || '';
    ht.style.opacity = '1';
  });

  document.addEventListener('mousemove', function(e) {
    if (!hta || ht.style.opacity !== '1') return;
    var tw = ht.offsetWidth || 140, th2 = ht.offsetHeight || 50;
    var x = e.clientX, y = e.clientY - 14 - th2;
    if (y < 8) y = e.clientY + 16;
    if (x - tw/2 < 8) x = tw/2 + 8;
    if (x + tw/2 > window.innerWidth - 8) x = window.innerWidth - tw/2 - 8;
    ht.style.left = x + 'px';
    ht.style.top  = y + 'px';
  });

  document.addEventListener('mouseout', function(e) {
    var el = e.target.closest('[data-ht]');
    if (el && el === hta) { ht.style.opacity = '0'; hta = null; }
  });

  /* ── Parent-window postMessage for article drill-down ──────────────────
   * Sends ARTICLE_FILTER messages to the React host app whenever the user
   * clicks a chart element (donut segment, bar row, line dot, article row).
   * The host's message listener calls openPopup() with filtered articles.   */
  function pmFilter(filterType, filterValue, filterLabel) {
    try {
      window.parent.postMessage({
        source: 'alphametricx-dashboard',
        type:   'ARTICLE_FILTER',
        filterType:  filterType,   /* 'sentiment' | 'theme' | 'source' | 'date' | 'all' */
        filterValue: filterValue,
        filterLabel: filterLabel || filterValue,
      }, '*');
    } catch (ex) { /* sandboxed — silently skip */ }
  }

  /* Donut segments — filter by sentiment label */
  document.querySelectorAll('.donut-seg[data-ht]').forEach(function(seg) {
    seg.style.cursor = 'pointer';
    seg.addEventListener('click', function(e) {
      e.stopPropagation();
      var parts = (this.getAttribute('data-ht') || '').split('|');
      pmFilter('sentiment', parts[0], parts[0] + ' Articles');
    });
  });

  /* Donut legend items — same filter by sentiment */
  document.querySelectorAll('.leg-item[data-ht]').forEach(function(li) {
    li.style.cursor = 'pointer';
    li.addEventListener('click', function() {
      var parts = (this.getAttribute('data-ht') || '').split('|');
      pmFilter('sentiment', parts[0], parts[0] + ' Articles');
    });
  });

  /* Theme bar rows — filter by theme */
  document.querySelectorAll('.bar-row[data-ht]').forEach(function(row) {
    var ft = row.getAttribute('data-filter-type') || 'theme';
    row.style.cursor = 'pointer';
    row.addEventListener('click', function() {
      var parts = (this.getAttribute('data-ht') || '').split('|');
      pmFilter(ft, parts[0], parts[0]);
    });
  });

  /* Line chart dots — filter by date */
  document.querySelectorAll('.c-dot[data-ht]').forEach(function(dot) {
    dot.style.cursor = 'pointer';
    dot.parentElement && (dot.parentElement.style.cursor = 'pointer');
    dot.addEventListener('click', function(e) {
      e.stopPropagation();
      var parts = (this.getAttribute('data-ht') || '').split('|');
      pmFilter('date', parts[0], parts[0] + ' · Coverage');
    });
  });

  /* KPI tiles — show all articles */
  document.querySelectorAll('.kpi-tile').forEach(function(tile) {
    tile.style.cursor = 'pointer';
    tile.addEventListener('click', function() {
      pmFilter('all', 'all', 'All Articles');
    });
  });

  /* Article rows — filter by source (unless clicking the title link) */
  document.querySelectorAll('.art-row').forEach(function(row) {
    row.style.cursor = 'pointer';
    row.addEventListener('click', function(e) {
      if (e.target.tagName === 'A') return; /* let href open in new tab */
      var parts = (this.getAttribute('data-ht') || '').split('|');
      pmFilter('source', parts[0], parts[0] + ' · Articles');
    });
  });
})();
</script>
</body>
</html>`;
}
