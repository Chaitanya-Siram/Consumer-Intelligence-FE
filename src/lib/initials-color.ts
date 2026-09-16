/**
 * Single source of truth for a project's initials-tile background colour.
 * Deterministically hashes the seed into a palette so the same brand keeps the
 * same colour everywhere (projects grid, dashboard cover, nav rail). All
 * palette colours are dark/saturated enough for white initials on top.
 *
 * Seed with a stable per-project key (the monogram) at every call site.
 */
const PALETTE = [
  "#1c1c1c",
  "#4f46e5",
  "#0e7490",
  "#b45309",
  "#be123c",
  "#15803d",
  "#7c3aed",
  "#0f766e",
  "#9333ea",
  "#c2410c",
]

export function initialsColor(seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0
  return PALETTE[Math.abs(h) % PALETTE.length]
}
