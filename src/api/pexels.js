// Pexels API resolver for resolving direct playable HD mp4 video links, HD photo URLs, and CSS color gradients

const PEXELS_KEY =
  import.meta.env.VITE_PEXELS_API_KEY ||
  "UJUBIDzY7FOrNwGwzey6JKlQZuLbT7vy1o2uTT9rAG6y8bXRqWo3M6wX";

const PEXELS_BASE = import.meta.env.DEV
  ? "/api-pexels"
  : "https://api.pexels.com";

const COMMON_COLOR_MAP = {
  "linear gradient": "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #0f172a 100%)",
  "gradient": "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #0f172a 100%)",
  "purple gradient": "linear-gradient(135deg, #581c87 0%, #1e1b4b 100%)",
  "blue gradient": "linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)",
  "dark gradient": "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
  "sunset gradient": "linear-gradient(135deg, #991b1b 0%, #78350f 100%)",
  "ocean gradient": "linear-gradient(135deg, #0e7490 0%, #1e1b4b 100%)",
  "light blue": "linear-gradient(135deg, #0284c7 0%, #0f172a 100%)",
  "blue": "linear-gradient(135deg, #1d4ed8 0%, #0f172a 100%)",
  "dark blue": "linear-gradient(135deg, #1e3a8a 0%, #090d16 100%)",
  "green": "linear-gradient(135deg, #059669 0%, #064e3b 100%)",
  "light green": "linear-gradient(135deg, #10b981 0%, #064e3b 100%)",
  "dark green": "linear-gradient(135deg, #064e3b 0%, #022c22 100%)",
  "red": "linear-gradient(135deg, #dc2626 0%, #450a0a 100%)",
  "dark red": "linear-gradient(135deg, #881337 0%, #450a0a 100%)",
  "purple": "linear-gradient(135deg, #7e22ce 0%, #3b0764 100%)",
  "gold": "linear-gradient(135deg, #d97706 0%, #451a03 100%)",
  "teal": "linear-gradient(135deg, #0d9488 0%, #115e59 100%)",
  "emerald": "linear-gradient(135deg, #059669 0%, #064e3b 100%)",
  "slate": "linear-gradient(135deg, #334155 0%, #0f172a 100%)",
  "dark slate": "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
  "indigo": "linear-gradient(135deg, #4338ca 0%, #1e1b4b 100%)",
  "rose": "linear-gradient(135deg, #e11d48 0%, #4c0519 100%)",
  "cyan": "linear-gradient(135deg, #0891b2 0%, #164e63 100%)",
  "amber": "linear-gradient(135deg, #d97706 0%, #78350f 100%)",
};

const SOLID_TEXT_COLOR_MAP = {
  "light green": "#4ade80",
  "green": "#22c55e",
  "dark green": "#15803d",
  "light blue": "#38bdf8",
  "blue": "#3b82f6",
  "dark blue": "#1e40af",
  "red": "#ef4444",
  "dark red": "#991b1b",
  "yellow": "#facc15",
  "purple": "#c084fc",
  "gold": "#fbbf24",
  "teal": "#2dd4bf",
  "cyan": "#22d3ee",
  "white": "#ffffff",
  "black": "#000000",
  "pink": "#f472b6",
  "orange": "#fb923c",
};

export function isColorRequest(str) {
  if (!str || typeof str !== "string") return false;
  const lower = str.toLowerCase().trim();
  if (
    lower.startsWith("#") ||
    lower.startsWith("rgb") ||
    lower.startsWith("hsl") ||
    lower.startsWith("linear-gradient") ||
    lower.startsWith("radial-gradient") ||
    lower.includes("gradient")
  ) {
    return true;
  }
  return (
    /\b(color|colour|text color|text colour|gradient|light blue|dark blue|blue|green|red|purple|gold|teal|emerald|slate|indigo|rose|cyan|amber|dark red|light green|dark green)\b/i.test(
      lower,
    ) && !/\b(image|photo|picture|video|loop|mp4|car|bird)\b/i.test(lower)
  );
}

export function parseCssColor(str, isText = false) {
  if (!str) return isText ? "#ffffff" : "#1e293b";
  const lower = str.toLowerCase().trim();
  if (
    lower.startsWith("#") ||
    lower.startsWith("rgb") ||
    lower.startsWith("hsl") ||
    (!isText && (lower.startsWith("linear-gradient") || lower.startsWith("radial-gradient")))
  ) {
    return str;
  }

  if (isText) {
    for (const [name, value] of Object.entries(SOLID_TEXT_COLOR_MAP)) {
      if (lower.includes(name)) return value;
    }
  }

  for (const [name, value] of Object.entries(COMMON_COLOR_MAP)) {
    if (lower.includes(name)) return value;
  }

  for (const [name, value] of Object.entries(SOLID_TEXT_COLOR_MAP)) {
    if (lower.includes(name)) return value;
  }

  if (!isText && lower.includes("gradient")) {
    return "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #0f172a 100%)";
  }

  return str;
}

function pickBestMp4(videoFiles = []) {
  if (!Array.isArray(videoFiles) || !videoFiles.length) return null;
  const mp4s = videoFiles
    .filter((f) => f.file_type === "video/mp4" && f.width <= 1920)
    .sort((a, b) => (b.width || 0) - (a.width || 0));
  return mp4s[0]?.link || videoFiles[0]?.link || null;
}

