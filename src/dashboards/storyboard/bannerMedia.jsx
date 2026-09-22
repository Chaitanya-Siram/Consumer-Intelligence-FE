/**
 * Dynamic banner photography for the storyboard dashboards.
 *
 * Every tab banner used to be a flat gradient unless the payload carried
 * `banner.image`. This module fills that slot from the data instead:
 *
 *   1. `banner.image` from the backend payload, when present, always wins.
 *   2. Otherwise the brand's own website/social hero (see brand_hero.py on the
 *      backend — its own homepage image, or one from an account linked there),
 *      fetched once per brand and reused for every tab banner on the page.
 *   3. Otherwise a Pexels photo is searched for, brand and tab title first, so
 *      a car-care brand's "Loyalty Index" tab and a skincare brand's get
 *      different, relevant imagery. Results are cached per query.
 *   4. If Pexels is unavailable or returns nothing, a curated Unsplash photo is
 *      picked deterministically from the query, so the banner is never flat.
 *
 * The tint layer each banner already draws over the image keeps the text
 * legible. Screens pass `{ brand, category }` to StoryboardShell, which
 * provides it through BannerContext; banner blocks render <BannerMedia />.
 */
import { createContext, useContext, useEffect, useReducer, useState } from "react";

import { resolvePexelsImageUrls } from "../../api/pexels.js";
import BrandLogo from "./BrandLogo.jsx";
import { brandLogoUrl, LOGOS_REGISTERED_EVENT, sessionBrands } from "./chartAxisIcons.js";
import "./bannerBrands.css";

export const BannerContext = createContext({});

// Known-good Unsplash photos (the Tier-1 gallery already loads these IDs).
const CURATED = [
  "1557804506-669a67965ba0", "1460925895917-afdab827c52f", "1451187580459-43490279c0fa",
  "1551288049-bebda4e38f71", "1519389950473-47ba0277781c", "1553877522-43269d4ea984",
  "1504711434969-e33886168f5c", "1521791136064-7986c2920216", "1529156069898-49953e39b3ac",
].map((id) => `https://images.unsplash.com/photo-${id}?w=1600&h=600&fit=crop&auto=format`);

