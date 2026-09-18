// Brand-logo lookup shared by the newer CI storyboards.
//
// Each lens payload is expected to carry its own `meta.logos` map (brand name
// -> URL, resolved by the backend's logos.py). Until a lens ships that, the
// same session usually already has logos in another lens's payload (Brand &
// Competitive, Brand Health). This merges every `meta.logos` in `chartsData`
// with the lens's own map, own entries winning, so <BrandLogo> shows real
// marks wherever any lens has resolved them. Lookup is case-insensitive.

export function mergeLogos(chartsData, own) {
  const merged = {};
  const put = (map) => {
    if (!map || typeof map !== "object") return;
    for (const [brand, url] of Object.entries(map)) {
      if (brand && url) merged[brand.trim().toLowerCase()] = url;
    }
  };
  if (chartsData && typeof chartsData === "object") {
    for (const story of Object.values(chartsData)) put(story?.meta?.logos);
  }
  put(own);

  // BrandLogo reads `logos[brand]` with the display name as written, so hand
  // back a Proxy that normalises the key.
  return new Proxy(merged, {
    get(target, key) {
      if (typeof key !== "string") return undefined;
      return target[key.trim().toLowerCase()];
    },
    has(target, key) {
      return typeof key === "string" && key.trim().toLowerCase() in target;
    },
  });
}