/** Resolves an image query to an array of direct Pexels HD photo URLs */
export async function resolvePexelsImageUrls(queryOrUrl, count = 6) {
  if (!queryOrUrl) return [];
  const str = String(queryOrUrl).trim();

  const cleanTopic =
    str
      .replace(/https?:\/\/\S+/gi, "")
      .replace(/['"’]/g, "")
      .replace(
        /\b(add|change|set|coverage|over|time|card|background|to|image|picture|photo|wallpaper|in|for|the|link|chart|please|want|a|as)\b/gi,
        "",
      )
      .trim() || str;

  try {
    const searchUrl = `${PEXELS_BASE}/v1/search?query=${encodeURIComponent(cleanTopic)}&per_page=${count}&orientation=landscape`;
    const res = await fetch(searchUrl, {
      headers: { Authorization: PEXELS_KEY },
    });
    if (res.ok) {
      const data = await res.json();
      return (data.photos || [])
        .map(
          (p) =>
            p.src?.landscape ||
            p.src?.large2x ||
            p.src?.large ||
            p.src?.original,
        )
        .filter(Boolean);
    }
  } catch (err) {
    console.warn("[Pexels] Failed to search photos by query:", cleanTopic, err);
  }

  return [];
}

/** Resolves any image topic (e.g., "beautiful car", "nature", "city") to a direct Pexels HD photo URL */
export async function resolvePexelsImageUrl(queryOrUrl) {
  if (!queryOrUrl) return null;
  const str = String(queryOrUrl).trim();

  if (
    str.startsWith("http") &&
    !str.includes("pexels.com/download/video") &&
    (str.endsWith(".jpg") ||
      str.endsWith(".jpeg") ||
      str.endsWith(".png") ||
      str.endsWith(".webp") ||
      str.includes("images.pexels.com"))
  ) {
    return str;
  }

  const cleanTopic =
    str
      .replace(/https?:\/\/\S+/gi, "")
      .replace(/['"’]/g, "")
      .replace(
        /\b(add|change|set|coverage|over|time|card|background|to|image|picture|photo|wallpaper|in|for|the|link|chart|please|want|a|as)\b/gi,
        "",
      )
      .trim() || str;

  try {
    const searchUrl = `${PEXELS_BASE}/v1/search?query=${encodeURIComponent(cleanTopic)}&per_page=5&orientation=landscape`;
    const res = await fetch(searchUrl, {
      headers: { Authorization: PEXELS_KEY },
    });
    if (res.ok) {
      const data = await res.json();
      const firstPhoto = data.photos?.[0];
      if (firstPhoto?.src) {
        return (
          firstPhoto.src.landscape ||
          firstPhoto.src.large2x ||
          firstPhoto.src.large ||
          firstPhoto.src.original
        );
      }
    }
  } catch (err) {
    console.warn("[Pexels] Failed to search photo by query:", cleanTopic, err);
  }

  return null;
}

/** Resolves any video topic, Pexels video link, or Video ID to a direct playable MP4 URL */
export async function resolvePexelsVideoUrl(queryOrUrlOrId) {
  if (!queryOrUrlOrId) return null;

  const str = String(queryOrUrlOrId).trim();

  if (
    str.endsWith(".mp4") ||
    str.endsWith(".webm") ||
    str.includes("videos.pexels.com/video-files")
  ) {
    return str;
  }

  const idMatch =
    str.match(/(?:video\/|videos\/|download\/video\/)(\d+)/) ||
    str.match(/^(\d+)$/);
  if (idMatch && idMatch[1]) {
    const videoId = idMatch[1];
    try {
      const res = await fetch(`${PEXELS_BASE}/videos/videos/${videoId}`, {
        headers: { Authorization: PEXELS_KEY },
      });
      if (res.ok) {
        const data = await res.json();
        const directLink = pickBestMp4(data.video_files || []);
        if (directLink) return directLink;
      }
    } catch (err) {
      console.warn("[Pexels] Failed to fetch video by ID:", videoId, err);
    }
  }

  const cleanQuery =
    str
      .replace(/https?:\/\/\S+/gi, "")
      .replace(/['"’]/g, "")
      .replace(
        /\b(add|change|set|coverage|over|time|card|background|to|video|in|loop|here|is|the|link|chart|please|image|wallpaper|want|a|the|as|for)\b/gi,
        "",
      )
      .trim() || str;

  try {
    const searchUrl = `${PEXELS_BASE}/videos/search?query=${encodeURIComponent(cleanQuery)}&per_page=5&orientation=landscape`;
    const res = await fetch(searchUrl, {
      headers: { Authorization: PEXELS_KEY },
    });
    if (res.ok) {
      const data = await res.json();
      const firstVideo = data.videos?.[0];
      if (firstVideo) {
        const directLink = pickBestMp4(firstVideo.video_files || []);
        if (directLink) return directLink;
      }
    }
  } catch (err) {
    console.warn("[Pexels] Failed to search video by query:", cleanQuery, err);
  }

  return null;
}

/** Universal Pexels Media Resolver for images, videos, and CSS colors */
export async function resolvePexelsMedia(queryOrUrl, preferredType = "auto") {
  if (!queryOrUrl) return { type: null, url: null };

  const str = String(queryOrUrl).trim();

  if (
    preferredType === "color" ||
    preferredType === "gradient" ||
    isColorRequest(str)
  ) {
    return { type: "color", url: parseCssColor(str) };
  }

  const isVideoRequested =
    preferredType === "video" ||
    /\b(video|loop|mp4|webm|motion|clip)\b/i.test(str) ||
    str.includes("pexels.com/download/video");

  const isImageRequested =
    preferredType === "image" ||
    /\b(image|photo|picture|wallpaper|car|bird|nature|sky|city)\b/i.test(str);

  if (isVideoRequested) {
    const videoUrl = await resolvePexelsVideoUrl(str);
    if (videoUrl) return { type: "video", url: videoUrl };
  }

  if (isImageRequested) {
    const imageUrl = await resolvePexelsImageUrl(str);
    if (imageUrl) return { type: "image", url: imageUrl };
  }

  return { type: null, url: null };
}