const hash = (s) => {
  let h = 2166136261;
  for (const ch of String(s)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return Math.abs(h >>> 0);
};

const mem = new Map();
const SS_PREFIX = "sb_banner:";
const ssGet = (k) => { try { return sessionStorage.getItem(SS_PREFIX + k); } catch { return null; } };
const ssSet = (k, v) => { try { sessionStorage.setItem(SS_PREFIX + k, v); } catch { /* ignore */ } };

// Strip words that make image search worse (index, analysis, tab labels).
const NOISE = /\b(index|analysis|analytics|intelligence|insights?|dashboard|overview|tab|study|scan|tier|lens|score|share|voice|drivers?|metrics?|report|q[1-4]|20\d\d|&|and|the|of|for|vs|versus|by|in)\b/gi;
const clean = (s) => String(s || "").replace(/[^\w\s'-]/g, " ").replace(NOISE, " ").replace(/\s+/g, " ").trim();

/** A banner's tab title (eyebrow) plus its LLM headline, combined into one
 * topic string so the image/video search reflects what the banner actually
 * says instead of only its section label. */
export function bannerTopic(banner = {}) {
  return [banner.eyebrow, banner.headline].filter(Boolean).join(" ");
}

/** Candidate search strings, most specific first. Brand + tab title leads: a
 * banner search that never says the brand's name isn't "Brand and Title
 * related", whatever else it matches. */
export function bannerQueries({ category, brand, topic }) {
  const c = clean(category), t = clean(topic), b = clean(brand);
  const out = [];
  // A brand name that's also an ordinary word ("Armor All") reliably pulls the
  // word's literal meaning (knights, military vehicles) unless the category is
  // right there in the same query — brand + topic alone isn't enough.
  if (b && c && t) out.push(`${b} ${c} ${t}`);
  if (b && t) out.push(`${b} ${t}`);
  if (c && t) out.push(`${c} ${t}`);
  if (b) out.push(b);
  if (c) out.push(c);
  if (t) out.push(t);
  return [...new Set(out.map((q) => q.toLowerCase()))].filter((q) => q.length > 2);
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const brandHeroMem = new Map(); // brand -> image url, or null once tried and nothing usable
const BRAND_HERO_SS_PREFIX = "sb_brand_hero:";

/** The brand's own website/social hero image (backend-resolved — a browser
 * can't fetch an arbitrary brand's homepage itself, CORS), fetched and cached
 * once per brand name. Only an image is usable here; a video candidate is left
 * to the per-lens Hero cover, which has a slot for one. Never throws — a
 * network hiccup or "nothing found" both just fall through to Pexels. */
async function fetchBrandHero(brand) {
  if (!brand) return null;
  if (brandHeroMem.has(brand)) return brandHeroMem.get(brand);
  try {
    const cached = sessionStorage.getItem(BRAND_HERO_SS_PREFIX + brand);
    if (cached !== null) {
      const url = cached || null;
      brandHeroMem.set(brand, url);
      return url;
    }
  } catch { /* ignore */ }
  let url = null;
  try {
    const res = await fetch(`${API_BASE}/consumer-intelligence/brand-hero?brand=${encodeURIComponent(brand)}`);
    if (res.ok) {
      const data = await res.json();
      if (data?.type === "image" && data.url) url = data.url;
    }
  } catch { /* offline / blocked — Pexels still covers this banner */ }
  brandHeroMem.set(brand, url);
  try { sessionStorage.setItem(BRAND_HERO_SS_PREFIX + brand, url || ""); } catch { /* ignore */ }
  return url;
}

async function resolve(queries, seed) {
  const key = queries.join("|") || `seed:${seed}`;
  if (mem.has(key)) return mem.get(key);
  const cached = ssGet(key);
  if (cached) { mem.set(key, cached); return cached; }

  let url = null;
  for (const q of queries) {
    // eslint-disable-next-line no-await-in-loop -- sequential fallback by design
    const urls = await resolvePexelsImageUrls(q, 8);
    if (urls.length) { url = urls[hash(seed) % urls.length]; break; }
  }
  if (!url) url = CURATED[hash(seed) % CURATED.length];
  mem.set(key, url);
  ssSet(key, url);
  return url;
}

/** Resolves a banner photo URL. `image` (payload) short-circuits everything. */
export function useBannerImage({ image, topic }) {
  const ctx = useContext(BannerContext);
  const [url, setUrl] = useState(image || null);
  useEffect(() => {
    if (image) { setUrl(image); return undefined; }
    let live = true;
    (async () => {
      const brandHero = await fetchBrandHero(ctx.brand);
      if (!live) return;
      if (brandHero) { setUrl(brandHero); return; }
      const queries = bannerQueries({ category: ctx.category, brand: ctx.brand, topic });
      const seed = `${ctx.brand || ""}|${ctx.category || ""}|${topic || ""}`;
      const pexelsUrl = await resolve(queries, seed);
      if (live) setUrl(pexelsUrl);
    })();
    return () => { live = false; };
  }, [image, topic, ctx.brand, ctx.category]);
  return url;
}

// url -> true/false once a real Image() probe has settled it; never re-probed.
const verifiedCache = new Map();

/** `url` once confirmed loadable, else null. For a CSS `background-image` —
 * unlike <img>, it has no error event of its own, so a dead link (a CDN that
 * rotated its asset, a host that blocks hotlinking) shows nothing at all
 * with no way to notice or fall back. This probes with a real Image() first
 * so the caller can render its own gradient/placeholder instead. */
export function useVerifiedImage(url) {
  const [ok, setOk] = useState(() => !!url && verifiedCache.get(url) === true);
  useEffect(() => {
    if (!url) { setOk(false); return undefined; }
    const cached = verifiedCache.get(url);
    if (cached !== undefined) { setOk(cached); return undefined; }
    let live = true;
    const probe = new Image();
    probe.onload = () => { verifiedCache.set(url, true); if (live) setOk(true); };
    probe.onerror = () => { verifiedCache.set(url, false); if (live) setOk(false); };
    probe.src = url;
    return () => { live = false; };
  }, [url]);
  return ok ? url : null;
}

const STOCK_SS_PREFIX = "sb_stock_image:";
const stockImageMem = new Map(); // query -> resolved url, or null once tried and nothing found

/** Real photo for an arbitrary query (DuckDuckGo, then Pexels — see the
 * backend's `brand_media.stock_photo`), for callers with no brand/session
 * context of their own — the workflow builder's lens/sub-lens picker cards,
 * which run before any session exists. Cached per query (in-memory, then
 * sessionStorage) the same way `fetchBrandHero` above is. */
async function fetchStockImage(query) {
  if (!query) return null;
  if (stockImageMem.has(query)) return stockImageMem.get(query);
  try {
    const cached = sessionStorage.getItem(STOCK_SS_PREFIX + query);
    if (cached !== null) {
      const url = cached || null;
      stockImageMem.set(query, url);
      return url;
    }
  } catch { /* ignore */ }
  let url = null;
  try {
    const res = await fetch(`${API_BASE}/consumer-intelligence/stock-image?query=${encodeURIComponent(query)}`);
    if (res.ok) {
      const data = await res.json();
      if (data?.url) url = data.url;
    }
  } catch { /* offline / blocked — the caller's own static fallback still applies */ }
  stockImageMem.set(query, url);
  try { sessionStorage.setItem(STOCK_SS_PREFIX + query, url || ""); } catch { /* ignore */ }
  return url;
}

/** `fallback` (a bundled/static image, so the card is never blank) shows
 * immediately; a resolved DuckDuckGo/Pexels photo replaces it once fetched. */
export function useStockImage(query, fallback) {
  const [url, setUrl] = useState(fallback || null);
  useEffect(() => {
    if (!query) { setUrl(fallback || null); return undefined; }
    let live = true;
    (async () => {
      const resolved = await fetchStockImage(query);
      if (live) setUrl(resolved || fallback || null);
    })();
    return () => { live = false; };
  }, [query, fallback]);
  return url;
}

/**
 * The banner <img>. `className` matches the host banner's CSS ("banner-video"
 * in the BCI-derived sheets, "banner-img" in Trend). On a 404 it falls back to
 * a curated photo so the slot never goes blank.
 */
export default function BannerMedia({ image, topic, className = "banner-video" }) {
  const resolved = useBannerImage({ image, topic });
  const [failed, setFailed] = useState(false);
  const src = failed ? CURATED[hash(topic || "x") % CURATED.length] : resolved;
  if (!src) return null;
  return (
    <>
      <img className={className} src={src} alt="" loading="eager" decoding="async" onError={() => !failed && setFailed(true)} />
      <BannerBrands />
    </>
  );
}

const MAX_RIVAL_LOGOS = 3;

/** The primary brand's logo, followed by "vs" and the competitors' logos when the
 * session compares brands. The banner title itself is drawn by each banner block. */
function BannerBrands() {
  const ctx = useContext(BannerContext);
  const [, redraw] = useReducer((n) => n + 1, 0);
  // The banner can render before the charts payload registers its logos.
  useEffect(() => {
    window.addEventListener(LOGOS_REGISTERED_EVENT, redraw);
    return () => window.removeEventListener(LOGOS_REGISTERED_EVENT, redraw);
  }, []);
  const { brand: sessionBrand, competitors } = sessionBrands();
  const brand = ctx.brand || sessionBrand;
  const brandLogo = brandLogoUrl(brand);
  if (!brand || !brandLogo) return null;
  const rivals = competitors.filter((name) => name !== brand && brandLogoUrl(name)).slice(0, MAX_RIVAL_LOGOS);
  return (
    <div className="banner-brands" aria-label={rivals.length ? `${brand} versus ${rivals.join(", ")}` : brand}>
      <BrandLogo brand={brand} logos={{ [brand]: brandLogo }} size={30} rounded={999} />
      {rivals.length ? <span className="banner-brands-vs">vs</span> : null}
      {rivals.map((name) => (
        <BrandLogo key={name} brand={name} logos={{ [name]: brandLogoUrl(name) }} size={30} rounded={999} />
      ))}
    </div>
  );
}
