/**
 * A brand's real logo mark, resolved server-side (see backend logos.py).
 *
 * Falls back to the brand's initials when no logo could be resolved — Popeyes,
 * for instance, has no usable mark from either provider. The fallback also
 * catches a logo that 404s after the payload was built, so a dead URL degrades
 * to initials rather than a broken-image icon.
 */
import { useState } from "react";

export default function BrandLogo({ brand, logos, photoUrl, size = 28, rounded = 8, className = "" }) {
  const [failed, setFailed] = useState(false);
  const src = photoUrl || logos?.[brand];

  const initials = String(brand || "?")
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  const box = {
    width: size,
    height: size,
    borderRadius: rounded,
    flexShrink: 0,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    verticalAlign: "middle",
  };

  if (!src || failed) {
    return (
      <span
        className={className}
        style={{
          ...box,
          background: "var(--bg2, #eee)",
          color: "var(--ink3, #666)",
          fontSize: Math.max(9, Math.round(size * 0.38)),
          fontWeight: 800,
          letterSpacing: "-.02em",
        }}
        aria-label={brand}
        title={brand}
      >
        {initials}
      </span>
    );
  }

  return (
    <img
      className={className}
      src={src}
      alt={photoUrl ? brand : `${brand} logo`}
      title={brand}
      onError={() => setFailed(true)}
      style={{ ...box, objectFit: "contain", background: "#fff" }}
    />
  );
}
