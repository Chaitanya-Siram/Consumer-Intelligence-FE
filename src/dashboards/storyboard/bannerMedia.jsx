/**
 * Dynamic banner photography for the storyboard dashboards.
 *
 * Every tab banner used to be a flat gradient unless the payload carried
 * `banner.image`. This module fills that slot from the data instead:
 *
 *   1. `banner.image` from the backend payload, when present, always wins.
 *   2. Otherwise a Pexels photo is searched for from the session's category and
 *      the tab's topic (eyebrow / headline), so a car-care brand's "Loyalty
 *      Index" tab and a skincare brand's get different, relevant imagery.
 *      Results are cached per query in memory and sessionStorage.
 *   3. If Pexels is unavailable or returns nothing, a curated Unsplash photo is
 *      picked deterministically from the query, so the banner is never flat.
 *
 * The tint layer each banner already draws over the image keeps the text
 * legible. Screens pass `{ brand, category }` to StoryboardShell, which
 * provides it through BannerContext; banner blocks render <BannerMedia />.
 */
import { createContext, useContext, useEffect, useState } from "react";

import { resolvePexelsImageUrls } from "../../api/pexels.js";

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

/** Candidate search strings, most specific first. */
export function bannerQueries({ category, brand, topic }) {
  const c = clean(category), t = clean(topic), b = clean(brand);
  const out = [];
  if (c && t) out.push(`${c} ${t}`);
  if (c) out.push(c);
  if (b && t) out.push(`${b} ${t}`);
  if (t) out.push(t);
  if (b) out.push(b);
  return [...new Set(out.map((q) => q.toLowerCase()))].filter((q) => q.length > 2);
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
    const queries = bannerQueries({ category: ctx.category, brand: ctx.brand, topic });
    const seed = `${ctx.brand || ""}|${ctx.category || ""}|${topic || ""}`;
    resolve(queries, seed).then((u) => { if (live) setUrl(u); });
    return () => { live = false; };
  }, [image, topic, ctx.brand, ctx.category]);
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
  return <img className={className} src={src} alt="" loading="eager" decoding="async" onError={() => !failed && setFailed(true)} />;
}
