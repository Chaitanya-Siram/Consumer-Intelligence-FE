/**
 * The real mark for a social/media channel or web domain (Facebook, X, TikTok,
 * cnn.com, ...), with a small colored monogram as the fallback.
 *
 * Brand logos are resolved server-side (backend logos.py) because a brand
 * *name* has to be guessed into a domain first. Platforms and domains need no
 * such guessing — the set of social platforms is fixed and a domain is already
 * a domain — so this resolves them in the browser from the same favicon
 * provider the backend uses first, and degrades to the monogram when a name is
 * neither (TV, Radio, Print) or when the icon fails to load.
 */
import { useState } from "react";

const PLATFORM_DOMAINS = {
  twitter: "x.com",
  x: "x.com",
  "x (twitter)": "x.com",
  "twitter (x)": "x.com",
  "twitter/x": "x.com",
  "x/twitter": "x.com",
  facebook: "facebook.com",
  instagram: "instagram.com",
  threads: "threads.net",
  tiktok: "tiktok.com",
  youtube: "youtube.com",
  linkedin: "linkedin.com",
  reddit: "reddit.com",
  pinterest: "pinterest.com",
  snapchat: "snapchat.com",
  tumblr: "tumblr.com",
  quora: "quora.com",
  // No "medium": it is also a confidence/sentiment band label on several charts.
  twitch: "twitch.tv",
  discord: "discord.com",
  telegram: "telegram.org",
  whatsapp: "whatsapp.com",
  vimeo: "vimeo.com",
  flickr: "flickr.com",
  weibo: "weibo.com",
  "google news": "news.google.com",
  spotify: "spotify.com",
  "apple podcasts": "podcasts.apple.com",
};

const PLATFORM_STYLES = {
  tv: { label: "TV", bg: "#ede9fe", fg: "#7c3aed" },
  radio: { label: "RD", bg: "#fef3c7", fg: "#d97706" },
  print: { label: "PR", bg: "#f1f5f9", fg: "#475569" },
  twitter: { label: "X", bg: "#111827", fg: "#fff" },
  x: { label: "X", bg: "#111827", fg: "#fff" },
  "x (twitter)": { label: "X", bg: "#111827", fg: "#fff" },
  facebook: { label: "FB", bg: "#dbeafe", fg: "#1877f2" },
  instagram: { label: "IG", bg: "#fce7f3", fg: "#db2777" },
  tiktok: { label: "TT", bg: "#111827", fg: "#fff" },
  youtube: { label: "YT", bg: "#fee2e2", fg: "#dc2626" },
  linkedin: { label: "IN", bg: "#dbeafe", fg: "#0a66c2" },
  reddit: { label: "RD", bg: "#ffedd5", fg: "#ea580c" },
  blog: { label: "BL", bg: "#e0e7ff", fg: "#4f46e5" },
  forum: { label: "FR", bg: "#f1f5f9", fg: "#475569" },
  podcast: { label: "PD", bg: "#f3e8ff", fg: "#a855f7" },
  web: { label: "WB", bg: "#e0f2fe", fg: "#0284c7" },
  online: { label: "WB", bg: "#e0f2fe", fg: "#0284c7" },
};

// "cnn.com", "www.nytimes.com", "https://bbc.co.uk/news" -> the bare host.
const DOMAIN_RE = /^(?:https?:\/\/)?(?:www\.)?([a-z0-9-]+(?:\.[a-z0-9-]+)+)(?:[/?#].*)?$/i;

function domainFor(name) {
  const key = String(name || "").trim().toLowerCase();
  if (!key) return null;
  if (PLATFORM_DOMAINS[key]) return PLATFORM_DOMAINS[key];
  const match = key.match(DOMAIN_RE);
  return match ? match[1] : null;
}

/** The favicon URL for a platform or domain name, or null when it has none. */
export function platformLogoUrl(name) {
  const domain = domainFor(name);
  return domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64` : null;
}

function styleFor(name) {
  const key = String(name || "").trim().toLowerCase();
  if (PLATFORM_STYLES[key]) return PLATFORM_STYLES[key];
  const label = key
    .split(/[\s(./]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return { label: label || "?", bg: "var(--bg2, #eee)", fg: "var(--ink3, #666)" };
}

export default function PlatformIcon({ platform, size = 22, rounded = 6, className = "", style }) {
  const [failed, setFailed] = useState(false);
  const src = platformLogoUrl(platform);

  const box = {
    width: size,
    height: size,
    borderRadius: rounded,
    flexShrink: 0,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    verticalAlign: "middle",
    ...style,
  };

  if (src && !failed) {
    return (
      <img
        className={className}
        src={src}
        alt={`${platform} logo`}
        title={platform}
        loading="lazy"
        onError={() => setFailed(true)}
        style={{ ...box, objectFit: "contain", background: "#fff" }}
      />
    );
  }

  const { label, bg, fg } = styleFor(platform);
  return (
    <span
      className={className}
      aria-label={platform}
      title={platform}
      style={{
        ...box,
        background: bg,
        color: fg,
        fontSize: Math.max(8, Math.round(size * 0.36)),
        fontWeight: 800,
        letterSpacing: "-.02em",
      }}
    >
      {label}
    </span>
  );
}
